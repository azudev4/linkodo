'use client';

import React, { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Database, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterInterface } from './FilterInterface';
import { RawPagesTable } from './RawPagesTable';
import { ClientSessionsList } from './ClientSessionsList';

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

// Mock data for demonstration
const mockRawPages = [
  {
    id: '1',
    url: 'https://example.com/',
    title: 'Homepage - Example Company',
    meta_description: 'Leading provider of innovative solutions for modern businesses.',
    status_code: 200,
    crawled_at: '2024-01-15T10:30:00Z',
    session_id: 'session-1',
    client_name: 'example-client',
    content_hash: 'hash1',
    link_hash: 'linkhash1',
    h1_tags: ['Welcome to Example'],
    links: ['https://example.com/about', 'https://example.com/contact'],
    robots_content: null,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    included: true
  },
  {
    id: '2',
    url: 'https://example.com/blog/seo-tips',
    title: 'Top 10 SEO Tips for 2024',
    meta_description: 'Discover the latest SEO strategies to boost your website rankings.',
    status_code: 200,
    crawled_at: '2024-01-15T10:31:00Z',
    session_id: 'session-1',
    client_name: 'example-client',
    content_hash: 'hash2',
    link_hash: 'linkhash2',
    h1_tags: ['SEO Tips'],
    links: ['https://example.com/blog', 'https://example.com/services'],
    robots_content: null,
    created_at: '2024-01-15T10:31:00Z',
    updated_at: '2024-01-15T10:31:00Z',
    included: true
  },
  {
    id: '3',
    url: 'https://example.com/admin/login',
    title: 'Admin Login',
    meta_description: null,
    status_code: 200,
    crawled_at: '2024-01-15T10:32:00Z',
    session_id: 'session-1',
    client_name: 'example-client',
    content_hash: 'hash3',
    link_hash: 'linkhash3',
    h1_tags: ['Login'],
    links: [],
    robots_content: 'noindex, nofollow',
    created_at: '2024-01-15T10:32:00Z',
    updated_at: '2024-01-15T10:32:00Z',
    included: false,
    filtered_reason: 'Admin page - excluded by URL pattern'
  },
  {
    id: '4',
    url: 'https://example.com/404-test',
    title: null,
    meta_description: null,
    status_code: 404,
    crawled_at: '2024-01-15T10:33:00Z',
    session_id: 'session-1',
    client_name: 'example-client',
    content_hash: null,
    link_hash: null,
    h1_tags: null,
    links: null,
    robots_content: null,
    created_at: '2024-01-15T10:33:00Z',
    updated_at: '2024-01-15T10:33:00Z',
    included: false,
    filtered_reason: '404 error - automatically excluded'
  },
  {
    id: '5',
    url: 'https://example.com/products/widget-1',
    title: 'Professional Widget - Example Products',
    meta_description: 'High-quality professional widget for enterprise applications.',
    status_code: 200,
    crawled_at: '2024-01-15T10:34:00Z',
    session_id: 'session-1',
    client_name: 'example-client',
    content_hash: 'hash5',
    link_hash: 'linkhash5',
    h1_tags: ['Professional Widget'],
    links: ['https://example.com/products', 'https://example.com/buy'],
    robots_content: null,
    created_at: '2024-01-15T10:34:00Z',
    updated_at: '2024-01-15T10:34:00Z',
    included: true
  }
];

export function AdminCrawlsShell() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [rawPages, setRawPages] = useState(mockRawPages);
  const [filteredPages, setFilteredPages] = useState(mockRawPages);

  const handleFiltersChange = (filters: any) => {
    // Apply filters to raw pages
    let filtered = rawPages.filter(page => {
      // Status code filtering
      if (filters.statusCodes.length > 0 && !filters.statusCodes.includes('all')) {
        if (filters.statusCodes.includes('200') && page.status_code !== 200) return false;
        if (filters.statusCodes.includes('2xx') && (page.status_code < 200 || page.status_code >= 300)) return false;
        if (filters.statusCodes.includes('3xx') && (page.status_code < 300 || page.status_code >= 400)) return false;
        if (filters.statusCodes.includes('4xx') && (page.status_code < 400 || page.status_code >= 500)) return false;
      }

      // URL filtering
      if (filters.urlIncludes && !page.url.includes(filters.urlIncludes)) return false;
      if (filters.urlExcludes && page.url.includes(filters.urlExcludes)) return false;

      // Meta description filtering
      if (filters.hasMetaDescription === 'yes' && !page.meta_description) return false;
      if (filters.hasMetaDescription === 'no' && page.meta_description) return false;

      // Title tag filtering
      if (filters.hasTitleTag === 'yes' && !page.title) return false;
      if (filters.hasTitleTag === 'no' && page.title) return false;

      return true;
    });

    setFilteredPages(filtered);
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleBackToSessions = () => {
    setSelectedSessionId(null);
  };

  // If a session is selected, show the filtering interface
  if (selectedSessionId) {
    return (
      <div className="space-y-8">
        {/* Header with back button */}
        <AnimationContainer>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <Button
                variant="ghost"
                onClick={handleBackToSessions}
                className="mb-4 text-gray-600 hover:text-gray-900"
              >
                ← Back to Sessions
              </Button>
              <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
                Page Filtering
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                Session{" "}
                <span className="text-transparent bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text">
                  {selectedSessionId}
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Filter and review crawled pages before assigning them to clients. Ensure only relevant, high-quality content reaches your customers.
              </p>
            </div>
          </div>
        </AnimationContainer>

        {/* Filter Interface */}
        <AnimationContainer delay={0.1}>
          <FilterInterface
            onFiltersChange={handleFiltersChange}
            filteredCount={filteredPages.length}
            totalCount={rawPages.length}
          />
        </AnimationContainer>

        {/* Raw Pages Table */}
        <AnimationContainer delay={0.2}>
          <RawPagesTable
            pages={filteredPages}
            onPagesUpdate={setRawPages}
            selectedCrawlSession={selectedSessionId}
          />
        </AnimationContainer>
      </div>
    );
  }

  // Default view: show sessions list
  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimationContainer>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
              Crawl Management
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              Crawl{" "}
              <span className="text-transparent bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text">
                Sessions
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Monitor and manage website crawling operations. Review raw pages and filter content before promoting to clients.
            </p>
          </div>
        </div>
      </AnimationContainer>

      {/* Client Sessions List */}
      <AnimationContainer delay={0.1}>
        <ClientSessionsList onSessionSelect={handleSessionSelect} />
      </AnimationContainer>
    </div>
  );
}