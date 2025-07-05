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
 * Extract content snippet from full content
 */
function extractContentSnippet(content: string | null): string | null {
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
  // Convert h2/h3 strings to arrays if they're not already
  const h2Tags = Array.isArray(page.h2) ? page.h2 : (page.h2 ? [page.h2] : []);
  const h3Tags = Array.isArray(page.h3) ? page.h3 : (page.h3 ? [page.h3] : []);
  
  const primaryKeywords = extractKeywords(page.content, page.title, page.h1);
  const contentSnippet = extractContentSnippet(page.content);

  return {
    url: page.url,
    title: page.title,
    metaDescription: page.meta_description,
    h1: page.h1,
    h2Tags,
    h3Tags,
    primaryKeywords,
    wordCount: page.word_count || 0,
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
    // Check URL patterns first
    const shouldExcludeByUrl = shouldExcludeUrl(page.url);
    if (shouldExcludeByUrl) {
      const reason = getExclusionReason(page.url);
      console.log(`Excluding page: ${page.url} - ${reason}`);
      return false;
    }
    
    // Check status code - only index 200 or empty/null status codes
    if (page.status_code && page.status_code !== 200) {
      console.log(`Excluding page: ${page.url} - Status code: ${page.status_code}`);
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