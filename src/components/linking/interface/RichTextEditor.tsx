import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MousePointer, Search, Loader2, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { LinkHoverCard } from './LinkHoverCard';

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
  error?: string | null;
}

export function RichTextEditor({
  text,
  onTextChange,
  selectedText,
  onSelectionChange,
  onFindLinks,
  isLoading,
  error
}: RichTextEditorProps) {
  const isMobile = useIsMobile();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [showHoverCard, setShowHoverCard] = useState(false);
  const [hoverCardUrl, setHoverCardUrl] = useState('');
  const [hoverCardPosition, setHoverCardPosition] = useState({ x: 0, y: 0 });
  const [showErrorState, setShowErrorState] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevLoadingRef = useRef<boolean>(false);
  const isUserTypingRef = useRef<boolean>(false);

  // Convert markdown to HTML
  const markdownToHtml = (markdown: string): string => {
    return markdown
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="pointer-events: all;" class="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 transition-all duration-200 cursor-pointer hover:bg-blue-50 hover:shadow-sm rounded px-1 py-0.5 -mx-1 -my-0.5 [&.animate-highlight]:bg-yellow-200 [&.animate-highlight]:shadow-lg [&.animate-highlight]:scale-105" data-url="$2" data-text="$1" title="">$1</a>')
      .replace(/\n/g, '<br>');
  };

  // Convert HTML back to markdown
  const htmlToMarkdown = (html: string): string => {
    return html
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g, '[$2]($1)')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '');
  };

  // Helper function to get cursor position as character offset from start of text content
  const getTextOffset = (container: Node, node: Node, offset: number): number => {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
    );
    
    let textOffset = 0;
    let currentNode;
    while (currentNode = walker.nextNode()) {
      if (currentNode === node) {
        return textOffset + offset;
      }
      textOffset += currentNode.textContent?.length || 0;
    }
    return textOffset;
  };

  // Helper function to restore cursor position from character offset
  const setTextOffset = (container: Node, targetOffset: number): void => {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null,
    );
    
    let currentOffset = 0;
    let currentNode;
    while (currentNode = walker.nextNode()) {
      const nodeLength = currentNode.textContent?.length || 0;
      if (currentOffset + nodeLength >= targetOffset) {
        const localOffset = targetOffset - currentOffset;
        // Create range without triggering scroll
        const range = document.createRange();
        range.setStart(currentNode, localOffset);
        range.setEnd(currentNode, localOffset);
        
        // Store current scroll position to restore after selection
        const currentScrollTop = window.scrollY;
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        // Restore scroll position if browser scrolled due to selection
        if (Math.abs(window.scrollY - currentScrollTop) > 5) {
          window.scrollTo({ top: currentScrollTop, behavior: 'instant' });
        }
        return;
      }
      currentOffset += nodeLength;
    }
  };

  // Handle error state changes
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = isLoading;
    
    if (error) {
      setShowErrorState(true);
      // Show error state for 1.5 seconds, then hide context menu
      const timer = setTimeout(() => {
        setShowErrorState(false);
        setShowContextMenu(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (wasLoading && !isLoading) {
      // Success case - close menu after brief delay
      const timer = setTimeout(() => {
        setShowContextMenu(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [error, isLoading]);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (showHoverCard) {
        setShowHoverCard(false);
      }
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [showHoverCard, showContextMenu]);

  // Global mouse tracking for hover detection
  useEffect(() => {
    if (isMobile) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const element = document.elementFromPoint(e.clientX, e.clientY);
      const link = element?.closest('a[href]') as HTMLAnchorElement;
      const hoverCard = element?.closest('[data-hover-card]') as HTMLElement;
      
      if (link && editorRef.current?.contains(link)) {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        
        if (!showHoverCard || hoverCardUrl !== link.href) {
          const linkRect = link.getBoundingClientRect();
          setHoverCardUrl(link.href);
          setHoverCardPosition({
            x: linkRect.right,
            y: linkRect.bottom
          });
          setShowHoverCard(true);
        }
      } else if (hoverCard) {
        // Mouse is over hover card - keep it visible
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
      } else if (showHoverCard) {
        // Mouse not over link or card - hide after delay
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }
        hoverTimeoutRef.current = setTimeout(() => {
          setShowHoverCard(false);
        }, 50);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isMobile, showHoverCard, hoverCardUrl]);

  // Initialize editor content and sync external changes (like link insertions)
  useEffect(() => {
    if (editorRef.current) {
      const htmlContent = markdownToHtml(text);
      
      // Only update if content actually changed and user isn't currently typing
      if (editorRef.current.innerHTML !== htmlContent && !isUserTypingRef.current) {
        // Save cursor position before update
        const selection = window.getSelection();
        let savedTextOffset = 0;
        
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          savedTextOffset = getTextOffset(editorRef.current, range.startContainer, range.startOffset);
        }
        
        editorRef.current.innerHTML = htmlContent;
        
        // Check if we're adding a new anchor (indicated by animate-highlight class)
        const hasNewAnchor = htmlContent.includes('animate-highlight');
        
        // Restore cursor position after update and scroll to new anchor
        if (savedTextOffset > 0) {
          setTimeout(() => {
            if (editorRef.current) {
              // Only restore cursor if not adding a new anchor to avoid scroll conflicts
              if (!hasNewAnchor) {
                setTextOffset(editorRef.current, savedTextOffset);
              }
              
              // Wait a bit longer for the highlight animation to be applied
              setTimeout(() => {
                const newAnchor = editorRef.current?.querySelector('a[class*="animate-highlight"]');
                if (newAnchor) {
                  newAnchor.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                  });
                }
              }, 100);
            }
          }, 0);
        }
      }
    }
  }, [text]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isUserTypingRef.current = true;
      
      const htmlContent = editorRef.current.innerHTML;
      const markdownContent = htmlToMarkdown(htmlContent);
      onTextChange(markdownContent);
      
      // Reset typing flag after a short delay
      setTimeout(() => {
        isUserTypingRef.current = false;
      }, 100);
    }
  }, [onTextChange]);

  // Get selected text from contentEditable
  const getSelectedText = useCallback((): Selection | null => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (selectedText.length >= 3 && editorRef.current) {
      // Calculate text content positions instead of DOM positions
      const startOffset = getTextOffset(editorRef.current, range.startContainer, range.startOffset);
      const endOffset = getTextOffset(editorRef.current, range.endContainer, range.endOffset);
      
      return {
        text: selectedText,
        startOffset: startOffset,
        endOffset: endOffset
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
    setShowErrorState(false); // Reset error state when opening menu
  }, [selectedText, onSelectionChange, getSelectedText]);

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
        setShowErrorState(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showContextMenu]);

  // Handle clicks on links
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      window.open(link.href, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Handle keydown events with anchor deletion logic
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent default formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (['b', 'i', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      return;
    }


    // Handle backspace for anchor deletion
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const { startContainer, startOffset } = range;
      
      // Case 1: Cursor is anywhere inside an anchor element
      const anchorElement = startContainer.nodeType === Node.TEXT_NODE 
        ? startContainer.parentElement?.closest('a') 
        : (startContainer as Element)?.closest('a');
      
      if (anchorElement) {
        // Remove the link but keep the text when cursor is anywhere inside anchor
        e.preventDefault();
        
        const anchorText = anchorElement.textContent || '';
        const textNode = document.createTextNode(anchorText);
        anchorElement.parentNode?.replaceChild(textNode, anchorElement);
        
        // Trigger input event to update markdown (handleInput will preserve cursor)
        if (editorRef.current) {
          const inputEvent = new Event('input', { bubbles: true });
          editorRef.current.dispatchEvent(inputEvent);
        }
        
        return;
      }
      
      // Case 2: Cursor is just after an anchor (between anchor and next content)
      if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
        const previousSibling = startContainer.previousSibling;
        if (previousSibling && previousSibling.nodeName === 'A') {
          // Remove the anchor, keep the text
          e.preventDefault();
          
          const anchorText = previousSibling.textContent || '';
          const textNode = document.createTextNode(anchorText);
          previousSibling.parentNode?.replaceChild(textNode, previousSibling);
          
          // Trigger input event to update markdown (handleInput will preserve cursor)
          if (editorRef.current) {
            const inputEvent = new Event('input', { bubbles: true });
            editorRef.current.dispatchEvent(inputEvent);
          }
          
          return;
        }
      }
      
      // Case 3: Check if we're about to delete into an anchor from the right
      if (startContainer.nodeType === Node.ELEMENT_NODE && startOffset > 0) {
        const elementBefore = startContainer.childNodes[startOffset - 1];
        if (elementBefore && elementBefore.nodeName === 'A') {
          // We're about to backspace into an anchor from outside
          e.preventDefault();
          
          const anchorText = elementBefore.textContent || '';
          const textNode = document.createTextNode(anchorText);
          elementBefore.parentNode?.replaceChild(textNode, elementBefore);
          
          // Trigger input event to update markdown (handleInput will preserve cursor)
          if (editorRef.current) {
            const inputEvent = new Event('input', { bubbles: true });
            editorRef.current.dispatchEvent(inputEvent);
          }
          
          return;
        }
      }
    }
  }, []);

  // Get button styles based on state
  const getButtonState = () => {
    if (isLoading) {
      return {
        variant: "default" as const,
        className: "",
        icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
        text: "Find Links"
      };
    } else if (showErrorState) {
      return {
        variant: "destructive" as const,
        className: "animate-pulse",
        icon: <X className="w-3 h-3 mr-1" />,
        text: "No Links"
      };
    } else {
      return {
        variant: "default" as const,
        className: "",
        icon: <Search className="w-3 h-3 mr-1" />,
        text: "Find Links"
      };
    }
  };

  const buttonState = getButtonState();

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
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
      
      {/* Selection indicator - mobile only */}
      {isMobile && selectedText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-3 right-3 flex items-center space-x-2"
        >
          <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium shadow-md border border-green-200">
            ✓ &quot;{selectedText.text.substring(0, 20)}{selectedText.text.length > 20 ? '...' : ''}&quot; selected
          </div>
          <Button
            onClick={onFindLinks}
            disabled={isLoading}
            variant={buttonState.variant}
            size="sm"
            className={`h-7 px-3 text-xs transition-all duration-300 ${buttonState.className}`}
          >
            {buttonState.icon}
            {buttonState.text}
          </Button>
        </motion.div>
      )}

      {/* Context Menu */}
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
                  onClick={onFindLinks}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 text-left rounded-lg flex items-center space-x-3 transition-all duration-300 group disabled:opacity-50 ${
                    showErrorState 
                      ? 'bg-red-50 hover:bg-red-100' 
                      : 'hover:bg-blue-50'
                  }`}
                >
                  <div className={`rounded-full p-2 transition-all duration-300 ${
                    showErrorState 
                      ? 'bg-red-100 group-hover:bg-red-200 animate-pulse' 
                      : 'bg-blue-100 group-hover:bg-blue-200'
                  }`}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    ) : showErrorState ? (
                      <X className="w-4 h-4 text-red-600" />
                    ) : (
                      <Search className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${showErrorState ? 'text-red-900' : 'text-gray-900'}`}>
                      {showErrorState ? 'No Links Found' : 'Find Links'}
                    </div>
                    <div className={`text-xs ${showErrorState ? 'text-red-600' : 'text-gray-500'}`}>
                      {showErrorState 
                        ? 'No suggestions available'
                        : `Search for "${selectedText.text.substring(0, 25)}${selectedText.text.length > 25 ? '...' : ''}"`
                      }
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

      {/* Link Hover Card */}
      <LinkHoverCard
        url={hoverCardUrl}
        isVisible={showHoverCard}
        position={hoverCardPosition}
      />
    </div>
  );
}