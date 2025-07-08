// src/lib/services/oncrawl/processor.ts - ENHANCED WITH CONTENT FILTERING
import { OnCrawlClient } from './client';
import { OnCrawlPage, ProcessedOnCrawlPage, SyncResult, ContentValidationResult, FilterStats, FilterExamples, FilterResult } from './types';
import { supabase } from '@/lib/db/client';
import { isForumContent, EXCLUDED_URL_PHRASES, SITE_SPECIFIC_EXCLUDED_PATTERNS } from '@/lib/utils/linkfilter';

/**
 * 🆕 NEW: Check if a page has embeddable content
 * This prevents unembeddable pages from entering the database
 */
function hasEmbeddableContent(page: OnCrawlPage): boolean {
  const title = page.title?.trim();
  const h1 = page.h1?.trim();
  const metaDescription = page.meta_description?.trim();
  
  // Must have at least one non-empty content field
  return !!(title || h1 || metaDescription);
}

/**
 * 🆕 NEW: Enhanced content validation with detailed logging
 */
function validatePageContent(page: OnCrawlPage): ContentValidationResult {
  const title = page.title?.trim();
  const h1 = page.h1?.trim();
  const metaDescription = page.meta_description?.trim();
  
  const hasTitle = !!title;
  const hasH1 = !!h1;
  const hasMetaDescription = !!metaDescription;
  
  const combinedText = [title, h1, metaDescription].filter(Boolean).join(' ');
  const combinedLength = combinedText.length;
  
  if (combinedLength === 0) {
    return {
      isValid: false,
      reason: 'No embeddable content (title, h1, meta_description all empty)',
      hasTitle,
      hasH1,
      hasMetaDescription,
      combinedLength
    };
  }
  
  // Optional: Check for minimum content length
  if (combinedLength < 3) {
    return {
      isValid: false,
      reason: `Content too short (${combinedLength} chars)`,
      hasTitle,
      hasH1,
      hasMetaDescription,
      combinedLength
    };
  }
  
  return {
    isValid: true,
    hasTitle,
    hasH1,
    hasMetaDescription,
    combinedLength
  };
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
 * Create sync history record
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
 * Update sync history record with final results
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
  } else {
    console.log(`📝 ✅ Successfully updated sync history record ${syncHistoryId}`);
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
 * 🆕 ENHANCED: Filtering with detailed content validation and statistics
 */
function optimizedFilterPages(pages: OnCrawlPage[]): FilterResult {
  console.log(`🔍 Starting ENHANCED filtering with content validation of ${pages.length} pages...`);
  const startTime = Date.now();
  
  // Pre-compile patterns for performance
  const excludedPhrasesSet = new Set(EXCLUDED_URL_PHRASES.map(p => p.toLowerCase()));
  const sitePatternSet = new Set(SITE_SPECIFIC_EXCLUDED_PATTERNS);
  
  const indexablePages: ProcessedOnCrawlPage[] = [];
  const stats = {
    total: pages.length,
    filteredNoContent: 0,
    filteredUrlPatterns: 0,
    filteredForumContent: 0,
    filteredStatusCode: 0,
    kept: 0
  };
  
  const examples = {
    noContent: [] as Array<{ url: string; reason: string }>,
    urlPatterns: [] as Array<{ url: string; reason: string }>,
    forumContent: [] as Array<{ url: string; reason: string }>
  };
  
  for (const page of pages) {
    const url = page.url;
    
    // 1. Check status code first
    const statusCode = page.status_code ? parseInt(page.status_code) : null;
    if (statusCode && statusCode !== 200) {
      stats.filteredStatusCode++;
      continue;
    }
    
    // 2. 🆕 NEW: Check for embeddable content FIRST (most important filter)
    const contentValidation = validatePageContent(page);
    if (!contentValidation.isValid) {
      stats.filteredNoContent++;
      
      // Collect examples for debugging
      if (examples.noContent.length < 10) {
        examples.noContent.push({
          url: url.substring(0, 80) + (url.length > 80 ? '...' : ''),
          reason: contentValidation.reason || 'No content'
        });
      }
      
      continue;
    }
    
    // 3. Check URL patterns
    if (!url || url.length < 8) {
      stats.filteredUrlPatterns++;
      continue;
    }
    
    if (url.includes('\n') || url.includes('\r') || url.includes(';200;') || !url.startsWith('http')) {
      stats.filteredUrlPatterns++;
      continue;
    }
    
    const lowerUrl = url.toLowerCase();
    let urlExcluded = false;
    let urlExclusionReason = '';
    
    for (const phrase of excludedPhrasesSet) {
      if (lowerUrl.includes(phrase)) {
        urlExcluded = true;
        urlExclusionReason = `Contains excluded phrase: ${phrase}`;
        break;
      }
    }
    
    if (!urlExcluded) {
      const pathStart = url.indexOf('/', 8);
      if (pathStart !== -1) {
        const pathname = url.substring(pathStart).toLowerCase();
        for (const pattern of sitePatternSet) {
          if (pathname.includes(pattern)) {
            urlExcluded = true;
            urlExclusionReason = `Site-specific pattern: ${pattern}`;
            break;
          }
        }
      }
    }
    
    if (urlExcluded) {
      stats.filteredUrlPatterns++;
      
      if (examples.urlPatterns.length < 10) {
        examples.urlPatterns.push({
          url: url.substring(0, 60) + (url.length > 60 ? '...' : ''),
          reason: urlExclusionReason
        });
      }
      
      continue;
    }
    
    // 4. Check forum content
    if (page.meta_description && isForumContent(page.meta_description)) {
      stats.filteredForumContent++;
      
      if (examples.forumContent.length < 10) {
        examples.forumContent.push({
          url: url.substring(0, 60) + (url.length > 60 ? '...' : ''),
          reason: 'Forum content detected in meta description'
        });
      }
      
      continue;
    }
    
    // 5. Page passed all filters - process it
    indexablePages.push(processOnCrawlPage(page));
    stats.kept++;
  }
  
  const duration = Date.now() - startTime;
  
  console.log(`🔍 ENHANCED filtering completed in ${duration}ms:
    📊 Total: ${stats.total}
    🚫 Filtered out:
      💭 No content: ${stats.filteredNoContent} (${Math.round(stats.filteredNoContent/stats.total*100)}%)
      🔗 URL patterns: ${stats.filteredUrlPatterns} (${Math.round(stats.filteredUrlPatterns/stats.total*100)}%)
      💬 Forum content: ${stats.filteredForumContent} (${Math.round(stats.filteredForumContent/stats.total*100)}%)
      🔴 Status codes: ${stats.filteredStatusCode} (${Math.round(stats.filteredStatusCode/stats.total*100)}%)
    ✅ Kept: ${stats.kept} (${Math.round(stats.kept/stats.total*100)}%)
  `);
  
  // Log some examples for debugging
  if (examples.noContent.length > 0) {
    console.log(`💭 No content examples: ${examples.noContent.slice(0, 3).map(e => `${e.url} (${e.reason})`).join(', ')}`);
  }
  
  return { indexablePages, stats, examples };
}

/**
 * Batch insert new pages
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
 * Batch update changed pages
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
          embedding: existing?.embedding || null,
          updated_at: new Date().toISOString()
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
 * 🆕 ENHANCED: Smart sync with content filtering statistics
 */
async function optimizedSmartSync(
  pages: ProcessedOnCrawlPage[], 
  syncHistoryId: number,
  filterStats: FilterStats
): Promise<{
  added: number; updated: number; unchanged: number; failed: number; removed: number;
  filteredNoContent: number; filteredUrlPatterns: number; filteredForumContent: number;
}> {
  console.log(`🧠 Starting ENHANCED smart sync for ${pages.length} pages (sync history: ${syncHistoryId})...`);
  const startTime = Date.now();
  
  const existingPageMap = await optimizedFetchExistingPages();
  const allExistingUrls = new Set(existingPageMap.keys());
  
  console.log(`📊 Database state: ${existingPageMap.size} existing pages, processing ${pages.length} filtered pages`);
  
  // Categorize pages
  const currentUrls = new Set(pages.map(p => p.url));
  const newPages: ProcessedOnCrawlPage[] = [];
  const changedPages: ProcessedOnCrawlPage[] = [];
  const unchangedPages: ProcessedOnCrawlPage[] = [];
  
  for (const page of pages) {
    const existing = existingPageMap.get(page.url);
    
    if (!existing) {
      newPages.push(page);
    } else if (hasPageChanged(existing, page)) {
      changedPages.push(page);
    } else {
      unchangedPages.push(page);
    }
  }
  
  const staleUrls = Array.from(allExistingUrls).filter(url => !currentUrls.has(url));
  
  console.log(`📊 Categorization (sync history: ${syncHistoryId}):
    ✨ ${newPages.length} new pages
    🔄 ${changedPages.length} changed pages
    ⚪ ${unchangedPages.length} unchanged pages
    🗑️  ${staleUrls.length} stale pages
  `);

  let added = 0, updated = 0, unchanged = unchangedPages.length, failed = 0, removed = 0;

  // Execute operations
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
  console.log(`✅ Enhanced smart sync completed in ${duration}ms (sync history: ${syncHistoryId}):
    ✨ ${added} added
    🔄 ${updated} updated  
    ⚪ ${unchanged} unchanged
    🗑️  ${removed} removed (stale)
    ❌ ${failed} failed
  `);

  return { 
    added, 
    updated, 
    unchanged, 
    failed, 
    removed,
    filteredNoContent: filterStats.filteredNoContent,
    filteredUrlPatterns: filterStats.filteredUrlPatterns,
    filteredForumContent: filterStats.filteredForumContent
  };
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
 * 🆕 MAIN ENHANCED SYNC FUNCTION - Now filters unembeddable content at source
 */
export async function syncPagesFromOnCrawlOptimized(
  projectId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<SyncResult> {
  const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
  
  console.log(`🚀 Starting ENHANCED sync with content filtering for project: ${projectId}`);
  const overallStartTime = Date.now();
  
  // 1. Fetch raw data from OnCrawl
  console.log(`📡 Fetching data from OnCrawl...`);
  const fetchStartTime = Date.now();
  const { crawl, pages } = await client.getLatestAccessibleCrawlData(projectId);
  const fetchDuration = Date.now() - fetchStartTime;
  
  const projectName = await getProjectName(projectId);
  
  console.log(`📡 Fetched ${pages.length} pages from crawl: ${crawl.id} (${crawl.name || 'Unnamed crawl'}) in ${fetchDuration}ms`);
  
  // 2. Create sync history record
  const syncHistoryId = await createSyncHistoryRecord(
    projectId,
    projectName,
    crawl.id,
    crawl.name
  );
  
  try {
    // 3. 🆕 ENHANCED filtering with content validation
    console.log(`🔍 Starting enhanced filtering with content validation...`);
    const filterStartTime = Date.now();
    const { indexablePages, stats: filterStats, examples } = optimizedFilterPages(pages);
    const filterDuration = Date.now() - filterStartTime;
    
    console.log(`🔍 ENHANCED filtering completed: ${indexablePages.length} kept, ${pages.length - indexablePages.length} excluded in ${filterDuration}ms`);
    
    // 4. Enhanced database sync
    console.log(`💾 Starting enhanced database sync with sync history ${syncHistoryId}...`);
    const syncStartTime = Date.now();
    const result = await optimizedSmartSync(indexablePages, syncHistoryId, filterStats);
    const syncDuration = Date.now() - syncStartTime;
    
    const overallDuration = Date.now() - overallStartTime;
    
    // 5. Update sync history with final results
    await updateSyncHistoryRecord(syncHistoryId, result, overallDuration);
    
    console.log(`🎉 ENHANCED sync with content filtering completed in ${overallDuration}ms:
      📝 Sync History ID: ${syncHistoryId} ✅
      📡 OnCrawl fetch: ${fetchDuration}ms
      🔍 Enhanced filtering: ${filterDuration}ms
        💭 No content filtered: ${result.filteredNoContent}
        🔗 URL pattern filtered: ${result.filteredUrlPatterns}  
        💬 Forum content filtered: ${result.filteredForumContent}
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
      filteredNoContent: result.filteredNoContent,
      filteredUrlPatterns: result.filteredUrlPatterns,
      filteredForumContent: result.filteredForumContent
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