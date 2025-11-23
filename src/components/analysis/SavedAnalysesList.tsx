import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  FileText,
  FilePlus,
  AlertTriangle,
  Inbox
} from 'lucide-react';
import { useSavedAnalyses } from '@/hooks/useSavedAnalyses';
import { useDeleteAnalysis } from '@/hooks/useDeleteAnalysis';
import SavedAnalysisCard from './SavedAnalysisCard';
import type { AnalysisType } from '@/hooks/useSavedAnalyses';

interface SavedAnalysesListProps {
  onViewDetails: (id: string) => void;
  onRefresh?: () => void;
}

/**
 * Component hiển thị danh sách các phân tích đã lưu với filter và pagination
 * Hỗ trợ filter theo type (word/sentence/paragraph/all) và session_id
 */
export function SavedAnalysesList({ onViewDetails, onRefresh }: SavedAnalysesListProps) {
  const [typeFilter, setTypeFilter] = useState<AnalysisType>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const {
    analyses,
    pagination,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    hasNextPage,
    hasPreviousPage
  } = useSavedAnalyses({
    type: typeFilter,
    session_id: sessionFilter || undefined,
    page: currentPage,
    per_page: 12,
    search: searchQuery || undefined
  });

  const { deleteAnalysis, isLoading: isDeleting } = useDeleteAnalysis({
    onSuccess: () => {
      refetch();
    }
  });

  const handleDelete = (id: string) => {
    deleteAnalysis(id);
  };

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value as AnalysisType);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when search changes
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'word':
        return <BookOpen className="h-4 w-4" />;
      case 'sentence':
        return <FileText className="h-4 w-4" />;
      case 'paragraph':
        return <FilePlus className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'word':
        return 'Từ';
      case 'sentence':
        return 'Câu';
      case 'paragraph':
        return 'Đoạn';
      default:
        return 'Tất cả';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại phân tích</label>
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tất cả
                    </div>
                  </SelectItem>
                  <SelectItem value="word">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Từ
                    </div>
                  </SelectItem>
                  <SelectItem value="sentence">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Câu
                    </div>
                  </SelectItem>
                  <SelectItem value="paragraph">
                    <div className="flex items-center gap-2">
                      <FilePlus className="h-4 w-4" />
                      Đoạn
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Session Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Session ID</label>
              <Input
                placeholder="Nhập session ID"
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
              />
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm nội dung..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4"
                  />
                </div>
              </form>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              {pagination.total > 0 ? (
                <span>
                  Hiển thị {analyses.length} trong {pagination.total} kết quả
                </span>
              ) : (
                <span>Không có kết quả</span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Lỗi khi tải danh sách phân tích'}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-64">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
              <div className="p-4 pt-0">
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Empty State */}
          {analyses.length === 0 ? (
            <Card className="p-8 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Không có phân tích nào</h3>
              <p className="text-muted-foreground mb-4">
                {typeFilter !== 'all' || sessionFilter || searchQuery
                  ? 'Không tìm thấy phân tích nào phù hợp với bộ lọc. Thử thay đổi bộ lọc.'
                  : 'Bạn chưa lưu phân tích nào. Hãy bắt đầu phân tích văn bản của bạn.'}
              </p>
              {(typeFilter !== 'all' || sessionFilter || searchQuery) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeFilter('all');
                    setSessionFilter('');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </Card>
          ) : (
            <>
              {/* Analyses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyses.map((analysis) => (
                  <SavedAnalysisCard
                    key={analysis.id}
                    analysis={analysis}
                    onViewDetails={onViewDetails}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPreviousPage || isFetching}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trang trước
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === pagination.totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, index, array) => {
                        if (index > 0 && array[index - 1] !== page - 1) {
                          return (
                            <React.Fragment key={`ellipsis-${page}`}>
                              <span className="px-2 py-1 text-sm text-muted-foreground">...</span>
                              <Button
                                key={page}
                                variant={page === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                disabled={isFetching}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          );
                        }

                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            disabled={isFetching}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage || isFetching}
                  >
                    Trang sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default SavedAnalysesList;