import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MousePointer, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Selection {
  text: string;
  startOffset: number;
  endOffset: number;
}

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface RichTextEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  selectedText: Selection | null;
  onSelectionChange: (selection: Selection | null) => void;
  onFindLinks: () => void;
  isLoading: boolean;
}

export function RichTextEditor({
  text,
  onTextChange,
  selectedText,
  onSelectionChange,
  onFindLinks,
  isLoading
}: RichTextEditorProps) {
  const isMobile = useIsMobile();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  
  const editorRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Convert markdown to HTML
  const markdownToHtml = (markdown: string): string => {
    return markdown
      // Convert markdown links to HTML
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
      // Convert line breaks to <br>
      .replace(/\n/g, '<br>');
  };

  // Convert HTML back to markdown
  const htmlToMarkdown = (html: string): string => {
    return html
      // Convert HTML links back to markdown
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g, '[$2]($1)')
      // Convert <br> back to line breaks
      .replace(/<br\s*\/?>/g, '\n')
      // Remove other HTML tags
      .replace(/<[^>]*>/g, '');
  };

  // Update editor content when text changes
  useEffect(() => {
    if (editorRef.current) {
      const htmlContent = markdownToHtml(text);
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
      }
    }
  }, [text]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      const markdownContent = htmlToMarkdown(htmlContent);
      onTextChange(markdownContent);
    }
  }, [onTextChange]);

  // Get selected text from contentEditable
  const getSelectedText = useCallback((): Selection | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (selectedText.length >= 3) {
      return {
        text: selectedText,
        startOffset: range.startOffset,
        endOffset: range.endOffset
      };
    }
    
    return null;
  }, []);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = getSelectedText();
    onSelectionChange(selection);
    
    if (!selection) {
      setShowContextMenu(false);
    }
  }, [onSelectionChange, getSelectedText]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let currentSelection = selectedText;
    
    if (!currentSelection) {
      currentSelection = getSelectedText();
      onSelectionChange(currentSelection);
    }
    
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY
    });
    
    setShowContextMenu(true);
  }, [selectedText, onSelectionChange, getSelectedText]);

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

  // Handle paste - convert to plain text
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Prevent default formatting shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent default formatting
    if (e.ctrlKey || e.metaKey) {
      if (['b', 'i', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    }
  }, []);

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[400px] p-4 border-2 border-gray-200 rounded-xl focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200 text-gray-800 leading-relaxed bg-white shadow-sm hover:shadow-md"
        style={{ 
          userSelect: 'text',
          WebkitUserSelect: 'text',
          MozUserSelect: 'text',
          msUserSelect: 'text'
        }}
        suppressContentEditableWarning={true}
      />

      {/* Placeholder */}
      {!text && (
        <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
          {isMobile ? 
            "Paste your SEO content here and select text to find link opportunities. Tap and hold to open the link finder menu." :
            "Paste your SEO content here and select text to find link opportunities. Right-click on selected text to find relevant links."
          }
        </div>
      )}
      
      {/* Selection indicator with action button - only on mobile */}
      {isMobile && selectedText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-3 right-3 flex items-center space-x-2"
        >
          <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium shadow-md border border-green-200">
            ✓ "{selectedText.text.substring(0, 20)}{selectedText.text.length > 20 ? '...' : ''}" selected
          </div>
          <Button
            onClick={onFindLinks}
            disabled={isLoading}
            size="sm"
            className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
          >
            <Search className="w-3 h-3 mr-1" />
            Find Links
          </Button>
        </motion.div>
      )}

      {/* Context Menu with backdrop */}
      <AnimatePresence>
        {showContextMenu && (
          <>
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
                zIndex: 9999,
              }}
            >
              {selectedText ? (
                <button
                  onClick={() => {
                    onFindLinks();
                    setShowContextMenu(false);
                  }}
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
                    {isMobile ? 
                      "Select text (min 3 chars) and tap and hold to find links" :
                      "Select text (min 3 chars) and right-click to find links"
                    }
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}