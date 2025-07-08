import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface AnalyzedTerm {
  text: string;
  hasResults: boolean;
}

interface AnalyzedTermsProps {
  terms: AnalyzedTerm[];
}

export function AnalyzedTerms({ terms }: AnalyzedTermsProps) {
  if (terms.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 p-4 bg-gray-50 rounded-xl border"
    >
      <div className="text-sm font-medium text-gray-700">
        Analyzed terms ({terms.length}):
      </div>
      <div className="flex flex-wrap gap-2">
        {terms.map((term, index) => (
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
  );
} 