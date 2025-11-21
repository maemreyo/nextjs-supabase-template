# Phân Tích Đoạn Văn (Paragraph Analysis)

## Giới thiệu

Chức năng phân tích đoạn văn là một trong ba thành phần cốt lõi của hệ thống AI Language Learning, bên cạnh phân tích từ và phân tích câu. Chức năng này giúp người học hiểu sâu về cấu trúc, nội dung và kỹ thuật viết của một đoạn văn hoàn chỉnh, từ đó cải thiện khả năng đọc hiểu và viết luận.

Phân tích đoạn văn cung cấp cái nhìn toàn diện về:
- Thể loại và giọng điệu của văn bản
- Phân tích nội dung và cảm xúc
- Cấu trúc và mạch lạc của đoạn văn
- Đánh giá phong cách viết
- Góp ý xây dựng để cải thiện

## Interface TypeScript

```typescript
interface ParagraphAnalysis {
  meta: {
    type: string; // Xác định thể loại văn bản (Tự sự/Miêu tả/Nghị luận/Thuyết minh/Hành chính...)
    tone: string; // Xác định giọng điệu chủ đạo (Trang trọng/Thân mật/Châm biếm/Khách quan/Bi quan...)
    target_audience: string; // Dự đoán đối tượng độc giả mà đoạn văn hướng tới (Trẻ em/Chuyên gia/Đại chúng...)
  };
  content_analysis: {
    main_topic: string; // Tóm tắt chủ đề chính hoặc luận điểm cốt lõi của đoạn văn trong 1 câu
    sentiment: {
      label: string; // Nhãn cảm xúc (Positive/Negative/Neutral/Mixed)
      intensity: number; // Mức độ cảm xúc (1-10, với 10 là cực độ)
      justification: string; // Giải thích tại sao có cảm xúc này? (Dựa trên từ ngữ cảm thán hay nội dung sự việc?)
    };
    keywords: string[]; // Danh sách 3-5 từ khóa quan trọng nhất phản ánh nội dung
  };
  structure_breakdown: Array<{
    sentence_index: number; // Số thứ tự câu
    snippet: string; // 3-5 từ đầu của câu để nhận diện...
    role: string; // Vai trò của câu (Topic Sentence/Supporting Detail/Evidence/Example/Transition/Conclusion)
    analysis: string; // Giải thích ngắn gọn câu này đóng góp gì cho ý chính của đoạn?
  }>;
  coherence_and_cohesion: {
    logic_score: number; // Điểm mạch lạc về ý (1-100). Các ý có sắp xếp hợp lý không?
    flow_score: number; // Điểm trôi chảy về từ ngữ (1-100). Chuyển ý có mượt mà không?
    transition_words: string[]; // Liệt kê các từ nối (connectives) đã được sử dụng (ví dụ: Tuy nhiên, Hơn nữa...)
    gap_analysis: string; // Chỉ ra những chỗ bị 'gãy' mạch hoặc chuyển ý đột ngột (nếu có)
  };
  stylistic_evaluation: {
    vocabulary_level: string; // Đánh giá vốn từ (Cơ bản/Phong phú/Học thuật/Lặp từ)
    sentence_variety: string; // Đánh giá sự đa dạng cấu trúc câu (Có bị toàn câu đơn không? Có kết hợp câu ngắn dài không?)
  };
  constructive_feedback: {
    critiques: Array<{
      issue_type: string; // Loại lỗi (Logic/Grammar/Vocabulary/Repetition/Style)
      description: string; // Mô tả chi tiết vấn đề đang gặp phải
      suggestion: string; // Đề xuất cách sửa cụ thể cho vấn đề này
    }>;
    better_version: string; // Viết lại đoạn văn này (Rewrite) sao cho hay hơn, mạch lạc hơn, khắc phục các lỗi đã nêu ở trên nhưng vẫn giữ nguyên ý gốc.
  };
}
```

## Prompt Template

```typescript
const prompt = `
Bạn là một biên tập viên cao cấp, chuyên gia ngôn ngữ học và phê bình văn học. Nhiệm vụ của bạn là phân tích toàn diện đoạn văn được cung cấp dưới đây.

INPUT DATA:
- Paragraph: "${paragraph}"

YÊU CẦU XỬ LÝ:
1. Phân tích sâu cấu trúc, nội dung, cảm xúc và kỹ thuật viết.
2. Trả về kết quả dưới dạng JSON hợp lệ (RFC 8259).
3. Ngôn ngữ trong các trường giải thích (value) là Tiếng Việt.
4. Tuyệt đối không thêm text dẫn nhập hay markdown (như \\`\\`\\`), chỉ trả về raw JSON string.

HƯỚNG DẪN JSON SCHEMA CHI TIẾT:
{
  "meta": {
    "type": "Xác định thể loại văn bản (Tự sự/Miêu tả/Nghị luận/Thuyết minh/Hành chính...)",
    "tone": "Xác định giọng điệu chủ đạo (Trang trọng/Thân mật/Châm biếm/Khách quan/Bi quan...)",
    "target_audience": "Dự đoán đối tượng độc giả mà đoạn văn hướng tới (Trẻ em/Chuyên gia/Đại chúng...)"
  },
  "content_analysis": {
    "main_topic": "Tóm tắt chủ đề chính hoặc luận điểm cốt lõi của đoạn văn trong 1 câu",
    "sentiment": {
      "label": "Nhãn cảm xúc (Positive/Negative/Neutral/Mixed)",
      "intensity": "Mức độ cảm xúc (1-10, với 10 là cực độ)",
      "justification": "Giải thích tại sao có cảm xúc này? (Dựa trên từ ngữ cảm thán hay nội dung sự việc?)"
    },
    "keywords": ["Danh sách 3-5 từ khóa quan trọng nhất phản ánh nội dung"]
  },
  "structure_breakdown": [ // Phân tích từng câu để vẽ lại bản đồ tư duy của đoạn
    {
      "sentence_index": 1, // Số thứ tự câu
      "snippet": "3-5 từ đầu của câu để nhận diện...",
      "role": "Vai trò của câu (Topic Sentence/Supporting Detail/Evidence/Example/Transition/Conclusion)",
      "analysis": "Giải thích ngắn gọn câu này đóng góp gì cho ý chính của đoạn?"
    }
    // ... tiếp tục cho các câu còn lại
  ],
  "coherence_and_cohesion": { // Đánh giá tính mạch lạc và liên kết
    "logic_score": "Điểm mạch lạc về ý (1-100). Các ý có sắp xếp hợp lý không?",
    "flow_score": "Điểm trôi chảy về từ ngữ (1-100). Chuyển ý có mượt mà không?",
    "transition_words": ["Liệt kê các từ nối (connectives) đã được sử dụng (ví dụ: Tuy nhiên, Hơn nữa...)"],
    "gap_analysis": "Chỉ ra những chỗ bị 'gãy' mạch hoặc chuyển ý đột ngột (nếu có)"
  },
  "stylistic_evaluation": {
    "vocabulary_level": "Đánh giá vốn từ (Cơ bản/Phong phú/Học thuật/Lặp từ)",
    "sentence_variety": "Đánh giá sự đa dạng cấu trúc câu (Có bị toàn câu đơn không? Có kết hợp câu ngắn dài không?)"
  },
  "constructive_feedback": {
    "critiques": [ // Danh sách các vấn đề cụ thể cần sửa
      {
        "issue_type": "Loại lỗi (Logic/Grammar/Vocabulary/Repetition/Style)",
        "description": "Mô tả chi tiết vấn đề đang gặp phải",
        "suggestion": "Đề xuất cách sửa cụ thể cho vấn đề này"
      }
    ],
    "better_version": "Viết lại đoạn văn này (Rewrite) sao cho hay hơn, mạch lạc hơn, khắc phục các lỗi đã nêu ở trên nhưng vẫn giữ nguyên ý gốc."
  }
}
`;
```

## Ví dụ Sử Dụng

### Ví dụ 1: Đoạn văn miêu tả

```typescript
const paragraph = "Bình minh trên núi là một khung cảnh tuyệt đẹp. Những tia nắng đầu tiên len lỏi qua kẽ lá, nhuộm vàng cả không gian. Sương đêm còn đọng trên cỏ, lấp lánh như ngàn viên kim cương nhỏ. Chim bắt đầu hót líu lo, báo hiệu một ngày mới đang đến. Không khí trong lành và mát rượi, mang theo hương của đất ẩm và hoa dại.";

const result = await analyzeParagraph(paragraph);
// Kết quả sẽ là một object ParagraphAnalysis với các trường được điền đầy đủ
```

### Ví dụ 2: Đoạn văn nghị luận

```typescript
const paragraph = "Trong xã hội hiện đại, giáo dục đóng vai trò nền tảng cho sự phát triển. Không chỉ cung cấp kiến thức, giáo dục còn định hình nhân cách và tư duy phản biện. Tuy nhiên, nhiều người vẫn xem nhẹ tầm quan trọng của việc học tập suốt đời. Điều này dẫn đến sự tụt hậu về kỹ năng và khó khăn trong việc thích ứng với thay đổi công nghệ. Do đó, cần nâng cao nhận thức cộng đồng về giá trị của giáo dục liên tục.";

const result = await analyzeParagraph(paragraph);
// Kết quả phân tích sẽ nhận diện đây là đoạn nghị luận với các luận điểm và bằng chứng
```

### Ví dụ 3: Đoạn văn học thuật

```typescript
const paragraph = "Nghiên cứu này sử dụng phương pháp định lượng để phân tích tác động của biến đổi khí hậu đến sản xuất nông nghiệp. Dữ liệu được thu thập từ 50 tỉnh thành trong giai đoạn 2010-2020. Kết quả cho thấy nhiệt độ tăng 1°C làm giảm sản lượng lúa khoảng 5%. Mô hình hồi quy đa biến xác định các yếu tố chính ảnh hưởng bao gồm lượng mưa, độ ẩm đất và thời gian gieo trồng. Những phát hiện này cung cấp cơ sở khoa học cho việc xây dựng chính sách thích ứng.";

const result = await analyzeParagraph(paragraph);
// Kết quả sẽ nhận diện giọng điệu học thuật, đối tượng là nhà nghiên cứu, và phân tích cấu trúc logic
```

## Hướng Dẫn Tích Hợp

### 1. Tích hợp với AI Service

```typescript
// src/lib/ai/paragraph-analysis.ts
import { AIService } from './ai-service';
import { ParagraphAnalysis } from '../types';

export class ParagraphAnalysisService {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  async analyzeParagraph(paragraph: string): Promise<ParagraphAnalysis> {
    const prompt = this.buildPrompt(paragraph);
    const response = await this.aiService.generateText(prompt);
    
    try {
      return JSON.parse(response) as ParagraphAnalysis;
    } catch (error) {
      throw new Error(`Failed to parse paragraph analysis: ${error}`);
    }
  }

  private buildPrompt(paragraph: string): string {
    return `
Bạn là một biên tập viên cao cấp, chuyên gia ngôn ngữ học và phê bình văn học. Nhiệm vụ của bạn là phân tích toàn diện đoạn văn được cung cấp dưới đây.

INPUT DATA:
- Paragraph: "${paragraph}"

YÊU CẦU XỬ LÝ:
1. Phân tích sâu cấu trúc, nội dung, cảm xúc và kỹ thuật viết.
2. Trả về kết quả dưới dạng JSON hợp lệ (RFC 8259).
3. Ngôn ngữ trong các trường giải thích (value) là Tiếng Việt.
4. Tuyệt đối không thêm text dẫn nhập hay markdown (như \\`\\`\\`), chỉ trả về raw JSON string.

HƯỚNG DẪN JSON SCHEMA CHI TIẾT:
{
  "meta": {
    "type": "Xác định thể loại văn bản (Tự sự/Miêu tả/Nghị luận/Thuyết minh/Hành chính...)",
    "tone": "Xác định giọng điệu chủ đạo (Trang trọng/Thân mật/Châm biếm/Khách quan/Bi quan...)",
    "target_audience": "Dự đoán đối tượng độc giả mà đoạn văn hướng tới (Trẻ em/Chuyên gia/Đại chúng...)"
  },
  "content_analysis": {
    "main_topic": "Tóm tắt chủ đề chính hoặc luận điểm cốt lõi của đoạn văn trong 1 câu",
    "sentiment": {
      "label": "Nhãn cảm xúc (Positive/Negative/Neutral/Mixed)",
      "intensity": "Mức độ cảm xúc (1-10, với 10 là cực độ)",
      "justification": "Giải thích tại sao có cảm xúc này? (Dựa trên từ ngữ cảm thán hay nội dung sự việc?)"
    },
    "keywords": ["Danh sách 3-5 từ khóa quan trọng nhất phản ánh nội dung"]
  },
  "structure_breakdown": [ // Phân tích từng câu để vẽ lại bản đồ tư duy của đoạn
    {
      "sentence_index": 1, // Số thứ tự câu
      "snippet": "3-5 từ đầu của câu để nhận diện...",
      "role": "Vai trò của câu (Topic Sentence/Supporting Detail/Evidence/Example/Transition/Conclusion)",
      "analysis": "Giải thích ngắn gọn câu này đóng góp gì cho ý chính của đoạn?"
    }
    // ... tiếp tục cho các câu còn lại
  ],
  "coherence_and_cohesion": { // Đánh giá tính mạch lạc và liên kết
    "logic_score": "Điểm mạch lạc về ý (1-100). Các ý có sắp xếp hợp lý không?",
    "flow_score": "Điểm trôi chảy về từ ngữ (1-100). Chuyển ý có mượt mà không?",
    "transition_words": ["Liệt kê các từ nối (connectives) đã được sử dụng (ví dụ: Tuy nhiên, Hơn nữa...)"],
    "gap_analysis": "Chỉ ra những chỗ bị 'gãy' mạch hoặc chuyển ý đột ngột (nếu có)"
  },
  "stylistic_evaluation": {
    "vocabulary_level": "Đánh giá vốn từ (Cơ bản/Phong phú/Học thuật/Lặp từ)",
    "sentence_variety": "Đánh giá sự đa dạng cấu trúc câu (Có bị toàn câu đơn không? Có kết hợp câu ngắn dài không?)"
  },
  "constructive_feedback": {
    "critiques": [ // Danh sách các vấn đề cụ thể cần sửa
      {
        "issue_type": "Loại lỗi (Logic/Grammar/Vocabulary/Repetition/Style)",
        "description": "Mô tả chi tiết vấn đề đang gặp phải",
        "suggestion": "Đề xuất cách sửa cụ thể cho vấn đề này"
      }
    ],
    "better_version": "Viết lại đoạn văn này (Rewrite) sao cho hay hơn, mạch lạc hơn, khắc phục các lỗi đã nêu ở trên nhưng vẫn giữ nguyên ý gốc."
  }
}
`;
  }
}
```

### 2. Tích hợp với API Route

```typescript
// src/app/api/ai/analyze-paragraph/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai/ai-service-server';
import { ParagraphAnalysisService } from '@/lib/ai/paragraph-analysis';

export async function POST(request: NextRequest) {
  try {
    const { paragraph } = await request.json();
    
    if (!paragraph) {
      return NextResponse.json(
        { error: 'Paragraph is required' },
        { status: 400 }
      );
    }

    const aiService = getAIService();
    const paragraphService = new ParagraphAnalysisService(aiService);
    
    const analysis = await paragraphService.analyzeParagraph(paragraph);
    
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing paragraph:', error);
    return NextResponse.json(
      { error: 'Failed to analyze paragraph' },
      { status: 500 }
    );
  }
}
```

### 3. Tích hợp với Frontend Component

```typescript
// src/components/paragraph-analysis.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ParagraphAnalysis } from '@/lib/types';

export function ParagraphAnalysisComponent() {
  const [paragraph, setParagraph] = useState('');
  const [analysis, setAnalysis] = useState<ParagraphAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!paragraph.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/analyze-paragraph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paragraph }),
      });
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phân Tích Đoạn Văn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Nhập đoạn văn cần phân tích..."
            value={paragraph}
            onChange={(e) => setParagraph(e.target.value)}
            rows={6}
          />
          <Button 
            onClick={handleAnalyze} 
            disabled={!paragraph.trim() || isLoading}
          >
            {isLoading ? 'Đang phân tích...' : 'Phân tích'}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-4">
          {/* Hiển thị kết quả phân tích */}
          <Card>
            <CardHeader>
              <CardTitle>Kết Quả Phân Tích</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Meta Information */}
              <div>
                <h3 className="font-semibold">Thông tin chung</h3>
                <p>Thể loại: {analysis.meta.type}</p>
                <p>Giọng điệu: {analysis.meta.tone}</p>
                <p>Đối tượng: {analysis.meta.target_audience}</p>
              </div>

              {/* Content Analysis */}
              <div>
                <h3 className="font-semibold">Phân tích nội dung</h3>
                <p>Chủ đề chính: {analysis.content_analysis.main_topic}</p>
                <p>Cảm xúc: {analysis.content_analysis.sentiment.label} (mức độ: {analysis.content_analysis.sentiment.intensity}/10)</p>
                <p>Lý do: {analysis.content_analysis.sentiment.justification}</p>
                <p>Từ khóa: {analysis.content_analysis.keywords.join(', ')}</p>
              </div>

              {/* Structure Breakdown */}
              <div>
                <h3 className="font-semibold">Phân tích cấu trúc</h3>
                {analysis.structure_breakdown.map((sentence, index) => (
                  <div key={index} className="ml-4 mb-2">
                    <p>Câu {sentence.sentence_index}: "{sentence.snippet}..."</p>
                    <p>Vai trò: {sentence.role}</p>
                    <p>Phân tích: {sentence.analysis}</p>
                  </div>
                ))}
              </div>

              {/* Coherence and Cohesion */}
              <div>
                <h3 className="font-semibold">Tính mạch lạc và liên kết</h3>
                <p>Điểm logic: {analysis.coherence_and_cohesion.logic_score}/100</p>
                <p>Điểm trôi chảy: {analysis.coherence_and_cohesion.flow_score}/100</p>
                <p>Từ nối: {analysis.coherence_and_cohesion.transition_words.join(', ')}</p>
                <p>Phân tích khoảng trống: {analysis.coherence_and_cohesion.gap_analysis}</p>
              </div>

              {/* Stylistic Evaluation */}
              <div>
                <h3 className="font-semibold">Đánh giá phong cách</h3>
                <p>Cấp độ từ vựng: {analysis.stylistic_evaluation.vocabulary_level}</p>
                <p>Đa dạng cấu trúc câu: {analysis.stylistic_evaluation.sentence_variety}</p>
              </div>

              {/* Constructive Feedback */}
              <div>
                <h3 className="font-semibold">Góp ý xây dựng</h3>
                {analysis.constructive_feedback.critiques.map((critique, index) => (
                  <div key={index} className="ml-4 mb-2">
                    <p>Loại lỗi: {critique.issue_type}</p>
                    <p>Mô tả: {critique.description}</p>
                    <p>Đề xuất: {critique.suggestion}</p>
                  </div>
                ))}
                <div className="mt-4">
                  <h4 className="font-medium">Phiên bản cải tiến:</h4>
                  <p className="italic">{analysis.constructive_feedback.better_version}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
```

## Lưu Ý Quan Trọng

1. **Xử lý lỗi JSON**: Luôn bao bọc việc parse JSON trong try-catch để xử lý trường hợp AI trả về JSON không hợp lệ.

2. **Cache kết quả**: Cân nhắc cache kết quả phân tích cho cùng một đoạn văn để giảm chi phí API.

3. **Rate limiting**: Áp dụng rate limiting để tránh lạm dụng API.

4. **Validation**: Thêm validation cho input trước khi gửi đến AI service.

5. **Error handling**: Cung cấp thông báo lỗi rõ ràng cho người dùng khi phân tích thất bại.

6. **Performance**: Đối với đoạn văn dài, cân nhắc chia nhỏ hoặc giới hạn độ dài để đảm bảo hiệu suất.

7. **Testing**: Viết unit tests cho các trường hợp đầu vào khác nhau để đảm bảo kết quả nhất quán.