import React from 'react';
import { 
  WordAnalysisDisplay, 
  CollocationList, 
  WordUsageSection,
  SynonymAntonymList,
  WordAnalysis,
  Collocation
} from './index';

/**
 * Example data cho WordAnalysis với cấu trúc collocations mới
 */
const exampleWordAnalysis: WordAnalysis = {
  meta: {
    word: 'sophisticated',
    ipa: '/səˈfɪstɪkeɪtɪd/',
    pos: 'Adjective',
    cefr: 'C1',
    tone: 'Formal'
  },
  definitions: {
    root_meaning: 'phức tạp, tinh vi, hiện đại',
    context_meaning: 'phức tạp và được thiết kế thông minh, có khả năng xử lý nhiều tác vụ',
    vietnamese_translation: 'tinh vi, phức tạp, hiện đại'
  },
  inference_strategy: {
    clues: 'Từ "algorithm" sau "sophisticated" cho thấy đây là tính từ mô tả công nghệ phức tạp. Ngữ cảnh về phát hiện gian lận cũng gợi ý tính năng cao cấp.',
    reasoning: 'Khi mô tả công nghệ trong lĩnh vực tài chính và an ninh, "sophisticated" thường chỉ các hệ thống có tính năng vượt trội, xử lý được các vấn đề phức tạp mà các hệ thống thông thường không thể.'
  },
  relations: {
    synonyms: [
      {
        word: 'advanced',
        ipa: '/ədˈvænst/',
        meaning_en: 'far on in progress; complex',
        meaning_vi: 'nâng cao, tiến bộ'
      },
      {
        word: 'complex',
        ipa: '/ˈkɒmpleks/',
        meaning_en: 'consisting of many different parts',
        meaning_vi: 'phức tạp'
      },
      {
        word: 'intricate',
        ipa: '/ˈɪntrɪkət/',
        meaning_en: 'very detailed and complicated',
        meaning_vi: 'tinh xảo, phức tạp'
      }
    ],
    antonyms: [
      {
        word: 'simple',
        ipa: '/ˈsɪmpəl/',
        meaning_en: 'basic or uncomplicated',
        meaning_vi: 'đơn giản'
      },
      {
        word: 'basic',
        ipa: '/ˈbeɪsɪk/',
        meaning_en: 'essential or fundamental',
        meaning_vi: 'cơ bản'
      },
      {
        word: 'crude',
        ipa: '/kruːd/',
        meaning_en: 'in a natural or raw state',
        meaning_vi: 'thô sơ'
      }
    ]
  },
  usage: {
    collocations: [
      {
        phrase: 'sophisticated technology',
        meaning: 'công nghệ tinh vi, hiện đại',
        usage_example: 'The company invested in sophisticated technology to improve efficiency.',
        frequency_level: 'common'
      },
      {
        phrase: 'sophisticated system',
        meaning: 'hệ thống phức tạp, thông minh',
        usage_example: 'They developed a sophisticated system for data analysis.',
        frequency_level: 'common'
      },
      {
        phrase: 'sophisticated analysis',
        meaning: 'phân tích chuyên sâu, chi tiết',
        usage_example: 'The report provided a sophisticated analysis of the market trends.',
        frequency_level: 'common'
      },
      {
        phrase: 'sophisticated approach',
        meaning: 'phương pháp tiếp cận tinh vi, thông minh',
        usage_example: 'Her sophisticated approach to problem-solving impressed everyone.',
        frequency_level: 'uncommon'
      },
      {
        phrase: 'sophisticated design',
        meaning: 'thiết kế tinh xảo, phức tạp',
        usage_example: 'The building featured a sophisticated design that combined form and function.',
        frequency_level: 'uncommon'
      }
    ],
    example_sentence: 'The research team used sophisticated statistical methods to analyze the data.',
    example_translation: 'Nhóm nghiên cứu đã sử dụng các phương pháp thống kê tinh vi để phân tích dữ liệu.'
  }
};

/**
 * Example component sử dụng WordAnalysisDisplay với collocations mới
 */
export function WordAnalysisExample() {
  const handleSynonymClick = (word: string) => {
    console.log('Synonym clicked:', word);
    // TODO: Implement navigation to word analysis for synonym
  };

  const handleAntonymClick = (word: string) => {
    console.log('Antonym clicked:', word);
    // TODO: Implement navigation to word analysis for antonym
  };

  const handleCollocationClick = (collocation: Collocation) => {
    console.log('Collocation clicked:', collocation);
    // TODO: Implement collocation detail view or pronunciation
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Word Analysis Example</h2>
      
      <WordAnalysisDisplay
        analysis={exampleWordAnalysis}
        onSynonymClick={handleSynonymClick}
        onAntonymClick={handleAntonymClick}
        onCollocationClick={handleCollocationClick}
      />
    </div>
  );
}

/**
 * Example component chỉ hiển thị CollocationList
 */
export function CollocationListExample() {
  const exampleCollocations: Collocation[] = [
    {
      phrase: 'make a decision',
      meaning: 'đưa ra quyết định',
      usage_example: 'We need to make a decision by tomorrow.',
      frequency_level: 'common'
    },
    {
      phrase: 'take a decision',
      meaning: 'đưa ra quyết định (formal)',
      usage_example: 'The board will take a decision at the next meeting.',
      frequency_level: 'uncommon'
    },
    {
      phrase: 'reach a decision',
      meaning: 'đến được quyết định',
      usage_example: 'After hours of discussion, they finally reached a decision.',
      frequency_level: 'common'
    }
  ];

  const handleCollocationClick = (collocation: Collocation) => {
    console.log('Collocation clicked:', collocation);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Collocation List Example</h2>
      
      <CollocationList
        collocations={exampleCollocations}
        onCollocationClick={handleCollocationClick}
        maxItems={10}
        showFrequencyLevel={true}
      />
    </div>
  );
}

/**
 * Example component chỉ hiển thị WordUsageSection
 */
export function WordUsageSectionExample() {
  const handleCollocationClick = (collocation: Collocation) => {
    console.log('Collocation clicked:', collocation);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Word Usage Section Example</h2>
      
      <WordUsageSection
        usage={exampleWordAnalysis.usage}
        onCollocationClick={handleCollocationClick}
        maxCollocations={3}
      />
    </div>
  );
}

/**
 * Example component responsive cho mobile và desktop
 */
export function ResponsiveWordAnalysisExample() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Responsive Word Analysis Example
      </h2>
      
      <div className="space-y-4 sm:space-y-6">
        <WordAnalysisDisplay
          analysis={exampleWordAnalysis}
          onSynonymClick={(word) => console.log('Synonym:', word)}
          onAntonymClick={(word) => console.log('Antonym:', word)}
          onCollocationClick={(collocation) => console.log('Collocation:', collocation)}
          className="w-full"
        />
      </div>
    </div>
  );
}

// Export default example
export default WordAnalysisExample;