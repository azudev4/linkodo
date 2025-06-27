'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ExternalLink, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  anchorText: string;
  targetPage: {
    title: string;
    url: string;
    description: string;
  };
  contextBefore: string;
  contextAfter: string;
  relevanceScore: number;
  isAiSelected: boolean;
  isAccepted: boolean;
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: () => void;
  onReject: () => void;
}

export function SuggestionCard({ suggestion, onAccept, onReject }: SuggestionCardProps) {
  const { anchorText, targetPage, contextBefore, contextAfter, relevanceScore, isAiSelected, isAccepted } = suggestion;

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
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                {Math.round(relevanceScore * 100)}% match
              </Badge>
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

          {/* Target page preview */}
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-gray-900 text-sm leading-tight">
                  {targetPage.title}
                </h4>
                <ExternalLink className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0 ml-2" />
              </div>
              
              <p className="text-xs text-gray-600 leading-relaxed">
                {targetPage.description}
              </p>
              
              <div className="text-xs text-gray-500 font-mono">
                {targetPage.url}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!isAccepted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-end space-x-2 pt-2"
            >
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
                onClick={onAccept}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Accept
              </Button>
            </motion.div>
          )}

          {isAccepted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-2"
            >
              <span className="text-sm text-green-700 font-medium">
                ✓ This link will be added to your content
              </span>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}