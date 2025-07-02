import FirecrawlApp from '@mendable/firecrawl-js';
import OpenAI from 'openai';
import { supabase } from '@/lib/db/client';

interface FirecrawlCrawlResponse {
  jobId: string;
  success: boolean;
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

type FirecrawlResponse = FirecrawlCrawlResponse | FirecrawlErrorResponse;
type FirecrawlStatusResult = FirecrawlStatusResponse | FirecrawlErrorResponse;

// Initialize services
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export interface CrawlConfig {
  baseUrl: string;
  maxPages: number;
  excludePatterns?: string[];
  forceRecrawl?: boolean;
}

export interface ProcessedPage {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h2Tags: string[];
  h3Tags: string[];
  h4Tags: string[];
  primaryKeywords: string[];
  semanticKeywords: string[];
  wordCount: number;
  embedding: number[];
}

/**
 * Clean Firecrawl markdown content by removing navigation and header junk
 */
function cleanFirecrawlContent(markdown: string): string {
  const firstHeading = markdown.indexOf('\n# ');
  if (firstHeading > 0) {
    return markdown.substring(firstHeading);
  }
  return markdown;
}

/**
 * Extract headings from cleaned markdown content
 */
function extractHeadings(markdown: string) {
  const h1Match = markdown.match(/^# (.+)$/m);
  const h2Matches = markdown.match(/^## (.+)$/gm) || [];
  const h3Matches = markdown.match(/^### (.+)$/gm) || [];
  const h4Matches = markdown.match(/^#### (.+)$/gm) || [];

  return {
    h1: h1Match?.[1] || null,
    h2Tags: h2Matches.map(h => h.replace('## ', '')),
    h3Tags: h3Matches.map(h => h.replace('### ', '')),
    h4Tags: h4Matches.map(h => h.replace('#### ', ''))
  };
}

/**
 * Extract primary keywords using frequency analysis
 */
function extractPrimaryKeywords(markdown: string): string[] {
  const cleanText = markdown
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[^\w\sàâäéèêëïîôùûüÿç]/gi, ' ')
    .toLowerCase();

  const words = cleanText
    .split(/\s+/)
    .filter(word => word.length > 3);

  const stopWords = new Set([
    'dans', 'avec', 'pour', 'plus', 'tout', 'tous', 'toute', 'toutes',
    'cette', 'cette', 'ces', 'son', 'ses', 'leur', 'leurs', 'notre',
    'nos', 'votre', 'vos', 'mon', 'mes', 'ton', 'tes', 'que', 'qui',
    'quoi', 'dont', 'où', 'quand', 'comment', 'pourquoi', 'parce',
    'car', 'donc', 'mais', 'ou', 'et', 'ni', 'or', 'puis', 'alors',
    'ainsi', 'aussi', 'encore', 'déjà', 'jamais', 'toujours', 'souvent',
    'parfois', 'très', 'trop', 'assez', 'bien', 'mal', 'mieux', 'moins',
    'beaucoup', 'peu', 'tant', 'autant', 'comme', 'si', 'sinon',
    'peut', 'peuvent', 'doit', 'doivent', 'avoir', 'être', 'faire',
    'dire', 'aller', 'voir', 'savoir', 'vouloir', 'venir', 'falloir'
  ]);

  const filteredWords = words.filter(word => !stopWords.has(word));

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
 * Generate semantic keywords using OpenAI
 */
async function generateSemanticKeywords(
  primaryKeywords: string[],
  title: string | null,
  h1: string | null
): Promise<string[]> {
  try {
    const prompt = `Given this French gardening content context, generate 10-12 semantic keywords (related terms, synonyms, variations):

Title: ${title || 'N/A'}
Main heading: ${h1 || 'N/A'}
Primary keywords: ${primaryKeywords.join(', ')}

Return only a JSON array of lowercase French keywords related to gardening/plants, no explanations:
["keyword1", "keyword2", ...]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) return [];

    const keywords = JSON.parse(content);
    return Array.isArray(keywords) ? keywords : [];
  } catch (error) {
    console.error('Failed to generate semantic keywords:', error);
    return [];
  }
}

/**
 * Generate embedding for page content
 */
async function generateEmbedding(
  title: string | null,
  h1: string | null,
  h2Tags: string[],
  h3Tags: string[],
  h4Tags: string[],
  primaryKeywords: string[]
): Promise<number[]> {
  const embeddingText = [
    title,
    h1,
    ...h2Tags,
    ...h3Tags,
    ...h4Tags,
    ...primaryKeywords
  ]
    .filter(Boolean)
    .join(' ');

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: embeddingText,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw error;
  }
}

/**
 * Process a single page from Firecrawl data
 */
export async function processPage(firecrawlData: any): Promise<ProcessedPage> {
  const { markdown, metadata } = firecrawlData;
  
  const cleanedMarkdown = cleanFirecrawlContent(markdown);
  const headings = extractHeadings(cleanedMarkdown);
  
  const primaryKeywords = extractPrimaryKeywords(cleanedMarkdown);
  
  const semanticKeywords = await generateSemanticKeywords(
    primaryKeywords,
    metadata.title,
    headings.h1
  );
  
  const wordCount = cleanedMarkdown.split(/\s+/).filter(word => word.length > 0).length;
  
  const embedding = await generateEmbedding(
    metadata.title,
    headings.h1,
    headings.h2Tags,
    headings.h3Tags,
    headings.h4Tags,
    primaryKeywords
  );

  return {
    url: metadata.sourceURL || metadata.url,
    title: metadata.title || null,
    metaDescription: metadata.description || null,
    h1: headings.h1,
    h2Tags: headings.h2Tags,
    h3Tags: headings.h3Tags,
    h4Tags: headings.h4Tags,
    primaryKeywords,
    semanticKeywords,
    wordCount,
    embedding
  };
}

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
 * Store processed page in database
 */
async function storePage(page: ProcessedPage): Promise<void> {
  const { error } = await supabase
    .from('pages')
    .upsert({
      url: page.url,
      title: page.title,
      meta_description: page.metaDescription,
      h1: page.h1,
      h2_tags: page.h2Tags,
      h3_tags: page.h3Tags,
      h4_tags: page.h4Tags,
      primary_keywords: page.primaryKeywords,
      semantic_keywords: page.semanticKeywords,
      word_count: page.wordCount,
      embedding: page.embedding,
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
 * Start crawling a website
 */
export async function crawlWebsite(config: CrawlConfig): Promise<string> {
  const jobId = await createCrawlJob(config);

  try {
    await updateCrawlJob(jobId, {
      status: 'running',
      started_at: new Date().toISOString()
    });

    console.log('Starting Firecrawl crawl for:', config.baseUrl);

    // Start Firecrawl crawl with better error handling
    const crawlResponse = await firecrawl.crawlUrl(config.baseUrl, {
      limit: config.maxPages,
      scrapeOptions: {
        formats: ['markdown'],
        includeTags: ['title', 'meta', 'h1', 'h2', 'h3', 'h4'],
        excludeTags: ['nav', 'footer', 'aside', 'script', 'style'],
        waitFor: 1000
      },
      excludePaths: config.excludePatterns
    });

    console.log('Firecrawl response:', crawlResponse);

    // Better response validation
    if (!crawlResponse || typeof crawlResponse !== 'object') {
      throw new Error('Invalid response from Firecrawl API');
    }

    if ('error' in crawlResponse) {
      throw new Error(`Firecrawl API error: ${crawlResponse.error}`);
    }

    // --- type-guard for FirecrawlCrawlResponse --------------------------
    function isCrawlResp(
      resp: unknown
    ): resp is FirecrawlCrawlResponse {
      return (
        typeof resp === 'object' &&
        resp !== null &&
        'jobId' in resp &&
        typeof (resp as any).jobId === 'string'
      );
    }

    // Validate jobId exists
    if (!isCrawlResp(crawlResponse)) {
      console.error('Invalid Firecrawl response structure:', crawlResponse);
      throw new Error('Firecrawl did not return a valid job ID');
    }

    console.log('Firecrawl job started with ID:', crawlResponse.jobId);

    // Poll for completion and process results
    await pollAndProcessCrawl(
      crawlResponse.jobId,
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

      if (status.status === 'completed') {
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

              await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
              console.error(`Failed to process page ${pageUrl}:`, error);
            }
          }
        }

        await updateCrawlJob(dbJobId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          pages_crawled: pagesProcessed
        });

        console.log(`Crawl completed: ${pagesProcessed} pages processed`);

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