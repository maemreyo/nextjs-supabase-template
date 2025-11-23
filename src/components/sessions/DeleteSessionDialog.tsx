import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2, AlertTriangle, FileText, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisSession } from '@/types/sessions';

interface DeleteSessionDialogProps {
  session: AnalysisSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (sessionId: string) => Promise<void>;
  loading?: boolean;
}

export function DeleteSessionDialog({
  session,
  open,
  onOpenChange,
  onDelete,
  loading = false
}: DeleteSessionDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  // Reset form when session changes
  React.useEffect(() => {
    if (session) {
      setConfirmText('');
      setError('');
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) return;
    
    // Validate confirmation
    if (confirmText !== session.title) {
      setError('Vui lòng nhập chính xác tên session để xác nhận xóa');
      return;
    }

    try {
      await onDelete(session.id);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Không thể xóa session. Vui lòng thử lại.');
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Xóa Session
          </DialogTitle>
          <DialogDescription>
            Hành động này không thể hoàn tác. Tất cả dữ liệu phân tích sẽ bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Session Info */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{session.title}</span>
              <Badge variant="outline" className="bg-primary/10 border-primary/30">
                {session.session_type === 'word' ? 'Từ' :
                 session.session_type === 'sentence' ? 'Câu' :
                 session.session_type === 'paragraph' ? 'Đoạn' : 'Hỗn hợp'}
              </Badge>
            </div>
            
            {session.description && (
              <p className="text-sm text-muted-foreground">{session.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {session.total_analyses} phân tích
              </div>
              <div className="flex items-center gap-1">
                <Archive className="h-4 w-4" />
                {session.status === 'archived' ? 'Đã lưu trữ' : 'Đang hoạt động'}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Tạo: {new Date(session.created_at).toLocaleDateString('vi-VN')}
              {session.updated_at !== session.created_at && (
                <> • Cập nhật: {new Date(session.updated_at).toLocaleDateString('vi-VN')}</>
              )}
            </div>
          </div>

          {/* Warning Alert */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Cảnh báo:</strong> Việc xóa session sẽ xóa vĩnh viễn:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Tất cả {session.total_analyses} kết quả phân tích</li>
                <li>Cài đặt và cấu hình của session</li>
                <li>Lịch sử và metadata liên quan</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Nhập tên session <span className="text-red-600">"{session.title}"</span> để xác nhận xóa:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError('');
              }}
              placeholder={session.title}
              className={cn(
                "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500",
                error && "border-red-500"
              )}
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={loading || confirmText !== session.title}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa Session
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteSessionDialog;