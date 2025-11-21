import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Download, Share2 } from 'lucide-react';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';
import { WordAnalysisDisplay } from './WordAnalysisDisplay';
import { SentenceAnalysisDisplay } from './SentenceAnalysisDisplay';
import { ParagraphAnalysisDisplay } from './ParagraphAnalysisDisplay';

interface AnalysisResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  analysisType: 'word' | 'sentence' | 'paragraph';
}

export function AnalysisResultDialog({ 
  isOpen, 
  onClose, 
  analysis, 
  analysisType 
}: AnalysisResultDialogProps) {
  const handleExport = () => {
    if (!analysis) return;
    
    const data = JSON.stringify(analysis, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${analysisType}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!analysis) return;
    
    const text = getShareableText(analysis, analysisType);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Kết quả phân tích ${analysisType === 'word' ? 'từ' : analysisType === 'sentence' ? 'câu' : 'đoạn văn'}`,
          text: text
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        // Could show a toast notification here
        console.log('Copied to clipboard');
      });
    }
  };

  const getShareableText = (analysis: WordAnalysis | SentenceAnalysis | ParagraphAnalysis, type: 'word' | 'sentence' | 'paragraph'): string => {
    if (type === 'word') {
      const wordAnalysis = analysis as WordAnalysis;
      return `Phân tích từ: ${wordAnalysis.meta.word}\n\nĐịnh nghĩa: ${wordAnalysis.definitions.context_meaning}\nDịch nghĩa: ${wordAnalysis.definitions.vietnamese_translation}\nLoại từ: ${wordAnalysis.meta.pos}\nCấp độ: ${wordAnalysis.meta.cefr}`;
    } else if (type === 'sentence') {
      const sentenceAnalysis = analysis as SentenceAnalysis;
      return `Phân tích câu:\n\nÝ chính: ${sentenceAnalysis.semantics.main_idea}\nCảm xúc: ${sentenceAnalysis.semantics.sentiment}\nĐộ phức tạp: ${sentenceAnalysis.meta.complexity_level}`;
    } else {
      const paragraphAnalysis = analysis as ParagraphAnalysis;
      return `Phân tích đoạn văn:\n\nChủ đề: ${paragraphAnalysis.content_analysis.main_topic}\nCảm xúc: ${paragraphAnalysis.content_analysis.sentiment.label}\nThể loại: ${paragraphAnalysis.meta.type}\nĐiểm mạch lạc: ${paragraphAnalysis.coherence_and_cohesion.logic_score}/100`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Chi tiết phân tích {analysisType === 'word' ? 'từ' : analysisType === 'sentence' ? 'câu' : 'đoạn văn'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8 w-8 p-0"
                title="Xuất kết quả"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="h-8 w-8 p-0"
                title="Chia sẻ kết quả"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 max-h-[calc(90vh-80px)] p-6">
          {analysis && (
            <>
              {analysisType === 'word' && (
                <WordAnalysisDisplay
                  analysis={analysis as WordAnalysis}
                  onSynonymClick={(word) => console.log('Synonym clicked:', word)}
                  onAntonymClick={(word) => console.log('Antonym clicked:', word)}
                />
              )}
              
              {analysisType === 'sentence' && (
                <SentenceAnalysisDisplay
                  analysis={analysis as SentenceAnalysis}
                  onRewriteApply={(text) => console.log('Rewrite applied:', text)}
                />
              )}
              
              {analysisType === 'paragraph' && (
                <ParagraphAnalysisDisplay
                  analysis={analysis as ParagraphAnalysis}
                  onFeedbackApply={(text) => console.log('Feedback applied:', text)}
                />
              )}
            </>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default AnalysisResultDialog;