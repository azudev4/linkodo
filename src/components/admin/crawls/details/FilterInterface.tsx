'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Save,
  RotateCcw,
  Search,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FilterState {
  statusCodes: string[];
  contentTypes: string[];
  urlIncludes: string;
  urlExcludes: string;
  hasMetaDescription: 'all' | 'yes' | 'no';
  hasTitleTag: 'all' | 'yes' | 'no';
  minContentLength: string;
  maxContentLength: string;
  minLinksCount: string;
  maxLinksCount: string;
  pageDepth: string;
  customRegex: string;
}

interface FilterTemplate {
  id: string;
  name: string;
  description: string;
  filters: Partial<FilterState>;
}

const defaultFilters: FilterState = {
  statusCodes: ['200'],
  contentTypes: ['text/html'],
  urlIncludes: '',
  urlExcludes: '',
  hasMetaDescription: 'all',
  hasTitleTag: 'all',
  minContentLength: '',
  maxContentLength: '',
  minLinksCount: '',
  maxLinksCount: '',
  pageDepth: '',
  customRegex: ''
};

const filterTemplates: FilterTemplate[] = [
  {
    id: 'blog-content',
    name: 'Blog Content',
    description: 'High-quality blog posts and articles',
    filters: {
      statusCodes: ['200'],
      urlIncludes: '/blog/',
      hasMetaDescription: 'yes',
      hasTitleTag: 'yes',
      minContentLength: '500'
    }
  },
  {
    id: 'product-pages',
    name: 'Product Pages',
    description: 'E-commerce product pages',
    filters: {
      statusCodes: ['200'],
      urlIncludes: '/product',
      hasMetaDescription: 'yes',
      minLinksCount: '3'
    }
  },
  {
    id: 'landing-pages',
    name: 'Landing Pages',
    description: 'High-value landing pages',
    filters: {
      statusCodes: ['200'],
      hasMetaDescription: 'yes',
      hasTitleTag: 'yes',
      minContentLength: '300',
      pageDepth: '1'
    }
  }
];

interface FilterInterfaceProps {
  onFiltersChange: (filters: FilterState) => void;
  filteredCount: number;
  totalCount: number;
}

export function FilterInterface({ onFiltersChange, filteredCount, totalCount }: FilterInterfaceProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
    updateAppliedFilters(updated);
  };

  const updateAppliedFilters = (currentFilters: FilterState) => {
    const applied: string[] = [];

    if (currentFilters.statusCodes.length > 0 && !currentFilters.statusCodes.includes('all')) {
      applied.push(`Status: ${currentFilters.statusCodes.join(', ')}`);
    }
    if (currentFilters.contentTypes.length > 0 && !currentFilters.contentTypes.includes('all')) {
      applied.push(`Content: ${currentFilters.contentTypes.join(', ')}`);
    }
    if (currentFilters.urlIncludes) {
      applied.push(`URL includes: "${currentFilters.urlIncludes}"`);
    }
    if (currentFilters.urlExcludes) {
      applied.push(`URL excludes: "${currentFilters.urlExcludes}"`);
    }
    if (currentFilters.hasMetaDescription !== 'all') {
      applied.push(`Meta description: ${currentFilters.hasMetaDescription}`);
    }
    if (currentFilters.hasTitleTag !== 'all') {
      applied.push(`Title tag: ${currentFilters.hasTitleTag}`);
    }
    if (currentFilters.minContentLength) {
      applied.push(`Min content: ${currentFilters.minContentLength} chars`);
    }
    if (currentFilters.maxContentLength) {
      applied.push(`Max content: ${currentFilters.maxContentLength} chars`);
    }
    if (currentFilters.pageDepth) {
      applied.push(`Max depth: ${currentFilters.pageDepth}`);
    }
    if (currentFilters.customRegex) {
      applied.push(`Custom regex: ${currentFilters.customRegex}`);
    }

    setAppliedFilters(applied);
  };

  const applyTemplate = (template: FilterTemplate) => {
    const newFilters = { ...defaultFilters, ...template.filters };
    setFilters(newFilters);
    onFiltersChange(newFilters);
    updateAppliedFilters(newFilters);
    setShowTemplates(false);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
    setAppliedFilters([]);
  };

  const removeFilter = (filterToRemove: string) => {
    // Logic to remove specific filter based on the filter text
    // This would need more sophisticated parsing in a real implementation
    resetFilters();
  };

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_0_40px_rgb(0,0,0,0.08)] border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Page Filtering</h2>
              <p className="text-sm text-gray-500">
                Filter raw pages before client assignment
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">{filteredCount}</span> of{' '}
              <span className="font-medium">{totalCount}</span> pages
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="border-blue-200 hover:bg-blue-50 text-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Templates
            </Button>
          </div>
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Code
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between border-gray-200 hover:bg-gray-50"
                >
                  {filters.statusCodes[0] === '200' && '200 Only'}
                  {filters.statusCodes[0] === 'all' && 'All Codes'}
                  {filters.statusCodes[0] === '2xx' && '2xx Success'}
                  {filters.statusCodes[0] === '3xx' && '3xx Redirects'}
                  {filters.statusCodes[0] === '4xx' && '4xx Errors'}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuItem onClick={() => updateFilters({ statusCodes: ['200'] })}>
                  200 Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilters({ statusCodes: ['all'] })}>
                  All Codes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilters({ statusCodes: ['2xx'] })}>
                  2xx Success
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilters({ statusCodes: ['3xx'] })}>
                  3xx Redirects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilters({ statusCodes: ['4xx'] })}>
                  4xx Errors
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between border-gray-200 hover:bg-gray-50"
                >
                  {filters.contentTypes[0] === 'text/html' && 'HTML Only'}
                  {filters.contentTypes[0] === 'all' && 'All Types'}
                  {filters.contentTypes[0] === 'application/pdf' && 'PDFs'}
                  {filters.contentTypes[0] === 'image' && 'Images'}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuItem onClick={() => updateFilters({ contentTypes: ['text/html'] })}>
                  HTML Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilters({ contentTypes: ['all'] })}>
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilters({ contentTypes: ['application/pdf'] })}>
                  PDFs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateFilters({ contentTypes: ['image'] })}>
                  Images
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Contains
            </label>
            <input
              type="text"
              placeholder="e.g., /blog/, /products/"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.urlIncludes}
              onChange={(e) => updateFilters({ urlIncludes: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Excludes
            </label>
            <input
              type="text"
              placeholder="e.g., /admin/, /api/"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.urlExcludes}
              onChange={(e) => updateFilters({ urlExcludes: e.target.value })}
            />
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-gray-600 hover:text-gray-900"
          >
            Advanced Filters
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-gray-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Has Meta Description
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-gray-200 hover:bg-gray-50"
                        >
                          {filters.hasMetaDescription === 'all' && 'All Pages'}
                          {filters.hasMetaDescription === 'yes' && 'Yes'}
                          {filters.hasMetaDescription === 'no' && 'No'}
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        <DropdownMenuItem onClick={() => updateFilters({ hasMetaDescription: 'all' })}>
                          All Pages
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateFilters({ hasMetaDescription: 'yes' })}>
                          Yes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateFilters({ hasMetaDescription: 'no' })}>
                          No
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Has Title Tag
                    </label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-gray-200 hover:bg-gray-50"
                        >
                          {filters.hasTitleTag === 'all' && 'All Pages'}
                          {filters.hasTitleTag === 'yes' && 'Yes'}
                          {filters.hasTitleTag === 'no' && 'No'}
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        <DropdownMenuItem onClick={() => updateFilters({ hasTitleTag: 'all' })}>
                          All Pages
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateFilters({ hasTitleTag: 'yes' })}>
                          Yes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateFilters({ hasTitleTag: 'no' })}>
                          No
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Depth
                    </label>
                    <input
                      type="number"
                      placeholder="Max depth (1-10)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filters.pageDepth}
                      onChange={(e) => updateFilters({ pageDepth: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Content Length
                    </label>
                    <input
                      type="number"
                      placeholder="Characters"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filters.minContentLength}
                      onChange={(e) => updateFilters({ minContentLength: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Content Length
                    </label>
                    <input
                      type="number"
                      placeholder="Characters"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filters.maxContentLength}
                      onChange={(e) => updateFilters({ maxContentLength: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Links Count
                    </label>
                    <input
                      type="number"
                      placeholder="Number of links"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filters.minLinksCount}
                      onChange={(e) => updateFilters({ minLinksCount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Regex Pattern
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ^\/products\/[^\/]+\/?$"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.customRegex}
                    onChange={(e) => updateFilters({ customRegex: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Advanced pattern matching for URL structure
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Templates */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-[0_0_40px_rgb(0,0,0,0.08)] border border-blue-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filterTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applied Filters */}
      {appliedFilters.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-blue-900">Applied Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-blue-700 hover:text-blue-900"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {appliedFilters.map((filter, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {filter}
                <button
                  onClick={() => removeFilter(filter)}
                  className="ml-2 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}