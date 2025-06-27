'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Loader2 } from 'lucide-react';

export function TextAnalyzer() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const estimatedReadTime = Math.ceil(wordCount / 200);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    
    // Mock analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
    }, 2000);
  };

  const handleClear = () => {
    setText('');
    setHasAnalyzed(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Content Analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            {wordCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {wordCount} words
              </Badge>
            )}
            {estimatedReadTime > 0 && (
              <Badge variant="outline" className="text-xs">
                ~{estimatedReadTime} min read
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Paste your SEO content below and we'll analyze it for internal linking opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Paste your SEO article, blog post, or any content here... 

For example:
'When planning your vegetable garden this spring, it's important to consider soil preparation and companion planting techniques. Proper spacing between plants and understanding seasonal timing will help ensure a successful harvest...'"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[300px] resize-none"
            disabled={isAnalyzing}
          />
        </div>

        {hasAnalyzed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center space-x-2 text-green-800">
              <Search className="w-4 h-4" />
              <span className="text-sm font-medium">
                Analysis complete! Check suggestions below.
              </span>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!text.trim() || isAnalyzing}
            size="sm"
          >
            Clear
          </Button>

          <Button
            onClick={handleAnalyze}
            disabled={!text.trim() || isAnalyzing}
            size="lg"
            className="px-8"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Analyze Text
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}