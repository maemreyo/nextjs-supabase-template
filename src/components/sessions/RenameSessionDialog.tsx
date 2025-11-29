import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisSession } from '@/types/sessions';

interface RenameSessionDialogProps {
  session: AnalysisSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRename: (sessionId: string, title: string, description?: string) => Promise<void>;
  loading?: boolean;
}

export function RenameSessionDialog({
  session,
  open,
  onOpenChange,
  onRename,
  loading = false
}: RenameSessionDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');

  // Reset form when session changes
  React.useEffect(() => {
    if (session) {
      setTitle(session.title);
      setDescription(session.description || '');
      setTitleError('');
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) return;
    
    // Validate title
    if (!title.trim()) {
      setTitleError('Tên session không được để trống');
      return;
    }
    
    if (title.trim().length > 200) {
      setTitleError('Tên session không được quá 200 ký tự');
      return;
    }

    if (description && description.length > 1000) {
      setTitleError('Mô tả không được quá 1000 ký tự');
      return;
    }

    // Check if anything changed
    if (title.trim() === session.title && 
        (description || null) === (session.description || null)) {
      onOpenChange(false);
      return;
    }

    try {
      await onRename(session.id, title.trim(), description.trim() || undefined);
      onOpenChange(false);
    } catch (error) {
      
      setTitleError('Không thể đổi tên session. Vui lòng thử lại.');
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
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Đổi tên Session
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tên session *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setTitleError('');
              }}
              placeholder="Nhập tên session..."
              className={cn(titleError && "border-red-500")}
              disabled={loading}
              maxLength={200}
              autoFocus
            />
            {titleError && (
              <p className="text-sm text-red-600">{titleError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả cho session (không bắt buộc)..."
              disabled={loading}
              maxLength={1000}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/1000 ký tự
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 border-primary/30">
              Loại: {session.session_type === 'word' ? 'Từ' :
                     session.session_type === 'sentence' ? 'Câu' :
                     session.session_type === 'paragraph' ? 'Đoạn' : 'Hỗn hợp'}
            </Badge>
            <Badge variant="outline" className="bg-secondary/10 border-secondary/30">
              {session.total_analyses} phân tích
            </Badge>
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
              disabled={loading || !title.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang đổi tên...
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Đổi tên
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RenameSessionDialog;