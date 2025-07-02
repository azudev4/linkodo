import FirecrawlApp from '@mendable/firecrawl-js';
import { supabase } from '@/lib/db/client';
import { processPage, storePage, ProcessedPage } from './page-processor';

interface FirecrawlCrawlResponse {
  id: string;
  success: boolean;
  url?: string;
}

interface FirecrawlStatusResponse {
  status: 'completed' | 'failed' | 'scraping';
  data?: {
    metadata?: {
      sourceURL?: string;
      url?: string;
    };
  }[];
}

interface FirecrawlErrorResponse {
  error: string;
}

type FirecrawlStatusResult = FirecrawlStatusResponse | FirecrawlErrorResponse;

// Initialize services
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

export interface CrawlConfig {
  baseUrl: string;
  maxPages: number;
  excludePatterns?: string[];
  forceRecrawl?: boolean;
}

// Re-export ProcessedPage interface for backward compatibility
export type { ProcessedPage };

/**
 * Check if a page already exists in database
 */
async function pageExistsInDatabase(url: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('pages')
    .select('id')
    .eq('url', url)
    .limit(1);

  if (error) {
    console.error(`Error checking if page exists: ${error.message}`);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Create a new crawl job in database
 */
async function createCrawlJob(config: CrawlConfig): Promise<string> {
  const { data, error } = await supabase
    .from('crawl_jobs')
    .insert({
      base_url: config.baseUrl,
      max_pages: config.maxPages,
      exclude_patterns: config.excludePatterns || null,
      status: 'pending'
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create crawl job: ${error.message}`);
  }

  return data.id;
}

/**
 * Update crawl job status
 */
async function updateCrawlJob(
  jobId: string, 
  updates: { 
    status?: string; 
    pages_crawled?: number; 
    pages_total?: number;
    started_at?: string;
    completed_at?: string;
    error_message?: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('crawl_jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) {
    throw new Error(`Failed to update crawl job: ${error.message}`);
  }
}

/**
 * Start crawling a website using Firecrawl's async API
 */
export async function crawlWebsite(config: CrawlConfig): Promise<string> {
  const jobId = await createCrawlJob(config);

  try {
    await updateCrawlJob(jobId, {
      status: 'running',
      started_at: new Date().toISOString()
    });

    console.log('Starting Firecrawl async crawl for:', config.baseUrl);

    // Start Firecrawl async crawl - always returns id for large sites
    const crawlResponse = await firecrawl.asyncCrawlUrl(config.baseUrl, {
      limit: config.maxPages,
      scrapeOptions: {
        formats: ['markdown'],
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3'],
        excludeTags: ['nav', 'footer', 'aside', 'script', 'style'],
        waitFor: 1000
      },
      excludePaths: config.excludePatterns
    });

    console.log('Firecrawl async response:', crawlResponse);

    // Validate response structure
    if (!crawlResponse || typeof crawlResponse !== 'object') {
      throw new Error('Invalid response from Firecrawl API');
    }

    if ('error' in crawlResponse) {
      throw new Error(`Firecrawl API error: ${crawlResponse.error}`);
    }

    // Validate id exists (asyncCrawlUrl always returns id)
    if (!('id' in crawlResponse) || typeof crawlResponse.id !== 'string') {
      console.error('Invalid Firecrawl async response structure:', crawlResponse);
      throw new Error('Firecrawl async API did not return a valid job ID');
    }

    console.log('Firecrawl async job started with ID:', crawlResponse.id);

    // Poll for completion and process results
    await pollAndProcessCrawl(
      crawlResponse.id,
      jobId,
      config.forceRecrawl || false
    );

    return jobId;

  } catch (error) {
    console.error('Crawl error:', error);
    
    await updateCrawlJob(jobId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

/**
 * Poll Firecrawl job and process results
 */
async function pollAndProcessCrawl(firecrawlJobId: string, dbJobId: string, forceRecrawl: boolean = false): Promise<void> {
  // Validate jobId before starting
  if (!firecrawlJobId || typeof firecrawlJobId !== 'string') {
    throw new Error(`Invalid Firecrawl job ID: ${firecrawlJobId}`);
  }

  let isComplete = false;
  let pagesProcessed = 0;
  let pollAttempts = 0;
  const maxPollAttempts = 120; // 10 minutes max (5s intervals)

  // Stuck detection variables
  let lastPageCount = 0;
  let unchangedAttempts = 0;
  const MAX_UNCHANGED_ATTEMPTS = 2; // Consider stuck after 10 seconds (2 * 5s) of no change

  const { data: jobData } = await supabase
    .from('crawl_jobs')
    .select('max_pages, base_url')
    .eq('id', dbJobId)
    .single();

  const maxPages = jobData?.max_pages || 1000;

  console.log(`Starting poll for Firecrawl job: ${firecrawlJobId}`);

  while (!isComplete && pollAttempts < maxPollAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    pollAttempts++;

    try {
      console.log(`Polling attempt ${pollAttempts}: Checking status for job ${firecrawlJobId}`);
      
      const status = await firecrawl.checkCrawlStatus(firecrawlJobId) as FirecrawlStatusResult;

      if ('error' in status) {
        throw new Error(`Firecrawl status check failed: ${status.error}`);
      }

      console.log(`Job status: ${status.status}`);

      const currentPageCount = status.data?.length || 0;
      console.log(`Current page count: ${currentPageCount}`);

      // Check if page count is unchanged
      if (currentPageCount === lastPageCount && status.status === 'scraping') {
        unchangedAttempts++;
        console.log(`Page count unchanged for ${unchangedAttempts} attempts`);
        
        if (unchangedAttempts >= MAX_UNCHANGED_ATTEMPTS && currentPageCount > 0) {
          console.log(`Detected stuck state: Page count ${currentPageCount} unchanged for ${unchangedAttempts} attempts`);
          console.log('Treating as completed to process discovered pages');
          isComplete = true;
          
          await updateCrawlJob(dbJobId, {
            pages_total: currentPageCount,
            status: 'completed_partial',
            error_message: `Crawl appeared stuck after discovering ${currentPageCount} pages. Processing available pages.`
          });
        }
      } else {
        // Reset counter if count changed
        unchangedAttempts = 0;
      }
      lastPageCount = currentPageCount;

      if (status.status === 'completed' || isComplete) {
        isComplete = true;
        
        const totalDiscovered = status.data?.length || 0;
        console.log(`Crawl completed: ${totalDiscovered} pages discovered`);
        
        await updateCrawlJob(dbJobId, {
          pages_total: totalDiscovered
        });

        if (status.data && Array.isArray(status.data)) {
          console.log(`Processing up to ${maxPages} pages from ${totalDiscovered} discovered pages`);
          
          for (let i = 0; i < status.data.length && pagesProcessed < maxPages; i++) {
            const pageData = status.data[i];
            const pageUrl = pageData.metadata?.sourceURL || pageData.metadata?.url;
            
            if (!pageUrl) {
              console.log(`Skipping page without URL`);
              continue;
            }

            try {
              if (!forceRecrawl) {
                const pageExists = await pageExistsInDatabase(pageUrl);
                if (pageExists) {
                  console.log(`Skipping existing page: ${pageUrl}`);
                  continue;
                }
              }

              console.log(`Processing page ${pagesProcessed + 1}/${maxPages}: ${pageUrl}`);
              
              const processedPage = await processPage(pageData);
              await storePage(processedPage);
              pagesProcessed++;

              await updateCrawlJob(dbJobId, {
                pages_crawled: pagesProcessed
              });

              // Small delay to avoid overwhelming the database
              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
              console.error(`Failed to process page ${pageUrl}:`, error);
              // Continue processing other pages even if one fails
            }
          }
        }

        await updateCrawlJob(dbJobId, {
          status: isComplete ? 'completed_partial' : 'completed',
          completed_at: new Date().toISOString(),
          pages_crawled: pagesProcessed
        });

        console.log(`Crawl completed: ${pagesProcessed} pages processed and stored`);

      } else if (status.status === 'failed') {
        throw new Error('Firecrawl job failed');
      } else {
        // Still in progress
        if (status.data?.length) {
          console.log(`Firecrawl discovered ${status.data.length} pages so far...`);
        }
      }

    } catch (error) {
      console.error(`Error polling crawl status (attempt ${pollAttempts}):`, error);
      
      // If we've tried many times and keep failing, give up
      if (pollAttempts > 10) {
        throw new Error(`Failed to poll crawl status after ${pollAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  if (pollAttempts >= maxPollAttempts) {
    throw new Error('Crawl polling timed out after 10 minutes');
  }
}