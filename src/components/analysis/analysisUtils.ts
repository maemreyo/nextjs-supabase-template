import type { WordAnalysis, SentenceAnalysis } from '../../lib/ai/types';
import type { VocabularyWordInsert } from '../../types/vocabulary';

/**
 * Interface cho validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Type cho mapped vocabulary data với metadata
 */
export type MappedVocabularyData = VocabularyWordInsert & {
  source_reference?: string;
};

/**
 * Map CEFR levels to difficulty numbers
 * A1 -> 1, A2 -> 2, B1 -> 3, B2 -> 4, C1 -> 4, C2 -> 4
 */
function mapCefrToDifficulty(cefr?: string | null): number {
  if (!cefr) return 2; // Default difficulty
  
  switch (cefr.toUpperCase()) {
    case 'A1': return 1;
    case 'A2': return 2;
    case 'B1': return 3;
    case 'B2':
    case 'C1':
    case 'C2': return 4;
    default: return 2; // Default for unknown levels
  }
}

/**
 * Map part of speech từ analysis sang vocabulary type
 */
function mapPartOfSpeech(pos?: string | null): VocabularyWordInsert['part_of_speech'] {
  if (!pos) return null;
  
  const normalizedPos = pos.toLowerCase().trim();
  
  switch (normalizedPos) {
    case 'noun':
    case 'n':
    case 'n.':
      return 'noun';
    case 'verb':
    case 'v':
    case 'v.':
      return 'verb';
    case 'adjective':
    case 'adj':
    case 'adj.':
    case 'adjective':
      return 'adjective';
    case 'adverb':
    case 'adv':
    case 'adv.':
      return 'adverb';
    case 'pronoun':
    case 'pron':
    case 'pron.':
      return 'pronoun';
    case 'preposition':
    case 'prep':
    case 'prep.':
      return 'preposition';
    case 'conjunction':
    case 'conj':
    case 'conj.':
      return 'conjunction';
    case 'interjection':
    case 'interj':
    case 'interj.':
      return 'interjection';
    case 'determiner':
    case 'det':
    case 'det.':
      return 'determiner';
    case 'exclamation':
    case 'excl':
    case 'excl.':
      return 'exclamation';
    default: return null;
  }
}

/**
 * Map từ WordAnalysis sang vocabulary data
 */
export function mapWordAnalysisToVocabulary(wordAnalysis: WordAnalysis): MappedVocabularyData {
  const { meta, definitions, usage } = wordAnalysis;
  
  const vocabularyData: MappedVocabularyData = {
    word: meta.word,
    content_type: 'word', // Default content type cho word analysis
    ipa: meta.ipa || null,
    part_of_speech: mapPartOfSpeech(meta.pos),
    cefr_level: meta.cefr as VocabularyWordInsert['cefr_level'] || null,
    difficulty_level: mapCefrToDifficulty(meta.cefr),
    definition_en: definitions.root_meaning || null,
    definition_vi: definitions.vietnamese_translation || null,
    vietnamese_translation: definitions.vietnamese_translation || null,
    example_sentence: usage.example_sentence || null,
    example_translation: usage.example_translation || null,
    context_notes: definitions.context_meaning || null,
    source_type: 'analysis',
    source_reference: `word-analysis-${meta.word}-${Date.now()}`,
    status: 'active',
    mastery_level: 0, // Default cho từ mới
    review_count: 0,
    correct_count: 0,
  };
  
  return vocabularyData;
}

/**
 * Map từ SentenceAnalysis sang vocabulary data (chỉ lấy từ khóa quan trọng)
 * Hàm này sẽ trích xuất các từ khóa quan trọng từ sentence analysis
 * và tạo vocabulary data cho chúng nếu có thông tin đủ
 */
export function mapSentenceAnalysisToVocabulary(sentenceAnalysis: SentenceAnalysis): MappedVocabularyData[] {
  const vocabularyDataList: MappedVocabularyData[] = [];
  
  // Trích xuất từ khóa từ key_components
  if (sentenceAnalysis.key_components && sentenceAnalysis.key_components.length > 0) {
    sentenceAnalysis.key_components.forEach((component, index) => {
      // Chỉ xử lý nếu component có type là "word" hoặc "vocabulary"
      if (component.type && ['word', 'vocabulary', 'keyword'].includes(component.type.toLowerCase())) {
        const word = component.phrase.trim();
        
        // Bỏ qua nếu word rỗng hoặc quá dài (có thể là cụm từ)
        if (!word || word.length > 50 || word.includes(' ')) {
          return;
        }
        
        const vocabularyData: MappedVocabularyData = {
          word: word,
          content_type: 'word', // Default content type
          ipa: null, // Không có trong sentence analysis
          part_of_speech: null, // Không có trong sentence analysis
          cefr_level: null,
          difficulty_level: 2, // Default difficulty
          definition_en: component.meaning || null,
          definition_vi: null, // Không có trong sentence analysis
          vietnamese_translation: null,
          example_sentence: sentenceAnalysis.meta.sentence || null,
          example_translation: sentenceAnalysis.translation.natural || null,
          context_notes: component.significance || null,
          source_type: 'analysis',
          source_reference: `sentence-analysis-${index}-${Date.now()}`,
          status: 'active',
          mastery_level: 0,
          review_count: 0,
          correct_count: 0,
        };
        
        vocabularyDataList.push(vocabularyData);
      }
    });
  }
  
  return vocabularyDataList;
}

/**
 * Validate vocabulary data trước khi thêm vào vocabulary
 */
export function validateVocabularyData(vocabularyData: VocabularyWordInsert): ValidationResult {
  const errors: string[] = [];
  
  // Validate required fields
  if (!vocabularyData.word || vocabularyData.word.trim() === '') {
    errors.push('Word là required và không được rỗng');
  }
  
  if (!vocabularyData.definition_en || vocabularyData.definition_en.trim() === '') {
    errors.push('Definition (English) là required và không được rỗng');
  }
  
  // Validate difficulty level range
  if (vocabularyData.difficulty_level !== undefined) {
    if (typeof vocabularyData.difficulty_level !== 'number' || 
        vocabularyData.difficulty_level < 1 || 
        vocabularyData.difficulty_level > 4) {
      errors.push('Difficulty level phải là số trong range 1-4');
    }
  }
  
  // Validate word length
  if (vocabularyData.word && vocabularyData.word.length > 100) {
    errors.push('Word không được dài quá 100 ký tự');
  }
  
  // Validate definition length
  if (vocabularyData.definition_en && vocabularyData.definition_en.length > 1000) {
    errors.push('Definition (English) không được dài quá 1000 ký tự');
  }
  
  if (vocabularyData.definition_vi && vocabularyData.definition_vi.length > 1000) {
    errors.push('Definition (Vietnamese) không được dài quá 1000 ký tự');
  }
  
  // Validate CEFR level if provided
  if (vocabularyData.cefr_level) {
    const validCefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validCefrLevels.includes(vocabularyData.cefr_level)) {
      errors.push('CEFR level phải là một trong các giá trị: A1, A2, B1, B2, C1, C2');
    }
  }
  
  // Validate part of speech if provided
  if (vocabularyData.part_of_speech) {
    const validPos = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'determiner', 'exclamation'];
    if (!validPos.includes(vocabularyData.part_of_speech)) {
      errors.push('Part of speech phải là một trong các giá trị hợp lệ');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function để extract words từ text và map sang vocabulary data
 * Hàm này hữu ích khi cần trích xuất từ từ một đoạn văn bản
 */
export function extractWordsFromText(text: string, options?: {
  minLength?: number;
  maxLength?: number;
  excludeCommonWords?: boolean;
}): string[] {
  const {
    minLength = 2,
    maxLength = 20,
    excludeCommonWords = true
  } = options || {};
  
  // Common words to exclude
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);
  
  // Extract words using regex
  const words = text.match(/\b[a-zA-Z]+\b/g) || [];
  
  return words
    .filter(word => {
      const lowerWord = word.toLowerCase();
      return word.length >= minLength && 
             word.length <= maxLength && 
             (!excludeCommonWords || !commonWords.has(lowerWord));
    })
    .map(word => word.toLowerCase());
}

/**
 * Helper function để tạo vocabulary data từ word và context
 */
export function createVocabularyFromWord(
  word: string, 
  context?: {
    definition?: string;
    example?: string;
    translation?: string;
    cefr?: string;
    partOfSpeech?: string;
  }
): MappedVocabularyData {
  return {
    word: word.trim(),
    content_type: 'word', // Default content type
    ipa: null,
    part_of_speech: context?.partOfSpeech ? mapPartOfSpeech(context.partOfSpeech) : null,
    cefr_level: context?.cefr as VocabularyWordInsert['cefr_level'] || null,
    difficulty_level: mapCefrToDifficulty(context?.cefr || null),
    definition_en: context?.definition || null,
    definition_vi: context?.translation || null,
    vietnamese_translation: context?.translation || null,
    example_sentence: context?.example || null,
    example_translation: null,
    context_notes: null,
    source_type: 'manual',
    source_reference: `manual-${word}-${Date.now()}`,
    status: 'active',
    mastery_level: 0,
    review_count: 0,
    correct_count: 0,
  };
}