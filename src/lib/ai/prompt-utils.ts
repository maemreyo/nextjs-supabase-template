import {
  WordAnalysis,
  SentenceAnalysis,
  ParagraphAnalysis,
  PhraseAnalysis,
  AnalyzeWordRequest,
  AnalyzeSentenceRequest,
  AnalyzeParagraphRequest,
  AnalyzePhraseRequest
} from './types'
import { analysisLogger } from '@/services/logger'

// Highlight Analysis Types
export interface HighlightMetadata {
  id: string
  highlight_type: 'word' | 'phrase' | 'sentence' | 'paragraph'
  content: string
  selected_text: string
  start_position: number
  end_position: number
  document_context?: string
  paragraph_index?: number
  sentence_index?: number
  selection_duration_ms?: number
  click_count?: number
  metadata?: Record<string, any>
}

export interface AnalyzeHighlightRequest {
  highlight: HighlightMetadata
  maxItems?: number
  sessionId?: string
}

// New Highlight Analysis Types
export interface HighlightAnalysisRequest {
  text: string
  context?: string
  maxItems?: number
  sessionId?: string
  metadata?: Record<string, any>
}

export type HighlightCategory =
  | 'word'
  | 'phrase'
  | 'sentence'
  | 'paragraph'
  | 'collocations'
  | 'idioms'
  | 'grammar'

export interface HighlightAnalysisResult {
  category: HighlightCategory
  confidence: number
  analysis: any
}

// Highlight Analysis Prompt Builder (New Approach)
export function buildHighlightAnalysisPrompt(request: HighlightAnalysisRequest): string {
  const { text, context, maxItems = 5 } = request
  
  analysisLogger.debug('Building highlight analysis prompt', {
    text,
    context,
    maxItems
  })
  
  // Build universal prompt that lets AI auto-detect and analyze based on category
  return buildUniversalAutoDetectionPrompt(text, context, maxItems)
}

// Auto-detection function for highlight categories
function detectHighlightCategory(text: string, context?: string): HighlightCategory {
  const trimmedText = text.trim()
  const wordCount = trimmedText.split(/\s+/).length
  const charCount = trimmedText.length
  
  // Check for specific patterns
  const hasMultipleWords = wordCount > 1
  const hasSentenceStructure = /[.!?]$/.test(trimmedText) || wordCount > 5
  const hasParagraphStructure = wordCount > 20 || /\n/.test(trimmedText)
  
  // Check for idioms and collocations patterns
  const idiomPatterns = [
    /\b(the\s+)?(cat|dog|bird|fish|horse|lion|tiger|elephant)\s+(in\s+the\s+)?(hat|bag|house|room|water|air)\b/i,
    /\b(spill\s+the\s+beans|break\s+the\s+ice|hit\s+the\s+nail\s+on\s+the\s+head|costs\s+an\s+arm\s+and\s+a\s+leg)\b/i,
    /\b(once\s+in\s+a\s+blue\s+moon|under\s+the\s+weather|piece\s+of\s+cake|rain\s+cats\s+and\s+dogs)\b/i
  ]
  
  const collocationPatterns = [
    /\b(make|do|take|have|get|give)\s+\w+\s+\w+\b/i,
    /\b(strong|heavy|light|deep|rich|poor)\s+\w+\b/i,
    /\b(completely|totally|absolutely|utterly)\s+\w+\b/i
  ]
  
  const grammarPatterns = [
    /\b(if|when|while|because|although|since|unless|as)\s+.*\b(then|,)\s*/i,
    /\b(the|a|an)\s+\w+\s+(that|which|who|whom|whose)\s+/i,
    /\b(not\s+only|both|either|neither)\s+.*\s+(but\s+also|and|or)\s+/i
  ]
  
  // Priority-based detection
  if (hasParagraphStructure) {
    return 'paragraph'
  }
  
  if (hasSentenceStructure) {
    return 'sentence'
  }
  
  if (idiomPatterns.some(pattern => pattern.test(trimmedText))) {
    return 'idioms'
  }
  
  if (collocationPatterns.some(pattern => pattern.test(trimmedText))) {
    return 'collocations'
  }
  
  if (grammarPatterns.some(pattern => pattern.test(trimmedText))) {
    return 'grammar'
  }
  
  if (hasMultipleWords) {
    return 'phrase'
  }
  
  return 'word'
}

// New prompt builders for each category
function buildWordAnalysisPromptNew(word: string, context?: string, maxItems: number = 5): string {
  return `Bạn là một chuyên gia ngôn ngữ học. Phân tích từ "${word}" trong ngữ cảnh được cung cấp.

INPUT:
- Từ: "${word}"
- Ngữ cảnh: "${context || ''}"
- Số lượng tối đa: ${maxItems}

YÊU CẦU:
1. Trả về JSON hợp lệ, không markdown
2. Phân tích chi tiết từ vựng, ngữ pháp và cách sử dụng
3. Giải thích bằng Tiếng Việt
4. Cung cấp đầy đủ thông tin nghiên cứu: từ nguyên thể, các từ liên quan, mẫu câu, thành ngữ liên quan

JSON SCHEMA:
{
  "highlight_analysis": {
    "category": "word",
    "confidence": 9,
    "word": "${word}",
    "meta": {
      "ipa": "Phiên âm IPA",
      "pos": "Từ loại (noun, verb, adjective, etc.)",
      "cefr": "Trình độ CEFR (A1-C2)",
      "frequency": "Mức độ phổ biến (common/uncommon/rare)",
      "etymology": "Nguồn gốc từ (nếu có)",
      "register": "Đăng ký (formal/informal/academic)"
    },
    "definitions": {
      "root_meaning": "Nghĩa gốc trong từ điển",
      "context_meaning": "Nghĩa trong ngữ cảnh cụ thể",
      "vietnamese_translation": "Dịch sang tiếng Việt",
      "nuances": "Các sắc thái nghĩa khác nhau"
    },
    "relations": {
      "synonyms": [
        {"word": "từ đồng nghĩa 1", "meaning": "định nghĩa ngắn", "usage": "cách dùng khác biệt"}
      ],
      "antonyms": [
        {"word": "từ trái nghĩa 1", "meaning": "định nghĩa ngắn", "usage": "cách dùng khác biệt"}
      ]
    },
    "usage": {
      "collocations": [
        {"phrase": "cụm từ collocation 1", "meaning": "nghĩa cụm từ", "frequency": "mức độ sử dụng"}
      ],
      "examples": [
        {"sentence": "câu ví dụ 1", "translation": "dịch câu", "context": "ngữ cảnh sử dụng"},
        {"sentence": "câu ví dụ 2", "translation": "dịch câu", "context": "ngữ cảnh sử dụng"}
      ],
      "common_mistakes": [
        {"mistake": "lỗi sai phổ biến", "correction": "cách sửa", "explanation": "giải thích"}
      ]
    },
    "learning_tips": {
      "memory_techniques": ["kỹ thuật ghi nhớ 1", "kỹ thuật ghi nhớ 2"],
      "practice_exercises": ["bài tập luyện tập 1", "bài tập luyện tập 2"],
      "related_concepts": ["khái niệm liên quan 1", "khái niệm liên quan 2"]
    }
  }
}`
}

function buildPhraseAnalysisPromptNew(phrase: string, context?: string, maxItems: number = 5): string {
  return `Bạn là một chuyên gia ngôn ngữ học. Phân tích cụm từ "${phrase}" trong ngữ cảnh được cung cấp.

INPUT:
- Cụm từ: "${phrase}"
- Ngữ cảnh: "${context || ''}"
- Số lượng tối đa: ${maxItems}

YÊU CẦU:
1. Trả về JSON hợp lệ, không markdown
2. Phân tích cấu trúc, nghĩa và cách sử dụng
3. Giải thích bằng Tiếng Việt
4. Cung cấp đầy đủ thông tin nghiên cứu: cấu trúc ngữ pháp, các biến thể, thành ngữ liên quan

JSON SCHEMA:
{
  "highlight_analysis": {
    "category": "phrase",
    "confidence": 9,
    "phrase": "${phrase}",
    "meta": {
      "type": "Loại cụm từ (phrasal verb, idiom, collocation, compound noun)",
      "structure": "Cấu trúc ngữ pháp (verb + preposition, adjective + noun, etc.)",
      "register": "Đăng ký (formal/informal/academic/business)",
      "cefr": "Trình độ CEFR (A1-C2)",
      "frequency": "Mức độ phổ biến (common/uncommon/rare)"
    },
    "definitions": {
      "literal_meaning": "Nghĩa đen (nếu có)",
      "figurative_meaning": "Nghĩa bóng/nghĩa ẩn",
      "vietnamese_translation": "Dịch sang tiếng Việt",
      "usage_notes": "Lưu ý quan trọng về cách sử dụng",
      "cultural_context": "Bối cảnh văn hóa (nếu có)"
    },
    "components": [
      {
        "word": "từ thành phần 1",
        "role": "vai trò trong cụm (main verb, preposition, etc.)",
        "meaning": "nghĩa khi đứng riêng",
        "ipa": "phiên âm IPA"
      }
    ],
    "variations": [
      {
        "phrase": "biến thể 1",
        "meaning": "nghĩa của biến thể",
        "usage": "cách sử dụng biến thể",
        "example": "câu ví dụ"
      }
    ],
    "usage": {
      "examples": [
        {"sentence": "câu ví dụ 1", "translation": "dịch câu", "context": "ngữ cảnh sử dụng"},
        {"sentence": "câu ví dụ 2", "translation": "dịch câu", "context": "ngữ cảnh sử dụng"}
      ],
      "collocations": [
        {"phrase": "collocation liên quan", "meaning": "nghĩa", "frequency": "mức độ sử dụng"}
      ],
      "common_mistakes": [
        {"mistake": "lỗi sai phổ biến", "correction": "cách sửa", "explanation": "giải thích"}
      ]
    },
    "learning_tips": {
      "memory_techniques": ["kỹ thuật ghi nhớ 1", "kỹ thuật ghi nhớ 2"],
      "practice_exercises": ["bài tập luyện tập 1", "bài tập luyện tập 2"],
      "related_concepts": ["khái niệm liên quan 1", "khái niệm liên quan 2"]
    }
  }
}`
}

function buildSentenceAnalysisPromptNew(sentence: string, context?: string): string {
  return `Bạn là một chuyên gia ngôn ngữ học. Phân tích câu "${sentence}" trong ngữ cảnh được cung cấp.

INPUT:
- Câu: "${sentence}"
- Ngữ cảnh: "${context || ''}"

YÊU CẦU:
1. Trả về JSON hợp lệ, không markdown
2. Phân tích cấu trúc ngữ pháp và ý nghĩa
3. Giải thích bằng Tiếng Việt
4. Cung cấp đầy đủ thông tin nghiên cứu: cấu trúc ngữ pháp, các mẫu câu tương tự, thành ngữ liên quan

JSON SCHEMA:
{
  "highlight_analysis": {
    "category": "sentence",
    "confidence": 9,
    "sentence": "${sentence}",
    "meta": {
      "type": "Loại câu (simple, compound, complex, compound-complex)",
      "complexity": "Độ phức tạp (basic/intermediate/advanced)",
      "tone": "Giọng điệu (formal/informal/neutral/ironic/etc)",
      "register": "Đăng ký (academic/business/casual/literary)",
      "purpose": "Mục đích (inform/persuade/describe/question/etc)"
    },
    "structure": {
      "subject": "Chủ ngữ và các thành phần",
      "predicate": "Vị ngữ (động từ chính + tân ngữ/bổ ngữ)",
      "clauses": [
        {
          "type": "Loại mệnh đề (independent/dependent/relative)",
          "content": "Nội dung mệnh đề",
          "role": "Chức năng trong câu"
        }
      ],
      "modifiers": [
        {"type": "loại bổ nghĩa (adjective/adverb/prepositional phrase)", "content": "Nội dung bổ nghĩa", "target": "Vị trí được bổ nghĩa"}
      ],
      "connectors": ["Từ nối và quan hệ từ được sử dụng"]
    },
    "meaning": {
      "main_idea": "Ý chính của câu",
      "supporting_ideas": ["Các ý phụ hỗ trợ ý chính"],
      "sentiment": "Cảm xúc (positive/negative/neutral/mixed)",
      "implications": "Hàm ý hoặc ý ẩn (nếu có)",
      "presuppositions": ["Các giả định ngầm hiểu"]
    },
    "style_analysis": {
      "clarity": "Độ rõ ràng của câu",
      "conciseness": "Độ súc tích",
      "coherence": "Tính mạch lạc",
      "emphasis": "Cách nhấn mạnh (word order, intonation, stress)"
    },
    "variations": [
      {
        "style": "Kiểu viết lại (formal/informal/simplified)",
        "sentence": "Câu được viết lại theo kiểu này",
        "changes": "Các thay đổi đã thực hiện",
        "effect": "Hiệu quả của thay đổi"
      }
    ],
    "common_patterns": [
      {
        "pattern": "Mẫu cấu trúc ngữ pháp tương tự",
        "example": "Ví dụ của mẫu",
        "explanation": "Giải thích cách sử dụng mẫu"
      }
    ],
    "learning_tips": {
      "common_errors": ["Lỗi sai thường gặp khi sử dụng cấu trúc này"],
      "practice_suggestions": ["Gợi ý luyện tập"],
      "related_concepts": ["Khái niệm ngữ pháp liên quan"]
    }
  }
}`
}

function buildParagraphAnalysisPromptNew(paragraph: string, context?: string): string {
  return `Bạn là một chuyên gia ngôn ngữ học. Phân tích đoạn văn "${paragraph}" trong ngữ cảnh được cung cấp.

INPUT:
- Đoạn văn: "${paragraph}"
- Ngữ cảnh: "${context || ''}"

YÊU CẦU:
1. Trả về JSON hợp lệ, không markdown
2. Phân tích cấu trúc, nội dung và văn phong
3. Giải thích bằng Tiếng Việt
4. Cung cấp đầy đủ thông tin nghiên cứu: cấu trúc luận điểm, các kỹ thuật viết, phương pháp phát triển

JSON SCHEMA:
{
  "highlight_analysis": {
    "category": "paragraph",
    "confidence": 9,
    "paragraph": "${paragraph}",
    "meta": {
      "type": "Thể loại văn bản (narrative/descriptive/expository/argumentative/persuasive)",
      "tone": "Giọng điệu chủ đạo (formal/informal/academic/critical/ironic/etc)",
      "audience": "Đối tượng độc giả (general/academic/professional/children/etc)",
      "purpose": "Mục đích (to inform/to persuade/to entertain/to describe/etc)",
      "register": "Đăng ký (formal/informal/technical/literary)"
    },
    "content": {
      "main_topic": "Chủ đề chính hoặc luận điểm cốt lõi",
      "thesis_statement": "Câu luận điểm (nếu có)",
      "key_points": [
        {"point": "Điểm chính 1", "support": "Dữ liệu hỗ trợ", "importance": "Mức độ quan trọng"}
      ],
      "sentiment": {
        "label": "Nhãn cảm xúc (positive/negative/neutral/mixed)",
        "intensity": "Mức độ cảm xúc (1-10)",
        "justification": "Giải thích tại sao có cảm xúc này"
      },
      "keywords": ["Từ khóa quan trọng 1", "Từ khóa quan trọng 2"]
    },
    "structure": {
      "organization": [
        {
          "type": "Loại cấu trúc (chronological/comparison/cause-effect/problem-solution)",
          "description": "Mô tả cách tổ chức ý"
        }
      ],
      "sentences": [
        {
          "index": 1,
          "text": "3-5 từ đầu của câu",
          "role": "Vai trò (topic sentence/supporting detail/evidence/example/transition/conclusion)",
          "sentence_role": "Chức năng trong đoạn",
          "analysis": "Phân tích ngắn gọn về đóng góp của câu"
        }
      ],
      "transitions": [
        {"type": "Loại chuyển ý (addition/contrast/cause-effect/sequence)", "words": ["Từ nối được sử dụng"]}
      ]
    },
    "rhetorical_devices": [
      {
        "device": "Thủ pháp tu từ (metaphor/simile/personification/etc)",
        "example": "Ví dụ trong đoạn văn",
        "effect": "Tác dụng của thủ pháp"
      }
    ],
    "style_analysis": {
      "vocabulary": {
        "level": "Cấp độ từ vựng (basic/intermediate/advanced/technical)",
        "variety": "Độ đa dạng từ vựng",
        "jargon": "Thuật ngữ chuyên ngành (nếu có)"
      },
      "sentence_structure": {
        "variety": "Độ đa dạng cấu trúc câu",
        "complexity": "Độ phức tạp của câu",
        "average_length": "Độ dài trung bình của câu"
      },
      "cohesion": {
        "logic_score": "Điểm mạch lạc về ý (1-100)",
        "flow_score": "Điểm trôi chảy về từ ngữ (1-100)",
        "connectives": ["Từ nối đã sử dụng"]
      }
    },
    "evaluation": {
      "strengths": [
        {"aspect": "Khía cạnh mạnh (content/structure/style)", "description": "Mô tả chi tiết"}
      ],
      "weaknesses": [
        {"aspect": "Khía cạnh cần cải thiện", "description": "Mô tả chi tiết", "suggestion": "Gợi ý sửa"}
      ],
      "improvement_suggestions": [
        {"area": "Lĩnh vực cần cải thiện", "suggestion": "Gợi ý cụ thể", "priority": "Mức độ ưu tiên"}
      ]
    },
    "learning_tips": {
      "writing_techniques": ["Kỹ thuật viết có thể học hỏi"],
      "common_patterns": ["Mẫu cấu trúc phổ biến tương tự"],
      "related_concepts": ["Khái niệm viết liên quan"]
    }
  }
}`
}

function buildCollocationsAnalysisPrompt(text: string, context?: string, maxItems: number = 5): string {
  return `Bạn là một chuyên gia ngôn ngữ học. Phân tích các collocations trong "${text}".

INPUT:
- Text: "${text}"
- Ngữ cảnh: "${context || ''}"
- Số lượng tối đa: ${maxItems}

YÊU CẦU:
1. Trả về JSON hợp lệ, không markdown
2. Phân tích các collocations và cách sử dụng
3. Giải thích bằng Tiếng Việt
4. Cung cấp đầy đủ thông tin nghiên cứu: các loại collocation, quy tắc sử dụng, ví dụ thực tế

JSON SCHEMA:
{
  "highlight_analysis": {
    "category": "collocations",
    "confidence": 9,
    "text": "${text}",
    "meta": {
      "focus_words": ["Các từ khóa trọng tâm trong collocation"],
      "collocation_types": ["Các loại collocation được phát hiện (verb+noun, adjective+noun, etc.)"],
      "frequency_level": "Mức độ phổ biến (common/uncommon/rare)"
    },
    "collocations": [
      {
        "phrase": "Cụm collocation 1",
        "type": "Loại collocation (lexical/grammatical/structural)",
        "structure": "Cấu trúc (verb + noun, adjective + preposition, etc.)",
        "meaning": "Nghĩa của collocation",
        "usage": "Cách sử dụng và ngữ cảnh phù hợp",
        "frequency": "Mức độ sử dụng (very common/common/uncommon)",
        "register": "Đăng ký (formal/informal/academic/business)",
        "examples": [
          {"sentence": "Câu ví dụ 1", "translation": "Dịch câu", "context": "Ngữ cảnh sử dụng"},
          {"sentence": "Câu ví dụ 2", "translation": "Dịch câu", "context": "Ngữ cảnh sử dụng"}
        ],
        "variations": [
          {"phrase": "Biến thể của collocation", "meaning": "Nghĩa biến thể"}
        ]
      }
    ],
    "patterns": [
      {
        "pattern": "Mẫu cấu trúc collocation (verb + object, adjective + noun, etc.)",
        "explanation": "Giải thích quy tắc và cách sử dụng mẫu",
        "examples": [
          {"example": "Ví dụ cụ thể của mẫu", "translation": "Dịch ví dụ"}
        ]
      }
    ],
    "usage_guidelines": {
      "common_mistakes": [
        {"mistake": "Lỗi sai phổ biến", "correction": "Cách sửa", "explanation": "Giải thích tại sao sai và cách sửa"}}
      ],
      "learning_tips": [
        {"tip": "Mẹo ghi nhớ collocation", "technique": "Kỹ thuật cụ thể"}
      ],
      "practice_suggestions": [
        {"exercise": "Bài tập luyện tập", "instruction": "Hướng dẫn thực hiện"}
      ]
    },
    "related_concepts": [
      {"concept": "Khái niệm ngôn ngữ học liên quan", "description": "Mô tả ngắn gọn"}
    ]
  }
}`
}

function buildIdiomsAnalysisPrompt(text: string, context?: string, maxItems: number = 5): string {
  return `Bạn là một chuyên gia ngôn ngữ học. Phân tích thành ngữ trong "${text}".

INPUT:
- Text: "${text}"
- Ngữ cảnh: "${context || ''}"
- Số lượng tối đa: ${maxItems}

YÊU CẦU:
1. Trả về JSON hợp lệ, không markdown
2. Phân tích thành ngữ và ý nghĩa
3. Giải thích bằng Tiếng Việt
4. Cung cấp đầy đủ thông tin nghiên cứu: nguồn gốc thành ngữ, các biến thể, cách sử dụng phù hợp

JSON SCHEMA:
{
  "highlight_analysis": {
    "category": "idioms",
    "confidence": 9,
    "text": "${text}",
    "meta": {
      "idiom_types": ["Các loại thành ngữ được phát hiện (proverb/slang/metaphor/etc.)"],
      "cultural_context": "Bối cảnh văn hóa (British/American/global/etc.)",
      "historical_period": "Giai đoạn lịch sử (nếu có)"
    },
    "idioms": [
      {
        "idiom": "Thành ngữ đầy đủ",
        "literal_meaning": "Nghĩa đen từng thành phần",
        "figurative_meaning": "Nghĩa bóng/nghĩa ẩn thực tế",
        "origin": {
          "source": "Nguồn gốc (literature/history/occupation/etc.)",
          "historical_context": "Bối cảnh lịch sử hình thành",
          "etymology": "Từ nguyên học (nếu có)"
        },
        "usage": {
          "context": "Ngữ cảnh sử dụng phù hợp",
          "register": "Đăng ký (formal/informal/literary/business)",
          "frequency": "Mức độ phổ biến (very common/common/uncommon/archaic)"
        },
        "examples": [
          {
            "sentence": "Câu ví dụ 1",
            "translation": "Dịch câu",
            "context": "Giải thích ngữ cảnh sử dụng",
            "source": "Nguồn câu (literature/media/speech/etc.)"
          },
          {
            "sentence": "Câu ví dụ 2",
            "translation": "Dịch câu",
            "context": "Giải thích ngữ cảnh sử dụng",
            "source": "Nguồn câu (literature/media/speech/etc.)"
          }
        ],
        "variations": [
          {
            "form": "Biến thể của thành ngữ",
            "meaning": "Nghĩa của biến thể",
            "usage": "Cách sử dụng biến thể"
          }
        ],
        "related_expressions": [
          {"expression": "Cụm từ/cách diễn đạt liên quan", "meaning": "Nghĩa", "relationship": "Mối quan hệ với thành ngữ"}
        ]
      }
    ],
    "cultural_analysis": {
      "metaphor_basis": {
        "concept": "Khái niệm cơ sở của ẩn dụ",
        "explanation": "Giải thích tại sao khái niệm này được dùng làm ẩn dụ"
      },
      "regional_variations": [
        {"region": "Khu vực (British/Australian/etc.)", "variation": "Biến thể khu vực", "meaning": "Nghĩa khác biệt"}
      ]
    },
    "learning_tips": {
      "memory_techniques": [
        {"technique": "Kỹ thuật ghi nhớ 1", "explanation": "Giải thích cách áp dụng"}
      ],
      "common_mistakes": [
        {"mistake": "Lỗi sai phổ biến", "correction": "Cách sửa", "explanation": "Giải thích tại sao sai và cách sửa"}
      ],
      "practice_suggestions": [
        {"exercise": "Bài tập luyện tập", "instruction": "Hướng dẫn thực hiện"}
      ]
    },
    "related_concepts": [
      {"concept": "Khái niệm liên quan", "description": "Mô tả ngắn gọn"}
    ]
  }
}`
}

function buildGrammarAnalysisPrompt(text: string, context?: string): string {
  return `Bạn là một chuyên gia ngôn ngữ học. Phân tích cấu trúc ngữ pháp trong "${text}".

INPUT:
- Text: "${text}"
- Ngữ cảnh: "${context || ''}"

YÊU CẦU:
1. Trả về JSON hợp lệ, không markdown
2. Phân tích cấu trúc ngữ pháp
3. Giải thích bằng Tiếng Việt
4. Cung cấp đầy đủ thông tin nghiên cứu: quy tắc ngữ pháp, các trường hợp đặc biệt, ví dụ minh họa

JSON SCHEMA:
{
  "highlight_analysis": {
    "category": "grammar",
    "confidence": 9,
    "text": "${text}",
    "meta": {
      "grammar_focus": ["Trọng tâm phân tích (tense/voice/mood/etc.)"],
      "complexity_level": "Độ phức tạp (basic/intermediate/advanced)"
    },
    "structures": [
      {
        "type": "Loại cấu trúc ngữ pháp (tense/voice/mood/conditionals/etc.)",
        "pattern": "Mẫu cấu trúc chi tiết",
        "explanation": "Giải thích quy tắc và cách sử dụng",
        "examples": [
          {
            "sentence": "Câu ví dụ 1",
            "translation": "Dịch câu",
            "analysis": "Phân tích cấu trúc trong câu ví dụ"
          },
          {
            "sentence": "Câu ví dụ 2",
            "translation": "Dịch câu",
            "analysis": "Phân tích cấu trúc trong câu ví dụ"
          }
        ],
        "common_errors": [
          {"error": "Lỗi sai phổ biến", "correction": "Cách sửa", "explanation": "Giải thích tại sao lỗi xảy ra"}
        ],
        "variations": [
          {"variation": "Biến thể của cấu trúc", "usage": "Cách sử dụng biến thể"}
        ]
      }
    ],
    "analysis": {
      "complexity": {
        "level": "Độ phức tạp tổng thể",
        "factors": ["Các yếu tố làm tăng độ phức tạp"],
        "explanation": "Giải thích tại sao cấu trúc này phức tạp"
      },
      "usage_patterns": {
        "formal_contexts": ["Ngữ cảnh trang trọng sử dụng cấu trúc này"],
        "informal_contexts": ["Ngữ cảnh thân mật sử dụng cấu trúc này"],
        "frequency": "Mức độ phổ biến trong giao tiếp hàng ngày"
      },
      "common_errors": [
        {"error": "Lỗi sai phổ biến 1", "correction": "Cách sửa", "explanation": "Giải thích nguyên nhân và cách khắc phục"}
      ],
      "tips": [
        {"tip": "Mẹo sử dụng 1", "application": "Cách áp dụng thực tế"}
      ]
    },
    "learning_resources": {
      "grammar_rules": [
        {"rule": "Quy tắc ngữ pháp liên quan", "explanation": "Giải thích chi tiết quy tắc"}
      ],
      "practice_exercises": [
        {"exercise": "Bài tập luyện tập", "instruction": "Hướng dẫn thực hiện"}
      ],
      "reference_materials": [
        {"material": "Tài liệu tham khảo", "type": "Loại tài liệu (grammar book/website/course)"}
      ]
    },
    "related_concepts": [
      {"concept": "Khái niệm ngữ pháp liên quan", "description": "Mô tả ngắn gọn"}
    ]
  }
}`
}

export function buildUniversalAutoDetectionPrompt(text: string, context?: string, maxItems: number = 5): string {
  return `Bạn là một chuyên gia ngôn ngữ học. Phân tích "${text}" trong ngữ cảnh được cung cấp.

INPUT:
- Text: "${text}"
- Ngữ cảnh: "${context || ''}"
- Số lượng tối đa: ${maxItems}

YÊU CẦU:
1. Trả về JSON hợp lệ, không markdown
2. TỰ ĐỘNG XÁC ĐỊNH LOẠI PHÂN TÍCH PHÙ HỢP (word/phrase/sentence/paragraph/collocations/idioms/grammar)
3. Dựa trên loại đã xác định, trả về ĐẦY ĐỦ thông tin nghiên cứu theo schema tương ứng
4. Giải thích bằng Tiếng Việt

QUY TẮC XÁC ĐỊNH LOẠI:
- word: text có 1 từ duy nhất
- phrase: text có 2-5 từ, không phải câu hoàn chỉnh
- sentence: text có cấu trúc câu hoàn chỉnh (dấu .!? hoặc có chủ ngữ-vị ngữ)
- paragraph: text dài > 20 từ hoặc có nhiều câu
- collocations: text chứa các cụm từ thường đi cùng nhau (make a decision, heavy rain, etc.)
- idioms: text chứa thành ngữ (spill the beans, break the ice, etc.)
- grammar: text chứa cấu trúc ngữ pháp đặc biệt (conditional, passive voice, etc.)

JSON SCHEMA TƯƠNG ỨNG VỚI TỪNG LOẠI:

WORD:
{
  "highlight_analysis": {
    "category": "word",
    "confidence": 9,
    "word": "${text}",
    "meta": {
      "ipa": "Phiên âm IPA",
      "pos": "Từ loại (noun, verb, adjective, etc.)",
      "cefr": "Trình độ CEFR (A1-C2)",
      "frequency": "Mức độ phổ biến (common/uncommon/rare)",
      "etymology": "Nguồn gốc từ (nếu có)",
      "register": "Đăng ký (formal/informal/academic)"
    },
    "definitions": {
      "root_meaning": "Nghĩa gốc trong từ điển",
      "context_meaning": "Nghĩa trong ngữ cảnh cụ thể",
      "vietnamese_translation": "Dịch sang tiếng Việt",
      "nuances": "Các sắc thái nghĩa khác nhau"
    },
    "relations": {
      "synonyms": [
        {"word": "từ đồng nghĩa 1", "meaning": "định nghĩa ngắn", "usage": "cách dùng khác biệt"}
      ],
      "antonyms": [
        {"word": "từ trái nghĩa 1", "meaning": "định nghĩa ngắn", "usage": "cách dùng khác biệt"}
      ]
    },
    "usage": {
      "collocations": [
        {"phrase": "cụm từ collocation 1", "meaning": "nghĩa cụm từ", "frequency": "mức độ sử dụng"}
      ],
      "examples": [
        {"sentence": "câu ví dụ 1", "translation": "dịch câu", "context": "ngữ cảnh sử dụng"},
        {"sentence": "câu ví dụ 2", "translation": "dịch câu", "context": "ngữ cảnh sử dụng"}
      ],
      "common_mistakes": [
        {"mistake": "lỗi sai phổ biến", "correction": "cách sửa", "explanation": "giải thích"}
      ]
    },
    "learning_tips": {
      "memory_techniques": ["kỹ thuật ghi nhớ 1", "kỹ thuật ghi nhớ 2"],
      "practice_exercises": ["bài tập luyện tập 1", "bài tập luyện tập 2"],
      "related_concepts": ["khái niệm liên quan 1", "khái niệm liên quan 2"]
    }
  }
}

PHRASE:
{
  "highlight_analysis": {
    "category": "phrase",
    "confidence": 9,
    "phrase": "${text}",
    "meta": {
      "type": "Loại cụm từ (phrasal verb, idiom, collocation, compound noun)",
      "structure": "Cấu trúc ngữ pháp (verb + preposition, adjective + noun, etc.)",
      "register": "Đăng ký (formal/informal/academic/business)",
      "cefr": "Trình độ CEFR (A1-C2)",
      "frequency": "Mức độ phổ biến (common/uncommon/rare)"
    },
    "definitions": {
      "literal_meaning": "Nghĩa đen (nếu có)",
      "figurative_meaning": "Nghĩa bóng/nghĩa ẩn",
      "vietnamese_translation": "Dịch sang tiếng Việt",
      "usage_notes": "Lưu ý quan trọng về cách sử dụng",
      "cultural_context": "Bối cảnh văn hóa (nếu có)"
    },
    "components": [
      {
        "word": "từ thành phần 1",
        "role": "vai trò trong cụm (main verb, preposition, etc.)",
        "meaning": "nghĩa khi đứng riêng",
        "ipa": "phiên âm IPA"
      }
    ],
    "variations": [
      {
        "phrase": "biến thể 1",
        "meaning": "nghĩa của biến thể",
        "usage": "cách sử dụng biến thể",
        "example": "câu ví dụ"
      }
    ],
    "usage": {
      "examples": [
        {"sentence": "câu ví dụ 1", "translation": "dịch câu", "context": "ngữ cảnh sử dụng"},
        {"sentence": "câu ví dụ 2", "translation": "dịch câu", "context": "ngữ cảnh sử dụng"}
      ],
      "collocations": [
        {"phrase": "collocation liên quan", "meaning": "nghĩa", "frequency": "mức độ sử dụng"}
      ],
      "common_mistakes": [
        {"mistake": "lỗi sai phổ biến", "correction": "cách sửa", "explanation": "giải thích"}
      ]
    },
    "learning_tips": {
      "memory_techniques": ["kỹ thuật ghi nhớ 1", "kỹ thuật ghi nhớ 2"],
      "practice_exercises": ["bài tập luyện tập 1", "bài tập luyện tập 2"],
      "related_concepts": ["khái niệm liên quan 1", "khái niệm liên quan 2"]
    }
  }
}

SENTENCE:
{
  "highlight_analysis": {
    "category": "sentence",
    "confidence": 9,
    "sentence": "${text}",
    "meta": {
      "type": "Loại câu (simple, compound, complex, compound-complex)",
      "complexity": "Độ phức tạp (basic/intermediate/advanced)",
      "tone": "Giọng điệu (formal/informal/neutral/ironic/etc)",
      "register": "Đăng ký (academic/business/casual/literary)",
      "purpose": "Mục đích (inform/persuade/describe/question/etc)"
    },
    "structure": {
      "subject": "Chủ ngữ và các thành phần",
      "predicate": "Vị ngữ (động từ chính + tân ngữ/bổ ngữ)",
      "clauses": [
        {
          "type": "Loại mệnh đề (independent/dependent/relative)",
          "content": "Nội dung mệnh đề",
          "role": "Chức năng trong câu"
        }
      ],
      "modifiers": [
        {"type": "loại bổ nghĩa (adjective/adverb/prepositional phrase)", "content": "Nội dung bổ nghĩa", "target": "Vị trí được bổ nghĩa"}
      ],
      "connectors": ["Từ nối và quan hệ từ được sử dụng"]
    },
    "meaning": {
      "main_idea": "Ý chính của câu",
      "supporting_ideas": ["Các ý phụ hỗ trợ ý chính"],
      "sentiment": "Cảm xúc (positive/negative/neutral/mixed)",
      "implications": "Hàm ý hoặc ý ẩn (nếu có)",
      "presuppositions": ["Các giả định ngầm hiểu"]
    },
    "style_analysis": {
      "clarity": "Độ rõ ràng của câu",
      "conciseness": "Độ súc tích",
      "coherence": "Tính mạch lạc",
      "emphasis": "Cách nhấn mạnh (word order, intonation, stress)"
    },
    "variations": [
      {
        "style": "Kiểu viết lại (formal/informal/simplified)",
        "sentence": "Câu được viết lại theo kiểu này",
        "changes": "Các thay đổi đã thực hiện",
        "effect": "Hiệu quả của thay đổi"
      }
    ],
    "common_patterns": [
      {
        "pattern": "Mẫu cấu trúc ngữ pháp tương tự",
        "example": "Ví dụ của mẫu",
        "explanation": "Giải thích cách sử dụng mẫu"
      }
    ],
    "learning_tips": {
      "common_errors": ["Lỗi sai thường gặp khi sử dụng cấu trúc này"],
      "practice_suggestions": ["Gợi ý luyện tập"],
      "related_concepts": ["Khái niệm ngữ pháp liên quan"]
    }
  }
}

PARAGRAPH:
{
  "highlight_analysis": {
    "category": "paragraph",
    "confidence": 9,
    "paragraph": "${text}",
    "meta": {
      "type": "Thể loại văn bản (narrative/descriptive/expository/argumentative/persuasive)",
      "tone": "Giọng điệu chủ đạo (formal/informal/academic/critical/ironic/etc)",
      "audience": "Đối tượng độc giả (general/academic/professional/children/etc)",
      "purpose": "Mục đích (to inform/to persuade/to entertain/to describe/etc)",
      "register": "Đăng ký (formal/informal/technical/literary)"
    },
    "content": {
      "main_topic": "Chủ đề chính hoặc luận điểm cốt lõi",
      "thesis_statement": "Câu luận điểm (nếu có)",
      "key_points": [
        {"point": "Điểm chính 1", "support": "Dữ liệu hỗ trợ", "importance": "Mức độ quan trọng"}
      ],
      "sentiment": {
        "label": "Nhãn cảm xúc (positive/negative/neutral/mixed)",
        "intensity": "Mức độ cảm xúc (1-10)",
        "justification": "Giải thích tại sao có cảm xúc này"
      },
      "keywords": ["Từ khóa quan trọng 1", "Từ khóa quan trọng 2"]
    },
    "structure": {
      "organization": [
        {
          "type": "Loại cấu trúc (chronological/comparison/cause-effect/problem-solution)",
          "description": "Mô tả cách tổ chức ý"
        }
      ],
      "sentences": [
        {
          "index": 1,
          "text": "3-5 từ đầu của câu",
          "role": "Vai trò (topic sentence/supporting detail/evidence/example/transition/conclusion)",
          "sentence_role": "Chức năng trong đoạn",
          "analysis": "Phân tích ngắn gọn về đóng góp của câu"
        }
      ],
      "transitions": [
        {"type": "Loại chuyển ý (addition/contrast/cause-effect/sequence)", "words": ["Từ nối được sử dụng"]}
      ]
    },
    "rhetorical_devices": [
      {
        "device": "Thủ pháp tu từ (metaphor/simile/personification/etc)",
        "example": "Ví dụ trong đoạn văn",
        "effect": "Tác dụng của thủ pháp"
      }
    ],
    "style_analysis": {
      "vocabulary": {
        "level": "Cấp độ từ vựng (basic/intermediate/advanced/technical)",
        "variety": "Độ đa dạng từ vựng",
        "jargon": "Thuật ngữ chuyên ngành (nếu có)"
      },
      "sentence_structure": {
        "variety": "Độ đa dạng cấu trúc câu",
        "complexity": "Độ phức tạp của câu",
        "average_length": "Độ dài trung bình của câu"
      },
      "cohesion": {
        "logic_score": "Điểm mạch lạc về ý (1-100)",
        "flow_score": "Điểm trôi chảy về từ ngữ (1-100)",
        "connectives": ["Từ nối đã sử dụng"]
      }
    },
    "evaluation": {
      "strengths": [
        {"aspect": "Khía cạnh mạnh (content/structure/style)", "description": "Mô tả chi tiết"}
      ],
      "weaknesses": [
        {"aspect": "Khía cạnh cần cải thiện", "description": "Mô tả chi tiết", "suggestion": "Gợi ý sửa"}
      ],
      "improvement_suggestions": [
        {"area": "Lĩnh vực cần cải thiện", "suggestion": "Gợi ý cụ thể", "priority": "Mức độ ưu tiên"}
      ]
    },
    "learning_tips": {
      "writing_techniques": ["Kỹ thuật viết có thể học hỏi"],
      "common_patterns": ["Mẫu cấu trúc phổ biến tương tự"],
      "related_concepts": ["Khái niệm viết liên quan"]
    }
  }
}

COLLOCATIONS:
{
  "highlight_analysis": {
    "category": "collocations",
    "confidence": 9,
    "text": "${text}",
    "meta": {
      "focus_words": ["Các từ khóa trọng tâm trong collocation"],
      "collocation_types": ["Các loại collocation được phát hiện (verb+noun, adjective+noun, etc.)"],
      "frequency_level": "Mức độ phổ biến (common/uncommon/rare)"
    },
    "collocations": [
      {
        "phrase": "Cụm collocation 1",
        "type": "Loại collocation (lexical/grammatical/structural)",
        "structure": "Cấu trúc (verb + noun, adjective + preposition, etc.)",
        "meaning": "Nghĩa của collocation",
        "usage": "Cách sử dụng và ngữ cảnh phù hợp",
        "frequency": "Mức độ sử dụng (very common/common/uncommon)",
        "register": "Đăng ký (formal/informal/academic/business)",
        "examples": [
          {"sentence": "Câu ví dụ 1", "translation": "Dịch câu", "context": "Ngữ cảnh sử dụng"},
          {"sentence": "Câu ví dụ 2", "translation": "Dịch câu", "context": "Ngữ cảnh sử dụng"}
        ],
        "variations": [
          {"phrase": "Biến thể của collocation", "meaning": "Nghĩa biến thể"}
        ]
      }
    ],
    "patterns": [
      {
        "pattern": "Mẫu cấu trúc collocation (verb + object, adjective + noun, etc.)",
        "explanation": "Giải thích quy tắc và cách sử dụng mẫu",
        "examples": [
          {"example": "Ví dụ cụ thể của mẫu", "translation": "Dịch ví dụ"}
        ]
      }
    ],
    "usage_guidelines": {
      "common_mistakes": [
        {"mistake": "Lỗi sai phổ biến", "correction": "Cách sửa", "explanation": "Giải thích tại sao sai và cách sửa"}
      ],
      "learning_tips": [
        {"tip": "Mẹo ghi nhớ collocation", "technique": "Kỹ thuật cụ thể"}
      ],
      "practice_suggestions": [
        {"exercise": "Bài tập luyện tập", "instruction": "Hướng dẫn thực hiện"}
      ]
    },
    "related_concepts": [
      {"concept": "Khái niệm ngôn ngữ học liên quan", "description": "Mô tả ngắn gọn"}
    ]
  }
}

IDIOMS:
{
  "highlight_analysis": {
    "category": "idioms",
    "confidence": 9,
    "text": "${text}",
    "meta": {
      "idiom_types": ["Các loại thành ngữ được phát hiện (proverb/slang/metaphor/etc.)"],
      "cultural_context": "Bối cảnh văn hóa (British/American/global/etc.)",
      "historical_period": "Giai đoạn lịch sử (nếu có)"
    },
    "idioms": [
      {
        "idiom": "Thành ngữ đầy đủ",
        "literal_meaning": "Nghĩa đen từng thành phần",
        "figurative_meaning": "Nghĩa bóng/nghĩa ẩn thực tế",
        "origin": {
          "source": "Nguồn gốc (literature/history/occupation/etc.)",
          "historical_context": "Bối cảnh lịch sử hình thành",
          "etymology": "Từ nguyên học (nếu có)"
        },
        "usage": {
          "context": "Ngữ cảnh sử dụng phù hợp",
          "register": "Đăng ký (formal/informal/literary/business)",
          "frequency": "Mức độ phổ biến (very common/common/uncommon/archaic)"
        },
        "examples": [
          {
            "sentence": "Câu ví dụ 1",
            "translation": "Dịch câu",
            "context": "Giải thích ngữ cảnh sử dụng",
            "source": "Nguồn câu (literature/media/speech/etc.)"
          },
          {
            "sentence": "Câu ví dụ 2",
            "translation": "Dịch câu",
            "context": "Giải thích ngữ cảnh sử dụng",
            "source": "Nguồn câu (literature/media/speech/etc.)"
          }
        ],
        "variations": [
          {
            "form": "Biến thể của thành ngữ",
            "meaning": "Nghĩa của biến thể",
            "usage": "Cách sử dụng biến thể"
          }
        ],
        "related_expressions": [
          {"expression": "Cụm từ/cách diễn đạt liên quan", "meaning": "Nghĩa", "relationship": "Mối quan hệ với thành ngữ"}
        ]
      }
    ],
    "cultural_analysis": {
      "metaphor_basis": {
        "concept": "Khái niệm cơ sở của ẩn dụ",
        "explanation": "Giải thích tại sao khái niệm này được dùng làm ẩn dụ"
      },
      "regional_variations": [
        {"region": "Khu vực (British/Australian/etc.)", "variation": "Biến thể khu vực", "meaning": "Nghĩa khác biệt"}
      ]
    },
    "learning_tips": {
      "memory_techniques": [
        {"technique": "Kỹ thuật ghi nhớ 1", "explanation": "Giải thích cách áp dụng"}
      ],
      "common_mistakes": [
        {"mistake": "Lỗi sai phổ biến", "correction": "Cách sửa", "explanation": "Giải thích tại sao sai và cách sửa"}
      ],
      "practice_suggestions": [
        {"exercise": "Bài tập luyện tập", "instruction": "Hướng dẫn thực hiện"}
      ]
    },
    "related_concepts": [
      {"concept": "Khái niệm liên quan", "description": "Mô tả ngắn gọn"}
    ]
  }
}

GRAMMAR:
{
  "highlight_analysis": {
    "category": "grammar",
    "confidence": 9,
    "text": "${text}",
    "meta": {
      "grammar_focus": ["Trọng tâm phân tích (tense/voice/mood/etc.)"],
      "complexity_level": "Độ phức tạp (basic/intermediate/advanced)"
    },
    "structures": [
      {
        "type": "Loại cấu trúc ngữ pháp (tense/voice/mood/conditionals/etc.)",
        "pattern": "Mẫu cấu trúc chi tiết",
        "explanation": "Giải thích quy tắc và cách sử dụng",
        "examples": [
          {
            "sentence": "Câu ví dụ 1",
            "translation": "Dịch câu",
            "analysis": "Phân tích cấu trúc trong câu ví dụ"
          },
          {
            "sentence": "Câu ví dụ 2",
            "translation": "Dịch câu",
            "analysis": "Phân tích cấu trúc trong câu ví dụ"
          }
        ],
        "common_errors": [
          {"error": "Lỗi sai phổ biến", "correction": "Cách sửa", "explanation": "Giải thích tại sao lỗi xảy ra"}
        ],
        "variations": [
          {"variation": "Biến thể của cấu trúc", "usage": "Cách sử dụng biến thể"}
        ]
      }
    ],
    "analysis": {
      "complexity": {
        "level": "Độ phức tạp tổng thể",
        "factors": ["Các yếu tố làm tăng độ phức tạp"],
        "explanation": "Giải thích tại sao cấu trúc này phức tạp"
      },
      "usage_patterns": {
        "formal_contexts": ["Ngữ cảnh trang trọng sử dụng cấu trúc này"],
        "informal_contexts": ["Ngữ cảnh thân mật sử dụng cấu trúc này"],
        "frequency": "Mức độ phổ biến trong giao tiếp hàng ngày"
      },
      "common_errors": [
        {"error": "Lỗi sai phổ biến 1", "correction": "Cách sửa", "explanation": "Giải thích nguyên nhân và cách khắc phục"}
      ],
      "tips": [
        {"tip": "Mẹo sử dụng 1", "application": "Cách áp dụng thực tế"}
      ]
    },
    "learning_resources": {
      "grammar_rules": [
        {"rule": "Quy tắc ngữ pháp liên quan", "explanation": "Giải thích chi tiết quy tắc"}
      ],
      "practice_exercises": [
        {"exercise": "Bài tập luyện tập", "instruction": "Hướng dẫn thực hiện"}
      ],
      "reference_materials": [
        {"material": "Tài liệu tham khảo", "type": "Loại tài liệu (grammar book/website/course)"}
      ]
    },
    "related_concepts": [
      {"concept": "Khái niệm ngữ pháp liên quan", "description": "Mô tả ngắn gọn"}
    ]
  }
}`
}

// Validation function for new highlight analysis
export function validateHighlightAnalysisNew(data: any): any {
  try {
    analysisLogger.debug('Validating highlight analysis', { data })
    
    // Basic structure validation
    if (!data.highlight_analysis) {
      throw new Error('Invalid structure - missing highlight_analysis')
    }
    
    const analysis = data.highlight_analysis
    
    // Required fields validation
    const requiredFields = [
      'category',
      'confidence'
    ]
    
    for (const field of requiredFields) {
      if (!analysis[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    // Validate category
    const validCategories = ['word', 'phrase', 'sentence', 'paragraph', 'collocations', 'idioms', 'grammar']
    if (!validCategories.includes(analysis.category)) {
      throw new Error(`Invalid category: ${analysis.category}`)
    }
    
    // Validate confidence range
    if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 10) {
      throw new Error('Confidence must be a number between 0 and 10')
    }
    
    // Category-specific validation
    switch (analysis.category) {
      case 'word':
        if (!analysis.word || !analysis.meta || !analysis.definitions || !analysis.relations || !analysis.usage) {
          throw new Error('Word analysis missing required sections')
        }
        break
      case 'phrase':
        if (!analysis.phrase || !analysis.meta || !analysis.definitions || !analysis.components || !analysis.usage) {
          throw new Error('Phrase analysis missing required sections')
        }
        break
      case 'sentence':
        if (!analysis.sentence || !analysis.meta || !analysis.structure || !analysis.meaning || !analysis.style_analysis) {
          throw new Error('Sentence analysis missing required sections')
        }
        break
      case 'paragraph':
        if (!analysis.paragraph || !analysis.meta || !analysis.content || !analysis.structure || !analysis.style_analysis) {
          throw new Error('Paragraph analysis missing required sections')
        }
        break
      case 'collocations':
        if (!analysis.text || !analysis.meta || !analysis.collocations || !analysis.patterns) {
          throw new Error('Collocations analysis missing required sections')
        }
        break
      case 'idioms':
        if (!analysis.text || !analysis.meta || !analysis.idioms || !analysis.cultural_analysis) {
          throw new Error('Idioms analysis missing required sections')
        }
        break
      case 'grammar':
        if (!analysis.text || !analysis.meta || !analysis.structures || !analysis.analysis) {
          throw new Error('Grammar analysis missing required sections')
        }
        break
    }
    
    analysisLogger.debug('Highlight analysis validation successful', { category: analysis.category })
    return data
  } catch (error) {
    analysisLogger.error('Highlight analysis validation failed', error)
    throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Fallback function for new highlight analysis
export function createFallbackHighlightAnalysisNew(request: HighlightAnalysisRequest): any {
  const { text, context } = request
  
  analysisLogger.warn('Creating fallback highlight analysis', { text, context })
  
  // Simple category detection based on text characteristics
  const trimmedText = text.trim()
  const wordCount = trimmedText.split(/\s+/).length
  let category: HighlightCategory = 'word'
  
  if (wordCount > 20 || /\n/.test(trimmedText)) {
    category = 'paragraph'
  } else if (/[.!?]$/.test(trimmedText) || wordCount > 5) {
    category = 'sentence'
  } else if (wordCount > 1) {
    category = 'phrase'
  }
  
  // Create minimal fallback structure based on category
  const fallbackStructure: any = {
    highlight_analysis: {
      category,
      confidence: 1,
      meta: {
        error: "Analysis failed - using fallback",
        timestamp: new Date().toISOString()
      }
    }
  }
  
  // Add category-specific minimal structure
  switch (category) {
    case 'word':
      fallbackStructure.highlight_analysis = {
        ...fallbackStructure.highlight_analysis,
        word: text,
        meta: {
          ...fallbackStructure.highlight_analysis.meta,
          ipa: "",
          pos: "unknown",
          cefr: "unknown",
          frequency: "unknown",
          register: "neutral"
        },
        definitions: {
          root_meaning: "Không thể xác định",
          context_meaning: "Không thể xác định",
          vietnamese_translation: "Không thể xác định"
        },
        relations: {
          synonyms: [],
          antonyms: []
        },
        usage: {
          collocations: [],
          examples: [],
          common_mistakes: []
        }
      }
      break
    case 'phrase':
      fallbackStructure.highlight_analysis = {
        ...fallbackStructure.highlight_analysis,
        phrase: text,
        meta: {
          ...fallbackStructure.highlight_analysis.meta,
          type: "unknown",
          structure: "unknown",
          register: "neutral",
          cefr: "unknown",
          frequency: "unknown"
        },
        definitions: {
          literal_meaning: "Không thể xác định",
          figurative_meaning: "Không thể xác định",
          vietnamese_translation: "Không thể xác định"
        },
        components: [],
        variations: [],
        usage: {
          examples: [],
          collocations: [],
          common_mistakes: []
        }
      }
      break
    case 'sentence':
      fallbackStructure.highlight_analysis = {
        ...fallbackStructure.highlight_analysis,
        sentence: text,
        meta: {
          ...fallbackStructure.highlight_analysis.meta,
          type: "unknown",
          complexity: "basic",
          tone: "neutral",
          register: "neutral",
          purpose: "unknown"
        },
        structure: {
          subject: "Không thể xác định",
          predicate: "Không thể xác định",
          clauses: [],
          modifiers: [],
          connectors: []
        },
        meaning: {
          main_idea: "Không thể xác định",
          supporting_ideas: [],
          sentiment: "neutral",
          implications: [],
          presuppositions: []
        },
        style_analysis: {
          clarity: "Không thể xác định",
          conciseness: "Không thể xác định",
          coherence: "Không thể xác định",
          emphasis: "Không thể xác định"
        }
      }
      break
    case 'paragraph':
      fallbackStructure.highlight_analysis = {
        ...fallbackStructure.highlight_analysis,
        paragraph: text,
        meta: {
          ...fallbackStructure.highlight_analysis.meta,
          type: "unknown",
          tone: "neutral",
          audience: "general",
          purpose: "unknown",
          register: "neutral"
        },
        content: {
          main_topic: "Không thể xác định",
          thesis_statement: "",
          key_points: [],
          sentiment: {
            label: "neutral",
            intensity: 5,
            justification: "Không thể xác định"
          },
          keywords: []
        },
        structure: {
          organization: [],
          sentences: [],
          transitions: []
        },
        style_analysis: {
          vocabulary: {
            level: "Không thể xác định",
            variety: "Không thể xác định",
            jargon: ""
          },
          sentence_structure: {
            variety: "Không thể xác định",
            complexity: "Không thể xác định",
            average_length: "Không thể xác định"
          },
          cohesion: {
            logic_score: 50,
            flow_score: 50,
            connectives: []
          }
        }
      }
      break
  }
  
  return fallbackStructure
}

// Legacy Highlight Analysis Prompt Builder (Commented for reference)
/*
export function buildHighlightAnalysisPrompt(request: AnalyzeHighlightRequest): string {
  const { highlight, maxItems = 5 } = request
  const { highlight_type, selected_text, content, document_context, paragraph_index, sentence_index } = highlight
  
  // Determine appropriate prompt based on highlight type
  switch (highlight_type) {
    case 'word':
      return buildWordHighlightPrompt(selected_text, content, document_context, maxItems)
    case 'phrase':
      return buildPhraseHighlightPrompt(selected_text, content, document_context, maxItems)
    case 'sentence':
      return buildSentenceHighlightPrompt(selected_text, content, document_context)
    case 'paragraph':
      return buildParagraphHighlightPrompt(selected_text, content)
    default:
      return buildUniversalHighlightPrompt(highlight, maxItems)
  }
}
*/

// Word-specific highlight prompt
function buildWordHighlightPrompt(word: string, content: string, documentContext?: string, maxItems: number = 5): string {
  return `Bạn là một chuyên gia ngôn ngữ học và giáo dục. Nhiệm vụ của bạn là phân tích từ được highlight "${word}" trong ngữ cảnh được cung cấp.

INPUT DATA:
- Target Word: "${word}"
- Content: "${content}"
- Document Context: "${documentContext || ''}"
- Max Items per list: ${maxItems}

YÊU CẦU OUTPUT:
1. Trả về duy nhất một chuỗi JSON hợp lệ (RFC 8259).
2. Tuyệt đối KHÔNG kèm markdown (\`\`\`), không lời dẫn.
3. Các trường giải thích chính dùng Tiếng Việt.
4. Phần Synonyms/Antonyms: Giới hạn tối đa ${maxItems} từ mỗi loại, sắp xếp theo độ phổ biến/độ sát nghĩa giảm dần.

JSON SCHEMA:
{
  "highlight_analysis": {
    "type": "word",
    "word": "${word}",
    "meta": {
      "ipa": "Phiên âm IPA",
      "pos": "Từ loại (Noun/Verb...)",
      "cefr": "Trình độ (A1-C2)",
      "tone": "Sắc thái (Formal/Neutral/Irony...)"
    },
    "definitions": {
      "root_meaning": "Nghĩa gốc trong từ điển",
      "context_meaning": "Nghĩa trong ngữ cảnh này",
      "vietnamese_translation": "Từ/Cụm từ tiếng Việt tương đương nhất"
    },
    "inference_strategy": {
      "clues": "Dấu hiệu nào trong ngữ cảnh giúp đoán nghĩa?",
      "reasoning": "Giải thích ngắn gọn quy trình suy luận"
    },
    "relations": {
      "synonyms": [
        {
          "word": "Từ đồng nghĩa",
          "ipa": "/ipa/",
          "meaning_en": "Định nghĩa ngắn bằng tiếng Anh",
          "meaning_vi": "Định nghĩa ngắn bằng tiếng Việt"
        }
      ],
      "antonyms": [
        {
          "word": "Từ trái nghĩa",
          "ipa": "/ipa/",
          "meaning_en": "Định nghĩa ngắn bằng tiếng Anh",
          "meaning_vi": "Định nghĩa ngắn bằng tiếng Việt"
        }
      ]
    },
    "usage": {
      "collocations": [
        {
          "phrase": "Cụm từ collocation",
          "meaning": "Nghĩa của cụm từ",
          "usage_example": "Ví dụ sử dụng",
          "frequency_level": "common"
        }
      ],
      "example_sentence": "Một câu ví dụ khác",
      "example_translation": "Dịch câu ví dụ"
    }
  }
}`
}

// Phrase-specific highlight prompt
function buildPhraseHighlightPrompt(phrase: string, content: string, documentContext?: string, maxItems: number = 5): string {
  return `Bạn là một chuyên gia ngôn ngữ học và giáo dục. Nhiệm vụ của bạn là phân tích cụm từ được highlight "${phrase}" trong ngữ cảnh được cung cấp.

INPUT DATA:
- Target Phrase: "${phrase}"
- Content: "${content}"
- Document Context: "${documentContext || ''}"
- Max Items per list: ${maxItems}

YÊU CẦU OUTPUT:
1. Trả về duy nhất một chuỗi JSON hợp lệ (RFC 8259).
2. Tuyệt đối KHÔNG kèm markdown (\`\`\`), không lời dẫn.
3. Các trường giải thích chính dùng Tiếng Việt.
4. Phần collocations và variations: Giới hạn tối đa ${maxItems} mục mỗi loại.

JSON SCHEMA:
{
  "highlight_analysis": {
    "type": "phrase",
    "phrase": "${phrase}",
    "meta": {
      "ipa": "Phiên âm IPA của cả cụm từ",
      "pos": "Từ loại của cụm từ",
      "type": "Loại cụm từ (Idiom/Collocation/Phrasal Verb...)",
      "cefr": "Trình độ (A1-C2)",
      "tone": "Sắc thái (Formal/Neutral/Irony...)",
      "register": "Đăng ký (Formal/Informal/Academic...)"
    },
    "definitions": {
      "literal_meaning": "Nghĩa đen (nếu có)",
      "figurative_meaning": "Nghĩa bóng/nghĩa thực tế trong văn cảnh",
      "vietnamese_translation": "Dịch sang tiếng Việt",
      "usage_notes": "Lưu ý quan trọng về cách sử dụng"
    },
    "components": [
      {
        "word": "Từ riêng lẻ trong cụm",
        "ipa": "Phiên âm của từ này",
        "meaning": "Nghĩa của từ này khi đứng riêng",
        "role": "Vai trò trong cụm từ (động từ chính, giới từ, bổ nghĩa...)"
      }
    ],
    "grammar_and_structure": {
      "pattern": "Mẫu ngữ pháp (VD: verb + preposition, adjective + noun)",
      "variations": [
        {
          "phrase": "Biến thể của cụm từ",
          "meaning": "Nghĩa của biến thể này",
          "usage_example": "Ví dụ sử dụng biến thể"
        }
      ]
    },
    "usage": {
      "collocations": [
        {
          "phrase": "Cụm từ collocation liên quan",
          "meaning": "Nghĩa của collocation",
          "usage_example": "Ví dụ sử dụng collocation",
          "frequency_level": "common/uncommon/rare"
        }
      ],
      "example_sentences": [
        {
          "sentence": "Câu ví dụ minh họa",
          "translation": "Dịch câu ví dụ",
          "context": "Văn cảnh sử dụng câu này"
        }
      ]
    },
    "pragmatics_and_culture": {
      "formality_level": "Mức độ trang trọng (Very Formal/Formal/Neutral/Informal)",
      "register_appropriateness": "Đăng ký phù hợp (Business/Academic/Casual...)",
      "cultural_notes": "Lưu ý văn hóa (nếu có)",
      "common_mistakes": [
        {
          "mistake": "Lỗi sai phổ biến",
          "correction": "Cách sửa đúng",
          "explanation": "Giải thích tại sao sai và cách sửa"
        }
      ]
    },
    "learning_aids": {
      "memory_tips": "Mẹo ghi nhớ cụm từ",
      "pronunciation_tips": "Mẹo phát âm",
      "practice_suggestions": [
        {
          "exercise": "Bài tập luyện tập",
          "instruction": "Hướng dẫn thực hiện bài tập"
        }
      ]
    }
  }
}`
}

// Sentence-specific highlight prompt
function buildSentenceHighlightPrompt(sentence: string, content: string, documentContext?: string): string {
  return `Bạn là một chuyên gia ngôn ngữ học và biên tập viên cao cấp. Nhiệm vụ của bạn là phân tích sâu câu được highlight "${sentence}" trong ngữ cảnh được cung cấp.

INPUT DATA:
- Target Sentence: "${sentence}"
- Content: "${content}"
- Document Context: "${documentContext || ''}"

YÊU CẦU OUTPUT:
1. Trả về duy nhất JSON valid (RFC 8259).
2. KHÔNG markdown, KHÔNG lời dẫn.
3. Ngôn ngữ giải thích: Tiếng Việt.
4. Phần "rewrite_suggestions" phải giữ nguyên ý nghĩa gốc nhưng thay đổi văn phong/cấu trúc.

JSON SCHEMA:
{
  "highlight_analysis": {
    "type": "sentence",
    "sentence": "${sentence}",
    "meta": {
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
      "clauses": [
        { "text": "Nội dung mệnh đề", "type": "Independent/Dependent..." }
      ]
    },
    "contextual_role": {
      "sentence_role": "Chức năng trong đoạn văn",
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
    "rewrite_suggestions": [
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
}`
}

// Paragraph-specific highlight prompt
function buildParagraphHighlightPrompt(paragraph: string, content: string): string {
  return `Bạn là một biên tập viên cao cấp, chuyên gia ngôn ngữ học và phê bình văn học. Nhiệm vụ của bạn là phân tích toàn diện đoạn văn được highlight "${paragraph}" trong ngữ cảnh được cung cấp.

INPUT DATA:
- Target Paragraph: "${paragraph}"
- Content: "${content}"

YÊU CẦU XỬ LÝ:
1. Phân tích sâu cấu trúc, nội dung, cảm xúc và kỹ thuật viết.
2. Trả về kết quả dưới dạng JSON hợp lệ (RFC 8259).
3. Ngôn ngữ trong các trường giải thích (value) là Tiếng Việt.
4. Tuyệt đối không thêm text dẫn nhập hay markdown (như \`\`\`), chỉ trả về raw JSON string.

HƯỚNG DẪN JSON SCHEMA CHI TIẾT:
{
  "highlight_analysis": {
    "type": "paragraph",
    "paragraph": "${paragraph}",
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
    "structure_breakdown": [
      {
        "sentence_index": 1,
        "snippet": "3-5 từ đầu của câu để nhận diện...",
        "role": "Vai trò của câu (Topic Sentence/Supporting Detail/Evidence/Example/Transition/Conclusion)",
        "analysis": "Giải thích ngắn gọn câu này đóng góp gì cho ý chính của đoạn?"
      }
    ],
    "coherence_and_cohesion": {
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
      "critiques": [
        {
          "issue_type": "Loại lỗi (Logic/Grammar/Vocabulary/Repetition/Style)",
          "description": "Mô tả chi tiết vấn đề đang gặp phải",
          "suggestion": "Đề xuất cách sửa cụ thể cho vấn đề này"
        }
      ],
      "better_version": "Viết lại đoạn văn này (Rewrite) sao cho hay hơn, mạch lạc hơn, khắc phục các lỗi đã nêu ở trên nhưng vẫn giữ nguyên ý gốc."
    }
  }
}`
}

// Universal highlight prompt for mixed or unknown types
function buildUniversalHighlightPrompt(highlight: HighlightMetadata, maxItems: number = 5): string {
  const { highlight_type, selected_text, content, document_context } = highlight
  
  return `Bạn là một chuyên gia ngôn ngữ học và giáo dục. Nhiệm vụ của bạn là phân tích nội dung được highlight "${selected_text}" (loại: ${highlight_type}) trong ngữ cảnh được cung cấp.

INPUT DATA:
- Highlight Type: "${highlight_type}"
- Selected Text: "${selected_text}"
- Content: "${content}"
- Document Context: "${document_context || ''}"
- Max Items per list: ${maxItems}

YÊU CẦU OUTPUT:
1. Trả về duy nhất một chuỗi JSON hợp lệ (RFC 8259).
2. Tuyệt đối KHÔNG kèm markdown (\`\`\`), không lời dẫn.
3. Các trường giải thích chính dùng Tiếng Việt.
4. Tự động xác định loại phân tích phù hợp nhất dựa trên nội dung và độ dài của text.

JSON SCHEMA:
{
  "highlight_analysis": {
    "type": "${highlight_type}",
    "content": "${selected_text}",
    "detected_type": "Loại được phát hiện tự động (word/phrase/sentence/paragraph)",
    "meta": {
      "confidence_level": "Mức độ tin cậy của phân loại (1-10)",
      "analysis_approach": "Phương pháp phân tích được sử dụng",
      "complexity_level": "Độ khó (Basic/Intermediate/Advanced)"
    },
    "content_analysis": {
      "main_meaning": "Nghĩa chính của nội dung được highlight",
      "contextual_relevance": "Mức độ liên quan đến ngữ cảnh xung quanh",
      "key_features": ["Danh sách các đặc điểm nổi bật"]
    },
    "detailed_analysis": {
      "linguistic_features": {
        "vocabulary_level": "Cấp độ từ vựng",
        "grammatical_structure": "Cấu trúc ngữ pháp",
        "stylistic_elements": "Yếu tố văn phong"
      },
      "semantic_analysis": {
        "literal_meaning": "Nghĩa đen/nghĩa cơ bản",
        "figurative_meaning": "Nghĩa bóng/nghĩa ẩn (nếu có)",
        "cultural_context": "Bối cảnh văn hóa (nếu có)"
      }
    },
    "usage_examples": [
      {
        "example": "Ví dụ sử dụng trong ngữ cảnh khác",
        "translation": "Dịch ví dụ",
        "context_type": "Loại ngữ cảnh sử dụng"
      }
    ],
    "learning_suggestions": {
      "memory_tips": "Mẹo ghi nhớ",
      "practice_exercises": ["Bài tập luyện tập đề xuất"],
      "related_concepts": ["Khái niệm liên quan"]
    }
  }
}`
}

// Word Analysis Prompt Builder
export function buildWordAnalysisPrompt(request: AnalyzeWordRequest): string {
  const { word, sentenceContext, paragraphContext, maxItems = 5 } = request
  
  return `
Bạn là một chuyên gia ngôn ngữ học và giáo dục. Nhiệm vụ của bạn là phân tích từ khóa "${word}" để giúp người học hiểu sâu và biết cách tư duy đoán nghĩa.

INPUT DATA:
- Target Word: "${word}"
- Sentence Context: "${sentenceContext}"
- Paragraph Context: "${paragraphContext || ''}"
- Max Items per list: ${maxItems}

YÊU CẦU OUTPUT:
1. Trả về duy nhất một chuỗi JSON hợp lệ (RFC 8259).
2. Tuyệt đối KHÔNG kèm markdown (\`\`\`), không lời dẫn.
3. Các trường giải thích chính dùng Tiếng Việt.
4. Phần Synonyms/Antonyms: Giới hạn tối đa ${maxItems} từ mỗi loại, sắp xếp theo độ phổ biến/độ sát nghĩa giảm dần.

JSON SCHEMA:
{
  "meta": {
    "word": "${word}",
    "ipa": "Phiên âm IPA",
    "pos": "Từ loại (Noun/Verb...)",
    "cefr": "Trình độ (A1-C2)",
    "tone": "Sắc thái (Formal/Neutral/Irony...)"
  },
  "definitions": {
    "root_meaning": "Nghĩa gốc trong từ điển",
    "context_meaning": "Nghĩa trong câu này (dịch thoát ý để hợp văn cảnh)",
    "vietnamese_translation": "Từ/Cụm từ tiếng Việt tương đương nhất"
  },
  "inference_strategy": {
    "clues": "Dấu hiệu nào trong câu giúp đoán nghĩa? (VD: Tiền tố 'un-', từ nối 'but', hoặc tân ngữ đi kèm...)",
    "reasoning": "Giải thích ngắn gọn quy trình suy luận để ra nghĩa của từ mà không cần tra từ điển"
  },
  "relations": {
    "synonyms": [
      {
        "word": "Từ đồng nghĩa 1",
        "ipa": "/ipa/",
        "meaning_en": "Định nghĩa ngắn bằng tiếng Anh",
        "meaning_vi": "Định nghĩa ngắn bằng tiếng Việt"
      }
    ],
    "antonyms": [
      {
        "word": "Từ trái nghĩa 1",
        "ipa": "/ipa/",
        "meaning_en": "Định nghĩa ngắn bằng tiếng Anh",
        "meaning_vi": "Định nghĩa ngắn bằng tiếng Việt"
      }
    ]
  },
  "usage": {
    "collocations": [
      {
        "phrase": "Cụm từ collocation",
        "meaning": "Nghĩa của cụm từ",
        "usage_example": "Ví dụ sử dụng cụm từ trong câu",
        "frequency_level": "common"
      }
    ],
    "example_sentence": "Một câu ví dụ khác (khác input)",
    "example_translation": "Dịch câu ví dụ"
  }
}
`
}

// Sentence Analysis Prompt Builder
export function buildSentenceAnalysisPrompt(request: AnalyzeSentenceRequest): string {
  const { sentence, paragraphContext } = request
  
  return `
Bạn là một chuyên gia ngôn ngữ học và biên tập viên cao cấp. Nhiệm vụ của bạn là phân tích sâu câu văn "${sentence}" và đề xuất các cách viết lại tối ưu hơn.

INPUT:
- Target Sentence: "${sentence}"
- Paragraph Context: "${paragraphContext || ''}"

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
    "clauses": [
      { "text": "Nội dung mệnh đề", "type": "Independent/Dependent..." }
    ]
  },
  "contextual_role": {
    "sentence_role": "Chức năng trong đoạn (Mở bài/Giải thích/Kết luận...)",
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
  "rewrite_suggestions": [
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
`
}

// Paragraph Analysis Prompt Builder
export function buildParagraphAnalysisPrompt(request: AnalyzeParagraphRequest): string {
  const { paragraph } = request
  
  return `
Bạn là một biên tập viên cao cấp, chuyên gia ngôn ngữ học và phê bình văn học. Nhiệm vụ của bạn là phân tích toàn diện đoạn văn được cung cấp dưới đây.

INPUT DATA:
- Paragraph: "${paragraph}"

YÊU CẦU XỬ LÝ:
1. Phân tích sâu cấu trúc, nội dung, cảm xúc và kỹ thuật viết.
2. Trả về kết quả dưới dạng JSON hợp lệ (RFC 8259).
3. Ngôn ngữ trong các trường giải thích (value) là Tiếng Việt.
4. Tuyệt đối không thêm text dẫn nhập hay markdown (như \`\`\`), chỉ trả về raw JSON string.

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
  "structure_breakdown": [
    {
      "sentence_index": 1,
      "snippet": "3-5 từ đầu của câu để nhận diện...",
      "role": "Vai trò của câu (Topic Sentence/Supporting Detail/Evidence/Example/Transition/Conclusion)",
      "analysis": "Giải thích ngắn gọn câu này đóng góp gì cho ý chính của đoạn?"
    }
  ],
  "coherence_and_cohesion": {
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
    "critiques": [
      {
        "issue_type": "Loại lỗi (Logic/Grammar/Vocabulary/Repetition/Style)",
        "description": "Mô tả chi tiết vấn đề đang gặp phải",
        "suggestion": "Đề xuất cách sửa cụ thể cho vấn đề này"
      }
    ],
    "better_version": "Viết lại đoạn văn này (Rewrite) sao cho hay hơn, mạch lạc hơn, khắc phục các lỗi đã nêu ở trên nhưng vẫn giữ nguyên ý gốc."
  }
}
`
}

// Phrase Analysis Prompt Builder
export function buildPhraseAnalysisPrompt(request: AnalyzePhraseRequest): string {
  const { phrase, sentenceContext, paragraphContext, maxItems = 5 } = request
  
  return `
Bạn là một chuyên gia ngôn ngữ học và giáo dục. Nhiệm vụ của bạn là phân tích cụm từ "${phrase}" để giúp người học hiểu sâu về cách sử dụng, nghĩa và các sắc thái của nó.

INPUT DATA:
- Target Phrase: "${phrase}"
- Sentence Context: "${sentenceContext}"
- Paragraph Context: "${paragraphContext || ''}"
- Max Items per list: ${maxItems}

YÊU CẦU OUTPUT:
1. Trả về duy nhất một chuỗi JSON hợp lệ (RFC 8259).
2. Tuyệt đối KHÔNG kèm markdown (\`\`\`), không lời dẫn.
3. Các trường giải thích chính dùng Tiếng Việt.
4. Phần collocations và variations: Giới hạn tối đa ${maxItems} mục mỗi loại.

JSON SCHEMA:
{
  "meta": {
    "phrase": "${phrase}",
    "ipa": "Phiên âm IPA của cả cụm từ",
    "pos": "Từ loại của cụm từ (Noun Phrase/Verb Phrase/Phrasal Verb/Idiom...)",
    "type": "Loại cụm từ (Idiom/Collocation/Phrasal Verb/Compound Noun...)",
    "cefr": "Trình độ (A1-C2)",
    "tone": "Sắc thái (Formal/Neutral/Irony...)",
    "register": "Đăng ký (Formal/Informal/Academic...)"
  },
  "definitions": {
    "literal_meaning": "Nghĩa đen (nếu có)",
    "figurative_meaning": "Nghĩa bóng/nghĩa thực tế trong văn cảnh",
    "vietnamese_translation": "Dịch sang tiếng Việt",
    "usage_notes": "Lưu ý quan trọng về cách sử dụng"
  },
  "components": {
    "words": [
      {
        "word": "Từ riêng lẻ trong cụm",
        "ipa": "Phiên âm của từ này",
        "meaning": "Nghĩa của từ này khi đứng riêng",
        "role": "Vai trò trong cụm từ (động từ chính, giới từ, bổ nghĩa...)"
      }
    ]
  },
  "grammar_and_structure": {
    "pattern": "Mẫu ngữ pháp (VD: verb + preposition, adjective + noun)",
    "variations": [
      {
        "phrase": "Biến thể của cụm từ",
        "meaning": "Nghĩa của biến thể này",
        "usage_example": "Ví dụ sử dụng biến thể"
      }
    ]
  },
  "usage": {
    "collocations": [
      {
        "phrase": "Cụm từ collocation liên quan",
        "meaning": "Nghĩa của collocation",
        "usage_example": "Ví dụ sử dụng collocation",
        "frequency_level": "common/uncommon/rare"
      }
    ],
    "example_sentences": [
      {
        "sentence": "Câu ví dụ minh họa",
        "translation": "Dịch câu ví dụ",
        "context": "Văn cảnh sử dụng câu này"
      }
    ]
  },
  "pragmatics_and_culture": {
    "formality_level": "Mức độ trang trọng (Very Formal/Formal/Neutral/Informal)",
    "register_appropriateness": "Đăng ký phù hợp (Business/Academic/Casual...)",
    "cultural_notes": "Lưu ý văn hóa (nếu có)",
    "common_mistakes": [
      {
        "mistake": "Lỗi sai phổ biến",
        "correction": "Cách sửa đúng",
        "explanation": "Giải thích tại sao sai và cách sửa"
      }
    ]
  },
  "learning_aids": {
    "memory_tips": "Mẹo ghi nhớ cụm từ",
    "pronunciation_tips": "Mẹo phát âm",
    "practice_suggestions": [
      {
        "exercise": "Bài tập luyện tập",
        "instruction": "Hướng dẫn thực hiện bài tập"
      }
    ]
  }
}
`
}

// Legacy Highlight validation function (Commented for reference)
/*
export function validateHighlightAnalysis(data: any): any {
  try {
    // Basic structure validation
    if (!data.highlight_analysis) {
      throw new Error('Invalid HighlightAnalysis structure - missing highlight_analysis')
    }
    
    // Required fields validation
    const analysis = data.highlight_analysis
    const requiredFields = [
      'highlight_analysis.type',
      'highlight_analysis.content'
    ]
    
    for (const field of requiredFields) {
      const [parent, child] = field.split('.')
      const parentObj = analysis as Record<string, any>
      const parentKey = parent as string
      if (!parentObj[parentKey]) {
        throw new Error(`Missing required field: ${field}`)
      }
      if (child && !parentObj[parentKey][child]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    return data
  } catch (error) {
    throw new Error(`HighlightAnalysis validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Legacy Highlight fallback function (Commented for reference)
export function createFallbackHighlightAnalysis(highlight: HighlightMetadata): any {
  const { highlight_type, selected_text } = highlight
  
  return {
    highlight_analysis: {
      type: highlight_type,
      content: selected_text,
      detected_type: highlight_type,
      meta: {
        confidence_level: 1,
        analysis_approach: "fallback",
        complexity_level: "Basic"
      },
      content_analysis: {
        main_meaning: "Không thể xác định",
        contextual_relevance: "Không thể xác định",
        key_features: []
      },
      detailed_analysis: {
        linguistic_features: {
          vocabulary_level: "Không thể xác định",
          grammatical_structure: "Không thể xác định",
          stylistic_elements: "Không thể xác định"
        },
        semantic_analysis: {
          literal_meaning: "Không thể xác định",
          figurative_meaning: "Không thể xác định",
          cultural_context: "Không có dữ liệu"
        }
      },
      usage_examples: [],
      learning_suggestions: {
        memory_tips: "Không có dữ liệu",
        practice_exercises: [],
        related_concepts: []
      }
    }
  }
}
*/

// JSON Validation Functions
export function validateWordAnalysis(data: any): WordAnalysis {
  try {
    // Basic structure validation
    if (!data.meta || !data.definitions || !data.relations || !data.usage) {
      throw new Error('Invalid WordAnalysis structure')
    }
    
    // Required fields validation
    const requiredFields = [
      'meta.word', 'meta.ipa', 'meta.pos', 'meta.cefr', 'meta.tone',
      'definitions.root_meaning', 'definitions.context_meaning', 'definitions.vietnamese_translation',
      'inference_strategy.clues', 'inference_strategy.reasoning'
    ]
    
    for (const field of requiredFields) {
      const [parent, child] = field.split('.')
      const parentObj = data as Record<string, any>
      const parentKey = parent as string
      if (!parentObj[parentKey]) {
        throw new Error(`Missing required field: ${field}`)
      }
      if (child && !parentObj[parentKey][child]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    return data as WordAnalysis
  } catch (error) {
    throw new Error(`WordAnalysis validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function validateSentenceAnalysis(data: any): SentenceAnalysis {
  try {
    // Basic structure validation
    if (!data.meta || !data.semantics || !data.grammar_breakdown || !data.translation) {
      throw new Error('Invalid SentenceAnalysis structure')
    }
    
    // Required fields validation
    const requiredFields = [
      'meta.sentence', 'meta.complexity_level', 'meta.sentence_type',
      'semantics.main_idea', 'semantics.sentiment',
      'grammar_breakdown.subject', 'grammar_breakdown.main_verb',
      'translation.literal', 'translation.natural'
    ]
    
    for (const field of requiredFields) {
      const [parent, child] = field.split('.')
      const parentObj = data as Record<string, any>
      const parentKey = parent as string
      if (!parentObj[parentKey]) {
        throw new Error(`Missing required field: ${field}`)
      }
      if (child && !parentObj[parentKey][child]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    return data as SentenceAnalysis
  } catch (error) {
    throw new Error(`SentenceAnalysis validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function validateParagraphAnalysis(data: any): ParagraphAnalysis {
  try {
    // Basic structure validation
    if (!data.meta || !data.content_analysis || !data.structure_breakdown || !data.constructive_feedback) {
      throw new Error('Invalid ParagraphAnalysis structure')
    }
    
    // Required fields validation
    const requiredFields = [
      'meta.type', 'meta.tone', 'meta.target_audience',
      'content_analysis.main_topic', 'content_analysis.sentiment',
      'stylistic_evaluation.vocabulary_level', 'stylistic_evaluation.sentence_variety'
    ]
    
    for (const field of requiredFields) {
      const [parent, child] = field.split('.')
      const parentObj = data as Record<string, any>
      const parentKey = parent as string
      if (!parentObj[parentKey]) {
        throw new Error(`Missing required field: ${field}`)
      }
      if (child && !parentObj[parentKey][child]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    return data as ParagraphAnalysis
  } catch (error) {
    throw new Error(`ParagraphAnalysis validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function validatePhraseAnalysis(data: any): PhraseAnalysis {
  try {
    // Basic structure validation
    if (!data.meta || !data.definitions || !data.components || !data.usage || !data.pragmatics_and_culture || !data.learning_aids) {
      throw new Error('Invalid PhraseAnalysis structure')
    }
    
    // Required fields validation
    const requiredFields = [
      'meta.phrase', 'meta.ipa', 'meta.pos', 'meta.type', 'meta.cefr', 'meta.tone', 'meta.register',
      'definitions.literal_meaning', 'definitions.figurative_meaning', 'definitions.vietnamese_translation', 'definitions.usage_notes',
      'grammar_and_structure.pattern',
      'pragmatics_and_culture.formality_level', 'pragmatics_and_culture.register_appropriateness',
      'learning_aids.memory_tips', 'learning_aids.pronunciation_tips'
    ]
    
    for (const field of requiredFields) {
      const [parent, child] = field.split('.')
      const parentObj = data as Record<string, any>
      const parentKey = parent as string
      if (!parentObj[parentKey]) {
        throw new Error(`Missing required field: ${field}`)
      }
      if (child && !parentObj[parentKey][child]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    return data as PhraseAnalysis
  } catch (error) {
    throw new Error(`PhraseAnalysis validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Error handling utilities
export function createFallbackWordAnalysis(word: string): WordAnalysis {
  return {
    meta: {
      word,
      ipa: "",
      pos: "unknown",
      cefr: "unknown",
      tone: "neutral"
    },
    definitions: {
      root_meaning: "Không thể xác định",
      context_meaning: "Không thể xác định",
      vietnamese_translation: "Không thể xác định"
    },
    inference_strategy: {
      clues: "Không có dữ liệu",
      reasoning: "Không có dữ liệu"
    },
    relations: {
      synonyms: [],
      antonyms: []
    },
    usage: {
      collocations: [],
      example_sentence: "",
      example_translation: ""
    }
  }
}

export function createFallbackSentenceAnalysis(sentence: string): SentenceAnalysis {
  return {
    meta: {
      sentence,
      complexity_level: "Basic",
      sentence_type: "Unknown"
    },
    semantics: {
      main_idea: "Không thể xác định",
      subtext: "",
      sentiment: "Neutral"
    },
    grammar_breakdown: {
      subject: "Không thể xác định",
      main_verb: "Không thể xác định",
      object: "",
      clauses: []
    },
    contextual_role: {
      function: "Không thể xác định",
      relation_to_previous: ""
    },
    key_components: [],
    rewrite_suggestions: [],
    translation: {
      literal: "Không thể dịch",
      natural: "Không thể dịch"
    }
  }
}

export function createFallbackParagraphAnalysis(paragraph: string): ParagraphAnalysis {
  return {
    meta: {
      type: "Không thể xác định",
      tone: "Không thể xác định",
      target_audience: "Không thể xác định"
    },
    content_analysis: {
      main_topic: "Không thể xác định",
      sentiment: {
        label: "Neutral",
        intensity: 5,
        justification: "Không thể xác định"
      },
      keywords: []
    },
    structure_breakdown: [],
    coherence_and_cohesion: {
      logic_score: 50,
      flow_score: 50,
      transition_words: [],
      gap_analysis: "Không thể xác định"
    },
    stylistic_evaluation: {
      vocabulary_level: "Không thể xác định",
      sentence_variety: "Không thể xác định"
    },
    constructive_feedback: {
      critiques: [],
      better_version: paragraph
    }
  }
}

export function createFallbackPhraseAnalysis(phrase: string): PhraseAnalysis {
  return {
    meta: {
      phrase,
      ipa: "",
      pos: "unknown",
      type: "unknown",
      cefr: "unknown",
      tone: "neutral",
      register: "neutral"
    },
    definitions: {
      literal_meaning: "Không thể xác định",
      figurative_meaning: "Không thể xác định",
      vietnamese_translation: "Không thể xác định",
      usage_notes: "Không có dữ liệu"
    },
    components: {
      words: []
    },
    grammar_and_structure: {
      pattern: "Không thể xác định",
      variations: []
    },
    usage: {
      collocations: [],
      example_sentences: []
    },
    pragmatics_and_culture: {
      formality_level: "Không thể xác định",
      register_appropriateness: "Không thể xác định",
      cultural_notes: "Không có dữ liệu",
      common_mistakes: []
    },
    learning_aids: {
      memory_tips: "Không có dữ liệu",
      pronunciation_tips: "Không có dữ liệu",
      practice_suggestions: []
    }
  }
}

// Retry logic utilities
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}
