/**
 * FilterPresetSidebar - Quick filter preset suggestions component
 *
 * This component displays a sidebar with predefined filter presets that users
 * can quickly apply. These presets cover common filtering scenarios like
 * excluding admin pages, error pages, or short content.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { FilterPresetSidebarProps } from './types';
import { FILTER_PRESETS } from './filterPresetConfiguration';

export function FilterPresetSidebar({ onAddPreset }: FilterPresetSidebarProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Quick Suggestions</h3>

      <div className="space-y-2">
        {FILTER_PRESETS.map((preset) => {
          const IconComponent = preset.icon as React.ComponentType<{ className?: string }>;

          return (
            <button
              key={preset.id}
              onClick={() => onAddPreset(preset.id)}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex items-center mb-2">
                <div className={cn(
                  "p-1 rounded mr-2",
                  preset.color === 'red' && 'bg-red-100 text-red-600',
                  preset.color === 'orange' && 'bg-orange-100 text-orange-600',
                  preset.color === 'yellow' && 'bg-yellow-100 text-yellow-600',
                  preset.color === 'purple' && 'bg-purple-100 text-purple-600'
                )}>
                  <IconComponent className="w-3 h-3" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                  {preset.name}
                </h4>
              </div>
              <p className="text-xs text-gray-600">{preset.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}