'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ExternalLink, Sparkles, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionOption {
  id: string;
  title: string;
  url: string;
  description: string;
  matchedSection: string; // "H1", "H2", "H3", "Keywords"
  relevanceScore: number;
}

interface Suggestion {
  id: string;
  anchorText: string;
  contextBefore: string;
  contextAfter: string;
  options: SuggestionOption[]; // Top 3 options
  isAiSelected: boolean;
  isAccepted: boolean;
  selectedOptionId?: string;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: (optionId: string) => void;
  onReject: () => void;
}

export function SuggestionCard({ suggestion, onAccept, onReject }: SuggestionCardProps) {
  const { anchorText, contextBefore, contextAfter, options = [], isAiSelected, isAccepted, selectedOptionId } = suggestion;
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>(() => {
    if (selectedOptionId) return selectedOptionId;
    if (options.length > 0 && options[0]?.id) return options[0].id;
    return '';
  });

  const topOption = options.length > 0 ? options[0] : null;
  const additionalOptions = options.slice(1);

  console.log('Debug - options:', options);
  console.log('Debug - additionalOptions:', additionalOptions);

  const handleAccept = () => {
    onAccept(selectedOption);
  };

  const getSectionColor = (section: string) => {
    switch (section) {
      case 'H1': return 'bg-purple-100 text-purple-700';
      case 'H2': return 'bg-blue-100 text-blue-700';
      case 'H3': return 'bg-green-100 text-green-700';
      case 'Keywords': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      isAccepted && "border-green-200 bg-green-50",
      isAiSelected && !isAccepted && "border-blue-200 bg-blue-50"
    )}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with badges */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {isAiSelected && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Selected
                </Badge>
              )}
              {isAccepted && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Check className="w-3 h-3 mr-1" />
                  Accepted
                </Badge>
              )}
            </div>
          </div>

          {/* Context and anchor text */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600 leading-relaxed">
              <span className="text-gray-500">...{contextBefore} </span>
              <span className="bg-yellow-100 px-1.5 py-0.5 rounded font-medium text-gray-900">
                {anchorText}
              </span>
              <span className="text-gray-500"> {contextAfter}...</span>
            </div>
          </div>

          {/* Top Option (Always Visible) */}
          {topOption && (
            <div className={cn(
              "border rounded-lg p-3 transition-all cursor-pointer",
              selectedOption === topOption.id 
                ? "border-blue-300 bg-blue-50" 
                : "border-gray-200 bg-gray-50 hover:border-gray-300"
            )}
            onClick={() => setSelectedOption(topOption.id)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-gray-900 text-sm leading-tight">
                    {topOption.title}
                  </h4>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    <Badge variant="outline" className={cn("text-xs", getSectionColor(topOption.matchedSection))}>
                      {topOption.matchedSection}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Target className="w-3 h-3 mr-1" />
                      {Math.round(topOption.relevanceScore * 100)}%
                    </Badge>
                  </div>
                </div>
                
                <p className="text-xs text-gray-600 leading-relaxed">
                  {topOption.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 font-mono">
                    {topOption.url}
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* Show More Options Toggle */}
          {additionalOptions.length > 0 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllOptions(!showAllOptions)}
                className="text-xs px-4 py-2 rounded-full border-2 hover:bg-gray-50 transition-colors duration-200"
              >
                {showAllOptions ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center text-gray-600"
                  >
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Hide other options
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center text-blue-600"
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    See {additionalOptions.length} more option{additionalOptions.length > 1 ? 's' : ''}
                  </motion.div>
                )}
              </Button>
            </div>
          )}

          {/* Additional Options (Expandable) */}
          <AnimatePresence>
            {showAllOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {additionalOptions.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "border rounded-lg p-3 transition-all cursor-pointer",
                      selectedOption === option.id 
                        ? "border-blue-300 bg-blue-50" 
                        : "border-gray-200 bg-gray-50 hover:border-gray-300"
                    )}
                    onClick={() => setSelectedOption(option.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight">
                          {option.title}
                        </h4>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                          <Badge variant="outline" className={cn("text-xs", getSectionColor(option.matchedSection))}>
                            {option.matchedSection}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Target className="w-3 h-3 mr-1" />
                            {Math.round(option.relevanceScore * 100)}%
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {option.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 font-mono">
                          {option.url}
                        </div>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          {!isAccepted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between pt-2"
            >
              <div className="text-xs text-gray-500">
                {selectedOption !== topOption?.id && (
                  <span>Alternative option selected</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReject}
                  className="text-gray-600 hover:text-red-600 hover:border-red-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={handleAccept}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!selectedOption}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
              </div>
            </motion.div>
          )}

          {isAccepted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-2"
            >
              <span className="text-sm text-green-700 font-medium">
                ✓ Link accepted: {options.find(o => o.id === selectedOptionId)?.title}
              </span>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}