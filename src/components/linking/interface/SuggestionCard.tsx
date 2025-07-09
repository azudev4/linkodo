import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Copy, ExternalLink } from 'lucide-react';

interface LinkSuggestion {
  id: string;
  title: string;
  url: string;
  description: string;
  matchedSection: string;
  relevanceScore: number;
}

interface SuggestionCardProps {
  suggestion: LinkSuggestion;
  index: number;
  onCopyLink: (url: string) => void;
}

export function SuggestionCard({ suggestion, index, onCopyLink }: SuggestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="border rounded-xl p-4 hover:bg-gray-50 hover:shadow-md transition-[background-color,box-shadow] duration-200"
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
              onClick={() => onCopyLink(suggestion.url)}
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
  );
}