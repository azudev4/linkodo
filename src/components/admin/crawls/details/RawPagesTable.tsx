'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Check,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  User,
  Calendar,
  Link,
  FileText,
  Hash,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data structure based on the raw_pages table
interface RawPage {
  id: string;
  url: string;
  title: string | null;
  meta_description: string | null;
  status_code: number | null;
  crawled_at: string | null;
  session_id: string;
  client_name: string | null;
  content_hash: string | null;
  link_hash: string | null;
  h1_tags: any | null;
  links: any | null;
  robots_content: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Added for filtering
  excluded: boolean;
  filtered_reason?: string;
}

interface RawPagesTableProps {
  pages: RawPage[];
  onPagesUpdate: (pages: RawPage[]) => void;
  selectedCrawlSession?: string;
  loading?: boolean;
}

export function RawPagesTable({ pages, onPagesUpdate, selectedCrawlSession, loading = false }: RawPagesTableProps) {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | 'included' | 'excluded'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'url' | 'title' | 'status_code' | 'crawled_at'>('crawled_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 50;
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = React.useState(2000);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, scrollLeft: 0 });

  // Filter and sort pages
  const filteredPages = useMemo(() => {
    let filtered = pages;

    if (statusFilter === 'included') {
      filtered = filtered.filter(page => !page.excluded);
    } else if (statusFilter === 'excluded') {
      filtered = filtered.filter(page => page.excluded);
    }
    // 'all' shows everything, no filtering needed

    // Sort pages
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'crawled_at' || sortBy === 'created_at') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue?.toLowerCase() || '';
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    return filtered;
  }, [pages, statusFilter, sortBy, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredPages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPages = filteredPages.slice(startIndex, startIndex + itemsPerPage);

  const excludedCount = pages.filter(p => p.excluded).length;
  const includedCount = pages.length - excludedCount;

  const togglePageSelection = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const selectAllVisible = () => {
    const visibleIds = paginatedPages.map(p => p.id);
    setSelectedPages(new Set(visibleIds));
  };

  const clearSelection = () => {
    setSelectedPages(new Set());
  };

  const bulkInclude = () => {
    const updatedPages = pages.map(page =>
      selectedPages.has(page.id) ? { ...page, excluded: false } : page
    );
    onPagesUpdate(updatedPages);
    clearSelection();
  };

  const bulkExclude = (reason?: string) => {
    const updatedPages = pages.map(page =>
      selectedPages.has(page.id)
        ? { ...page, excluded: true, filtered_reason: reason || 'Manual exclusion' }
        : page
    );
    onPagesUpdate(updatedPages);
    clearSelection();
  };

  const togglePageInclusion = (pageId: string) => {
    const updatedPages = pages.map(page =>
      page.id === pageId
        ? { ...page, excluded: !page.excluded }
        : page
    );
    onPagesUpdate(updatedPages);
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (statusCode: number | null) => {
    if (!statusCode) return 'text-gray-400';
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600';
    if (statusCode >= 300 && statusCode < 400) return 'text-yellow-600';
    if (statusCode >= 400) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusIcon = (statusCode: number | null) => {
    if (!statusCode) return <AlertCircle className="w-4 h-4" />;
    if (statusCode >= 200 && statusCode < 300) return <CheckCircle className="w-4 h-4" />;
    if (statusCode >= 400) return <XCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const handleTopScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  // Update scroll width when table renders
  React.useEffect(() => {
    if (tableScrollRef.current) {
      const updateScrollWidth = () => {
        if (tableScrollRef.current) {
          setTableScrollWidth(tableScrollRef.current.scrollWidth);
        }
      };

      updateScrollWidth();

      // Update on resize
      const resizeObserver = new ResizeObserver(updateScrollWidth);
      resizeObserver.observe(tableScrollRef.current);

      return () => resizeObserver.disconnect();
    }
  }, [paginatedPages.length]);

  // Drag to scroll functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!tableScrollRef.current) return;

    setIsDragging(true);
    setDragStart({
      x: e.pageX,
      scrollLeft: tableScrollRef.current.scrollLeft
    });

    // Add grabbing cursor
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !tableScrollRef.current) return;

    e.preventDefault();
    const x = e.pageX;
    const walk = (x - dragStart.x) * 1.5; // Adjust scroll speed
    const newScrollLeft = dragStart.scrollLeft - walk;

    tableScrollRef.current.scrollLeft = newScrollLeft;

    // Sync with top scroller
    if (topScrollRef.current) {
      topScrollRef.current.scrollLeft = newScrollLeft;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
  };

  // Add global mouse up listener
  React.useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="bg-white rounded-2xl shadow-[0_0_40px_rgb(0,0,0,0.08)] border border-blue-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Raw Pages</h2>
              <p className="text-gray-600 mt-1">
                Review and filter crawled pages before client assignment
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={cn(
                  "border-gray-200",
                  statusFilter === 'all'
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                {pages.length} All
              </Button>

              <Button
                variant={statusFilter === 'included' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('included')}
                className={cn(
                  "border-green-200",
                  statusFilter === 'included'
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                )}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {includedCount} Included
              </Button>

              <Button
                variant={statusFilter === 'excluded' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('excluded')}
                className={cn(
                  "border-red-200",
                  statusFilter === 'excluded'
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-red-50 text-red-700 hover:bg-red-100"
                )}
              >
                <XCircle className="w-3 h-3 mr-1" />
                {excludedCount} Excluded
              </Button>
            </div>
          </div>

        </div>

        {/* Top Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPages.length)} of {filteredPages.length} pages
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium whitespace-nowrap">
                    Page {currentPage} of {totalPages}
                  </span>
                  <input
                    type="range"
                    min="1"
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((currentPage - 1) / (totalPages - 1)) * 100}%, #e5e7eb ${((currentPage - 1) / (totalPages - 1)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Top Horizontal Scroll */}
        <div
          ref={topScrollRef}
          className="overflow-x-auto border-t border-gray-100 bg-gray-50"
          onScroll={handleTopScroll}
          style={{ height: '20px' }}
        >
          <div style={{ width: `${tableScrollWidth}px`, height: '1px' }}></div>
        </div>

        {/* Table */}
        <div
          ref={tableScrollRef}
          className={`overflow-x-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onScroll={handleTableScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ userSelect: isDragging ? 'none' : 'auto' }}
        >
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginatedPages.length > 0 && selectedPages.size === paginatedPages.length}
                    onChange={selectedPages.size === paginatedPages.length ? clearSelection : selectAllVisible}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('status_code')}
                >
                  Code
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('url')}
                >
                  URL
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('title')}
                >
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meta Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('crawled_at')}
                >
                  Crawled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPages.map((page) => (
                <tr
                  key={page.id}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    page.excluded && "opacity-50 bg-gray-25"
                  )}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPages.has(page.id)}
                      onChange={() => togglePageSelection(page.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={cn("flex items-center text-sm font-medium", getStatusColor(page.status_code))}>
                      {getStatusIcon(page.status_code)}
                      <span className="ml-1">{page.status_code || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs"
                        title={page.url}
                      >
                        {page.url}
                      </a>
                      <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-xs" title={page.title || ''}>
                      {page.title || <span className="text-gray-400 italic">No title</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 truncate max-w-xs" title={page.meta_description || ''}>
                      {page.meta_description || <span className="text-gray-400 italic">No description</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {!page.excluded ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">Included</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">Excluded</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(page.crawled_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePageInclusion(page.id)}
                        className={cn(
                          "h-8 w-8 p-0",
                          !page.excluded
                            ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                            : "text-green-600 hover:text-green-700 hover:bg-green-50"
                        )}
                        title={!page.excluded ? "Exclude page" : "Include page"}
                      >
                        {!page.excluded ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Page Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(page.url)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => window.open(page.url, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open in New Tab
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => {
                              // Show page details modal or expand inline
                              console.log('Show details for:', page.id);
                            }}
                          >
                            <Info className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          {page.filtered_reason && (
                            <DropdownMenuItem disabled>
                              <AlertCircle className="w-4 h-4 mr-2" />
                              {page.filtered_reason}
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => togglePageInclusion(page.id)}
                            className={!page.excluded ? "text-red-600" : "text-green-600"}
                          >
                            {!page.excluded ? (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Exclude Page
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Include Page
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPages.length)} of {filteredPages.length} pages
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredPages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {statusFilter === 'all' ? 'No pages found' :
               statusFilter === 'included' ? 'No included pages' : 'No excluded pages'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {statusFilter === 'all'
                ? 'No pages match the current filter criteria. Try adjusting your filters or start a new crawl.'
                : statusFilter === 'included'
                ? 'No pages are currently included. Use the filter controls to include relevant pages.'
                : 'No pages are currently excluded. All pages are included in this session.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}