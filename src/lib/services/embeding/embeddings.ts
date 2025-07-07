// src/lib/services/embedding/embeddings.ts - SIMPLE & FAST VERSION
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
  const combinedText = [title, h1, metaDescription].filter(Boolean).join(' ');

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
 * SIMPLE MAXIMUM SPEED - No overengineering, just raw speed
 */
export async function generateEmbeddingsOptimized(): Promise<{ processed: number; failed: number }> {
  console.log('🚀 Starting SIMPLE MAXIMUM SPEED embedding generation...');
  
  const { count, error: countError } = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null);

  if (countError || !count) {
    throw new Error(`Failed to get page count: ${countError?.message}`);
  }

  console.log(`Found ${count} pages without embeddings`);
  
  // 🔥 ULTRA AGGRESSIVE SETTINGS - Push to the limit
  const BATCH_SIZE = 500;             // MASSIVE batches
  const MAX_CONCURRENT = 500;         // MAXIMUM parallelism
  const DELAY_BETWEEN_BATCHES = 50;    // Minimal delay
  
  const estimatedMinutes = Math.round(count / 2500 * 60 * 10) / 10; // More realistic estimate
  
  console.log(`🚀 ULTRA AGGRESSIVE SETTINGS:
    Batch size: ${BATCH_SIZE} (was 300)
    Concurrency: ${MAX_CONCURRENT} (was 300)
    Delay: ${DELAY_BETWEEN_BATCHES}ms (was 100ms)
    Estimated time: ${estimatedMinutes} minutes (assuming 2500/min avg)
    Target: Push towards 3000/min limit!
  `);

  let processed = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let offset = 0; offset < count; offset += BATCH_SIZE) {
    const { data: pages, error } = await supabase
      .from('pages')
      .select('id, title, h1, meta_description')
      .is('embedding', null)
      .range(offset, offset + BATCH_SIZE - 1);

    if (error || !pages?.length) break;

    const batchNum = Math.floor(offset / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(count / BATCH_SIZE);
    console.log(`🔥 Batch ${batchNum}/${totalBatches} (${pages.length} pages)`);

    // Process ALL pages in parallel - maximum aggression
    const batchStart = Date.now();
    
    const results = await Promise.all(pages.map(async (page) => {
      try {
        const combinedText = [page.title, page.h1, page.meta_description]
          .filter(Boolean).join(' ');

        if (!combinedText.trim()) {
          return { success: false };
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
        return { success: true };
        
      } catch (error: any) {
        // Simple rate limit handling - just wait and continue
        if (error.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return { success: false };
      }
    }));

    const batchProcessed = results.filter(r => r.success).length;
    const batchFailed = results.filter(r => !r.success).length;
    const batchTime = Date.now() - batchStart;
    
    processed += batchProcessed;
    failed += batchFailed;

    // Simple progress calculation
    const elapsed = Date.now() - startTime;
    const currentRate = (processed / elapsed) * 1000 * 60;
    const eta = count > processed ? ((count - processed) / currentRate) * 60 * 1000 : 0;
    const batchRate = (batchProcessed / batchTime) * 1000 * 60;
    
    console.log(`✅ Batch ${batchNum}: ${batchProcessed}/${pages.length} in ${Math.round(batchTime/1000)}s (${Math.round(batchRate)}/min)
      📊 Total: ${processed}/${count} (${Math.round((processed/count)*100)}%)
      🚀 Rate: ${Math.round(currentRate)}/min
      ⏰ ETA: ${Math.round(eta/60000)}min`);

    // Fixed minimal delay - no complex logic
    if (offset + BATCH_SIZE < count) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  const totalTime = Date.now() - startTime;
  const finalRate = (processed / totalTime) * 1000 * 60;
  
  console.log(`🎉 SIMPLE MAXIMUM SPEED completed!
    ✅ ${processed} processed
    ❌ ${failed} failed  
    ⏰ Total: ${Math.round(totalTime/60000)} minutes
    🚀 Rate: ${Math.round(finalRate)}/min
  `);

  return { processed, failed };
}

/**
 * ULTRA SIMPLE - Just blast everything at once (for smaller datasets)
 */
export async function generateEmbeddingsUltraSimple(): Promise<{ processed: number; failed: number }> {
  console.log('🚀 Starting ULTRA SIMPLE - process everything at once...');
  
  const { data: pages, error } = await supabase
    .from('pages')
    .select('id, title, h1, meta_description')
    .is('embedding', null);

  if (error || !pages) {
    throw new Error(`Failed to get pages: ${error?.message}`);
  }

  console.log(`Processing ALL ${pages.length} pages in parallel...`);
  const startTime = Date.now();

  // Process EVERYTHING in parallel - no batching, no delays
  const results = await Promise.all(pages.map(async (page, index) => {
    try {
      if (index % 1000 === 0) {
        console.log(`Processing page ${index + 1}/${pages.length}...`);
      }

      const combinedText = [page.title, page.h1, page.meta_description]
        .filter(Boolean).join(' ');

      if (!combinedText.trim()) return { success: false };

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: combinedText,
      });

      const embeddingStr = embeddingToString(response.data[0].embedding);

      await supabase
        .from('pages')
        .update({ 
          embedding: embeddingStr,
          updated_at: new Date().toISOString() 
        })
        .eq('id', page.id);

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }));

  const processed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalTime = Date.now() - startTime;
  const rate = (processed / totalTime) * 1000 * 60;

  console.log(`🎉 ULTRA SIMPLE completed!
    ✅ ${processed} processed
    ❌ ${failed} failed  
    ⏰ Time: ${Math.round(totalTime/60000)} minutes
    🚀 Rate: ${Math.round(rate)}/min
  `);

  return { processed, failed };
}

// Conservative fallback
export async function batchGenerateEmbeddings(batchSize: number = 100): Promise<{ processed: number; failed: number }> {
  console.log('🔄 Conservative batch processing...');
  // Same as before but simpler
  let processed = 0;
  let failed = 0;
  let offset = 0;

  while (true) {
    const { data: pages, error } = await supabase
      .from('pages')
      .select('id, title, h1, meta_description')
      .is('embedding', null)
      .range(offset, offset + batchSize - 1);

    if (error || !pages?.length) break;

    console.log(`Processing ${pages.length} pages...`);

    for (const page of pages) {
      try {
        const embedding = await generateEmbedding(page.title, page.h1, page.meta_description);
        const embeddingStr = embeddingToString(embedding);

        await supabase
          .from('pages')
          .update({ embedding: embeddingStr, updated_at: new Date().toISOString() })
          .eq('id', page.id);

        processed++;
      } catch (error) {
        failed++;
      }
    }

    offset += batchSize;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { processed, failed };
}

export async function getPageEmbedding(pageId: string): Promise<number[] | null> {
  const { data, error } = await supabase
    .from('pages')
    .select('embedding')
    .eq('id', pageId)
    .single();

  if (error || !data?.embedding) return null;
  
  try {
    return embeddingFromString(data.embedding);
  } catch (error) {
    return null;
  }
}