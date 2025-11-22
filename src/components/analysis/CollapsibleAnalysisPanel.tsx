import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  Lightbulb,
  FileText,
  Target,
  Zap,
  Languages,
  Users,
  TrendingUp,
  Link,
  BookOpen as BookIcon,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis, CollapsibleAnalysisPanelProps } from './types';
import { WordAnalysisDisplay } from './WordAnalysisDisplay';
import { SentenceAnalysisDisplay } from './SentenceAnalysisDisplay';
import { ParagraphAnalysisDisplay } from './ParagraphAnalysisDisplay';

// Component cho collapsed state
function CollapsedState({ 
  onToggle, 
  analysisType,
  hasContent 
}: { 
  onToggle: () => void; 
  analysisType: 'word' | 'sentence' | 'paragraph';
  hasContent: boolean;
}) {
  const getAnalysisTypeIcon = () => {
    switch (analysisType) {
      case 'word':
        return <BookOpen className="h-4 w-4" />;
      case 'sentence':
        return <FileText className="h-4 w-4" />;
      case 'paragraph':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getAnalysisTypeColor = () => {
    switch (analysisType) {
      case 'word':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'sentence':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'paragraph':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-2 cursor-pointer group hover:bg-muted/50 transition-all duration-200" onClick={onToggle}>
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <MessageSquare className={cn(
            "h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-200",
            hasContent && "text-primary"
          )} />
          {hasContent && (
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
          )}
        </div>
        
        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
          Analysis
        </span>
        
        <div className="flex items-center gap-1">
          <Badge variant="outline" className={cn("text-xs px-1 py-0", getAnalysisTypeColor())}>
            {getAnalysisTypeIcon()}
            <span className="ml-1">{analysisType}</span>
          </Badge>
        </div>
        
        <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}

// Component cho expanded state header
function ExpandedHeader({ 
  onToggle, 
  analysisType,
  analysisResult 
}: { 
  onToggle: () => void; 
  analysisType: 'word' | 'sentence' | 'paragraph';
  analysisResult: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
}) {
  const getAnalysisTitle = () => {
    if (!analysisResult) return 'Analysis';
    
    switch (analysisType) {
      case 'word':
        return (analysisResult as WordAnalysis).meta?.word || 'Word Analysis';
      case 'sentence':
        return 'Sentence Analysis';
      case 'paragraph':
        return 'Paragraph Analysis';
      default:
        return 'Analysis';
    }
  };

  const getAnalysisTypeColor = () => {
    switch (analysisType) {
      case 'word':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'sentence':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'paragraph':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="sticky top-0 bg-background border-b p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-sm">{getAnalysisTitle()}</h3>
        <Badge variant="outline" className={cn("text-xs", getAnalysisTypeColor())}>
          {analysisType}
        </Badge>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onToggle} 
        className="h-6 w-6 p-0 hover:bg-muted"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Component cho compact analysis display
function CompactAnalysisDisplay({ 
  analysisResult, 
  analysisType 
}: { 
  analysisResult: WordAnalysis | SentenceAnalysis | ParagraphAnalysis | null;
  analysisType: 'word' | 'sentence' | 'paragraph';
}) {
  if (!analysisResult) return null;

  switch (analysisType) {
    case 'word':
      return (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Pronunciation</h4>
            <p className="text-primary font-mono text-xs">{(analysisResult as WordAnalysis).meta?.ipa || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Definition</h4>
            <p className="text-foreground text-xs">{(analysisResult as WordAnalysis).definitions?.root_meaning || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Vietnamese</h4>
            <p className="text-foreground text-xs">{(analysisResult as WordAnalysis).definitions?.vietnamese_translation || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Example</h4>
            <p className="text-muted-foreground italic text-xs">{(analysisResult as WordAnalysis).usage?.example_sentence || 'N/A'}</p>
          </div>
        </div>
      );

    case 'sentence':
      return (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Complexity</h4>
            <Badge variant="outline" className="text-xs">{(analysisResult as SentenceAnalysis).meta?.complexity_level || 'N/A'}</Badge>
          </div>
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Main Idea</h4>
            <p className="text-foreground text-xs">{(analysisResult as SentenceAnalysis).semantics?.main_idea || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Sentiment</h4>
            <Badge variant="outline" className="text-xs">{(analysisResult as SentenceAnalysis).semantics?.sentiment || 'N/A'}</Badge>
          </div>
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Translation</h4>
            <p className="text-foreground text-xs">{(analysisResult as SentenceAnalysis).translation?.natural || 'N/A'}</p>
          </div>
        </div>
      );

    case 'paragraph':
      return (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Type</h4>
            <Badge variant="outline" className="text-xs">{(analysisResult as ParagraphAnalysis).meta?.type || 'N/A'}</Badge>
          </div>
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Tone</h4>
            <Badge variant="outline" className="text-xs">{(analysisResult as ParagraphAnalysis).meta?.tone || 'N/A'}</Badge>
          </div>
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Main Topic</h4>
            <p className="text-foreground text-xs">{(analysisResult as ParagraphAnalysis).content_analysis?.main_topic || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-xs text-muted-foreground mb-1">Keywords</h4>
            <div className="flex flex-wrap gap-1">
              {(analysisResult as ParagraphAnalysis).content_analysis?.keywords?.slice(0, 3).map((keyword, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{keyword}</Badge>
              ))}
              {(analysisResult as ParagraphAnalysis).content_analysis?.keywords?.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{(analysisResult as ParagraphAnalysis).content_analysis.keywords.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
  // Fallback return for TypeScript
  return null;
}

// Main component
export function CollapsibleAnalysisPanel({
  isOpen,
  onOpenChange,
  analysisResult,
  analysisType,
  onAddToVocabulary,
  className = ""
}: CollapsibleAnalysisPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(!isOpen);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const autoCollapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const interactionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-collapse sau 30 giây không tương tác
  const resetAutoCollapseTimer = useCallback(() => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
    }
    
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    
    // Reset timer sau khi user ngừng tương tác (500ms sau interaction cuối)
    interactionTimerRef.current = setTimeout(() => {
      autoCollapseTimerRef.current = setTimeout(() => {
        setIsCollapsed(true);
      }, 30000); // 30 giây
    }, 500);
  }, []);

  // Xử lý interaction
  const handleInteraction = useCallback(() => {
    resetAutoCollapseTimer();
  }, [resetAutoCollapseTimer]);

  // Toggle collapsed state
  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => !prev);
    if (isCollapsed) {
      resetAutoCollapseTimer();
    }
  }, [isCollapsed, resetAutoCollapseTimer]);

  // Toggle section expansion
  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
    handleInteraction();
  }, [handleInteraction]);

  // Setup event listeners cho interactions
  useEffect(() => {
    if (!isCollapsed && panelRef.current) {
      const panel = panelRef.current;
      
      const handleMouseMove = () => handleInteraction();
      const handleMouseDown = () => handleInteraction();
      const handleTouchStart = () => handleInteraction();
      const handleWheel = () => handleInteraction();
      const handleKeyDown = () => handleInteraction();
      
      panel.addEventListener('mousemove', handleMouseMove);
      panel.addEventListener('mousedown', handleMouseDown);
      panel.addEventListener('touchstart', handleTouchStart);
      panel.addEventListener('wheel', handleWheel);
      panel.addEventListener('keydown', handleKeyDown);
      
      return () => {
        panel.removeEventListener('mousemove', handleMouseMove);
        panel.removeEventListener('mousedown', handleMouseDown);
        panel.removeEventListener('touchstart', handleTouchStart);
        panel.removeEventListener('wheel', handleWheel);
        panel.removeEventListener('keydown', handleKeyDown);
      };
    }
    
    // Return empty cleanup function for the else case
    return () => {};
  }, [isCollapsed, handleInteraction]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
      }
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
    };
  }, []);

  // Sync with isOpen prop
  useEffect(() => {
    setIsCollapsed(!isOpen);
  }, [isOpen]);

  // Notify parent of state changes
  useEffect(() => {
    onOpenChange(!isCollapsed);
  }, [isCollapsed, onOpenChange]);

  return (
    <div 
      ref={panelRef}
      className={cn(
        "h-full bg-background border-l border-border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[60px]" : "w-[280px]",
        className
      )}
    >
      {isCollapsed ? (
        <CollapsedState 
          onToggle={toggleCollapsed} 
          analysisType={analysisType}
          hasContent={!!analysisResult}
        />
      ) : (
        <div className="h-full flex flex-col">
          <ExpandedHeader 
            onToggle={toggleCollapsed} 
            analysisType={analysisType}
            analysisResult={analysisResult}
          />
          
          <ScrollArea className="flex-1">
            <div className="p-4">
              {analysisResult ? (
                <div className="space-y-4">
                  {/* Compact Analysis Display */}
                  <Card className="p-3">
                    <CompactAnalysisDisplay 
                      analysisResult={analysisResult} 
                      analysisType={analysisType} 
                    />
                  </Card>
                  
                  <Separator className="my-4" />
                  
                  {/* Add to Vocabulary Button */}
                  <Button 
                    className="w-full" 
                    size="sm" 
                    onClick={() => {
                      onAddToVocabulary();
                      handleInteraction();
                    }}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Add to Vocabulary
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No analysis available</p>
                  <p className="text-xs text-muted-foreground mt-1">Select text to analyze</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default CollapsibleAnalysisPanel;