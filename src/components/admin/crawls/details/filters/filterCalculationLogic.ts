/**
 * Filter calculation logic and utility functions
 *
 * This file contains all the core filtering logic that determines which pages
 * match specific filter criteria. It handles both individual filter preview
 * calculations and filter block matching for exclusions.
 */

import { RawPage, FilterCriterion, FilterBuilder } from './types';

/**
 * Calculate which pages match the current filter being built in the form
 * Used for real-time preview highlighting in the table
 */
export function calculateFilterPreviewMatches(
  pages: RawPage[],
  filterBuilder: FilterBuilder
): RawPage[] {
  if (!pages || pages.length === 0 || !filterBuilder.field || !filterBuilder.operator) {
    return [];
  }

  return pages.filter(page => {
    const { field, operator, value } = filterBuilder;

    switch (field) {
      case 'url':
        return evaluateUrlFilter(page.url ?? '', operator, value);

      case 'title':
        return evaluateTitleFilter(page.title ?? '', operator, value);

      case 'meta_description':
        return evaluateMetaDescriptionFilter(page.meta_description ?? '', operator, value);

      case 'content_length':
        return evaluateContentLengthFilter(page.content?.length || 0, operator, value);

      case 'status_code':
        return evaluateStatusCodeFilter(page.status_code, operator, value);

      default:
        return false;
    }
  });
}

/**
 * Calculate which pages match the criteria of existing filter blocks
 * Used to determine final exclusions when blocks are active
 */
export function calculateFilterBlockMatches(
  pages: RawPage[],
  criteria: FilterCriterion[]
): RawPage[] {
  if (!pages || pages.length === 0) {
    return [];
  }

  return pages.filter(page => {
    // A page matches if it satisfies ANY criterion (OR logic between criteria)
    return criteria.some(criterion => {
      const { field, operator, value } = criterion;

      switch (field) {
        case 'url':
          return evaluateUrlFilter(page.url ?? '', operator, value);

        case 'title':
          return evaluateTitleFilter(page.title ?? '', operator, value);

        case 'meta_description':
          return evaluateMetaDescriptionFilter(page.meta_description ?? '', operator, value);

        case 'content_length':
          return evaluateContentLengthFilter(page.content?.length || 0, operator, value);

        case 'status_code':
          return evaluateStatusCodeFilter(page.status_code, operator, value);

        default:
          return false;
      }
    });
  });
}

/**
 * Evaluate URL field filtering logic
 */
function evaluateUrlFilter(url: string, operator: string, value: string): boolean {
  switch (operator) {
    case 'contains':
      return url.toLowerCase().includes(value.toLowerCase());
    case 'not_contains':
      return !url.toLowerCase().includes(value.toLowerCase());
    case 'is_empty':
      return !url || url.trim() === '';
    case 'is_not_empty':
      return !!url && url.trim() !== '';
    default:
      return false;
  }
}

/**
 * Evaluate title field filtering logic
 */
function evaluateTitleFilter(title: string, operator: string, value: string): boolean {
  switch (operator) {
    case 'contains':
      return title.toLowerCase().includes(value.toLowerCase());
    case 'not_contains':
      return !title.toLowerCase().includes(value.toLowerCase());
    case 'is_empty':
      return !title || title.trim() === '';
    case 'is_not_empty':
      return !!title && title.trim() !== '';
    default:
      return false;
  }
}

/**
 * Evaluate meta description field filtering logic
 */
function evaluateMetaDescriptionFilter(meta: string, operator: string, value: string): boolean {
  switch (operator) {
    case 'contains':
      return meta.toLowerCase().includes(value.toLowerCase());
    case 'not_contains':
      return !meta.toLowerCase().includes(value.toLowerCase());
    case 'is_empty':
      return !meta || meta.trim() === '';
    case 'is_not_empty':
      return !!meta && meta.trim() !== '';
    default:
      return false;
  }
}

/**
 * Evaluate content length field filtering logic
 */
function evaluateContentLengthFilter(contentLength: number, operator: string, value: string): boolean {
  const numValue = parseInt(value);

  // Handle invalid number input
  if (isNaN(numValue) && operator !== 'is_empty') {
    return false;
  }

  switch (operator) {
    case 'equals':
      return contentLength === numValue;
    case 'not_equals':
      return contentLength !== numValue;
    case 'greater_than':
      return contentLength > numValue;
    case 'less_than':
      return contentLength < numValue;
    case 'is_empty':
      return contentLength === 0;
    default:
      return false;
  }
}

/**
 * Evaluate status code field filtering logic
 * Handles special cases like null values and comma-separated lists
 */
function evaluateStatusCodeFilter(statusCode: number | undefined | null, operator: string, value: string): boolean {
  switch (operator) {
    case 'equals':
      const singleValue = parseInt(value);
      return statusCode === singleValue;

    case 'not_equals':
      const notEqualValue = parseInt(value);
      return statusCode !== notEqualValue;

    case 'is_one_of':
      // Handle special "null" value and comma-separated lists
      if (value.toLowerCase().includes('null')) {
        const codes = value.split(',').map(c => {
          const trimmed = c.trim().toLowerCase();
          if (trimmed === 'null') return null;
          return parseInt(c.trim());
        });
        return codes.some(code => {
          if (code === null) {
            return !statusCode || statusCode === null || statusCode === undefined;
          }
          return code === statusCode;
        });
      } else {
        const codes = value.split(',').map(c => parseInt(c.trim()));
        return codes.includes(statusCode as number);
      }

    case 'is_empty':
      return !statusCode || statusCode === null || statusCode === undefined;

    default:
      return false;
  }
}