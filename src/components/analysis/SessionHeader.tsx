import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  FolderOpen,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisSession {
  id: string;
  title: string;
  session_type: 'word' | 'sentence' | 'paragraph' | 'mixed';
  created_at: string;
  updated_at: string;
}

interface SessionHeaderProps {
  session?: AnalysisSession | null;
  analysesCount: number;
  isLoading?: boolean;
  onNavigateBack?: () => void;
  onNavigateToSessions?: () => void;
  onSessionMenuClick?: () => void;
  onCreateNewSession?: () => void;
  className?: string;
}

export function SessionHeader({
  session,
  analysesCount,
  isLoading = false,
  onNavigateBack,
  onNavigateToSessions,
  onSessionMenuClick,
  onCreateNewSession,
  className
}: SessionHeaderProps) {
  if (!session) {
    return null;
  }

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'word':
        return 'Từ';
      case 'sentence':
        return 'Câu';
      case 'paragraph':
        return 'Đoạn';
      case 'mixed':
        return 'Hỗn hợp';
      default:
        return type;
    }
  };

  return (
    <div className={cn("border-b bg-muted/30 p-3", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Left Section - Navigation and Session Info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateBack || onNavigateToSessions}
            className="h-7 px-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Quay lại</span>
            <span className="sm:hidden">←</span>
          </Button>

          {/* Session Info */}
          {session && (
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="outline" className="bg-primary/10 border-primary/30 truncate max-w-[150px] sm:max-w-none">
                <FolderOpen className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{session.title}</span>
              </Badge>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {getSessionTypeLabel(session.session_type)}
              </Badge>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {analysesCount} phân tích
              </Badge>
            </div>
          )}
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Session List Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToSessions}
            className="h-7 px-2"
          >
            <FolderOpen className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Danh sách</span>
            <span className="sm:hidden">📋</span>
          </Button>

          {/* New Session Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateNewSession}
            className="h-7 px-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Mới</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SessionHeader;