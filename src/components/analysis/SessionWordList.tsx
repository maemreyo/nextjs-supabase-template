import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Volume2,
  ExternalLink,
  Clock,
  Tag,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WordItem {
  word: string;
  translation: string;
  definition: string;
  analysis: any;
  sessionId: string;
  analysisId: string;
}

interface SessionWordListProps {
  words: WordItem[];
  onWordClick?: (word: WordItem) => void;
  onWordAnalyze?: (wordItem: WordItem) => void;
  onWordRemove?: (wordId: string) => void;
  className?: string;
  emptyMessage?: string;
}

export function SessionWordList({
  words,
  onWordClick,
  onWordAnalyze,
  onWordRemove,
  className = "",
  emptyMessage = "Chưa có từ nào được phân tích trong session này."
}: SessionWordListProps) {
  const handlePronounce = (word: string) => {
    // Use Web Speech API to pronounce the word
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (words.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Chưa có từ vựng</h3>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col ${className}`}>
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4" />
            Danh sách từ vựng
          </h3>
          <Badge variant="secondary" className="text-xs">{words.length} từ</Badge>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="grid grid-cols-1 gap-2">
            {words.map((wordItem) => (
              <div
                key={wordItem.analysisId}
                className="border rounded-md p-2 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => {
                  console.log('🔍 [DEBUG] SessionWordList - Word clicked:', {
                    word: wordItem.word,
                    analysisId: wordItem.analysisId,
                    hasAnalysis: !!wordItem.analysis,
                    hasOnWordClick: !!onWordClick
                  });
                  onWordClick?.(wordItem);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <h4 className="font-medium text-sm hover:text-primary transition-colors">
                      {wordItem.word}
                    </h4>
                    {wordItem.analysis?.ipa && (
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {wordItem.analysis.ipa}
                      </code>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePronounce(wordItem.word);
                      }}
                      className="h-6 w-6 p-0"
                      title="Phát âm"
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onWordAnalyze?.(wordItem)}>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Phân tích chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePronounce(wordItem.word)}>
                          <Volume2 className="h-4 w-4 mr-2" />
                          Phát âm
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onWordRemove?.(wordItem.analysisId)}
                          className="text-destructive"
                        >
                          <Tag className="h-4 w-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {wordItem.analysis?.pos || 'Từ'}
                  </Badge>
                  {wordItem.analysis?.cefr && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {wordItem.analysis.cefr}
                    </Badge>
                  )}
                  {wordItem.translation && (
                    <span className="text-xs text-muted-foreground truncate ml-1">
                      {wordItem.translation}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}

export default SessionWordList;