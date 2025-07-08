import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
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

interface TextEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  selectedText: Selection | null;
  onSelectionChange: (selection: Selection | null) => void;
  onFindLinks: () => void;
  isLoading: boolean;
}

export function TextEditor({
  text,
  onTextChange,
  selectedText,
  onSelectionChange,
  onFindLinks,
  isLoading
}: TextEditorProps) {
  const isMobile = useIsMobile();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  
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
        onSelectionChange({
          text: selectedText,
          startOffset: start,
          endOffset: end
        });
        return;
      }
    }
    
    onSelectionChange(null);
    setShowContextMenu(false);
  }, [onSelectionChange]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    let currentSelection = selectedText;
    
    if (!currentSelection && start !== end && (end - start) >= 3) {
      const text = textarea.value.substring(start, end).trim();
      if (text.length >= 3) {
        currentSelection = {
          text: text,
          startOffset: start,
          endOffset: end
        };
        onSelectionChange(currentSelection);
      }
    }
    
    setContextMenuPosition({
      x: e.clientX,
      y: e.clientY
    });
    setShowContextMenu(true);
  }, [selectedText, onSelectionChange]);

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

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const estimatedReadTime = Math.ceil(wordCount / 200);

  return (
    <div 
      className="relative"
      onContextMenu={handleContextMenu}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{ userSelect: 'text' }}
        className="w-full min-h-[400px] p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-gray-800 leading-relaxed bg-white shadow-sm hover:shadow-md select-text"
        placeholder={isMobile ? 
          "Paste your SEO content here and select text to find link opportunities. Tap and hold to open the link finder menu." :
          "Paste your SEO content here and select text to find link opportunities. Right-click on selected text to find relevant links."
        }
        disabled={isLoading}
      />
      
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