// src/lib/services/oncrawl/processing/database-sync.ts - OPTIMIZED VERSION
import { supabase } from '@/lib/db/client';
import { ProcessedOnCrawlPage, FilterStats } from '../types';
import { hasPageChanged } from './page-normalizer';

/**
 * Efficiently fetch existing pages for change detection
 */
export async function fetchExistingPagesOptimized(projectName: string): Promise<Map<string, any>> {
  console.log(`🔍 Fetching existing pages for project "${projectName}" for change detection...`);
  const startTime = Date.now();
  
  const { count, error: countError } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true })
    .eq('project_name', projectName);
  
  if (countError) {
    throw new Error(`Failed to get page count: ${countError.message}`);
  }
  
  const totalPages = count || 0;
  console.log(`📊 Database contains ${totalPages} total pages for project "${projectName}"`);
  
  if (totalPages === 0) {
    return new Map();
  }
  
  const allPages: any[] = [];
  const batchSize = 1000; // Match Supabase limit
  
  for (let offset = 0; offset < totalPages; offset += batchSize) {
    const { data: batch, error } = await supabase
      .from('pages')
      .select('url, title, meta_description, h1, word_count, category, depth, inrank_decimal, internal_outlinks, nb_inlinks, embedding')
      .eq('project_name', projectName)
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      throw new Error(`Failed to fetch pages batch: ${error.message}`);
    }
    
    if (batch?.length) {
      allPages.push(...batch);
      console.log(`🔍 Fetched ${allPages.length}/${totalPages} pages`);
    }
  }
  
  const pageMap = new Map();
  allPages.forEach(page => pageMap.set(page.url, page));
  
  const duration = Date.now() - startTime;
  console.log(`✅ Fetched ${pageMap.size} existing pages in ${duration}ms`);
  
  return pageMap;
}

/**
 * Categorize pages into new, changed, unchanged, and stale
 */
export function categorizePagesOptimized(
  filteredPages: ProcessedOnCrawlPage[],
  existingPageMap: Map<string, any>
): {
  newPages: ProcessedOnCrawlPage[];
  changedPages: ProcessedOnCrawlPage[];
  unchangedPages: ProcessedOnCrawlPage[];
  staleUrls: string[];
} {
  console.log(`📊 Categorizing ${filteredPages.length} filtered pages vs ${existingPageMap.size} existing pages...`);
  
  const currentUrls = new Set(filteredPages.map(p => p.url));
  const newPages: ProcessedOnCrawlPage[] = [];
  const changedPages: ProcessedOnCrawlPage[] = [];
  const unchangedPages: ProcessedOnCrawlPage[] = [];
  
  // Categorize filtered pages
  for (const page of filteredPages) {
    const existing = existingPageMap.get(page.url);
    
    if (!existing) {
      newPages.push(page);
    } else if (hasPageChanged(existing, page)) {
      changedPages.push(page);
    } else {
      unchangedPages.push(page);
    }
  }
  
  // Find stale URLs (in DB but not in current crawl)
  const staleUrls = Array.from(existingPageMap.keys()).filter(url => !currentUrls.has(url));
  
  console.log(`📊 Categorization results:
    ✨ ${newPages.length} new pages
    🔄 ${changedPages.length} changed pages  
    ⚪ ${unchangedPages.length} unchanged pages
    🗑️  ${staleUrls.length} stale pages
  `);
  
  return { newPages, changedPages, unchangedPages, staleUrls };
}

/**
 * Direct insert new pages (no upsert overhead)
 */
export async function directInsertNewPages(
  pages: ProcessedOnCrawlPage[],
  projectName: string,
  batchSize: number = 500
): Promise<{ inserted: number; failed: number }> {
  if (pages.length === 0) return { inserted: 0, failed: 0 };
  
  console.log(`📥 Direct inserting ${pages.length} new pages for project "${projectName}"...`);
  let inserted = 0;
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
        project_name: projectName,
        updated_at: new Date().toISOString()
      }));

      const { error, count } = await supabase
        .from('pages')
        .insert(batchData);

      if (error) {
        console.error(`❌ Insert batch failed:`, error.message);
        failed += batch.length;
      } else {
        const actualInserted = count || batch.length;
        inserted += actualInserted;
        console.log(`📥 Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pages.length / batchSize)}: ${actualInserted} pages`);
      }
    } catch (error: any) {
      console.error(`❌ Insert batch error:`, error.message);
      failed += batch.length;
    }
  }
  
  return { inserted, failed };
}

/**
 * Direct update changed pages (no upsert overhead)
 */
export async function directUpdateChangedPages(
  pages: ProcessedOnCrawlPage[],
  existingPageMap: Map<string, any>,
  projectName: string,
  batchSize: number = 200
): Promise<{ updated: number; failed: number }> {
  if (pages.length === 0) return { updated: 0, failed: 0 };
  
  console.log(`🔄 Direct updating ${pages.length} changed pages for project "${projectName}"...`);
  let updated = 0;
  let failed = 0;
  
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);
    
    try {
      // Use individual updates to preserve embeddings
      const updatePromises = batch.map(async (page) => {
        const existing = existingPageMap.get(page.url);
        
        // Check if content changed (invalidates embedding)
        const titleChanged = existing?.title !== page.title;
        const h1Changed = existing?.h1 !== page.h1;
        const metaChanged = existing?.meta_description !== page.metaDescription;
        const contentChanged = titleChanged || h1Changed || metaChanged;

        const { error } = await supabase
          .from('pages')
          .update({
            title: page.title,
            meta_description: page.metaDescription,
            h1: page.h1,
            word_count: page.wordCount,
            category: page.category,
            depth: page.depth,
            inrank_decimal: page.inrankDecimal,
            internal_outlinks: page.internalOutlinks,
            nb_inlinks: page.nbInlinks,
            // Clear embedding if content changed
            embedding: contentChanged ? null : existing?.embedding,
            updated_at: new Date().toISOString()
          })
          .eq('project_name', projectName)
          .eq('url', page.url);
        
        return { success: !error, error };
      });
      
      const results = await Promise.all(updatePromises);
      const batchUpdated = results.filter(r => r.success).length;
      const batchFailed = results.filter(r => !r.success).length;
      
      updated += batchUpdated;
      failed += batchFailed;
      
      console.log(`🔄 Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pages.length / batchSize)}: ${batchUpdated}/${batch.length} pages`);
      
    } catch (error: any) {
      console.error(`❌ Update batch error:`, error.message);
      failed += batch.length;
    }
  }
  
  return { updated, failed };
}

/**
 * Direct delete stale pages
 */
export async function directDeleteStalePages(
  staleUrls: string[],
  projectName: string,
  batchSize: number = 500
): Promise<{ deleted: number; failed: number }> {
  if (staleUrls.length === 0) return { deleted: 0, failed: 0 };
  
  console.log(`🗑️  Direct deleting ${staleUrls.length} stale pages for project "${projectName}"...`);
  let deleted = 0;
  let failed = 0;
  
  for (let i = 0; i < staleUrls.length; i += batchSize) {
    const batch = staleUrls.slice(i, i + batchSize);
    
    try {
      const { error, count } = await supabase
        .from('pages')
        .delete()
        .eq('project_name', projectName)
        .in('url', batch);

      if (error) {
        console.error(`❌ Delete batch failed:`, error.message);
        failed += batch.length;
      } else {
        const actualDeleted = count || batch.length;
        deleted += actualDeleted;
        console.log(`🗑️  Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(staleUrls.length / batchSize)}: ${actualDeleted} pages`);
      }
    } catch (error: any) {
      console.error(`❌ Delete batch error:`, error.message);
      failed += batch.length;
    }
  }
  
  return { deleted, failed };
}

/**
 * Optimized smart sync with direct operations
 */
export async function optimizedSmartSync(
  filteredPages: ProcessedOnCrawlPage[],
  syncHistoryId: number,
  projectName: string,
  filterStats: FilterStats
): Promise<{
  added: number; updated: number; unchanged: number; failed: number; removed: number;
  filteredNoContent: number; filteredUrlPatterns: number; filteredForumContent: number;
}> {
  console.log(`🚀 Starting optimized smart sync for ${filteredPages.length} pages (project: "${projectName}", sync history: ${syncHistoryId})...`);
  const startTime = Date.now();
  
  // 1. Fetch existing pages efficiently
  const existingPageMap = await fetchExistingPagesOptimized(projectName);
  
  // 2. Categorize pages
  const { newPages, changedPages, unchangedPages, staleUrls } = categorizePagesOptimized(
    filteredPages, 
    existingPageMap
  );
  
  // 3. Execute direct operations
  const [insertResult, updateResult, deleteResult] = await Promise.all([
    directInsertNewPages(newPages, projectName),
    directUpdateChangedPages(changedPages, existingPageMap, projectName),
    directDeleteStalePages(staleUrls, projectName)
  ]);
  
  const duration = Date.now() - startTime;
  
  console.log(`✅ Optimized smart sync completed in ${duration}ms (project: "${projectName}", sync history: ${syncHistoryId}):
    ✨ ${insertResult.inserted} added
    🔄 ${updateResult.updated} updated
    ⚪ ${unchangedPages.length} unchanged (skipped)
    🗑️  ${deleteResult.deleted} removed
    ❌ ${insertResult.failed + updateResult.failed + deleteResult.failed} failed
  `);
  
  return {
    added: insertResult.inserted,
    updated: updateResult.updated,
    unchanged: unchangedPages.length,
    failed: insertResult.failed + updateResult.failed + deleteResult.failed,
    removed: deleteResult.deleted,
    filteredNoContent: filterStats.filteredNoContent,
    filteredUrlPatterns: filterStats.filteredUrlPatterns,
    filteredForumContent: filterStats.filteredForumContent
  };
}

/**
 * Fetch only URLs from database (fast, no content)
 */
export async function fetchExistingUrlsOnly(projectName: string): Promise<Set<string>> {
  console.log(`⚡ Fetching existing URLs only (no content) for project "${projectName}"...`);
  const startTime = Date.now();
  
  const { count, error: countError } = await supabase
    .from('pages')
    .select('*', { count: 'exact', head: true })
    .eq('project_name', projectName);
  
  if (countError) {
    throw new Error(`Failed to get page count: ${countError.message}`);
  }
  
  const totalPages = count || 0;
  console.log(`📊 Database contains ${totalPages} total pages for project "${projectName}"`);
  
  if (totalPages === 0) {
    return new Set();
  }
  
  const allUrls: string[] = [];
  const batchSize = 1000;
  
  for (let offset = 0; offset < totalPages; offset += batchSize) {
    const { data: batch, error } = await supabase
      .from('pages')
      .select('url')  // Only URLs - no content!
      .eq('project_name', projectName)
      .range(offset, offset + batchSize - 1);
    
    if (error) {
      throw new Error(`Failed to fetch URLs batch: ${error.message}`);
    }
    
    if (batch?.length) {
      allUrls.push(...batch.map(p => p.url));
      console.log(`⚡ Fetched ${allUrls.length}/${totalPages} URLs`);
    }
  }
  
  const duration = Date.now() - startTime;
  console.log(`✅ Fetched ${allUrls.length} URLs in ${duration}ms`);
  
  return new Set(allUrls);
}

/**
 * True URL-only sync - no content comparison
 */
export async function optimizedUrlOnlySync(
  filteredPages: ProcessedOnCrawlPage[],
  syncHistoryId: number,
  projectName: string,
  filterStats: FilterStats
): Promise<{
  added: number; updated: number; unchanged: number; failed: number; removed: number;
  filteredNoContent: number; filteredUrlPatterns: number; filteredForumContent: number;
}> {
  console.log(`⚡ Starting TRUE URL-only sync for ${filteredPages.length} pages (project: "${projectName}", sync history: ${syncHistoryId})...`);
  const startTime = Date.now();
  
  // 1. Fetch only URLs (no content) - much faster
  const existingUrls = await fetchExistingUrlsOnly(projectName);
  
  // 2. Simple URL set comparison
  const currentUrls = new Set(filteredPages.map(p => p.url));
  const newPages = filteredPages.filter(p => !existingUrls.has(p.url));
  const staleUrls = Array.from(existingUrls).filter(url => !currentUrls.has(url));
  
  console.log(`⚡ URL-only categorization:
    ✨ ${newPages.length} new URLs to add
    🗑️  ${staleUrls.length} stale URLs to remove
    ⚪ ${filteredPages.length - newPages.length} existing URLs (no action)
  `);
  
  // 3. Only INSERT and DELETE - never UPDATE
  const [insertResult, deleteResult] = await Promise.all([
    directInsertNewPages(newPages, projectName),
    directDeleteStalePages(staleUrls, projectName)
  ]);
  
  const duration = Date.now() - startTime;
  
  console.log(`⚡ TRUE URL-only sync completed in ${duration}ms (project: "${projectName}", sync history: ${syncHistoryId}):
    ✨ ${insertResult.inserted} added
    🔄 0 updated (URL-only mode never updates)
    ⚪ ${filteredPages.length - newPages.length} unchanged
    🗑️  ${deleteResult.deleted} removed
    ❌ ${insertResult.failed + deleteResult.failed} failed
  `);
  
  return {
    added: insertResult.inserted,
    updated: 0, // URL-only never updates existing records
    unchanged: filteredPages.length - newPages.length,
    failed: insertResult.failed + deleteResult.failed,
    removed: deleteResult.deleted,
    filteredNoContent: filterStats.filteredNoContent,
    filteredUrlPatterns: filterStats.filteredUrlPatterns,
    filteredForumContent: filterStats.filteredForumContent
  };
}