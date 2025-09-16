/**
 * Filter preset configurations for quick filter suggestions
 *
 * This file contains predefined filter configurations that users can quickly
 * apply as starting points. These presets cover common filtering scenarios
 * like excluding admin pages, error pages, or content with SEO issues.
 */

import {
  AlertTriangle,
  FileX,
  Type,
  Hash
} from 'lucide-react';
import { FilterPreset } from './types';

/**
 * Predefined filter presets for common filtering scenarios
 * These appear in the sidebar as quick suggestions
 */
export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'admin-pages',
    name: 'Admin Pages',
    description: 'Exclude /admin/, /wp-admin/, /dashboard/',
    icon: AlertTriangle,
    color: 'red',
    criteria: [
      {
        field: 'url',
        operator: 'contains',
        value: '/admin/',
        label: 'URL contains "/admin/"'
      }
    ]
  },
  {
    id: 'error-pages',
    name: 'Error Pages',
    description: 'Exclude 404s and server errors',
    icon: FileX,
    color: 'orange',
    criteria: [
      {
        field: 'status_code',
        operator: 'is_one_of',
        value: '404,500,502,503',
        label: 'Status is one of 404, 500, 502, 503'
      }
    ]
  },
  {
    id: 'short-content',
    name: 'Short Content',
    description: 'Exclude pages < 100 characters',
    icon: Type,
    color: 'yellow',
    criteria: [
      {
        field: 'content_length',
        operator: 'less_than',
        value: '100',
        label: 'Content length is less than 100'
      }
    ]
  },
  {
    id: 'missing-seo',
    name: 'Missing SEO',
    description: 'No title or meta description',
    icon: Hash,
    color: 'purple',
    criteria: [
      {
        field: 'title',
        operator: 'is_empty',
        value: '',
        label: 'Title is empty'
      }
    ]
  }
];

/**
 * Get a specific preset by ID
 */
export function getFilterPreset(presetId: string): FilterPreset | undefined {
  return FILTER_PRESETS.find(preset => preset.id === presetId);
}

/**
 * Get all available filter presets
 */
export function getAllFilterPresets(): FilterPreset[] {
  return FILTER_PRESETS;
}