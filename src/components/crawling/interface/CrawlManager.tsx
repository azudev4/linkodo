'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Database, Globe, Settings, ChevronDown, Loader2 } from 'lucide-react';

export function CrawlManager() {
  const [url, setUrl] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [maxPages, setMaxPages] = useState([1000]);
  const [excludePatterns, setExcludePatterns] = useState('');

  // Mock data - would come from database
  const indexedPages = 1247;
  const lastCrawl = 'June 25, 2025';

  const handleStartCrawl = async () => {
    if (!url.trim()) return;
    
    setIsCrawling(true);
    setCrawlProgress(0);
    
    // Mock progress simulation
    const interval = setInterval(() => {
      setCrawlProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCrawling(false);
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span>Indexing Status</span>
          </CardTitle>
          <CardDescription>
            Current database status and indexing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-2xl font-semibold text-gray-900">
                {indexedPages.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Pages indexed</div>
            </div>
            <div>
              <div className="text-lg font-medium text-gray-700">
                {lastCrawl}
              </div>
              <div className="text-sm text-gray-600">Last crawl</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Crawl Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-green-600" />
            <span>Start New Crawl</span>
          </CardTitle>
          <CardDescription>
            Enter a website URL to begin crawling and indexing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isCrawling}
            />
          </div>

          {/* Advanced Options */}
          <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Advanced Options</span>
                </span>
                <motion.div
                  animate={{ rotate: isConfigOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent asChild>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pt-4"
              >
                <div className="space-y-2">
                  <Label>Max Pages: {maxPages[0]}</Label>
                  <Slider
                    value={maxPages}
                    onValueChange={setMaxPages}
                    max={5000}
                    min={100}
                    step={100}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exclude">Exclude Patterns (optional)</Label>
                  <Input
                    id="exclude"
                    placeholder="/admin, /private, *.pdf"
                    value={excludePatterns}
                    onChange={(e) => setExcludePatterns(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Comma-separated patterns to exclude from crawling
                  </p>
                </div>
              </motion.div>
            </CollapsibleContent>
          </Collapsible>

          {/* Progress Bar */}
          {isCrawling && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span>Crawling in progress...</span>
                <span>{Math.round(crawlProgress)}%</span>
              </div>
              <Progress value={crawlProgress} className="w-full" />
            </motion.div>
          )}

          {/* Start Button */}
          <Button
            onClick={handleStartCrawl}
            disabled={!url.trim() || isCrawling}
            className="w-full"
            size="lg"
          >
            {isCrawling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Crawling...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Start Crawling
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}