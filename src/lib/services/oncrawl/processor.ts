// src/lib/services/oncrawl/processor.ts - REFACTORED CLEAN VERSION
import { OnCrawlClient } from './client';
import { SyncResult, SyncMode, OnCrawlPage, ProcessedOnCrawlPage, FilterStats } from './types';
import { shouldExcludeUrl } from '@/lib/services/oncrawl/processing/filtering/linkfilter';
import { optimizedSmartSync, optimizedUrlOnlySync } from './processing/database-sync';
import { createSyncHistoryRecord, updateSyncHistoryRecord, getProjectName } from './processing/sync-history';
import { processOnCrawlPage } from './processing/page-normalizer';

/**
 * MAIN ENHANCED SYNC FUNCTION - Now clean and modular with sync modes
 */
export async function syncPagesFromOnCrawlOptimized(
  projectId: string,
  syncMode: SyncMode = SyncMode.FULL,
  onProgress?: (processed: number, total: number) => void
): Promise<SyncResult> {
  const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
  
  const syncModeLabel = syncMode === SyncMode.URL_ONLY ? 'URL-ONLY' : 'FULL';
  console.log(`🚀 Starting ${syncModeLabel} sync with content filtering for project: ${projectId}`);
  const overallStartTime = Date.now();
  
  // 1. Fetch raw data from OnCrawl
  console.log(`📡 Fetching data from OnCrawl...`);
  const fetchStartTime = Date.now();
  const { crawl, pages } = await client.getLatestAccessibleCrawlData(projectId);
  const fetchDuration = Date.now() - fetchStartTime;
  
  const projectName = await getProjectName(projectId); // Always returns a string
  
  console.log(`📡 Fetched ${pages.length} pages from crawl: ${crawl.id} (${crawl.name || 'Unnamed crawl'}) in ${fetchDuration}ms`);
  
  // 2. Create sync history record
  const syncHistoryId = await createSyncHistoryRecord(
    projectId,
    projectName,
    crawl.id,
    crawl.name // Already string | null, which is what createSyncHistoryRecord expects
  );
  
  try {
    // 3. Enhanced filtering with content validation
    console.log(`🔍 Starting enhanced filtering with content validation...`);
    const filterStartTime = Date.now();
    
    const indexablePages = pages.filter(page => 
      !shouldExcludeUrl(
        page.url, 
        page.title ?? undefined,
        page.meta_description ?? undefined,
        page.h1 ?? undefined,
        parseInt(page.status_code || '200')
      )
    ).map(processOnCrawlPage);
    
    const filterDuration = Date.now() - filterStartTime;
    
    console.log(`🔍 ENHANCED filtering completed: ${indexablePages.length} kept, ${pages.length - indexablePages.length} excluded in ${filterDuration}ms`);
    
    // 4. Choose sync strategy based on mode
    console.log(`💾 Starting ${syncModeLabel} database sync with sync history ${syncHistoryId}...`);
    const syncStartTime = Date.now();
    
    const filterStats: FilterStats = {
      total: pages.length,
      filteredNoContent: pages.length - indexablePages.length,
      filteredUrlPatterns: 0,
      filteredForumContent: 0,
      filteredStatusCode: 0,
      kept: indexablePages.length
    };
    
    const result = syncMode === SyncMode.URL_ONLY 
      ? await optimizedUrlOnlySync(indexablePages, syncHistoryId, projectName, filterStats)
      : await optimizedSmartSync(indexablePages, syncHistoryId, projectName, filterStats);
    
    const syncDuration = Date.now() - syncStartTime;
    const overallDuration = Date.now() - overallStartTime;
    
    // 5. Update sync history with final results
    await updateSyncHistoryRecord(syncHistoryId, result, overallDuration);
    
    const speedNote = syncMode === SyncMode.URL_ONLY ? ' (⚡ URL-only mode - much faster!)' : '';
    console.log(`🎉 ${syncModeLabel} sync with content filtering completed in ${overallDuration}ms${speedNote}:
      📝 Sync History ID: ${syncHistoryId} ✅
      📡 OnCrawl fetch: ${fetchDuration}ms
      🔍 Enhanced filtering: ${filterDuration}ms
      💾 Database sync: ${syncDuration}ms
      ✨ ${result.added} added
      🔄 ${result.updated} updated
      ⚪ ${result.unchanged} unchanged
      🗑️  ${result.removed} removed (stale)
      ❌ ${result.failed} failed
    `);
    
    if (onProgress) {
      onProgress(result.added + result.updated + result.unchanged, indexablePages.length);
    }
    
    return { 
      processed: result.added + result.updated + result.unchanged + result.failed + result.removed,
      added: result.added,
      updated: result.updated,
      unchanged: result.unchanged,
      failed: result.failed,
      removed: result.removed,
      syncHistoryId,
      durationMs: overallDuration,
      filteredNoContent: filterStats.filteredNoContent,
      filteredUrlPatterns: filterStats.filteredUrlPatterns,
      filteredForumContent: filterStats.filteredForumContent
    };
    
  } catch (error) {
    const overallDuration = Date.now() - overallStartTime;
    await updateSyncHistoryRecord(syncHistoryId, {
      added: 0,
      updated: 0,
      unchanged: 0,
      removed: 0,
      failed: pages.length
    }, overallDuration);
    
    console.error(`❌ Sync failed, updated sync history ${syncHistoryId} with error info`);
    throw error;
  }
}