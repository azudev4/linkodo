// src/lib/services/oncrawl/database-sync.ts
import { supabase } from '@/lib/db/client';
import { ProcessedOnCrawlPage, FilterStats } from '../types';
import { hasPageChanged } from './page-normalizer';

/**
 * Fetch existing pages for comparison
 */
export async function optimizedFetchExistingPages(): Promise<Map<string, any>> {
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
 * Fetch existing pages for comparison - URL-only mode (much faster)
 */
export async function optimizedFetchExistingUrlsOnly(): Promise<Set<string>> {
  console.log(`🔍 Fetching ALL existing page URLs only...`);
  const startTime = Date.now();
  
  const { count, error: countError } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error(`❌ Error getting page count:`, countError);
    throw new Error(`Failed to get page count: ${countError.message}`);
  }
  
  console.log(`📊 Database contains ${count} total pages`);
  
  const allUrls: string[] = [];
  const batchSize = 2000; // Larger batch size for URL-only
  const totalPages = count || 0;
  
  for (let offset = 0; offset < totalPages; offset += batchSize) {
    const batchEnd = Math.min(offset + batchSize - 1, totalPages - 1);
    
    const { data: batch, error } = await supabase
      .from('pages')
      .select('url')  // Only fetch URLs!
      .range(offset, batchEnd)
      .limit(batchSize);
    
    if (error) {
      console.error(`❌ Error fetching URL batch ${offset}-${batchEnd}:`, error);
      throw new Error(`Failed to fetch URLs batch: ${error.message}`);
    }
    
    if (batch && batch.length > 0) {
      allUrls.push(...batch.map(p => p.url));
      const batchNum = Math.floor(offset / batchSize) + 1;
      const totalBatches = Math.ceil(totalPages / batchSize);
      console.log(`🔍 Fetched URL batch ${batchNum}/${totalBatches}: ${batch.length} URLs (total: ${allUrls.length}/${totalPages})`);
    }
  }
  
  const urlSet = new Set(allUrls);
  const duration = Date.now() - startTime;
  console.log(`🔍 Successfully fetched ${urlSet.size}/${totalPages} existing URLs in ${duration}ms`);
  
  return urlSet;
}

/**
 * Batch insert new pages
 */
export async function batchInsertNewPages(
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
export async function batchUpdateChangedPages(
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
export async function batchRemoveStalePages(
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
 * Enhanced smart sync with content filtering statistics
 */
export async function optimizedSmartSync(
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
 * Optimized URL-only sync - much faster as it skips content comparison
 */
export async function optimizedUrlOnlySync(
  pages: ProcessedOnCrawlPage[], 
  syncHistoryId: number,
  filterStats: FilterStats
): Promise<{
  added: number; updated: number; unchanged: number; failed: number; removed: number;
  filteredNoContent: number; filteredUrlPatterns: number; filteredForumContent: number;
}> {
  console.log(`⚡ Starting URL-ONLY sync for ${pages.length} pages (sync history: ${syncHistoryId})...`);
  const startTime = Date.now();
  
  // Only fetch URLs from database - much faster!
  const existingUrls = await optimizedFetchExistingUrlsOnly();
  
  console.log(`📊 Database state: ${existingUrls.size} existing URLs, processing ${pages.length} filtered pages`);
  
  // Categorize pages based on URL presence only
  const currentUrls = new Set(pages.map(p => p.url));
  const newPages: ProcessedOnCrawlPage[] = [];
  let existingPages: ProcessedOnCrawlPage[] = [];
  
  for (const page of pages) {
    if (!existingUrls.has(page.url)) {
      newPages.push(page);
    } else {
      existingPages.push(page);
    }
  }
  
  const staleUrls = Array.from(existingUrls).filter(url => !currentUrls.has(url));
  
  console.log(`📊 URL-only categorization (sync history: ${syncHistoryId}):
    ✨ ${newPages.length} new pages (will be inserted)
    🔄 ${existingPages.length} existing pages (will be updated with fresh data)
    🗑️  ${staleUrls.length} stale pages (will be removed)
  `);

  let added = 0, updated = 0, unchanged = 0, failed = 0, removed = 0;

  // Insert new pages
  if (newPages.length > 0) {
    console.log(`📥 Inserting ${newPages.length} new pages (sync ${syncHistoryId})...`);
    const insertResult = await batchInsertNewPages(newPages);
    added = insertResult.processed;
    failed += insertResult.failed;
  }

  // Update existing pages with fresh OnCrawl data (no change detection)
  if (existingPages.length > 0) {
    console.log(`🔄 Updating ${existingPages.length} existing pages with fresh data (sync ${syncHistoryId})...`);
    const updateResult = await batchUpdateExistingPagesUrlOnly(existingPages);
    updated = updateResult.processed;
    failed += updateResult.failed;
  }

  // Remove stale pages
  if (staleUrls.length > 0) {
    console.log(`🗑️  Removing ${staleUrls.length} stale pages (sync ${syncHistoryId})...`);
    const removeResult = await batchRemoveStalePages(staleUrls);
    removed = removeResult.removed;
    failed += removeResult.failed;
  }

  const duration = Date.now() - startTime;
  console.log(`⚡ URL-only sync completed in ${duration}ms (sync history: ${syncHistoryId}):
    ✨ ${added} added
    🔄 ${updated} updated with fresh data
    ⚪ ${unchanged} unchanged (N/A in URL-only mode)
    🗑️  ${removed} removed (stale)
    ❌ ${failed} failed
  `);

  return { 
    added, 
    updated, 
    unchanged: 0, // Always 0 in URL-only mode since we don't do change detection
    failed, 
    removed,
    filteredNoContent: filterStats.filteredNoContent,
    filteredUrlPatterns: filterStats.filteredUrlPatterns,
    filteredForumContent: filterStats.filteredForumContent
  };
}

/**
 * Batch update existing pages with fresh data (no change detection)
 */
export async function batchUpdateExistingPagesUrlOnly(
  pages: ProcessedOnCrawlPage[],
  batchSize: number = 500
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
        // Keep existing embedding, just update other data
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('pages')
        .upsert(batchData, {
          onConflict: 'url',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ Update existing pages batch failed:`, error);
        failed += batch.length;
      } else {
        processed += batch.length;
        console.log(`🔄 Existing pages batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pages.length / batchSize)} updated with fresh data`);
      }

    } catch (error) {
      console.error(`❌ Update existing pages batch error:`, error);
      failed += batch.length;
    }
  }

  return { processed, failed };
}