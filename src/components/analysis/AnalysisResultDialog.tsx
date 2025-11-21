import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  Download, 
  Share2, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Printer, 
  FileText,
  BookOpen,
  Target,
  Zap,
  Languages,
  TrendingUp,
  Lightbulb,
  Volume2,
  Clock,
  User,
  Hash,
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  Keyboard
} from 'lucide-react';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';
import { cn } from "@/lib/utils";

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
  provider
}: AnalysisResultDialogProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMetadata, setShowMetadata] = useState(true);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
        case 'e':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleExport();
          }
          break;
        case 'p':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handlePrint();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  const handleExport = () => {
    if (!analysis) return;
    
    const data = JSON.stringify({
      analysis,
      metadata: {
        type: analysisType,
        processingTime,
        tokensUsed,
        model,
        provider,
        exportedAt: new Date().toISOString()
      }
    }, null, 2);
    
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
    
    const text = getShareableText();
    
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
      navigator.clipboard.writeText(text).then(() => {
        setCopiedSection('share');
        setTimeout(() => setCopiedSection(null), 2000);
      });
    }
  };

  const handleCopySection = (sectionId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  const handlePrint = () => {
    if (!contentRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const content = contentRef.current.innerHTML;
    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
        } catch (e) {
          return '';
        }
      })
      .join('\n');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Analysis Report</title>
          <style>${styles}</style>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; }
            .no-print { display: none !important; }
            .print-break { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <h1>Analysis Report - ${analysisType}</h1>
          ${content}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const getShareableText = (): string => {
    if (!analysis) return '';
    
    if (analysisType === 'word') {
      const wordAnalysis = analysis as WordAnalysis;
      return `Phân tích từ: ${wordAnalysis.meta.word}\n\nĐịnh nghĩa: ${wordAnalysis.definitions.context_meaning}\nDịch nghĩa: ${wordAnalysis.definitions.vietnamese_translation}\nLoại từ: ${wordAnalysis.meta.pos}\nCấp độ: ${wordAnalysis.meta.cefr}`;
    } else if (analysisType === 'sentence') {
      const sentenceAnalysis = analysis as SentenceAnalysis;
      return `Phân tích câu:\n\nÝ chính: ${sentenceAnalysis.semantics.main_idea}\nCảm xúc: ${sentenceAnalysis.semantics.sentiment}\nĐộ phức tạp: ${sentenceAnalysis.meta.complexity_level}`;
    } else {
      const paragraphAnalysis = analysis as ParagraphAnalysis;
      return `Phân tích đoạn văn:\n\nChủ đề: ${paragraphAnalysis.content_analysis.main_topic}\nCảm xúc: ${paragraphAnalysis.content_analysis.sentiment.label}\nThể loại: ${paragraphAnalysis.meta.type}\nĐiểm mạch lạc: ${paragraphAnalysis.coherence_and_cohesion.logic_score}/100`;
    }
  };

  const getAnalysisIcon = () => {
    switch (analysisType) {
      case 'word': return <BookOpen className="h-5 w-5" />;
      case 'sentence': return <FileText className="h-5 w-5" />;
      case 'paragraph': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const renderWordAnalysis = (analysis: WordAnalysis) => (
    <div className="space-y-6">
      {/* Word Meta Section */}
      <Card className="print-break">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">{analysis.meta.word}</CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleCopySection('word', analysis.meta.word)}
                className="no-print"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{analysis.meta.pos}</Badge>
              <Badge variant="outline">{analysis.meta.cefr}</Badge>
              <Badge>{analysis.meta.tone}</Badge>
            </div>
            
            <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
              {analysis.meta.ipa}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Definitions Section */}
      <Card className="print-break">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Định nghĩa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Nghĩa gốc</h5>
            <p className="text-sm">{analysis.definitions.root_meaning}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Nghĩa trong ngữ cảnh</h5>
            <p className="text-sm bg-primary/10 p-3 rounded">{analysis.definitions.context_meaning}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Dịch nghĩa</h5>
            <p className="text-sm font-medium">{analysis.definitions.vietnamese_translation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Inference Strategy */}
      <Card className="print-break bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Chiến lược suy luận
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="text-sm font-medium mb-2">Dấu hiệu nhận biết:</h5>
            <p className="text-sm">{analysis.inference_strategy.clues}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium mb-2">Cách suy luận:</h5>
            <p className="text-sm">{analysis.inference_strategy.reasoning}</p>
          </div>
        </CardContent>
      </Card>

      {/* Relations */}
      <Card className="print-break">
        <CardHeader>
          <CardTitle>Quan hệ từ vựng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Đồng nghĩa</h5>
            <div className="flex flex-wrap gap-2">
              {analysis.relations.synonyms.map((synonym, index) => (
                <Badge key={index} variant="outline" className="cursor-pointer hover:bg-primary/10">
                  {synonym.word}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Trái nghĩa</h5>
            <div className="flex flex-wrap gap-2">
              {analysis.relations.antonyms.map((antonym, index) => (
                <Badge key={index} variant="destructive" className="cursor-pointer hover:bg-destructive/10">
                  {antonym.word}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card className="print-break">
        <CardHeader>
          <CardTitle>Cách dùng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Cụm từ cố định</h5>
            <div className="space-y-2">
              {analysis.usage.collocations.map((collocation, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm font-medium">{collocation.phrase}</span>
                  <Badge variant="outline" className="text-xs">{collocation.frequency_level}</Badge>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Ví dụ</h5>
            <p className="text-sm italic bg-muted p-3 rounded">"{analysis.usage.example_sentence}"</p>
            <p className="text-sm mt-2">{analysis.usage.example_translation}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSentenceAnalysis = (analysis: SentenceAnalysis) => (
    <div className="space-y-6">
      {/* Sentence Meta */}
      <Card className="print-break">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">Phân tích câu</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{analysis.meta.complexity_level}</Badge>
              <Badge variant="outline">{analysis.meta.sentence_type}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded border-l-4 border-primary">
            <p className="text-sm italic">"{analysis.meta.sentence}"</p>
          </div>
        </CardContent>
      </Card>

      {/* Semantics */}
      <Card className="print-break">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Phân tích ngữ nghĩa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Ý chính:</h5>
            <p className="text-sm bg-primary/10 p-3 rounded">{analysis.semantics.main_idea}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Ý ngầm:</h5>
            <p className="text-sm bg-purple-50 dark:bg-purple-950/20 p-3 rounded">{analysis.semantics.subtext}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Cảm xúc:</h5>
            <Badge
              variant={analysis.semantics.sentiment === 'Positive' ? 'default' :
                     analysis.semantics.sentiment === 'Negative' ? 'destructive' : 'secondary'}
            >
              {analysis.semantics.sentiment}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Grammar */}
      <Card className="print-break">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Phân tích ngữ pháp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Chủ ngữ:</h5>
              <p className="text-sm font-medium">{analysis.grammar_breakdown.subject}</p>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Động từ chính:</h5>
              <p className="text-sm font-medium">{analysis.grammar_breakdown.main_verb}</p>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Tân ngữ:</h5>
              <p className="text-sm font-medium">{analysis.grammar_breakdown.object}</p>
            </div>
          </div>
          
          {analysis.grammar_breakdown.clauses.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Mệnh đề:</h5>
              <div className="space-y-2">
                {analysis.grammar_breakdown.clauses.map((clause, index) => (
                  <div key={index} className="bg-muted p-3 rounded border-l-2 border-border">
                    <span className="text-xs font-medium text-muted-foreground">{clause.type}:</span>
                    <p className="text-sm mt-1">"{clause.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Components */}
      <Card className="print-break">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Thành phần chính
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.key_components.map((component, index) => (
              <div key={index} className="border-l-2 border-orange-400 dark:border-orange-600 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">"{component.phrase}"</span>
                  <Badge variant="outline" className="text-xs">{component.type}</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-1">{component.meaning}</p>
                <p className="text-xs text-muted-foreground">{component.significance}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Translation */}
      <Card className="print-break bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Dịch nghĩa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Dịch nghĩa đen:</h5>
            <p className="text-sm bg-background p-3 rounded">{analysis.translation.literal}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Dịch nghĩa tự nhiên:</h5>
            <p className="text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded">{analysis.translation.natural}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderParagraphAnalysis = (analysis: ParagraphAnalysis) => (
    <div className="space-y-6">
      {/* Paragraph Meta */}
      <Card className="print-break">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Phân tích đoạn văn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Thể loại:</h5>
              <Badge variant="outline">{analysis.meta.type}</Badge>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Giọng điệu:</h5>
              <Badge variant="secondary">{analysis.meta.tone}</Badge>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Đối tượng:</h5>
              <Badge>{analysis.meta.target_audience}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Analysis */}
      <Card className="print-break">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Phân tích nội dung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Chủ đề chính:</h5>
            <p className="text-sm bg-primary/10 p-3 rounded">{analysis.content_analysis.main_topic}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Cảm xúc:</h5>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  analysis.content_analysis.sentiment.label === 'Positive' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800' :
                  analysis.content_analysis.sentiment.label === 'Negative' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800' :
                  analysis.content_analysis.sentiment.label === 'Neutral' ? 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700' :
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800'
                }
              >
                {analysis.content_analysis.sentiment.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Mức độ: {analysis.content_analysis.sentiment.intensity}/10
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{analysis.content_analysis.sentiment.justification}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Từ khóa:</h5>
            <div className="flex flex-wrap gap-1">
              {analysis.content_analysis.keywords.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Structure Breakdown */}
      <Card className="print-break">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Cấu trúc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.structure_breakdown.map((item, index) => (
              <div key={index} className="border-l-2 border-primary pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">Câu {item.sentence_index}</Badge>
                  <Badge variant="secondary" className="text-xs">{item.role}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">"{item.snippet}..."</p>
                <p className="text-xs">{item.analysis}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coherence */}
      <Card className="print-break">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Mạch lạc và Liên kết
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Điểm mạch lạc (logic):</h5>
              <div className="flex items-center gap-2">
                <Progress value={analysis.coherence_and_cohesion.logic_score} className="flex-1" />
                <span className={`text-sm font-bold ${
                  analysis.coherence_and_cohesion.logic_score >= 80 ? 'text-green-600' :
                  analysis.coherence_and_cohesion.logic_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analysis.coherence_and_cohesion.logic_score}
                </span>
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Điểm trôi chảy (flow):</h5>
              <div className="flex items-center gap-2">
                <Progress value={analysis.coherence_and_cohesion.flow_score} className="flex-1" />
                <span className={`text-sm font-bold ${
                  analysis.coherence_and_cohesion.flow_score >= 80 ? 'text-green-600' :
                  analysis.coherence_and_cohesion.flow_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analysis.coherence_and_cohesion.flow_score}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Từ nối:</h5>
            <div className="flex flex-wrap gap-1">
              {analysis.coherence_and_cohesion.transition_words.map((word, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {word}
                </Badge>
              ))}
            </div>
          </div>
          
          {analysis.coherence_and_cohesion.gap_analysis && (
            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-2">Phân tích khoảng trống:</h5>
              <p className="text-sm bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded">{analysis.coherence_and_cohesion.gap_analysis}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Constructive Feedback */}
      <Card className="print-break">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Góp ý xây dựng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Phân tích chi tiết:</h5>
            <div className="space-y-2">
              {analysis.constructive_feedback.critiques.map((critique, index) => (
                <div key={index} className="border-l-2 border-orange-400 dark:border-orange-600 pl-4">
                  <Badge variant="outline" className="text-xs mb-1">{critique.issue_type}</Badge>
                  <p className="text-sm mb-1">{critique.description}</p>
                  <p className="text-xs text-muted-foreground">{critique.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">Phiên bản cải tiến:</h5>
            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded border border-green-200 dark:border-green-800">
              <p className="text-sm">{analysis.constructive_feedback.better_version}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalysisContent = () => {
    if (!analysis) return null;
    
    switch (analysisType) {
      case 'word':
        return renderWordAnalysis(analysis as WordAnalysis);
      case 'sentence':
        return renderSentenceAnalysis(analysis as SentenceAnalysis);
      case 'paragraph':
        return renderParagraphAnalysis(analysis as ParagraphAnalysis);
      default:
        return null;
    }
  };

  const renderSidebar = () => (
    <div className="w-80 border-r bg-muted/30 p-4 space-y-4 hidden lg:block">
      {/* Original Text */}
      {originalText && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Văn bản gốc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background p-3 rounded border text-sm max-h-32 overflow-auto">
              <p className="italic">"{originalText}"</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={() => handleCopySection('original', originalText)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Sao chép
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Thông tin nhanh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Loại phân tích:</span>
            <Badge variant="outline" className="text-xs">
              {analysisType === 'word' ? 'Từ' : analysisType === 'sentence' ? 'Câu' : 'Đoạn văn'}
            </Badge>
          </div>
          
          {processingTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Thời gian xử lý:</span>
              <span className="text-sm font-medium">{processingTime}ms</span>
            </div>
          )}
          
          {tokensUsed && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tokens sử dụng:</span>
              <span className="text-sm font-medium">{tokensUsed}</span>
            </div>
          )}
          
          {model && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mô hình:</span>
              <span className="text-sm font-medium">{model}</span>
            </div>
          )}
          
          {provider && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Nhà cung cấp:</span>
              <span className="text-sm font-medium">{provider}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Điều hướng nhanh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start"
            onClick={() => setActiveTab('overview')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Tổng quan
          </Button>
          
          <Button
            variant={activeTab === 'details' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start"
            onClick={() => setActiveTab('details')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Chi tiết
          </Button>
          
          <Button
            variant={activeTab === 'metadata' ? 'default' : 'ghost'}
            size="sm"
            className="w-full justify-start"
            onClick={() => setActiveTab('metadata')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Metadata
          </Button>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Phím tắt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Đóng:</span>
            <kbd className="px-2 py-1 bg-background border rounded">Esc</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Toàn màn hình:</span>
            <kbd className="px-2 py-1 bg-background border rounded">Ctrl+F</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Xuất file:</span>
            <kbd className="px-2 py-1 bg-background border rounded">Ctrl+E</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">In:</span>
            <kbd className="px-2 py-1 bg-background border rounded">Ctrl+P</kbd>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        size={isFullscreen ? "fullscreen" : "xxlarge"}
        className={cn(
          "flex flex-col",
          isFullscreen && "h-screen"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b no-print">
          <div className="flex items-center gap-3">
            {getAnalysisIcon()}
            <h2 className="text-xl font-semibold">
              Chi tiết phân tích {analysisType === 'word' ? 'từ' : analysisType === 'sentence' ? 'câu' : 'đoạn văn'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 w-8 p-0"
              title="Xuất kết quả (Ctrl+E)"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-8 w-8 p-0 relative"
              title="Chia sẻ kết quả"
            >
              <Share2 className="h-4 w-4" />
              {copiedSection === 'share' && (
                <span className="absolute -top-8 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Đã sao chép!
                </span>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 w-8 p-0"
              title="In (Ctrl+P)"
            >
              <Printer className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
              title="Toàn màn hình (Ctrl+F)"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMetadata(!showMetadata)}
              className="h-8 w-8 p-0 lg:hidden"
              title="Hiện/ẩn metadata"
            >
              {showMetadata ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Desktop */}
          {showMetadata && (
            <div className={cn(
              "w-80 border-r bg-muted/30 p-4 space-y-4 transition-all duration-300 ease-in-out",
              "hidden lg:block",
              showMetadata && "animate-in slide-in-from-left",
              !showMetadata && "animate-out slide-out-to-left"
            )}>
              {renderSidebar()}
            </div>
          )}
          
          {/* Mobile Sidebar Overlay */}
          {showMetadata && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in"
              onClick={() => setShowMetadata(false)}
            />
          )}
          
          {/* Mobile Sidebar */}
          {showMetadata && (
            <div className="fixed inset-y-0 left-0 w-80 bg-background border-r z-50 lg:hidden overflow-y-auto animate-in slide-in-from-left">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Thông tin</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMetadata(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {renderSidebar()}
              </div>
            </div>
          )}
          
          {/* Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div ref={contentRef} className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 no-print mb-4">
                    <TabsTrigger value="overview" className="text-xs sm:text-sm">Tổng quan</TabsTrigger>
                    <TabsTrigger value="details" className="text-xs sm:text-sm">Chi tiết</TabsTrigger>
                    <TabsTrigger value="metadata" className="text-xs sm:text-sm">Metadata</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-4 animate-in fade-in-50">
                    {renderAnalysisContent()}
                  </TabsContent>
                  
                  <TabsContent value="details" className="mt-4 animate-in fade-in-50">
                    {renderAnalysisContent()}
                  </TabsContent>
                  
                  <TabsContent value="metadata" className="mt-4 animate-in fade-in-50">
                    <Card>
                      <CardHeader>
                        <CardTitle>Metadata</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-muted-foreground mb-2">Thông tin phân tích</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Loại:</span>
                                <span className="text-sm font-medium">{analysisType}</span>
                              </div>
                              {processingTime && (
                                <div className="flex justify-between">
                                  <span className="text-sm">Thời gian xử lý:</span>
                                  <span className="text-sm font-medium">{processingTime}ms</span>
                                </div>
                              )}
                              {tokensUsed && (
                                <div className="flex justify-between">
                                  <span className="text-sm">Tokens:</span>
                                  <span className="text-sm font-medium">{tokensUsed}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="text-sm font-medium text-muted-foreground mb-2">Thông tin AI</h5>
                            <div className="space-y-2">
                              {model && (
                                <div className="flex justify-between">
                                  <span className="text-sm">Mô hình:</span>
                                  <span className="text-sm font-medium">{model}</span>
                                </div>
                              )}
                              {provider && (
                                <div className="flex justify-between">
                                  <span className="text-sm">Nhà cung cấp:</span>
                                  <span className="text-sm font-medium">{provider}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-sm">Thời gian tạo:</span>
                                <span className="text-sm font-medium">{new Date().toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h5 className="text-sm font-medium text-muted-foreground mb-2">Dữ liệu thô</h5>
                          <div className="bg-muted p-4 rounded text-xs font-mono max-h-40 overflow-auto">
                            {JSON.stringify(analysis, null, 2)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AnalysisResultDialog;