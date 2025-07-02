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
    <Card className="border-2 shadow-lg transition-all duration-200 hover:border-blue-200">
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-full bg-blue-100 p-2">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xl font-semibold text-blue-600">
              Content Analysis
            </span>
          </div>
          <div className="flex items-center gap-3">
            {wordCount > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Badge variant="secondary" className="text-xs px-3 py-1">
                  {wordCount} words
                </Badge>
              </motion.div>
            )}
            {estimatedReadTime > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.1 }}
              >
                <Badge variant="outline" className="text-xs px-3 py-1">
                  ~{estimatedReadTime} min read
                </Badge>
              </motion.div>
            )}
          </div>
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Paste your SEO content below and we'll analyze it for internal linking opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Textarea
              placeholder="Paste your SEO article, blog post, or any content here... 

For example:
'When planning your vegetable garden this spring, it's important to consider soil preparation and companion planting techniques. Proper spacing between plants and understanding seasonal timing will help ensure a successful harvest...'"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[300px] resize-none placeholder:text-muted-foreground border-2 focus:border-blue-200 transition-colors duration-200 rounded-xl p-4"
              disabled={isAnalyzing}
            />
          </motion.div>
        </div>

        {hasAnalyzed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border-2 border-green-200 rounded-xl shadow-sm"
          >
            <div className="flex items-center space-x-3 text-green-800">
              <div className="rounded-full bg-green-100 p-1.5">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">
                Analysis complete! Check suggestions below.
              </span>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between pt-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!text.trim() || isAnalyzing}
              size="sm"
              className="px-6 rounded-lg border-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors duration-200"
            >
              Clear
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleAnalyze}
              disabled={!text.trim() || isAnalyzing}
              size="lg"
              className="px-8 rounded-lg bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
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
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}