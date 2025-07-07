// src/lib/services/oncrawl/processor.ts - COMPLETE OPTIMIZED VERSION

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

/**
 * Convert string values to numbers (OnCrawl returns everything as strings)
 * FIXED: Use parseFloat() instead of parseInt() to preserve decimal values
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
  
  // Both /tags/something and /something/ are treated as categories
  if (url.includes('/tags/') || (url.endsWith('/') && slashCount <= 4)) {
    return 'category';
  }
  if (url.includes('.html') || url.match(/,\d+\./)) return 'article';
  if (slashCount <= 3) return 'page';
  
  return 'unknown';
}

/**
 * Process OnCrawl page data to our standard format
 * Pure data transformation - no content generation
 */
export function processOnCrawlPage(page: OnCrawlPage): ProcessedOnCrawlPage {
  const url = page.url;
  const title = page.title;
  const h1 = page.h1;
  const metaDescription = page.meta_description;

  // Parse numeric fields (OnCrawl sends everything as strings)
  const wordCount = parseNumericField(page.word_count);
  const depth = parseNumericField(page.depth);
  const inrankDecimal = parseNumericField(page.inrank_decimal);
  const internalOutlinks = parseNumericField(page.internal_outlinks);
  const nbInlinks = parseNumericField(page.nb_inlinks);
  
  // Determine category based on URL structure
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
 * FIXED: Check if a page has actually changed compared to existing data
 * Normalize comparisons to handle null/0, null/"", and float precision issues
 */
function hasPageChanged(existing: any, newPage: ProcessedOnCrawlPage): boolean {
  // Helper function to normalize string values (null <-> empty string)
  const normalizeString = (value: any): string | null => {
    if (value === null || value === undefined || value === "") return null;
    return String(value).trim() || null;
  };

  // Helper function to normalize numeric values (null <-> 0, precision issues)
  const normalizeNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === "" || value === "null") return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    // Round to 6 decimal places to handle floating point precision issues
    return Math.round(num * 1000000) / 1000000;
  };

  // Normalize and compare each field
  const titleChanged = normalizeString(existing.title) !== normalizeString(newPage.title);
  const metaDescChanged = normalizeString(existing.meta_description) !== normalizeString(newPage.metaDescription);
  const h1Changed = normalizeString(existing.h1) !== normalizeString(newPage.h1);
  const categoryChanged = normalizeString(existing.category) !== normalizeString(newPage.category);
  
  // Numeric field comparisons with normalization
  const wordCountChanged = normalizeNumber(existing.word_count) !== normalizeNumber(newPage.wordCount);
  const depthChanged = normalizeNumber(existing.depth) !== normalizeNumber(newPage.depth);
  const inrankChanged = normalizeNumber(existing.inrank_decimal) !== normalizeNumber(newPage.inrankDecimal);
  const outlinkChanged = normalizeNumber(existing.internal_outlinks) !== normalizeNumber(newPage.internalOutlinks);
  const inlinkChanged = normalizeNumber(existing.nb_inlinks) !== normalizeNumber(newPage.nbInlinks);

  return titleChanged || metaDescChanged || h1Changed || wordCountChanged || 
         depthChanged || inrankChanged || outlinkChanged || inlinkChanged || categoryChanged;
}

/**
 * 🚀 FIXED: Fetch ALL existing pages with explicit Supabase limits
 */
async function optimizedFetchExistingPages(): Promise<Map<string, any>> {
  console.log(`🔍 Fetching ALL existing pages...`);
  const startTime = Date.now();
  
  // First, get the total count
  const { count, error: countError } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error(`❌ Error getting page count:`, countError);
    throw new Error(`Failed to get page count: ${countError.message}`);
  }
  
  console.log(`📊 Database contains ${count} total pages`);
  
  const allPages: any[] = [];
  const batchSize = 1000; // Supabase safe batch size
  const totalPages = count || 0;
  
  for (let offset = 0; offset < totalPages; offset += batchSize) {
    const batchEnd = Math.min(offset + batchSize - 1, totalPages - 1);
    
    const { data: batch, error } = await supabase
      .from('pages')
      .select('url, title, meta_description, h1, word_count, category, depth, inrank_decimal, internal_outlinks, nb_inlinks, embedding, last_crawled')
      .range(offset, batchEnd)
      .limit(batchSize); // Explicit limit to override Supabase defaults
    
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
    
    // Safety check
    if (batch && batch.length < batchSize && offset + batchSize < totalPages) {
      console.warn(`⚠️ Got fewer pages than expected in batch. Expected ${batchSize}, got ${batch.length}`);
    }
  }
  
  // Convert to Map for O(1) lookups
  const pageMap = new Map();
  allPages.forEach(page => {
    pageMap.set(page.url, page);
  });
  
  const duration = Date.now() - startTime;
  console.log(`🔍 Successfully fetched ${pageMap.size}/${totalPages} existing pages in ${duration}ms`);
  
  // Verify we got everything
  if (pageMap.size !== totalPages) {
    console.warn(`⚠️ WARNING: Expected ${totalPages} pages but got ${pageMap.size}. Some pages may be missing!`);
  }
  
  return pageMap;
}

/**
 * 🚀 OPTIMIZED: Fast filtering with pre-compiled patterns and minimal URL parsing
 */
function optimizedFilterPages(pages: OnCrawlPage[]): ProcessedOnCrawlPage[] {
  console.log(`🔍 Starting OPTIMIZED filtering of ${pages.length} pages...`);
  const startTime = Date.now();
  
  // Pre-compile exclusion patterns for faster matching
  const excludedPhrasesSet = new Set(EXCLUDED_URL_PHRASES.map(p => p.toLowerCase()));
  const sitePatternSet = new Set(SITE_SPECIFIC_EXCLUDED_PATTERNS);
  
  // Fast exclusion check without expensive URL parsing
  const shouldExcludeFast = (url: string, metaDescription?: string): boolean => {
    if (!url || url.length < 8) return true;
    
    // Quick malformed URL detection (OnCrawl data quality issues)
    if (url.includes('\n') || url.includes('\r') || url.includes(';200;') || !url.startsWith('http')) {
      return true;
    }
    
    const lowerUrl = url.toLowerCase();
    
    // Fast phrase checking using Set lookup O(1) instead of array.some() O(n)
    for (const phrase of excludedPhrasesSet) {
      if (lowerUrl.includes(phrase)) return true;
    }
    
    // Fast site pattern checking - extract pathname without full URL parsing
    const pathStart = url.indexOf('/', 8); // After "https://"
    if (pathStart !== -1) {
      const pathname = url.substring(pathStart).toLowerCase();
      for (const pattern of sitePatternSet) {
        if (pathname.includes(pattern)) return true;
      }
    }
    
    // Forum content check only if meta description exists (avoid unnecessary work)
    if (metaDescription && isForumContent(metaDescription)) return true;
    
    return false;
  };
  
  const indexablePages: ProcessedOnCrawlPage[] = [];
  let excluded = 0;
  
  for (const page of pages) {
    const url = page.url;
    
    // Fast exclusion check first (avoid expensive operations)
    if (shouldExcludeFast(url, page.meta_description ?? undefined)) {
      excluded++;
      continue;
    }
    
    // Status code check
    const statusCode = page.status_code ? parseInt(page.status_code) : null;
    if (statusCode && statusCode !== 200) {
      excluded++;
      continue;
    }
    
    // Process page (this is fast)
    indexablePages.push(processOnCrawlPage(page));
  }
  
  const duration = Date.now() - startTime;
  console.log(`🔍 Optimized filtering completed in ${duration}ms: kept ${indexablePages.length}, excluded ${excluded}`);
  
  return indexablePages;
}

/**
 * Batch insert completely new pages with Supabase batch size limits
 */
async function batchInsertNewPages(
  pages: ProcessedOnCrawlPage[],
  batchSize: number = 1000 // Supabase recommended batch size
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
        embedding: null, // New pages start with no embedding
        last_crawled: new Date().toISOString(),
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
 * Batch update only pages that actually changed (preserve embeddings)
 */
async function batchUpdateChangedPages(
  pages: ProcessedOnCrawlPage[],
  existingPageMap: Map<string, any>,
  batchSize: number = 500 // Smaller batch size for updates
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
          last_crawled: new Date().toISOString(),
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
  batchSize: number = 200 // Smaller batch size to avoid 414 Request-URI Too Large errors
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
 * Update last_crawled timestamp for unchanged pages
 */
async function batchTouchUnchangedPages(
  pages: ProcessedOnCrawlPage[],
  batchSize: number = 1000
): Promise<void> {
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const urls = batch.map(p => p.url);
    
    await supabase
      .from('pages')
      .update({ last_crawled: new Date().toISOString() })
      .in('url', urls);
  }
}

/**
 * 🚀 OPTIMIZED: Smart sync with proper categorization and safety checks
 */
async function optimizedSmartSync(pages: ProcessedOnCrawlPage[]): Promise<{
  added: number; updated: number; unchanged: number; failed: number; removed: number;
}> {
  console.log(`🧠 Starting OPTIMIZED smart sync for ${pages.length} pages...`);
  const startTime = Date.now();
  
  // 1. Fetch ALL existing pages with proper pagination
  const existingPageMap = await optimizedFetchExistingPages();
  const allExistingUrls = new Set(existingPageMap.keys());
  
  console.log(`📊 Database state: ${existingPageMap.size} existing pages, processing ${pages.length} OnCrawl pages`);
  
  // 2. Fast categorization using Map lookups O(1)
  const currentUrls = new Set(pages.map(p => p.url));
  const newPages: ProcessedOnCrawlPage[] = [];
  const changedPages: ProcessedOnCrawlPage[] = [];
  const unchangedPages: ProcessedOnCrawlPage[] = [];
  
  // Debug: Track a few examples for verification
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
  
  // 3. Find stale pages (in DB but not in current OnCrawl)
  const staleUrls = Array.from(allExistingUrls).filter(url => !currentUrls.has(url));
  
  console.log(`📊 FIXED categorization:
    ✨ ${newPages.length} new pages ${exampleNew ? `(e.g., ${exampleNew.substring(0, 60)}...)` : ''}
    🔄 ${changedPages.length} changed pages ${exampleChanged ? `(e.g., ${exampleChanged.substring(0, 60)}...)` : ''}
    ⚪ ${unchangedPages.length} unchanged pages ${exampleUnchanged ? `(e.g., ${exampleUnchanged.substring(0, 60)}...)` : ''}
    🗑️  ${staleUrls.length} stale pages
  `);

  // Safety check: If we have way more "new" pages than expected, something is wrong
  if (newPages.length > pages.length * 0.5) {
    console.warn(`⚠️ WARNING: ${newPages.length} new pages seems high (${Math.round(newPages.length/pages.length*100)}% of total). Verify database fetch worked correctly.`);
  }

  let added = 0, updated = 0, unchanged = unchangedPages.length, failed = 0, removed = 0;

  // 4. Execute operations with error handling
  if (newPages.length > 0) {
    console.log(`📥 Inserting ${newPages.length} genuinely new pages...`);
    const insertResult = await batchInsertNewPages(newPages);
    added = insertResult.processed;
    failed += insertResult.failed;
  }

  if (changedPages.length > 0) {
    console.log(`🔄 Updating ${changedPages.length} changed pages...`);
    const updateResult = await batchUpdateChangedPages(changedPages, existingPageMap);
    updated = updateResult.processed;
    failed += updateResult.failed;
  }

  if (unchangedPages.length > 0) {
    console.log(`⚪ Touching ${unchangedPages.length} unchanged pages (last_crawled only)...`);
    await batchTouchUnchangedPages(unchangedPages);
  }

  if (staleUrls.length > 0) {
    console.log(`🗑️  Removing ${staleUrls.length} stale pages...`);
    const removeResult = await batchRemoveStalePages(staleUrls);
    removed = removeResult.removed;
    failed += removeResult.failed;
  }

  const duration = Date.now() - startTime;
  console.log(`✅ Fixed sync completed in ${duration}ms:
    ✨ ${added} added
    🔄 ${updated} updated  
    ⚪ ${unchanged} unchanged
    🗑️  ${removed} removed (stale)
    ❌ ${failed} failed
  `);

  return { added, updated, unchanged, failed, removed };
}

/**
 * 🚀 MAIN OPTIMIZED SYNC FUNCTION - Now with sync history tracking instead of touching pages
 */
export async function syncPagesFromOnCrawlOptimized(
  projectId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<{ processed: number; failed: number; added: number; updated: number; unchanged: number; removed: number }> {
  const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
  
  console.log(`🚀 Starting OPTIMIZED sync from OnCrawl project: ${projectId}`);
  const overallStartTime = Date.now();
  
  // 1. Fetch raw data from OnCrawl
  console.log(`📡 Fetching data from OnCrawl...`);
  const fetchStartTime = Date.now();
  const { crawl, pages } = await client.getLatestAccessibleCrawlData(projectId);
  const fetchDuration = Date.now() - fetchStartTime;
  console.log(`📡 Fetched ${pages.length} pages from OnCrawl crawl: ${crawl.id} (${crawl.name || 'Unnamed crawl'}) in ${fetchDuration}ms`);
  
  // 2. OPTIMIZED filtering and processing
  console.log(`🔍 Starting optimized filtering...`);
  const filterStartTime = Date.now();
  const indexablePages = optimizedFilterPages(pages);
  const filterDuration = Date.now() - filterStartTime;
  console.log(`🔍 OPTIMIZED filtering completed: ${indexablePages.length} kept, ${pages.length - indexablePages.length} excluded in ${filterDuration}ms`);
  
  // 3. OPTIMIZED database sync with sync history tracking
  console.log(`💾 Starting optimized database sync...`);
  const syncStartTime = Date.now();
  const result = await optimizedSmartSync(indexablePages);
  const syncDuration = Date.now() - syncStartTime;
  
  const overallDuration = Date.now() - overallStartTime;
  const pagesPerSecond = overallDuration > 0 ? Math.round((result.added + result.updated + result.unchanged) / (overallDuration / 1000)) : 0;
  
  console.log(`🎉 OPTIMIZED sync completed in ${overallDuration}ms total:
    📡 OnCrawl fetch: ${fetchDuration}ms
    🔍 Filtering: ${filterDuration}ms (OPTIMIZED)
    💾 Database sync: ${syncDuration}ms (OPTIMIZED - no unnecessary page touching)
    ✨ ${result.added} added
    🔄 ${result.updated} updated
    ⚪ ${result.unchanged} unchanged
    🗑️  ${result.removed} removed (stale)
    ❌ ${result.failed} failed
    🚀 Performance: ${pagesPerSecond} pages/second (OPTIMIZED)
  `);
  
  // Report final progress
  if (onProgress) {
    onProgress(result.added + result.updated + result.unchanged, indexablePages.length);
  }
  
  return { 
    processed: result.added + result.updated + result.unchanged, 
    failed: result.failed,
    added: result.added,
    updated: result.updated,
    unchanged: result.unchanged,
    removed: result.removed
  };
}

// Keep legacy function for backwards compatibility (but mark as deprecated)
/**
 * @deprecated Use syncPagesFromOnCrawlOptimized instead for proper change detection and performance
 */
export async function syncPagesFromOnCrawl(
  projectId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<{ processed: number; failed: number }> {
  console.warn('⚠️  Using deprecated syncPagesFromOnCrawl. Use syncPagesFromOnCrawlOptimized for better performance!');
  const result = await syncPagesFromOnCrawlOptimized(projectId, onProgress);
  return { processed: result.processed, failed: result.failed };
}