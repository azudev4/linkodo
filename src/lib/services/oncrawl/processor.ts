// src/lib/services/oncrawl/processor.ts
import { OnCrawlPage, OnCrawlClient } from './client';
import { supabase } from '@/lib/db/client';
import { filterStopWords } from '@/lib/utils/stopwords';
import { shouldExcludeUrl, getExclusionReason } from '@/lib/utils/linkfilter';

export interface ProcessedOnCrawlPage {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h2Tags: string[];
  h3Tags: string[];
  primaryKeywords: string[];
  wordCount: number;
  contentSnippet: string | null;
}

/**
 * Extract keywords from page content
 */
function extractKeywords(content: string | null, title: string | null, h1: string | null): string[] {
  if (!content && !title && !h1) return [];
  
  const textToAnalyze = [title, h1, content].filter(Boolean).join(' ');
  
  const words = textToAnalyze
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüÿç]/gi, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  // Use the new stop words utility
  const filteredWords = filterStopWords(words);

  const wordFreq = filteredWords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 15)
    .map(([word]) => word);
}

/**
 * Extract content snippet from title and meta description
 */
function extractContentSnippet(title: string | null, metaDescription: string | null): string | null {
  const content = [title, metaDescription].filter(Boolean).join(' - ');
  
  if (!content) return null;
  
  const cleaned = content
    .replace(/[*_`]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (cleaned.length <= 200) return cleaned;
  
  const truncated = cleaned.substring(0, 200);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 150 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Process OnCrawl page data to our standard format
 */
export function processOnCrawlPage(page: OnCrawlPage): ProcessedOnCrawlPage {
  // Map OnCrawl API fields to our internal structure
  const url = page.url;
  const title = page.title;
  const h1 = page.h1;
  const metaDescription = page.meta_description;
  const statusCode = page.status_code ? parseInt(page.status_code) : null;
  const wordCount = page.word_count ? parseInt(page.word_count) : 0;
  
  console.log('🔍 DEBUG: Processing page:', { url, title, h1, statusCode, wordCount });
  
  // Since OnCrawl API doesn't have h2/h3 tags, we'll extract keywords from available content
  const primaryKeywords = extractKeywords(null, title, h1);
  const contentSnippet = extractContentSnippet(title, metaDescription);

  return {
    url,
    title,
    metaDescription,
    h1,
    h2Tags: [], // Not available in OnCrawl API response
    h3Tags: [], // Not available in OnCrawl API response
    primaryKeywords,
    wordCount,
    contentSnippet
  };
}

/**
 * Store processed page in database
 */
export async function storeOnCrawlPage(page: ProcessedOnCrawlPage): Promise<void> {
  const { error } = await supabase
    .from('pages')
    .upsert({
      url: page.url,
      title: page.title,
      meta_description: page.metaDescription,
      h1: page.h1,
      h2_tags: page.h2Tags,
      h3_tags: page.h3Tags,
      primary_keywords: page.primaryKeywords,
      word_count: page.wordCount,
      content_snippet: page.contentSnippet,
      embedding: null, // Generated later in batch
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
 * Sync all pages from OnCrawl crawl to database
 */
export async function syncPagesFromOnCrawl(
  crawlId: string, 
  onProgress?: (processed: number, total: number) => void
): Promise<{ processed: number; failed: number }> {
  const client = new OnCrawlClient(process.env.ONCRAWL_API_TOKEN!);
  
  console.log(`Starting sync from OnCrawl crawl: ${crawlId}`);
  
  // Get all pages from OnCrawl
  const pages = await client.getAllPages(crawlId);
  console.log(`Found ${pages.length} pages in OnCrawl crawl`);
  
  // Filter out pages that shouldn't be indexed
  const indexablePages = pages.filter(page => {
    const url = page.url;
    
    if (!url) {
      console.log('Excluding page: No URL provided');
      return false;
    }
    
    // Check URL patterns first
    const shouldExcludeByUrl = shouldExcludeUrl(url);
    if (shouldExcludeByUrl) {
      const reason = getExclusionReason(url);
      console.log(`Excluding page: ${url} - ${reason}`);
      return false;
    }
    
    // Check status code - only index 200 or empty/null status codes
    const statusCode = page.status_code ? parseInt(page.status_code) : null;
    if (statusCode && statusCode !== 200) {
      console.log(`Excluding page: ${url} - Status code: ${statusCode}`);
      return false;
    }
    
    return true;
  });
  
  console.log(`Filtered to ${indexablePages.length} indexable pages (excluded ${pages.length - indexablePages.length})`);
  
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
      
      // Small delay to avoid overwhelming database
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`Failed to process page ${page.url}:`, error);
      failed++;
    }
  }
  
  console.log(`Sync completed: ${processed} processed, ${failed} failed`);
  return { processed, failed };
}