import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Import proper Supabase types
import { Database } from '@/types/supabase';
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

// Helper function for similarity search
export async function findSimilarPages(
  embedding: number[],
  threshold: number = 0.7,
  limit: number = 10
) {
  const { data, error } = await supabase.rpc('find_similar_pages', {
    query_embedding: embedding,
    similarity_threshold: threshold,
    match_limit: limit
  });

  if (error) {
    throw new Error(`Similarity search failed: ${error.message}`);
  }

  return data;
}