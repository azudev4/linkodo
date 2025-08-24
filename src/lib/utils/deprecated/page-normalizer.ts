// src/lib/services/oncrawl/page-normalizer.ts
// DEPRECATED: This file is no longer used with OnCrawl but contains useful 
// page processing utilities that might be useful for our custom crawler implementation

export enum SyncMode {
  CONTENT = 'content',
  FULL = 'full'
}

export interface OnCrawlPage {
  url: string;
  title: string;
  h1: string;
  meta_description: string;
  word_count: string;
  depth: string;
  inrank_decimal: string;
  internal_outlinks: string;
  nb_inlinks: string;
}

export interface ProcessedOnCrawlPage {
  url: string;
  title: string;
  h1: string;
  metaDescription: string;
  wordCount: number | null;
  category: string;
  depth: number | null;
  inrankDecimal: number | null;
  internalOutlinks: number | null;
  nbInlinks: number | null;
}

/**
 * Convert string values to numbers (OnCrawl returns everything as strings)
 */
export function parseNumericField(value: string | null | undefined): number | null {
  if (!value || value === 'null' || value === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Determine page category based on URL structure
 */
export function determinePageCategory(url: string): string {
  const slashCount = (url.match(/\//g) || []).length;
  
  if (url.includes('/tags/') || (url.endsWith('/') && slashCount <= 4)) {
    return 'category';
  }
  if (url.includes('.html') || url.match(/,\d+\./)) return 'article';
  if (slashCount <= 3) return 'page';
  
  return 'unknown';
}

/**
 * Process OnCrawl page data to our standard format
 */
export function processOnCrawlPage(page: OnCrawlPage): ProcessedOnCrawlPage {
  const url = page.url;
  const title = page.title;
  const h1 = page.h1;
  const metaDescription = page.meta_description;

  const wordCount = parseNumericField(page.word_count);
  const depth = parseNumericField(page.depth);
  const inrankDecimal = parseNumericField(page.inrank_decimal);
  const internalOutlinks = parseNumericField(page.internal_outlinks);
  const nbInlinks = parseNumericField(page.nb_inlinks);
  
  const category = determinePageCategory(url);
  
  return {
    url,
    title,
    metaDescription,
    h1,
    wordCount,
    category,
    depth,
    inrankDecimal,
    internalOutlinks,
    nbInlinks
  };
}

/**
 * Check if a page has actually changed compared to existing data
 * Different sync modes check different fields for changes
 */
export function hasPageChanged(existing: OnCrawlPage, newPage: ProcessedOnCrawlPage, syncMode: SyncMode = SyncMode.FULL): boolean {
  const normalizeString = (value: unknown): string | null => {
    if (value === null || value === undefined || value === "") return null;
    return String(value).trim() || null;
  };

  const normalizeNumber = (value: unknown): number | null => {
    if (value === null || value === undefined || value === "" || value === "null") return null;
    const num = parseFloat(String(value));
    if (isNaN(num)) return null;
    return Math.round(num * 1000000) / 1000000;
  };

  // Always check content fields
  const titleChanged = normalizeString(existing.title) !== normalizeString(newPage.title);
  const metaDescChanged = normalizeString(existing.meta_description) !== normalizeString(newPage.metaDescription);
  const h1Changed = normalizeString(existing.h1) !== normalizeString(newPage.h1);  
  const wordCountChanged = normalizeNumber(existing.word_count) !== normalizeNumber(newPage.wordCount);
  
  // Content mode: Only check content fields (h1, title, meta, word_count)
  if (syncMode === SyncMode.CONTENT) {
    return titleChanged || metaDescChanged || h1Changed || wordCountChanged;
  }
  
  // Full mode: Check all fields including metrics that change frequently
  const depthChanged = normalizeNumber(existing.depth) !== normalizeNumber(newPage.depth);
  const inrankChanged = normalizeNumber(existing.inrank_decimal) !== normalizeNumber(newPage.inrankDecimal);
  const outlinkChanged = normalizeNumber(existing.internal_outlinks) !== normalizeNumber(newPage.internalOutlinks);
  const inlinkChanged = normalizeNumber(existing.nb_inlinks) !== normalizeNumber(newPage.nbInlinks);

  return titleChanged || metaDescChanged || h1Changed || wordCountChanged || 
         depthChanged || inrankChanged || outlinkChanged || inlinkChanged;
}