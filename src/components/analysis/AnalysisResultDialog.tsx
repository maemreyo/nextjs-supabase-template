import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download, Share2, Maximize2, Minimize2, Printer,
  FileText, BookOpen, AlignLeft, Check
} from 'lucide-react';
import { cn } from "@/lib/utils";
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';
import {
  WordAnalysisView,
  SentenceAnalysisView,
  ParagraphAnalysisView
} from './AnalysisViews';
import { useAnalysisActions } from '@/hooks/useAnalysisActions';

interface AnalysisMetadata {
  processingTime?: number;
  tokensUsed?: number;
  model?: string;
  provider?: string;
}

interface AnalysisResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  analysisType: 'word' | 'sentence' | 'paragraph';
  originalText?: string;
  processingTime?: number;
  tokensUsed?: number;
  model?: string;
  provider?: string;
  // Metadata aggregation support
  meta?: AnalysisMetadata;
}

export function AnalysisResultDialog({
  isOpen,
  onClose,
  analysis,
  analysisType,
  originalText,
  processingTime,
  tokensUsed,
  model,
  provider,
  meta
}: AnalysisResultDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Ref for content printing
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Aggregate metadata from individual props or meta object
  const metadata = useMemo(() => {
    if (meta) return meta;
    return {
      processingTime,
      tokensUsed,
      model,
      provider
    };
  }, [meta, processingTime, tokensUsed, model, provider]);

  // Use analysis actions hook
  const { handleExport, handlePrint, handleShare } = useAnalysisActions({
    analysis,
    analysisType,
    contentRef: contentRef as React.RefObject<HTMLDivElement>,
    metadata
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onClose();
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsFullscreen(!isFullscreen);
          }
          break;
        case 'p':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlePrint();
          }
          break;
        case 'e':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleExport();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose, handleExport, handlePrint]);

  const onShareClick = async () => {
    const result = await handleShare();
    if (result.method === 'clipboard' || result.method === 'share') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get appropriate icon based on analysis type
  const Icon = useMemo(() => {
    if (analysisType === 'word') return BookOpen;
    if (analysisType === 'sentence') return AlignLeft;
    return FileText;
  }, [analysisType]);

  if (!analysis) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "flex flex-col p-0 gap-0 transition-all duration-300",
          isFullscreen 
            ? "w-screen h-screen max-w-none rounded-none border-0" 
            : "max-w-4xl h-[85vh] sm:rounded-xl"
        )}
      >
        {/* 1. Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b bg-muted/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md text-primary">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <DialogTitle className="text-lg font-semibold leading-none">Kết quả phân tích</DialogTitle>
                <DialogDescription className="text-xs mt-1">
                   {analysisType === 'word' ? 'Từ vựng' : analysisType === 'sentence' ? 'Câu văn' : 'Đoạn văn'}
                </DialogDescription>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-normal gap-2">
             <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleExport()} title="Export (Ctrl+E)" className="h-8 w-8">
                    <Download className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handlePrint()} title="Print (Ctrl+P)" className="h-8 w-8">
                    <Printer className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onShareClick} title="Share" className="h-8 w-8">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4 text-muted-foreground" />}
                </Button>
             </div>
             <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen (Ctrl+F)" className="h-8 w-8">
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
             </Button>
          </div>
        </div>

        {/* 2. Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-muted/5">
            {/* Original Text Toggle - Only show if originalText exists */}
            {originalText && (
                <div className="px-4 py-2 bg-background border-b flex justify-between items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-2"
                        onClick={() => setShowOriginal(!showOriginal)}
                    >
                       <FileText className="w-3 h-3" />
                       {showOriginal ? 'Ẩn văn bản gốc' : 'Xem văn bản gốc'}
                    </Button>
                </div>
            )}

            {/* Analysis View */}
            <ScrollArea className="flex-1 h-full">
                 <div className="p-4 md:p-6 max-w-5xl mx-auto" ref={contentRef}>
                     {/* Optional Original Text Block */}
                     {showOriginal && originalText && (
                         <div className="mb-6 p-4 bg-background border rounded-lg shadow-sm animate-in slide-in-from-top-2">
                             <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Văn bản gốc</h4>
                             <p className="text-sm italic text-foreground/90 leading-relaxed">"{originalText}"</p>
                         </div>
                     )}

                     {/* Analysis Content */}
                     <div className="mt-0 h-full border-0 p-0">
                        {analysisType === 'word' && <WordAnalysisView data={analysis as WordAnalysis} />}
                        {analysisType === 'sentence' && <SentenceAnalysisView data={analysis as SentenceAnalysis} />}
                        {analysisType === 'paragraph' && <ParagraphAnalysisView data={analysis as ParagraphAnalysis} />}
                     </div>
                 </div>
            </ScrollArea>
            
            {/* 3. Footer / Status Bar */}
            {metadata && (
                <div className="bg-background border-t px-4 py-1.5 flex justify-between items-center text-[10px] text-muted-foreground">
                    <div className="flex gap-4">
                         {metadata.processingTime && <span>Time: {metadata.processingTime}ms</span>}
                         {metadata.tokensUsed && <span>Tokens: {metadata.tokensUsed}</span>}
                    </div>
                    <div>
                         Generated at {new Date().toLocaleTimeString()}
                    </div>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AnalysisResultDialog;