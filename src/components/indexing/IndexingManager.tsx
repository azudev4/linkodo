// src/components/indexing/IndexingManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { SyncMode } from '@/lib/services/oncrawl/types';
import { StatusMessages } from './interface/StatusMessages';
import { DatabaseStats } from './interface/DatabaseStats';
import { OnCrawlSync } from './interface/OnCrawlSync';
import { EmbeddingsGenerator } from './interface/EmbeddingsGenerator';

interface OnCrawlProject {
  id: string;
  name: string;
  url: string;
  workspace_id: string;
  last_crawl_id?: string;
}

interface DatabaseStatsType {
  totalPages: number;
  pagesWithEmbeddings: number;
  pagesWithoutEmbeddings: number;
  embeddingProgress: number;
  lastSync: string | null;
}

export function IndexingManager() {
  const [stats, setStats] = useState<DatabaseStatsType | null>(null);
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
        
        // Build detailed message
        const parts = [];
        if (data.added > 0) parts.push(`📥 ${data.added} added`);
        if (data.updated > 0) parts.push(`🔄 ${data.updated} updated`);
        if (data.unchanged > 0) parts.push(`⚪ ${data.unchanged} unchanged`);
        if (data.failed > 0) parts.push(`❌ ${data.failed} failed`);
        if (data.removed > 0) parts.push(`🗑️ ${data.removed} removed`);
        
        const breakdown = parts.length > 0 ? parts.join(', ') : 'No changes';
        const modeLabel = data.syncMode === SyncMode.URL_ONLY ? '⚡ Quick' : '🔄 Full';
        const duration = data.duration_ms || 0;
        const rate = duration > 0 ? Math.round(data.processed / (duration / 1000)) : 0;
        
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
        await loadStats();
      } else {
        setError(data.error || 'Embedding generation failed');
      }
    } catch (err) {
      setError('Error generating embeddings');
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  return (
    <div className="space-y-6">
      <StatusMessages 
        error={error}
        success={success}
        onClear={clearMessages}
      />
      
      <DatabaseStats 
        stats={stats}
        onRefresh={loadStats}
      />
      
      <OnCrawlSync 
        projects={projects}
        selectedProject={selectedProject}
        onProjectSelect={setSelectedProject}
        onSync={handleSyncWithMode}
        onDownload={handleDownload}
        isSyncing={isSyncing}
        isDownloading={isDownloading}
        syncProgress={syncProgress}
      />
      
      <EmbeddingsGenerator 
        stats={stats}
        onGenerate={handleGenerateEmbeddings}
        isGenerating={isGeneratingEmbeddings}
        progress={embeddingProgress}
      />
    </div>
  );
}