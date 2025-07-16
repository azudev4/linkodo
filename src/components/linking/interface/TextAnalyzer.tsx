// src/components/linking/interface/TextAnalyzer.tsx
'use client';

import { useState, useEffect, startTransition, useRef } from 'react';
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
  const [selectedOccurrenceIndex, setSelectedOccurrenceIndex] = useState<number>(0);
  const [isManualSelection, setIsManualSelection] = useState<boolean>(false);

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

  // Helper function to check if text contains existing anchors
  const hasOverlappingAnchor = (startOffset: number, endOffset: number, targetText: string): boolean => {
    const textBeforeSelection = text.substring(0, startOffset);
    const textAfterSelection = text.substring(endOffset);
    const fullText = textBeforeSelection + targetText + textAfterSelection;
    
    // Check if the selected range overlaps with any existing markdown links
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    let match;
    
    while ((match = linkRegex.exec(fullText)) !== null) {
      const linkStart = match.index;
      const linkEnd = linkStart + match[0].length;
      
      // Check if selection overlaps with this link
      if (!(endOffset <= linkStart || startOffset >= linkEnd)) {
        return true;
      }
    }
    
    return false;
  };

  // Extract plain text from markdown (removes link formatting)
  const extractPlainText = (markdownText: string): string => {
    return markdownText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  };

  // 🎯 POSITION-AWARE LINK VALIDATION
  const validateLink = (suggestion: LinkSuggestion) => {
    if (!selectedTerm) return;
    
    console.log(`🔗 Validating: "${selectedTerm}" (occurrence #${selectedOccurrenceIndex + 1})`);
    
    const newMarkdownLink = `[${selectedTerm}](${suggestion.url})`;
    
    // Work with plain text version for finding occurrences
    const plainText = extractPlainText(text);
    const termRegex = new RegExp(selectedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = Array.from(plainText.matchAll(termRegex));
    
    if (matches.length === 0) {
      console.error(`❌ Term "${selectedTerm}" not found in text`);
      setError(`Unable to find "${selectedTerm}" in text.`);
      return;
    }
    
    if (selectedOccurrenceIndex >= matches.length) {
      console.error(`❌ Occurrence index ${selectedOccurrenceIndex} out of bounds (found ${matches.length} occurrences)`);
      setError(`Selected occurrence no longer exists.`);
      return;
    }
    
    // Find the position in the original markdown text
    const targetMatch = matches[selectedOccurrenceIndex];
    const plainTextPosition = targetMatch.index;
    
    if (plainTextPosition === undefined) {
      console.error(`❌ Could not determine match position`);
      setError(`Unable to determine position for "${selectedTerm}".`);
      return;
    }
    
    // Convert plain text position to markdown position and find both start and end
    let markdownStartPosition = 0;
    let markdownEndPosition = 0;
    let plainPosition = 0;
    
    for (let i = 0; i < text.length; i++) {
      // Mark start position when we reach the beginning of our target
      if (plainPosition === plainTextPosition) {
        markdownStartPosition = i;
      }
      
      // Mark end position when we reach the end of our target
      if (plainPosition === plainTextPosition + selectedTerm.length) {
        markdownEndPosition = i;
        break;
      }
      
      // Check if we're at the start of a markdown link
      if (text.substring(i).match(/^\[([^\]]+)\]\([^)]+\)/)) {
        const linkMatch = text.substring(i).match(/^\[([^\]]+)\]\([^)]+\)/);
        if (linkMatch) {
          const linkText = linkMatch[1];
          i += linkMatch[0].length - 1; // Skip the entire link syntax
          plainPosition += linkText.length; // Only count the visible text
        }
      } else {
        plainPosition++;
      }
    }
    
    // If we didn't find end position, it means selection goes to end of text
    if (markdownEndPosition === 0) {
      markdownEndPosition = text.length;
    }
    
    // Replace the specific occurrence in the markdown text
    const beforeText = text.substring(0, markdownStartPosition);
    const afterText = text.substring(markdownEndPosition);
    const newText = beforeText + newMarkdownLink + afterText;
    
    console.log(`🎉 SUCCESS! Replaced occurrence #${selectedOccurrenceIndex + 1} at position ${markdownStartPosition}`);
    setText(newText);
    
    // Update state
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
    setIsManualSelection(false); // Reset after successful validation

    // ⚡ REMOVED: Unnecessary scroll to editor that was causing double scroll
    // The RichTextEditor will handle scrolling to the new anchor automatically
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
    
    // Clear existing suggestions and selection when AI analysis starts
    setSuggestions([]);
    setSelectedTerm(null);
    setSelectedOccurrenceIndex(0);
    setIsManualSelection(false); // Reset manual selection flag
    
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
    } catch {
      setError('Error extracting anchors');
    } finally {
      setIsExtracting(false);
    }
  };

  // Process all candidates for suggestions
  const processAllCandidates = async (candidates: string[]) => {
    const seenSuggestions = new Set<string>();
    
    // Filter out duplicates with existing terms
    const existingTermTexts = new Set(analyzedTerms.map(term => term.text));
    const uniqueCandidates = candidates.filter(candidate => !existingTermTexts.has(candidate));
    
    for (const candidate of uniqueCandidates) {
      try {
        const allSuggestions = await getSuggestionsForCandidate(candidate);
        
        // Filter out suggestions we've already seen
        const uniqueSuggestions = allSuggestions.filter(suggestion => {
          if (seenSuggestions.has(suggestion.id)) return false;
          seenSuggestions.add(suggestion.id);
          return true;
        });
        
        // Check if this term was already validated
        const isValidated = validatedAnchors.some(anchor => anchor.anchorText === candidate);
        
        // Add new term while preserving existing ones
        setAnalyzedTerms(prev => [...prev, {
          text: candidate,
          hasResults: uniqueSuggestions.length > 0,
          suggestionCount: uniqueSuggestions.length,
          suggestions: uniqueSuggestions,
          isValidated
        }]);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`Error processing candidate "${candidate}":`, err);
        setAnalyzedTerms(prev => [...prev, {
          text: candidate,
          hasResults: false,
          suggestionCount: 0,
          suggestions: [],
          isValidated: false
        }]);
      }
    }
    
    console.log(`✅ Successfully processed ${uniqueCandidates.length} new candidates`);
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
    
    // 🔧 FIXED: Handle overlapping keywords
    const termText = selectedText.text;
    
    // Check if selection overlaps with existing anchors
    if (hasOverlappingAnchor(selectedText.startOffset, selectedText.endOffset, termText)) {
      console.log(`🔄 Overlapping selection detected for "${termText}"`);
      // Work with plain text for occurrence calculation
      const plainText = extractPlainText(text);
      const plainStartOffset = selectedText.startOffset; // This should be adjusted based on markdown parsing
      const beforeSelection = plainText.substring(0, plainStartOffset);
      const occurrencesBefore = (beforeSelection.match(new RegExp(termText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      setSelectedOccurrenceIndex(occurrencesBefore);
    } else {
      // Normal case: calculate occurrence in the current text
      const beforeSelection = text.substring(0, selectedText.startOffset);
      const occurrencesBefore = (beforeSelection.match(new RegExp(termText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      setSelectedOccurrenceIndex(occurrencesBefore);
    }
    
    setIsManualSelection(true); // Mark as manual selection
    
    console.log(`🎯 User selected occurrence #${selectedOccurrenceIndex + 1} of "${termText}"`);
    
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
        setError(null);
        setTimeout(() => {
          suggestionsRef.current?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
          setTimeout(() => {
            setSelectedText(null);
          }, 100);
        }, 100);
      } else {
        throw new Error('no-suggestions');
      }
      
    } catch {
      setError('Error finding suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // 🔧 FIXED: Use stored suggestions instead of re-fetching
  const handleTermSelect = (term: AnalyzedTerm) => {
    startTransition(() => {
      setSelectedTerm(term.text);
      setSuggestions(term.suggestions);
      
      // Only reset occurrence index if:
      // 1. It's a different term, OR
      // 2. The current occurrence index wasn't set by manual selection
      if (selectedTerm !== term.text || !isManualSelection) {
        setSelectedOccurrenceIndex(0);
        setIsManualSelection(false);
      }
      // If same term AND manual selection, preserve the selectedOccurrenceIndex
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
    setSelectedOccurrenceIndex(0);
    setIsManualSelection(false); // Reset manual selection flag
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
                Cambium Linking AI
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
                    <div className="text-xs mt-1">for &quot;{selectedTerm}&quot;</div>
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
                  Click &quot;Analyze with AI&quot; to automatically find all anchor opportunities, or manually select text for individual suggestions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}