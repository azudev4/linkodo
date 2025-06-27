'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SuggestionCard } from './SuggestionsCard';
import { AiSelectionModal } from './AiSelectionModal';
import { Link, Sparkles, AlertCircle } from 'lucide-react';

interface SuggestionOption {
  id: string;
  title: string;
  url: string;
  description: string;
  matchedSection: string;
  relevanceScore: number;
}

interface Suggestion {
  id: string;
  anchorText: string;
  contextBefore: string;
  contextAfter: string;
  options: SuggestionOption[];
  isAiSelected: boolean;
  isAccepted: boolean;
  selectedOptionId?: string;
}

export function SuggestionsList() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: '1',
      anchorText: 'soil preparation',
      contextBefore: 'important to consider',
      contextAfter: 'and companion planting',
      options: [
        {
          id: 'opt-1-1',
          title: 'Guide complet de préparation du sol',
          url: '/guides/preparation-sol-potager',
          description: 'Découvrez toutes les étapes pour préparer un sol fertile pour vos légumes.',
          matchedSection: 'H1',
          relevanceScore: 0.94
        },
        {
          id: 'opt-1-2',
          title: 'Améliorer la terre du jardin',
          url: '/techniques/ameliorer-terre-jardin',
          description: 'Techniques pour enrichir et structurer votre sol de jardin.',
          matchedSection: 'H2',
          relevanceScore: 0.87
        },
        {
          id: 'opt-1-3',
          title: 'Sol et compost au potager',
          url: '/guides/compost-sol-potager',
          description: 'Comment utiliser le compost pour améliorer la qualité de votre sol.',
          matchedSection: 'H3',
          relevanceScore: 0.82
        }
      ],
      isAiSelected: false,
      isAccepted: false
    },
    {
      id: '2',
      anchorText: 'companion planting',
      contextBefore: 'soil preparation and',
      contextAfter: 'techniques. Proper spacing',
      options: [
        {
          id: 'opt-2-1',
          title: 'Associations de légumes au potager',
          url: '/techniques/associations-legumes',
          description: 'Découvrez quels légumes planter ensemble pour optimiser votre récolte.',
          matchedSection: 'H1',
          relevanceScore: 0.91
        },
        {
          id: 'opt-2-2',
          title: 'Plantes compagnes pour tomates',
          url: '/guides/compagnons-tomates',
          description: 'Les meilleures plantes à associer avec vos tomates.',
          matchedSection: 'H2',
          relevanceScore: 0.85
        }
      ],
      isAiSelected: false,
      isAccepted: false
    },
    {
      id: '3',
      anchorText: 'seasonal timing',
      contextBefore: 'spacing and understanding',
      contextAfter: 'will help ensure',
      options: [
        {
          id: 'opt-3-1',
          title: 'Calendrier des semis au potager',
          url: '/guides/calendrier-semis',
          description: 'Sachez exactement quand semer vos légumes selon les saisons.',
          matchedSection: 'H1',
          relevanceScore: 0.89
        },
        {
          id: 'opt-3-2',
          title: 'Semis de printemps : timing parfait',
          url: '/guides/semis-printemps',
          description: 'Optimisez vos semis de printemps avec le bon timing.',
          matchedSection: 'H2',
          relevanceScore: 0.83
        },
        {
          id: 'opt-3-3',
          title: 'Quand planter les légumes d\'été',
          url: '/guides/plantation-ete',
          description: 'Guide des dates de plantation pour les légumes d\'été.',
          matchedSection: 'H3',
          relevanceScore: 0.78
        }
      ],
      isAiSelected: false,
      isAccepted: false
    }
  ]);
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(true); // Mock state - would come from parent

  const handleAcceptSuggestion = (id: string, optionId: string) => {
    setSuggestions(prev => 
      prev.map(s => s.id === id ? { ...s, isAccepted: true, selectedOptionId: optionId } : s)
    );
  };

  const handleRejectSuggestion = (id: string) => {
    setSuggestions(prev => 
      prev.filter(s => s.id !== id)
    );
  };

  const handleAiSelection = (linkCount: number) => {
    // Mock AI selection - would call actual AI endpoint
    // For now, just mark the top suggestions as AI selected
    let selectedCount = 0;
    setSuggestions(prev => 
      prev.map(s => {
        if (selectedCount < linkCount) {
          selectedCount++;
          return { ...s, isAiSelected: true };
        }
        return { ...s, isAiSelected: false };
      })
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
                  onAccept={(optionId) => handleAcceptSuggestion(suggestion.id, optionId)}
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