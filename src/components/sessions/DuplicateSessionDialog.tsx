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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, Copy, FileText, Settings, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisSession } from '@/types/sessions';

interface DuplicateSessionDialogProps {
  session: AnalysisSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicate: (sessionId: string, options: {
    title?: string;
    description?: string;
    includeAnalyses: boolean;
    includeSettings: boolean;
    includeTags: boolean;
  }) => Promise<void>;
  loading?: boolean;
}

export function DuplicateSessionDialog({
  session,
  open,
  onOpenChange,
  onDuplicate,
  loading = false
}: DuplicateSessionDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [includeAnalyses, setIncludeAnalyses] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [titleError, setTitleError] = useState('');

  // Reset form when session changes
  React.useEffect(() => {
    if (session) {
      setTitle(`${session.title} (Bản sao)`);
      setDescription(session.description || '');
      setIncludeAnalyses(true);
      setIncludeSettings(true);
      setIncludeTags(true);
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

    try {
      await onDuplicate(session.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        includeAnalyses,
        includeSettings,
        includeTags,
      });
      onOpenChange(false);
    } catch (error) {
      
      setTitleError('Không thể nhân bản session. Vui lòng thử lại.');
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Nhân bản Session
          </DialogTitle>
          <DialogDescription>
            Tạo một bản sao của session hiện tại với các tùy chọn nội dung cần sao chép.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Original Session Info */}
          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Session gốc:</span>
              <Badge variant="outline" className="bg-primary/10 border-primary/30">
                {session.session_type === 'word' ? 'Từ' :
                 session.session_type === 'sentence' ? 'Câu' :
                 session.session_type === 'paragraph' ? 'Đoạn' : 'Hỗn hợp'}
              </Badge>
            </div>
            
            <div className="text-sm">
              <p className="font-medium">{session.title}</p>
              {session.description && (
                <p className="text-muted-foreground mt-1">{session.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {session.total_analyses} phân tích
              </div>
              <div className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                {session.status === 'archived' ? 'Đã lưu trữ' : 'Đang hoạt động'}
              </div>
            </div>
          </div>

          <Separator />

          {/* New Session Info */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="title">Tên session mới *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleError('');
                }}
                placeholder="Nhập tên cho session mới..."
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
                placeholder="Nhập mô tả cho session mới (không bắt buộc)..."
                disabled={loading}
                maxLength={1000}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/1000 ký tự
              </p>
            </div>
          </div>

          <Separator />

          {/* Duplicate Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Nội dung cần nhân bản:</Label>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="include-analyses"
                  checked={includeAnalyses}
                  onCheckedChange={(checked) => setIncludeAnalyses(checked as boolean)}
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="include-analyses"
                    className="text-sm font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Phân tích ({session.total_analyses})
                    </div>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sao chép tất cả kết quả phân tích trong session
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="include-settings"
                  checked={includeSettings}
                  onCheckedChange={(checked) => setIncludeSettings(checked as boolean)}
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="include-settings"
                    className="text-sm font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Cài đặt
                    </div>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sao chép cài đặt và cấu hình của session
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="include-tags"
                  checked={includeTags}
                  onCheckedChange={(checked) => setIncludeTags(checked as boolean)}
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="include-tags"
                    className="text-sm font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </div>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sao chép tất cả tags được gán cho session
                  </p>
                </div>
              </div>
            </div>
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
                  Đang nhân bản...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Nhân bản Session
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DuplicateSessionDialog;