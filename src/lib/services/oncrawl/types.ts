/**
 * Shared types for OnCrawl service
 */

/**
 * Raw page data from OnCrawl API
 */
export interface OnCrawlPage {
  url: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  word_count: string | null;
  depth: string | null;
  inrank_decimal: string | null;
  internal_outlinks: string | null;
  nb_inlinks: string | null;
  status_code: string | null;
}

/**
 * Processed page data after normalization
 */
export interface ProcessedOnCrawlPage {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  wordCount: number | null;
  category: string;
  depth: number | null;
  inrankDecimal: number | null;
  internalOutlinks: number | null;
  nbInlinks: number | null;
}

/**
 * Sync operation result
 */
export interface SyncResult {
  added: number;
  updated: number;
  unchanged: number;
  failed: number;
  removed: number;
  processed: number;
  syncHistoryId: number;
  durationMs: number;
  filteredNoContent: number;
  filteredUrlPatterns: number;
  filteredForumContent: number;
}

/**
 * Content validation result
 */
export interface ContentValidationResult {
  isValid: boolean;
  reason?: string;
  hasTitle: boolean;
  hasH1: boolean;
  hasMetaDescription: boolean;
  combinedLength: number;
}

/**
 * Filter statistics
 */
export interface FilterStats {
  total: number;
  filteredNoContent: number;
  filteredUrlPatterns: number;
  filteredForumContent: number;
  filteredStatusCode: number;
  kept: number;
}

/**
 * Filter examples for debugging
 */
export interface FilterExamples {
  noContent: Array<{ url: string; reason: string }>;
  urlPatterns: Array<{ url: string; reason: string }>;
  forumContent: Array<{ url: string; reason: string }>;
}

/**
 * Filter result
 */
export interface FilterResult {
  indexablePages: ProcessedOnCrawlPage[];
  stats: FilterStats;
  examples: FilterExamples;
} 