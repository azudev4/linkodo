// src/components/indexing/IndexingManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Sparkles, 
  RefreshCw,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';

interface OnCrawlWorkspace {
  id: string;
  name: string;
}

interface OnCrawlProject {
  id: string;
  name: string;
  url: string;
  workspace_id: string;
  last_crawl_id?: string;
}

interface OnCrawlCrawl {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface DatabaseStats {
  totalPages: number;
  pagesWithEmbeddings: number;
  pagesWithoutEmbeddings: number;
  embeddingProgress: number;
  lastSync: string | null;
}

export function IndexingManager() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [workspaces, setWorkspaces] = useState<OnCrawlWorkspace[]>([]);
  const [projects, setProjects] = useState<OnCrawlProject[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadStats();
    loadProjects();
  }, []);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/indexing?action=stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/indexing?action=projects');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
      } else {
        setError('Failed to load OnCrawl projects');
      }
    } catch (err) {
      setError('Error connecting to OnCrawl');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedProject) return;
    
    const project = projects.find(p => p.id === selectedProject);
    const latestCrawlId = project?.last_crawl_id;
    
    if (!latestCrawlId) {
      setError('No crawls found for this project');
      return;
    }
    
    setIsSyncing(true);
    clearMessages();
    setSyncProgress(0);
    
    try {
      const response = await fetch('/api/indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          crawlId: latestCrawlId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSyncProgress(100);
        setSuccess(`Successfully synced ${data.processed} pages from OnCrawl!`);
        await loadStats(); // Refresh stats
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err) {
      setError('Error during sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!selectedProject) return;
    
    const project = projects.find(p => p.id === selectedProject);
    const latestCrawlId = project?.last_crawl_id;
    
    if (!latestCrawlId) {
      setError('No crawls found for this project');
      return;
    }
    
    try {
      const response = await fetch(`/api/indexing?action=download-csv&crawlId=${latestCrawlId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oncrawl-pages-${latestCrawlId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess('CSV downloaded successfully');
      } else {
        setError('Failed to download CSV');
      }
    } catch (error) {
      setError('Error downloading CSV');
      console.error('Download error:', error);
    }
  };

  const handleGenerateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    clearMessages();
    setEmbeddingProgress(0);
    
    try {
      const response = await fetch('/api/indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-embeddings'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEmbeddingProgress(100);
        setSuccess(`Generated embeddings for ${data.processed} pages!`);
        await loadStats(); // Refresh stats
      } else {
        setError(data.error || 'Embedding generation failed');
      }
    } catch (err) {
      setError('Error generating embeddings');
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

      {/* Database Statistics */}
      <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-3">
              <div className="rounded-full bg-blue-100 p-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xl font-semibold text-blue-600">Database Status</span>
            </CardTitle>
            <CardDescription>Current indexing and embedding status</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </CardHeader>
        
        <CardContent>
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Pages */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100"
              >
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalPages.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-blue-600">Pages Indexed</div>
                <div className="text-xs text-gray-500">
                  Last sync: {formatDate(stats.lastSync)}
                </div>
              </motion.div>

              {/* Embeddings Status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-green-50 to-white border border-green-100"
              >
                <div className="text-3xl font-bold text-green-600">
                  {stats.pagesWithEmbeddings.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-green-600">Embeddings Generated</div>
                <div className="text-xs text-gray-500">
                  {stats.embeddingProgress}% complete
                </div>
              </motion.div>

              {/* Pending Embeddings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-white border border-orange-100"
              >
                <div className="text-3xl font-bold text-orange-600">
                  {stats.pagesWithoutEmbeddings.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-orange-600">Pending Embeddings</div>
                <div className="text-xs text-gray-500">
                  Ready for processing
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* Embedding Progress Bar */}
          {stats && stats.totalPages > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium">Embedding Progress</span>
                <span className="text-gray-600">{stats.embeddingProgress}%</span>
              </div>
              <Progress value={stats.embeddingProgress} className="h-2" />
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* OnCrawl Sync */}
      <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <div className="rounded-full bg-green-100 p-2">
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xl font-semibold text-green-600">OnCrawl Sync</span>
          </CardTitle>
          <CardDescription>
            Import your existing crawl data from OnCrawl for internal link suggestions
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <Select value={selectedProject} onValueChange={setSelectedProject} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project to sync" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[300px]">
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sync Progress */}
          {isSyncing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-4 rounded-xl bg-blue-50 border-2 border-blue-100"
            >
              <div className="flex items-center text-blue-700">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="font-medium">Syncing data from OnCrawl...</span>
              </div>
              <Progress value={syncProgress} className="w-full" />
            </motion.div>
          )}

          {/* Sync Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSync}
              disabled={!selectedProject || isSyncing || isLoading}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              size="lg"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span className="font-medium">Syncing...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  <span className="font-medium">Sync from OnCrawl</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDownloadCSV}
              disabled={!selectedProject}
              variant="outline"
              className="h-12 px-6 rounded-xl border-2 hover:bg-gray-50 transition-all duration-200"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              <span className="font-medium">Debug CSV</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Embedding Generation */}
      <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <div className="rounded-full bg-purple-100 p-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xl font-semibold text-purple-600">AI Embeddings</span>
          </CardTitle>
          <CardDescription>
            Generate semantic embeddings for pages to enable intelligent link suggestions
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {stats && stats.pagesWithoutEmbeddings > 0 && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-medium text-purple-900">
                    {stats.pagesWithoutEmbeddings.toLocaleString()} pages need embeddings
                  </div>
                  <div className="text-sm text-purple-700">
                    Generate embeddings to enable semantic link matching
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Embedding Progress */}
          {isGeneratingEmbeddings && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-4 rounded-xl bg-purple-50 border-2 border-purple-100"
            >
              <div className="flex items-center text-purple-700">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="font-medium">Generating AI embeddings...</span>
              </div>
              <Progress value={embeddingProgress} className="w-full" />
            </motion.div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateEmbeddings}
            disabled={!stats || stats.pagesWithoutEmbeddings === 0 || isGeneratingEmbeddings}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
            size="lg"
          >
            {isGeneratingEmbeddings ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span className="font-medium">Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  {stats && stats.pagesWithoutEmbeddings > 0 
                    ? `Generate ${stats.pagesWithoutEmbeddings} Embeddings`
                    : 'All Embeddings Generated'
                  }
                </span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}