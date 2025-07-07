// src/lib/services/embeding/embedding-matcher.ts - ENHANCED WITH DEBUG LOGS
import OpenAI from 'openai';
import { supabase } from '@/lib/db/client';
import { AnchorCandidate } from '../text-processor';
import { embeddingFromString } from './embeddings';

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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

export interface MatchingResult {
  matches: AnchorMatch[];
  totalCandidates: number;
  totalMatches: number;
  averageScore: number;
  debugInfo?: any;
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
 * Generate embedding for an anchor candidate with debug logs
 */
async function generateCandidateEmbedding(candidateText: string): Promise<number[]> {
  console.log(`🧠 Generating embedding for: "${candidateText}"`);
  const startTime = Date.now();
  
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: candidateText.trim(),
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Embedding generated in ${duration}ms (${response.data[0].embedding.length} dimensions)`);
    
    return response.data[0].embedding;
  } catch (error) {
    console.error(`❌ Failed to generate embedding for "${candidateText}":`, error);
    throw error;
  }
}

/**
 * Enhanced similarity search with timeout handling and debug logs
 */
async function findSimilarPagesEnhanced(
  embedding: number[],
  minSimilarity: number = 0.7,
  maxResults: number = 3
): Promise<{ pages: PageWithEmbedding[]; debugInfo: any }> {
  console.log(`🔍 Starting similarity search with threshold: ${minSimilarity}, limit: ${maxResults}`);
  const searchStartTime = Date.now();
  
  try {
    // Convert embedding to string format for Supabase function
    const embeddingStr = JSON.stringify(embedding);
    console.log(`📊 Query embedding size: ${embeddingStr.length} chars`);
    
    // First, let's check how many pages have embeddings
    const { count: totalEmbeddedPages, error: countError } = await supabase
      .from('pages')
      .select('id', { count: 'exact', head: true })
      .not('embedding', 'is', null);
    
    if (countError) {
      console.error('❌ Error counting embedded pages:', countError);
    } else {
      console.log(`📋 Database has ${totalEmbeddedPages} pages with embeddings`);
    }

    // Use a more aggressive timeout and lower similarity for debugging
    const debugSimilarity = Math.max(0.5, minSimilarity - 0.2); // Lower threshold for debugging
    const debugLimit = Math.min(maxResults * 2, 20); // More results for debugging
    
    console.log(`🔧 Debug search params: similarity=${debugSimilarity}, limit=${debugLimit}`);

    // Try the similarity search with timeout protection
    const searchPromise = supabase.rpc('find_similar_pages', {
      query_embedding: embeddingStr,
      similarity_threshold: debugSimilarity,
      match_limit: debugLimit
    });

    // Add manual timeout (8 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Manual timeout after 8 seconds')), 8000);
    });

    const { data, error } = await Promise.race([searchPromise, timeoutPromise]) as any;
    const searchDuration = Date.now() - searchStartTime;

    if (error) {
      console.error('❌ Similarity search error:', error);
      
      // If timeout, try a simpler approach
      if (error.code === '57014' || error.message?.includes('timeout')) {
        console.log('⚠️ Timeout detected, trying fallback approach...');
        return await tryFallbackSearch(minSimilarity, maxResults);
      }
      
      throw error;
    }

    const results = data || [];
    console.log(`✅ Similarity search completed in ${searchDuration}ms: ${results.length} results`);
    
    // Debug log results
    if (results.length > 0) {
      console.log(`🎯 Top result: "${results[0].title}" (similarity: ${results[0].similarity})`);
      console.log(`📊 Similarity scores: [${results.map((r: any) => r.similarity.toFixed(3)).join(', ')}]`);
    } else {
      console.log('🔍 No results found - this could mean:');
      console.log('  • Similarity threshold too high');
      console.log('  • No semantically similar content');
      console.log('  • Embedding quality issues');
    }

    // Filter by original similarity threshold
    const filteredResults = results.filter((r: any) => r.similarity >= minSimilarity);
    console.log(`📝 After filtering (similarity >= ${minSimilarity}): ${filteredResults.length} results`);

    // Map to our interface with real schema
    const pages: PageWithEmbedding[] = filteredResults.slice(0, maxResults).map((row: any) => ({
      id: row.id,
      url: row.url,
      title: row.title,
      meta_description: row.meta_description,
      h1: row.h1,
      embedding: row.embedding || '[]',
      similarity: row.similarity
    }));

    const debugInfo = {
      searchDuration,
      totalEmbeddedPages,
      rawResultCount: results.length,
      filteredResultCount: filteredResults.length,
      finalResultCount: pages.length,
      queryParams: { minSimilarity, maxResults, debugSimilarity, debugLimit },
      topSimilarities: results.slice(0, 5).map((r: any) => r.similarity)
    };

    return { pages, debugInfo };

  } catch (error: any) {
    const searchDuration = Date.now() - searchStartTime;
    console.error('❌ Similarity search failed:', error);
    
    const debugInfo = {
      searchDuration,
      error: error instanceof Error ? error.message : String(error),
      errorCode: error.code,
      queryParams: { minSimilarity, maxResults }
    };

    return { pages: [], debugInfo };
  }
}

/**
 * Fallback search when main similarity search times out
 */
async function tryFallbackSearch(
  minSimilarity: number,
  maxResults: number
): Promise<{ pages: PageWithEmbedding[]; debugInfo: any }> {
  console.log('🔄 Trying fallback search (simple query)...');
  const fallbackStart = Date.now();
  
  try {
    // Simple query to get random pages with embeddings for testing
    const { data: randomPages, error } = await supabase
      .from('pages')
      .select('id, url, title, meta_description, h1, embedding')
      .not('embedding', 'is', null)
      .not('title', 'is', null)
      .limit(maxResults);

    const fallbackDuration = Date.now() - fallbackStart;

    if (error) throw error;

    // Mock similarity scores for fallback
    const pages: PageWithEmbedding[] = (randomPages || []).map((page, index) => ({
      id: page.id,
      url: page.url,
      title: page.title,
      meta_description: page.meta_description,
      h1: page.h1,
      embedding: page.embedding || '[]',
      similarity: 0.8 - (index * 0.1) // Mock decreasing similarity
    }));

    console.log(`🔄 Fallback search returned ${pages.length} results in ${fallbackDuration}ms`);

    const debugInfo = {
      searchType: 'fallback',
      searchDuration: fallbackDuration,
      resultCount: pages.length,
      note: 'Using fallback due to timeout - results may not be semantically relevant'
    };

    return { pages, debugInfo };

  } catch (error: any) {
    console.error('❌ Fallback search also failed:', error);
    return { 
      pages: [], 
      debugInfo: { 
        searchType: 'fallback_failed', 
        error: error instanceof Error ? error.message : String(error) 
      } 
    };
  }
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
    
    return {
      id: page.id,
      title: page.title || 'Untitled Page',
      url: page.url,
      description: page.meta_description || 'No description available',
      matchedSection: match.section,
      matchedContent: match.content,
      relevanceScore: Math.round(page.similarity * 100) / 100
    };
  });
}

/**
 * Find matching pages for a single anchor candidate with enhanced debugging
 */
async function findCandidateMatches(
  candidate: AnchorCandidate,
  minSimilarity: number = 0.7,
  maxOptions: number = 3
): Promise<AnchorMatch & { debugInfo?: any }> {
  console.log(`\n🎯 Processing candidate: "${candidate.text}"`);
  const candidateStartTime = Date.now();
  
  try {
    // Generate embedding for the candidate
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
    minSimilarity = 0.7,
    maxOptionsPerAnchor = 3,
    onProgress
  } = options;
  
  console.log(`\n🚀 Starting enhanced anchor matching for ${candidates.length} candidates`);
  console.log(`📋 Parameters: similarity >= ${minSimilarity}, max options = ${maxOptionsPerAnchor}`);
  
  const matches: AnchorMatch[] = [];
  let totalMatches = 0;
  let totalScore = 0;
  const allDebugInfo: any[] = [];
  
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
  minSimilarity: number = 0.7
): Promise<MatchOption[]> {
  console.log(`\n🎯 Single anchor search: "${anchorText}"`);
  
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
  performanceCheck?: any;
}> {
  console.log('🔍 Running enhanced embedding compatibility check...');
  
  try {
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

    // Performance check - try a simple similarity search
    let performanceCheck = null;
    try {
      const testEmbedding = new Array(1536).fill(0.1); // Simple test embedding
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
      
      console.log(`⚡ Performance check: ${perfDuration}ms, ${testResults?.length || 0} results`);
      
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
        } catch (error) {
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