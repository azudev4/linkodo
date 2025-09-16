/**
 * TypeScript type definitions for the filter system
 *
 * This file contains all interfaces and types used across the filter components.
 * Centralizing types here ensures consistency and makes it easier to maintain
 * the filter system's type safety.
 */

// Raw page data structure from the database
export interface RawPage {
  id: string;
  url: string;
  title?: string;
  meta_description?: string;
  content?: string;
  status_code?: number;
  excluded: boolean;
  filtered_reason?: string;
  crawled_at?: string;
}

// Individual filter criterion that defines a single filtering rule
export interface FilterCriterion {
  id: string;
  field: 'url' | 'title' | 'meta_description' | 'content_length' | 'status_code';
  operator: 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty' | 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'is_one_of';
  value: string;
  label: string; // Human-readable description like "URL contains /admin/"
}

// A filter block containing one or more criteria that work together
export interface FilterBlock {
  id: string;
  name: string; // User-defined name like "Admin Pages"
  description: string; // Human-readable description of what this block filters
  criteria: FilterCriterion[];
  matchCount: number; // Number of pages this block would exclude
  color: string; // Visual indicator color (red, orange, yellow, purple, blue)
}

// Current filter being built in the form (before creating a block)
export interface FilterBuilder {
  name: string; // User-defined name for the filter
  field: string; // Selected field (url, title, etc.)
  operator: string; // Selected operator (contains, equals, etc.)
  value: string; // User-entered value to filter by
}

// Operator option for dropdown menus
export interface OperatorOption {
  value: string; // Internal value like 'contains'
  label: string; // Display label like 'contains'
}

// Field configuration for dropdown and logic
export interface FieldOption {
  value: string; // Internal field name like 'url'
  label: string; // Display label like 'URL'
  operators: OperatorOption[]; // Available operators for this field
  placeholder: string; // Placeholder text for value input
  description: string; // Help text explaining what this field filters
}

// Preset filter configuration for quick suggestions
export interface FilterPreset {
  id: string; // Unique identifier
  name: string; // Display name like "Admin Pages"
  description: string; // Description of what this preset filters
  icon: unknown; // Lucide icon component
  color: string; // Visual color indicator
  criteria: Array<{
    field: string;
    operator: string;
    value: string;
    label: string;
  }>;
}

// Props for the main FilterInterface component
export interface FilterInterfaceProps {
  onExclusionChange: (excludedPages: RawPage[]) => void;
  onHighlightChange: (highlightedPageIds: string[]) => void;
  totalCount: number;
  pages: RawPage[];
}

// Props for FilterBuilderForm component
export interface FilterBuilderFormProps {
  filterBuilder: FilterBuilder;
  onFilterBuilderChange: (builder: FilterBuilder) => void;
  currentMatches: RawPage[];
  onCreateBlock: () => void;
  onClearFilter: () => void;
}

// Props for FilterPresetSidebar component
export interface FilterPresetSidebarProps {
  onAddPreset: (presetId: string) => void;
}

// Props for ActiveFilterBlocksDisplay component
export interface ActiveFilterBlocksDisplayProps {
  filterBlocks: FilterBlock[];
  onRemoveBlock: (blockId: string) => void;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
}

// Props for FilterBlockCard component
export interface FilterBlockCardProps {
  block: FilterBlock;
  onRemove: (id: string) => void;
  onView: (id: string) => void;
  isSelected: boolean;
}