// src/lib/services/embeding/embedding-matcher.ts - ENHANCED WITH DEBUG LOGS AND WEIGHTED EMBEDDINGS
import { createServiceRoleClient } from '@/lib/supabase/server';
import { generateEmbedding, embeddingFromString } from './embeddings';
// DEPRECATED: Removed OnCrawl dependency
// import { DatabasePage } from '@/lib/services/oncrawl/types';

// Define the interface locally since OnCrawl is removed
interface DatabasePage {
  id: string;
  url: string;
  title?: string | null;
  meta_description?: string | null;
  h1?: string | null;
}

interface DatabasePageWithId extends DatabasePage {
  id: string;
  similarity: number;
  embedding?: number[]; // Raw embedding data from database
}

// Default configuration values
const DEFAULT_SIMILARITY_THRESHOLD = 0.52;

/**
 * Represents a potential anchor text with context
 */
interface AnchorCandidate {
  text: string;
  startIndex: number;
  endIndex: number;
  contextBefore: string;
  contextAfter: string;
  score: number;
}

export interface MatchOption {
  id: string;
  title: string;
  url: string;
  description: string;
  matchedSection: string; // 'H1', 'Title', 'Meta', 'Semantic'
  matchedContent: string; // The actual content that matched
  relevanceScore: number;
}

export interface AnchorMatch {
  anchor: AnchorCandidate;
  options: MatchOption[];
}

interface DebugInfo {
  searchDuration?: number;
  rawResultCount?: number;
  filteredResultCount?: number;
  finalResultCount?: number;
  attempts?: number;
  topSimilarities?: number[];
  searchType?: 'failed' | 'success';
  error?: string;
  errorCode?: string;
  duration?: number;
  success?: boolean;
  resultCount?: number;
  candidate?: string;
}

export interface MatchingResult {
  matches: AnchorMatch[];
  totalCandidates: number;
  totalMatches: number;
  averageScore: number;
  debugInfo?: Partial<DebugInfo>[];
}

// CORRECTED: Use actual database schema
interface PageWithEmbedding {
  id: string;
  url: string;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  embedding: string; // JSON string in database
  similarity: number; // Added by similarity function
}

/**
 * Generate embedding for an anchor candidate with debug logs using weighted approach
 */
async function generateCandidateEmbedding(candidateText: string): Promise<number[]> {
  console.log(`🧠 Generating weighted embedding for: "${candidateText}"`);
  const startTime = Date.now();
  
  try {
    // Use weighted embedding generation with title focus since anchor text is like a title
    const embedding = await generateEmbedding(candidateText, null, null);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Weighted embedding generated in ${duration}ms`);
    
    return embedding;
  } catch (error) {
    console.error(`❌ Failed to generate weighted embedding for "${candidateText}":`, error);
    throw error;
  }
}

/**
 * Enhanced similarity search with proper timeout and retry handling
 */
async function findSimilarPagesEnhanced(
  embedding: number[],
  minSimilarity: number = 0.7,
  maxResults: number = 3,
  maxRetries: number = 2
): Promise<{ pages: PageWithEmbedding[]; debugInfo: DebugInfo }> {
  console.log(`🔍 Starting similarity search with threshold: ${minSimilarity}, limit: ${maxResults}`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const searchStartTime = Date.now();
    
    try {
      const embeddingStr = JSON.stringify(embedding);
      
      // Increase timeout based on database size - 30 seconds for large datasets
      const timeoutMs = 30000;
      
      const supabase = createServiceRoleClient();
      const searchPromise = supabase.rpc('find_similar_pages', {
        query_embedding: embeddingStr,
        similarity_threshold: Math.max(0.5, minSimilarity - 0.2),
        match_limit: Math.min(maxResults * 2, 20)
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Search timeout after ${timeoutMs}ms (attempt ${attempt})`)), timeoutMs);
      });

      const { data, error } = await Promise.race([searchPromise, timeoutPromise]) as { data: DatabasePageWithId[] | null; error: { code?: string; message?: string } | null };
      const searchDuration = Date.now() - searchStartTime;

      if (error) {
        // Check for specific PostgreSQL timeout error
        if (error.code === '57014' || error.message?.includes('timeout') || error.message?.includes('canceling statement')) {
          console.log(`⏱️ PostgreSQL timeout on attempt ${attempt}/${maxRetries} after ${searchDuration}ms`);
          
          if (attempt < maxRetries) {
            // Exponential backoff: wait longer between retries
            const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`🔄 Retrying in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue; // Retry
          }
        }
        
        console.error(`❌ Similarity search failed on attempt ${attempt}:`, error);
        return { 
          pages: [], 
          debugInfo: { 
            searchType: 'failed',
            error: error.message || String(error),
            searchDuration,
            attempts: attempt,
            errorCode: error.code
          } 
        };
      }

      const results = data || [];
      console.log(`✅ Similarity search succeeded on attempt ${attempt} in ${searchDuration}ms: ${results.length} results`);
      
      // Filter and process results
      const filteredResults = results.filter((r: { similarity: number }) => r.similarity >= minSimilarity);
      const pages: PageWithEmbedding[] = filteredResults.slice(0, maxResults).map((row: DatabasePageWithId) => ({
        id: row.id,
        url: row.url,
        title: row.title ?? null,
        meta_description: row.meta_description ?? null,
        h1: row.h1 ?? null,
        embedding: Array.isArray(row.embedding) ? JSON.stringify(row.embedding) : '[]',
        similarity: row.similarity
      }));

      const debugInfo = {
        searchDuration,
        rawResultCount: results.length,
        filteredResultCount: filteredResults.length,
        finalResultCount: pages.length,
        attempts: attempt,
        topSimilarities: results.slice(0, 5).map((r: { similarity: number }) => r.similarity)
      };

      return { pages, debugInfo };

    } catch (error: unknown) {
      const searchDuration = Date.now() - searchStartTime;
      console.error(`❌ Similarity search error on attempt ${attempt}:`, error);
      
      const err = error as { message?: string; code?: string };
      if (attempt < maxRetries && (
        err.message?.includes('timeout') || 
        err.message?.includes('canceling') ||
        err.code === '57014'
      )) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`🔄 Retrying in ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
      
      return { 
        pages: [], 
        debugInfo: {
          searchType: 'failed',
          error: err.message || String(error),
          searchDuration,
          attempts: attempt
        }
      };
    }
  }

  // This should never be reached, but TypeScript needs it
  return { 
    pages: [], 
    debugInfo: { 
      searchType: 'failed', 
      error: 'Max retries exceeded',
      attempts: maxRetries 
    } 
  };
}

/**
 * CORRECTED: Determine which section of a page caused the match using real fields
 */
function determineMatchedSection(
  candidateText: string, 
  page: PageWithEmbedding
): { section: string; content: string } {
  const candidate = candidateText.toLowerCase();
  
  // Check title match
  if (page.title && page.title.toLowerCase().includes(candidate)) {
    return { section: 'Title', content: page.title };
  }
  
  // Check H1 match
  if (page.h1 && page.h1.toLowerCase().includes(candidate)) {
    return { section: 'H1', content: page.h1 };
  }
  
  // Check meta description match
  if (page.meta_description && page.meta_description.toLowerCase().includes(candidate)) {
    return { section: 'Meta', content: page.meta_description };
  }
  
  // If no direct match found, it's semantic similarity
  return { 
    section: 'Semantic', 
    content: page.h1 || page.title || 'Content similarity detected'
  };
}

/**
 * CORRECTED: Create match options from similar pages using real schema
 */
function createMatchOptions(
  candidateText: string,
  similarPages: PageWithEmbedding[]
): MatchOption[] {
  return similarPages.map(page => {
    const match = determineMatchedSection(candidateText, page);
    
    // Apply bonus based on match type
    let score = page.similarity;
    if (match.section === 'Title') {
      score += 0.15; // +15% bonus for title matches
    } else if (match.section === 'H1') {
      score += 0.12; // +12% bonus for H1 matches  
    } else if (match.section === 'Meta') {
      score += 0.10; // +10% bonus for meta matches
    } else {
      score += 0.07; // +5% bonus for semantic matches
    }
    
    return {
      id: page.id,
      title: page.title || 'Untitled Page',
      url: page.url,
      description: page.meta_description || 'No description available',
      matchedSection: match.section,
      matchedContent: match.content,
      relevanceScore: Math.min(1, Math.round(score * 100) / 100) // Cap at 100%
    };
  });
}

/**
 * Find matching pages for a single anchor candidate with enhanced debugging
 */
async function findCandidateMatches(
  candidate: AnchorCandidate,
  minSimilarity: number = DEFAULT_SIMILARITY_THRESHOLD,
  maxOptions: number = 3
): Promise<AnchorMatch & { debugInfo?: DebugInfo }> {
  console.log(`\n🎯 Processing candidate: "${candidate.text}"`);
  const candidateStartTime = Date.now();
  
  try {
    // Generate weighted embedding for the candidate
    const embedding = await generateCandidateEmbedding(candidate.text);
    
    // Find similar pages using enhanced function
    const { pages: similarPages, debugInfo } = await findSimilarPagesEnhanced(
      embedding, 
      minSimilarity, 
      maxOptions
    );
    
    // Create match options using corrected schema
    const options = createMatchOptions(candidate.text, similarPages);
    
    const candidateDuration = Date.now() - candidateStartTime;
    console.log(`✅ Candidate "${candidate.text}" processed in ${candidateDuration}ms: ${options.length} matches`);
    
    return {
      anchor: candidate,
      options: options.slice(0, maxOptions),
      debugInfo
    };
    
  } catch (error) {
    const candidateDuration = Date.now() - candidateStartTime;
    console.error(`❌ Failed to find matches for "${candidate.text}" after ${candidateDuration}ms:`, error);
    
    // Return empty match in case of error
    return {
      anchor: candidate,
      options: [],
      debugInfo: { error: error instanceof Error ? error.message : String(error), duration: candidateDuration }
    };
  }
}

/**
 * Main function to find matches for all anchor candidates with enhanced debugging
 */
export async function findAnchorMatches(
  candidates: AnchorCandidate[],
  options: {
    minSimilarity?: number;
    maxOptionsPerAnchor?: number;
    onProgress?: (processed: number, total: number) => void;
  } = {}
): Promise<MatchingResult> {
  const {
    minSimilarity = DEFAULT_SIMILARITY_THRESHOLD,
    maxOptionsPerAnchor = 3,
    onProgress
  } = options;
  
  console.log(`\n🚀 Starting enhanced anchor matching for ${candidates.length} candidates`);
  console.log(`📋 Parameters: similarity >= ${minSimilarity}, max options = ${maxOptionsPerAnchor}`);
  
  const matches: AnchorMatch[] = [];
  let totalMatches = 0;
  let totalScore = 0;
  const allDebugInfo: Partial<DebugInfo>[] = [];
  
  // Process candidates with rate limiting
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    
    try {
      const anchorMatch = await findCandidateMatches(
        candidate, 
        minSimilarity, 
        maxOptionsPerAnchor
      );
      
      // Store debug info
      if ('debugInfo' in anchorMatch) {
        allDebugInfo.push({
          candidate: candidate.text,
          ...anchorMatch.debugInfo
        });
      }
      
      // Only include anchors that have at least one match
      if (anchorMatch.options.length > 0) {
        matches.push(anchorMatch);
        totalMatches += anchorMatch.options.length;
        
        // Calculate average score for this anchor's options
        const anchorScore = anchorMatch.options.reduce((sum, opt) => sum + opt.relevanceScore, 0);
        totalScore += anchorScore;
        
        console.log(`✅ Found ${anchorMatch.options.length} matches for "${candidate.text}"`);
      } else {
        console.log(`🔍 No matches found for "${candidate.text}"`);
      }
      
      // Report progress if callback provided
      if (onProgress) {
        onProgress(i + 1, candidates.length);
      }
      
      // Rate limiting: wait 100ms between requests
      if (i < candidates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`❌ Error processing candidate "${candidate.text}":`, error);
      // Continue with other candidates
    }
  }
  
  const averageScore = totalMatches > 0 ? Math.round(totalScore / totalMatches * 100) / 100 : 0;
  
  console.log(`\n🎉 Enhanced matching completed:`);
  console.log(`  📊 ${matches.length} anchors with matches`);
  console.log(`  🔗 ${totalMatches} total options`);
  console.log(`  ⭐ Average score: ${averageScore}`);
  
  return {
    matches,
    totalCandidates: candidates.length,
    totalMatches,
    averageScore,
    debugInfo: allDebugInfo
  };
}

/**
 * Get matches for specific anchor text with enhanced debugging
 */
export async function getMatchesForAnchor(
  anchorText: string,
  maxOptions: number = 5,
  minSimilarity: number = DEFAULT_SIMILARITY_THRESHOLD
): Promise<MatchOption[]> {
  console.log(`\n🎯 Single anchor search with weighted embedding: "${anchorText}"`);
  
  try {
    // Create a minimal anchor candidate
    const candidate: AnchorCandidate = {
      text: anchorText,
      startIndex: 0,
      endIndex: anchorText.length,
      contextBefore: '',
      contextAfter: '',
      score: 1
    };
    
    const match = await findCandidateMatches(candidate, minSimilarity, maxOptions);
    
    // Log debug info if available
    if ('debugInfo' in match && match.debugInfo) {
      console.log('🔍 Debug info:', match.debugInfo);
    }
    
    return match.options;
    
  } catch (error) {
    console.error(`❌ Failed to get matches for anchor "${anchorText}":`, error);
    return [];
  }
}

/**
 * Check database embedding compatibility with enhanced diagnostics
 */
export async function checkEmbeddingCompatibility(): Promise<{
  totalPages: number;
  pagesWithEmbeddings: number;
  compatibilityIssues: string[];
  performanceCheck?: Partial<DebugInfo>;
}> {
  console.log('🔍 Running enhanced embedding compatibility check for weighted embeddings...');
  
  try {
    const supabase = createServiceRoleClient();

    // Check total pages
    const { count: totalPages, error: countError } = await supabase
      .from('pages')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Check pages with embeddings
    const { count: pagesWithEmbeddings, error: embeddingError } = await supabase
      .from('pages')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);

    if (embeddingError) throw embeddingError;

    // Performance check - try a weighted similarity search
    let performanceCheck = null;
    try {
      // Generate a test weighted embedding
      const testEmbedding = await generateEmbedding("Test Page", "Test H1", "Test Description");
      const perfStart = Date.now();
      
      const { data: testResults, error: perfError } = await supabase.rpc('find_similar_pages', {
        query_embedding: JSON.stringify(testEmbedding),
        similarity_threshold: 0.5,
        match_limit: 1
      });
      
      const perfDuration = Date.now() - perfStart;
      
      performanceCheck = {
        success: !perfError,
        duration: perfDuration,
        resultCount: testResults?.length || 0,
        error: perfError?.message
      };
      
      console.log(`⚡ Performance check with weighted embedding: ${perfDuration}ms, ${testResults?.length || 0} results`);
      
    } catch (perfErr) {
      console.log('⚠️ Performance check failed:', perfErr);
      performanceCheck = { success: false, error: String(perfErr) };
    }

    // Check for invalid embeddings
    const { data: sampleEmbeddings, error: sampleError } = await supabase
      .from('pages')
      .select('id, embedding')
      .not('embedding', 'is', null)
      .limit(5);

    const issues: string[] = [];
    
    if (sampleError) {
      issues.push(`Failed to sample embeddings: ${sampleError.message}`);
    } else if (sampleEmbeddings) {
      for (const page of sampleEmbeddings) {
        try {
          if (page.embedding) {
            const parsed = embeddingFromString(page.embedding);
            if (!Array.isArray(parsed) || parsed.length === 0) {
              issues.push(`Page ${page.id} has invalid embedding format`);
            }
          }
        } catch {
          issues.push(`Page ${page.id} has unparseable embedding`);
        }
      }
    }

    // Add performance issues
    if (performanceCheck && !performanceCheck.success) {
      issues.push(`Similarity search failing: ${performanceCheck.error}`);
    } else if (performanceCheck?.duration && performanceCheck.duration > 5000) {
      issues.push(`Similarity search is slow (${performanceCheck.duration}ms) - consider adding vector index`);
    }

    return {
      totalPages: totalPages || 0,
      pagesWithEmbeddings: pagesWithEmbeddings || 0,
      compatibilityIssues: issues,
      performanceCheck
    };

  } catch (error) {
    return {
      totalPages: 0,
      pagesWithEmbeddings: 0,
      compatibilityIssues: [`Database check failed: ${error}`],
      performanceCheck: { success: false, error: String(error) }
    };
  }
}