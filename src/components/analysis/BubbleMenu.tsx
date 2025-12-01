import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookMarked,
  Loader2,
  Save,
  Volume2,
  Highlighter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { clientLogger, analysisLogger } from '@/services/logger';

// Highlight colors
const HIGHLIGHT_COLORS = [
  { value: '#fef08a', label: 'Yellow', className: 'bg-yellow-200' },
  { value: '#bfdbfe', label: 'Blue', className: 'bg-blue-200' },
  { value: '#bbf7d0', label: 'Green', className: 'bg-green-200' },
  { value: '#fecaca', label: 'Red', className: 'bg-red-200' },
  { value: '#e9d5ff', label: 'Purple', className: 'bg-purple-200' },
  { value: '#fed7aa', label: 'Orange', className: 'bg-orange-200' },
];

// Type-safe mapping for analysis type to color index
const TYPE_TO_COLOR_INDEX: Record<'word' | 'phrase' | 'sentence' | 'paragraph', number> = {
  word: 3,      // Red #fecaca - boldest
  phrase: 5,    // Orange #fed7aa
  sentence: 4,  // Purple #e9d5ff
  paragraph: 0, // Yellow #fef08a - lightest
};

// Text-to-Speech function
const speakText = (text: string, lang: string = 'en-US') => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }
};

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
  onDynamicIslandTrigger, // New callback to trigger Dynamic Island
  className
}: BubbleMenuProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentColorIndex, setCurrentColorIndex] = useState(0);
  
  // Ref để theo dõi việc gọi onAnalyze để tránh multiple calls
  const analyzeCallRef = useRef(false);
  const lastAnalysisTimeRef = useRef<number>(0);

  // Handle analyze button click - trigger Dynamic Island
  const handleAnalyzeClick = useCallback(() => {
    // Ngăn chặn multiple calls trong khoảng thời gian ngắn
    const now = Date.now();
    if (analyzeCallRef.current || (now - lastAnalysisTimeRef.current < 3000)) {
      clientLogger.debug('BubbleMenu', { type: 'analyze_click_throttled', timeSinceLastCall: now - lastAnalysisTimeRef.current });
      return;
    }
    
    // Đặt flag để ngăn chặn additional calls
    analyzeCallRef.current = true;
    lastAnalysisTimeRef.current = now;
    
    clientLogger.info('BubbleMenu', { type: 'analyze_clicked', selectionText: selection.text, selectionType: selection.type });
    
    onDynamicIslandTrigger?.();
    onAnalyze();
    
    // Apply automatic highlighting based on analysis type
    const colorIndex = TYPE_TO_COLOR_INDEX[analysisType];
    const autoColor = HIGHLIGHT_COLORS[colorIndex] as any;
    setCurrentColorIndex(colorIndex);
    onHighlight(autoColor.value);
    
    analysisLogger.info('Auto-highlight applied on Analyze click', {
      analysisType,
      color: autoColor.value,
      colorLabel: autoColor.label,
      selectionText: selection.text
    });
    
    // Reset flag sau 3 giây
    setTimeout(() => {
      analyzeCallRef.current = false;
    }, 3000);
  }, [onDynamicIslandTrigger, onAnalyze, selection.text, selection.type]);

  const handlePronounce = useCallback(() => {
    clientLogger.info('BubbleMenu', { type: 'pronounce_clicked', text: selection.text, isSpeaking });
    
    if (isSpeaking) {
      // Stop speaking
      clientLogger.debug('BubbleMenu', { type: 'pronounce_stopped' });
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Start speaking
      clientLogger.debug('BubbleMenu', { type: 'pronounce_started', text: selection.text });
      setIsSpeaking(true);
      speakText(selection.text);

      // Reset speaking state when done
      const checkSpeaking = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clientLogger.debug('BubbleMenu', { type: 'pronounce_completed' });
          setIsSpeaking(false);
          clearInterval(checkSpeaking);
        }
      }, 100);
    }

    // Call the original onPronounce if provided
    onPronounce?.(selection.text);
  }, [isSpeaking, onPronounce, selection.text]);

  const handlePrevColor = useCallback(() => {
    const newIndex = (currentColorIndex - 1 + HIGHLIGHT_COLORS.length) % HIGHLIGHT_COLORS.length;
    const color = HIGHLIGHT_COLORS[newIndex];
    clientLogger.debug('BubbleMenu', { type: 'highlight_color_changed', direction: 'prev', newIndex, color: color?.label || 'Unknown' });
    setCurrentColorIndex(newIndex);
  }, [currentColorIndex]);

  const handleNextColor = useCallback(() => {
    const newIndex = (currentColorIndex + 1) % HIGHLIGHT_COLORS.length;
    const color = HIGHLIGHT_COLORS[newIndex];
    clientLogger.debug('BubbleMenu', { type: 'highlight_color_changed', direction: 'next', newIndex, color: color?.label || 'Unknown' });
    setCurrentColorIndex(newIndex);
  }, [currentColorIndex]);

  const currentColor = HIGHLIGHT_COLORS[currentColorIndex] || HIGHLIGHT_COLORS[0] as any;

  // Early return sau khi tất cả hooks đã được khai báo
  if (!position.show) {
    return null;
  }

  return (
    <>
      {/* Bubble Menu */}
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
        {/* Analyze Button */}
        <Button
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAnalyzeClick}
          disabled={isAnalyzing || analyzeCallRef.current}
          className="h-7 px-2 text-xs"
          title={isAnalyzing ? 'Đang phân tích...' : analyzeCallRef.current ? 'Vui lòng đợi...' : 'Phân tích'}
        >
          <BookMarked size={12} className="mr-1" />
          {isAnalyzing ? 'Analyzing...' : analyzeCallRef.current ? 'Đang xử lý...' : 'Analyze'}
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
          onClick={handlePronounce}
          className={cn(
            "h-7 w-7 p-0",
            isSpeaking && "bg-primary/10"
          )}
          title={isSpeaking ? "Stop pronunciation" : "Pronounce"}
        >
          <Volume2 size={14} className={cn(isSpeaking && "text-primary animate-pulse")} />
        </Button>

        {/* Highlight Color Picker with Navigation */}
        <div className="flex items-center gap-1">
          <div className="w-px h-5 bg-border mx-1" />

          {/* Previous Color Button */}
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handlePrevColor}
            className="h-7 w-6 p-0"
            title="Previous color"
          >
            <ChevronLeft size={12} />
          </Button>

          {/* Current Color Button */}
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              clientLogger.info('BubbleMenu', { type: 'highlight_applied', color: currentColor.value, colorLabel: currentColor.label, text: selection.text });
              onHighlight(currentColor.value);
            }}
            className="h-7 px-0 py-0"
            title={`Highlight with ${currentColor.label}`}
          >
            <div
              className={cn("w-4 h-4 rounded border border-border", currentColor?.className)}
            />
          </Button>

          {/* Next Color Button */}
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleNextColor}
            className="h-7 w-6 p-0"
            title="Next color"
          >
            <ChevronRight size={12} />
          </Button>
        </div>
      </div>
    </>
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
  type: 'word' | 'phrase' | 'sentence' | 'paragraph';
}

interface BubbleMenuPosition {
  x: number;
  y: number;
  show: boolean;
}

interface BubbleMenuProps {
  position: BubbleMenuPosition;
  selection: TextSelection;
  analysisType: 'word' | 'phrase' | 'sentence' | 'paragraph';
  isAnalyzing: boolean;
  isSaving: boolean;
  lastAnalysisResult: {
    text: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    data: any;
  } | null;
  autoSaveEnabled: boolean;
  sessionId?: string;
  onAnalyze: () => void;
  onSave: () => void;
  onPronounce?: (text: string) => void;
  onHighlight: (color: string) => void;
  onDynamicIslandTrigger?: () => void; // New callback to trigger Dynamic Island
  className?: string;
}

// Export the memoized component as default
export default MemoizedBubbleMenu;

// Also export the original component name for compatibility
export const BubbleMenu = MemoizedBubbleMenu;