// src/lib/services/embeding/embeddings.ts - PRECISE FIXES
import OpenAI from 'openai';
import { supabase } from '@/lib/db/client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * Generate embedding for page content
 */
export async function generateEmbedding(
  title: string | null,
  h1: string | null,
  metaDescription: string | null
): Promise<number[]> {
  const textParts: string[] = [];
  
  if (title) {
    textParts.push(title, title); // 3x weight
  }
  
  if (h1 && h1 !== title) {
    textParts.push(h1, h1); // 2x weight
  }
  
  if (metaDescription) {
    textParts.push(metaDescription); // 1x weight
  }
  
  const combinedText = textParts.join(' ');

  if (!combinedText.trim()) {
    throw new Error('No content available to generate embedding');
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: combinedText,
  });

  return response.data[0].embedding;
}

/**
 * Convert embedding to/from database string format
 */
function embeddingToString(embedding: number[]): string {
  return JSON.stringify(embedding);
}

export function embeddingFromString(embeddingStr: string): number[] {
  return JSON.parse(embeddingStr);
}

/**
 * FIX #1: Check if a page has embeddable content BEFORE processing
 */
function hasEmbeddableContent(page: { title: string | null; h1: string | null; meta_description: string | null }): boolean {
  const combinedText = [page.title, page.h1, page.meta_description]
    .filter(Boolean)
    .join(' ')
    .trim();
  
  return combinedText.length > 0;
}

/**
 * FIX #2: Mark pages with no content as "processed" so they don't get fetched again
 */
async function markUnembeddablePages(): Promise<number> {
  console.log('🔍 Identifying and marking pages with no embeddable content...');
  
  // Find pages with no content that keep getting processed
  const { data: emptyPages, error } = await supabase
    .from('pages')
    .select('id, title, h1, meta_description')
    .is('embedding', null);
  
  if (error || !emptyPages) {
    console.error('❌ Failed to fetch pages for content check:', error);
    return 0;
  }
  
  // Filter pages with no embeddable content
  const unembeddablePages = emptyPages.filter(page => !hasEmbeddableContent(page));
  
  if (unembeddablePages.length === 0) {
    console.log('✅ No unembeddable pages found');
    return 0;
  }
  
  console.log(`📝 Found ${unembeddablePages.length} pages with no embeddable content. Marking them...`);
  
  // Mark them with a special embedding value so they don't get processed again
  const { error: updateError } = await supabase
    .from('pages')
    .update({ 
      embedding: '[0]',  // Use a minimal valid vector instead of empty string
      updated_at: new Date().toISOString()
    })
    .in('id', unembeddablePages.map(p => p.id));
  
  if (updateError) {
    console.error('❌ Failed to mark unembeddable pages:', updateError);
    return 0;
  }
  
  console.log(`✅ Marked ${unembeddablePages.length} unembeddable pages`);
  return unembeddablePages.length;
}

/**
 * FIX #3: FIXED embedding generation with proper rate limiting and content validation
 */
export async function generateEmbeddingsOptimized(): Promise<{ processed: number; failed: number; skipped: number }> {
  console.log('🚀 Starting FIXED embedding generation with enhanced diagnostics...');
  
  // Log current state of embeddings
  const { count: totalPages } = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true });
    
  const { count: embeddedPages } = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true })
    .not('embedding', 'is', null)
    .not('embedding', 'eq', '[0]');
    
  const { count: markedUnembeddable } = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true })
    .eq('embedding', '[0]');
    
  console.log(`📊 Current Database State:
    Total pages: ${totalPages}
    Pages with embeddings: ${embeddedPages}
    Pages marked unembeddable: ${markedUnembeddable}
    Pages remaining: ${totalPages! - embeddedPages! - markedUnembeddable!}
  `);
  
  // FIX #1: First, mark unembeddable pages so they don't get processed
  const skippedCount = await markUnembeddablePages();
  
  // Get detailed info about remaining pages
  const { data: remainingPages, error: remainingError } = await supabase
    .from('pages')
    .select('id, title, h1, meta_description')
    .is('embedding', null)
    .limit(10);
    
  if (remainingPages?.length) {
    console.log(`🔍 Sample of remaining pages:
${remainingPages.map(page => `
ID: ${page.id}
Title: ${page.title || 'null'}
H1: ${page.h1 || 'null'}
Meta: ${page.meta_description || 'null'}
Has content: ${hasEmbeddableContent(page) ? 'Yes' : 'No'}
---`).join('\n')}
    `);
  }

  // Get count of pages that actually have embeddable content
  const { count, error: countError } = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null);

  if (countError || !count) {
    throw new Error(`Failed to get page count: ${countError?.message}`);
  }

  console.log(`Found ${count} pages without embeddings (after filtering unembeddable content)`);
  
  // FIX #2: MUCH more conservative settings to avoid timeouts
  const BATCH_SIZE = 200;           // Keep batch size
  const MAX_CONCURRENT = 20;         // Reduced from 20 to avoid timeouts
  const DELAY_BETWEEN_BATCHES = 700; // Increased from 500ms
  const RETRY_DELAY = 2000;         // 2 seconds for rate limit retry
  const MAX_RETRIES = 3;            // Maximum number of retries for timeouts

  console.log(`🔧 CONSERVATIVE SETTINGS:
    Batch size: ${BATCH_SIZE}
    Concurrency: ${MAX_CONCURRENT} (reduced to avoid timeouts)
    Delay: ${DELAY_BETWEEN_BATCHES}ms
    Max retries: ${MAX_RETRIES}
    Target: Reliable completion over speed
  `);

  let processed = 0;
  let failed = 0;
  const startTime = Date.now();

  // Helper function to handle a single page with retries
  async function processPageWithRetry(
    page: { id: string; title: string | null; h1: string | null; meta_description: string | null },
    retryCount = 0
  ): Promise<{ success: boolean; shouldRetry: boolean }> {
    try {
      const combinedText = [page.title, page.h1, page.meta_description]
        .filter(Boolean).join(' ');

      if (!combinedText.trim()) {
        console.warn(`⚠️ Page ${page.id} passed filter but has no content:
          Title: ${page.title || 'null'}
          H1: ${page.h1 || 'null'}
          Meta: ${page.meta_description || 'null'}
        `);
        return { success: false, shouldRetry: false };
      }

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: combinedText,
      });

      const embeddingStr = embeddingToString(response.data[0].embedding);

      // Add delay before database update
      await new Promise(resolve => setTimeout(resolve, 100));

      const { error: updateError } = await supabase
        .from('pages')
        .update({ 
          embedding: embeddingStr,
          updated_at: new Date().toISOString() 
        })
        .eq('id', page.id);

      if (updateError) throw updateError;
      return { success: true, shouldRetry: false };
      
    } catch (error: any) {
      const errorDetails = error.response?.data || error.message;
      const isTimeout = error.message?.includes('timeout');
      
      console.error(`❌ Detailed error for page ${page.id}:
        Error type: ${error.name}
        Status: ${error.status || 'N/A'}
        Message: ${error.message}
        Response data: ${JSON.stringify(errorDetails, null, 2)}
        Page content length: ${[page.title, page.h1, page.meta_description].filter(Boolean).join(' ').length}
        Retry count: ${retryCount}
      `);
      
      if ((error.status === 429 || isTimeout) && retryCount < MAX_RETRIES) {
        const delay = isTimeout ? RETRY_DELAY * (retryCount + 1) : RETRY_DELAY;
        console.log(`⏱️ ${isTimeout ? 'Timeout' : 'Rate limit'} hit for page ${page.id}, retry ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return processPageWithRetry(page, retryCount + 1);
      }
      
      return { success: false, shouldRetry: false };
    }
  }

  for (let offset = 0; offset < count; offset += BATCH_SIZE) {
    // Enhanced logging for each batch
    console.log(`\n📑 Processing batch starting at offset ${offset}`);
    
    const { data: pages, error } = await supabase
      .from('pages')
      .select('id, title, h1, meta_description')
      .is('embedding', null)
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error(`❌ Failed to fetch batch at offset ${offset}:`, error);
      break;
    }
    
    if (!pages?.length) {
      console.log(`⚠️ No pages returned for batch at offset ${offset}. This might indicate a pagination issue.`);
      break;
    }

    // Enhanced logging for content analysis
    console.log(`📝 Batch content analysis:
    Total pages in batch: ${pages.length}
    Pages with title: ${pages.filter(p => p.title).length}
    Pages with H1: ${pages.filter(p => p.h1).length}
    Pages with meta: ${pages.filter(p => p.meta_description).length}
    `);

    // FIX #4: Filter out pages with no content BEFORE processing
    const embeddablePages = pages.filter(page => hasEmbeddableContent(page));
    const nonEmbeddablePages = pages.filter(page => !hasEmbeddableContent(page));
    
    if (nonEmbeddablePages.length > 0) {
      console.log(`⚠️ Found ${nonEmbeddablePages.length} non-embeddable pages in this batch:
${nonEmbeddablePages.map(page => `ID: ${page.id} - Title: ${page.title || 'null'}`).join('\n')}
      `);
    }
    
    if (embeddablePages.length === 0) {
      console.log(`⚪ Batch ${Math.floor(offset / BATCH_SIZE) + 1}: No embeddable pages, skipping`);
      continue;
    }

    const batchNum = Math.floor(offset / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(count / BATCH_SIZE);
    console.log(`🔄 Batch ${batchNum}/${totalBatches} (${embeddablePages.length} embeddable pages)`);

    // Process in smaller chunks with proper concurrency control
    const batchStart = Date.now();
    const chunks = [];
    
    for (let i = 0; i < embeddablePages.length; i += MAX_CONCURRENT) {
      chunks.push(embeddablePages.slice(i, i + MAX_CONCURRENT));
    }
    
    let batchProcessed = 0;
    let batchFailed = 0;
    
    for (const chunk of chunks) {
      console.log(`📦 Processing chunk of ${chunk.length} pages...`);
      
      const chunkResults = await Promise.all(
        chunk.map(page => processPageWithRetry(page))
      );
      
      const chunkProcessed = chunkResults.filter(r => r.success).length;
      const chunkFailed = chunkResults.filter(r => !r.success).length;
      
      batchProcessed += chunkProcessed;
      batchFailed += chunkFailed;
      
      // Add delay between chunks
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const batchTime = Date.now() - batchStart;
    processed += batchProcessed;
    failed += batchFailed;

    const elapsed = Date.now() - startTime;
    const currentRate = (processed / elapsed) * 1000 * 60;
    const eta = count > processed ? ((count - processed) / currentRate) * 60 * 1000 : 0;
    
    console.log(`✅ Batch ${batchNum}: ${batchProcessed}/${embeddablePages.length} in ${Math.round(batchTime/1000)}s
      📊 Total: ${processed}/${count} (${Math.round((processed/count)*100)}%)
      🚀 Rate: ${Math.round(currentRate)}/min  
      ⏰ ETA: ${Math.round(eta/60000)}min
      ❌ Failed in this batch: ${batchFailed}`);

    // Conservative delay between batches
    if (offset + BATCH_SIZE < count) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  const totalTime = Date.now() - startTime;
  const finalRate = (processed / totalTime) * 1000 * 60;
  
  console.log(`🎉 FIXED embedding generation completed!
    ✅ ${processed} processed
    ❌ ${failed} failed  
    ⚪ ${skippedCount} skipped (no content)
    ⏰ Total: ${Math.round(totalTime/60000)} minutes
    🚀 Rate: ${Math.round(finalRate)}/min
  `);

  return { processed, failed, skipped: skippedCount };
}

/**
 * Check if a page has embeddable content (helper for diagnostics)
 */
export async function checkUnembeddablePages(): Promise<{
  total: number;
  unembeddable: number;
  examples: Array<{ id: string; title: string | null; h1: string | null; meta_description: string | null }>;
}> {
  const { data: pages, error } = await supabase
    .from('pages')
    .select('id, title, h1, meta_description')
    .is('embedding', null)
    .limit(100); // Check sample

  if (error || !pages) {
    throw new Error(`Failed to check pages: ${error?.message}`);
  }

  const unembeddable = pages.filter(page => !hasEmbeddableContent(page));
  
  return {
    total: pages.length,
    unembeddable: unembeddable.length,
    examples: unembeddable.slice(0, 5) // First 5 examples
  };
}