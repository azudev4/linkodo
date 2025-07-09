import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Link, Target, Check, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

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
  const [isNoSuggestionsOpen, setIsNoSuggestionsOpen] = useState(false);
  
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
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    <Button
                      variant={selectedTerm === term.text ? "default" : "outline"}
                      onClick={() => onTermSelect(term)}
                      className={`w-full justify-between h-12 p-3 transition-all duration-200 ${
                        selectedTerm === term.text 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500' 
                          : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Check className={`w-4 h-4 ${selectedTerm === term.text ? 'text-white' : 'text-emerald-500'}`} />
                        <span className="font-medium text-left">{term.text}</span>
                      </div>
                      
                      <Badge className={`text-xs ${
                        selectedTerm === term.text 
                          ? 'bg-emerald-400 text-white border-emerald-300' 
                          : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                      }`}>
                        <Check className="w-3 h-3 mr-1" /> Validated
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
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
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
            <Collapsible open={isNoSuggestionsOpen} onOpenChange={setIsNoSuggestionsOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between py-2 cursor-pointer group">
                  <div className="flex items-center space-x-2">
                    <Circle className="w-4 h-4 text-gray-400" />
                    <h4 className="font-medium text-gray-900">
                      No Suggestions ({termsWithoutResults.length})
                    </h4>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isNoSuggestionsOpen ? 'transform rotate-180' : ''}`} />
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {termsWithoutResults.map((term, index) => (
                  <motion.div
                    key={`empty-${term.text}-${index}`}
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    <div
                      className="flex items-center justify-between h-10 p-3 transition-all duration-200 rounded-md border bg-gray-50 border-gray-200 text-gray-400"
                    >
                      <div className="flex items-center space-x-2">
                        <Circle className="w-3 h-3" />
                        <span className="font-medium text-left text-sm">{term.text}</span>
                      </div>
                      
                      <Badge className="text-xs bg-gray-100 text-gray-400 border-gray-200">
                        0
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}