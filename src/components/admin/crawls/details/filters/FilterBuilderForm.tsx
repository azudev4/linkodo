/**
 * FilterBuilderForm - Main filter creation form component
 *
 * This component handles the filter creation interface where users can:
 * - Select a field to filter by (URL, Title, Meta Description, etc.)
 * - Choose an operator (contains, equals, is empty, etc.)
 * - Enter a value to filter by
 * - See live preview of matching pages
 * - Create filter blocks from their selections
 */

'use client';

import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { FilterBuilderFormProps } from './types';
import { FILTER_FIELD_OPTIONS, getFieldOperators, getFieldDetails } from './filterFieldConfiguration';

export function FilterBuilderForm({
  filterBuilder,
  onFilterBuilderChange,
  currentMatches,
  onCreateBlock,
  onClearFilter
}: FilterBuilderFormProps) {

  const handleFieldChange = (fieldValue: string) => {
    const fieldOption = FILTER_FIELD_OPTIONS.find(f => f.value === fieldValue);
    const operators = fieldOption?.operators || [];

    onFilterBuilderChange({
      ...filterBuilder,
      field: fieldValue,
      // Auto-set operator if there's only one choice
      operator: operators.length === 1 ? operators[0].value : ''
    });
  };

  const handleOperatorChange = (operatorValue: string) => {
    onFilterBuilderChange({
      ...filterBuilder,
      operator: operatorValue
    });
  };

  const handleValueChange = (value: string) => {
    onFilterBuilderChange({
      ...filterBuilder,
      value
    });
  };

  const handleNameChange = (name: string) => {
    onFilterBuilderChange({
      ...filterBuilder,
      name
    });
  };

  const fieldDetails = getFieldDetails(filterBuilder.field);
  const availableOperators = getFieldOperators(filterBuilder.field);
  const selectedOperator = availableOperators.find(op => op.value === filterBuilder.operator);

  const canCreateBlock = filterBuilder.name &&
                        filterBuilder.field &&
                        filterBuilder.operator &&
                        filterBuilder.value &&
                        currentMatches.length > 0;

  const hasAnyInput = filterBuilder.field || filterBuilder.operator || filterBuilder.value || filterBuilder.name;

  return (
    <div className="lg:col-span-3 space-y-4">
      <h3 className="text-sm font-medium text-gray-700">Create Custom Filter</h3>

      {/* Filter Builder Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filter Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter Name
          </label>
          <input
            type="text"
            placeholder="e.g., Admin Pages"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterBuilder.name}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>

        {/* Field Selection Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Field
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between border-gray-200 hover:bg-gray-50"
              >
                {filterBuilder.field
                  ? fieldDetails?.label
                  : "Select field"
                }
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {FILTER_FIELD_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleFieldChange(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Operator Selection Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Operator
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between border-gray-200 hover:bg-gray-50"
                disabled={!filterBuilder.field || availableOperators.length <= 1}
              >
                {filterBuilder.operator
                  ? selectedOperator?.label || filterBuilder.operator
                  : "Select operator"
                }
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {availableOperators.map((operator) => (
                <DropdownMenuItem
                  key={operator.value}
                  onClick={() => handleOperatorChange(operator.value)}
                >
                  {operator.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Value Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          <input
            type="text"
            placeholder={fieldDetails?.placeholder || "Enter value"}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterBuilder.value}
            onChange={(e) => handleValueChange(e.target.value)}
            disabled={!filterBuilder.field || !filterBuilder.operator}
          />
        </div>
      </div>

      {/* Live Counter and Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {filterBuilder.field && (
            <div className="text-sm text-gray-600">
              <span className="font-medium text-red-600">{currentMatches.length}</span> pages match current filter
            </div>
          )}
          {fieldDetails?.description && (
            <div className="text-xs text-gray-500">
              {fieldDetails.description}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilter}
            disabled={!hasAnyInput}
            className="text-gray-600 hover:text-gray-800"
          >
            Clear
          </Button>

          <Button
            onClick={onCreateBlock}
            disabled={!canCreateBlock}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Exclude {currentMatches.length} pages
          </Button>
        </div>
      </div>
    </div>
  );
}