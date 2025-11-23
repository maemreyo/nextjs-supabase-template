import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  Loader2, 
  AlertTriangle,
  Save,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutoSaveStatus } from '@/hooks/useSessionAutoSave';

interface AutoSaveStatusIndicatorProps {
  status: AutoSaveStatus;
  className?: string;
  compact?: boolean;
  showNextAutoSave?: boolean;
}

export function AutoSaveStatusIndicator({
  status,
  className = "",
  compact = false,
  showNextAutoSave = true
}: AutoSaveStatusIndicatorProps) {
  const { isAutoSaving, lastSavedAt, pendingChanges, saveCount, nextAutoSave } = status;

  // Format time ago
  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Chưa lưu';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffSeconds < 10) return 'Vừa xong';
    if (diffSeconds < 60) return `${diffSeconds}s trước`;
    if (diffMinutes < 60) return `${diffMinutes}p trước`;
    return `${diffHours}g trước`;
  };

  // Format time until next auto-save
  const formatTimeUntil = (date: Date | null) => {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds <= 0) return 'Đang lưu...';
    if (diffSeconds < 60) return `${diffSeconds}s`;
    return `${diffMinutes}p`;
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {isAutoSaving ? (
          <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Đang lưu...
          </Badge>
        ) : pendingChanges ? (
          <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Chưa lưu
          </Badge>
        ) : lastSavedAt ? (
          <Badge variant="outline" className="bg-green-100 border-green-300 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            {formatTimeAgo(lastSavedAt)}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-100 border-gray-300 text-gray-800">
            <Save className="h-3 w-3 mr-1" />
            Chưa lưu
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Main status */}
      <div className="flex items-center gap-2">
        {isAutoSaving ? (
          <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-800">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Đang tự động lưu...
          </Badge>
        ) : pendingChanges ? (
          <Badge variant="outline" className="bg-orange-100 border-orange-300 text-orange-800">
            <Clock className="h-4 w-4 mr-2" />
            Có thay đổi chưa lưu
          </Badge>
        ) : lastSavedAt ? (
          <Badge variant="outline" className="bg-green-100 border-green-300 text-green-800">
            <CheckCircle className="h-4 w-4 mr-2" />
            Đã lưu {formatTimeAgo(lastSavedAt)}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-100 border-gray-300 text-gray-800">
            <Save className="h-4 w-4 mr-2" />
            Chưa có lần lưu nào
          </Badge>
        )}
        
        {saveCount > 0 && (
          <span className="text-sm text-muted-foreground">
            ({saveCount} lần lưu)
          </span>
        )}
      </div>

      {/* Next auto-save countdown */}
      {showNextAutoSave && nextAutoSave && !isAutoSaving && !pendingChanges && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="h-3 w-3" />
          <span>Lưu tự động tiếp theo: {formatTimeUntil(nextAutoSave)}</span>
        </div>
      )}

      {/* Error indicator */}
      {isAutoSaving && pendingChanges && (
        <div className="flex items-center gap-1 text-xs text-orange-600">
          <AlertTriangle className="h-3 w-3" />
          <span>Đang xử lý các thay đổi...</span>
        </div>
      )}
    </div>
  );
}

export default AutoSaveStatusIndicator;