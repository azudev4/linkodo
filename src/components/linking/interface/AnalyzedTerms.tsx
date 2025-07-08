// src/components/linking/interface/AnalyzedTerms.tsx
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Link, Target } from 'lucide-react';

interface LinkSuggestion {
  id: string;
  title: string;
  url: string;
  description: string;
  matchedSection: string;
  relevanceScore: number;
}

interface AnalyzedTerm {
  text: string;
  hasResults: boolean;
  suggestionCount: number;
  suggestions: LinkSuggestion[];
}

interface AnalyzedTermsProps {
  terms: AnalyzedTerm[];
  selectedTerm: string | null;
  onTermSelect: (term: AnalyzedTerm) => void;
}

export function AnalyzedTerms({ terms, selectedTerm, onTermSelect }: AnalyzedTermsProps) {
  if (terms.length === 0) return null;

  const termsWithResults = terms.filter(t => t.hasResults);
  const termsWithoutResults = terms.filter(t => !t.hasResults);

  const getSuggestionBadgeColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (count <= 2) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (count <= 4) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-green-100 p-2">
                <Link className="w-5 h-5 text-green-600" />
              </div>
              <span>Anchor Candidates</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Badge variant="outline" className="text-xs">
                {termsWithResults.length} with suggestions
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {terms.length} total
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Terms with results */}
          {termsWithResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-gray-900">
                  With Suggestions ({termsWithResults.length})
                </h4>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {termsWithResults.map((term, index) => (
                  <motion.div
                    key={`${term.text}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant={selectedTerm === term.text ? "default" : "outline"}
                      onClick={() => onTermSelect(term)}
                      className={`w-full justify-between h-auto p-3 transition-all duration-200 ${
                        selectedTerm === term.text 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' 
                          : 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4" />
                        <span className="font-medium text-left">{term.text}</span>
                      </div>
                      
                      <Badge 
                        className={`text-xs ${
                          selectedTerm === term.text
                            ? 'bg-blue-500 text-white border-blue-400'
                            : getSuggestionBadgeColor(term.suggestionCount)
                        }`}
                      >
                        {term.suggestionCount} suggestion{term.suggestionCount !== 1 ? 's' : ''}
                      </Badge>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Terms without results - collapsed by default */}
          {termsWithoutResults.length > 0 && (
            <details className="space-y-3">
              <summary className="flex items-center space-x-2 cursor-pointer text-gray-600 hover:text-gray-800 transition-colors">
                <Circle className="w-4 h-4" />
                <span className="font-medium">
                  No Suggestions ({termsWithoutResults.length})
                </span>
              </summary>
              
              <div className="pl-6 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {termsWithoutResults.map((term, index) => (
                    <motion.div
                      key={`${term.text}-${index}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-gray-50 text-gray-600 border-gray-200 cursor-default"
                      >
                        {term.text}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  These candidates didn't match any pages in your database. Consider creating content for these topics.
                </p>
              </div>
            </details>
          )}
          
          {/* Summary stats */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>
                  <strong>{termsWithResults.reduce((sum, term) => sum + term.suggestionCount, 0)}</strong> total suggestions
                </span>
                <span>
                  <strong>{Math.round((termsWithResults.length / terms.length) * 100)}%</strong> match rate
                </span>
              </div>
              
              {selectedTerm && (
                <div className="text-blue-600 font-medium">
                  Click suggestions below ↓
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}