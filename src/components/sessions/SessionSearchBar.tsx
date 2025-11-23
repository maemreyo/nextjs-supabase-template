'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X, 
  Clock, 
  FileText,
  Filter,
  Command
} from 'lucide-react';

interface SessionSearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showRecentSearches?: boolean;
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
  showQuickFilters?: boolean;
  onQuickFilterClick?: (filter: string) => void;
}

export function SessionSearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Tìm kiếm phiên...',
  disabled = false,
  className = '',
  showRecentSearches = false,
  recentSearches = [],
  onRecentSearchClick,
  showQuickFilters = false,
  onQuickFilterClick
}: SessionSearchBarProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  const quickFilters = [
    { label: 'Gần đây', icon: Clock, value: 'recent' },
    { label: 'Nhiều phân tích', icon: FileText, value: 'many-analyses' },
    { label: 'Đang hoạt động', icon: Filter, value: 'active' }
  ];

  return (
    <div className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className={`pl-10 pr-10 ${inputValue ? 'pr-10' : 'pr-10'}`}
          aria-label="Tìm kiếm phiên"
        />
        
        {/* Clear Button */}
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Keyboard Shortcut Hint */}
      {!inputValue && !disabled && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <kbd className="inline-flex items-center px-1.5 py-0.5 text-xs font-mono text-muted-foreground bg-muted rounded">
            <Command className="h-3 w-3 mr-1" />
            K
          </kbd>
        </div>
      )}

      {/* Dropdown Content */}
      {isFocused && !inputValue && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 p-2">
          {/* Recent Searches */}
          {showRecentSearches && recentSearches.length > 0 && (
            <div className="mb-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                Tìm kiếm gần đây
              </h4>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputValue(search);
                      onChange?.(search);
                      onRecentSearchClick?.(search);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center gap-2"
                  >
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Filters */}
          {showQuickFilters && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                Bộ lọc nhanh
              </h4>
              <div className="space-y-1">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      onQuickFilterClick?.(filter.value);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center gap-2"
                  >
                    <filter.icon className="h-3 w-3 text-muted-foreground" />
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Search Badge */}
      {inputValue && (
        <div className="mt-2">
          <Badge variant="secondary" className="gap-1">
            <Search className="h-3 w-3" />
            Đang tìm kiếm: "{inputValue}"
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              aria-label="Xóa tìm kiếm"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      )}
    </div>
  );
}