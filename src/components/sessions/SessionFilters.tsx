'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

interface SessionFiltersProps {
  statusFilter?: string;
  typeFilter?: string;
  dateRange?: { start?: Date; end?: Date };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onStatusChange?: (status: string) => void;
  onTypeChange?: (type: string) => void;
  onDateRangeChange?: (range: { start?: Date; end?: Date }) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onReset?: () => void;
  className?: string;
}

const statusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'archived', label: 'Lưu trữ' },
];

const typeOptions = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'word', label: 'Phân tích từ' },
  { value: 'sentence', label: 'Phân tích câu' },
  { value: 'paragraph', label: 'Phân tích đoạn văn' },
  { value: 'mixed', label: 'Hỗn hợp' },
];

const sortOptions = [
  { value: 'last_accessed_at', label: 'Truy cập gần đây' },
  { value: 'created_at', label: 'Ngày tạo' },
  { value: 'updated_at', label: 'Cập nhật gần đây' },
  { value: 'title', label: 'Tên' },
  { value: 'total_analyses', label: 'Số lượng phân tích' },
];

const dateRangeOptions = [
  { 
    label: 'Hôm nay', 
    getValue: () => {
      const today = new Date();
      return { start: today, end: today };
    }
  },
  { 
    label: '7 ngày qua', 
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      return { start, end };
    }
  },
  { 
    label: '30 ngày qua', 
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      return { start, end };
    }
  },
  { 
    label: '3 tháng qua', 
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(end.getMonth() - 3);
      return { start, end };
    }
  },
];

export function SessionFilters({
  statusFilter = 'all',
  typeFilter = 'all',
  dateRange,
  sortBy = 'last_accessed_at',
  sortOrder = 'desc',
  onStatusChange,
  onTypeChange,
  onDateRangeChange,
  onSortChange,
  onReset,
  className = ''
}: SessionFiltersProps) {
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

  const handleQuickDateRange = (option: typeof dateRangeOptions[0]) => {
    const range = option.getValue();
    onDateRangeChange?.(range);
    setIsDateRangeOpen(false);
  };

  const hasActiveFilters = statusFilter !== 'all' || 
                          typeFilter !== 'all' || 
                          (dateRange?.start && dateRange?.end);

  const getStatusLabel = (value: string) => 
    statusOptions.find(option => option.value === value)?.label || value;

  const getTypeLabel = (value: string) => 
    typeOptions.find(option => option.value === value)?.label || value;

  const getSortLabel = (value: string) => 
    sortOptions.find(option => option.value === value)?.label || value;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Loại phiên" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Filter - Simplified */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
            className="w-full sm:w-[220px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.start && dateRange?.end ? (
              <>
                {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
              </>
            ) : (
              'Chọn khoảng ngày'
            )}
            <ChevronDown className="ml-auto h-4 w-4" />
          </Button>

          {/* Date Range Dropdown */}
          {isDateRangeOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 p-3">
              <div className="space-y-3">
                {/* Quick Date Range Options */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Chọn nhanh</h4>
                  <div className="flex flex-wrap gap-1">
                    {dateRangeOptions.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickDateRange(option)}
                        className="text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      onDateRangeChange?.({});
                      setIsDateRangeOpen(false);
                    }}
                  >
                    Xóa
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setIsDateRangeOpen(false)}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex gap-1">
          <Select 
            value={sortBy} 
            onValueChange={(value) => onSortChange?.(value, sortOrder)}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onSortChange?.(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2"
            aria-label={`Thứ tự ${sortOrder === 'asc' ? 'tăng dần' : 'giảm dần'}`}
          >
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${
                sortOrder === 'asc' ? 'rotate-180' : ''
              }`} 
            />
          </Button>
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={onReset}
            className="px-2"
            aria-label="Đặt lại bộ lọc"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Trạng thái: {getStatusLabel(statusFilter)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange?.('all')}
                className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                aria-label="Xóa bộ lọc trạng thái"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {typeFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Loại: {getTypeLabel(typeFilter)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTypeChange?.('all')}
                className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                aria-label="Xóa bộ lọc loại"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {dateRange?.start && dateRange?.end && (
            <Badge variant="secondary" className="gap-1">
              Ngày: {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDateRangeChange?.({})}
                className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                aria-label="Xóa bộ lọc ngày"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          <Badge variant="outline" className="gap-1">
            Sắp xếp: {getSortLabel(sortBy)} ({sortOrder === 'asc' ? 'tăng' : 'giảm'})
          </Badge>
        </div>
      )}
    </div>
  );
}