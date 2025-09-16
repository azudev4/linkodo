'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowLeft, Filter as FilterIcon, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterInterface } from './filters/FilterInterface';
import { RawPagesTable } from './RawPagesTable';
import { RawPage } from './filters/types';
import { useRawPagesStore } from '@/lib/stores/useRawPagesStore';
import Link from 'next/link';

interface AnimationContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const AnimationContainer = ({ children, className, delay = 0.1 }: AnimationContainerProps) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className={cn("w-full h-full", className)}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{
        delay: delay,
        duration: 0.6,
        type: "spring",
        stiffness: 80,
        damping: 12,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
};

interface CrawlSessionDetailsShellProps {
  sessionId: string;
}

interface CrawlSession {
  id: string;
  domain: string;
  client_profile?: {
    full_name: string | null;
    company_name: string | null;
  };
  status: string;
  review_progress?: string;
  total_pages: number;
  created_at: string;
}

export function CrawlSessionDetailsShell({ sessionId }: CrawlSessionDetailsShellProps) {
  const [session, setSession] = useState<CrawlSession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Use the Zustand store for all raw pages state
  const {
    pages: rawPages,
    filteredPages,
    loading,
    error,
    highlightedPageIds,
    isExcluding,
    setSessionId,
    fetchPages,
    setHighlightedPages,
    addExclusions,
    resetStore
  } = useRawPagesStore();

  const fetchSessionDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/crawl-sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch session details');
      }
      const data = await response.json();
      setSession(data);
    } catch (err) {
      console.error('Error fetching session details:', err);
      setSessionError(err instanceof Error ? err.message : 'Failed to fetch session');
    }
  }, [sessionId]);

  useEffect(() => {
    // Initialize store with session ID and fetch data
    setSessionId(sessionId);
    fetchSessionDetails();
    fetchPages();

    // Cleanup on unmount
    return () => {
      resetStore();
    };
  }, [sessionId, setSessionId, fetchPages, resetStore, fetchSessionDetails]);

  // Handle exclusions from filter interface - now uses store
  const handleExclusionChange = useCallback((newExclusionPageIds: string[]) => {
    // Simply add these new exclusions to existing ones
    addExclusions(newExclusionPageIds);
  }, [addExclusions]);

  // Handle highlight changes for UI preview
  const handleHighlightChange = useCallback((pageIds: string[]) => {
    setHighlightedPages(pageIds);
  }, [setHighlightedPages]);

  const getClientDisplayName = () => {
    if (!session) return 'Loading...';
    if (session.client_profile?.company_name) return session.client_profile.company_name;
    if (session.client_profile?.full_name) return session.client_profile.full_name;
    return 'Unassigned';
  };

  if (error || sessionError) {
    return (
      <div className="space-y-8">
        <AnimationContainer>
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading session</h3>
            <p className="text-gray-500 mb-4">{error || sessionError}</p>
            <div className="space-x-4">
              <Link href="/admin/crawls">
                <Button variant="outline">Back to Sessions</Button>
              </Link>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </AnimationContainer>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with back button */}
      <AnimationContainer>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <Link href="/admin/crawls">
              <Button
                variant="ghost"
                className="mb-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sessions
              </Button>
            </Link>
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
              <FilterIcon className="w-4 h-4 mr-2" />
              Page Filtering
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {session?.domain || 'Loading...'}{" "}
              <span className="text-transparent bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text">
                Session
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Filter and review crawled pages before assigning them to clients. Ensure only relevant, high-quality content reaches your customers.
            </p>
            {session && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Client: <strong>{getClientDisplayName()}</strong></span>
                <span>•</span>
                <span>Pages: <strong>{session.total_pages?.toLocaleString() || 0}</strong></span>
                <span>•</span>
                <span>Status: <strong className="capitalize">{session.status}</strong></span>
              </div>
            )}
          </div>
        </div>
      </AnimationContainer>

      {/* Filter Interface */}
      <div>
        <FilterInterface
          onExclusionChange={handleExclusionChange}
          onHighlightChange={handleHighlightChange}
          totalCount={rawPages.length}
          pages={rawPages}
          isExcluding={isExcluding}
        />
      </div>

      {/* Raw Pages Table */}
      <AnimationContainer delay={0.2}>
        <RawPagesTable
          pages={rawPages} // Pass FULL pages array so table can calculate correct counts
          onPagesUpdate={() => {}} // Will be removed - table should use store directly
          onRefresh={fetchPages}
          sessionId={sessionId}
          loading={loading}
          highlightedPageIds={highlightedPageIds}
        />
      </AnimationContainer>
    </div>
  );
}