/**
 * Raw Pages Store - Zustand store for managing raw pages state
 *
 * This store handles all raw pages data and operations including:
 * - Fetching pages from API
 * - Managing exclusion/inclusion state
 * - Bulk updates and optimistic UI updates
 * - Filter-based exclusions
 * - Single source of truth for all raw pages data
 */

import { create } from 'zustand';
import { RawPage } from '@/components/admin/crawls/details/filters/types';

interface RawPagesState {
  // Core data
  pages: RawPage[];
  filteredPages: RawPage[];
  loading: boolean;
  error: string | null;
  sessionId: string | null;

  // UI state
  highlightedPageIds: string[];
  selectedPages: Set<string>;
  isExcluding: boolean; // Loading state for exclusion operations

  // Actions
  setSessionId: (sessionId: string) => void;
  fetchPages: () => Promise<void>;
  setHighlightedPages: (pageIds: string[]) => void;
  addExclusions: (pageIds: string[]) => Promise<void>;
  removeExclusions: (pageIds: string[]) => Promise<void>;
  togglePageSelection: (pageId: string) => void;
  clearSelection: () => void;
  updatePageExclusion: (pageId: string, excluded: boolean) => Promise<void>;
  resetStore: () => void;
}

export const useRawPagesStore = create<RawPagesState>((set, get) => ({
  // Initial state
  pages: [],
  filteredPages: [],
  loading: false,
  error: null,
  sessionId: null,
  highlightedPageIds: [],
  selectedPages: new Set(),
  isExcluding: false,

  // Set the current session ID
  setSessionId: (sessionId: string) => {
    set({ sessionId });
  },

  // Fetch pages from API
  fetchPages: async () => {
    const { sessionId } = get();
    if (!sessionId) {
      set({ error: 'No session ID provided' });
      return;
    }

    set({ loading: true, error: null });

    try {
      console.log('Fetching raw pages for session:', sessionId);
      const response = await fetch(`/api/admin/raw-pages?session_id=${sessionId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch raw pages: ${errorData.error || response.statusText}`);
      }

      const pages = await response.json();
      console.log('Successfully fetched raw pages:', pages.length);

      set({
        pages,
        filteredPages: pages.filter((page: RawPage) => !page.excluded),
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching raw pages:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch pages',
        loading: false
      });
    }
  },

  // Set highlighted pages for UI preview
  setHighlightedPages: (pageIds: string[]) => {
    set({ highlightedPageIds: pageIds });
  },

  // Add new exclusions (from filters)
  addExclusions: async (pageIds: string[]) => {
    const { pages } = get();

    // Only exclude pages that aren't already excluded
    const pagesToExclude = pages
      .filter(page => pageIds.includes(page.id) && !page.excluded)
      .map(page => ({ id: page.id, excluded: true }));

    if (pagesToExclude.length === 0) {
      console.log('No new pages to exclude');
      return;
    }

    // Set loading state
    set({ isExcluding: true });

    // Optimistic update
    const optimisticPages = pages.map(page => ({
      ...page,
      excluded: pageIds.includes(page.id) ? true : page.excluded
    }));

    set({
      pages: optimisticPages,
      filteredPages: optimisticPages.filter(page => !page.excluded)
    });

    try {
      console.log(`Adding ${pagesToExclude.length} new exclusions`);

      const response = await fetch('/api/admin/raw-pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageUpdates: pagesToExclude }),
      });

      if (!response.ok) {
        throw new Error('Failed to update page exclusions');
      }

      const result = await response.json();
      console.log('Exclusions added successfully:', result.message);
    } catch (error) {
      console.error('Error adding exclusions:', error);

      // Revert optimistic update on error
      set({
        pages,
        filteredPages: pages.filter(page => !page.excluded),
        error: error instanceof Error ? error.message : 'Failed to add exclusions'
      });
    } finally {
      // Clear loading state
      set({ isExcluding: false });
    }
  },

  // Remove exclusions (re-include pages)
  removeExclusions: async (pageIds: string[]) => {
    const { pages } = get();

    // Only include pages that are currently excluded
    const pagesToInclude = pages
      .filter(page => pageIds.includes(page.id) && page.excluded)
      .map(page => ({ id: page.id, excluded: false }));

    if (pagesToInclude.length === 0) {
      console.log('No pages to re-include');
      return;
    }

    // Optimistic update
    const optimisticPages = pages.map(page => ({
      ...page,
      excluded: pageIds.includes(page.id) ? false : page.excluded
    }));

    set({
      pages: optimisticPages,
      filteredPages: optimisticPages.filter(page => !page.excluded)
    });

    try {
      console.log(`Re-including ${pagesToInclude.length} pages`);

      const response = await fetch('/api/admin/raw-pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageUpdates: pagesToInclude }),
      });

      if (!response.ok) {
        throw new Error('Failed to update page inclusions');
      }

      const result = await response.json();
      console.log('Inclusions updated successfully:', result.message);
    } catch (error) {
      console.error('Error removing exclusions:', error);

      // Revert optimistic update on error
      set({
        pages,
        filteredPages: pages.filter(page => !page.excluded),
        error: error instanceof Error ? error.message : 'Failed to remove exclusions'
      });
    }
  },

  // Toggle individual page selection
  togglePageSelection: (pageId: string) => {
    const { selectedPages } = get();
    const newSelection = new Set(selectedPages);

    if (newSelection.has(pageId)) {
      newSelection.delete(pageId);
    } else {
      newSelection.add(pageId);
    }

    set({ selectedPages: newSelection });
  },

  // Clear all selected pages
  clearSelection: () => {
    set({ selectedPages: new Set() });
  },

  // Update individual page exclusion status
  updatePageExclusion: async (pageId: string, excluded: boolean) => {
    const { pages } = get();

    // Optimistic update
    const optimisticPages = pages.map(page =>
      page.id === pageId ? { ...page, excluded } : page
    );

    set({
      pages: optimisticPages,
      filteredPages: optimisticPages.filter(page => !page.excluded)
    });

    try {
      console.log(`Updating page ${pageId} exclusion:`, excluded);

      const response = await fetch(`/api/admin/raw-pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excluded }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update page ${pageId}`);
      }

      const result = await response.json();
      console.log('Page updated successfully:', result.data);
    } catch (error) {
      console.error('Error updating page:', error);

      // Revert optimistic update on error
      set({
        pages,
        filteredPages: pages.filter(page => !page.excluded),
        error: error instanceof Error ? error.message : 'Failed to update page'
      });
    }
  },

  // Reset store to initial state
  resetStore: () => {
    set({
      pages: [],
      filteredPages: [],
      loading: false,
      error: null,
      sessionId: null,
      highlightedPageIds: [],
      selectedPages: new Set(),
      isExcluding: false
    });
  }
}));