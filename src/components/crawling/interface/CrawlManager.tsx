'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Database, Globe, Settings, ChevronDown, Loader2 } from 'lucide-react';

export function CrawlManager() {
  const [url, setUrl] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [maxPages, setMaxPages] = useState([10]); // Default to 10 for testing
  const [excludePatterns, setExcludePatterns] = useState('');
  const [forceRecrawl, setForceRecrawl] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Real data - would be fetched from API
  const [indexedPages, setIndexedPages] = useState(1247);
  const [lastCrawl, setLastCrawl] = useState('June 25, 2025');

  // Fetch current stats on component mount
  useEffect(() => {
    fetchCrawlStats();
  }, []);

  const fetchCrawlStats = async () => {
    try {
      const response = await fetch('/api/crawl');
      const data = await response.json();
      
      if (data.success) {
        setIndexedPages(data.stats.totalPages);
        
        // Get last crawl date from recent jobs
        if (data.stats.recentJobs.length > 0) {
          const lastJob = data.stats.recentJobs[0];
          const lastDate = new Date(lastJob.completed_at || lastJob.created_at);
          setLastCrawl(lastDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch crawl stats:', error);
    }
  };

  const handleStartCrawl = async () => {
    if (!url.trim()) return;
    
    setIsCrawling(true);
    setCrawlProgress(0);
    setCurrentJobId(null);

    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseUrl: url,
          maxPages: maxPages[0],
          excludePatterns: excludePatterns,
          forceRecrawl: forceRecrawl
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start crawl');
      }

      if (data.success) {
        setCurrentJobId(data.jobId);
        // Start polling for progress
        pollCrawlProgress(data.jobId);
      } else {
        throw new Error(data.error || 'Crawl failed to start');
      }

    } catch (error) {
      console.error('Crawl error:', error);
      setIsCrawling(false);
      // You might want to show an error message to the user here
      alert(error instanceof Error ? error.message : 'Failed to start crawl');
    }
  };

  const pollCrawlProgress = async (jobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/crawl?jobId=${jobId}`);
        const data = await response.json();

        if (data.success && data.job) {
          const job = data.job;
          
          // Calculate progress
          if (job.pages_total && job.pages_total > 0) {
            const progress = (job.pages_crawled / Math.min(job.pages_total, maxPages[0])) * 100;
            setCrawlProgress(Math.min(progress, 100));
          }

          // Check if completed
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(pollInterval);
            setIsCrawling(false);
            
            if (job.status === 'completed') {
              setCrawlProgress(100);
              // Refresh stats
              await fetchCrawlStats();
              // Clear form
              setUrl('');
              setCurrentJobId(null);
            } else {
              alert(`Crawl failed: ${job.error_message || 'Unknown error'}`);
            }
          }
        }
      } catch (error) {
        console.error('Error polling crawl progress:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Clear interval after 10 minutes max
    setTimeout(() => clearInterval(pollInterval), 600000);
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center space-x-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xl font-semibold text-blue-600">
              Indexing Status
            </span>
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Current database status and indexing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100"
            >
              <div className="text-3xl font-bold text-blue-600">
                {indexedPages.toLocaleString()}
              </div>
              <div className="text-sm font-medium text-blue-600">Pages indexed</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100"
            >
              <div className="text-xl font-semibold text-gray-800">
                {lastCrawl}
              </div>
              <div className="text-sm font-medium text-gray-600">Last crawl</div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Crawl Interface */}
      <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center space-x-3">
            <div className="rounded-full bg-green-100 p-2">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xl font-semibold text-green-600">
              Start New Crawl
            </span>
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Enter a website URL to begin crawling and indexing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <Label htmlFor="url" className="text-sm font-medium text-gray-700">Website URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isCrawling}
              className="h-12 px-4 border-2 rounded-xl focus:border-green-200 transition-colors duration-200"
            />
          </motion.div>

          {/* Advanced Options */}
          <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between p-4 h-auto rounded-xl border-2 hover:bg-gray-50 hover:border-gray-200 transition-all duration-200"
              >
                <span className="flex items-center space-x-2">
                  <div className="rounded-full bg-gray-100 p-1.5">
                    <Settings className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium">Advanced Options</span>
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
                className="space-y-6 p-4 mt-4 rounded-xl bg-gray-50 border-2"
              >
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Max Pages: {maxPages[0]}</Label>
                  <Slider
                    value={maxPages}
                    onValueChange={setMaxPages}
                    max={100}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 italic">
                    Recommended: 5-20 pages for testing, 50-100 for production
                  </p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="exclude" className="text-sm font-medium">Exclude Patterns (optional)</Label>
                  <Input
                    id="exclude"
                    placeholder="/admin, /private, *.pdf"
                    value={excludePatterns}
                    onChange={(e) => setExcludePatterns(e.target.value)}
                    className="h-10 border-2 rounded-lg focus:border-gray-300"
                  />
                  <p className="text-xs text-gray-500 italic">
                    Comma-separated patterns to exclude from crawling
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white border-2 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="force-recrawl"
                      checked={forceRecrawl}
                      onCheckedChange={(checked) => setForceRecrawl(checked as boolean)}
                      className="border-2"
                    />
                    <Label htmlFor="force-recrawl" className="text-sm font-medium">
                      Force recrawl existing pages
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    By default, pages already in database are skipped. Enable this to re-index everything.
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
              className="space-y-3 p-4 rounded-xl bg-blue-50 border-2 border-blue-100"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-700">
                  {currentJobId ? 
                    <>
                      <span className="flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Crawling website...
                      </span>
                      <span className="text-xs text-blue-500 mt-1 block">
                        Job ID: {currentJobId.slice(0, 8)}
                      </span>
                    </> : 
                    'Starting crawl...'
                  }
                </span>
                <span className="text-lg font-semibold text-blue-700">
                  {Math.round(crawlProgress)}%
                </span>
              </div>
              <Progress 
                value={crawlProgress} 
                className="w-full h-2.5 bg-blue-100" 
              />
              <p className="text-xs text-blue-600 flex items-center">
                <Globe className="w-3 h-3 mr-1" />
                Processing up to {maxPages[0]} pages • This may take a few minutes
              </p>
            </motion.div>
          )}

          {/* Start Button */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Button
              onClick={handleStartCrawl}
              disabled={!url.trim() || isCrawling}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isCrawling ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span className="font-medium">Crawling...</span>
                </>
              ) : (
                <>
                  <Globe className="w-5 h-5 mr-2" />
                  <span className="font-medium">Start Crawling</span>
                </>
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}