// src/lib/services/embedding/embedding-matcher.ts - CORRECTED VERSION
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
 * Generate embedding for an anchor candidate
 */
async function generateCandidateEmbedding(candidateText: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: candidateText.trim(),
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error(`Failed to generate embedding for "${candidateText}":`, error);
    throw error;
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
 * CORRECTED: Find similar pages using Supabase vector similarity with real schema
 */
async function findSimilarPages(
  embedding: number[],
  minSimilarity: number = 0.7,
  maxResults: number = 3
): Promise<PageWithEmbedding[]> {
  try {
    // Convert embedding to string format for Supabase function
    const embeddingStr = JSON.stringify(embedding);
    
    const { data, error } = await supabase.rpc('find_similar_pages', {
      query_embedding: embeddingStr,
      similarity_threshold: minSimilarity,
      match_limit: maxResults
    });

    if (error) {
      console.error('Similarity search error:', error);
      throw error;
    }

    // CORRECTED: Map to our interface with real schema
    return (data || []).map((row: any) => ({
      id: row.id,
      url: row.url,
      title: row.title,
      meta_description: row.meta_description,
      h1: row.h1,
      embedding: row.embedding || '[]', // Handle null embeddings
      similarity: row.similarity
    }));

  } catch (error) {
    console.error('Failed to find similar pages:', error);
    return [];
  }
}

/**
 * Find matching pages for a single anchor candidate
 */
async function findCandidateMatches(
  candidate: AnchorCandidate,
  minSimilarity: number = 0.7,
  maxOptions: number = 3
): Promise<AnchorMatch> {
  try {
    // Generate embedding for the candidate
    const embedding = await generateCandidateEmbedding(candidate.text);
    
    // Find similar pages using corrected function
    const similarPages = await findSimilarPages(embedding, minSimilarity, maxOptions);
    
    // Create match options using corrected schema
    const options = createMatchOptions(candidate.text, similarPages);
    
    return {
      anchor: candidate,
      options: options.slice(0, maxOptions)
    };
    
  } catch (error) {
    console.error(`Failed to find matches for "${candidate.text}":`, error);
    
    // Return empty match in case of error
    return {
      anchor: candidate,
      options: []
    };
  }
}

/**
 * Main function to find matches for all anchor candidates
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
  
  const matches: AnchorMatch[] = [];
  let totalMatches = 0;
  let totalScore = 0;
  
  console.log(`🔍 Finding matches for ${candidates.length} anchor candidates...`);
  
  // Process candidates with rate limiting
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    
    try {
      const anchorMatch = await findCandidateMatches(
        candidate, 
        minSimilarity, 
        maxOptionsPerAnchor
      );
      
      // Only include anchors that have at least one match
      if (anchorMatch.options.length > 0) {
        matches.push(anchorMatch);
        totalMatches += anchorMatch.options.length;
        
        // Calculate average score for this anchor's options
        const anchorScore = anchorMatch.options.reduce((sum, opt) => sum + opt.relevanceScore, 0);
        totalScore += anchorScore;
        
        console.log(`✓ Found ${anchorMatch.options.length} matches for "${candidate.text}"`);
      } else {
        console.log(`○ No matches found for "${candidate.text}"`);
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
      console.error(`Error processing candidate "${candidate.text}":`, error);
      // Continue with other candidates
    }
  }
  
  const averageScore = totalMatches > 0 ? Math.round(totalScore / totalMatches * 100) / 100 : 0;
  
  console.log(`🎉 Matching completed: ${matches.length} anchors with matches, ${totalMatches} total options, avg score: ${averageScore}`);
  
  return {
    matches,
    totalCandidates: candidates.length,
    totalMatches,
    averageScore
  };
}

/**
 * Get matches for specific anchor text (useful for single queries)
 */
export async function getMatchesForAnchor(
  anchorText: string,
  maxOptions: number = 5,
  minSimilarity: number = 0.7
): Promise<MatchOption[]> {
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
    return match.options;
    
  } catch (error) {
    console.error(`Failed to get matches for anchor "${anchorText}":`, error);
    return [];
  }
}

/**
 * Check database embedding compatibility
 */
export async function checkEmbeddingCompatibility(): Promise<{
  totalPages: number;
  pagesWithEmbeddings: number;
  compatibilityIssues: string[];
}> {
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

    return {
      totalPages: totalPages || 0,
      pagesWithEmbeddings: pagesWithEmbeddings || 0,
      compatibilityIssues: issues
    };

  } catch (error) {
    return {
      totalPages: 0,
      pagesWithEmbeddings: 0,
      compatibilityIssues: [`Database check failed: ${error}`]
    };
  }
}