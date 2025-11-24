'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { WordAnalysis, SentenceAnalysis, ParagraphAnalysis } from '@/lib/ai/types';

interface RecentHistoryCardProps {
  recentHistory: Array<{
    id: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
    input: string;
    result: WordAnalysis | SentenceAnalysis | ParagraphAnalysis;
    timestamp: number;
  }>;
  isOpen: boolean;
  onToggle: () => void;
  onHistoryItemClick: (item: any) => void;
}

/**
 * Component để hiển thị lịch sử phân tích gần đây
 */
export function RecentHistoryCard({
  recentHistory,
  isOpen,
  onToggle,
  onHistoryItemClick
}: RecentHistoryCardProps) {
  if (recentHistory.length === 0) {
    return null;
  }

  return (
    <Card className="p-3 sm:p-4" title="Lịch sử phân tích gần đây">
      <div
        className="flex items-center justify-between mb-3 cursor-pointer"
        onClick={onToggle}
        title={isOpen ? "Thu gọn" : "Mở rộng"}
      >
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Lịch sử phân tích</span>
          <span className="sm:hidden">Lịch sử</span>
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs" title={`${recentHistory.length} mục`}>
            {recentHistory.length}
          </Badge>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
          {recentHistory.map((item) => (
            <div
              key={item.id}
              className="p-2 border rounded cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onHistoryItemClick(item)}
              title={`Phân tích lại: ${item.input.substring(0, 100)}${item.input.length > 100 ? '...' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-xs">
                  {item.type === 'word' ? 'Từ' : item.type === 'phrase' ? 'Cụm từ' : item.type === 'sentence' ? 'Câu' : 'Đoạn'}
                </Badge>
                <span className="text-xs text-muted-foreground" title={new Date(item.timestamp).toLocaleString('vi-VN')}>
                  {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="text-sm text-foreground truncate">
                "{item.input.substring(0, 50)}{item.input.length > 50 ? '...' : ''}"
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default RecentHistoryCard;