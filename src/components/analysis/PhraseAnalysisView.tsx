import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Volume2, Users, Lightbulb, AlertTriangle } from 'lucide-react';
import type { PhraseAnalysis } from '@/lib/ai/types';

interface PhraseAnalysisViewProps {
  data: PhraseAnalysis;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export function PhraseAnalysisView({ data, isLoading, error, className }: PhraseAnalysisViewProps) {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-sm text-muted-foreground">Đang phân tích cụm từ...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Lỗi phân tích
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Không có dữ liệu phân tích</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Meta Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Thông tin cơ bản
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Cụm từ</h4>
              <p className="text-lg font-medium">{data.meta.phrase}</p>
              {data.meta.ipa && (
                <p className="text-sm text-muted-foreground">Phiên âm: /{data.meta.ipa}/</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Phân loại</h4>
              <div className="space-y-2">
                <Badge variant="outline" className="mr-2">
                  {data.meta.pos}
                </Badge>
                <Badge variant="outline" className="mr-2">
                  {data.meta.type}
                </Badge>
                <Badge variant="outline">
                  CEFR: {data.meta.cefr}
                </Badge>
              </div>
              <div className="space-y-1">
                <Badge variant="secondary">
                  Sắc thái: {data.meta.tone}
                </Badge>
                <Badge variant="secondary">
                  Đăng ký: {data.meta.register}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Definitions */}
      <Card>
        <CardHeader>
          <CardTitle>Định nghĩa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Nghĩa đen</h4>
            <p className="text-sm">{data.definitions.literal_meaning}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Nghĩa bóng/thực tế</h4>
            <p className="text-sm">{data.definitions.figurative_meaning}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Dịch tiếng Việt</h4>
            <p className="text-sm font-medium">{data.definitions.vietnamese_translation}</p>
          </div>
          {data.definitions.usage_notes && (
            <div>
              <h4 className="font-semibold mb-2">Lưu ý sử dụng</h4>
              <p className="text-sm">{data.definitions.usage_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Thành phần cấu thành
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.components.words.map((word, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <h5 className="font-medium mb-1">{word.word}</h5>
                {word.ipa && (
                  <p className="text-sm text-muted-foreground">Phiên âm: /{word.ipa}/</p>
                )}
                <p className="text-sm">{word.meaning}</p>
                <Badge variant="outline" className="mt-2">
                  Vai trò: {word.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grammar and Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Ngữ pháp và cấu trúc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Mẫu ngữ pháp</h4>
            <p className="text-sm">{data.grammar_and_structure.pattern}</p>
          </div>
          {data.grammar_and_structure.variations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Biến thể</h4>
              <div className="space-y-2">
                {data.grammar_and_structure.variations.map((variation, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <h5 className="font-medium mb-1">{variation.phrase}</h5>
                    <p className="text-sm mb-2">{variation.meaning}</p>
                    {variation.usage_example && (
                      <div className="p-2 bg-muted rounded text-sm">
                        <p className="font-medium mb-1">Ví dụ:</p>
                        <p>{variation.usage_example}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cách sử dụng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="collocations" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="collocations">Collocations</TabsTrigger>
              <TabsTrigger value="examples">Ví dụ</TabsTrigger>
            </TabsList>
            
            <TabsContent value="collocations" className="space-y-3">
              {data.usage.collocations.map((collocation, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <h5 className="font-medium mb-1">{collocation.phrase}</h5>
                  <p className="text-sm mb-2">{collocation.meaning}</p>
                  {collocation.usage_example && (
                    <div className="p-2 bg-muted rounded text-sm">
                      <p className="font-medium mb-1">Ví dụ:</p>
                      <p>{collocation.usage_example}</p>
                    </div>
                  )}
                  <Badge variant="outline" className="mt-2">
                    Tần suất: {collocation.frequency_level}
                  </Badge>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="examples" className="space-y-3">
              {data.usage.example_sentences.map((example, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="p-2 bg-muted rounded text-sm">
                    <p className="font-medium mb-1">Câu:</p>
                    <p>{example.sentence}</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-sm">
                    <p className="font-medium mb-1">Dịch:</p>
                    <p>{example.translation}</p>
                  </div>
                  {example.context && (
                    <div className="p-2 bg-muted rounded text-sm">
                      <p className="font-medium mb-1">Ngữ cảnh:</p>
                      <p>{example.context}</p>
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Pragmatics and Culture */}
      <Card>
        <CardHeader>
          <CardTitle>Ngữ dụng học và văn hóa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Mức độ trang trọng</h4>
              <Badge variant="outline">{data.pragmatics_and_culture.formality_level}</Badge>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Đăng ký phù hợp</h4>
              <Badge variant="outline">{data.pragmatics_and_culture.register_appropriateness}</Badge>
            </div>
          </div>
          {data.pragmatics_and_culture.cultural_notes && (
            <div>
              <h4 className="font-semibold mb-2">Lưu ý văn hóa</h4>
              <p className="text-sm">{data.pragmatics_and_culture.cultural_notes}</p>
            </div>
          )}
          {data.pragmatics_and_culture.common_mistakes.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Lỗi sai phổ biến</h4>
              <div className="space-y-2">
                {data.pragmatics_and_culture.common_mistakes.map((mistake, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <h5 className="font-medium mb-1 text-destructive">Sai: {mistake.mistake}</h5>
                    <p className="text-sm mb-2 text-green-600">Đúng: {mistake.correction}</p>
                    <p className="text-sm">{mistake.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Aids */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Hỗ trợ học tập
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Mẹo ghi nhớ</h4>
            <p className="text-sm">{data.learning_aids.memory_tips}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Mẹo phát âm</h4>
            <p className="text-sm">{data.learning_aids.pronunciation_tips}</p>
          </div>
          {data.learning_aids.practice_suggestions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Bài tập luyện tập</h4>
              <div className="space-y-2">
                {data.learning_aids.practice_suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <h5 className="font-medium mb-1">{suggestion.exercise}</h5>
                    <p className="text-sm">{suggestion.instruction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PhraseAnalysisView;