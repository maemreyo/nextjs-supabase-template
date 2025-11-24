import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Zap,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextStats {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
}

interface EditorStatusBarProps {
  textStats: TextStats;
  hasUnsavedChanges: boolean;
  isAnalyzing: boolean;
  lastAnalysisResult: {
    text: string;
    type: 'word' | 'sentence' | 'paragraph';
    data: any;
  } | null;
  onAnalyze: () => void;
  className?: string;
}

export function EditorStatusBar({
  textStats,
  hasUnsavedChanges,
  isAnalyzing,
  lastAnalysisResult,
  onAnalyze,
  className
}: EditorStatusBarProps) {
  return (
    <div className={cn("border-t p-3 flex items-center justify-between", className)}>
      <div className="flex items-center gap-4">
        {/* Text Statistics */}
        <div className="text-sm text-muted-foreground">
          {textStats.characters} ký tự • {textStats.words} từ • {textStats.sentences} câu • {textStats.paragraphs} đoạn
        </div>

        {/* Save Status */}
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-orange-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Có thay đổi chưa lưu (Ctrl+S để lưu)</span>
          </div>
        )}

        {!hasUnsavedChanges && lastAnalysisResult && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Đã lưu</span>
          </div>
        )}
      </div>

      {/* Analyze Button */}
      <Button 
        onClick={onAnalyze} 
        disabled={isAnalyzing} 
        size="sm"
      >
        {isAnalyzing ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang phân tích...</>
        ) : (
          <><Zap className="h-4 w-4 mr-2" />Phân tích</>
        )}
      </Button>
    </div>
  );
}

export default EditorStatusBar;