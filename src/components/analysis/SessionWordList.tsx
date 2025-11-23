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
  onWordRemove?: (wordId: string) => void;
  className?: string;
  emptyMessage?: string;
}

export function SessionWordList({
  words,
  onWordClick,
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
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Danh sách từ vựng
          </h3>
          <Badge variant="secondary">{words.length} từ</Badge>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {words.map((wordItem, index) => (
            <div key={wordItem.analysisId} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 
                      className="text-lg font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={() => onWordClick?.(wordItem)}
                    >
                      {wordItem.word}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePronounce(wordItem.word)}
                      className="h-6 w-6 p-0"
                      title="Phát âm"
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {wordItem.analysis?.pos || 'Từ'}
                    </Badge>
                    {wordItem.analysis?.cefr && (
                      <Badge variant="secondary" className="text-xs">
                        CEFR {wordItem.analysis.cefr}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(wordItem.analysis?.created_at || new Date().toISOString())}
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onWordClick?.(wordItem)}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Xem chi tiết
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePronounce(wordItem.word)}>
                      <Volume2 className="h-4 w-4 mr-2" />
                      Phát âm
                    </DropdownMenuItem>
                    {wordItem.analysis?.example_sentence && (
                      <DropdownMenuItem>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Xem ví dụ
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onWordRemove?.(wordItem.analysisId)}
                      className="text-destructive"
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Xóa khỏi session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-2">
                {wordItem.translation && (
                  <div>
                    <span className="text-sm font-medium">Nghĩa:</span>
                    <p className="text-sm text-muted-foreground">{wordItem.translation}</p>
                  </div>
                )}
                
                {wordItem.definition && (
                  <div>
                    <span className="text-sm font-medium">Định nghĩa:</span>
                    <p className="text-sm text-muted-foreground">{wordItem.definition}</p>
                  </div>
                )}
                
                {wordItem.analysis?.example_sentence && (
                  <div>
                    <span className="text-sm font-medium">Ví dụ:</span>
                    <p className="text-sm italic text-muted-foreground">
                      "{wordItem.analysis.example_sentence}"
                    </p>
                    {wordItem.analysis?.example_translation && (
                      <p className="text-sm text-muted-foreground">
                        {wordItem.analysis.example_translation}
                      </p>
                    )}
                  </div>
                )}
                
                {wordItem.analysis?.ipa && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Phiên âm:</span>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {wordItem.analysis.ipa}
                    </code>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

export default SessionWordList;