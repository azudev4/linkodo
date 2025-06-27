'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SuggestionCard } from './SuggestionsCard';
import { AiSelectionModal } from './AiSelectionModal';
import { Link, Sparkles, AlertCircle } from 'lucide-react';

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

export function SuggestionsList() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: '1',
      anchorText: 'soil preparation',
      targetPage: {
        title: 'Complete Guide to Soil Preparation',
        url: '/guides/soil-preparation',
        description: 'Learn the essential steps for preparing your garden soil for optimal plant growth.'
      },
      contextBefore: 'important to consider',
      contextAfter: 'and companion planting',
      relevanceScore: 0.92,
      isAiSelected: false,
      isAccepted: false
    },
    {
      id: '2',
      anchorText: 'companion planting',
      targetPage: {
        title: 'Companion Planting for Vegetables',
        url: '/techniques/companion-planting',
        description: 'Discover which plants grow well together and boost your garden\'s productivity.'
      },
      contextBefore: 'soil preparation and',
      contextAfter: 'techniques. Proper spacing',
      relevanceScore: 0.89,
      isAiSelected: false,
      isAccepted: false
    },
    {
      id: '3',
      anchorText: 'seasonal timing',
      targetPage: {
        title: 'Garden Planting Calendar',
        url: '/guides/planting-calendar',
        description: 'Know exactly when to plant your vegetables for the best harvest results.'
      },
      contextBefore: 'spacing and understanding',
      contextAfter: 'will help ensure',
      relevanceScore: 0.84,
      isAiSelected: false,
      isAccepted: false
    }
  ]);
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(true); // Mock state - would come from parent

  const handleAcceptSuggestion = (id: string) => {
    setSuggestions(prev => 
      prev.map(s => s.id === id ? { ...s, isAccepted: true } : s)
    );
  };

  const handleRejectSuggestion = (id: string) => {
    setSuggestions(prev => 
      prev.filter(s => s.id !== id)
    );
  };

  const handleAiSelection = (linkCount: number) => {
    // Mock AI selection - would call actual AI endpoint
    const topSuggestions = [...suggestions]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, linkCount);
    
    setSuggestions(prev => 
      prev.map(s => ({
        ...s,
        isAiSelected: topSuggestions.some(selected => selected.id === s.id)
      }))
    );
    
    setIsAiModalOpen(false);
  };

  const acceptedCount = suggestions.filter(s => s.isAccepted).length;
  const aiSelectedCount = suggestions.filter(s => s.isAiSelected).length;

  if (!isAnalyzed) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No content analyzed yet</p>
            <p className="text-sm">
              Paste your content above and click "Analyze Text" to see link suggestions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Link className="w-5 h-5 text-green-600" />
                <span>Link Suggestions</span>
                <Badge variant="secondary">
                  {suggestions.length} found
                </Badge>
              </CardTitle>
              <CardDescription className="mt-2">
                {acceptedCount > 0 && (
                  <span className="text-green-600 font-medium">
                    {acceptedCount} accepted
                  </span>
                )}
                {aiSelectedCount > 0 && (
                  <span className="text-blue-600 font-medium ml-4">
                    {aiSelectedCount} AI selected
                  </span>
                )}
              </CardDescription>
            </div>
            
            <Button
              onClick={() => setIsAiModalOpen(true)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Let AI Choose</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <SuggestionCard
                  suggestion={suggestion}
                  onAccept={() => handleAcceptSuggestion(suggestion.id)}
                  onReject={() => handleRejectSuggestion(suggestion.id)}
                />
              </motion.div>
            ))}
            
            {suggestions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No suggestions available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AiSelectionModal
        open={isAiModalOpen}
        onOpenChange={setIsAiModalOpen}
        onConfirm={handleAiSelection}
        totalSuggestions={suggestions.length}
      />
    </>
  );
}