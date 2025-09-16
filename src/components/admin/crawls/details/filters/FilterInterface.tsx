/**
 * FilterInterface - Main orchestrator component for page filtering
 *
 * This component coordinates all filter-related functionality including:
 * - Filter builder form for creating custom filters
 * - Preset sidebar for quick filter suggestions
 * - Active filter blocks display and management
 * - Real-time highlighting integration with the table
 * - State management for all filtering operations
 */

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Filter } from 'lucide-react';

// Import all component types and utilities
import {
  FilterInterfaceProps,
  FilterBuilder,
  FilterBlock,
  FilterCriterion
} from './types';
import { FilterBuilderForm } from './FilterBuilderForm';
import { FilterPresetSidebar } from './FilterPresetSidebar';
import { ActiveFilterBlocksDisplay } from './ActiveFilterBlocksDisplay';
import {
  calculateFilterPreviewMatches,
  calculateFilterBlockMatches
} from './filterCalculationLogic';
import {
  getFilterPreset
} from './filterPresetConfiguration';
import {
  getFieldDetails,
  getOperatorLabel
} from './filterFieldConfiguration';

export function FilterInterface({
  onExclusionChange,
  onHighlightChange,
  totalCount,
  pages,
  isExcluding = false
}: FilterInterfaceProps) {

  // Main state management
  const [filterBlocks, setFilterBlocks] = useState<FilterBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [filterBuilder, setFilterBuilder] = useState<FilterBuilder>({
    name: '',
    field: '',
    operator: '',
    value: ''
  });

  // Calculate current matches for real-time preview (memoized for performance)
  const currentMatches = useMemo(() => {
    return calculateFilterPreviewMatches(pages, filterBuilder);
  }, [pages, filterBuilder]);

  // Calculate only NEW exclusions (pages that aren't already excluded)
  const newExclusions = useMemo(() => {
    return currentMatches.filter(page => !page.excluded);
  }, [currentMatches]);

  // Update table highlighting whenever current matches change
  useEffect(() => {
    const matchedIds = currentMatches.map(page => page.id);
    onHighlightChange(matchedIds);
  }, [currentMatches, onHighlightChange]);

  // Handle filter builder changes
  const handleFilterBuilderChange = useCallback((newBuilder: FilterBuilder) => {
    setFilterBuilder(newBuilder);
  }, []);

  // Clear the filter builder form
  const handleClearFilter = useCallback(() => {
    setFilterBuilder({
      name: '',
      field: '',
      operator: '',
      value: ''
    });
    onHighlightChange([]);
  }, [onHighlightChange]);

  // Create a new filter block from the current builder
  const handleCreateBlock = useCallback(() => {
    if (!filterBuilder.name || !filterBuilder.field || !filterBuilder.operator || newExclusions.length === 0) {
      return;
    }

    const fieldDetails = getFieldDetails(filterBuilder.field);
    const operatorLabel = getOperatorLabel(filterBuilder.field, filterBuilder.operator);

    const newBlock: FilterBlock = {
      id: `custom-${Date.now()}`,
      name: filterBuilder.name,
      description: `${fieldDetails?.label} ${operatorLabel} ${filterBuilder.value}`,
      criteria: [{
        id: `${filterBuilder.field}-1`,
        field: filterBuilder.field as FilterCriterion['field'],
        operator: filterBuilder.operator as FilterCriterion['operator'],
        value: filterBuilder.value,
        label: `${fieldDetails?.label} ${operatorLabel} ${filterBuilder.value}`
      }],
      matchCount: newExclusions.length, // Only count NEW exclusions
      color: 'red'
    };

    const updatedBlocks = [...filterBlocks, newBlock];
    setFilterBlocks(updatedBlocks);
    updateExclusions(updatedBlocks, true); // Mark as new block

    // Reset builder and clear highlighting
    handleClearFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBuilder, newExclusions, filterBlocks, handleClearFilter]);

  // Add a preset filter block
  const handleAddPreset = useCallback((presetId: string) => {
    const preset = getFilterPreset(presetId);
    if (!preset) return;

    const newBlock: FilterBlock = {
      id: `${presetId}-${Date.now()}`,
      name: preset.name,
      description: preset.description,
      criteria: preset.criteria.map((c, i) => ({
        id: `${c.field}-${i}`,
        field: c.field as FilterCriterion['field'],
        operator: c.operator as FilterCriterion['operator'],
        value: c.value,
        label: c.label
      })),
      matchCount: 0,
      color: preset.color
    };

    // Calculate matches for the preset - only count NEW exclusions
    const matches = calculateFilterBlockMatches(pages, newBlock.criteria);
    const newExclusionsForPreset = matches.filter(page => !page.excluded);
    newBlock.matchCount = newExclusionsForPreset.length;

    const updatedBlocks = [...filterBlocks, newBlock];
    setFilterBlocks(updatedBlocks);
    updateExclusions(updatedBlocks, true); // Mark as new block
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, filterBlocks]);

  // Remove a filter block
  const handleRemoveBlock = useCallback((blockId: string) => {
    const updatedBlocks = filterBlocks.filter(block => block.id !== blockId);
    setFilterBlocks(updatedBlocks);
    // Note: We don't auto-remove exclusions when removing blocks
    // Users can manually re-include pages if needed

    // Clear selection if the removed block was selected
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBlocks, selectedBlockId]);

  // Select a filter block for viewing details
  const handleSelectBlock = useCallback((blockId: string) => {
    setSelectedBlockId(blockId);
  }, []);

  // Update exclusions based on all active filter blocks
  // Now only sends NEW exclusions, not all exclusions
  const updateExclusions = useCallback((blocks: FilterBlock[], isNewBlock = false) => {
    if (!pages || pages.length === 0) {
      return;
    }

    if (isNewBlock && blocks.length > 0) {
      // For new blocks, only send the pages matched by the last (newest) block
      const newBlock = blocks[blocks.length - 1];
      const newBlockMatches = calculateFilterBlockMatches(pages, newBlock.criteria);
      const newExclusionIds = newBlockMatches
        .filter(page => !page.excluded) // Only non-excluded pages
        .map(page => page.id);

      if (newExclusionIds.length > 0) {
        onExclusionChange(newExclusionIds);
      }
    }
    // When removing blocks, we don't automatically re-include pages
    // The user would need to manually remove exclusions if they want
  }, [pages, onExclusionChange]);

  // Calculate totals for display
  const totalExcluded = filterBlocks.reduce((sum, block) => sum + block.matchCount, 0);
  const remaining = totalCount - totalExcluded;

  return (
    <div className="space-y-6">
      {/* Main Filter Interface */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_0_40px_rgb(0,0,0,0.08)] border border-blue-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Page Filtering</h2>
              <p className="text-sm text-gray-500">
                Create exclusion filters to remove unwanted pages
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <span className="font-medium text-red-600">{totalExcluded}</span> excluded
            <span className="mx-2 text-gray-400">•</span>
            <span className="font-medium text-green-600">{remaining}</span> remaining
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Builder Form */}
          <FilterBuilderForm
            filterBuilder={filterBuilder}
            onFilterBuilderChange={handleFilterBuilderChange}
            currentMatches={currentMatches}
            newExclusions={newExclusions}
            onCreateBlock={handleCreateBlock}
            onClearFilter={handleClearFilter}
            isExcluding={isExcluding}
          />

          {/* Preset Suggestions Sidebar */}
          <FilterPresetSidebar
            onAddPreset={handleAddPreset}
          />
        </div>
      </div>

      {/* Active Filter Blocks */}
      <ActiveFilterBlocksDisplay
        filterBlocks={filterBlocks}
        onRemoveBlock={handleRemoveBlock}
        selectedBlockId={selectedBlockId}
        onSelectBlock={handleSelectBlock}
      />
    </div>
  );
}