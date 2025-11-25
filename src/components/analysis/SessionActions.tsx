import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Plus,
} from 'lucide-react';

interface Session {
  id: string;
  title: string;
  session_type: 'word' | 'sentence' | 'paragraph' | 'mixed';
  created_at: string;
  updated_at: string;
}

interface SessionActionsProps {
  session?: Session | null;
  analysesCount: number;
  onNavigateBack?: () => void;
  onCreateNewSession?: () => void;
  className?: string;
}

export function SessionActions({
  session,
  analysesCount,
  onNavigateBack,
  onCreateNewSession,
  className
}: SessionActionsProps) {
  if (!session) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${className || ''}`}>
      {/* Left Section - Navigation and Session Info */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateBack}
          className="h-7 px-2 flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Quay lại</span>
          <span className="sm:hidden">←</span>
        </Button>

        {/* Session Info */}
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {analysesCount} phân tích
          </Badge>
        </div>
      </div>

      {/* Session Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-2 truncate">
          {session?.title || 'Đang tải...'}
        </h1>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* New Session Button */}
        {/* <Button
          variant="outline"
          size="sm"
          onClick={onCreateNewSession}
          className="h-7 px-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Mới</span>
          <span className="sm:hidden">+</span>
        </Button> */}
      </div>
    </div>
  );
}

export default SessionActions;