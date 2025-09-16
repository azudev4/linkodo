/**
 * ActiveFilterBlocksDisplay - Display and management of active filter blocks
 *
 * This component shows all currently active filter blocks in a grid layout.
 * It manages the display state and handles user interactions with filter blocks
 * like viewing details and removing blocks.
 */

'use client';

import React from 'react';
import { ActiveFilterBlocksDisplayProps } from './types';
import { FilterBlockCard } from './FilterBlockCard';

export function ActiveFilterBlocksDisplay({
  filterBlocks,
  onRemoveBlock,
  selectedBlockId,
  onSelectBlock
}: ActiveFilterBlocksDisplayProps) {

  if (filterBlocks.length === 0) {
    return null;
  }

  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-[0_0_40px_rgb(0,0,0,0.08)] border border-blue-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Active Filter Blocks
        </h3>
        <div className="text-sm text-gray-500">
          {filterBlocks.length} filter{filterBlocks.length !== 1 ? 's' : ''} active
        </div>
      </div>

      {/* Filter Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filterBlocks.map((block) => (
          <FilterBlockCard
            key={block.id}
            block={block}
            onRemove={onRemoveBlock}
            onView={onSelectBlock}
            isSelected={selectedBlockId === block.id}
          />
        ))}
      </div>
    </div>
  );
}