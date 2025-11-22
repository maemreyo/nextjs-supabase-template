'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
  Calendar,
  Tag,
  MoreHorizontal,
  Eye,
  Edit,
  Share2,
  Database
} from 'lucide-react';
import { useHistoryManagement, HistoryFilters } from '@/hooks/useHistoryManagement';
import { AnalysisHistoryItem } from '@/lib/history-cache-manager';
import { HistoryMigration } from '@/lib/history-migration';
import HistoryMigrationDialog from './HistoryMigrationDialog';

interface HistoryComponentProps {
  className?: string;
  maxHeight?: string;
  showFilters?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  compact?: boolean;
  onItemSelect?: (item: AnalysisHistoryItem) => void;
  onItemEdit?: (item: AnalysisHistoryItem) => void;
  onItemShare?: (item: AnalysisHistoryItem) => void;
  onItemDelete?: (itemId: string) => void;
}

export function HistoryComponent({
  className = '',
  maxHeight = '400px',
  showFilters = true,
  showSearch = true,
  showPagination = true,
  compact = false,
  onItemSelect,
  onItemEdit,
  onItemShare,
  onItemDelete
}: HistoryComponentProps) {
  const {
    history,
    isLoading,
    isRefreshing,
    isSyncing,
    error,
    hasMore,
    pagination,
    lastSync,
    pendingItems,
    offlineStatus,
    loadMore,
    refresh,
    sync,
    clearHistory,
    filters,
    setFilters,
    setSearch,
    setTypeFilter,
    setDateRangeFilter,
    clearFilters: clearHistoryFilters
  } = useHistoryManagement({
    autoLoad: true,
    autoSync: true,
    cacheEnabled: true,
    pageSize: 20
  });

  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [showActions, setShowActions] = useState<string | null>(null);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search with debouncing
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
    }, 300);
  }, [setSearch]);

  // Handle date range change
  const handleDateRangeChange = useCallback((type: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [type]: value };
    setDateRange(newRange);
    
    if (newRange.start && newRange.end) {
      setDateRangeFilter({
        start: newRange.start,
        end: newRange.end
      });
    }
  }, [dateRange, setDateRangeFilter]);

  // Handle item selection
  const handleItemClick = useCallback((item: AnalysisHistoryItem) => {
    setSelectedItemId(item.id);
    onItemSelect?.(item);
  }, [onItemSelect]);

  // Handle item actions
  const handleItemAction = useCallback((action: 'edit' | 'share' | 'delete', item: AnalysisHistoryItem) => {
    switch (action) {
      case 'edit':
        onItemEdit?.(item);
        break;
      case 'share':
        onItemShare?.(item);
        break;
      case 'delete':
        onItemDelete?.(item.id);
        break;
    }
    setShowActions(null);
  }, [onItemEdit, onItemShare, onItemDelete]);

  // Handle migration complete
  const handleMigrationComplete = useCallback(() => {
    setNeedsMigration(false);
    setShowMigrationDialog(false);
    refresh();
  }, [refresh]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Get type icon and color
  const getTypeInfo = useCallback((type: string) => {
    switch (type) {
      case 'word':
        return { icon: '📝', color: 'bg-blue-100 text-blue-800', label: 'Từ' };
      case 'sentence':
        return { icon: '💬', color: 'bg-green-100 text-green-800', label: 'Câu' };
      case 'paragraph':
        return { icon: '📄', color: 'bg-purple-100 text-purple-800', label: 'Đoạn' };
      default:
        return { icon: '📋', color: 'bg-gray-100 text-gray-800', label: type };
    }
  }, []);

  // Render skeleton loading
  const renderSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-3 border rounded">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-8">
      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Chưa có lịch sử phân tích</h3>
      <p className="text-muted-foreground mb-4">
        Bắt đầu phân tích văn bản để xem lịch sử ở đây.
      </p>
      <Button onClick={refresh} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Tải lại
      </Button>
    </div>
  );

  // Render history item
  const renderHistoryItem = (item: AnalysisHistoryItem) => {
    const typeInfo = getTypeInfo(item.type);
    const isSelected = selectedItemId === item.id;
    const showItemActions = showActions === item.id;

    return (
      <div
        key={item.id}
        className={`p-3 border rounded cursor-pointer transition-all hover:bg-accent/50 ${
          isSelected ? 'bg-accent border-primary' : ''
        }`}
        onClick={() => handleItemClick(item)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeInfo.icon}</span>
            <Badge variant="secondary" className={`text-xs ${typeInfo.color}`}>
              {typeInfo.label}
            </Badge>
            {item.session_title && (
              <Badge variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {item.session_title}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground" title={formatTimestamp(item.timestamp)}>
              {formatTimestamp(item.timestamp)}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(showActions === item.id ? null : item.id);
              }}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="mb-2">
          <p className="text-sm text-foreground line-clamp-2">
            "{item.input}"
          </p>
        </div>

        {showItemActions && (
          <div className="flex gap-1 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleItemAction('edit', item);
              }}
            >
              <Edit className="h-3 w-3 mr-1" />
              Sửa
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleItemAction('share', item);
              }}
            >
              <Share2 className="h-3 w-3 mr-1" />
              Chia sẻ
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleItemAction('delete', item);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Xóa
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Render filters
  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Bộ lọc
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="space-y-3">
            {/* Type filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại phân tích</label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value: any) => setTypeFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="word">Từ</SelectItem>
                  <SelectItem value="sentence">Câu</SelectItem>
                  <SelectItem value="paragraph">Đoạn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date range filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Khoảng thời gian</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="Từ ngày"
                  value={dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="Đến ngày"
                  value={dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                />
              </div>
            </div>

            {/* Clear filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistoryFilters}
              className="w-full"
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </Card>
    );
  };

  // Render search
  const renderSearch = () => {
    if (!showSearch) return null;

    return (
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm trong lịch sử..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    );
  };

  // Render status bar
  const renderStatusBar = () => (
    <div className="flex items-center justify-between p-3 bg-muted/50 border-b text-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {offlineStatus.isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <span className="text-muted-foreground">
            {offlineStatus.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {pendingItems.length > 0 && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-orange-600">
              {pendingItems.length} đang chờ đồng bộ
            </span>
          </div>
        )}
        
        {lastSync && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Đồng bộ lần cuối: {formatTimestamp(lastSync)}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {isSyncing && (
          <Button variant="ghost" size="sm" disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Đang đồng bộ...
          </Button>
        )}
        
        {!isSyncing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={sync}
            disabled={pendingItems.length === 0}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Đồng bộ
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isRefreshing}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {isRefreshing ? 'Đang tải...' : 'Tải lại'}
        </Button>
      </div>
    </div>
  );

  // Render pagination
  const renderPagination = () => {
    if (!showPagination || !hasMore) return null;

    return (
      <div className="flex justify-center p-4">
        <Button
          variant="outline"
          onClick={loadMore}
          disabled={isLoading}
          className="min-w-32"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang tải...
            </>
          ) : (
            <>
              Tải thêm
              <ChevronDown className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Migration alert */}
      {needsMigration && (
        <Alert className="mb-4 border-blue-50 bg-blue-50">
          <Database className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Your local history needs to be migrated to the database for cross-device sync.
            </span>
            <Button
              size="sm"
              onClick={() => setShowMigrationDialog(true)}
              className="ml-2"
            >
              Migrate Now
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Status bar */}
      {renderStatusBar()}
      
      {/* Search */}
      {renderSearch()}
      
      {/* Filters */}
      {renderFilters()}
      
      {/* Error state */}
      {error && (
        <Alert className="mb-4 border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {typeof error === 'string' ? error : error.message}
          </AlertDescription>
        </Alert>
      )}
      
      {/* History list */}
      <ScrollArea className={`border rounded ${compact ? 'max-h-96' : ''}`} style={{ maxHeight }}>
        {isLoading && history.length === 0 ? (
          renderSkeleton()
        ) : history.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-2">
            {history.map(renderHistoryItem)}
          </div>
        )}
      </ScrollArea>
      
      {/* Pagination */}
      {renderPagination()}
      
      {/* Clear history button */}
      {history.length > 0 && (
        <div className="flex justify-center p-4">
          <Button
            variant="destructive"
            onClick={clearHistory}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa tất cả lịch sử
          </Button>
        </div>
      )}
      
      {/* Migration Dialog */}
      <HistoryMigrationDialog
        open={showMigrationDialog}
        onOpenChange={setShowMigrationDialog}
        onComplete={handleMigrationComplete}
      />
    </div>
  );
}

export default HistoryComponent;