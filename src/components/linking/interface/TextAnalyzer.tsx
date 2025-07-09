// src/components/linking/interface/TextAnalyzer.tsx
'use client';

import { useState, useEffect, startTransition, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Loader2, 
  Sparkles,
  CheckCircle2,
  Zap,
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
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [selectedText, setSelectedText] = useState<Selection | null>(null);
  const [analyzedTerms, setAnalyzedTerms] = useState<AnalyzedTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [validatedAnchors, setValidatedAnchors] = useState<ValidatedAnchor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Clear messages after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Validate and insert link
  const validateLink = (suggestion: LinkSuggestion) => {
    if (!selectedTerm) return;
    
    const markdownLink = `[${selectedTerm}](${suggestion.url})`;
    
    // Replace first occurrence of the selected term with markdown link
    const updatedText = text.replace(
      new RegExp(`\\b${selectedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`),
      markdownLink
    );
    
    setText(updatedText);
    
    // Track validated anchor
    const validatedAnchor: ValidatedAnchor = {
      anchorText: selectedTerm,
      url: suggestion.url,
      suggestionId: suggestion.id
    };
    
    setValidatedAnchors(prev => [...prev, validatedAnchor]);
    
    // Mark term as validated
    setAnalyzedTerms(prev => 
      prev.map(term => 
        term.text === selectedTerm 
          ? { ...term, isValidated: true }
          : term
      )
    );
    
    // Remove validated suggestion from current suggestions
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    
    setSuccess(`Link validated for "${selectedTerm}"`);
  };

  // Copy to markdown (current format)
  const copyToMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Markdown copied to clipboard!');
    } catch {
      setError('Failed to copy markdown');
    }
  };

  // Copy to HTML (convert markdown links to HTML)
  const copyToHtml = async () => {
    try {
      const htmlText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      await navigator.clipboard.writeText(htmlText);
      setSuccess('HTML copied to clipboard!');
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
        setSuccess(`Extracted ${data.count} anchor candidates`);
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
    clearMessages();
    
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
        setSuccess(`Found ${suggestions.length} suggestions for "${selectedText.text}"`);
      } else {
        setError(`No suggestions found for "${selectedText.text}"`);
      }
      
      setSelectedText(null);
    } catch (err) {
      setError('Error finding suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle term selection from AnalyzedTerms
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
    setSuccess(null);
  };

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const estimatedReadTime = Math.ceil(wordCount / 200);

  return (
    <div className="space-y-6">
      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={clearMessages}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="flex items-center justify-between text-green-800">
                <span>{success}</span>
                <Button variant="ghost" size="sm" onClick={clearMessages}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
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
        <div className="space-y-4">
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