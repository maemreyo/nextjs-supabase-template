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
`
}

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