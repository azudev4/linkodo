import OpenAI from 'openai';
import { findSimilarPages, SimilarPage, supabase } from '@/lib/db/client';
import { AnchorCandidate } from '../text-processor';
import { PageData } from '@/lib/db/client';
// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export interface MatchOption {
  id: string;
  title: string;
  url: string;
  description: string;
  matchedSection: string; // 'H1', 'H2', 'H3', 'Keywords'
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

export interface SuggestionMatch {
  page: PageData;
  score: number;
  matchedSection: string; // 'H1', 'H2', 'H3', 'Keywords'
  matchedContent: string;
  reason: string;
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
 * Determine which section of a page caused the match
 */
function determineMatchedSection(
  candidateText: string, 
  page: SimilarPage
): { section: string; content: string } {
  const candidate = candidateText.toLowerCase();
  
  // Check H1 match
  if (page.h1 && page.h1.toLowerCase().includes(candidate)) {
    return { section: 'H1', content: page.h1 };
  }
  
  // Check H2 matches
  if (page.h2_tags) {
    for (const h2 of page.h2_tags) {
      if (h2.toLowerCase().includes(candidate)) {
        return { section: 'H2', content: h2 };
      }
    }
  }
  
  // Check H3 matches
  if (page.h3_tags) {
    for (const h3 of page.h3_tags) {
      if (h3.toLowerCase().includes(candidate)) {
        return { section: 'H3', content: h3 };
      }
    }
  }
  

  
  // Check primary keywords
  if (page.primary_keywords) {
    for (const keyword of page.primary_keywords) {
      if (keyword.toLowerCase().includes(candidate) || candidate.includes(keyword.toLowerCase())) {
        return { section: 'Keywords', content: keyword };
      }
    }
  }
  
  // If no direct match found, it's likely semantic similarity
  // Use the title or H1 as the matched content
  return { 
    section: 'Semantic', 
    content: page.h1 || page.title || 'Content similarity' 
  };
}

/**
 * Create match options from similar pages
 */
function createMatchOptions(
  candidateText: string,
  similarPages: SimilarPage[]
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
    
    // Find similar pages using our Supabase function
    const similarPages = await findSimilarPages(embedding, minSimilarity, maxOptions);
    
    // Create match options
    const options = createMatchOptions(candidate.text, similarPages);
    
    return {
      anchor: candidate,
      options: options.slice(0, maxOptions) // Ensure we don't exceed max options
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
  
  // Process candidates with rate limiting to avoid API limits
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
      }
      
      // Report progress if callback provided
      if (onProgress) {
        onProgress(i + 1, candidates.length);
      }
      
      // Rate limiting: wait 100ms between requests to avoid overwhelming APIs
      if (i < candidates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`Error processing candidate "${candidate.text}":`, error);
      // Continue with other candidates
    }
  }
  
  return {
    matches,
    totalCandidates: candidates.length,
    totalMatches,
    averageScore: totalMatches > 0 ? Math.round(totalScore / totalMatches * 100) / 100 : 0
  };
}

/**
 * Filter matches by minimum score threshold
 */
export function filterMatchesByScore(
  result: MatchingResult, 
  minScore: number = 0.8
): MatchingResult {
  const filteredMatches = result.matches.map(match => ({
    ...match,
    options: match.options.filter(option => option.relevanceScore >= minScore)
  })).filter(match => match.options.length > 0);
  
  const totalMatches = filteredMatches.reduce((sum, match) => sum + match.options.length, 0);
  const totalScore = filteredMatches.reduce((sum, match) => 
    sum + match.options.reduce((optSum, opt) => optSum + opt.relevanceScore, 0), 0
  );
  
  return {
    matches: filteredMatches,
    totalCandidates: result.totalCandidates,
    totalMatches,
    averageScore: totalMatches > 0 ? Math.round(totalScore / totalMatches * 100) / 100 : 0
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
 * Batch process multiple anchor texts (useful for testing)
 */
export async function batchProcessAnchors(
  anchorTexts: string[],
  maxOptionsPerAnchor: number = 3
): Promise<{ [anchorText: string]: MatchOption[] }> {
  const result: { [anchorText: string]: MatchOption[] } = {};
  
  for (const anchorText of anchorTexts) {
    try {
      result[anchorText] = await getMatchesForAnchor(anchorText, maxOptionsPerAnchor);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Failed to process anchor "${anchorText}":`, error);
      result[anchorText] = [];
    }
  }
  
  return result;
}

function findBestMatch(page: PageData, candidates: string[]): { section: string; content: string } | null {
  // Priority order: H1 > H2 > H3 > Keywords
  
  // Check H1 match
  if (page.h1) {
    for (const candidate of candidates) {
      if (page.h1.toLowerCase().includes(candidate)) {
        return { section: 'H1', content: page.h1 };
      }
    }
  }

  // Check H2 matches
  if (page.h2_tags) {
    for (const h2 of page.h2_tags) {
      for (const candidate of candidates) {
        if (h2.toLowerCase().includes(candidate)) {
          return { section: 'H2', content: h2 };
        }
      }
    }
  }

  // Check H3 matches
  if (page.h3_tags) {
    for (const h3 of page.h3_tags) {
      for (const candidate of candidates) {
        if (h3.toLowerCase().includes(candidate)) {
          return { section: 'H3', content: h3 };
        }
      }
    }
  }

  // Check keyword matches
  if (page.primary_keywords) {
    for (const keyword of page.primary_keywords) {
      for (const candidate of candidates) {
        if (keyword.toLowerCase().includes(candidate)) {
          return { section: 'Keywords', content: keyword };
        }
      }
    }
  }

  return null;
}