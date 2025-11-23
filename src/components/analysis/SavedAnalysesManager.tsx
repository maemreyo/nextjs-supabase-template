import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  History, 
  RefreshCw, 
  AlertTriangle,
  BookOpen,
  FileText,
  FilePlus,
  Database
} from 'lucide-react';
import { useSavedAnalyses } from '@/hooks/useSavedAnalyses';
import SavedAnalysesList from './SavedAnalysesList';
import SavedAnalysisDetail from './SavedAnalysisDetail';

/**
 * Component chính quản lý toàn bộ flow của các phân tích đã lưu
 * Tích hợp SavedAnalysesList và SavedAnalysisDetail
 * Quản lý state (selected analysis, dialog states)
 */
export function SavedAnalysesManager() {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const {
    analyses,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useSavedAnalyses({
    page: 1,
    per_page: 5 // Chỉ lấy 5 mục để hiển thị thống kê
  });

  const handleViewDetails = (id: string) => {
    setSelectedAnalysisId(id);
    setIsDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailDialogOpen(false);
    setSelectedAnalysisId(null);
  };

  const handleDeleteSuccess = () => {
    // Refresh the list after successful deletion
    refetch();
  };

  const handleRefresh = () => {
    refetch();
  };

  // Calculate statistics
  const wordCount = analyses.filter(a => a.analysis_type === 'word').length;
  const sentenceCount = analyses.filter(a => a.analysis_type === 'sentence').length;
  const paragraphCount = analyses.filter(a => a.analysis_type === 'paragraph').length;
  const totalCount = analyses.length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6" />
            Phân tích đã lưu
          </h2>
          <p className="text-muted-foreground">
            Quản lý và xem lại các phân tích văn bản đã lưu của bạn
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Error State */}
      {isError && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'Lỗi khi tải danh sách phân tích'}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Phân tích đã lưu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phân tích từ</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wordCount}</div>
            <p className="text-xs text-muted-foreground">
              Từ vựng đã phân tích
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phân tích câu</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentenceCount}</div>
            <p className="text-xs text-muted-foreground">
              Câu đã phân tích
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phân tích đoạn</CardTitle>
            <FilePlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paragraphCount}</div>
            <p className="text-xs text-muted-foreground">
              Đoạn văn đã phân tích
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="justify-start h-auto p-4 flex-col gap-2"
              onClick={() => {
                // This will be handled by the SavedAnalysesList component
                // We could pass a callback to set filters
              }}
            >
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Xem phân tích từ</span>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start h-auto p-4 flex-col gap-2"
              onClick={() => {
                // This will be handled by the SavedAnalysesList component
              }}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Xem phân tích câu</span>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start h-auto p-4 flex-col gap-2"
              onClick={() => {
                // This will be handled by the SavedAnalysesList component
              }}
            >
              <FilePlus className="h-6 w-6" />
              <span className="text-sm">Xem phân tích đoạn</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analyses List */}
      <SavedAnalysesList
        onViewDetails={handleViewDetails}
        onRefresh={handleRefresh}
      />

      {/* Detail Dialog */}
      <SavedAnalysisDetail
        isOpen={isDetailDialogOpen}
        onClose={handleCloseDetail}
        analysisId={selectedAnalysisId}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

export default SavedAnalysesManager;