// src/components/indexing/IndexingManager.tsx
'use client';

import { useState } from 'react';
import { StatusMessages } from './interface/StatusMessages';
import { DatabaseStats } from './interface/DatabaseStats';
import { ContactCrawlSetup } from './interface/ContactCrawlSetup';
import { EmbeddingsGenerator } from './interface/EmbeddingsGenerator';
import { useStatsCache } from '@/hooks/useStatsCache';

export function IndexingManager() {
  const { 
    stats, 
    isLoading: isLoadingStats, 
    refreshStats 
  } = useStatsCache();
  
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
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
        await refreshStats();
      } else {
        setError(data.error || 'Embedding generation failed');
      }
    } catch {
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
        onRefresh={refreshStats}
        isLoading={isLoadingStats}
      />
      
      <ContactCrawlSetup />
      
      <EmbeddingsGenerator 
        stats={stats}
        onGenerate={handleGenerateEmbeddings}
        isGenerating={isGeneratingEmbeddings}
        progress={embeddingProgress}
      />
    </div>
  );
}