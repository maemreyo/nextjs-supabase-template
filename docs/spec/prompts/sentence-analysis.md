# Phân Tích Câu (Sentence Analysis)

## Giới thiệu

Chức năng phân tích câu là một phần quan trọng trong hệ thống AI của dự án, giúp người học hiểu sâu về cấu trúc, ngữ nghĩa và cách sử dụng câu trong tiếng Anh. Tính năng này cung cấp phân tích toàn diện về câu, bao gồm cả các đề xuất viết lại với nhiều văn phong khác nhau.

## Interface TypeScript

Đây là interface TypeScript đầy đủ cho kết quả phân tích câu:

```typescript
interface SentenceAnalysis {
  meta: {
    sentence: string;
    complexity_level: "Basic" | "Intermediate" | "Advanced";
    sentence_type: string;
  };
  semantics: {
    main_idea: string;
    subtext: string;
    sentiment: "Positive" | "Negative" | "Neutral";
  };
  grammar_breakdown: {
    subject: string;
    main_verb: string;
    object: string;
    clauses: Array<{
      text: string;
      type: string;
    }>;
  };
  contextual_role: {
    function: string;
    relation_to_previous: string;
  };
  key_components: Array<{
    phrase: string;
    type: string;
    meaning: string;
    significance: string;
  }>;
  rewrite_suggestions: Array<{
    style: string;
    text: string;
    change_log: string;
  }>;
  translation: {
    literal: string;
    natural: string;
  };
}
```

## Prompt Template

Đây là prompt template chi tiết được sử dụng để phân tích câu:

```typescript
const prompt = `
Bạn là một chuyên gia ngôn ngữ học và biên tập viên cao cấp. Nhiệm vụ của bạn là phân tích sâu câu văn "${sentence}" và đề xuất các cách viết lại tối ưu hơn.

INPUT:
- Target Sentence: "${sentence}"
- Paragraph Context: "${paragraphContext}"

YÊU CẦU OUTPUT:
1. Trả về duy nhất JSON valid (RFC 8259).
2. KHÔNG markdown, KHÔNG lời dẫn.
3. Ngôn ngữ giải thích: Tiếng Việt.
4. Phần "rewrite_suggestions" phải giữ nguyên ý nghĩa gốc nhưng thay đổi văn phong/cấu trúc.

JSON SCHEMA:
{
  "meta": {
    "sentence": "${sentence}",
    "complexity_level": "Độ khó (Basic/Intermediate/Advanced)",
    "sentence_type": "Loại câu (Simple/Compound/Complex...)"
  },
  "semantics": {
    "main_idea": "Ý chính bao quát",
    "subtext": "Hàm ý/Ẩn ý (nếu có)",
    "sentiment": "Positive/Negative/Neutral"
  },
  "grammar_breakdown": {
    "subject": "Chủ ngữ",
    "main_verb": "Động từ chính",
    "object": "Tân ngữ/Bổ ngữ",
    "clauses": [ // Phân tách mệnh đề
      { "text": "Nội dung mệnh đề", "type": "Independent/Dependent..." }
    ]
  },
  "contextual_role": {
    "function": "Chức năng trong đoạn (Mở bài/Giải thích/Kết luận...)",
    "relation_to_previous": "Mối liên hệ với câu trước đó"
  },
  "key_components": [
    {
      "phrase": "Cụm từ hay/quan trọng",
      "type": "Idiom/Collocation/Grammar Pattern",
      "meaning": "Giải thích",
      "significance": "Cái hay của cụm từ này"
    }
  ],
  "rewrite_suggestions": [ // <--- NEW FEATURE
    {
      "style": "Formal/Academic",
      "text": "Phiên bản viết lại trang trọng (dùng cho báo cáo, văn bản)",
      "change_log": "Giải thích ngắn gọn thay đổi (ví dụ: Thay 'get' bằng 'obtain', dùng câu bị động...)"
    },
    {
      "style": "Simplified/Clear",
      "text": "Phiên bản đơn giản hóa (dùng cho người mới học, dễ hiểu)",
      "change_log": "Giải thích (ví dụ: Tách câu ghép thành câu đơn, dùng từ vựng A1...)"
    },
    {
      "style": "Native/Idiomatic",
      "text": "Phiên bản tự nhiên như người bản xứ",
      "change_log": "Giải thích (ví dụ: Dùng idiom X thay cho cách diễn đạt thông thường)"
    }
  ],
  "translation": {
    "literal": "Dịch sát nghĩa",
    "natural": "Dịch hay/thoát ý"
  }
}
`;
```

## Ví dụ Sử Dụng

### Ví dụ 1: Câu Đơn Giản

**Input:**
```typescript
const sentence = "The cat sleeps on the mat.";
const paragraphContext = "My pets have different habits. The cat sleeps on the mat while the dog plays outside.";
```

**Kết quả mong đợi:**
```json
{
  "meta": {
    "sentence": "The cat sleeps on the mat.",
    "complexity_level": "Basic",
    "sentence_type": "Simple"
  },
  "semantics": {
    "main_idea": "Con mèo đang ngủ trên tấm thảm",
    "subtext": "",
    "sentiment": "Neutral"
  },
  "grammar_breakdown": {
    "subject": "The cat",
    "main_verb": "sleeps",
    "object": "on the mat",
    "clauses": [
      {
        "text": "The cat sleeps on the mat",
        "type": "Independent"
      }
    ]
  },
  "contextual_role": {
    "function": "Supporting Detail",
    "relation_to_previous": "Cung cấp ví dụ cụ thể về thói quen của vật nuôi"
  },
  "key_components": [
    {
      "phrase": "sleeps on the mat",
      "type": "Collocation",
      "meaning": "ngủ trên tấm thảm",
      "significance": "Cụm từ chỉ vị trí và hành động thường gặp"
    }
  ],
  "rewrite_suggestions": [
    {
      "style": "Formal/Academic",
      "text": "The feline is resting upon the mat.",
      "change_log": "Thay 'cat' bằng 'feline', 'sleeps' bằng 'is resting', 'on' bằng 'upon' để tăng tính trang trọng"
    },
    {
      "style": "Simplified/Clear",
      "text": "A cat is sleeping on a mat.",
      "change_log": "Dùng thì hiện tại tiếp diễn để nhấn mạnh hành động đang diễn ra"
    },
    {
      "style": "Native/Idiomatic",
      "text": "The cat's curled up on the mat.",
      "change_log": "Thêm 'curled up' để mô tả tư thế ngủ tự nhiên của mèo"
    }
  ],
  "translation": {
    "literal": "Con mèo ngủ trên tấm thảm",
    "natural": "Con mèo đang ngủ trên tấm thảm"
  }
}
```

### Ví dụ 2: Câu Phức Tạp

**Input:**
```typescript
const sentence = "Although the weather was terrible, they decided to go hiking because they had been planning this trip for months.";
const paragraphContext = "The group faced many challenges during their outdoor adventure. Although the weather was terrible, they decided to go hiking because they had been planning this trip for months.";
```

**Kết quả mong đợi:**
```json
{
  "meta": {
    "sentence": "Although the weather was terrible, they decided to go hiking because they had been planning this trip for months.",
    "complexity_level": "Advanced",
    "sentence_type": "Complex"
  },
  "semantics": {
    "main_idea": "Họ quyết định đi leo núi bất chấp thời tiết xấu vì đã lên kế hoạch từ lâu",
    "subtext": "Sự kiên định và quyết tâm thực hiện kế hoạch đã định",
    "sentiment": "Positive"
  },
  "grammar_breakdown": {
    "subject": "they",
    "main_verb": "decided",
    "object": "to go hiking",
    "clauses": [
      {
        "text": "Although the weather was terrible",
        "type": "Dependent (Concessive)"
      },
      {
        "text": "they decided to go hiking",
        "type": "Independent"
      },
      {
        "text": "because they had been planning this trip for months",
        "type": "Dependent (Reason)"
      }
    ]
  },
  "contextual_role": {
    "function": "Supporting Detail",
    "relation_to_previous": "Cung cấp ví dụ cụ thể về thử thách mà nhóm đối mặt"
  },
  "key_components": [
    {
      "phrase": "Although the weather was terrible",
      "type": "Concessive Clause",
      "meaning": "Mặc dù thời tiết rất tệ",
      "significance": "Thể hiện sự tương phản giữa điều kiện khó khăn và quyết tâm"
    },
    {
      "phrase": "had been planning",
      "type": "Past Perfect Continuous",
      "meaning": "đã lên kế hoạch",
      "significance": "Nhấn mạnh kế hoạch đã được chuẩn bị từ trước và kéo dài"
    }
  ],
  "rewrite_suggestions": [
    {
      "style": "Formal/Academic",
      "text": "Despite the inclement weather conditions, the group proceeded with their hiking expedition, as this excursion had been meticulously planned for several months.",
      "change_log": "Thay từ vựng thông thường bằng từ học thuật, cấu trúc câu phức tạp hơn"
    },
    {
      "style": "Simplified/Clear",
      "text": "The weather was bad, but they went hiking anyway. They planned the trip for many months.",
      "change_log": "Tách câu phức thành các câu đơn, dùng từ vựng cơ bản"
    },
    {
      "style": "Native/Idiomatic",
      "text": "Come rain or shine, they were set on hiking - after all, they'd been plotting this trip for ages.",
      "change_log": "Dùng thành ngữ 'come rain or shine' và từ 'plotting' để tự nhiên hơn"
    }
  ],
  "translation": {
    "literal": "Mặc dù thời tiết tồi tệ, họ quyết định đi leo núi vì họ đã lên kế hoạch cho chuyến đi này trong nhiều tháng.",
    "natural": "Dù thời tiết rất xấu, họ vẫn quyết định đi leo núi vì đã chuẩn bị cho chuyến đi này từ nhiều tháng trước."
  }
}
```

## Hướng Dẫn Tích Hợp

### 1. Tích hợp với AI Service

Để tích hợp chức năng phân tích câu vào hệ thống AI hiện có, bạn cần:

```typescript
// src/lib/ai/sentence-analysis.ts
import { aiService } from './ai-service';
import { SentenceAnalysis } from './types';

export async function analyzeSentence(
  sentence: string,
  paragraphContext?: string
): Promise<SentenceAnalysis> {
  const prompt = generateSentenceAnalysisPrompt(sentence, paragraphContext);
  const response = await aiService.generateText({
    prompt,
    temperature: 0.3, // Giảm temperature để kết quả nhất quán
    maxTokens: 1500,
  });
  
  try {
    return JSON.parse(response.text) as SentenceAnalysis;
  } catch (error) {
    throw new Error(`Failed to parse sentence analysis: ${error}`);
  }
}

function generateSentenceAnalysisPrompt(
  sentence: string,
  paragraphContext?: string
): string {
  const context = paragraphContext || '';
  
  return `
Bạn là một chuyên gia ngôn ngữ học và biên tập viên cao cấp. Nhiệm vụ của bạn là phân tích sâu câu văn "${sentence}" và đề xuất các cách viết lại tối ưu hơn.

INPUT:
- Target Sentence: "${sentence}"
- Paragraph Context: "${context}"

YÊU CẦU OUTPUT:
1. Trả về duy nhất JSON valid (RFC 8259).
2. KHÔNG markdown, KHÔNG lời dẫn.
3. Ngôn ngữ giải thích: Tiếng Việt.
4. Phần "rewrite_suggestions" phải giữ nguyên ý nghĩa gốc nhưng thay đổi văn phong/cấu trúc.

JSON SCHEMA:
{
  "meta": {
    "sentence": "${sentence}",
    "complexity_level": "Độ khó (Basic/Intermediate/Advanced)",
    "sentence_type": "Loại câu (Simple/Compound/Complex...)"
  },
  "semantics": {
    "main_idea": "Ý chính bao quát",
    "subtext": "Hàm ý/Ẩn ý (nếu có)",
    "sentiment": "Positive/Negative/Neutral"
  },
  "grammar_breakdown": {
    "subject": "Chủ ngữ",
    "main_verb": "Động từ chính",
    "object": "Tân ngữ/Bổ ngữ",
    "clauses": [ // Phân tách mệnh đề
      { "text": "Nội dung mệnh đề", "type": "Independent/Dependent..." }
    ]
  },
  "contextual_role": {
    "function": "Chức năng trong đoạn (Mở bài/Giải thích/Kết luận...)",
    "relation_to_previous": "Mối liên hệ với câu trước đó"
  },
  "key_components": [
    {
      "phrase": "Cụm từ hay/quan trọng",
      "type": "Idiom/Collocation/Grammar Pattern",
      "meaning": "Giải thích",
      "significance": "Cái hay của cụm từ này"
    }
  ],
  "rewrite_suggestions": [ // <--- NEW FEATURE
    {
      "style": "Formal/Academic",
      "text": "Phiên bản viết lại trang trọng (dùng cho báo cáo, văn bản)",
      "change_log": "Giải thích ngắn gọn thay đổi (ví dụ: Thay 'get' bằng 'obtain', dùng câu bị động...)"
    },
    {
      "style": "Simplified/Clear",
      "text": "Phiên bản đơn giản hóa (dùng cho người mới học, dễ hiểu)",
      "change_log": "Giải thích (ví dụ: Tách câu ghép thành câu đơn, dùng từ vựng A1...)"
    },
    {
      "style": "Native/Idiomatic",
      "text": "Phiên bản tự nhiên như người bản xứ",
      "change_log": "Giải thích (ví dụ: Dùng idiom X thay cho cách diễn đạt thông thường)"
    }
  ],
  "translation": {
    "literal": "Dịch sát nghĩa",
    "natural": "Dịch hay/thoát ý"
  }
}
`;
}
```

### 2. API Route

Tạo API route để xử lý yêu cầu phân tích câu:

```typescript
// src/app/api/ai/analyze-sentence/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentence } from '@/lib/ai/sentence-analysis';

export async function POST(request: NextRequest) {
  try {
    const { sentence, paragraphContext } = await request.json();
    
    if (!sentence) {
      return NextResponse.json(
        { error: 'Sentence is required' },
        { status: 400 }
      );
    }
    
    const analysis = await analyzeSentence(sentence, paragraphContext);
    
    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Sentence analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentence' },
      { status: 500 }
    );
  }
}
```

### 3. React Hook

Tạo hook để sử dụng trong components:

```typescript
// src/hooks/use-sentence-analysis.ts
import { useState } from 'react';
import { SentenceAnalysis } from '@/lib/ai/types';

export function useSentenceAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const analyzeSentence = async (
    sentence: string,
    paragraphContext?: string
  ): Promise<SentenceAnalysis | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/analyze-sentence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sentence, paragraphContext }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze sentence');
      }
      
      const result = await response.json();
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { analyzeSentence, loading, error };
}
```

### 4. Component Ví Dụ

```typescript
// src/components/sentence-analysis.tsx
'use client';

import { useState } from 'react';
import { useSentenceAnalysis } from '@/hooks/use-sentence-analysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export function SentenceAnalysisComponent() {
  const [sentence, setSentence] = useState('');
  const [context, setContext] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  
  const { analyzeSentence, loading, error } = useSentenceAnalysis();
  
  const handleAnalyze = async () => {
    if (!sentence.trim()) return;
    
    const result = await analyzeSentence(sentence, context);
    if (result) {
      setAnalysis(result);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phân Tích Câu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="sentence" className="block text-sm font-medium mb-2">
              Cần phân tích
            </label>
            <Textarea
              id="sentence"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="Nhập câu cần phân tích..."
              className="min-h-[80px]"
            />
          </div>
          
          <div>
            <label htmlFor="context" className="block text-sm font-medium mb-2">
              Ngữ cảnh đoạn văn (tùy chọn)
            </label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Nhập đoạn văn chứa câu này..."
              className="min-h-[80px]"
            />
          </div>
          
          <Button onClick={handleAnalyze} disabled={!sentence.trim() || loading}>
            {loading ? 'Đang phân tích...' : 'Phân tích'}
          </Button>
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
        </CardContent>
      </Card>
      
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Kết Quả Phân Tích</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Meta</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Độ khó:</span>{' '}
                  <Badge variant={analysis.meta.complexity_level === 'Basic' ? 'secondary' : 
                                 analysis.meta.complexity_level === 'Intermediate' ? 'default' : 
                                 'destructive'}>
                    {analysis.meta.complexity_level}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Loại câu:</span> {analysis.meta.sentence_type}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Ngữ nghĩa</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Ý chính:</span> {analysis.semantics.main_idea}
                </div>
                {analysis.semantics.subtext && (
                  <div>
                    <span className="font-medium">Hàm ý:</span> {analysis.semantics.subtext}
                  </div>
                )}
                <div>
                  <span className="font-medium">Cảm xúc:</span>{' '}
                  <Badge variant={analysis.semantics.sentiment === 'Positive' ? 'default' : 
                                 analysis.semantics.sentiment === 'Negative' ? 'destructive' : 
                                 'secondary'}>
                    {analysis.semantics.sentiment}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Ng pháp</h3>
              <div className="space-y-2">
                <div><span className="font-medium">Chủ ngữ:</span> {analysis.grammar_breakdown.subject}</div>
                <div><span className="font-medium">Động từ chính:</span> {analysis.grammar_breakdown.main_verb}</div>
                <div><span className="font-medium">Tân ngữ:</span> {analysis.grammar_breakdown.object}</div>
                
                {analysis.grammar_breakdown.clauses.length > 0 && (
                  <div>
                    <span className="font-medium">Mệnh đề:</span>
                    <ul className="ml-4 mt-1 space-y-1">
                      {analysis.grammar_breakdown.clauses.map((clause: any, index: number) => (
                        <li key={index} className="text-sm">
                          <span className="font-medium">{clause.type}:</span> {clause.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Vai trò ngữ cảnh</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Chức năng:</span> {analysis.contextual_role.function}
                </div>
                <div>
                  <span className="font-medium">Liên hệ với câu trước:</span> {analysis.contextual_role.relation_to_previous}
                </div>
              </div>
            </div>
            
            {analysis.key_components.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Thành phần chính</h3>
                <ul className="space-y-2">
                  {analysis.key_components.map((component: any, index: number) => (
                    <li key={index} className="border-l-2 border-blue-500 pl-4">
                      <div className="font-medium">{component.phrase}</div>
                      <div className="text-sm text-gray-600">Loại: {component.type}</div>
                      <div className="text-sm">{component.meaning}</div>
                      <div className="text-sm italic">{component.significance}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Đề xuất viết lại</h3>
              <div className="space-y-4">
                {analysis.rewrite_suggestions.map((suggestion: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="font-medium mb-2">
                      <Badge variant="outline">{suggestion.style}</Badge>
                    </div>
                    <div className="italic mb-2">"{suggestion.text}"</div>
                    <div className="text-sm text-gray-600">{suggestion.change_log}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Dịch</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Dịch sát nghĩa:</span> {analysis.translation.literal}
                </div>
                <div>
                  <span className="font-medium">Dịch thoát ý:</span> {analysis.translation.natural}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

## Lưu Ý Quan Trọng

1. **Xử lý lỗi JSON**: AI có thể trả về JSON không hợp lệ, cần có cơ chế xử lý lỗi và retry.
2. **Cache kết quả**: Implement cache để tránh phân tích lại cùng một câu nhiều lần.
3. **Rate limiting**: Giới hạn số lượng yêu cầu để tránh overloading API.
4. **Validation**: Validate input trước khi gửi đến AI service.
5. **Performance**: Cân nhắc sử dụng streaming response cho các câu phức tạp.

## Cập Nhật Database Schema

Nếu cần lưu kết quả phân tích câu vào database, bạn có thể cần cập nhật schema:

```sql
-- Thêm bảng sentence_analysis
CREATE TABLE sentence_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  sentence TEXT NOT NULL,
  context TEXT,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index cho tìm kiếm nhanh
CREATE INDEX idx_sentence_analyses_user_id ON sentence_analyses(user_id);
CREATE INDEX idx_sentence_analyses_sentence ON sentence_analyses USING gin(to_tsvector('english', sentence));
```

## Kết Luận

Chức năng phân tích câu cung cấp một công cụ mạnh mẽ để người học hiểu sâu về cấu trúc và cách sử dụng câu trong tiếng Anh. Với các đề xuất viết lại theo nhiều văn phong khác nhau, người học có thể mở rộng vốn từ vựng và cải thiện kỹ năng viết của mình.