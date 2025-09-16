/**
 * Filter field configuration and definitions
 *
 * This file contains all the field options available for filtering, including
 * their operators, placeholders, and descriptions. Each field corresponds to
 * a column in the raw pages table and defines what operations can be performed on it.
 */

import { FieldOption } from './types';

/**
 * Complete configuration of all filterable fields
 * Each field matches a column in the raw pages table
 */
export const FILTER_FIELD_OPTIONS: FieldOption[] = [
  {
    value: 'url',
    label: 'URL',
    operators: [
      { value: 'contains', label: 'contains' },
      { value: 'not_contains', label: 'does not contain' },
      { value: 'is_empty', label: 'is empty' },
      { value: 'is_not_empty', label: 'is not empty' }
    ],
    placeholder: '/admin/, /wp-content/, .pdf',
    description: 'Filter by page URL'
  },
  {
    value: 'title',
    label: 'Title',
    operators: [
      { value: 'contains', label: 'contains' },
      { value: 'not_contains', label: 'does not contain' },
      { value: 'is_empty', label: 'is empty' },
      { value: 'is_not_empty', label: 'is not empty' }
    ],
    placeholder: 'Home, About, Contact',
    description: 'Filter by page title'
  },
  {
    value: 'meta_description',
    label: 'Meta Description',
    operators: [
      { value: 'contains', label: 'contains' },
      { value: 'not_contains', label: 'does not contain' },
      { value: 'is_empty', label: 'is empty' },
      { value: 'is_not_empty', label: 'is not empty' }
    ],
    placeholder: 'SEO, description text',
    description: 'Filter by meta description content'
  },
  {
    value: 'content_length',
    label: 'Content Length',
    operators: [
      { value: 'equals', label: 'equals' },
      { value: 'not_equals', label: 'does not equal' },
      { value: 'greater_than', label: 'is greater than' },
      { value: 'less_than', label: 'is less than' },
      { value: 'is_empty', label: 'is empty' }
    ],
    placeholder: '100, 500, 1000',
    description: 'Filter by content length in characters'
  },
  {
    value: 'status_code',
    label: 'Status Code',
    operators: [
      { value: 'equals', label: 'equals' },
      { value: 'not_equals', label: 'does not equal' },
      { value: 'is_one_of', label: 'is one of' },
      { value: 'is_empty', label: 'is empty' }
    ],
    placeholder: '404, 404,500,502, null',
    description: 'Filter by HTTP status code'
  }
];

/**
 * Get available operators for a specific field
 */
export function getFieldOperators(fieldValue: string) {
  const field = FILTER_FIELD_OPTIONS.find(f => f.value === fieldValue);
  return field?.operators || [];
}

/**
 * Get field details including label, placeholder, and description
 */
export function getFieldDetails(fieldValue: string) {
  return FILTER_FIELD_OPTIONS.find(f => f.value === fieldValue);
}

/**
 * Get the display label for a specific operator within a field
 */
export function getOperatorLabel(fieldValue: string, operatorValue: string): string {
  const operators = getFieldOperators(fieldValue);
  const operator = operators.find(op => op.value === operatorValue);
  return operator?.label || operatorValue;
}