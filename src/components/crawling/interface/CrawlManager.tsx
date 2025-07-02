'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Globe, Settings, ChevronDown, Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface CrawlJob {
  id: string;
  base_url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  pages_crawled: number;
  pages_total: number | null;
  max_pages: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export function CrawlManager() {
  const [url, setUrl] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [maxPages, setMaxPages] = useState([10]);
  const [excludePatterns, setExcludePatterns] = useState('');
  const [forceRecrawl, setForceRecrawl] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<CrawlJob | null>(null);

  const [indexedPages, setIndexedPages] = useState(1247);
  const [lastCrawl, setLastCrawl] = useState('June 25, 2025');

  useEffect(() => {
    fetchCrawlStats();
  }, []);

  const fetchCrawlStats = async () => {
    try {
      const response = await fetch('/api/crawl');
      const data = await response.json();
      
      if (data.success) {
        setIndexedPages(data.stats.totalPages);
        
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

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleStartCrawl = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }
    
    clearMessages();
    setIsCrawling(true);
    setCrawlProgress(0);
    setCurrentJobId(null);
    setCurrentJob(null);

    try {
      console.log('Starting crawl for:', url);
      
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
      console.log('Crawl API response:', data);

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.success) {
        setCurrentJobId(data.jobId);
        setSuccess(`Crawl started successfully! Job ID: ${data.jobId.slice(0, 8)}`);
        
        // Check if crawl completed immediately (sync mode)
        if (data.completedImmediately) {
          console.log('Crawl completed immediately');
          setIsCrawling(false);
          setCrawlProgress(100);
          setSuccess(`Crawl completed immediately! Processed ${data.pagesProcessed || 0} pages.`);
          
          // Refresh stats and clear form
          await fetchCrawlStats();
          setUrl('');
          setCurrentJobId(null);
          setCurrentJob(null);
        } else {
          // Start polling for async crawl
          pollCrawlProgress(data.jobId);
        }
      } else {
        throw new Error(data.error || 'Crawl failed to start');
      }

    } catch (error) {
      console.error('Crawl error:', error);
      setIsCrawling(false);
      setError(error instanceof Error ? error.message : 'Failed to start crawl');
    }
  };

  const pollCrawlProgress = async (jobId: string) => {
    let pollAttempts = 0;
    const maxAttempts = 120; // 10 minutes max

    console.log('Starting polling for job:', jobId);

    const pollInterval = setInterval(async () => {
      pollAttempts++;
      
      if (pollAttempts > maxAttempts) {
        clearInterval(pollInterval);
        setIsCrawling(false);
        setError('Crawl polling timed out after 10 minutes');
        return;
      }

      try {
        const response = await fetch(`/api/crawl?jobId=${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check crawl status');
        }

        if (data.success && data.job) {
          const job: CrawlJob = data.job;
          setCurrentJob(job);
          
          // Calculate progress
          if (job.pages_total && job.pages_total > 0) {
            const progress = (job.pages_crawled / Math.min(job.pages_total, maxPages[0])) * 100;
            setCrawlProgress(Math.min(progress, 100));
          } else if (job.pages_crawled > 0) {
            // If we don't know total yet, show progress based on pages crawled
            const estimatedProgress = Math.min((job.pages_crawled / maxPages[0]) * 100, 90);
            setCrawlProgress(estimatedProgress);
          }

          // Check if completed
          if (job.status === 'completed') {
            clearInterval(pollInterval);
            setIsCrawling(false);
            setCrawlProgress(100);
            setSuccess(`Crawl completed successfully! Processed ${job.pages_crawled} pages.`);
            
            // Refresh stats and clear form
            await fetchCrawlStats();
            setUrl('');
            setCurrentJobId(null);
            setCurrentJob(null);
            
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setIsCrawling(false);
            setError(`Crawl failed: ${job.error_message || 'Unknown error'}`);
            setCurrentJob(null);
          }
        }
      } catch (error) {
        console.error('Error polling crawl progress:', error);
        
        // Don't stop polling for minor errors, but limit attempts
        if (pollAttempts > 10) {
          clearInterval(pollInterval);
          setIsCrawling(false);
          setError(`Failed to monitor crawl progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }, 3000);

    // Cleanup after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000);
  };

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={clearMessages}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="flex items-center justify-between text-green-800">
                <span>{success}</span>
                <Button variant="ghost" size="sm" onClick={clearMessages}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

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
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) clearMessages(); // Clear error when user types
              }}
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
                disabled={isCrawling}
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
                    disabled={isCrawling}
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
                    disabled={isCrawling}
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
                      disabled={isCrawling}
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

          {/* Progress Section */}
          {isCrawling && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-4 rounded-xl bg-blue-50 border-2 border-blue-100"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center text-blue-700">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="font-medium">
                      {currentJob?.status === 'running' ? 'Crawling website...' : 'Starting crawl...'}
                    </span>
                  </div>
                  {currentJobId && (
                    <span className="text-xs text-blue-500 mt-1 block">
                      Job ID: {currentJobId.slice(0, 8)}
                    </span>
                  )}
                </div>
                <span className="text-lg font-semibold text-blue-700">
                  {Math.round(crawlProgress)}%
                </span>
              </div>
              
              <Progress 
                value={crawlProgress} 
                className="w-full h-2.5 bg-blue-100" 
              />
              
              <div className="flex items-center justify-between text-xs text-blue-600">
                <div className="flex items-center">
                  <Globe className="w-3 h-3 mr-1" />
                  Processing up to {maxPages[0]} pages
                </div>
                {currentJob && (
                  <div className="text-right">
                    <div>Pages: {currentJob.pages_crawled}{currentJob.pages_total ? ` / ${Math.min(currentJob.pages_total, maxPages[0])}` : ''}</div>
                    {currentJob.pages_total && currentJob.pages_total > maxPages[0] && (
                      <div className="text-blue-500">({currentJob.pages_total} total found)</div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Start Button */}
          <motion.div
            whileHover={{ scale: isCrawling ? 1 : 1.01 }}
            whileTap={{ scale: isCrawling ? 1 : 0.99 }}
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