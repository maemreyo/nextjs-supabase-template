import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Volume2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Edit,
  Download,
  Plus,
  Play,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils'; // Đảm bảo bạn có utility này (thường mặc định khi cài shadcn)
import { AnalysisItemCardProps, DEFAULT_LAYOUTS, COMPACT_LAYOUTS } from '../types/analysis-types';
import { normalizePOS } from '../helpers/pos-normalizer';
import { useDialogDispatcher } from '../dialogs/utils/dialog-dispatcher';
import { ExportFormat } from '../dialogs/types/dialog-types';

export function AnalysisItemCard({
  analysis,
  onClick,
  onAnalyze,
  onRemove,
  compact = false,
  showPhonetic = true,
  truncateLength,
  layoutConfig = compact ? 'compact' : 'default',
  className,
  
  // Dialog system integration props
  enableDialogSystem = true,
  onViewDetails,
  onEdit,
  onExport,
  onAddToVocabulary,
  onPractice,
  dialogOptions,
  loading = false,
  error = null,
  ariaLabels,
}: AnalysisItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Dialog system integration
  const dialogDispatcher = useDialogDispatcher();

  // Layout Strategy
  const layoutStyle = layoutConfig === 'compact' ? COMPACT_LAYOUTS : DEFAULT_LAYOUTS;
  const activeLayout = layoutStyle[analysis.analysisType] || {};

  // Data Normalization Logic - Extracted for clarity
  const normalizedData = useMemo(() => {
    const commonProps = {
      phonetic: null as string | null,
      badges: [] as Array<{ label: string; variant?: 'default' | 'secondary' | 'outline' | 'destructive'; color?: string; icon?: React.ReactNode; tooltip?: string }>,
      isLongText: false,
    };

    switch (analysis.analysisType) {
      case 'word': {
        const posInfo = normalizePOS(analysis.pos);
        return {
          ...commonProps,
          title: analysis.word,
          subtitle: analysis.translation,
          phonetic: analysis.ipa,
          description: analysis.definition || analysis.contextMeaning,
          badges: [],
        };
      }
      case 'phrase': {
        const posInfo = normalizePOS(analysis.partOfSpeech);
        return {
          ...commonProps,
          title: analysis.phrase,
          subtitle: analysis.naturalTranslation || analysis.vietnameseTranslation,
          description: analysis.contextualMeaning || analysis.literalMeaning,
          badges: [
            ...(analysis.phraseType ? [{ label: analysis.phraseType, variant: 'secondary' as const }] : []),
          ],
        };
      }
      case 'sentence': {
        return {
          ...commonProps,
          title: analysis.sentence,
          subtitle: analysis.naturalTranslation,
          description: analysis.mainIdea,
          badges: [
            ...(analysis.sentenceType ? [{ label: analysis.sentenceType, variant: 'outline' as const }] : []),
          ],
        };
      }
      case 'paragraph': {
        return {
          ...commonProps,
          title: analysis.paragraph, // Will handle truncation in render
          subtitle: analysis.mainTopic,
          description: analysis.mainTopic, // Fallback description
          isLongText: true,
          badges: [
            ...(analysis.type ? [{ label: analysis.type, variant: 'outline' as const }] : []),
            ...(analysis.sentimentLabel ? [{ label: analysis.sentimentLabel, variant: 'secondary' as const }] : []),
          ],
        };
      }
      default:
        return null;
    }
  }, [analysis]);

  if (!normalizedData) return null;

  // Render Helpers
  const isWordOrPhrase = analysis.analysisType === 'word' || analysis.analysisType === 'phrase';

  // Multi-line truncation configuration for each analysis type
  const getTruncationConfig = (type: string) => {
    switch (type) {
      case 'word':
        return { titleLines: 1, subtitleLines: 1 };
      case 'phrase':
        return { titleLines: 2, subtitleLines: 1 };
      case 'sentence':
        return { titleLines: 2, subtitleLines: 2 };
      case 'paragraph':
        return { titleLines: 3, subtitleLines: 2 };
      default:
        return { titleLines: 1, subtitleLines: 1 };
    }
  };

  const truncationConfig = getTruncationConfig(analysis.analysisType);

  // Description Truncation Logic
  const descriptionText = normalizedData.description || '';
  const shouldTruncateDesc = truncateLength && descriptionText.length > truncateLength;
  const displayDescription = shouldTruncateDesc && !isExpanded
    ? `${descriptionText.substring(0, truncateLength)}...`
    : descriptionText;

  // Title Truncation Logic - use truncateLength instead of hardcoded 100
  const displayTitle = normalizedData.isLongText && truncateLength
    ? (normalizedData.title.length > truncateLength ? `${normalizedData.title.substring(0, truncateLength)}...` : normalizedData.title)
    : normalizedData.title;

  const handlePronounce = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleCardClick = () => {
    console.log(`[AnalysisItemCard] handleCardClick - enableDialogSystem: ${enableDialogSystem}, analysisType: ${analysis.analysisType}`);
    if (enableDialogSystem && onViewDetails) {
      dialogDispatcher.openViewDetails(analysis, dialogOptions, onClick);
    } else {
      onClick?.(analysis);
    }
  };

  // Dialog system click handlers
  const handleViewDetails = useCallback(() => {
    if (enableDialogSystem && onViewDetails) {
      dialogDispatcher.openViewDetails(analysis, dialogOptions, onClick);
    } else {
      onClick?.(analysis);
    }
  }, [analysis, enableDialogSystem, onViewDetails, onClick, dialogOptions, dialogDispatcher]);

  const handleEdit = useCallback(() => {
    if (enableDialogSystem && onEdit) {
      dialogDispatcher.openEditDialog(analysis, dialogOptions, onAnalyze);
    } else {
      onAnalyze?.(analysis);
    }
  }, [analysis, enableDialogSystem, onEdit, onAnalyze, dialogOptions, dialogDispatcher]);

  const handleExport = useCallback((format?: ExportFormat) => {
    if (enableDialogSystem && onExport) {
      dialogDispatcher.openExportDialog(analysis, format, () => {
        // Fallback: try to download as JSON
        const dataStr = JSON.stringify(analysis, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${analysis.analysisType}-${analysis.id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } else {
      // Fallback export behavior
      const dataStr = JSON.stringify(analysis, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${analysis.analysisType}-${analysis.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [analysis, enableDialogSystem, onExport, dialogDispatcher]);

  const handleAddToVocabulary = useCallback(() => {
    if (enableDialogSystem && onAddToVocabulary) {
      dialogDispatcher.addToVocabulary(analysis, () => {
        // Fallback: log to console
        console.log('Added to vocabulary:', analysis);
      });
    } else {
      // Fallback: log to console
      console.log('Added to vocabulary:', analysis);
    }
  }, [analysis, enableDialogSystem, onAddToVocabulary, dialogDispatcher]);

  const handlePractice = useCallback(() => {
    if (enableDialogSystem && onPractice) {
      dialogDispatcher.openPracticeDialog(analysis, onAnalyze);
    } else {
      onAnalyze?.(analysis);
    }
  }, [analysis, enableDialogSystem, onPractice, onAnalyze, dialogDispatcher]);

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between transition-all duration-200",
        "hover:shadow-md hover:border-primary/50",
        "cursor-pointer bg-card text-card-foreground",
        activeLayout.maxHeight,
        loading && "opacity-50 cursor-not-allowed",
        error && "border-destructive/50",
        className
      )}
      onClick={loading ? undefined : handleCardClick}
      aria-busy={loading}
      aria-invalid={!!error}
    >
      <CardHeader className={cn("p-4 pb-2 space-y-0", activeLayout.cardPadding)}>
        <div className="flex items-start justify-between gap-2">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-semibold leading-none tracking-tight",
                `line-clamp-${truncationConfig.titleLines}`,
                activeLayout.titleSize
              )}>
                {displayTitle.toLowerCase()}
              </h3>

              {/* Badges List */}
              {normalizedData.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {normalizedData.badges.map((badge: any, index) => {
                    const BadgeEl = (
                      <Badge
                        key={index}
                        variant={badge.variant || 'outline'}
                        className={cn(
                          "text-[10px] px-1.5 h-5 font-normal border-transparent bg-secondary/50 text-secondary-foreground hover:bg-secondary/70",
                          badge.color // Allow custom color override if really needed, but try to rely on variant
                        )}
                      >
                        {badge.icon && <span className="mr-1">{badge.icon}</span>}
                        {badge.label}
                      </Badge>
                    );

                    return BadgeEl;
                  })}
                </div>
              )}

              {/* Phonetic Badge */}
              {showPhonetic && normalizedData.phonetic && (
                <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground font-mono">
                  {normalizedData.phonetic}
                </span>
              )}


            </div>
            {/* POS Badge */}
            {isWordOrPhrase && (
              (analysis.analysisType === 'word' && analysis.pos) ||
              (analysis.analysisType === 'phrase' && analysis.partOfSpeech)
            ) && (
                <span className="text-xs text-muted-foreground font-mono">
                  {(analysis.analysisType === 'word' ? analysis.pos : analysis.partOfSpeech)?.toLowerCase()}
                </span>
              )}
            {/* Subtitle / Translation */}
            {normalizedData.subtitle && (
              <p className={cn(
                "text-sm text-muted-foreground mt-4",
                `line-clamp-${truncationConfig.subtitleLines}`
              )}>
                {normalizedData.subtitle.toLowerCase()}
              </p>
            )}
          </div>

          {/* Actions Area */}
          <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {isWordOrPhrase && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePronounce(normalizedData.title);
                }}
              >
                <Volume2 className="h-4 w-4" />
                <span className="sr-only">Phát âm</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Thêm</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* View Details */}
                <DropdownMenuItem
                  onClick={handleViewDetails}
                  aria-label={ariaLabels?.viewDetails || `Xem chi tiết ${analysis.analysisType}`}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiết
                </DropdownMenuItem>
                
                {/* Edit */}
                <DropdownMenuItem
                  onClick={handleEdit}
                  aria-label={ariaLabels?.edit || `Chỉnh sửa ${analysis.analysisType}`}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                
                {/* Original Analyze */}
                {onAnalyze && (
                  <DropdownMenuItem onClick={() => onAnalyze(analysis)}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Phân tích chi tiết
                  </DropdownMenuItem>
                )}
                
                {/* Pronunciation */}
                {normalizedData.phonetic && (
                  <DropdownMenuItem
                    onClick={() => handlePronounce(normalizedData.title)}
                    aria-label={ariaLabels?.practice || `Phát âm ${normalizedData.title}`}
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Phát âm
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                {/* Export */}
                <DropdownMenuItem
                  onClick={() => handleExport()}
                  aria-label={ariaLabels?.export || `Xuất ${analysis.analysisType}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Xuất
                </DropdownMenuItem>
                
                {/* Add to Vocabulary */}
                <DropdownMenuItem
                  onClick={handleAddToVocabulary}
                  aria-label={ariaLabels?.addToVocabulary || `Thêm vào từ vựng`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm vào từ vựng
                </DropdownMenuItem>
                
                {/* Practice */}
                <DropdownMenuItem
                  onClick={handlePractice}
                  aria-label={ariaLabels?.practice || `Luyện tập ${analysis.analysisType}`}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Luyện tập
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Remove */}
                <DropdownMenuItem
                  onClick={() => onRemove?.(analysis.analysisId, analysis.analysisType)}
                  className="text-destructive focus:text-destructive"
                  aria-label={ariaLabels?.remove || `Xóa ${analysis.analysisType}`}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Xóa khỏi danh sách
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <p className="text-xs text-destructive">{error}</p>
            <button
              onClick={() => {/* Clear error handler could be passed as prop */}}
              className="ml-auto text-destructive hover:text-destructive/80"
              aria-label="Đóng thông báo lỗi"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent"></div>
            <span className="text-xs text-muted-foreground">Đang xử lý...</span>
          </div>
        </div>
      )}
    </Card>
  );
}

export default AnalysisItemCard;