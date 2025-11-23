'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatusToast, useStatusToasts } from '@/components/ui/status-toast';
import {
  MoreHorizontal,
  Edit,
  Copy,
  Download,
  Share2,
  Archive,
  Trash2,
  FileText,
  Settings,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import type { AnalysisSession } from '@/types/sessions';
import { useAppNavigation } from '@/lib/navigation';
import RenameSessionDialog from './RenameSessionDialog';
import DeleteSessionDialog from './DeleteSessionDialog';
import DuplicateSessionDialog from './DuplicateSessionDialog';
import ExportSessionDialog from './ExportSessionDialog';
import { useNotifications } from '@/hooks/useNotifications';

interface SessionActionMenuProps {
  session: AnalysisSession;
  onEdit?: (session: AnalysisSession) => void;
  onDuplicate?: (session: AnalysisSession) => void;
  onExport?: (session: AnalysisSession) => void;
  onShare?: (session: AnalysisSession) => void;
  onArchive?: (session: AnalysisSession) => void;
  onDelete?: (session: AnalysisSession) => void;
  onOpenInEditor?: (session: AnalysisSession) => void;
  onSettings?: (session: AnalysisSession) => void;
  disabled?: boolean;
  className?: string;
}

export function SessionActionMenu({
  session,
  onEdit,
  onDuplicate,
  onExport,
  onShare,
  onArchive,
  onDelete,
  onOpenInEditor,
  onSettings,
  disabled = false,
  className
}: SessionActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const { navigateToAnalysis } = useAppNavigation();
  const { success, error, loading, dismiss } = useNotifications();

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  const handleOpenInEditor = () => {
    // Try callback first, then fallback to direct navigation
    if (onOpenInEditor) {
      onOpenInEditor(session);
    } else {
      navigateToAnalysis(session.id);
    }
  };

  // Handle rename
  const handleRename = async (sessionId: string, title: string, description?: string) => {
    setActionLoading('rename');
    try {
      const response = await fetch(`/api/sessions/${sessionId}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to rename session');
      }

      onEdit?.(session);
      success('Đổi tên session thành công');
    } catch (err) {
      console.error('Failed to rename session:', err);
      error('Không thể đổi tên session. Vui lòng thử lại.', {
        duration: 5000,
        action: {
          label: 'Thử lại',
          onClick: () => setRenameDialogOpen(true),
        },
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle duplicate
  const handleDuplicate = async (sessionId: string, options: {
    title?: string;
    description?: string;
    includeAnalyses: boolean;
    includeSettings: boolean;
    includeTags: boolean;
  }) => {
    setActionLoading('duplicate');
    try {
      const response = await fetch(`/api/sessions/${sessionId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to duplicate session');
      }

      const result = await response.json();
      onDuplicate?.(result.data.duplicatedSession);
      success('Nhân bản session thành công');
    } catch (error) {
      console.error('Failed to duplicate session:', error);
      error('Không thể nhân bản session. Vui lòng thử lại.', {
        duration: 5000,
        action: {
          label: 'Thử lại',
          onClick: () => setDuplicateDialogOpen(true),
        },
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle export
  const handleExport = async (sessionId: string, options: {
    format: 'json' | 'csv' | 'markdown' | 'pdf';
    includeAnalyses: boolean;
    includeSettings: boolean;
    includeMetadata: boolean;
  }) => {
    setActionLoading('export');
    try {
      const response = await fetch(`/api/sessions/${sessionId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to export session');
      }

      const result = await response.json();
      onExport?.(session);
      return result.data;
    } catch (error) {
      console.error('Failed to export session:', error);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete
  const handleDelete = async (sessionId: string) => {
    setActionLoading('delete');
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete session');
      }

      onDelete?.(session);
      success('Xóa session thành công');
    } catch (err) {
      console.error('Failed to delete session:', err);
      error('Không thể xóa session. Vui lòng thử lại.', {
        duration: 5000,
        action: {
          label: 'Thử lại',
          onClick: () => setDeleteDialogOpen(true),
        },
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={className}
            disabled={disabled}
            aria-label="Thao tác với phiên"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Primary Actions */}
          <DropdownMenuItem
            onClick={() => handleAction(handleOpenInEditor)}
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4" />
            Mở trong Analysis Editor
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleAction(() => setRenameDialogOpen(true))}
            className="cursor-pointer"
            disabled={actionLoading === 'rename'}
          >
            {actionLoading === 'rename' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Edit className="mr-2 h-4 w-4" />
            )}
            Đổi tên
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleAction(() => setDuplicateDialogOpen(true))}
            className="cursor-pointer"
            disabled={actionLoading === 'duplicate'}
          >
            {actionLoading === 'duplicate' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Nhân bản
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Secondary Actions */}
          <DropdownMenuItem 
            onClick={() => handleAction(() => onSettings?.(session))}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            Cài đặt
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleAction(() => setExportDialogOpen(true))}
            className="cursor-pointer"
            disabled={actionLoading === 'export'}
          >
            {actionLoading === 'export' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Xuất
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={() => handleAction(() => onShare?.(session))}
            className="cursor-pointer"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Chia sẻ
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Destructive Actions */}
          {session.status !== 'archived' && (
            <DropdownMenuItem 
              onClick={() => handleAction(() => onArchive?.(session))}
              className="cursor-pointer text-orange-600 focus:text-orange-600"
            >
              <Archive className="mr-2 h-4 w-4" />
              Lưu trữ
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem
            onClick={() => handleAction(() => setDeleteDialogOpen(true))}
            className="cursor-pointer text-red-600 focus:text-red-600"
            disabled={actionLoading === 'delete'}
          >
            {actionLoading === 'delete' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs */}
      <RenameSessionDialog
        session={session}
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        onRename={handleRename}
        loading={actionLoading === 'rename'}
      />

      <DuplicateSessionDialog
        session={session}
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onDuplicate={handleDuplicate}
        loading={actionLoading === 'duplicate'}
      />

      <ExportSessionDialog
        session={session}
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
        loading={actionLoading === 'export'}
      />

      <DeleteSessionDialog
        session={session}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleDelete}
        loading={actionLoading === 'delete'}
      />
    </>
  );
}