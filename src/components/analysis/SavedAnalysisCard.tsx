import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  FileText, 
  FilePlus, 
  Eye, 
  Trash2, 
  Calendar,
  Clock
} from 'lucide-react';
import type { SavedAnalysisItem } from '@/hooks/useSavedAnalyses';

interface SavedAnalysisCardProps {
  analysis: SavedAnalysisItem;
  onViewDetails: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

/**
 * Component hiển thị thông tin cơ bản của một phân tích đã lưu
 * Hiển thị type, text, created_at, và một phần nội dung
 */
export function SavedAnalysisCard({ 
  analysis, 
  onViewDetails, 
  onDelete, 
  isDeleting = false 
}: SavedAnalysisCardProps) {
  const getIconForType = (type: string) => {
    switch (type) {
      case 'word':
        return <BookOpen className="h-4 w-4" />;
      case 'sentence':
        return <FileText className="h-4 w-4" />;
      case 'paragraph':
        return <FilePlus className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'word':
        return 'Từ';
      case 'sentence':
        return 'Câu';
      case 'paragraph':
        return 'Đoạn';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'word':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      case 'sentence':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
      case 'paragraph':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Trích xuất nội dung text từ analysis object
  const getTextContent = () => {
    if (analysis.text) return analysis.text;
    if (analysis.word) return analysis.word;
    if (analysis.sentence) return analysis.sentence;
    if (analysis.paragraph) return analysis.paragraph;
    if (analysis.input) return analysis.input;
    return 'N/A';
  };

  const textContent = getTextContent();
  const truncatedText = textContent.length > 100 
    ? `${textContent.substring(0, 100)}...` 
    : textContent;

  return (
    <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`${getTypeColor(analysis.analysis_type)} flex items-center gap-1`}
            >
              {getIconForType(analysis.analysis_type)}
              {getTypeLabel(analysis.analysis_type)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(analysis.created_at)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-3">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(analysis.created_at)}
          </div>
          
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm line-clamp-3">{truncatedText}</p>
          </div>
          
          {analysis.session_id && (
            <div className="text-xs text-muted-foreground">
              Session: {analysis.session_id.substring(0, 8)}...
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(analysis.id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Xem chi tiết
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(analysis.id)}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default SavedAnalysisCard;