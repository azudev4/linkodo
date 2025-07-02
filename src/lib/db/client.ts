import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database tables
export interface Page {
  id: string;
  url: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  h2_tags: string[] | null;
  h3_tags: string[] | null;
  primary_keywords: string[] | null;
  semantic_keywords: string[] | null;
  word_count: number | null;
  embedding: number[] | null;
  last_crawled: string;
  created_at: string;
  updated_at: string;
}

export interface CrawlJob {
  id: string;
  base_url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  pages_crawled: number;
  pages_total: number | null;
  max_pages: number;
  exclude_patterns: string[] | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface SimilarPage {
  id: string;
  url: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  h2_tags: string[] | null;
  h3_tags: string[] | null;
  primary_keywords: string[] | null;
  similarity: number;
}

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

  return data as SimilarPage[];
}

export interface PageData {
  id: number;
  url: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  h2_tags: string[] | null;
  h3_tags: string[] | null;
  primary_keywords: string[] | null;
  semantic_keywords: string[] | null;
  word_count: number | null;
  content_snippet: string | null;
  embedding: number[] | null;
  last_crawled: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuggestionData {
  id: number;
  url: string;
  title: string | null;
  h1: string | null;
  h2_tags: string[] | null;
  h3_tags: string[] | null;
  primary_keywords: string[] | null;
  content_snippet: string | null;
  embedding: number[] | null;
  word_count: number | null;
  last_crawled: string | null;
  created_at: string;
  updated_at: string;
}