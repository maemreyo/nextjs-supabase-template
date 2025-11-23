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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, FileText, Settings, Tag, Code, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisSession } from '@/types/sessions';

interface ExportSessionDialogProps {
  session: AnalysisSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (sessionId: string, options: {
    format: 'json' | 'csv' | 'markdown' | 'pdf';
    includeAnalyses: boolean;
    includeSettings: boolean;
    includeMetadata: boolean;
  }) => Promise<{
    content: string;
    filename: string;
    mimeType: string;
  }>;
  loading?: boolean;
}

export function ExportSessionDialog({
  session,
  open,
  onOpenChange,
  onExport,
  loading = false
}: ExportSessionDialogProps) {
  const [format, setFormat] = useState<'json' | 'csv' | 'markdown' | 'pdf'>('json');
  const [includeAnalyses, setIncludeAnalyses] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [error, setError] = useState('');

  // Reset form when session changes
  React.useEffect(() => {
    if (session) {
      setFormat('json');
      setIncludeAnalyses(true);
      setIncludeSettings(true);
      setIncludeMetadata(true);
      setError('');
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) return;

    try {
      const result = await onExport(session.id, {
        format,
        includeAnalyses,
        includeSettings,
        includeMetadata,
      });
      
      // Download the file
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to export session:', error);
      setError('Không thể xuất session. Vui lòng thử lại.');
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: Code, description: 'Định dạng dữ liệu có cấu trúc' },
    { value: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Định dạng bảng tính' },
    { value: 'markdown', label: 'Markdown', icon: FileText, description: 'Định dạng văn bản đánh dấu' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Định dạng tài liệu (sắp có)' },
  ];

  const selectedFormat = formatOptions.find(f => f.value === format);

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Xuất Session
          </DialogTitle>
          <DialogDescription>
            Xuất session và nội dung liên quan ra file để lưu trữ hoặc chia sẻ.
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
            </div>
          </div>

          <Separator />

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Định dạng xuất</Label>
            
            <Select value={format} onValueChange={(value) => setFormat(value as any)} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn định dạng xuất" />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {format === 'pdf' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Xuất PDF đang được phát triển. Vui lòng chọn định dạng khác.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Nội dung cần xuất:</Label>
            
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
                    Xuất tất cả kết quả phân tích trong session
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
                    Xuất cài đặt và cấu hình của session
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="include-metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                  disabled={loading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="include-metadata"
                    className="text-sm font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Metadata
                    </div>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Xuất thông tin metadata (ngày tạo, cập nhật, v.v.)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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
              disabled={loading || (format === 'pdf')}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Xuất {selectedFormat?.label}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ExportSessionDialog;