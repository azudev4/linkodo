// src/lib/services/oncrawl/processor.ts - Corrected version

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
  
  console.log('🔍 DEBUG: Processing page:', { 
    url, 
    title, 
    h1, 
    wordCount,
    depth,
    inrankDecimal,
    internalOutlinks,
    nbInlinks,
    category
  });

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
 * Store processed page in database
 * Only store what we actually have from OnCrawl
 */
export async function storeOnCrawlPage(page: ProcessedOnCrawlPage): Promise<void> {
  const { error } = await supabase
    .from('pages')
    .upsert({
      url: page.url,
      title: page.title,
      meta_description: page.metaDescription,
      h1: page.h1,
      word_count: page.wordCount,
      category: page.category,
      
      // SEO metrics for linking strategy
      depth: page.depth,
      inrank_decimal: page.inrankDecimal,
      internal_outlinks: page.internalOutlinks,
      nb_inlinks: page.nbInlinks,
      
      // Will be generated later in batch
      embedding: null,
      last_crawled: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'url'
    });

  if (error) {
    throw new Error(`Failed to store page: ${error.message}`);
  }
}

/**
 * Main sync function - orchestrates the full process
 * This is why we have a processor: business logic coordination
 */
export async function syncPagesFromOnCrawl(
  projectId: string,  // Takes projectId to get latest accessible crawl
  onProgress?: (processed: number, total: number) => void
): Promise<{ processed: number; failed: number }> {
  const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
  
  console.log(`Starting sync from OnCrawl project: ${projectId}`);
  
  // 1. Fetch raw data from OnCrawl (client responsibility)
  const { crawl, pages } = await client.getLatestAccessibleCrawlData(projectId);
  console.log(`Found ${pages.length} pages in OnCrawl crawl: ${crawl.id} (${crawl.name || 'Unnamed crawl'})`);
  
  // 2. Apply business rules - filter excludable pages (processor responsibility)
  const indexablePages = pages.filter(page => {
    const url = page.url;
    const metaDescription = page.meta_description ?? undefined;
    
    if (!url) {
      console.log('Excluding page: No URL provided');
      return false;
    }
    
    // Business rule: Check URL patterns and meta description
    const shouldExcludeByUrl = shouldExcludeUrl(url, metaDescription);
    if (shouldExcludeByUrl) {
      const reason = getExclusionReason(url, metaDescription);
      console.log(`Excluding page: ${url} - ${reason}`);
      return false;
    }
    
    // Business rule: Only index 200 status codes
    const statusCode = page.status_code ? parseInt(page.status_code) : null;
    if (statusCode && statusCode !== 200) {
      console.log(`Excluding page: ${url} - Status code: ${statusCode}`);
      return false;
    }
    
    return true;
  });
  
  console.log(`Filtered to ${indexablePages.length} indexable pages (excluded ${pages.length - indexablePages.length})`);
  
  // 3. Transform and store data (processor responsibility)
  let processed = 0;
  let failed = 0;
  
  for (const page of indexablePages) {
    try {
      const processedPage = processOnCrawlPage(page);
      await storeOnCrawlPage(processedPage);
      processed++;
      
      if (onProgress) {
        onProgress(processed, indexablePages.length);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`Failed to process page ${page.url}:`, error);
      failed++;
    }
  }
  
  console.log(`Sync completed: ${processed} processed, ${failed} failed`);
  return { processed, failed };
}