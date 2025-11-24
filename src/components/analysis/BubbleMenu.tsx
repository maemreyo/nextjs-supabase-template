import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookMarked,
  Loader2,
  Save,
  Volume2,
  Highlighter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Memoized BubbleMenu with custom comparison to avoid unnecessary re-renders
const MemoizedBubbleMenu = React.memo(function BubbleMenu({
  position,
  selection,
  analysisType,
  isAnalyzing,
  isSaving,
  lastAnalysisResult,
  autoSaveEnabled,
  sessionId,
  onAnalyze,
  onSave,
  onPronounce,
  onHighlight,
  className
}: BubbleMenuProps) {
  if (!position.show) {
    return null;
  }

  return (
    <div
      data-bubble-menu
      className={cn(
        "fixed bg-background rounded-lg shadow-lg border border-border p-2 flex items-center gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      {/* Selection Type Badge */}
      <Badge variant="secondary" className="text-xs px-2 border-r">
        {selection.type}
      </Badge>

      {/* Analyze Button */}
      <Button
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className="h-7 px-2 text-xs"
      >
        <BookMarked size={12} className="mr-1" />
        {isAnalyzing ? 'Analyzing...' : 'Analyze'}
      </Button>

      {/* Save Button - Only show if there's a last analysis result and auto-save is disabled */}
      {lastAnalysisResult && !autoSaveEnabled && (
        <Button
          size="sm"
          variant="outline"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onSave}
          disabled={isSaving}
          className="h-7 px-2 text-xs"
          title={sessionId ? "Lưu kết quả phân tích vào session" : "Lưu kết quả phân tích"}
        >
          {isSaving ? (
            <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Đang lưu...</>
          ) : (
            <><Save size={12} className="mr-1" />{sessionId ? 'Lưu vào session' : 'Lưu'}</>
          )}
        </Button>
      )}

      {/* Pronounce Button */}
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onPronounce(selection.text)}
        className="h-7 w-7 p-0"
        title="Pronounce"
      >
        <Volume2 size={14} />
      </Button>

      {/* Highlight Button */}
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onHighlight('#fef08a')}
        className="h-7 w-7 p-0"
        title="Highlight"
      >
        <Highlighter size={14} />
      </Button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if these critical props change
  return (
    prevProps.position.x === nextProps.position.x &&
    prevProps.position.y === nextProps.position.y &&
    prevProps.position.show === nextProps.position.show &&
    prevProps.selection.text === nextProps.selection.text &&
    prevProps.selection.type === nextProps.selection.type &&
    prevProps.analysisType === nextProps.analysisType &&
    prevProps.isAnalyzing === nextProps.isAnalyzing &&
    prevProps.isSaving === nextProps.isSaving &&
    prevProps.autoSaveEnabled === nextProps.autoSaveEnabled &&
    prevProps.sessionId === nextProps.sessionId &&
    prevProps.className === nextProps.className &&
    // Compare lastAnalysisResult by text and type only (not the entire data object)
    (prevProps.lastAnalysisResult?.text === nextProps.lastAnalysisResult?.text &&
     prevProps.lastAnalysisResult?.type === nextProps.lastAnalysisResult?.type)
    // Note: We intentionally don't compare functions (onAnalyze, onSave, etc.)
    // as they should be stable references from the parent component
  );
});

interface TextSelection {
  text: string;
  type: 'word' | 'sentence' | 'paragraph';
}

interface BubbleMenuPosition {
  x: number;
  y: number;
  show: boolean;
}

interface BubbleMenuProps {
  position: BubbleMenuPosition;
  selection: TextSelection;
  analysisType: 'word' | 'sentence' | 'paragraph';
  isAnalyzing: boolean;
  isSaving: boolean;
  lastAnalysisResult: {
    text: string;
    type: 'word' | 'sentence' | 'paragraph';
    data: any;
  } | null;
  autoSaveEnabled: boolean;
  sessionId?: string;
  onAnalyze: () => void;
  onSave: () => void;
  onPronounce: (text: string) => void;
  onHighlight: (color: string) => void;
  className?: string;
}

// Export the memoized component as default
export default MemoizedBubbleMenu;

// Also export the original component name for compatibility
export const BubbleMenu = MemoizedBubbleMenu;