// Minimal types for deprecated sync functionality
export { ProcessedOnCrawlPage } from './page-normalizer';

export interface DatabasePage {
  id: string;
  url: string;
  title?: string | null;
  meta_description?: string | null;
  h1?: string | null;
  word_count?: number | null;
  category?: string | null;
  depth?: number | null;
  inrank_decimal?: number | null;
  internal_outlinks?: number | null;
  nb_inlinks?: number | null;
  embedding?: string | null;
  project_name?: string;
  updated_at?: string;
}

export interface FilterStats {
  totalProcessed: number;
  totalFiltered: number;
  filteredDuplicates: number;
  filteredUrlPatterns: number;
  filteredForumContent: number;
}

export enum SyncMode {
  FULL = 'full',
  INCREMENTAL = 'incremental'
}