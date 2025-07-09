import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Link, Target, Check } from 'lucide-react';

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
  isValidated?: boolean;
}

interface AnalyzedTermsProps {
  terms: AnalyzedTerm[];
  selectedTerm: string | null;
  onTermSelect: (term: AnalyzedTerm) => void;
}

export function AnalyzedTerms({ terms, selectedTerm, onTermSelect }: AnalyzedTermsProps) {
  if (terms.length === 0) return null;

  const validatedTerms = terms.filter(t => t.isValidated);
  const termsWithResults = terms.filter(t => t.hasResults && !t.isValidated);
  const termsWithoutResults = terms.filter(t => !t.hasResults && !t.isValidated);

  const getSuggestionBadgeColor = (count: number, isValidated: boolean) => {
    if (isValidated) return 'bg-green-100 text-green-700 border-green-200';
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
                {termsWithResults.length} pending
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                {validatedTerms.length} validated
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {terms.length} total
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Validated terms */}
          {validatedTerms.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-gray-900">
                  Validated ({validatedTerms.length})
                </h4>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {validatedTerms.map((term, index) => (
                  <motion.div
                    key={`validated-${term.text}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant={selectedTerm === term.text ? "default" : "outline"}
                      onClick={() => onTermSelect(term)}
                      className={`w-full justify-between h-12 p-3 transition-all duration-200 ${
                        selectedTerm === term.text 
                          ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                          : 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-left">{term.text}</span>
                      </div>
                      
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                        ✓ Validated
                      </Badge>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Terms with results */}
          {termsWithResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-gray-900">
                  With Suggestions ({termsWithResults.length})
                </h4>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {termsWithResults.map((term, index) => (
                  <motion.div
                    key={`pending-${term.text}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant={selectedTerm === term.text ? "default" : "outline"}
                      onClick={() => onTermSelect(term)}
                      className={`w-full justify-between h-12 p-3 transition-all duration-200 ${
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
                            : getSuggestionBadgeColor(term.suggestionCount, false)
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

          {/* Terms without results */}
          {termsWithoutResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Circle className="w-4 h-4 text-gray-400" />
                <h4 className="font-medium text-gray-900">
                  No Suggestions ({termsWithoutResults.length})
                </h4>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {termsWithoutResults.map((term, index) => (
                  <motion.div
                    key={`empty-${term.text}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Button
                      variant={selectedTerm === term.text ? "default" : "outline"}
                      onClick={() => onTermSelect(term)}
                      className={`w-full justify-between h-10 p-3 transition-all duration-200 ${
                        selectedTerm === term.text 
                          ? 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Circle className="w-3 h-3" />
                        <span className="font-medium text-left text-sm">{term.text}</span>
                      </div>
                      
                      <Badge className="text-xs bg-gray-100 text-gray-600 border-gray-200">
                        0
                      </Badge>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}