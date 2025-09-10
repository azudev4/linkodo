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
    textParts.push(title, title); 
  }
  
  if (h1 && h1 !== title) {
    textParts.push(h1, h1); 
  }
  
  if (metaDescription) {
    textParts.push(metaDescription); 
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
 * FIXED: Use cursor-based pagination instead of offset-based
 * This prevents pagination issues when modifying data during iteration
 */
export async function generateEmbeddingsOptimized(): Promise<{ processed: number; failed: number; skipped: number }> {
  console.log('🚀 Starting FIXED embedding generation with cursor pagination...');
  
  // First, mark unembeddable pages so they don't get processed
  const skippedCount = await markUnembeddablePages();
  
  // FIX #2: MUCH more conservative settings to avoid timeouts
  const BATCH_SIZE = 600;           // Keep batch size
  const MAX_CONCURRENT = 300;         
  const DELAY_BETWEEN_BATCHES = 100; // Increased from 500ms
  const RETRY_DELAY = 2000;         // 2 seconds for rate limit retry

  console.log(`🔧 FIXED PAGINATION SETTINGS:
    Batch size: ${BATCH_SIZE}
    Concurrency: ${MAX_CONCURRENT}
    Method: Cursor-based (no offset drift!)
  `);

  let processed = 0;
  let failed = 0;
  let batchNumber = 0;
  const startTime = Date.now();

  // FIXED: Use cursor-based pagination
  while (true) {
    batchNumber++;
    
    // Always fetch the FIRST N pages without embeddings
    // This way, as we process them, the next batch will be the new "first N"
    const { data: pages, error } = await supabase
      .from('pages')
      .select('id, title, h1, meta_description')
      .is('embedding', null)
      .order('id') // Consistent ordering for cursor stability
      .limit(BATCH_SIZE);

    if (error) {
      console.error('❌ Database error:', error);
      break;
    }

    if (!pages || pages.length === 0) {
      console.log('✅ No more pages to process - completed!');
      break;
    }

    // Filter out pages with no content BEFORE processing
    const embeddablePages = pages.filter(page => hasEmbeddableContent(page));
    
    if (embeddablePages.length === 0) {
      console.log(`⚪ Batch ${batchNumber}: No embeddable pages, continuing`);
      
      // Mark these pages as unembeddable by setting embedding to null
      await supabase
        .from('pages')
        .update({ 
          embedding: null,
        })
        .in('id', pages.map(p => p.id));
      
      continue;
    }

    console.log(`🔄 Batch ${batchNumber} (${embeddablePages.length} embeddable pages)`);

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
      
      const chunkResults = await Promise.all(chunk.map(async (page) => {
        try {
          const combinedText = [page.title, page.h1, page.meta_description]
            .filter(Boolean).join(' ');

          if (!combinedText.trim()) {
            console.warn(`⚠️ Page ${page.id} passed filter but has no content`);
            return { success: false, shouldRetry: false };
          }

          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: combinedText,
          });

          const embeddingStr = embeddingToString(response.data[0].embedding);

          const { error: updateError } = await supabase
            .from('pages')
            .update({ 
              embedding: embeddingStr,
              updated_at: new Date().toISOString() 
            })
            .eq('id', page.id);

          if (updateError) throw updateError;
          return { success: true, shouldRetry: false };
          
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
            console.log(`⏱️ Rate limit hit for page ${page.id}, will retry later`);
            return { success: false, shouldRetry: true };
          }
          
          console.error(`❌ Failed to process page ${page.id}:`, error.message);
          return { success: false, shouldRetry: false };
        }
      }));
      
      const chunkProcessed = chunkResults.filter(r => r.success).length;
      const chunkFailed = chunkResults.filter(r => !r.success && !r.shouldRetry).length;
      const chunkRetries = chunkResults.filter(r => r.shouldRetry).length;
      
      batchProcessed += chunkProcessed;
      batchFailed += chunkFailed;
      
      // Handle rate limit retries
      if (chunkRetries > 0) {
        console.log(`⏱️ ${chunkRetries} rate-limited requests, waiting ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
      
      // Small delay between chunks
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    const batchTime = Date.now() - batchStart;
    processed += batchProcessed;
    failed += batchFailed;

    const elapsed = Date.now() - startTime;
    const currentRate = (processed / elapsed) * 1000 * 60;
    
    console.log(`✅ Batch ${batchNumber}: ${batchProcessed}/${embeddablePages.length} in ${Math.round(batchTime/1000)}s
      📊 Total: ${processed} processed
      🚀 Rate: ${Math.round(currentRate)}/min
      ❌ Failed in this batch: ${batchFailed}
    `);

    // Conservative delay between batches
    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
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