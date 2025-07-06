// src/lib/services/oncrawl/processor.ts - FIXED VERSION

import { OnCrawlPage, OnCrawlClient } from './client';
import { supabase } from '@/lib/db/client';
import { shouldExcludeUrl, getExclusionReason } from '@/lib/utils/linkfilter';

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
  const parsed = parseFloat(value);  // ✅ Fixed: was parseInt, now parseFloat
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
 * Check if a page has actually changed compared to existing data
 */
function hasPageChanged(existing: any, newPage: ProcessedOnCrawlPage): boolean {
  // Compare all relevant fields that come from OnCrawl
  return (
    existing.title !== newPage.title ||
    existing.meta_description !== newPage.metaDescription ||
    existing.h1 !== newPage.h1 ||
    existing.word_count !== newPage.wordCount ||
    existing.category !== newPage.category ||
    existing.depth !== newPage.depth ||
    existing.inrank_decimal !== newPage.inrankDecimal ||
    existing.internal_outlinks !== newPage.internalOutlinks ||
    existing.nb_inlinks !== newPage.nbInlinks
  );
}

/**
 * 🔧 FIXED: Smart change detection sync with stale page cleanup
 */
async function smartChangeDetectionSyncWithCleanup(
  pages: ProcessedOnCrawlPage[]
): Promise<{ added: number; updated: number; unchanged: number; failed: number; removed: number }> {
  console.log(`🧠 Starting SMART sync with change detection for ${pages.length} pages...`);
  const startTime = Date.now();
  
  // Step 1: 🔧 FIXED - Get ALL existing pages with pagination (Supabase limits to 1000 by default)
  console.log(`🔍 Fetching ALL existing pages from database...`);
  
  const allExistingPages: any[] = [];
  let hasMore = true;
  let offset = 0;
  const batchSize = 1000;
  
  while (hasMore) {
    const { data: batch, error: fetchError } = await supabase
      .from('pages')
      .select('url, title, meta_description, h1, word_count, category, depth, inrank_decimal, internal_outlinks, nb_inlinks, embedding, last_crawled')
      .range(offset, offset + batchSize - 1);
    
    if (fetchError) {
      console.error(`❌ Error fetching existing pages batch:`, fetchError);
      throw new Error(`Failed to fetch existing pages: ${fetchError.message}`);
    }
    
    if (batch && batch.length > 0) {
      allExistingPages.push(...batch);
      console.log(`🔍 Fetched batch ${Math.floor(offset / batchSize) + 1}: ${batch.length} pages (total: ${allExistingPages.length})`);
      
      if (batch.length < batchSize) {
        hasMore = false; // Last batch
      } else {
        offset += batchSize;
      }
    } else {
      hasMore = false;
    }
  }
  
  console.log(`🔍 Found ${allExistingPages.length} total pages in database`);
  
  // Create maps for efficient lookups
  const existingPageMap = new Map();
  const allExistingUrls = new Set();
  
  allExistingPages.forEach(page => {
    existingPageMap.set(page.url, page);
    allExistingUrls.add(page.url);
  });
  
  // Step 2: Categorize current OnCrawl pages
  const currentOnCrawlUrls = new Set(pages.map(p => p.url));
  const newPages: ProcessedOnCrawlPage[] = [];
  const changedPages: ProcessedOnCrawlPage[] = [];
  const unchangedPages: ProcessedOnCrawlPage[] = [];
  
  for (const page of pages) {
    const existing = existingPageMap.get(page.url);
    
    if (!existing) {
      // Page doesn't exist - it's new
      newPages.push(page);
    } else {
      // Page exists - check if anything changed
      if (hasPageChanged(existing, page)) {
        changedPages.push(page);
      } else {
        unchangedPages.push(page);
      }
    }
  }
  
  // Step 3: 🔧 FIXED - Find stale pages (in DB but not in current OnCrawl)
  const staleUrls = Array.from(allExistingUrls).filter((url): url is string => typeof url === 'string' && !currentOnCrawlUrls.has(url));
  
  console.log(`📊 Smart analysis:
    ✨ ${newPages.length} new pages
    🔄 ${changedPages.length} changed pages  
    ⚪ ${unchangedPages.length} unchanged pages
    🗑️  ${staleUrls.length} stale pages (will be removed)
  `);

  let added = 0;
  let updated = 0;
  let unchanged = unchangedPages.length;
  let failed = 0;
  let removed = 0;

  // Step 4: Insert new pages
  if (newPages.length > 0) {
    console.log(`📥 Inserting ${newPages.length} new pages...`);
    const insertResult = await batchInsertNewPages(newPages);
    added = insertResult.processed;
    failed += insertResult.failed;
  }

  // Step 5: Update only changed pages (preserve embeddings)
  if (changedPages.length > 0) {
    console.log(`🔄 Updating ${changedPages.length} changed pages...`);
    const updateResult = await batchUpdateChangedPages(changedPages, existingPageMap);
    updated = updateResult.processed;
    failed += updateResult.failed;
  }

  // Step 6: Touch unchanged pages (update last_crawled only)
  if (unchangedPages.length > 0) {
    console.log(`⚪ Touching ${unchangedPages.length} unchanged pages (last_crawled only)...`);
    await batchTouchUnchangedPages(unchangedPages);
  }

  // Step 7: 🔧 FIXED - Remove stale pages
  if (staleUrls.length > 0) {
    console.log(`🗑️  Removing ${staleUrls.length} stale pages...`);
    const removeResult = await batchRemoveStalePages(staleUrls);
    removed = removeResult.removed;
    failed += removeResult.failed;
  }

  const duration = Date.now() - startTime;
  console.log(`✅ Smart sync with cleanup completed in ${duration}ms:
    ✨ ${added} added
    🔄 ${updated} updated  
    ⚪ ${unchanged} unchanged
    🗑️  ${removed} removed (stale)
    ❌ ${failed} failed
  `);

  return { added, updated, unchanged, failed, removed };
}

/**
 * 🔧 NEW: Remove stale pages that are no longer in OnCrawl
 */
async function batchRemoveStalePages(
  staleUrls: string[],
  batchSize: number = 100
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
 * Batch insert completely new pages
 */
async function batchInsertNewPages(
  pages: ProcessedOnCrawlPage[],
  batchSize: number = 100
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

      // Batch insert (faster than upsert for new records)
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
  batchSize: number = 50
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
 * Batch update last_crawled timestamp for unchanged pages (minimal update)
 */
async function batchTouchUnchangedPages(
  pages: ProcessedOnCrawlPage[],
  batchSize: number = 200
): Promise<void> {
  const now = new Date().toISOString();
  
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    const urls = batch.map(p => p.url);
    
    try {
      // Only update last_crawled (minimal database operation)
      const { error } = await supabase
        .from('pages')
        .update({ 
          last_crawled: now
          // Note: NOT updating updated_at since content didn't actually change
        })
        .in('url', urls);

      if (error) {
        console.error(`❌ Touch unchanged pages batch failed:`, error);
      } else {
        console.log(`⚪ Touched unchanged batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pages.length / batchSize)}`);
      }

    } catch (error) {
      console.error(`❌ Touch unchanged pages batch error:`, error);
    }
  }
}

/**
 * 🔧 FIXED: Main sync function now uses smart change detection with cleanup
 */
export async function syncPagesFromOnCrawlOptimized(
  projectId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<{ processed: number; failed: number; added: number; updated: number; unchanged: number; removed: number }> {
  const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
  
  console.log(`🚀 Starting SMART sync with change detection from OnCrawl project: ${projectId}`);
  const overallStartTime = Date.now();
  
  // 1. Fetch raw data from OnCrawl
  console.log(`📡 Fetching data from OnCrawl...`);
  const fetchStartTime = Date.now();
  const { crawl, pages } = await client.getLatestAccessibleCrawlData(projectId);
  const fetchDuration = Date.now() - fetchStartTime;
  console.log(`📡 Fetched ${pages.length} pages from OnCrawl crawl: ${crawl.id} (${crawl.name || 'Unnamed crawl'}) in ${fetchDuration}ms`);
  
  // 2. Filter and process pages
  console.log(`🔍 Filtering pages...`);
  const filterStartTime = Date.now();
  
  const indexablePages = pages.filter(page => {
    const url = page.url;
    const metaDescription = page.meta_description ?? undefined;
    
    if (!url) return false;
    if (shouldExcludeUrl(url, metaDescription)) return false;
    
    const statusCode = page.status_code ? parseInt(page.status_code) : null;
    if (statusCode && statusCode !== 200) return false;
    
    return true;
  }).map(page => processOnCrawlPage(page));
  
  const filterDuration = Date.now() - filterStartTime;
  console.log(`🔍 Filtered to ${indexablePages.length} indexable pages (excluded ${pages.length - indexablePages.length}) in ${filterDuration}ms`);
  
  // 3. 🔧 FIXED: Use smart sync with change detection and cleanup
  console.log(`💾 Starting SMART database sync with change detection...`);
  const syncStartTime = Date.now();
  const result = await smartChangeDetectionSyncWithCleanup(indexablePages);
  const syncDuration = Date.now() - syncStartTime;
  
  const overallDuration = Date.now() - overallStartTime;
  
  console.log(`🎉 SMART sync completed in ${overallDuration}ms total:
    📡 OnCrawl fetch: ${fetchDuration}ms
    🔍 Filtering: ${filterDuration}ms  
    💾 Database sync: ${syncDuration}ms
    ✨ ${result.added} added
    🔄 ${result.updated} updated
    ⚪ ${result.unchanged} unchanged
    🗑️  ${result.removed} removed (stale)
    ❌ ${result.failed} failed
    🚀 Performance: ${Math.round((result.added + result.updated + result.unchanged) / (overallDuration / 1000))} pages/second
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
 * @deprecated Use syncPagesFromOnCrawlOptimized instead for proper change detection
 */
export async function syncPagesFromOnCrawl(
  projectId: string,
  onProgress?: (processed: number, total: number) => void
): Promise<{ processed: number; failed: number }> {
  console.warn('⚠️  Using deprecated syncPagesFromOnCrawl. Use syncPagesFromOnCrawlOptimized for proper change detection!');
  const result = await syncPagesFromOnCrawlOptimized(projectId, onProgress);
  return { processed: result.processed, failed: result.failed };
}