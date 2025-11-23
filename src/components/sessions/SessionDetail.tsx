'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  FileText,
  Settings,
  ArrowLeft,
  Download,
  Share,
  Edit,
  Trash2,
  BookOpen,
  Zap,
  Copy,
  Archive,
  FolderOpen
} from 'lucide-react';
import type {
  AnalysisSession,
  SessionAnalysis,
  SessionSettings
} from '@/types/sessions';
import { WordAnalysisDisplay } from '@/components/analysis/WordAnalysisDisplay';
import { SentenceAnalysisDisplay } from '@/components/analysis/SentenceAnalysisDisplay';
import { ParagraphAnalysisDisplay } from '@/components/analysis/ParagraphAnalysisDisplay';
import { useAppNavigation } from '@/lib/navigation';

interface SessionDetailProps {
  session?: AnalysisSession | null;
  analyses?: any[];
  settings?: any;
  isLoading?: boolean;
  error?: string | null;
  onBack?: () => void;
  onEdit?: (session: AnalysisSession) => void;
  onSettings?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
  className?: string;
}

export function SessionDetail({
  session,
  analyses,
  settings,
  isLoading = false,
  error,
  onBack,
  onEdit,
  onSettings,
  onDelete,
  className
}: SessionDetailProps) {
  const [activeTab, setActiveTab] = useState('analyses');
  const { navigateToAnalysis } = useAppNavigation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'paragraph':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'sentence':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'word':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'mixed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'completed':
        return 'Hoàn thành';
      case 'archived':
        return 'Lưu trữ';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'paragraph':
        return 'Đoạn văn';
      case 'sentence':
        return 'Câu';
      case 'word':
        return 'Từ';
      case 'mixed':
        return 'Hỗn hợp';
      default:
        return type;
    }
  };

  const renderAnalysisItem = (analysis: any) => {
    const commonProps = {
      key: analysis.id,
      className: "mb-6"
    };

    switch (analysis.analysis_type) {
      case 'word':
        return (
          <WordAnalysisDisplay
            {...commonProps}
            analysis={analysis.word_analysis}
          />
        );
      case 'sentence':
        return (
          <SentenceAnalysisDisplay
            {...commonProps}
            analysis={analysis.sentence_analysis}
          />
        );
      case 'paragraph':
        return (
          <ParagraphAnalysisDisplay
            {...commonProps}
            analysis={analysis.paragraph_analysis}
          />
        );
      default:
        return (
          <Card {...commonProps}>
            <CardHeader>
              <CardTitle>Phân tích không xác định</CardTitle>
              <CardDescription>Loại: {analysis.analysis_type}</CardDescription>
            </CardHeader>
            <CardContent>
              <pre>{JSON.stringify(analysis.analysis_data, null, 2)}</pre>
            </CardContent>
          </Card>
        );
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-red-600">Lỗi tải phiên</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()}>
              Thử lại
            </Button>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Không tìm thấy phiên</CardTitle>
          <CardDescription>Phiên làm việc này không tồn tại hoặc bạn không có quyền truy cập.</CardDescription>
        </CardHeader>
        <CardContent>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{session.title}</h1>
            <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
              {session.description || 'Không có mô tả'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={`${getStatusColor(session.status)} text-xs`}
          >
            {getStatusText(session.status)}
          </Badge>
          <Badge
            variant="outline"
            className={`${getTypeColor(session.session_type)} text-xs`}
          >
            {getTypeText(session.session_type)}
          </Badge>
        </div>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Thông tin phiên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{session.total_analyses} phân tích</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {new Date(session.created_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
            {session.last_accessed_at && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">
                  Truy cập lần cuối: {new Date(session.last_accessed_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {session.word_analyses_count} từ, {session.sentence_analyses_count} câu, {session.paragraph_analyses_count} đoạn văn
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Action - Open in Analysis Editor */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-foreground mb-1">
                Tiếp tục phân tích phiên này
              </h3>
              <p className="text-sm text-muted-foreground">
                Mở trong Analysis Editor để thêm phân tích mới hoặc chỉnh sửa nội dung hiện có
              </p>
            </div>
            <Button
              onClick={() => navigateToAnalysis(session.id)}
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Mở trong Analysis Editor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thao tác nhanh</CardTitle>
          <CardDescription>
            Các hành động thường dùng cho phiên này
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => onEdit?.(session)}
              className="justify-start h-auto p-3 flex-col gap-2"
            >
              <Edit className="h-5 w-5" />
              <span className="text-xs">Chỉnh sửa</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onSettings?.(session.id)}
              className="justify-start h-auto p-3 flex-col gap-2"
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Cài đặt</span>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto p-3 flex-col gap-2"
            >
              <Download className="h-5 w-5" />
              <span className="text-xs">Xuất</span>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto p-3 flex-col gap-2"
            >
              <Share className="h-5 w-5" />
              <span className="text-xs">Chia sẻ</span>
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Nhân bản
            </Button>
            <Button
              variant="outline"
              className="flex-1"
            >
              <Archive className="h-4 w-4 mr-2" />
              Lưu trữ
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => onDelete(session.id)}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="analyses" className="text-xs sm:text-sm">
            Phân tích ({analyses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm">
            Cài đặt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyses" className="space-y-4">
          {(!analyses || analyses?.length === 0) ? (
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Chưa có phân tích</CardTitle>
                <CardDescription>
                  Phiên này chưa có phân tích nào. Bắt đầu thêm phân tích để xem chi tiết.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ScrollArea className="h-[400px] sm:h-[600px] pr-4">
              <div className="space-y-6">
                {(analyses || []).map((analysis, index) => (
                  <div key={analysis.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {index + 1}
                      </Badge>
                      <Badge variant="secondary">
                        {getTypeText(analysis.analysis_type)}
                      </Badge>
                      {analysis.analysis_title && (
                        <span className="font-medium">{analysis.analysis_title}</span>
                      )}
                    </div>
                    {renderAnalysisItem(analysis)}
                    {index < (analyses?.length || 0) - 1 && <Separator className="my-6" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {settings ? (
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt phiên</CardTitle>
                <CardDescription>
                  Quản lý cài đặt và tùy chọn cho phiên làm việc này
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Tự động</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Tự động lưu</span>
                        <Badge variant={settings.auto_save ? 'default' : 'secondary'}>
                          {settings.auto_save ? 'Bật' : 'Tắt'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Hiển thị tóm tắt</span>
                        <Badge variant={settings.show_summaries ? 'default' : 'secondary'}>
                          {settings.show_summaries ? 'Bật' : 'Tắt'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">AI</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Nhà cung cấp</span>
                        <span>{settings.preferred_ai_provider || 'Mặc định'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Mô hình</span>
                        <span>{settings.preferred_ai_model || 'Mặc định'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Độ sâu phân tích</span>
                        <span>{settings.analysis_depth}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Xuất</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Định dạng mặc định</span>
                        <span>{settings.default_export_format}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Bao gồm metadata</span>
                        <Badge variant={settings.include_metadata ? 'default' : 'secondary'}>
                          {settings.include_metadata ? 'Bật' : 'Tắt'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Thông báo</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Email</span>
                        <Badge variant={settings.email_notifications ? 'default' : 'secondary'}>
                          {settings.email_notifications ? 'Bật' : 'Tắt'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Nhắc nhở phiên</span>
                        <Badge variant={settings.session_reminders ? 'default' : 'secondary'}>
                          {settings.session_reminders ? 'Bật' : 'Tắt'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Không có cài đặt</CardTitle>
                <CardDescription>
                  Phiên này chưa được cấu hình cài đặt cụ thể.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}