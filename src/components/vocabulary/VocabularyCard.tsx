'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { VocabularyWord } from '@/types/vocabulary';
import { Clock, Volume2, Edit, Trash2, Star, BookOpen } from 'lucide-react';

interface VocabularyCardProps {
  word: VocabularyWord;
  onEdit?: (word: VocabularyWord) => void;
  onDelete?: (wordId: string) => void;
  onPractice?: (wordId: string) => void;
  onPlayAudio?: (word: VocabularyWord) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export function VocabularyCard({
  word,
  onEdit,
  onDelete,
  onPractice,
  onPlayAudio,
  isLoading = false,
  compact = false
}: VocabularyCardProps) {
  const getMasteryColor = (level: number) => {
    if (level >= 4) return 'bg-green-500';
    if (level >= 3) return 'bg-blue-500';
    if (level >= 2) return 'bg-yellow-500';
    if (level >= 1) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getMasteryText = (level: number) => {
    if (level >= 4) return 'Thành thạo';
    if (level >= 3) return 'Tốt';
    if (level >= 2) return 'Trung bình';
    if (level >= 1) return 'Yếu';
    return 'Mới';
  };

  const getDifficultyColor = (level: number) => {
    if (level >= 4) return 'bg-red-100 text-red-800 border-red-200';
    if (level >= 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (level >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getDifficultyText = (level: number) => {
    if (level >= 4) return 'Rất khó';
    if (level >= 3) return 'Khó';
    if (level >= 2) return 'Trung bình';
    return 'Dễ';
  };

  const getCEFRColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'A1':
      case 'A2':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'B1':
      case 'B2':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C1':
      case 'C2':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (compact) {
    return (
      <Card className="w-full hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{word.word}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {word.definition_en}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant="outline" 
                className={`${getMasteryColor(word.mastery_level)} text-white text-xs`}
              >
                {getMasteryText(word.mastery_level)}
              </Badge>
              <div className="flex gap-1">
                {word.audio_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPlayAudio?.(word)}
                    disabled={isLoading}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPractice?.(word.id)}
                  disabled={isLoading}
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              {word.word}
              {word.cefr_level && (
                <Badge 
                  variant="outline" 
                  className={`${getCEFRColor(word.cefr_level)} text-xs`}
                >
                  {word.cefr_level.toUpperCase()}
                </Badge>
              )}
            </CardTitle>
            {word.ipa && (
              <CardDescription className="text-sm font-mono">
                /{word.ipa}/
              </CardDescription>
            )}
            <CardDescription className="mt-1">
              {word.definition_en}
            </CardDescription>
            {word.definition_vi && (
              <CardDescription className="text-sm text-muted-foreground mt-1">
                <em>{word.definition_vi}</em>
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <Badge 
              variant="outline" 
              className={`${getMasteryColor(word.mastery_level)} text-white text-xs`}
            >
              {getMasteryText(word.mastery_level)}
            </Badge>
            <Badge 
              variant="outline" 
              className={`${getDifficultyColor(word.difficulty_level)} text-xs`}
            >
              {getDifficultyText(word.difficulty_level)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Mức độ thành thạo</span>
              <span>{word.mastery_level}/5</span>
            </div>
            <Progress 
              value={(word.mastery_level / 5) * 100} 
              className="h-2"
            />
          </div>

          {/* Example Sentence */}
          {word.example_sentence && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm italic">
                "{word.example_sentence}"
              </p>
              {word.example_translation && (
                <p className="text-sm text-muted-foreground mt-1">
                  {word.example_translation}
                </p>
              )}
            </div>
          )}

          {/* Vietnamese Translation */}
          {word.vietnamese_translation && (
            <div className="text-sm">
              <span className="font-medium">Dịch nghĩa:</span> {word.vietnamese_translation}
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{word.review_count} lần ôn tập</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>{word.correct_count} lần đúng</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {word.last_reviewed_at 
                  ? new Date(word.last_reviewed_at).toLocaleDateString('vi-VN')
                  : 'Chưa ôn tập'
                }
              </span>
            </div>
          </div>

          {/* Personal Notes */}
          {word.personal_notes && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm">
                <strong>Ghi chú:</strong> {word.personal_notes}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <div className="flex gap-2 w-full">
          {word.audio_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPlayAudio?.(word)}
              disabled={isLoading}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Phát âm
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPractice?.(word.id)}
            disabled={isLoading}
            className="flex-1"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Luyện tập
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(word)}
            disabled={isLoading}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(word.id)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}