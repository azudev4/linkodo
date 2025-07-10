// src/components/linking/interface/TextAnalyzer.tsx
'use client';

import { useState, useEffect, startTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Loader2, 
  Sparkles,
  Brain,
  Copy,
  Code
} from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { AnalyzedTerms } from './AnalyzedTerms';
import { SuggestionsList } from './SuggestionsList';
import { useIsMobile } from '@/hooks/use-mobile';

interface LinkSuggestion {
  id: string;
  title: string;
  url: string;
  description: string;
  matchedSection: string;
  relevanceScore: number;
}

interface Selection {
  text: string;
  startOffset: number;
  endOffset: number;
}

interface AnalyzedTerm {
  text: string;
  hasResults: boolean;
  suggestionCount: number;
  suggestions: LinkSuggestion[];
  isValidated?: boolean;
}

interface ValidatedAnchor {
  anchorText: string;
  url: string;
  suggestionId: string;
}

export function TextAnalyzer() {
  const isMobile = useIsMobile();
  const [text, setText] = useState(`Lorsque vous planifiez votre potager pour cette saison...`);
  
  const loadingRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [selectedText, setSelectedText] = useState<Selection | null>(null);
  const [analyzedTerms, setAnalyzedTerms] = useState<AnalyzedTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [validatedAnchors, setValidatedAnchors] = useState<ValidatedAnchor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [latestLinkText, setLatestLinkText] = useState<string | null>(null);

  // Clear error after delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Highlight newly validated links after DOM updates
  useEffect(() => {
    if (latestLinkText) {
      // Wait for DOM to update after text change
      const timeoutId = setTimeout(() => {
        const links = document.querySelectorAll('a');
        const targetLink = Array.from(links).find(link => 
          link.textContent === latestLinkText
        );

        if (targetLink) {
          targetLink.classList.add('animate-highlight');
          setTimeout(() => {
            targetLink.classList.remove('animate-highlight');
            setLatestLinkText(null);
          }, 1500);
        }
      }, 50); // Small delay to ensure DOM is updated

      return () => clearTimeout(timeoutId);
    }
  }, [latestLinkText, text]); // Watch both latestLinkText and text changes

  const clearMessages = () => {
    setError(null);
  };

  // 🎯 FINAL CLEAN VERSION - Handles Unicode apostrophes, French articles, and invisible characters
  const validateLink = (suggestion: LinkSuggestion) => {
    if (!selectedTerm) return;
    
    console.log(`🔗 Validating: "${selectedTerm}"`);
    
    const newMarkdownLink = `[${selectedTerm}](${suggestion.url})`;
    
    // 1. CHARACTER NORMALIZATION
    const normalizeText = (str: string) => {
      return str
        .replace(/\r\n/g, ' ')          // Windows line endings
        .replace(/\r/g, ' ')            // Mac line endings  
        .replace(/\n/g, ' ')            // Unix line endings
        .replace(/\t/g, ' ')            // Tabs
        .replace(/'/g, "'")             // Unicode apostrophe → ASCII
        .replace(/'/g, "'")             // Other apostrophe variations
        .replace(/`/g, "'")             // Grave accent
        .replace(/\s+/g, ' ')           // Multiple spaces → single space
        .trim();
    };
    
    const normalizedText = normalizeText(text);
    const normalizedTerm = normalizeText(selectedTerm);
    
    let updatedText;
    let replacementMade = false;
    
    // 2. CHECK EXISTING LINKS FIRST
    const existingLinkRegex = new RegExp(`\\[${selectedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\([^)]+\\)`, 'g');
    const hasExistingLink = existingLinkRegex.test(text);
    
    if (hasExistingLink) {
      // Replace existing link
      updatedText = text.replace(existingLinkRegex, newMarkdownLink);
      replacementMade = true;
      console.log(`✅ Replaced existing link`);
    }
    
    // 3. CREATE NEW LINK - Direct test then with articles
    else if (normalizedText.includes(normalizedTerm)) {
      
      // Create flexible pattern to handle variable apostrophes and spaces
      const createFlexiblePattern = (term: string, withArticle = '') => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const withFlexibleSpaces = escaped.replace(/\s+/g, '\\s+');
        const withFlexibleApostrophes = withFlexibleSpaces.replace(/'/g, '.');
        return withArticle ? `${withArticle}\\s+${withFlexibleApostrophes}` : withFlexibleApostrophes;
      };
      
      // APPROACH 1: Direct term
      const directPattern = createFlexiblePattern(selectedTerm);
      const directRegex = new RegExp(directPattern, 'g');
      
      updatedText = text.replace(directRegex, newMarkdownLink);
      if (updatedText !== text) {
        replacementMade = true;
        console.log(`✅ Direct replacement successful`);
      }
      
      // APPROACH 2: With French articles
      if (!replacementMade) {
        const articles = ['un', 'une', 'le', 'la', 'des', 'du', 'de'];
        
        for (const article of articles) {
          const articlePattern = createFlexiblePattern(selectedTerm, article);
          const articleRegex = new RegExp(articlePattern, 'g');
          
          // Replace while keeping the article
          const replacement = `${article} ${newMarkdownLink}`;
          updatedText = text.replace(articleRegex, replacement);
          
          if (updatedText !== text) {
            replacementMade = true;
            console.log(`✅ Replacement with article "${article}" successful`);
            break;
          }
        }
      }
    }
    
    // 4. FINAL VERIFICATION
    if (!replacementMade || !updatedText || updatedText === text) {
      console.error(`❌ Validation failed for "${selectedTerm}"`);
      setError(`Unable to create link for "${selectedTerm}".`);
      return;
    }
    
    // 5. PROTECTION AGAINST MULTIPLE LINKS
    // Count term occurrences to ensure we only replace one
    const termOccurrences = (text.match(new RegExp(selectedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    const linkOccurrences = (updatedText.match(/\[.*?\]\(.*?\)/g) || []).length - (text.match(/\[.*?\]\(.*?\)/g) || []).length;
    
    if (linkOccurrences > 1) {
      console.warn(`⚠️ Multiple links created for "${selectedTerm}", keeping only first occurrence`);
      // If multiple links created, keep only the first one
      const firstLinkPattern = new RegExp(`\\[${selectedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\([^)]+\\)`);
      const firstMatch = updatedText.match(firstLinkPattern);
      if (firstMatch) {
        const beforeFirst = updatedText.substring(0, updatedText.indexOf(firstMatch[0]));
        const afterFirst = updatedText.substring(updatedText.indexOf(firstMatch[0]) + firstMatch[0].length);
        // Replace other link occurrences with simple term
        const cleanedAfter = afterFirst.replace(new RegExp(`\\[${selectedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\([^)]+\\)`, 'g'), selectedTerm);
        updatedText = beforeFirst + firstMatch[0] + cleanedAfter;
      }
    }
    
    // 6. STATE UPDATES
    console.log(`🎉 SUCCESS! Link created for "${selectedTerm}"`);
    setText(updatedText);
    
    setValidatedAnchors(prev => {
      const filtered = prev.filter(anchor => anchor.anchorText !== selectedTerm);
      return [...filtered, {
        anchorText: selectedTerm,
        url: suggestion.url,
        suggestionId: suggestion.id
      }];
    });
    
    setAnalyzedTerms(prev => 
      prev.map(term => 
        term.text === selectedTerm 
          ? { ...term, isValidated: true }
          : term
      )
    );

    setLatestLinkText(selectedTerm);

    if (editorRef.current) {
      editorRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Copy to markdown (current format)
  const copyToMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError('Failed to copy markdown');
    }
  };

  // Copy to HTML (convert markdown links to HTML)
  const copyToHtml = async () => {
    try {
      const htmlText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      await navigator.clipboard.writeText(htmlText);
    } catch {
      setError('Failed to copy HTML');
    }
  };

  // LLM anchor extraction
  const extractAnchors = async () => {
    if (!text.trim()) return;
    
    setIsExtracting(true);
    clearMessages();
    
    try {
      const response = await fetch('/api/extract-anchors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await processAllCandidates(data.candidates);
      } else {
        setError(data.error || 'Failed to extract anchors');
      }
    } catch (err) {
      setError('Error extracting anchors');
    } finally {
      setIsExtracting(false);
    }
  };

  // Process all candidates for suggestions
  const processAllCandidates = async (candidates: string[]) => {
    const newTerms: AnalyzedTerm[] = [];
    const seenSuggestions = new Set<string>();
    
    for (const candidate of candidates) {
      try {
        const allSuggestions = await getSuggestionsForCandidate(candidate);
        
        // Filter out suggestions we've already seen
        const uniqueSuggestions = allSuggestions.filter(suggestion => {
          if (seenSuggestions.has(suggestion.id)) {
            return false;
          }
          seenSuggestions.add(suggestion.id);
          return true;
        });
        
        // Check if this term was already validated
        const isValidated = validatedAnchors.some(anchor => anchor.anchorText === candidate);
        
        newTerms.push({
          text: candidate,
          hasResults: uniqueSuggestions.length > 0,
          suggestionCount: uniqueSuggestions.length,
          suggestions: uniqueSuggestions,
          isValidated
        });
        
        // Update state incrementally
        setAnalyzedTerms([...newTerms]);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`Error processing candidate "${candidate}":`, err);
        newTerms.push({
          text: candidate,
          hasResults: false,
          suggestionCount: 0,
          suggestions: [],
          isValidated: false
        });
      }
    }
    
    setAnalyzedTerms(newTerms);
    
    // Auto-select the first term with results (prefer non-validated)
    const firstWithResults = newTerms.find(term => term.hasResults && !term.isValidated) || 
                            newTerms.find(term => term.hasResults);
    if (firstWithResults) {
      setSelectedTerm(firstWithResults.text);
      setSuggestions(firstWithResults.suggestions);
    }
  };

  // Get suggestions for a single candidate
  const getSuggestionsForCandidate = async (anchorText: string): Promise<LinkSuggestion[]> => {
    const response = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        anchorText,
        maxSuggestions: 5
      })
    });
    
    const data = await response.json();
    return data.success ? data.suggestions : [];
  };

  // Manual anchor search
  const findLinkSuggestions = async () => {
    if (!selectedText) return;
    
    setIsLoading(true);
    
    try {
      const suggestions = await getSuggestionsForCandidate(selectedText.text);
      
      startTransition(() => {
        setSuggestions(suggestions);
        setSelectedTerm(selectedText.text);
      });
      
      // Add to analyzed terms if not from LLM extraction
      if (!analyzedTerms.find(t => t.text === selectedText.text)) {
        const isValidated = validatedAnchors.some(anchor => anchor.anchorText === selectedText.text);
        
        setAnalyzedTerms(prev => [
          {
            text: selectedText.text,
            hasResults: suggestions.length > 0,
            suggestionCount: suggestions.length,
            suggestions,
            isValidated
          },
          ...prev
        ]);
      }
      
      if (suggestions.length > 0) {
        // Clear any previous errors on success
        setError(null);
        // Scroll to suggestions after a small delay to ensure rendering
        setTimeout(() => {
          suggestionsRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          // Clear selection only after scrolling starts
          setTimeout(() => {
            setSelectedText(null);
          }, 100);
        }, 100);
      } else {
        // Set error state for no suggestions (but don't show notification)
        setError('no-suggestions');
      }
      
    } catch (err) {
      setError('Error finding suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // Use stored suggestions instead of re-fetching
  const handleTermSelect = (term: AnalyzedTerm) => {
    startTransition(() => {
      setSelectedTerm(term.text);
      setSuggestions(term.suggestions);
    });
  };

  // Clear all data
  const clearAll = () => {
    setText('');
    setSuggestions([]);
    setAnalyzedTerms([]);
    setSelectedText(null);
    setSelectedTerm(null);
    setValidatedAnchors([]);
    setError(null);
  };

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const estimatedReadTime = Math.ceil(wordCount / 200);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-blue-100 p-2">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xl font-semibold text-blue-600">
                Smart Link Finder
              </span>
            </div>
            <div className="flex items-center gap-3">
              {wordCount > 0 && (
                <Badge variant="secondary" className="text-xs px-3 py-1">
                  {wordCount} words
                </Badge>
              )}
              {estimatedReadTime > 0 && (
                <Badge variant="outline" className="text-xs px-3 py-1">
                  ~{estimatedReadTime} min read
                </Badge>
              )}
              {validatedAnchors.length > 0 && (
                <Badge variant="default" className="text-xs px-3 py-1 bg-green-600">
                  {validatedAnchors.length} links validated
                </Badge>
              )}
            </div>
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Analyze text with AI to find all potential anchor opportunities, or manually select text for individual suggestions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Rich Text Editor */}
      <Card className="border-2 shadow-lg relative hover:shadow-xl transition-all duration-300">
        <CardContent className="space-y-6 p-6">
          <div ref={editorRef} className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200" style={{ scrollMarginTop: '8rem' }}>
            <div className="rounded-full bg-blue-100 p-2">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-blue-800">
              <span className="font-medium">Rich text editor:</span> Right-click on any text to find suggestions. Links become clickable when validated.
            </div>
          </div>

          <RichTextEditor
            text={text}
            onTextChange={setText}
            selectedText={selectedText}
            onSelectionChange={setSelectedText}
            onFindLinks={() => {
              findLinkSuggestions();
            }}
            isLoading={isLoading}
            error={error}
          />

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-3">
              <Button
                onClick={extractAnchors}
                disabled={!text.trim() || isExtracting || isLoading}
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition-all duration-200 shadow-md hover:shadow-lg"
                size="lg"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={copyToMarkdown}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Markdown
              </Button>
              <Button
                onClick={copyToHtml}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Code className="w-3 h-3 mr-1" />
                Copy HTML
              </Button>
              <Button
                onClick={clearAll}
                variant="outline"
                size="sm"
                className="text-xs text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading indicator */}
      {(isLoading || isExtracting) && (
        <div ref={loadingRef} className="flex justify-center py-8">
          <div className="flex items-center space-x-3 text-blue-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg font-medium">
              {isExtracting ? 'Analyzing text for anchors...' : 'Finding suggestions...'}
            </span>
          </div>
        </div>
      )}

      {/* Analyzed Terms */}
      {analyzedTerms.length > 0 && (
        <AnalyzedTerms
          terms={analyzedTerms}
          selectedTerm={selectedTerm}
          onTermSelect={handleTermSelect}
        />
      )}

      {/* Suggestions */}
      {selectedTerm && (
        <div ref={suggestionsRef} className="space-y-4" style={{ scrollMarginTop: '2rem' }}>
          {suggestions.length > 0 ? (
            <SuggestionsList 
              suggestions={suggestions}
              onValidateLink={validateLink}
              selectedTerm={selectedTerm}
              validatedAnchors={validatedAnchors}
            />
          ) : (
            <Card className="border-2 shadow-lg">
              <CardContent>
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="text-center">
                    <div className="text-sm">No suggestions found</div>
                    <div className="text-xs mt-1">for "{selectedTerm}"</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isExtracting && analyzedTerms.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-2">Ready to find internal links</div>
                <div className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                  Click "Analyze with AI" to automatically find all anchor opportunities, or manually select text for individual suggestions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}