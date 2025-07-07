// src/lib/services/oncrawl/processor.ts - COMPLETE FIXED VERSION

import { OnCrawlPage, OnCrawlClient } from './client';
import { supabase } from '@/lib/db/client';
import { shouldExcludeUrl, getExclusionReason, isForumContent, EXCLUDED_URL_PHRASES, SITE_SPECIFIC_EXCLUDED_PATTERNS } from '@/lib/utils/linkfilter';

export interface ProcessedOnCrawlPage {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  wordCount: number | null;
  category: string;
  
  // SEO metrics for internal linking strategy
  depth: number | null;
  inrankDecimal: number | null;
  internalOutlinks: number | null;
  nbInlinks: number | null;
}

export interface SyncResult {
  added: number;
  updated: number;
  unchanged: number;
  failed: number;
  removed: number;
  processed: number;
  syncHistoryId: number;
  durationMs: number;
}

/**
 * Convert string values to numbers (OnCrawl returns everything as strings)
 */
function parseNumericField(value: string | null | undefined): number | null {
  if (!value || value === 'null' || value === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Determine page category based on URL structure
 */
export function determinePageCategory(url: string): string {
  const slashCount = (url.match(/\//g) || []).length;
  
  if (url.includes('/tags/') || (url.endsWith('/') && slashCount <= 4)) {
    return 'category';
  }
  if (url.includes('.html') || url.match(/,\d+\./)) return 'article';
  if (slashCount <= 3) return 'page';
  
  return 'unknown';
}

/**
 * Process OnCrawl page data to our standard format
 */
export function processOnCrawlPage(page: OnCrawlPage): ProcessedOnCrawlPage {
  const url = page.url;
  const title = page.title;
  const h1 = page.h1;
  const metaDescription = page.meta_description;

  const wordCount = parseNumericField(page.word_count);
  const depth = parseNumericField(page.depth);
  const inrankDecimal = parseNumericField(page.inrank_decimal);
  const internalOutlinks = parseNumericField(page.internal_outlinks);
  const nbInlinks = parseNumericField(page.nb_inlinks);
  
  const category = determinePageCategory(url);
  
  return {
    url,
    title,
    metaDescription,
    h1,
    wordCount,
    category,
    depth,
    inrankDecimal,
    internalOutlinks,
    nbInlinks
  };
}

/**
 * Check if a page has actually changed compared to existing data
 */
function hasPageChanged(existing: any, newPage: ProcessedOnCrawlPage): boolean {
  const normalizeString = (value: any): string | null => {
    if (value === null || value === undefined || value === "") return null;
    return String(value).trim() || null;
  };

  const normalizeNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === "" || value === "null") return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return Math.round(num * 1000000) / 1000000;
  };

  const titleChanged = normalizeString(existing.title) !== normalizeString(newPage.title);
  const metaDescChanged = normalizeString(existing.meta_description) !== normalizeString(newPage.metaDescription);
  const h1Changed = normalizeString(existing.h1) !== normalizeString(newPage.h1);
  const categoryChanged = normalizeString(existing.category) !== normalizeString(newPage.category);
  
  const wordCountChanged = normalizeNumber(existing.word_count) !== normalizeNumber(newPage.wordCount);
  const depthChanged = normalizeNumber(existing.depth) !== normalizeNumber(newPage.depth);
  const inrankChanged = normalizeNumber(existing.inrank_decimal) !== normalizeNumber(newPage.inrankDecimal);
  const outlinkChanged = normalizeNumber(existing.internal_outlinks) !== normalizeNumber(newPage.internalOutlinks);
  const inlinkChanged = normalizeNumber(existing.nb_inlinks) !== normalizeNumber(newPage.nbInlinks);

  return titleChanged || metaDescChanged || h1Changed || wordCountChanged || 
         depthChanged || inrankChanged || outlinkChanged || inlinkChanged || categoryChanged;
}

/**
 * ✅ FIXED: Create sync history record (let DB auto-generate ID)
 */
async function createSyncHistoryRecord(
  projectId: string,
  projectName: string,
  crawlId: string,
  crawlName: string | null
): Promise<number> {
  console.log(`📝 Creating sync history record for project "${projectName}"...`);
  
  const { data, error } = await supabase
    .from('sync_history')
    .insert({
      project_id: projectId,
      project_name: projectName,
      crawl_id: crawlId,
      crawl_name: crawlName || 'Unnamed crawl',
      synced_at: new Date().toISOString(),
      // Initialize all counters to 0 - will be updated at the end
      pages_added: 0,
      pages_updated: 0,
      pages_unchanged: 0,
      pages_removed: 0,
      pages_failed: 0,
      duration_ms: 0
    })
    .select('id')
    .single();

  if (error) {
    console.error(`❌ Failed to create sync history record:`, error);
    throw new Error(`Failed to create sync history record: ${error.message}`);
  }

  console.log(`📝 ✅ Created sync history record with ID: ${data.id}`);
  return data.id;
}

/**
 * ✅ FIXED: Update sync history record with final results
 */
async function updateSyncHistoryRecord(
  syncHistoryId: number,
  result: { added: number; updated: number; unchanged: number; removed: number; failed: number },
  durationMs: number
): Promise<void> {
  console.log(`📝 Updating sync history record ${syncHistoryId} with final results...`);
  
  const { error } = await supabase
    .from('sync_history')
    .update({
      pages_added: result.added,
      pages_updated: result.updated,
      pages_unchanged: result.unchanged,
      pages_removed: result.removed,
      pages_failed: result.failed,
      duration_ms: durationMs
    })
    .eq('id', syncHistoryId);

  if (error) {
    console.error(`❌ Failed to update sync history record:`, error);
    // Don't throw - sync succeeded, just logging failed
  } else {
    console.log(`📝 ✅ Successfully updated sync history record ${syncHistoryId} with results:
      ✨ ${result.added} added
      🔄 ${result.updated} updated
      ⚪ ${result.unchanged} unchanged
      🗑️  ${result.removed} removed
      ❌ ${result.failed} failed
      ⏱️  ${durationMs}ms duration`);
  }
}

/**
 * Fetch existing pages for comparison
 */
async function optimizedFetchExistingPages(): Promise<Map<string, any>> {
  console.log(`🔍 Fetching ALL existing pages...`);
  const startTime = Date.now();
  
  const { count, error: countError } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error(`❌ Error getting page count:`, countError);
    throw new Error(`Failed to get page count: ${countError.message}`);
  }
  
  console.log(`📊 Database contains ${count} total pages`);
  
  const allPages: any[] = [];
  const batchSize = 1000;
  const totalPages = count || 0;
  
  for (let offset = 0; offset < totalPages; offset += batchSize) {
    const batchEnd = Math.min(offset + batchSize - 1, totalPages - 1);
    
    const { data: batch, error } = await supabase
      .from('pages')
      .select('url, title, meta_description, h1, word_count, category, depth, inrank_decimal, internal_outlinks, nb_inlinks, embedding')
      .range(offset, batchEnd)
      .limit(batchSize);
    
    if (error) {
      console.error(`❌ Error fetching batch ${offset}-${batchEnd}:`, error);
      throw new Error(`Failed to fetch pages batch: ${error.message}`);
    }
    
    if (batch && batch.length > 0) {
      allPages.push(...batch);
      const batchNum = Math.floor(offset / batchSize) + 1;
      const totalBatches = Math.ceil(totalPages / batchSize);
      console.log(`🔍 Fetched batch ${batchNum}/${totalBatches}: ${batch.length} pages (total: ${allPages.length}/${totalPages})`);
    }
  }
  
  const pageMap = new Map();
  allPages.forEach(page => {
    pageMap.set(page.url, page);
  });
  
  const duration = Date.now() - startTime;
  console.log(`🔍 Successfully fetched ${pageMap.size}/${totalPages} existing pages in ${duration}ms`);
  
  return pageMap;
}

/**
 * OPTIMIZED filtering with pre-compiled patterns
 */
function optimizedFilterPages(pages: OnCrawlPage[]): ProcessedOnCrawlPage[] {
  console.log(`🔍 Starting OPTIMIZED filtering of ${pages.length} pages...`);
  const startTime = Date.now();
  
  const excludedPhrasesSet = new Set(EXCLUDED_URL_PHRASES.map(p => p.toLowerCase()));
  const sitePatternSet = new Set(SITE_SPECIFIC_EXCLUDED_PATTERNS);
  
  const shouldExcludeFast = (url: string, metaDescription?: string): boolean => {
    if (!url || url.length < 8) return true;
    
    if (url.includes('\n') || url.includes('\r') || url.includes(';200;') || !url.startsWith('http')) {
      return true;
    }
    
    const lowerUrl = url.toLowerCase();
    
    for (const phrase of excludedPhrasesSet) {
      if (lowerUrl.includes(phrase)) return true;
    }
    
    const pathStart = url.indexOf('/', 8);
    if (pathStart !== -1) {
      const pathname = url.substring(pathStart).toLowerCase();
      for (const pattern of sitePatternSet) {
        if (pathname.includes(pattern)) return true;
      }
    }
    
    if (metaDescription && isForumContent(metaDescription)) return true;
    
    return false;
  };
  
  const indexablePages: ProcessedOnCrawlPage[] = [];
  let excluded = 0;
  
  for (const page of pages) {
    const url = page.url;
    
    if (shouldExcludeFast(url, page.meta_description ?? undefined)) {
      excluded++;
      continue;
    }
    
    const statusCode = page.status_code ? parseInt(page.status_code) : null;
    if (statusCode && statusCode !== 200) {
      excluded++;
      continue;
    }
    
    indexablePages.push(processOnCrawlPage(page));
  }
  
  const duration = Date.now() - startTime;
  console.log(`🔍 Optimized filtering completed: ${indexablePages.length} kept, ${excluded} excluded in ${duration}ms`);
  
  return indexablePages;
}

/**
 * ✅ FIXED: Batch insert new pages WITHOUT last_crawled or sync_history_id
 */
async function batchInsertNewPages(
  pages: ProcessedOnCrawlPage[],
  batchSize: number = 1000
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    
    try {
      const batchData = batch.map(page => ({
        url: page.url,
        title: page.title,
        meta_description: page.metaDescription,
        h1: page.h1,
        word_count: page.wordCount,
        category: page.category,
        depth: page.depth,
        inrank_decimal: page.inrankDecimal,
        internal_outlinks: page.internalOutlinks,
        nb_inlinks: page.nbInlinks,
        embedding: null,
        updated_at: new Date().toISOString()
        // ✅ No last_crawled, no sync_history_id
      }));

      const { error } = await supabase
        .from('pages')
        .insert(batchData);

      if (error) {
        console.error(`❌ Insert batch failed:`, error);
        failed += batch.length;
      } else {
        processed += batch.length;
        console.log(`✨ New pages batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pages.length / batchSize)} completed`);
      }

    } catch (error) {
      console.error(`❌ Insert batch error:`, error);
      failed += batch.length;
    }
  }

  return { processed, failed };
}

/**
 * ✅ FIXED: Batch update changed pages WITHOUT last_crawled or sync_history_id
 */
async function batchUpdateChangedPages(
  pages: ProcessedOnCrawlPage[],
  existingPageMap: Map<string, any>,
  batchSize: number = 500
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    
    try {
      const batchData = batch.map(page => {
        const existing = existingPageMap.get(page.url);
        
        return {
          url: page.url,
          title: page.title,
          meta_description: page.metaDescription,
          h1: page.h1,
          word_count: page.wordCount,
          category: page.category,
          depth: page.depth,
          inrank_decimal: page.inrankDecimal,
          internal_outlinks: page.internalOutlinks,
          nb_inlinks: page.nbInlinks,
          embedding: existing?.embedding || null, // ✅ Preserve existing embedding
          updated_at: new Date().toISOString()
          // ✅ No last_crawled, no sync_history_id
        };
      });

      const { error } = await supabase
        .from('pages')
        .upsert(batchData, {
          onConflict: 'url'
        });

      if (error) {
        console.error(`❌ Update changed pages batch failed:`, error);
        failed += batch.length;
      } else {
        processed += batch.length;
        console.log(`🔄 Changed pages batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pages.length / batchSize)} completed`);
      }

    } catch (error) {
      console.error(`❌ Update changed pages batch error:`, error);
      failed += batch.length;
    }
  }

  return { processed, failed };
}

/**
 * Remove stale pages that are no longer in OnCrawl
 */
async function batchRemoveStalePages(
  staleUrls: string[],
  batchSize: number = 200
): Promise<{ removed: number; failed: number }> {
  let removed = 0;
  let failed = 0;

  console.log(`🗑️  Removing ${staleUrls.length} stale pages in batches...`);

  for (let i = 0; i < staleUrls.length; i += batchSize) {
    const batch = staleUrls.slice(i, i + batchSize);
    
    try {
      const { error, count } = await supabase
        .from('pages')
        .delete()
        .in('url', batch);

      if (error) {
        console.error(`❌ Remove stale pages batch failed:`, error);
        failed += batch.length;
      } else {
        const actualRemoved = count || batch.length;
        removed += actualRemoved;
        console.log(`🗑️  Removed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(staleUrls.length / batchSize)} (${actualRemoved} pages)`);
      }

    } catch (error) {
      console.error(`❌ Remove stale pages batch error:`, error);
      failed += batch.length;
    }
  }

  return { removed, failed };
}

/**
 * ✅ FIXED: Smart sync with standalone sync history tracking
 */
async function optimizedSmartSync(
  pages: ProcessedOnCrawlPage[], 
  syncHistoryId: number
): Promise<{
  added: number; updated: number; unchanged: number; failed: number; removed: number;
}> {
  console.log(`🧠 Starting OPTIMIZED smart sync for ${pages.length} pages (sync history: ${syncHistoryId})...`);
  const startTime = Date.now();
  
  // 1. Fetch ALL existing pages
  const existingPageMap = await optimizedFetchExistingPages();
  const allExistingUrls = new Set(existingPageMap.keys());
  
  console.log(`📊 Database state: ${existingPageMap.size} existing pages, processing ${pages.length} OnCrawl pages`);
  
  // 2. Categorize pages
  const currentUrls = new Set(pages.map(p => p.url));
  const newPages: ProcessedOnCrawlPage[] = [];
  const changedPages: ProcessedOnCrawlPage[] = [];
  const unchangedPages: ProcessedOnCrawlPage[] = [];
  
  let exampleNew = '';
  let exampleChanged = '';
  let exampleUnchanged = '';
  
  for (const page of pages) {
    const existing = existingPageMap.get(page.url);
    
    if (!existing) {
      newPages.push(page);
      if (!exampleNew) exampleNew = page.url;
    } else if (hasPageChanged(existing, page)) {
      changedPages.push(page);
      if (!exampleChanged) exampleChanged = page.url;
    } else {
      unchangedPages.push(page);
      if (!exampleUnchanged) exampleUnchanged = page.url;
    }
  }
  
  // 3. Find stale pages
  const staleUrls = Array.from(allExistingUrls).filter(url => !currentUrls.has(url));
  
  console.log(`📊 Categorization (sync history: ${syncHistoryId}):
    ✨ ${newPages.length} new pages ${exampleNew ? `(e.g., ${exampleNew.substring(0, 60)}...)` : ''}
    🔄 ${changedPages.length} changed pages ${exampleChanged ? `(e.g., ${exampleChanged.substring(0, 60)}...)` : ''}
    ⚪ ${unchangedPages.length} unchanged pages ${exampleUnchanged ? `(e.g., ${exampleUnchanged.substring(0, 60)}...)` : ''}
    🗑️  ${staleUrls.length} stale pages
  `);

  let added = 0, updated = 0, unchanged = unchangedPages.length, failed = 0, removed = 0;

  // 4. Execute operations - ONLY touch pages that need changes
  if (newPages.length > 0) {
    console.log(`📥 Inserting ${newPages.length} new pages (sync ${syncHistoryId})...`);
    const insertResult = await batchInsertNewPages(newPages);
    added = insertResult.processed;
    failed += insertResult.failed;
  }

  if (changedPages.length > 0) {
    console.log(`🔄 Updating ${changedPages.length} changed pages (sync ${syncHistoryId})...`);
    const updateResult = await batchUpdateChangedPages(changedPages, existingPageMap);
    updated = updateResult.processed;
    failed += updateResult.failed;
  }

  // ✅ FIXED: Don't touch unchanged pages at all!
  if (unchangedPages.length > 0) {
    console.log(`⚪ ${unchangedPages.length} unchanged pages (SKIPPED - no database writes needed!)`);
  }

  if (staleUrls.length > 0) {
    console.log(`🗑️  Removing ${staleUrls.length} stale pages (sync ${syncHistoryId})...`);
    const removeResult = await batchRemoveStalePages(staleUrls);
    removed = removeResult.removed;
    failed += removeResult.failed;
  }

  const duration = Date.now() - startTime;
  console.log(`✅ Smart sync completed in ${duration}ms (sync history: ${syncHistoryId}):
    ✨ ${added} added
    🔄 ${updated} updated  
    ⚪ ${unchanged} unchanged (NOT TOUCHED!)
    🗑️  ${removed} removed (stale)
    ❌ ${failed} failed
  `);

  return { added, updated, unchanged, failed, removed };
}

/**
 * Get project name from OnCrawl API or use fallback
 */
async function getProjectName(projectId: string): Promise<string> {
  try {
    const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
    const projects = await client.getProjects();
    const project = projects.find(p => p.id === projectId);
    return project?.name || `Project ${projectId}`;
  } catch (error) {
    console.warn(`⚠️  Could not fetch project name, using fallback`);
    return `Project ${projectId}`;
  }
}

/**
 * ✅ MAIN FIXED SYNC FUNCTION - With proper standalone sync history tracking
 */
export async function syncPagesFromOnCrawlOptimized(
  projectId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<SyncResult> {
  const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
  
  console.log(`🚀 Starting OPTIMIZED sync with standalone sync history for project: ${projectId}`);
  const overallStartTime = Date.now();
  
  // 1. Fetch raw data from OnCrawl
  console.log(`📡 Fetching data from OnCrawl...`);
  const fetchStartTime = Date.now();
  const { crawl, pages } = await client.getLatestAccessibleCrawlData(projectId);
  const fetchDuration = Date.now() - fetchStartTime;
  
  // Get project name for sync history
  const projectName = await getProjectName(projectId);
  
  console.log(`📡 Fetched ${pages.length} pages from crawl: ${crawl.id} (${crawl.name || 'Unnamed crawl'}) in ${fetchDuration}ms`);
  
  // ✅ 2. CREATE SYNC HISTORY RECORD
  const syncHistoryId = await createSyncHistoryRecord(
    projectId,
    projectName,
    crawl.id,
    crawl.name
  );
  
  try {
    // 3. OPTIMIZED filtering and processing
    console.log(`🔍 Starting optimized filtering...`);
    const filterStartTime = Date.now();
    const indexablePages = optimizedFilterPages(pages);
    const filterDuration = Date.now() - filterStartTime;
    console.log(`🔍 OPTIMIZED filtering completed: ${indexablePages.length} kept, ${pages.length - indexablePages.length} excluded in ${filterDuration}ms`);
    
    // 4. OPTIMIZED database sync with standalone sync history
    console.log(`💾 Starting optimized database sync with sync history ${syncHistoryId}...`);
    const syncStartTime = Date.now();
    const result = await optimizedSmartSync(indexablePages, syncHistoryId);
    const syncDuration = Date.now() - syncStartTime;
    
    const overallDuration = Date.now() - overallStartTime;
    const pagesPerSecond = overallDuration > 0 ? Math.round((result.added + result.updated + result.unchanged) / (overallDuration / 1000)) : 0;
    
    // ✅ 5. UPDATE SYNC HISTORY WITH FINAL RESULTS
    await updateSyncHistoryRecord(syncHistoryId, result, overallDuration);
    
    console.log(`🎉 OPTIMIZED sync with standalone sync history completed in ${overallDuration}ms:
      📝 Sync History ID: ${syncHistoryId} ✅
      📡 OnCrawl fetch: ${fetchDuration}ms
      🔍 Filtering: ${filterDuration}ms (OPTIMIZED)
      💾 Database sync: ${syncDuration}ms (OPTIMIZED - no unnecessary page touching!)
      ✨ ${result.added} added
      🔄 ${result.updated} updated
      ⚪ ${result.unchanged} unchanged (not touched!)
      🗑️  ${result.removed} removed (stale)
      ❌ ${result.failed} failed
      🚀 Performance: ${pagesPerSecond} pages/second (OPTIMIZED)
    `);
    
    // Report final progress
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
      durationMs: overallDuration
    };
    
  } catch (error) {
    // If sync fails, still try to update sync history with error info
    const overallDuration = Date.now() - overallStartTime;
    await updateSyncHistoryRecord(syncHistoryId, {
      added: 0,
      updated: 0,
      unchanged: 0,
      removed: 0,
      failed: pages.length
    }, overallDuration);
    
    console.error(`❌ Sync failed, updated sync history ${syncHistoryId} with error info`);
    throw error; // Re-throw the original error
  }
}