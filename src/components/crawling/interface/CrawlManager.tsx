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
                    max={100}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Recommended: 5-20 pages for testing, 50-100 for production
                  </p>
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="force-recrawl"
                    checked={forceRecrawl}
                    onCheckedChange={(checked) => setForceRecrawl(checked as boolean)}
                  />
                  <Label htmlFor="force-recrawl" className="text-sm font-normal">
                    Force recrawl existing pages
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  By default, pages already in database are skipped. Enable this to re-index everything.
                </p>
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
                <span>
                  {currentJobId ? 
                    `Crawling website... (Job: ${currentJobId.slice(0, 8)})` : 
                    'Starting crawl...'
                  }
                </span>
                <span>{Math.round(crawlProgress)}%</span>
              </div>
              <Progress value={crawlProgress} className="w-full" />
              <p className="text-xs text-gray-500">
                Processing up to {maxPages[0]} pages • This may take a few minutes
              </p>
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