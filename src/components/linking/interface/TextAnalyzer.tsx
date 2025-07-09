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
  Brain
} from 'lucide-react';
import { TextEditor } from './TextEditor';
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

interface ContextMenuPosition {
  x: number;
  y: number;
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
}

export function TextAnalyzer() {
  const isMobile = useIsMobile();
  const [text, setText] = useState(`Lorsque vous planifiez votre potager pour cette saison, il est essentiel de bien comprendre la préparation du sol et les techniques de compagnonnage des plantes. Un sol bien préparé et des associations judicieuses entre les légumes vous garantiront une récolte abondante.

La rotation des cultures est également cruciale pour maintenir la fertilité du sol et éviter l'épuisement des nutriments. En alternant les familles de légumes d'une saison à l'autre, vous préservez l'équilibre naturel de votre jardin.

N'oubliez pas que le timing saisonnier joue un rôle déterminant dans le succès de vos cultures. Chaque légume a ses propres exigences en matière de plantation et de récolte.`);
  
  const loadingRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [selectedText, setSelectedText] = useState<Selection | null>(null);
  const [analyzedTerms, setAnalyzedTerms] = useState<AnalyzedTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
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
        // Process each candidate for suggestions
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
    const seenSuggestions = new Set<string>(); // Track seen suggestion IDs
    
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
        
        newTerms.push({
          text: candidate,
          hasResults: uniqueSuggestions.length > 0,
          suggestionCount: uniqueSuggestions.length,
          suggestions: uniqueSuggestions
        });
        
        console.log(`📝 ${candidate}: ${uniqueSuggestions.length} unique suggestions (${allSuggestions.length} total)`);
        
        // Update state incrementally for better UX
        setAnalyzedTerms([...newTerms]);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`Error processing candidate "${candidate}":`, err);
        newTerms.push({
          text: candidate,
          hasResults: false,
          suggestionCount: 0,
          suggestions: []
        });
      }
    }
    
    setAnalyzedTerms(newTerms);
    
    // Auto-select the first term with results
    const firstWithResults = newTerms.find(term => term.hasResults);
    if (firstWithResults) {
      setSelectedTerm(firstWithResults.text);
      setSuggestions(firstWithResults.suggestions);
    }
    
    console.log(`✅ Processed ${newTerms.length} candidates with ${seenSuggestions.size} unique suggestions total`);
    setSuccess(`Analysis complete: ${newTerms.filter(t => t.hasResults).length}/${candidates.length} candidates have suggestions`);
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

  // Scroll to loading indicator
  const scrollToLoading = () => {
    setTimeout(() => {
      loadingRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100); // Small delay to ensure loading indicator is rendered
  };

  // Manual anchor search (existing functionality)
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
        setAnalyzedTerms(prev => [
          {
            text: selectedText.text,
            hasResults: suggestions.length > 0,
            suggestionCount: suggestions.length,
            suggestions
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
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      setError('Error finding suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle term selection from AnalyzedTerms
  const handleTermSelect = (term: AnalyzedTerm) => {
    console.log('Switching from:', selectedTerm, 'to:', term.text);
    console.log('Old suggestions count:', suggestions.length);
    console.log('New suggestions count:', term.suggestions.length);
    console.log('Old suggestion IDs:', suggestions.map(s => s.id));
    console.log('New suggestion IDs:', term.suggestions.map(s => s.id));
    
    startTransition(() => {
      setSelectedTerm(term.text);
      setSuggestions(term.suggestions);
    });
  };

  // Copy link to clipboard
  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setSuccess('Link copied to clipboard!');
    } catch {
      setError('Failed to copy link');
    }
  };

  // Clear all data
  const clearAll = () => {
    setText('');
    setSuggestions([]);
    setAnalyzedTerms([]);
    setSelectedText(null);
    setSelectedTerm(null);
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
            </div>
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Analyze text with AI to find all potential anchor opportunities, or manually select text for individual suggestions
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Text Editor */}
      <Card className="border-2 shadow-lg relative hover:shadow-xl transition-all duration-300">
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="rounded-full bg-blue-100 p-2">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-blue-800">
              <span className="font-medium">Two modes:</span> Click <strong>"Analyze with AI"</strong> to find all anchors automatically, or <strong>manually select text</strong> for individual suggestions
            </div>
          </div>

          <TextEditor
            text={text}
            onTextChange={setText}
            selectedText={selectedText}
            onSelectionChange={setSelectedText}
            onFindLinks={() => {
              findLinkSuggestions();
              scrollToLoading();
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
                    <span className="font-medium">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    <span className="font-medium">Analyze with AI</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={clearAll}
                disabled={!text.trim() || isLoading || isExtracting}
                size="sm"
                className="px-6 rounded-lg border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors duration-200"
              >
                Clear All
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              {analyzedTerms.filter(t => t.hasResults).length > 0 && 
                `${analyzedTerms.filter(t => t.hasResults).length} terms with results`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {(isLoading || isExtracting) && (
        <motion.div
          ref={loadingRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">
                    {isExtracting ? 'Extracting anchor candidates with AI...' : 'Finding link suggestions...'}
                  </div>
                  <div className="text-sm text-blue-700">
                    {isExtracting 
                      ? 'Analyzing text for potential anchor opportunities'
                      : selectedText && `Analyzing "${selectedText.text}" against your database`
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results */}
      {analyzedTerms.length > 0 && (
        <div className="w-full space-y-4">
          <AnalyzedTerms 
            terms={analyzedTerms}
            selectedTerm={selectedTerm}
            onTermSelect={handleTermSelect}
          />
          
          {/* Current suggestions display */}
          {selectedTerm && (
            <div className="space-y-4" style={{ minHeight: '300px' }}>
              {suggestions.length > 0 ? (
                <SuggestionsList 
                  suggestions={suggestions}
                  onCopyLink={copyLink}
                  selectedTerm={selectedTerm}
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