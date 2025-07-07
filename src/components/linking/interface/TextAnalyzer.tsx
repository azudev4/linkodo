// src/components/linking/interface/TextAnalyzer.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Search, 
  Loader2, 
  Link, 
  ExternalLink, 
  Target,
  Sparkles,
  Copy,
  MousePointer,
  CheckCircle2
} from 'lucide-react';

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

export function TextAnalyzer() {
  const [text, setText] = useState(`Lorsque vous planifiez votre potager pour cette saison, il est essentiel de bien comprendre la préparation du sol et les techniques de compagnonnage des plantes. Un sol bien préparé et des associations judicieuses entre les légumes vous garantiront une récolte abondante.

La rotation des cultures est également cruciale pour maintenir la fertilité du sol et éviter l'épuisement des nutriments. En alternant les familles de légumes d'une saison à l'autre, vous préservez l'équilibre naturel de votre jardin.

N'oubliez pas que le timing saisonnier joue un rôle déterminant dans le succès de vos cultures. Chaque légume a ses propres exigences en matière de plantation et de récolte.`);
  
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [selectedText, setSelectedText] = useState<Selection | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [analyzedTerms, setAnalyzedTerms] = useState<Array<{text: string, hasResults: boolean}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end && (end - start) >= 3) {
      const selectedText = textarea.value.substring(start, end).trim();
      if (selectedText.length >= 3) {
        setSelectedText({
          text: selectedText,
          startOffset: start,
          endOffset: end
        });
        return;
      }
    }
    
    // Clear selection if it's too short or doesn't exist
    setSelectedText(null);
    setShowContextMenu(false);
  }, []);

  // Handle right-click context menu - ALWAYS prevent default
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // ALWAYS prevent the browser's default context menu
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🖱️ Context menu triggered'); // Debug log
    
    // Get current selection from textarea directly
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    let currentSelection = selectedText;
    
    // If we don't have a stored selection, try to get current selection
    if (!currentSelection && start !== end && (end - start) >= 3) {
      const text = textarea.value.substring(start, end).trim();
      if (text.length >= 3) {
        currentSelection = {
          text: text,
          startOffset: start,
          endOffset: end
        };
        setSelectedText(currentSelection);
        console.log('🎯 Found selection:', text); // Debug log
      }
    }
    
    // Always show context menu, but enable/disable options based on selection
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY
    });
    setShowContextMenu(true);
    console.log('📋 Context menu shown at:', e.clientX, e.clientY); // Debug log
  }, [selectedText]);

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showContextMenu]);

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

  // Find link suggestions for selected text
  const findLinkSuggestions = async () => {
    if (!selectedText) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setShowContextMenu(false);
    
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          anchorText: selectedText.text,
          maxSuggestions: 5
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
        
        // Add to analyzed terms
        setAnalyzedTerms(prev => [
          ...prev.filter(term => term.text !== selectedText.text),
          { text: selectedText.text, hasResults: data.suggestions.length > 0 }
        ]);
        
        if (data.suggestions.length > 0) {
          setSuccess(`Found ${data.suggestions.length} link suggestions for "${selectedText.text}"`);
        } else {
          setError(`No link suggestions found for "${selectedText.text}". Try selecting different terms.`);
        }
        
        // Clear selection
        setSelectedText(null);
        window.getSelection()?.removeAllRanges();
      } else {
        setError(data.error || 'Failed to find suggestions');
      }
    } catch (err) {
      setError('Error connecting to suggestion service');
    } finally {
      setIsLoading(false);
    }
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
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
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
                <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
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
                Interactive Link Finder
              </span>
            </div>
            <div className="flex items-center gap-3">
              {wordCount > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Badge variant="secondary" className="text-xs px-3 py-1">
                    {wordCount} words
                  </Badge>
                </motion.div>
              )}
              {estimatedReadTime > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.1 }}
                >
                  <Badge variant="outline" className="text-xs px-3 py-1">
                    ~{estimatedReadTime} min read
                  </Badge>
                </motion.div>
              )}
            </div>
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Select any text with your mouse and right-click to find relevant internal links from your database
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Interactive Text Editor */}
      <Card className="border-2 shadow-lg relative hover:shadow-xl transition-all duration-300">
        <CardContent className="space-y-6 p-6">
          {/* Instructions */}
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="rounded-full bg-blue-100 p-2">
              <MousePointer className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-blue-800">
              <span className="font-medium">How to use:</span> Select any text with your mouse (minimum 3 characters), then either <strong>right-click for context menu</strong> or <strong>click the "Find Links" button</strong> that appears
            </div>
          </div>

          {/* Text Editor with wrapper for better event handling */}
          <div 
            className="relative"
            onContextMenu={handleContextMenu} // Also handle context menu on wrapper
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onMouseUp={handleMouseUp}
              onContextMenu={handleContextMenu}
              style={{ userSelect: 'text' }} // Ensure text selection is allowed
              className="w-full min-h-[400px] p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-800 leading-relaxed bg-white shadow-sm hover:shadow-md select-text"
              placeholder="Paste your SEO content here and start selecting text to find link opportunities...

For example, try selecting terms like:
• 'soil preparation' 
• 'companion planting'
• 'seasonal timing'
• 'crop rotation'

Instructions:
1. Select text with your mouse (min 3 characters)
2. Right-click to open link finder
3. Choose 'Find Links' to discover suggestions"
              disabled={isLoading}
            />
            
            {/* Selection indicator with action button */}
            {selectedText && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-3 right-3 flex items-center space-x-2"
              >
                <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium shadow-md border border-green-200">
                  ✓ "{selectedText.text.substring(0, 20)}{selectedText.text.length > 20 ? '...' : ''}" selected
                </div>
                <Button
                  onClick={findLinkSuggestions}
                  disabled={isLoading}
                  size="sm"
                  className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="w-3 h-3 mr-1" />
                  Find Links
                </Button>
              </motion.div>
            )}

            {/* Debug indicator for context menu state */}
            {showContextMenu && (
              <div className="absolute top-3 left-3 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                Context Menu Active
              </div>
            )}
          </div>

          {/* Analyzed terms summary */}
          {analyzedTerms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 p-4 bg-gray-50 rounded-xl border"
            >
              <div className="text-sm font-medium text-gray-700">
                Analyzed terms ({analyzedTerms.length}):
              </div>
              <div className="flex flex-wrap gap-2">
                {analyzedTerms.map((term, index) => (
                  <Badge 
                    key={index} 
                    variant={term.hasResults ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    {term.text}
                    {term.hasResults ? (
                      <CheckCircle2 className="w-3 h-3 ml-1 text-green-600" />
                    ) : (
                      <span className="ml-1 text-gray-400">○</span>
                    )}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                onClick={clearAll}
                disabled={!text.trim() || isLoading}
                size="sm"
                className="px-6 rounded-lg border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors duration-200"
              >
                Clear All
              </Button>
            </motion.div>

            <div className="text-sm text-gray-500">
              {analyzedTerms.filter(t => t.hasResults).length} terms with results
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context Menu with backdrop */}
      <AnimatePresence>
        {showContextMenu && (
          <>
            {/* Invisible backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowContextMenu(false)} />
            
            <motion.div
              ref={contextMenuRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-50 bg-white rounded-xl shadow-2xl border-2 border-gray-300 py-2 px-1 min-w-[240px]"
              style={{
                left: Math.min(contextMenuPosition.x, window.innerWidth - 260),
                top: Math.min(contextMenuPosition.y, window.innerHeight - 120),
                zIndex: 9999, // Extra high z-index
              }}
            >
              {selectedText ? (
                <button
                  onClick={findLinkSuggestions}
                  disabled={isLoading}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 rounded-lg flex items-center space-x-3 transition-colors group disabled:opacity-50"
                >
                  <div className="rounded-full bg-blue-100 p-2 group-hover:bg-blue-200 transition-colors">
                    <Search className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Find Links</div>
                    <div className="text-xs text-gray-500">
                      Search for "{selectedText.text.substring(0, 25)}{selectedText.text.length > 25 ? '...' : ''}"
                    </div>
                  </div>
                </button>
              ) : (
                <div className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center space-x-2 text-gray-400">
                    <MousePointer className="w-4 h-4" />
                    <span className="text-sm">Select text first</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Highlight text (min 3 chars) to find links
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">
                    Finding link suggestions...
                  </div>
                  <div className="text-sm text-blue-700">
                    Analyzing "{selectedText?.text}" against your database
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Results */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="rounded-full bg-green-100 p-2">
                  <Link className="w-5 h-5 text-green-600" />
                </div>
                <span>Link Suggestions</span>
                <Badge variant="secondary">
                  {suggestions.length} found
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-xl p-4 hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-gray-900 leading-tight">
                          {suggestion.title}
                        </h4>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.matchedSection}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Target className="w-3 h-3 mr-1" />
                            {Math.round(suggestion.relevanceScore * 100)}%
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {suggestion.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                          {suggestion.url}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyLink(suggestion.url)}
                            className="text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-xs"
                          >
                            <a href={suggestion.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Open
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty state for first-time users */}
      {!isLoading && suggestions.length === 0 && analyzedTerms.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-2">Ready to find internal links</div>
                <div className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                  Start by selecting any text in the editor above, then right-click to discover relevant internal links from your website's database
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}