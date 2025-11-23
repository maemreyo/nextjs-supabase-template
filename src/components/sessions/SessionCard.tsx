'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { SessionActionMenu } from './SessionActionMenu';
import type { AnalysisSession } from '@/types/sessions';
import {
  Clock,
  FileText,
  Users,
  Settings,
  TrendingUp,
  Eye,
  Edit,
  Copy,
  Archive,
  Activity
} from 'lucide-react';
import { useAppNavigation } from '@/lib/navigation';

interface SessionCardProps {
  session: AnalysisSession;
  onEdit?: (session: AnalysisSession) => void;
  onDelete?: (session: AnalysisSession) => void;
  onOpen?: (sessionId: string) => void;
  onOpenInEditor?: (session: AnalysisSession) => void;
  onDuplicate?: (session: AnalysisSession) => void;
  onArchive?: (session: AnalysisSession) => void;
  onExport?: (session: AnalysisSession) => void;
  onShare?: (session: AnalysisSession) => void;
  onSettings?: (session: AnalysisSession) => void;
  isLoading?: boolean;
  isSelected?: boolean;
  onSelect?: (session: AnalysisSession, selected: boolean) => void;
  showSelection?: boolean;
  compact?: boolean;
}

export function SessionCard({
  session,
  onEdit,
  onDelete,
  onOpen,
  onOpenInEditor,
  onDuplicate,
  onArchive,
  onExport,
  onShare,
  onSettings,
  isLoading = false,
  isSelected = false,
  onSelect,
  showSelection = false,
  compact = false
}: SessionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { navigateToAnalysis } = useAppNavigation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'paragraph':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      case 'sentence':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      case 'word':
        return 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800';
      case 'mixed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
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

  const getActivityLevel = () => {
    const lastAccessed = new Date(session.last_accessed_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return { level: 'high', text: 'Hôm nay', color: 'text-green-600' };
    if (daysDiff <= 3) return { level: 'medium', text: `${daysDiff} ngày trước`, color: 'text-yellow-600' };
    return { level: 'low', text: `${daysDiff} ngày trước`, color: 'text-gray-500' };
  };

  const activity = getActivityLevel();

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons or interactive elements
    if ((e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('[data-no-card-click]')) {
      return;
    }
    
    // Try callback first, then fallback to direct navigation
    if (onOpen) {
      onOpen(session.id);
    } else {
      navigateToAnalysis(session.id);
    }
  };

  const handleOpenInEditor = () => {
    // Try callback first, then fallback to direct navigation
    if (onOpenInEditor) {
      onOpenInEditor(session);
    } else {
      navigateToAnalysis(session.id);
    }
  };

  const handleSelectionChange = (checked: boolean) => {
    onSelect?.(session, checked);
  };

  return (
    <LoadingOverlay isLoading={isLoading} variant="blur">
      <Card
        className={`w-full transition-all duration-200 ${
          isHovered ? 'shadow-md border-primary/20' : 'shadow-sm hover:shadow-md'
        } ${
          isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
        } ${
          compact ? 'p-4' : ''
        } cursor-pointer group ${isLoading ? 'pointer-events-none' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
      <CardHeader className={`pb-3 ${compact ? 'pb-2' : ''}`}>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className={`font-semibold line-clamp-2 ${
                compact ? 'text-sm' : 'text-base sm:text-lg'
              }`}>
                {session.title}
              </CardTitle>
              <CardDescription className={`mt-1 line-clamp-2 ${
                compact ? 'text-xs' : 'text-sm'
              }`}>
                {session.description || 'Không có mô tả'}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Selection Checkbox */}
              {showSelection && (
                <div data-no-card-click>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectionChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    aria-label={`Chọn phiên ${session.title}`}
                    aria-describedby={`session-card-${session.id}-status session-card-${session.id}-type`}
                  />
                </div>
              )}
              
              {/* Action Menu */}
              <div data-no-card-click>
                <SessionActionMenu
                  session={session}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onExport={onExport}
                  onShare={onShare}
                  onArchive={onArchive}
                  onDelete={onDelete}
                  onOpenInEditor={onOpenInEditor}
                  onSettings={onSettings}
                  disabled={isLoading}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Thao tác với phiên ${session.title}`}
                  aria-describedby={`session-card-${session.id}-status session-card-${session.id}-type`}
                />
              </div>
            </div>
          </div>

          {/* Status and Type Badges */}
          <div className="flex flex-wrap gap-2">
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
            
            {/* Activity Indicator */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className={`h-3 w-3 ${activity.color}`} />
              <span>{activity.text}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={`pb-3 ${compact ? 'pb-2' : ''}`}>
        <div className={`grid gap-3 text-sm ${
          compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
        }`}>
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
          
          {!compact && session.last_accessed_at && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-1 sm:col-span-2">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                Truy cập lần cuối: {new Date(session.last_accessed_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}
        </div>

        {/* Analysis Type Counts */}
        <div className="flex flex-wrap gap-1 mt-3">
          {session.word_analyses_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {session.word_analyses_count} từ
            </Badge>
          )}
          {session.sentence_analyses_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {session.sentence_analyses_count} câu
            </Badge>
          )}
          {session.paragraph_analyses_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              {session.paragraph_analyses_count} đoạn văn
            </Badge>
          )}
        </div>

        {/* Progress Indicator */}
        {session.total_analyses > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Tiến độ phân tích</span>
              <span>{session.total_analyses} mục</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (session.total_analyses / 10) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}
      </CardContent>

      {/* Action Buttons - Only show on hover for cleaner look */}
      {isHovered && !compact && (
        <CardFooter className="pt-3 border-t">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenInEditor}
              disabled={isLoading}
              className="flex-1 order-1 sm:order-none"
              data-no-card-click
            >
              {isLoading ? (
                <LoadingSpinner size="sm" variant="primary" />
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Mở trong Editor
                </>
              )}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-none" data-no-card-click>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(session)}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Sửa</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate?.(session)}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Nhân bản</span>
                  </>
                )}
              </Button>
              {session.status !== 'archived' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onArchive?.(session)}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      <span className="sr-only">Lưu trữ</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      )}
      </Card>
    </LoadingOverlay>
  );
}