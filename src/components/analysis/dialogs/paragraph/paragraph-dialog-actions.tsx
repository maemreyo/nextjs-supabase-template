import React, { useState, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Download, 
  Share2, 
  Printer, 
  Copy, 
  Edit, 
  Trash2, 
  BookOpen, 
  MoreHorizontal,
  Volume2,
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  Brain,
  GitBranch,
  Mic,
  Settings,
  Target,
  Hash,
  TrendingUp,
  Star,
  User,
  BarChart3,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';
import { ParagraphAnalysis } from '../../types/analysis-types';
import { ExportFormat } from '../types/dialog-types';
import {
  ParagraphDialogActionsProps,
  ParagraphDialogActionConfig,
} from './paragraph-dialog-types';
import { Button } from '../../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '../../../ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Paragraph Dialog Actions Component
 * Provides action buttons and dropdown menu for paragraph analysis dialog
 */
export const ParagraphDialogActions: React.FC<ParagraphDialogActionsProps> = ({
  analysis,
  onAddToVocabulary,
  onExport,
  onShare,
  onPrint,
  onEdit,
  onDelete,
  onPractice,
  onSummarize,
  onAnalyzeStructure,
  onAnalyzeKeywords,
  onCopy,
  loading = {},
  disabled = false,
  compact = false,
  className,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  // Handle copy functionality
  const handleCopy = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(type);
      onCopy?.(text);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [onCopy]);

  // Handle export functionality
  const handleExportAction = useCallback((format: ExportFormat) => {
    onExport?.(analysis, format);
  }, [analysis, onExport]);

  // Handle share functionality
  const handleShare = useCallback(() => {
    onShare?.(analysis);
  }, [analysis, onShare]);

  // Handle print functionality
  const handlePrint = useCallback(() => {
    onPrint?.(analysis);
  }, [analysis, onPrint]);

  // Handle add to vocabulary
  const handleAddToVocabulary = useCallback(() => {
    onAddToVocabulary?.(analysis);
  }, [analysis, onAddToVocabulary]);

  // Handle edit
  const handleEdit = useCallback(() => {
    onEdit?.(analysis);
  }, [analysis, onEdit]);

  // Handle delete
  const handleDelete = useCallback(() => {
    if (window.confirm(`Bạn có chắc muốn xóa đoạn văn này?`)) {
      onDelete?.(analysis.id);
    }
  }, [analysis, onDelete]);

  // Handle practice
  const handlePractice = useCallback(() => {
    onPractice?.(analysis.paragraph);
  }, [analysis, onPractice]);

  // Handle summarize
  const handleSummarize = useCallback(() => {
    onSummarize?.(analysis.paragraph);
  }, [analysis, onSummarize]);

  // Handle structure analysis
  const handleAnalyzeStructure = useCallback(() => {
    onAnalyzeStructure?.(analysis.paragraph);
  }, [analysis, onAnalyzeStructure]);

  // Handle keywords analysis
  const handleAnalyzeKeywords = useCallback(() => {
    const keywords = selectedKeywords.length > 0 ? selectedKeywords : (analysis.keywords || []);
    onAnalyzeKeywords?.(keywords);
  }, [analysis, selectedKeywords, onAnalyzeKeywords]);

  // Handle pronunciation
  const handlePronounce = useCallback(() => {
    // This would typically use a text-to-speech API
    const utterance = new SpeechSynthesisUtterance(analysis.paragraph);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }, [analysis.paragraph]);

  // Action configuration
  const actionConfig: ParagraphDialogActionConfig = useMemo(() => ({
    primary: [
      {
        label: 'Thêm vào từ vựng',
        icon: <Plus className="h-4 w-4" />,
        onClick: handleAddToVocabulary,
        disabled: loading['addToVocabulary'] || disabled,
        loading: loading['addToVocabulary'] || false,
        hidden: true,
      },
      {
        label: 'Luyện tập',
        icon: <BookOpen className="h-4 w-4" />,
        onClick: handlePractice,
        disabled: loading['practice'] || disabled,
        loading: loading['practice'] || false,
        hidden: true,
      },
    ],
    secondary: [
      {
        label: 'Phát âm',
        icon: <Volume2 className="h-4 w-4" />,
        onClick: handlePronounce,
        disabled: disabled,
        loading: false,
      },
      {
        label: 'Tóm tắt',
        icon: <Sparkles className="h-4 w-4" />,
        onClick: handleSummarize,
        disabled: loading['summarize'] || disabled,
        loading: loading['summarize'] || false,
      },
      {
        label: 'Phân tích cấu trúc',
        icon: <GitBranch className="h-4 w-4" />,
        onClick: handleAnalyzeStructure,
        disabled: loading['analyzeStructure'] || disabled,
        loading: loading['analyzeStructure'] || false,
      },
      {
        label: 'Phân tích từ khóa',
        icon: <Hash className="h-4 w-4" />,
        onClick: handleAnalyzeKeywords,
        disabled: loading['analyzeKeywords'] || disabled,
        loading: loading['analyzeKeywords'] || false,
      },
      {
        label: 'Chia sẻ',
        icon: <Share2 className="h-4 w-4" />,
        onClick: handleShare,
        disabled: loading['share'] || disabled,
        loading: loading['share'] || false,
      },
    ],
    dropdown: [
      {
        label: 'Sao chép đoạn văn',
        icon: <Copy className="h-4 w-4" />,
        onClick: () => handleCopy(analysis.paragraph, 'paragraph'),
        disabled: false,
        loading: false,
      },
      {
        label: 'Sao chép chủ đề',
        icon: <Target className="h-4 w-4" />,
        onClick: () => handleCopy(analysis.mainTopic || '', 'mainTopic'),
        disabled: !analysis.mainTopic,
        loading: false,
      },
      {
        label: 'Sao chép từ khóa',
        icon: <Hash className="h-4 w-4" />,
        onClick: () => handleCopy((analysis.keywords || []).join(', '), 'keywords'),
        disabled: !analysis.keywords || analysis.keywords.length === 0,
        loading: false,
      },
      {
        label: 'Sao chép phiên bản cải tiến',
        icon: <Sparkles className="h-4 w-4" />,
        onClick: () => handleCopy(analysis.betterVersion || '', 'betterVersion'),
        disabled: !analysis.betterVersion,
        loading: false,
      },
      {
        label: 'Sao chép tất cả',
        icon: <File className="h-4 w-4" />,
        onClick: () => handleCopy(
          `${analysis.paragraph}\n\nChủ đề: ${analysis.mainTopic || ''}\n\nTừ khóa: ${(analysis.keywords || []).join(', ')}\n\nPhiên bản cải tiến: ${analysis.betterVersion || ''}`,
          'all'
        ),
        disabled: false,
        loading: false,
      },
      {
        label: 'Chỉnh sửa',
        icon: <Edit className="h-4 w-4" />,
        onClick: handleEdit,
        disabled: loading['edit'] || disabled,
        loading: loading['edit'] || false,
      },
      {
        label: 'In',
        icon: <Printer className="h-4 w-4" />,
        onClick: handlePrint,
        disabled: loading['print'] || disabled,
        loading: loading['print'] || false,
      },
    ],
  }), [
    analysis,
    loading,
    disabled,
    handleAddToVocabulary,
    handlePractice,
    handlePronounce,
    handleSummarize,
    handleAnalyzeStructure,
    handleAnalyzeKeywords,
    handleShare,
    handleCopy,
    handleEdit,
    handlePrint,
  ]);

  // Export options for dropdown
  const exportOptions = useMemo(() => [
    {
      label: 'Xuất ra PDF',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => handleExportAction('pdf'),
      disabled: loading['export-pdf'] || disabled,
      loading: loading['export-pdf'] || false,
    },
    {
      label: 'Xuất ra JSON',
      icon: <FileCode className="h-4 w-4" />,
      onClick: () => handleExportAction('json'),
      disabled: loading['export-json'] || disabled,
      loading: loading['export-json'] || false,
    },
    {
      label: 'Xuất ra CSV',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      onClick: () => handleExportAction('csv'),
      disabled: loading['export-csv'] || disabled,
      loading: loading['export-csv'] || false,
    },
    {
      label: 'Xuất ra TXT',
      icon: <FileText className="h-4 w-4" />,
      onClick: () => handleExportAction('txt'),
      disabled: loading['export-txt'] || disabled,
      loading: loading['export-txt'] || false,
    },
    {
      label: 'Xuất ra HTML',
      icon: <FileCode className="h-4 w-4" />,
      onClick: () => handleExportAction('html'),
      disabled: loading['export-html'] || disabled,
      loading: loading['export-html'] || false,
    },
  ], [loading, disabled, handleExportAction]);

  if (compact) {
    // Filter out hidden actions for compact mode
    const visiblePrimaryActions = actionConfig.primary.filter(action => !action.hidden);
    
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {visiblePrimaryActions.length > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={visiblePrimaryActions[0]!.onClick}
            disabled={visiblePrimaryActions[0]!.disabled}
            className="flex-1"
          >
            {visiblePrimaryActions[0]!.loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent mr-2"></div>
            ) : (
              visiblePrimaryActions[0]!.icon
            )}
            {visiblePrimaryActions[0]!.label}
          </Button>
        )}
        
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {actionConfig.dropdown.map((action, index) => (
              <DropdownMenuItem
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent mr-2"></div>
                ) : (
                  action.icon
                )}
                {action.label}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Xuất</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {exportOptions.map((option, index) => (
              <DropdownMenuItem
                key={index}
                onClick={option.onClick}
                disabled={option.disabled}
              >
                {option.loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent mr-2"></div>
                ) : (
                  option.icon
                )}
                {option.label}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={loading['delete'] || disabled}
              className="text-destructive focus:text-destructive"
            >
              {loading['delete'] ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive border-t-transparent mr-2"></div>
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Primary Actions */}
      <div className="flex flex-wrap gap-2">
        {actionConfig.primary.filter(action => !action.hidden).map((action, index) => (
          <Button
            key={index}
            variant="default"
            onClick={action.onClick}
            disabled={action.disabled}
            className="flex-1 min-w-[120px]"
          >
            {action.loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent mr-2"></div>
            ) : (
              action.icon
            )}
            {action.label}
          </Button>
        ))}
      </div>

      {/* Secondary Actions */}
      <div className="flex flex-wrap gap-2">
        {actionConfig.secondary.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent mr-2"></div>
            ) : (
              action.icon
            )}
            {action.label}
          </Button>
        ))}
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Xuất:</span>
        <div className="flex flex-wrap gap-2">
          {exportOptions.slice(0, 3).map((option, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={option.onClick}
              disabled={option.disabled}
              className="h-8 px-2"
            >
              {option.loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary border-t-transparent"></div>
              ) : (
                option.icon
              )}
            </Button>
          ))}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {exportOptions.slice(3).map((option, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={option.onClick}
                  disabled={option.disabled}
                >
                  {option.loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent mr-2"></div>
                  ) : (
                    option.icon
                  )}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Copy Actions */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sao chép:</span>
        <div className="flex flex-wrap gap-2">
          {actionConfig.dropdown.slice(0, 3).map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="h-8 px-2"
            >
              {action.loading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary border-t-transparent"></div>
              ) : (
                action.icon
              )}
              {copiedText === (index === 0 ? 'paragraph' : index === 1 ? 'mainTopic' : 'keywords') ? (
                <span className="text-xs text-green-600 ml-1">✓</span>
              ) : null}
            </Button>
          ))}
        </div>
      </div>

      {/* Edit and Delete Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          variant="outline"
          onClick={handleEdit}
          disabled={loading['edit'] || disabled}
          className="flex-1"
        >
          {loading['edit'] ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent mr-2"></div>
          ) : (
            <Edit className="h-4 w-4 mr-2" />
          )}
          Chỉnh sửa
        </Button>
        
        <Button
          variant="outline"
          onClick={handlePrint}
          disabled={loading['print'] || disabled}
          className="flex-1"
        >
          {loading['print'] ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent mr-2"></div>
          ) : (
            <Printer className="h-4 w-4 mr-2" />
          )}
          In
        </Button>
        
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={loading['delete'] || disabled}
        >
          {loading['delete'] ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive border-t-transparent mr-2"></div>
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Xóa
        </Button>
      </div>
    </div>
  );
};

export default ParagraphDialogActions;