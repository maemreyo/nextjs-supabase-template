'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Lightbulb,
  BookOpen,
  Target
} from 'lucide-react';

interface SessionEmptyStateProps {
  type?: 'no-sessions' | 'no-search-results' | 'no-filter-results';
  onCreateSession?: () => void;
  onClearFilters?: () => void;
  onClearSearch?: () => void;
  className?: string;
}

export function SessionEmptyState({
  type = 'no-sessions',
  onCreateSession,
  onClearFilters,
  onClearSearch,
  className = ''
}: SessionEmptyStateProps) {
  const renderContent = () => {
    switch (type) {
      case 'no-sessions':
        return (
          <>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">Chưa có phiên phân tích nào</CardTitle>
              <CardDescription className="text-base mt-2">
                Bắt đầu hành trình phân tích ngôn ngữ của bạn bằng cách tạo phiên làm việc đầu tiên
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30">
                    <Lightbulb className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">Phân tích từ</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Khám phá ý nghĩa và cách dùng của từng từ
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30">
                    <BookOpen className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">Phân tích câu</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hiểu cấu trúc ngữ pháp và ngữ cảnh của câu
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/30">
                    <Target className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium">Phân tích đoạn</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Phân tích sâu nội dung và ý nghĩa của đoạn văn
                    </p>
                  </div>
                </div>
              </div>
              
              {onCreateSession && (
                <Button 
                  onClick={onCreateSession} 
                  size="lg" 
                  className="mt-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo phiên phân tích đầu tiên
                </Button>
              )}
            </CardContent>
          </>
        );

      case 'no-search-results':
        return (
          <>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">Không tìm thấy phiên nào</CardTitle>
              <CardDescription className="text-base mt-2">
                Không có phiên nào khớp với từ khóa tìm kiếm của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0 space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
                <p>Gợi ý:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Kiểm tra lại chính tả từ khóa</li>
                  <li>Thử dùng từ khóa khác chung hơn</li>
                  <li>Sử dụng các bộ lọc để thu hẹp phạm vi</li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {onClearSearch && (
                  <Button variant="outline" onClick={onClearSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Xóa tìm kiếm
                  </Button>
                )}
                {onCreateSession && (
                  <Button onClick={onCreateSession}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo phiên mới
                  </Button>
                )}
              </div>
            </CardContent>
          </>
        );

      case 'no-filter-results':
        return (
          <>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">Không có phiên nào khớp bộ lọc</CardTitle>
              <CardDescription className="text-base mt-2">
                Không có phiên nào phù hợp với các bộ lọc đã chọn
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0 space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
                <p>Thử:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Thay đổi hoặc xóa một vài bộ lọc</li>
                  <li>Mở rộng khoảng ngày</li>
                  <li>Chọn "Tất cả" cho một hoặc nhiều bộ lọc</li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {onClearFilters && (
                  <Button variant="outline" onClick={onClearFilters}>
                    <Filter className="h-4 w-4 mr-2" />
                    Xóa bộ lọc
                  </Button>
                )}
                {onCreateSession && (
                  <Button onClick={onCreateSession}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo phiên mới
                  </Button>
                )}
              </div>
            </CardContent>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`max-w-4xl mx-auto ${className}`}>
      {renderContent()}
    </Card>
  );
}