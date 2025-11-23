'use client';

import { useState, useEffect } from 'react';
import { SessionCard } from './SessionCard';
import { SessionSearchBar } from './SessionSearchBar';
import { SessionFilters } from './SessionFilters';
import { SessionEmptyState } from './SessionEmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShimmerGrid } from '@/components/ui/shimmer-effect';
import { RetryButton } from '@/components/ui/retry-button';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { OfflineIndicator } from '@/components/ui/offline-indicator';
import { useSessions, useDeleteSession } from '@/hooks/useSessions';
import type { AnalysisSession } from '@/types/sessions';
import { Plus, Grid, List, RotateCcw } from 'lucide-react';

interface SessionListProps {
  onCreateSession?: () => void;
  onOpenSession?: (sessionId: string) => void;
  onEditSession?: (session: AnalysisSession) => void;
  onSessionSettings?: (sessionId: string) => void;
  onDuplicateSession?: (session: AnalysisSession) => void;
  onArchiveSession?: (session: AnalysisSession) => void;
  onExportSession?: (session: AnalysisSession) => void;
  onShareSession?: (session: AnalysisSession) => void;
  onOpenInEditor?: (session: AnalysisSession) => void;
  className?: string;
}

export function SessionList({
  onCreateSession,
  onOpenSession,
  onEditSession,
  onSessionSettings,
  onDuplicateSession,
  onArchiveSession,
  onExportSession,
  onShareSession,
  onOpenInEditor,
  className
}: SessionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [sortBy, setSortBy] = useState<string>('last_accessed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);
  const [limit] = useState(12);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const {
    sessions,
    total,
    isLoading,
    error,
    refetch
  } = useSessions({
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter as 'active' | 'archived' | 'deleted',
    type: typeFilter === 'all' ? undefined : typeFilter as 'word' | 'sentence' | 'paragraph' | 'mixed',
    sortBy,
    sortOrder,
    page: page + 1,
    limit
  });

  const { deleteSession: deleteSessionMutation } = useDeleteSession();

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phiên này?')) {
      try {
        await deleteSessionMutation(sessionId);
        refetch();
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  const handleDeleteSessionFromCard = async (session: AnalysisSession) => {
    await handleDeleteSession(session.id);
  };

  const handleSessionSettingsFromCard = (session: AnalysisSession) => {
    onSessionSettings?.(session.id);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(0); // Reset to first page when searching
    
    // Add to recent searches
    if (term.trim() && !recentSearches.includes(term.trim())) {
      setRecentSearches(prev => [term.trim(), ...prev.slice(0, 4)]);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setDateRange({});
    setSortBy('last_accessed_at');
    setSortOrder('desc');
    setPage(0);
  };

  const handleReset = () => {
    handleClearSearch();
    handleClearFilters();
  };

  const handleQuickFilter = (filter: string) => {
    switch (filter) {
      case 'recent':
        setDateRange({
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          end: new Date()
        });
        break;
      case 'many-analyses':
        // This would require a more complex filter
        break;
      case 'active':
        setStatusFilter('active');
        break;
    }
    setPage(0);
  };

  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages - 1;
  const hasActiveFilters = statusFilter !== 'all' || 
                          typeFilter !== 'all' || 
                          (dateRange?.start && dateRange?.end) ||
                          searchTerm;

  // Determine empty state type
  const getEmptyStateType = () => {
    if (searchTerm) return 'no-search-results';
    if (hasActiveFilters) return 'no-filter-results';
    return 'no-sessions';
  };

  if (error) {
    return (
      <div className={className}>
        <ErrorBoundary>
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Lỗi tải phiên</CardTitle>
              <CardDescription>
                {typeof error === 'string' ? error : error?.message || 'Lỗi không xác định'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => refetch()}>
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className={className}>
      <ErrorBoundary>
        <OfflineIndicator />
        <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" id="sessions-heading">Phiên phân tích</h2>
          <p className="text-muted-foreground" aria-live="polite">
            {total} phiên tổng cộng
            {hasActiveFilters && (
              <span className="ml-2">
                (đã lọc)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 sm:flex-none"
              aria-label="Đặt lại bộ lọc và tìm kiếm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Đặt lại</span>
              <span className="sm:hidden">Làm mới</span>
            </Button>
          )}
          <Button
            onClick={onCreateSession}
            className="flex-1 sm:flex-none"
            aria-label="Tạo phiên phân tích mới"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo phiên mới
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <SessionSearchBar
        value={searchTerm}
        onChange={handleSearch}
        onClear={handleClearSearch}
        showRecentSearches
        recentSearches={recentSearches}
        onRecentSearchClick={handleSearch}
        showQuickFilters
        onQuickFilterClick={handleQuickFilter}
      />

      {/* Filters */}
      <SessionFilters
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        dateRange={dateRange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
        onDateRangeChange={(range) => {
          setDateRange(range);
          setPage(0);
        }}
        onSortChange={(newSortBy, newSortOrder) => {
          setSortBy(newSortBy);
          setSortOrder(newSortOrder);
          setPage(0);
        }}
        onReset={handleClearFilters}
      />

      {/* View Mode Toggle */}
      <div className="flex justify-end" role="tablist" aria-label="Chế độ hiển thị">
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
            aria-label="Hiển thị dạng lưới"
            aria-selected={viewMode === 'grid'}
            role="tab"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
            aria-label="Hiển thị dạng danh sách"
            aria-selected={viewMode === 'list'}
            role="tab"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sessions Grid/List */}
      {isLoading ? (
        <ShimmerGrid
          cols={viewMode === 'grid' ? 4 : 1}
          rows={viewMode === 'grid' ? 2 : 6}
          className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
            : 'space-y-4'
          }
        />
      ) : sessions.length === 0 ? (
        <SessionEmptyState
          type={getEmptyStateType()}
          onCreateSession={onCreateSession}
          onClearFilters={handleClearFilters}
          onClearSearch={handleClearSearch}
        />
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
          : 'space-y-4'
        }>
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onOpen={onOpenSession}
              onEdit={onEditSession}
              onSettings={handleSessionSettingsFromCard}
              onDelete={handleDeleteSessionFromCard}
              onDuplicate={onDuplicateSession}
              onArchive={onArchiveSession}
              onExport={onExportSession}
              onShare={onShareSession}
              onOpenInEditor={onOpenInEditor}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="w-full sm:w-auto"
            aria-label={`Trang trước, hiện tại đang ở trang ${page + 1} của ${totalPages}`}
          >
            Trước
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground" id="pagination-info">
              Trang
            </span>
            <div className="flex gap-1" role="tablist" aria-labelledby="pagination-info">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === page + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum - 1)}
                    className="w-8 h-8 p-0"
                    aria-label={`Trang ${pageNum}${isActive ? ', đang chọn' : ''}`}
                    aria-selected={isActive}
                    role="tab"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <span className="text-sm text-muted-foreground">
              / {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={!hasMore}
            className="w-full sm:w-auto"
            aria-label={`Trang tiếp theo, hiện tại đang ở trang ${page + 1} của ${totalPages}`}
          >
            Tiếp theo
          </Button>
        </div>
      )}

      {/* Results Summary */}
      {sessions.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Hiển thị {sessions.length} trên {total} phiên
          {hasActiveFilters && ' (đã lọc)'}
        </div>
      )}
        </div>
      </ErrorBoundary>
    </div>
  );
}