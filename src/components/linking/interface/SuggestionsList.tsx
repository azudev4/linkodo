import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'lucide-react';
import { SuggestionCard } from './SuggestionCard';

interface LinkSuggestion {
  id: string;
  title: string;
  url: string;
  description: string;
  matchedSection: string;
  relevanceScore: number;
}

interface SuggestionsListProps {
  suggestions: LinkSuggestion[];
  onCopyLink: (url: string) => void;
  selectedTerm?: string;
}

export function SuggestionsList({ suggestions, onCopyLink, selectedTerm }: SuggestionsListProps) {
  if (suggestions.length === 0) return null;

  // Create a stable key based on the selected term and first suggestion ID
  const listKey = `${selectedTerm || 'default'}-${suggestions[0]?.id || 'empty'}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={listKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="rounded-full bg-green-100 p-2">
                <Link className="w-5 h-5 text-green-600" />
              </div>
              <span>{selectedTerm ? `Suggestions for "${selectedTerm}"` : 'Link Suggestions'}</span>
              <Badge variant="secondary">
                {suggestions.length} found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  index={index}
                  onCopyLink={onCopyLink}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}