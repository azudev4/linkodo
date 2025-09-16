'use client';

import React, { useState, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onSearch: (searchTerm: string) => void;
  onClear?: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SearchInput({
  placeholder = 'Search...',
  value = '',
  onSearch,
  onClear,
  loading = false,
  disabled = false,
  className,
  size = 'md'
}: SearchInputProps) {
  const [searchValue, setSearchValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10',
    lg: 'h-12 text-lg'
  };

  const handleSearch = () => {
    if (!disabled && !loading) {
      onSearch(searchValue.trim());
    }
  };

  const handleClear = () => {
    setSearchValue('');
    if (onClear) {
      onClear();
    } else {
      onSearch('');
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      <div className="relative flex-1">
        <Search className={cn(
          'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
          size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
        )} />

        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          className={cn(
            'pl-10 pr-10 focus:!ring-blue-400 focus:!border-blue-400 focus-visible:!ring-blue-400/50 focus-visible:!border-blue-400',
            sizeClasses[size],
            loading && 'cursor-wait'
          )}
        />

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {loading && (
            <Loader2 className={cn(
              'animate-spin text-gray-400',
              size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
            )} />
          )}

          {searchValue && !loading && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className={cn(
                'text-gray-400 hover:text-gray-600 focus:outline-none transition-colors',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              title="Clear search"
            >
              <X className={cn(
                size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
              )} />
            </button>
          )}
        </div>
      </div>

      <Button
        type="button"
        onClick={handleSearch}
        disabled={disabled || loading || !searchValue.trim()}
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        className="ml-2 px-3 bg-blue-600 hover:bg-blue-700 text-white border-0"
      >
        {loading ? (
          <Loader2 className={cn(
            'animate-spin',
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
          )} />
        ) : (
          <Search className={cn(
            size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
          )} />
        )}
        <span className="sr-only">Search</span>
      </Button>
    </div>
  );
}