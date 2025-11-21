# Prompt Phân Tích Từ - Word Analysis

## Giới thiệu

Chức năng phân tích từ là một phần quan trọng của hệ thống AI Semantic Analysis Editor, giúp người học hiểu sâu về từ vựng trong ngữ cảnh cụ thể. Prompt được thiết kế để trích xuất thông tin phong phú về từ, bao gồm phiên âm, nghĩa, từ loại, quan hệ từ vựng, và hướng dẫn suy luận ngữ nghĩa.

## Interface TypeScript

Đây là interface TypeScript đầy đủ cho WordAnalysis với tất cả các rich fields:

```typescript
export interface Collocation {
  phrase: string;
  meaning: string;
  usage_example?: string;
  frequency_level: 'common' | 'uncommon' | 'rare';
}

export interface WordAnalysis {
  meta: {
    word: string;
    ipa: string;
    pos: string;
    cefr: string;
    tone: string;
  };
  definitions: {
    root_meaning: string;
    context_meaning: string;
    vietnamese_translation: string;
  };
  inference_strategy: {
    clues: string;
    reasoning: string;
  };
  relations: {
    synonyms: Array<{
      word: string;
      ipa: string;
      meaning_en: string;
      meaning_vi: string;
    }>;
    antonyms: Array<{
      word: string;
      ipa: string;
      meaning_en: string;
      meaning_vi: string;
    }>;
  };
  usage: {
    collocations: Collocation[];
    example_sentence: string;
    example_translation: string;
  };
}
```

## Prompt Template

Đây là prompt template chi tiết theo format trong __logs/fb.txt:

```typescript
const maxItems = 5; // Biến giới hạn số lượng từ đồng nghĩa/trái nghĩa

const prompt = `
Bạn là một chuyên gia ngôn ngữ học và giáo dục. Nhiệm vụ của bạn là phân tích từ khóa "${word}" để giúp người học hiểu sâu và biết cách tư duy đoán nghĩa.

INPUT DATA:
- Target Word: "${word}"
- Sentence Context: "${sentenceContext}"
- Paragraph Context: "${paragraphContext}"
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
  "inference_strategy": { // Phần mới: Hướng dẫn cách đoán nghĩa
    "clues": "Dấu hiệu nào trong câu giúp đoán nghĩa? (VD: Tiền tố 'un-', từ nối 'but', hoặc tân ngữ đi kèm...)",
    "reasoning": "Giải thích ngắn gọn quy trình suy luận để ra nghĩa của từ mà không cần tra từ điển"
  },
  "relations": {
    "synonyms": [ // Array of Objects
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
`;
```

## Ví dụ Sử Dụng

### Ví dụ 1: Phân tích từ "sophisticated"

```typescript
const word = "sophisticated";
const sentenceContext = "The company has developed a sophisticated algorithm to detect fraud.";
const paragraphContext = "Financial institutions are increasingly relying on artificial intelligence to improve their security systems. The company has developed a sophisticated algorithm to detect fraud. This technology analyzes patterns in real-time and flags suspicious activities.";
const maxItems = 5;

const prompt = `
Bạn là một chuyên gia ngôn ngữ học và giáo dục. Nhiệm vụ của bạn là phân tích từ khóa "${word}" để giúp người học hiểu sâu và biết cách tư duy đoán nghĩa.

INPUT DATA:
- Target Word: "${word}"
- Sentence Context: "${sentenceContext}"
- Paragraph Context: "${paragraphContext}"
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
`;

// Kết quả mong đợi:
{
  "meta": {
    "word": "sophisticated",
    "ipa": "/səˈfɪstɪkeɪtɪd/",
    "pos": "Adjective",
    "cefr": "C1",
    "tone": "Formal"
  },
  "definitions": {
    "root_meaning": "phức tạp, tinh vi, hiện đại",
    "context_meaning": "phức tạp và được thiết kế thông minh, có khả năng xử lý nhiều tác vụ",
    "vietnamese_translation": "tinh vi, phức tạp, hiện đại"
  },
  "inference_strategy": {
    "clues": "Từ 'algorithm' sau 'sophisticated' cho thấy đây là tính từ mô tả công nghệ phức tạp. Ngữ cảnh về phát hiện gian lận cũng gợi ý tính năng cao cấp.",
    "reasoning": "Khi mô tả công nghệ trong lĩnh vực tài chính và an ninh, 'sophisticated' thường chỉ các hệ thống có tính năng vượt trội, xử lý được các vấn đề phức tạp mà các hệ thống thông thường không thể."
  },
  "relations": {
    "synonyms": [
      {
        "word": "advanced",
        "ipa": "/ədˈvænst/",
        "meaning_en": "far on in progress; complex",
        "meaning_vi": "nâng cao, tiến bộ"
      },
      {
        "word": "complex",
        "ipa": "/ˈkɒmpleks/",
        "meaning_en": "consisting of many different parts",
        "meaning_vi": "phức tạp"
      },
      {
        "word": "intricate",
        "ipa": "/ˈɪntrɪkət/",
        "meaning_en": "very detailed and complicated",
        "meaning_vi": "tinh xảo, phức tạp"
      },
      {
        "word": "elaborate",
        "ipa": "/ɪˈlæbərət/",
        "meaning_en": "detailed and complicated",
        "meaning_vi": "công phu, tỉ mỉ"
      },
      {
        "word": "refined",
        "ipa": "/rɪˈfaɪnd/",
        "meaning_en": "improved and elegant",
        "meaning_vi": "tinh tế, được cải tiến"
      }
    ],
    "antonyms": [
      {
        "word": "simple",
        "ipa": "/ˈsɪmpəl/",
        "meaning_en": "basic or uncomplicated",
        "meaning_vi": "đơn giản"
      },
      {
        "word": "basic",
        "ipa": "/ˈbeɪsɪk/",
        "meaning_en": "essential or fundamental",
        "meaning_vi": "cơ bản"
      },
      {
        "word": "crude",
        "ipa": "/kruːd/",
        "meaning_en": "in a natural or raw state",
        "meaning_vi": "thô sơ"
      },
      {
        "word": "primitive",
        "ipa": "/ˈprɪmətɪv/",
        "meaning_en": "relating to an early stage",
        "meaning_vi": "nguyên thủy"
      },
      {
        "word": "unsophisticated",
        "ipa": "/ʌnsəˈfɪstɪkeɪtɪd/",
        "meaning_en": "not complex or complicated",
        "meaning_vi": "không phức tạp"
      }
    ]
  },
  "usage": {
    "collocations": [
      {
        "phrase": "sophisticated technology",
        "meaning": "công nghệ tinh vi, hiện đại",
        "usage_example": "The company invested in sophisticated technology to improve efficiency.",
        "frequency_level": "common"
      },
      {
        "phrase": "sophisticated system",
        "meaning": "hệ thống phức tạp, thông minh",
        "usage_example": "They developed a sophisticated system for data analysis.",
        "frequency_level": "common"
      },
      {
        "phrase": "sophisticated analysis",
        "meaning": "phân tích chuyên sâu, chi tiết",
        "usage_example": "The report provided a sophisticated analysis of the market trends.",
        "frequency_level": "common"
      },
      {
        "phrase": "sophisticated approach",
        "meaning": "phương pháp tiếp cận tinh vi, thông minh",
        "usage_example": "Her sophisticated approach to problem-solving impressed everyone.",
        "frequency_level": "uncommon"
      },
      {
        "phrase": "sophisticated design",
        "meaning": "thiết kế tinh xảo, phức tạp",
        "usage_example": "The building featured a sophisticated design that combined form and function.",
        "frequency_level": "uncommon"
      }
    ],
    "example_sentence": "The research team used sophisticated statistical methods to analyze the data.",
    "example_translation": "Nhóm nghiên cứu đã sử dụng các phương pháp thống kê tinh vi để phân tích dữ liệu."
  }
}
```

### Ví dụ 2: Phân tích từ "run" với maxItems = 3

```typescript
const word = "run";
const sentenceContext = "I need to run some errands before the store closes.";
const paragraphContext = "Today was quite busy. I need to run some errands before the store closes. After that, I'll prepare dinner for the family.";
const maxItems = 3;

// Sử dụng prompt template như trên với các biến đã định nghĩa

// Kết quả mong đợi:
{
  "meta": {
    "word": "run",
    "ipa": "/rʌn/",
    "pos": "Verb",
    "cefr": "A2",
    "tone": "Neutral"
  },
  "definitions": {
    "root_meaning": "di chuyển nhanh bằng chân, chạy",
    "context_meaning": "đi làm các công việc, việc vặt",
    "vietnamese_translation": "đi làm, giải quyết (việc)"
  },
  "inference_strategy": {
    "clues": "Từ 'errands' (việc vặt) sau 'run' cho thấy đây không phải là chạy bộ thể chất mà là đi làm các công việc cụ thể.",
    "reasoning": "Trong cấu trúc 'run errands', động từ 'run' có nghĩa đặc biệt là đi làm hoặc giải quyết các công việc nhỏ, không phải nghĩa đen là chạy. Đây là một collocation phổ biến trong tiếng Anh."
  },
  "relations": {
    "synonyms": [
      {
        "word": "handle",
        "ipa": "/ˈhændəl/",
        "meaning_en": "deal with or manage",
        "meaning_vi": "xử lý, giải quyết"
      },
      {
        "word": "do",
        "ipa": "/duː/",
        "meaning_en": "perform or carry out",
        "meaning_vi": "làm, thực hiện"
      },
      {
        "word": "take care of",
        "ipa": "/teɪk keər ɒv/",
        "meaning_en": "look after or deal with",
        "meaning_vi": "chăm sóc, lo liệu"
      }
    ],
    "antonyms": [
      {
        "word": "ignore",
        "ipa": "/ɪɡˈnɔːr/",
        "meaning_en": "pay no attention to",
        "meaning_vi": "bỏ qua, phớt lờ"
      },
      {
        "word": "neglect",
        "ipa": "/nɪˈɡlekt/",
        "meaning_en": "fail to care for properly",
        "meaning_vi": "bên lường, phớt lờ"
      },
      {
        "word": "avoid",
        "ipa": "/əˈvɔɪd/",
        "meaning_en": "keep away from",
        "meaning_vi": "tránh né"
      }
    ]
  },
  "usage": {
    "collocations": [
      {
        "phrase": "run errands",
        "meaning": "đi làm các việc vặt",
        "usage_example": "I need to run some errands before the store closes.",
        "frequency_level": "common"
      },
      {
        "phrase": "run a business",
        "meaning": "quản lý, điều hành một doanh nghiệp",
        "usage_example": "She learned how to run a business from her father.",
        "frequency_level": "common"
      },
      {
        "phrase": "run a program",
        "meaning": "chạy một chương trình máy tính",
        "usage_example": "Click here to run the program on your computer.",
        "frequency_level": "common"
      },
      {
        "phrase": "run a meeting",
        "meaning": "chủ trì một cuộc họp",
        "usage_example": "The manager will run the meeting tomorrow morning.",
        "frequency_level": "uncommon"
      },
      {
        "phrase": "run late",
        "meaning": "đi muộn, đến muộn",
        "usage_example": "I'm going to run late for the appointment.",
        "frequency_level": "common"
      }
    ],
    "example_sentence": "She runs a successful bakery downtown.",
    "example_translation": "Cô ấy quản lý một tiệm bánh thành công ở trung tâm thành phố."
  }
}
```

## Hướng Dẫn Tích Hợp với Hệ Thống AI Hiện Có

### 1. Cập nhật SemanticAnalyzer

```typescript
// src/lib/ai/semantic-analysis.ts
import { createAIClient } from './client'

export interface Collocation {
  phrase: string;
  meaning: string;
  usage_example?: string;
  frequency_level: 'common' | 'uncommon' | 'rare';
}

export interface WordAnalysis {
  meta: {
    word: string;
    ipa: string;
    pos: string;
    cefr: string;
    tone: string;
  };
  definitions: {
    root_meaning: string;
    context_meaning: string;
    vietnamese_translation: string;
  };
  inference_strategy: {
    clues: string;
    reasoning: string;
  };
  relations: {
    synonyms: Array<{
      word: string;
      ipa: string;
      meaning_en: string;
      meaning_vi: string;
    }>;
    antonyms: Array<{
      word: string;
      ipa: string;
      meaning_en: string;
      meaning_vi: string;
    }>;
  };
  usage: {
    collocations: Collocation[];
    example_sentence: string;
    example_translation: string;
  };
}

export class SemanticAnalyzer {
  private aiClient
  
  constructor() {
    this.aiClient = createAIClient({
      provider: 'anthropic', // hoặc từ env
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4000
    })
  }
  
  async analyzeWord(
    word: string, 
    sentenceContext: string, 
    paragraphContext: string,
    maxItems: number = 5
  ): Promise<WordAnalysis> {
    const prompt = `
Bạn là một chuyên gia ngôn ngữ học và giáo dục. Nhiệm vụ của bạn là phân tích từ khóa "${word}" để giúp người học hiểu sâu và biết cách tư duy đoán nghĩa.

INPUT DATA:
- Target Word: "${word}"
- Sentence Context: "${sentenceContext}"
- Paragraph Context: "${paragraphContext}"
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
`;
    
    try {
      const response = await this.aiClient.generateText({
        prompt,
        temperature: 0.3, // Lower temperature for more consistent output
        maxTokens: 4000
      });
      
      // Parse JSON response
      const analysisResult = JSON.parse(response.text);
      return analysisResult;
    } catch (error) {
      console.error('Error analyzing word:', error);
      
      // Fallback response
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
      };
    }
  }
  
  // Batch analysis để tối ưu API calls
  async analyzeBatch(
    words: Array<{ 
      word: string; 
      sentence: string; 
      paragraph: string;
      maxItems?: number;
    }>
  ): Promise<WordAnalysis[]> {
    // Gộp nhiều từ vào 1 prompt để giảm API calls
    const maxItems = words[0]?.maxItems || 5;
    
    const prompt = `
Bạn là một chuyên gia ngôn ngữ học và giáo dục. Nhiệm vụ của bạn là phân tích các từ khóa sau để giúp người học hiểu sâu và biết cách tư duy đoán nghĩa.

INPUT DATA:
- Max Items per list: ${maxItems}

YÊU CẦU OUTPUT:
1. Trả về duy nhất một chuỗi JSON array hợp lệ (RFC 8259).
2. Tuyệt đối KHÔNG kèm markdown (\`\`\`), không lời dẫn.
3. Các trường giải thích chính dùng Tiếng Việt.
4. Phần Synonyms/Antonyms: Giới hạn tối đa ${maxItems} từ mỗi loại, sắp xếp theo độ phổ biến/độ sát nghĩa giảm dần.

WORDS TO ANALYZE:
${words.map((w, i) => `
${i + 1}. Word: "${w.word}"
   Sentence: "${w.sentence}"
   Paragraph: "${w.paragraph}"
`).join('\n')}

JSON SCHEMA FOR EACH WORD:
{
  "meta": {
    "word": "từ",
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
`;
    
    try {
      const response = await this.aiClient.generateText({
        prompt,
        temperature: 0.3,
        maxTokens: 8000 // Increased for batch processing
      });
      
      // Parse JSON array response
      const analysisResults = JSON.parse(response.text);
      return analysisResults;
    } catch (error) {
      console.error('Error analyzing words batch:', error);
      
      // Fallback: return empty analyses
      return words.map(w => ({
        meta: {
          word: w.word,
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
      }));
    }
  }
}
```

### 2. Cập nhật Analysis Store

```typescript
// src/stores/analysisStore.ts
import { create } from 'zustand'
import { WordAnalysis } from '@/lib/ai/semantic-analysis'

interface AnalysisState {
  // Cache analysis results
  wordAnalyses: Map<string, WordAnalysis>
  
  // UI State
  selectedWord: string | null
  
  // Loading states
  isAnalyzing: boolean
  analysisQueue: string[]
  
  // Actions
  setWordAnalysis: (wordId: string, analysis: WordAnalysis) => void
  selectWord: (wordId: string) => void
  clearSelection: () => void
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  wordAnalyses: new Map(),
  
  selectedWord: null,
  
  isAnalyzing: false,
  analysisQueue: [],
  
  setWordAnalysis: (wordId, analysis) => set((state) => {
    const newMap = new Map(state.wordAnalyses)
    newMap.set(wordId, analysis)
    return { wordAnalyses: newMap }
  }),
  
  selectWord: (wordId) => set({ selectedWord: wordId }),
  
  clearSelection: () => set({ 
    selectedWord: null
  }),
}))
```

### 3. Cập nhật UI Component

```typescript
// src/components/editor/WordAnalysisCard.tsx
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WordAnalysis } from '@/lib/ai/semantic-analysis'

function WordAnalysisCard({ analysis }: { analysis: WordAnalysis }) {
  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-1">{analysis.meta.word}</h3>
        <div className="flex gap-2 flex-wrap">
          <Badge>{analysis.meta.pos}</Badge>
          <Badge variant="outline">{analysis.meta.cefr}</Badge>
          <Badge variant="secondary">{analysis.meta.tone}</Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">{analysis.meta.ipa}</p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Nghĩa gốc</h4>
        <p className="text-sm">{analysis.definitions.root_meaning}</p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">
          Nghĩa trong ngữ cảnh
        </h4>
        <p className="text-sm">{analysis.definitions.context_meaning}</p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">
          Dịch nghĩa
        </h4>
        <p className="text-sm">{analysis.definitions.vietnamese_translation}</p>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">
          Chiến lược suy luận
        </h4>
        <div className="bg-blue-50 p-3 rounded-md">
          <p className="text-sm font-medium mb-1">Dấu hiệu:</p>
          <p className="text-sm mb-2">{analysis.inference_strategy.clues}</p>
          <p className="text-sm font-medium mb-1">Cách suy luận:</p>
          <p className="text-sm">{analysis.inference_strategy.reasoning}</p>
        </div>
      </div>
      
      {analysis.relations.synonyms.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">
            Từ đồng nghĩa
          </h4>
          <div className="space-y-2">
            {analysis.relations.synonyms.map((syn, i) => (
              <div key={i} className="border rounded-md p-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{syn.word}</span>
                  <span className="text-xs text-gray-500">{syn.ipa}</span>
                </div>
                <p className="text-xs text-gray-600">{syn.meaning_en}</p>
                <p className="text-xs">{syn.meaning_vi}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {analysis.relations.antonyms.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">
            Từ trái nghĩa
          </h4>
          <div className="space-y-2">
            {analysis.relations.antonyms.map((ant, i) => (
              <div key={i} className="border rounded-md p-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ant.word}</span>
                  <span className="text-xs text-gray-500">{ant.ipa}</span>
                </div>
                <p className="text-xs text-gray-600">{ant.meaning_en}</p>
                <p className="text-xs">{ant.meaning_vi}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">
          Cách dùng kết hợp (Collocations)
        </h4>
        <div className="space-y-2">
          {analysis.usage.collocations.map((col, i) => (
            <div key={i} className="border rounded-md p-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{col.phrase}</span>
                <Badge variant={
                  col.frequency_level === 'common' ? 'default' :
                  col.frequency_level === 'uncommon' ? 'secondary' : 'outline'
                }>
                  {col.frequency_level}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{col.meaning}</p>
              {col.usage_example && (
                <p className="text-xs italic mt-1">{col.usage_example}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-sm text-gray-600 mb-1">Ví dụ</h4>
        <p className="text-sm italic">{analysis.usage.example_sentence}</p>
        <p className="text-sm mt-1">{analysis.usage.example_translation}</p>
      </div>
    </Card>
  )
}
```

### 4. API Route Integration

```typescript
// src/app/api/ai/analyze-word/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SemanticAnalyzer } from '@/lib/ai/semantic-analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { word, sentenceContext, paragraphContext, maxItems = 5 } = body
    
    if (!word || !sentenceContext) {
      return NextResponse.json(
        { error: 'Missing required fields: word, sentenceContext' },
        { status: 400 }
      )
    }
    
    const analyzer = new SemanticAnalyzer()
    const analysis = await analyzer.analyzeWord(
      word,
      sentenceContext,
      paragraphContext,
      maxItems
    )
    
    return NextResponse.json({ data: analysis })
  } catch (error) {
    console.error('Error in analyze-word API:', error)
    return NextResponse.json(
      { error: 'Failed to analyze word' },
      { status: 500 }
    )
  }
}
```

## Lưu Ý Quan Trọng

1. **Xử lý lỗi**: Luôn có fallback khi AI không thể phân tích từ
2. **Rate limiting**: Sử dụng rate limiting để tránh vượt quá giới hạn API
3. **Caching**: Cache kết quả phân tích để giảm chi phí và tăng tốc độ
4. **Validation**: Validate JSON response trước khi parse để tránh lỗi
5. **Context length**: Giữ context trong giới hạn token của model
6. **Language consistency**: Đảm bảo các giải thích chính dùng Tiếng Việt như yêu cầu

## Tối Ưu Hóa

1. **Batch processing**: Sử dụng `analyzeBatch` để phân tích nhiều từ cùng lúc
2. **Progressive loading**: Hiển thị kết quả từng phần khi nhận được
3. **Smart caching**: Cache theo (word, context) để tái sử dụng kết quả
4. **Background analysis**: Phân tích các từ trong nền khi user không tương tác
5. **Priority queue**: Ưu tiên phân tích từ đang được xem hoặc selected

Với cấu trúc này, hệ thống có thể cung cấp phân tích từ vựng phong phú và hữu ích cho người học, giúp họ hiểu sâu về từ trong ngữ cảnh và phát triển kỹ năng suy luận ngôn ngữ.