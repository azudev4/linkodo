/**
 * FilterBlockCard - Individual filter block display component
 *
 * This component represents a single active filter block, showing:
 * - The filter name and description
 * - Number of pages it would exclude
 * - Remove button to delete the filter
 * - Visual styling based on filter type/color
 * - Selection state for viewing details
 */

'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FilterBlockCardProps } from './types';

export function FilterBlockCard({
  block,
  onRemove,
  onView,
  isSelected
}: FilterBlockCardProps) {

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(block.id);
  };

  const handleCardClick = () => {
    onView(block.id);
  };

  return (
    <div
      className={cn(
        "bg-white border rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-sm",
        isSelected
          ? "border-blue-300 shadow-sm ring-1 ring-blue-100"
          : "border-gray-200 hover:border-gray-300",
        // Left border color based on filter type
        block.color === 'red' && 'border-l-4 border-l-red-400',
        block.color === 'orange' && 'border-l-4 border-l-orange-400',
        block.color === 'yellow' && 'border-l-4 border-l-yellow-400',
        block.color === 'purple' && 'border-l-4 border-l-purple-400',
        block.color === 'blue' && 'border-l-4 border-l-blue-400'
      )}
      onClick={handleCardClick}
    >
      {/* Header with name, description, and remove button */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 mb-1 truncate">
            {block.name}
          </h4>
          <p className="text-sm text-gray-600 line-clamp-2">
            {block.description}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveClick}
          className="text-gray-400 hover:text-red-500 p-1 h-auto ml-2 flex-shrink-0"
          title="Remove this filter block"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Footer with exclusion count */}
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        {block.matchCount} new exclusion{block.matchCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}