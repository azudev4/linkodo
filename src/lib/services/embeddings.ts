import OpenAI from 'openai';
import { supabase } from '@/lib/db/client';

/**
 * Single shared OpenAI client instance for embedding generation
 */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * Generate a semantic embedding vector for the provided page fields.
 */
export async function generateEmbedding(
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
 * Batch-process pages that do not yet have embeddings and store them in Supabase.
 */
export async function batchGenerateEmbeddings(batchSize: number = 50): Promise<{ processed: number; failed: number }> {
  console.log('Starting batch embedding generation...');

  let processed = 0;
  let failed = 0;
  let offset = 0;

  while (true) {
    // Retrieve a batch of pages without embeddings
    const { data: pages, error } = await supabase
      .from('pages')
      .select('id, title, h1, h2_tags, h3_tags, h4_tags, primary_keywords')
      .is('embedding', null)
      .range(offset, offset + batchSize - 1);

    if (error) {
      console.error('Error fetching pages for embedding:', error);
      break;
    }

    if (!pages || pages.length === 0) {
      console.log('No more pages to process');
      break;
    }

    console.log(`Processing batch of ${pages.length} pages (offset: ${offset})`);

    for (const page of pages) {
      try {
        const embedding = await generateEmbedding(
          page.title,
          page.h1,
          page.h2_tags || [],
          page.h3_tags || [],
          page.h4_tags || [],
          page.primary_keywords || []
        );

        const { error: updateError } = await supabase
          .from('pages')
          .update({ embedding, updated_at: new Date().toISOString() })
          .eq('id', page.id);

        if (updateError) {
          console.error(`Failed to update embedding for page ${page.id}:`, updateError);
          failed++;
        } else {
          processed++;
          console.log(`Generated embedding for page: ${page.title || page.id}`);
        }

        // Brief pause to respect rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Failed to generate embedding for page ${page.id}:`, error);
        failed++;
      }
    }

    offset += batchSize;
    // Longer delay between batches to avoid API saturation
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Batch embedding generation completed: ${processed} processed, ${failed} failed`);
  return { processed, failed };
} 