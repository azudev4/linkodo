// src/lib/services/oncrawl/content-filter.ts
import { OnCrawlPage, ProcessedOnCrawlPage, FilterResult, ContentValidationResult } from '../types';
import { isForumContent, EXCLUDED_URL_PHRASES, SITE_SPECIFIC_EXCLUDED_PATTERNS } from '@/lib/utils/linkfilter';
import { processOnCrawlPage } from './page-normalizer';

/**
 * Check if a page has embeddable content
 */
export function hasEmbeddableContent(page: OnCrawlPage): boolean {
  const title = page.title?.trim();
  const h1 = page.h1?.trim();
  const metaDescription = page.meta_description?.trim();
  
  return !!(title || h1 || metaDescription);
}

/**
 * Enhanced content validation with detailed logging
 */
export function validatePageContent(page: OnCrawlPage): ContentValidationResult {
  const title = page.title?.trim();
  const h1 = page.h1?.trim();
  const metaDescription = page.meta_description?.trim();
  
  const hasTitle = !!title;
  const hasH1 = !!h1;
  const hasMetaDescription = !!metaDescription;
  
  const combinedText = [title, h1, metaDescription].filter(Boolean).join(' ');
  const combinedLength = combinedText.length;
  
  if (combinedLength === 0) {
    return {
      isValid: false,
      reason: 'No embeddable content (title, h1, meta_description all empty)',
      hasTitle,
      hasH1,
      hasMetaDescription,
      combinedLength
    };
  }
  
  if (combinedLength < 3) {
    return {
      isValid: false,
      reason: `Content too short (${combinedLength} chars)`,
      hasTitle,
      hasH1,
      hasMetaDescription,
      combinedLength
    };
  }
  
  return {
    isValid: true,
    hasTitle,
    hasH1,
    hasMetaDescription,
    combinedLength
  };
}

/**
 * Enhanced filtering with detailed content validation and statistics
 */
export function optimizedFilterPages(pages: OnCrawlPage[]): FilterResult {
  console.log(`🔍 Starting ENHANCED filtering with content validation of ${pages.length} pages...`);
  const startTime = Date.now();
  
  // Pre-compile patterns for performance
  const excludedPhrasesSet = new Set(EXCLUDED_URL_PHRASES.map(p => p.toLowerCase()));
  const sitePatternSet = new Set(SITE_SPECIFIC_EXCLUDED_PATTERNS);
  
  const indexablePages: ProcessedOnCrawlPage[] = [];
  const stats = {
    total: pages.length,
    filteredNoContent: 0,
    filteredUrlPatterns: 0,
    filteredForumContent: 0,
    filteredStatusCode: 0,
    kept: 0
  };
  
  const examples = {
    noContent: [] as Array<{ url: string; reason: string }>,
    urlPatterns: [] as Array<{ url: string; reason: string }>,
    forumContent: [] as Array<{ url: string; reason: string }>
  };
  
  for (const page of pages) {
    const url = page.url;
    
    // 1. Check status code first
    const statusCode = page.status_code ? parseInt(page.status_code) : null;
    if (statusCode && statusCode !== 200) {
      stats.filteredStatusCode++;
      continue;
    }
    
    // 2. Check for embeddable content FIRST
    const contentValidation = validatePageContent(page);
    if (!contentValidation.isValid) {
      stats.filteredNoContent++;
      
      if (examples.noContent.length < 10) {
        examples.noContent.push({
          url: url.substring(0, 80) + (url.length > 80 ? '...' : ''),
          reason: contentValidation.reason || 'No content'
        });
      }
      
      continue;
    }
    
    // 3. Check URL patterns
    if (!url || url.length < 8) {
      stats.filteredUrlPatterns++;
      continue;
    }
    
    if (url.includes('\n') || url.includes('\r') || url.includes(';200;') || !url.startsWith('http')) {
      stats.filteredUrlPatterns++;
      continue;
    }
    
    const lowerUrl = url.toLowerCase();
    let urlExcluded = false;
    let urlExclusionReason = '';
    
    for (const phrase of excludedPhrasesSet) {
      if (lowerUrl.includes(phrase)) {
        urlExcluded = true;
        urlExclusionReason = `Contains excluded phrase: ${phrase}`;
        break;
      }
    }
    
    if (!urlExcluded) {
      const pathStart = url.indexOf('/', 8);
      if (pathStart !== -1) {
        const pathname = url.substring(pathStart).toLowerCase();
        for (const pattern of sitePatternSet) {
          if (pathname.includes(pattern)) {
            urlExcluded = true;
            urlExclusionReason = `Site-specific pattern: ${pattern}`;
            break;
          }
        }
      }
    }
    
    if (urlExcluded) {
      stats.filteredUrlPatterns++;
      
      if (examples.urlPatterns.length < 10) {
        examples.urlPatterns.push({
          url: url.substring(0, 60) + (url.length > 60 ? '...' : ''),
          reason: urlExclusionReason
        });
      }
      
      continue;
    }
    
    // 4. Check forum content
    if (page.meta_description && isForumContent(page.meta_description)) {
      stats.filteredForumContent++;
      
      if (examples.forumContent.length < 10) {
        examples.forumContent.push({
          url: url.substring(0, 60) + (url.length > 60 ? '...' : ''),
          reason: 'Forum content detected in meta description'
        });
      }
      
      continue;
    }
    
    // 5. Page passed all filters - process it
    indexablePages.push(processOnCrawlPage(page));
    stats.kept++;
  }
  
  const duration = Date.now() - startTime;
  
  console.log(`🔍 ENHANCED filtering completed in ${duration}ms:
    📊 Total: ${stats.total}
    🚫 Filtered out:
      💭 No content: ${stats.filteredNoContent} (${Math.round(stats.filteredNoContent/stats.total*100)}%)
      🔗 URL patterns: ${stats.filteredUrlPatterns} (${Math.round(stats.filteredUrlPatterns/stats.total*100)}%)
      💬 Forum content: ${stats.filteredForumContent} (${Math.round(stats.filteredForumContent/stats.total*100)}%)
      🔴 Status codes: ${stats.filteredStatusCode} (${Math.round(stats.filteredStatusCode/stats.total*100)}%)
    ✅ Kept: ${stats.kept} (${Math.round(stats.kept/stats.total*100)}%)
  `);
  
  if (examples.noContent.length > 0) {
    console.log(`💭 No content examples: ${examples.noContent.slice(0, 3).map(e => `${e.url} (${e.reason})`).join(', ')}`);
  }
  
  return { indexablePages, stats, examples };
}