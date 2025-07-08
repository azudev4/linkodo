// src/components/indexing/IndexingManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { SyncMode } from '@/lib/services/oncrawl/types';
import { 
  Database, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Sparkles, 
  RefreshCw,
  BarChart3,
  Zap,
  FileText,
  Zap as ZapIcon,
  HelpCircle
} from 'lucide-react';

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
  const [projects, setProjects] = useState<OnCrawlProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
      const response = await fetch('/api/stats');
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
      const response = await fetch('/api/oncrawl?action=projects');
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

  const handleSyncWithMode = async (syncMode: SyncMode) => {
    if (!selectedProject) return;
    
    setIsSyncing(true);
    clearMessages();
    setSyncProgress(0);
    
    try {
      const response = await fetch('/api/oncrawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: selectedProject,
          syncMode
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSyncProgress(100);
        
        // 🚀 Enhanced success message with detailed breakdown
        const duration = data.duration_ms || 0;
        const rate = duration > 0 ? Math.round(data.processed / (duration / 1000)) : 0;
        
        // Build detailed message
        const parts = [];
        if (data.added > 0) parts.push(`📥 ${data.added} added`);
        if (data.updated > 0) parts.push(`🔄 ${data.updated} updated`);
        if (data.unchanged > 0) parts.push(`⚪ ${data.unchanged} unchanged`);
        if (data.failed > 0) parts.push(`❌ ${data.failed} failed`);
        if (data.removed > 0) parts.push(`🗑️ ${data.removed} removed`);
        
        const breakdown = parts.length > 0 ? parts.join(', ') : 'No changes';
        const modeLabel = data.syncMode === SyncMode.URL_ONLY ? '⚡ Quick' : '🔄 Full';
        
        setSuccess(
          `${modeLabel} sync completed in ${duration}ms (${rate} pages/sec): ${breakdown}`
        );
        
        await loadStats();
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err) {
      setError('Error during sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedProject) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/oncrawl?action=download&projectId=${selectedProject}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `oncrawl-project-${selectedProject}.xlsx`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess('Excel file downloaded successfully (latest accessible crawl)');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
        setError(errorData.error || 'Failed to download Excel file');
      }
    } catch (error) {
      setError('Error downloading Excel file');
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    clearMessages();
    setEmbeddingProgress(0);
    
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
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
            key="error"
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
            key="success"
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
            Import data from the latest accessible crawl in your OnCrawl project
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
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={() => handleSyncWithMode(SyncMode.URL_ONLY)}
                disabled={!selectedProject || isSyncing || isLoading}
                className="flex-[2] h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 text-lg"
                size="lg"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    <span className="font-medium">Syncing...</span>
                  </>
                ) : (
                  <>
                    <ZapIcon className="w-6 h-6 mr-2" />
                    <span className="font-medium">Quick Sync</span>
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleSyncWithMode(SyncMode.FULL)}
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
                    <span className="font-medium">Full Sync</span>
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-gray-600 space-y-1.5 pl-1">
              <div className="flex items-center">
                <ZapIcon className="w-4 h-4 mr-1.5 text-emerald-500" />
                <span className="font-medium text-gray-700">Quick Sync:</span>
                <span className="ml-1.5">Updates page URLs only - <span className="font-medium text-emerald-600">10x faster</span></span>
              </div>
              <div className="flex items-center">
                <Download className="w-4 h-4 mr-1.5 text-blue-500" />
                <span className="font-medium text-gray-700">Full Sync:</span>
                <span className="ml-1.5">Updates all content & metadata</span>
                <HoverCard>
                  <HoverCardTrigger>
                    <HelpCircle className="w-4 h-4 ml-1.5 text-gray-400 hover:text-gray-600 cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">When to use Full Sync:</p>
                      <ul className="text-sm text-gray-500 list-disc pl-4 space-y-1">
                        <li>You've updated page titles or meta descriptions</li>
                        <li>Content has changed significantly</li>
                        <li>You need fresh word counts or depth values</li>
                        <li>Internal linking structure has changed</li>
                      </ul>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          </div>

          {/* Download Options */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Debug Export:</div>
            <div className="flex flex-col gap-3">
              {/* Fixed height container to prevent layout shifts */}
              <div className="min-h-[40px]">
                <Button
                  onClick={handleDownload}
                  disabled={!selectedProject || isDownloading}
                  variant="outline"
                  className="flex-1 h-10 rounded-lg border-2 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-200 transition-all duration-200"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="font-medium">Downloading...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="font-medium">Excel (.xlsx)</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
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