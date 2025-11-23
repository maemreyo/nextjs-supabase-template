'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AnalysisSession } from '@/types/sessions';
import { Clock, FileText, Users, Settings } from 'lucide-react';

interface SessionCardProps {
  session: AnalysisSession;
  onEdit?: (session: AnalysisSession) => void;
  onDelete?: (sessionId: string) => void;
  onOpen?: (sessionId: string) => void;
  onSettings?: (sessionId: string) => void;
  isLoading?: boolean;
}

export function SessionCard({
  session,
  onEdit,
  onDelete,
  onOpen,
  onSettings,
  isLoading = false
}: SessionCardProps) {
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

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2">
                {session.title}
              </CardTitle>
              <CardDescription className="mt-1 text-sm line-clamp-2">
                {session.description || 'Không có mô tả'}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Badge
                variant="outline"
                className={`${getStatusColor(session.status)} text-xs whitespace-nowrap`}
              >
                {getStatusText(session.status)}
              </Badge>
              <Badge
                variant="outline"
                className={`${getTypeColor(session.session_type)} text-xs whitespace-nowrap`}
              >
                {getTypeText(session.session_type)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{session.total_analyses} phân tích</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {new Date(session.created_at).toLocaleDateString('vi-VN')}
            </span>
          </div>
          {session.last_accessed_at && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-1 sm:col-span-2">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                Truy cập lần cuối: {new Date(session.last_accessed_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {session.paragraph_analyses_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {session.paragraph_analyses_count} đoạn văn
            </Badge>
          )}
          {session.sentence_analyses_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {session.sentence_analyses_count} câu
            </Badge>
          )}
          {session.word_analyses_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {session.word_analyses_count} từ
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpen?.(session.id)}
            disabled={isLoading}
            className="flex-1 order-1 sm:order-none"
          >
            Mở
          </Button>
          <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-none">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit?.(session)}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Sửa</span>
              <span className="sm:hidden">Sửa</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSettings?.(session.id)}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Cài đặt</span>
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(session.id)}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Xóa</span>
                <span className="sm:hidden">Xóa</span>
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}