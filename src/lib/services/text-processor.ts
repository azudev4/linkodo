export interface AnchorCandidate {
    text: string;
    startIndex: number;
    endIndex: number;
    contextBefore: string;
    contextAfter: string;
    score: number; // Relevance score for this candidate
  }
  
  /**
   * French stop words and common words to avoid linking
   */
  const FRENCH_STOP_WORDS = new Set([
    // Articles
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
    // Prepositions  
    'dans', 'sur', 'avec', 'pour', 'par', 'sans', 'sous', 'vers', 'chez',
    // Pronouns
    'il', 'elle', 'ils', 'elles', 'nous', 'vous', 'je', 'tu', 'me', 'te', 'se',
    'son', 'sa', 'ses', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'leur', 'leurs',
    'ce', 'cette', 'ces', 'cet', 'celui', 'celle', 'ceux', 'celles',
    // Common verbs
    'être', 'avoir', 'faire', 'dire', 'aller', 'voir', 'savoir', 'pouvoir',
    'vouloir', 'venir', 'falloir', 'devoir', 'prendre', 'donner', 'mettre',
    // Common adjectives/adverbs
    'très', 'plus', 'moins', 'bien', 'mal', 'tout', 'tous', 'toute', 'toutes',
    'autre', 'même', 'tel', 'telle', 'grand', 'petit', 'bon', 'mauvais',
    // Conjunctions
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or', 'que', 'qui', 'quoi',
    'dont', 'où', 'quand', 'comment', 'pourquoi', 'si', 'comme',
    // Time/frequency
    'aujourd', 'hier', 'demain', 'maintenant', 'déjà', 'encore', 'jamais',
    'toujours', 'souvent', 'parfois', 'alors', 'puis', 'après', 'avant'
  ]);
  
  /**
   * Common generic words that shouldn't be linked
   */
  const GENERIC_WORDS = new Set([
    'chose', 'choses', 'façon', 'manière', 'moment', 'temps', 'fois',
    'exemple', 'cas', 'part', 'place', 'point', 'problème', 'question',
    'raison', 'résultat', 'situation', 'solution', 'travail', 'vie',
    'année', 'mois', 'semaine', 'jour', 'heure', 'minute'
  ]);
  
  /**
   * Gardening-related terms that are good anchor candidates
   */
  const GARDENING_INDICATORS = new Set([
    // Plants
    'tomate', 'tomates', 'haricot', 'haricots', 'courgette', 'courgettes',
    'radis', 'carotte', 'carottes', 'salade', 'salades', 'épinard', 'épinards',
    'petit', 'pois', 'fève', 'fèves', 'artichaut', 'artichauts',
    // Techniques
    'semis', 'plantation', 'culture', 'récolte', 'arrosage', 'paillage',
    'compost', 'compostage', 'binage', 'buttage', 'éclaircissage',
    'repiquage', 'transplantation', 'greffage', 'taille', 'élagage',
    // Tools & materials
    'bêche', 'râteau', 'binette', 'sécateur', 'arrosoir', 'serre', 'tunnel',
    'paillis', 'engrais', 'fumier', 'terreau', 'substrat',
    // Soil & conditions
    'sol', 'terre', 'terreau', 'drainage', 'humidité', 'exposition',
    'ombre', 'soleil', 'température', 'climat', 'gel', 'sécheresse',
    // Time & seasons
    'printemps', 'été', 'automne', 'hiver', 'saison', 'mois', 'mars',
    'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre'
  ]);
  
  /**
   * Clean and normalize text for processing
   */
  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/['']/g, "'") // Normalize apostrophes
      .replace(/[^\w\s'àâäéèêëïîôùûüÿç-]/g, ' ') // Keep French chars and hyphens
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Check if a word is a good candidate for linking
   */
  function isLinkableWord(word: string): boolean {
    const normalized = word.toLowerCase();
    
    // Skip if too short or too long
    if (normalized.length < 3 || normalized.length > 20) return false;
    
    // Skip stop words and generic terms
    if (FRENCH_STOP_WORDS.has(normalized) || GENERIC_WORDS.has(normalized)) return false;
    
    // Skip if it's just numbers or punctuation
    if (/^\d+$/.test(normalized) || /^[^\w]+$/.test(normalized)) return false;
    
    return true;
  }
  
  /**
   * Score a phrase based on its potential as an anchor
   */
  function scorePhrase(phrase: string): number {
    const words = phrase.toLowerCase().split(/\s+/);
    let score = 0;
    
    // Base score for length (2-4 words is ideal)
    if (words.length === 2) score += 3;
    else if (words.length === 3) score += 4;
    else if (words.length === 4) score += 2;
    else if (words.length === 1) score += 1;
    else score -= 1; // Penalty for very long phrases
    
    // Bonus for gardening-related terms
    for (const word of words) {
      if (GARDENING_INDICATORS.has(word)) {
        score += 2;
      }
    }
    
    // Bonus for compound words (French gardening terms often compound)
    if (phrase.includes('-')) score += 1;
    
    // Penalty if contains too many stop words
    const stopWordCount = words.filter(word => FRENCH_STOP_WORDS.has(word)).length;
    if (stopWordCount / words.length > 0.5) score -= 2;
    
    return Math.max(0, score);
  }
  
  /**
   * Extract noun phrases and meaningful concepts from text
   */
  function extractPhrases(text: string): string[] {
    const normalized = normalizeText(text);
    const sentences = normalized.split(/[.!?]+/);
    const phrases: string[] = [];
    
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      
      // Extract 1-4 word phrases
      for (let length = 1; length <= 4; length++) {
        for (let i = 0; i <= words.length - length; i++) {
          const phrase = words.slice(i, i + length).join(' ');
          
          // Check if all words in phrase are linkable
          const phraseWords = phrase.split(/\s+/);
          if (phraseWords.every(word => isLinkableWord(word))) {
            phrases.push(phrase);
          }
        }
      }
    }
    
    return [...new Set(phrases)]; // Remove duplicates
  }
  
  /**
   * Get context around a phrase in the original text
   */
  function getContext(text: string, phrase: string, startIndex: number): {
    contextBefore: string;
    contextAfter: string;
  } {
    const contextLength = 30; // Characters of context
    
    const beforeStart = Math.max(0, startIndex - contextLength);
    const afterEnd = Math.min(text.length, startIndex + phrase.length + contextLength);
    
    const contextBefore = text.substring(beforeStart, startIndex).trim();
    const contextAfter = text.substring(startIndex + phrase.length, afterEnd).trim();
    
    return {
      contextBefore: contextBefore.split(/\s+/).slice(-5).join(' '), // Last 5 words
      contextAfter: contextAfter.split(/\s+/).slice(0, 5).join(' ')   // First 5 words
    };
  }
  
  /**
   * Find all occurrences of phrases in the original text
   */
  function findPhraseOccurrences(text: string, phrases: string[]): AnchorCandidate[] {
    const candidates: AnchorCandidate[] = [];
    const normalizedText = normalizeText(text);
    
    for (const phrase of phrases) {
      const score = scorePhrase(phrase);
      
      // Skip low-scoring phrases
      if (score < 2) continue;
      
      // Find all occurrences in normalized text
      let searchIndex = 0;
      while (true) {
        const index = normalizedText.indexOf(phrase, searchIndex);
        if (index === -1) break;
        
        // Map back to original text position (approximately)
        const originalIndex = text.toLowerCase().indexOf(phrase.toLowerCase(), 
          Math.max(0, index - 10));
        
        if (originalIndex !== -1) {
          const context = getContext(text, phrase, originalIndex);
          
          candidates.push({
            text: phrase,
            startIndex: originalIndex,
            endIndex: originalIndex + phrase.length,
            contextBefore: context.contextBefore,
            contextAfter: context.contextAfter,
            score
          });
        }
        
        searchIndex = index + 1;
      }
    }
    
    return candidates;
  }
  
  /**
   * Remove overlapping candidates (keep the highest scoring one)
   */
  function removeOverlaps(candidates: AnchorCandidate[]): AnchorCandidate[] {
    // Sort by score descending
    const sorted = candidates.sort((a, b) => b.score - a.score);
    const filtered: AnchorCandidate[] = [];
    
    for (const candidate of sorted) {
      // Check if this candidate overlaps with any already selected
      const hasOverlap = filtered.some(existing => 
        (candidate.startIndex < existing.endIndex && candidate.endIndex > existing.startIndex)
      );
      
      if (!hasOverlap) {
        filtered.push(candidate);
      }
    }
    
    return filtered.sort((a, b) => a.startIndex - b.startIndex);
  }
  
  /**
   * Main function to extract anchor candidates from user text
   */
  export function extractAnchorCandidates(text: string): AnchorCandidate[] {
    if (!text || text.trim().length < 10) {
      return [];
    }
    
    // Extract potential phrases
    const phrases = extractPhrases(text);
    
    // Find occurrences in original text
    const candidates = findPhraseOccurrences(text, phrases);
    
    // Remove overlapping candidates
    const filtered = removeOverlaps(candidates);
    
    // Return top candidates (max 20 for performance)
    return filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }
  
  /**
   * Get statistics about the analysis
   */
  export function getAnalysisStats(text: string, candidates: AnchorCandidate[]) {
    const wordCount = text.trim().split(/\s+/).length;
    const linkDensity = candidates.length / wordCount * 100;
    
    return {
      wordCount,
      candidateCount: candidates.length,
      linkDensity: Math.round(linkDensity * 100) / 100,
      averageScore: candidates.length > 0 
        ? Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length * 100) / 100
        : 0
    };
  }