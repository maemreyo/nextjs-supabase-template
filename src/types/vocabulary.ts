// Base types for vocabulary system
export interface VocabularyWord {
  id: string;
  user_id: string;
  word: string;
  ipa?: string | null;
  part_of_speech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection' | 'determiner' | 'exclamation' | null;
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null;
  difficulty_level: number;
  definition_en?: string | null;
  definition_vi?: string | null;
  vietnamese_translation?: string | null;
  example_sentence?: string | null;
  example_translation?: string | null;
  context_notes?: string | null;
  mastery_level: number;
  review_count: number;
  correct_count: number;
  last_reviewed_at?: string | null;
  next_review_at?: string | null;
  origin?: string | null;
  etymology?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  personal_notes?: string | null;
  source_type: 'manual' | 'analysis' | 'import' | 'suggestion';
  source_reference?: string | null;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface VocabularyWordInsert {
  user_id?: string;
  word: string;
  ipa?: string | null;
  part_of_speech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection' | 'determiner' | 'exclamation' | null;
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null;
  difficulty_level?: number;
  definition_en?: string | null;
  definition_vi?: string | null;
  vietnamese_translation?: string | null;
  example_sentence?: string | null;
  example_translation?: string | null;
  context_notes?: string | null;
  mastery_level?: number;
  review_count?: number;
  correct_count?: number;
  last_reviewed_at?: string | null;
  next_review_at?: string | null;
  origin?: string | null;
  etymology?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  personal_notes?: string | null;
  source_type?: 'manual' | 'analysis' | 'import' | 'suggestion';
  source_reference?: string | null;
  status?: 'active' | 'archived' | 'deleted';
}

export interface VocabularyWordUpdate {
  word?: string;
  ipa?: string | null;
  part_of_speech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection' | 'determiner' | 'exclamation' | null;
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null;
  difficulty_level?: number;
  definition_en?: string | null;
  definition_vi?: string | null;
  vietnamese_translation?: string | null;
  example_sentence?: string | null;
  example_translation?: string | null;
  context_notes?: string | null;
  mastery_level?: number;
  review_count?: number;
  correct_count?: number;
  last_reviewed_at?: string | null;
  next_review_at?: string | null;
  origin?: string | null;
  etymology?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  personal_notes?: string | null;
  source_type?: 'manual' | 'analysis' | 'import' | 'suggestion';
  source_reference?: string | null;
  status?: 'active' | 'archived' | 'deleted';
}

export interface VocabularyContext {
  id: string;
  vocabulary_word_id: string;
  user_id: string;
  context_type: 'sentence' | 'paragraph' | 'dialogue' | 'book' | 'article' | 'movie' | 'conversation';
  context_text: string;
  source_title?: string | null;
  source_author?: string | null;
  source_url?: string | null;
  source_page_number?: number | null;
  context_translation?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VocabularyContextInsert {
  vocabulary_word_id: string;
  user_id?: string;
  context_type: 'sentence' | 'paragraph' | 'dialogue' | 'book' | 'article' | 'movie' | 'conversation';
  context_text: string;
  source_title?: string | null;
  source_author?: string | null;
  source_url?: string | null;
  source_page_number?: number | null;
  context_translation?: string | null;
  notes?: string | null;
}

export interface VocabularyContextUpdate {
  context_type?: 'sentence' | 'paragraph' | 'dialogue' | 'book' | 'article' | 'movie' | 'conversation';
  context_text?: string;
  source_title?: string | null;
  source_author?: string | null;
  source_url?: string | null;
  source_page_number?: number | null;
  context_translation?: string | null;
  notes?: string | null;
}

export interface VocabularyCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  collection_type: 'custom' | 'topic' | 'difficulty' | 'cefr_level' | 'frequency';
  color: string;
  icon: string;
  is_public: boolean;
  is_default: boolean;
  practice_enabled: boolean;
  review_interval_days: number;
  status: 'active' | 'archived' | 'deleted';
  word_count: number;
  mastered_count: number;
  created_at: string;
  updated_at: string;
}

export interface VocabularyCollectionInsert {
  user_id?: string;
  name: string;
  description?: string | null;
  collection_type?: 'custom' | 'topic' | 'difficulty' | 'cefr_level' | 'frequency';
  color?: string;
  icon?: string;
  is_public?: boolean;
  is_default?: boolean;
  practice_enabled?: boolean;
  review_interval_days?: number;
  status?: 'active' | 'archived' | 'deleted';
  word_count?: number;
  mastered_count?: number;
}

export interface VocabularyCollectionUpdate {
  name?: string;
  description?: string | null;
  collection_type?: 'custom' | 'topic' | 'difficulty' | 'cefr_level' | 'frequency';
  color?: string;
  icon?: string;
  is_public?: boolean;
  is_default?: boolean;
  practice_enabled?: boolean;
  review_interval_days?: number;
  status?: 'active' | 'archived' | 'deleted';
  word_count?: number;
  mastered_count?: number;
}

export interface VocabularyWordCollection {
  id: string;
  vocabulary_word_id: string;
  collection_id: string;
  user_id: string;
  added_at: string;
  added_manually: boolean;
}

export interface VocabularyWordCollectionInsert {
  vocabulary_word_id: string;
  collection_id: string;
  user_id?: string;
  added_manually?: boolean;
}

export interface VocabularySynonym {
  id: string;
  vocabulary_word_id: string;
  user_id: string;
  synonym_word: string;
  synonym_ipa?: string | null;
  synonym_definition?: string | null;
  synonym_translation?: string | null;
  context_difference?: string | null;
  frequency_level?: 'very_common' | 'common' | 'uncommon' | 'rare' | null;
  created_at: string;
  updated_at: string;
}

export interface VocabularySynonymInsert {
  vocabulary_word_id: string;
  user_id?: string;
  synonym_word: string;
  synonym_ipa?: string | null;
  synonym_definition?: string | null;
  synonym_translation?: string | null;
  context_difference?: string | null;
  frequency_level?: 'very_common' | 'common' | 'uncommon' | 'rare' | null;
}

export interface VocabularySynonymUpdate {
  synonym_word?: string;
  synonym_ipa?: string | null;
  synonym_definition?: string | null;
  synonym_translation?: string | null;
  context_difference?: string | null;
  frequency_level?: 'very_common' | 'common' | 'uncommon' | 'rare' | null;
}

export interface VocabularyAntonym {
  id: string;
  vocabulary_word_id: string;
  user_id: string;
  antonym_word: string;
  antonym_ipa?: string | null;
  antonym_definition?: string | null;
  antonym_translation?: string | null;
  context_explanation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VocabularyAntonymInsert {
  vocabulary_word_id: string;
  user_id?: string;
  antonym_word: string;
  antonym_ipa?: string | null;
  antonym_definition?: string | null;
  antonym_translation?: string | null;
  context_explanation?: string | null;
}

export interface VocabularyAntonymUpdate {
  antonym_word?: string;
  antonym_ipa?: string | null;
  antonym_definition?: string | null;
  antonym_translation?: string | null;
  context_explanation?: string | null;
}

export interface VocabularyCollocation {
  id: string;
  vocabulary_word_id: string;
  user_id: string;
  phrase: string;
  collocation_type?: 'adjective + noun' | 'noun + noun' | 'verb + noun' | 'adverb + adjective' | 'verb + adverb' | 'preposition + noun' | null;
  meaning?: string | null;
  usage_example?: string | null;
  usage_translation?: string | null;
  frequency_level?: 'very_common' | 'common' | 'uncommon' | 'rare' | null;
  register_level?: 'formal' | 'neutral' | 'informal' | 'slang' | null;
  created_at: string;
  updated_at: string;
}

export interface VocabularyCollocationInsert {
  vocabulary_word_id: string;
  user_id?: string;
  phrase: string;
  collocation_type?: 'adjective + noun' | 'noun + noun' | 'verb + noun' | 'adverb + adjective' | 'verb + adverb' | 'preposition + noun' | null;
  meaning?: string | null;
  usage_example?: string | null;
  usage_translation?: string | null;
  frequency_level?: 'very_common' | 'common' | 'uncommon' | 'rare' | null;
  register_level?: 'formal' | 'neutral' | 'informal' | 'slang' | null;
}

export interface VocabularyCollocationUpdate {
  phrase?: string;
  collocation_type?: 'adjective + noun' | 'noun + noun' | 'verb + noun' | 'adverb + adjective' | 'verb + adverb' | 'preposition + noun' | null;
  meaning?: string | null;
  usage_example?: string | null;
  usage_translation?: string | null;
  frequency_level?: 'very_common' | 'common' | 'uncommon' | 'rare' | null;
  register_level?: 'formal' | 'neutral' | 'informal' | 'slang' | null;
}

export interface VocabularyPracticeSession {
  id: string;
  user_id: string;
  session_type: 'flashcard' | 'quiz' | 'spelling' | 'matching' | 'writing';
  collection_id?: string | null;
  word_count: number;
  time_limit_seconds?: number | null;
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'mixed' | null;
  total_questions: number;
  correct_answers: number;
  accuracy_percentage?: number | null;
  time_spent_seconds?: number | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string | null;
  created_at: string;
}

export interface VocabularyPracticeSessionInsert {
  user_id?: string;
  session_type: 'flashcard' | 'quiz' | 'spelling' | 'matching' | 'writing';
  collection_id?: string | null;
  word_count: number;
  time_limit_seconds?: number | null;
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'mixed' | null;
  total_questions?: number;
  correct_answers?: number;
  accuracy_percentage?: number | null;
  time_spent_seconds?: number | null;
  status?: 'in_progress' | 'completed' | 'abandoned';
  started_at?: string;
  completed_at?: string | null;
}

export interface VocabularyPracticeResult {
  id: string;
  practice_session_id: string;
  vocabulary_word_id: string;
  user_id: string;
  question_type: string;
  question_text: string;
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
  response_time_ms?: number | null;
  mastery_before?: number | null;
  mastery_after?: number | null;
  created_at: string;
}

export interface VocabularyPracticeResultInsert {
  practice_session_id: string;
  vocabulary_word_id: string;
  user_id?: string;
  question_type: string;
  question_text: string;
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
  response_time_ms?: number | null;
  mastery_before?: number | null;
  mastery_after?: number | null;
}

// View types
export interface WordsForReview {
  id: string;
  user_id: string;
  word: string;
  ipa?: string | null;
  part_of_speech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection' | 'determiner' | 'exclamation' | null;
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null;
  difficulty_level: number;
  definition_en?: string | null;
  definition_vi?: string | null;
  vietnamese_translation?: string | null;
  example_sentence?: string | null;
  example_translation?: string | null;
  context_notes?: string | null;
  mastery_level: number;
  review_count: number;
  correct_count: number;
  last_reviewed_at?: string | null;
  next_review_at?: string | null;
  origin?: string | null;
  etymology?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  personal_notes?: string | null;
  source_type: 'manual' | 'analysis' | 'import' | 'suggestion';
  source_reference?: string | null;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
  collection_name?: string | null;
}

export interface VocabularyStatistics {
  user_id: string;
  total_words: number;
  mastered_words: number;
  learning_words: number;
  new_words: number;
  average_mastery: number;
  words_for_review: number;
  cefr_levels_covered: number;
}

export interface CollectionDetails {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  collection_type: 'custom' | 'topic' | 'difficulty' | 'cefr_level' | 'frequency';
  color: string;
  icon: string;
  is_public: boolean;
  is_default: boolean;
  practice_enabled: boolean;
  review_interval_days: number;
  status: 'active' | 'archived' | 'deleted';
  word_count: number;
  mastered_count: number;
  created_at: string;
  updated_at: string;
  actual_word_count: number;
  actual_mastered_count: number;
  learning_count: number;
  new_count: number;
  average_mastery: number;
}

// Extended types with additional computed properties
export interface VocabularyWordWithDetails extends VocabularyWord {
  contexts?: VocabularyContext[];
  synonyms?: VocabularySynonym[];
  antonyms?: VocabularyAntonym[];
  collocations?: VocabularyCollocation[];
  collections?: VocabularyCollection[];
  is_due_for_review?: boolean;
  days_since_last_review?: number;
}

export interface VocabularyCollectionWithWords extends VocabularyCollection {
  words?: VocabularyWordWithDetails[];
  average_mastery?: number;
  words_for_review?: number;
}

// Store state types
export interface VocabularyState {
  words: VocabularyWord[];
  collections: VocabularyCollection[];
  currentWord: VocabularyWord | null;
  currentCollection: VocabularyCollection | null;
  practiceSessions: VocabularyPracticeSession[];
  practiceResults: VocabularyPracticeResult[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  wordsPage: number;
  wordsPerPage: number;
  totalWords: number;
  collectionsPage: number;
  collectionsPerPage: number;
  totalCollections: number;
  
  // Filters
  statusFilter: 'all' | 'active' | 'archived' | 'deleted';
  cefrFilter: 'all' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  masteryFilter: 'all' | 'new' | 'learning' | 'mastered';
  searchQuery: string;
  collectionFilter: string | null;
  
  // Practice state
  currentPracticeSession: VocabularyPracticeSession | null;
  practiceMode: 'flashcard' | 'quiz' | 'spelling' | 'matching' | 'writing' | null;
  isPracticing: boolean;
}

export interface VocabularyActions {
  // Word CRUD
  createWord: (word: VocabularyWordInsert) => Promise<VocabularyWord>;
  updateWord: (id: string, updates: VocabularyWordUpdate) => Promise<VocabularyWord>;
  deleteWord: (id: string) => Promise<void>;
  archiveWord: (id: string) => Promise<void>;
  restoreWord: (id: string) => Promise<void>;
  
  // Word management
  setCurrentWord: (word: VocabularyWord | null) => void;
  loadWords: (filters?: VocabularyFilters) => Promise<void>;
  loadWord: (id: string) => Promise<VocabularyWord>;
  refreshWords: () => Promise<void>;
  searchWords: (query: string) => Promise<VocabularyWord[]>;
  
  // Collection CRUD
  createCollection: (collection: VocabularyCollectionInsert) => Promise<VocabularyCollection>;
  updateCollection: (id: string, updates: VocabularyCollectionUpdate) => Promise<VocabularyCollection>;
  deleteCollection: (id: string) => Promise<void>;
  archiveCollection: (id: string) => Promise<void>;
  restoreCollection: (id: string) => Promise<void>;
  
  // Collection management
  setCurrentCollection: (collection: VocabularyCollection | null) => void;
  loadCollections: () => Promise<void>;
  loadCollection: (id: string) => Promise<VocabularyCollection>;
  refreshCollections: () => Promise<void>;
  
  // Word-Collection relationships
  addWordToCollection: (wordId: string, collectionId: string) => Promise<void>;
  removeWordFromCollection: (wordId: string, collectionId: string) => Promise<void>;
  moveWordBetweenCollections: (wordId: string, fromCollectionId: string, toCollectionId: string) => Promise<void>;
  
  // Word details
  addContext: (wordId: string, context: VocabularyContextInsert) => Promise<VocabularyContext>;
  updateContext: (id: string, updates: VocabularyContextUpdate) => Promise<VocabularyContext>;
  deleteContext: (id: string) => Promise<void>;
  
  addSynonym: (wordId: string, synonym: VocabularySynonymInsert) => Promise<VocabularySynonym>;
  updateSynonym: (id: string, updates: VocabularySynonymUpdate) => Promise<VocabularySynonym>;
  deleteSynonym: (id: string) => Promise<void>;
  
  addAntonym: (wordId: string, antonym: VocabularyAntonymInsert) => Promise<VocabularyAntonym>;
  updateAntonym: (id: string, updates: VocabularyAntonymUpdate) => Promise<VocabularyAntonym>;
  deleteAntonym: (id: string) => Promise<void>;
  
  addCollocation: (wordId: string, collocation: VocabularyCollocationInsert) => Promise<VocabularyCollocation>;
  updateCollocation: (id: string, updates: VocabularyCollocationUpdate) => Promise<VocabularyCollocation>;
  deleteCollocation: (id: string) => Promise<void>;
  
  // Practice
  startPracticeSession: (collectionId?: string, sessionType?: VocabularyPracticeSessionInsert['session_type']) => Promise<VocabularyPracticeSession>;
  completePracticeSession: (sessionId: string, results: VocabularyPracticeResultInsert[]) => Promise<void>;
  abandonPracticeSession: (sessionId: string) => Promise<void>;
  loadPracticeSessions: () => Promise<void>;
  loadPracticeResults: (sessionId: string) => Promise<void>;
  
  // Review
  markWordAsReviewed: (wordId: string, isCorrect: boolean) => Promise<void>;
  getWordsForReview: (limit?: number) => Promise<VocabularyWord[]>;
  
  // UI state
  setStatusFilter: (filter: VocabularyState['statusFilter']) => void;
  setCefrFilter: (filter: VocabularyState['cefrFilter']) => void;
  setMasteryFilter: (filter: VocabularyState['masteryFilter']) => void;
  setSearchQuery: (query: string) => void;
  setCollectionFilter: (collectionId: string | null) => void;
  setWordsPage: (page: number) => void;
  setCollectionsPage: (page: number) => void;
  clearError: () => void;
  reset: () => void;
}

// Filter and search types
export interface VocabularyFilters {
  status?: VocabularyState['statusFilter'];
  cefr?: VocabularyState['cefrFilter'];
  mastery?: VocabularyState['masteryFilter'];
  search?: string;
  collection?: string | null;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  difficulty?: {
    min: number;
    max: number;
  };
}

// API request/response types
export interface CreateWordRequest {
  word: string;
  ipa?: string;
  part_of_speech?: VocabularyWordInsert['part_of_speech'];
  cefr_level?: VocabularyWordInsert['cefr_level'];
  difficulty_level?: number;
  definition_en?: string;
  definition_vi?: string;
  vietnamese_translation?: string;
  example_sentence?: string;
  example_translation?: string;
  context_notes?: string;
  origin?: string;
  etymology?: string;
  audio_url?: string;
  image_url?: string;
  personal_notes?: string;
  source_type?: VocabularyWordInsert['source_type'];
  source_reference?: string;
  collection_ids?: string[];
}

export interface UpdateWordRequest {
  word?: string;
  ipa?: string;
  part_of_speech?: VocabularyWordUpdate['part_of_speech'];
  cefr_level?: VocabularyWordUpdate['cefr_level'];
  difficulty_level?: number;
  definition_en?: string;
  definition_vi?: string;
  vietnamese_translation?: string;
  example_sentence?: string;
  example_translation?: string;
  context_notes?: string;
  origin?: string;
  etymology?: string;
  audio_url?: string;
  image_url?: string;
  personal_notes?: string;
  collection_ids?: string[];
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  collection_type?: VocabularyCollectionInsert['collection_type'];
  color?: string;
  icon?: string;
  is_public?: boolean;
  practice_enabled?: boolean;
  review_interval_days?: number;
  word_ids?: string[];
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  collection_type?: VocabularyCollectionUpdate['collection_type'];
  color?: string;
  icon?: string;
  is_public?: boolean;
  practice_enabled?: boolean;
  review_interval_days?: number;
}

export interface PracticeSessionRequest {
  session_type: VocabularyPracticeSessionInsert['session_type'];
  collection_id?: string;
  word_count?: number;
  time_limit_seconds?: number;
  difficulty_level?: VocabularyPracticeSessionInsert['difficulty_level'];
}

export interface WordResponse {
  word: VocabularyWordWithDetails;
}

export interface WordsListResponse {
  words: VocabularyWordWithDetails[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface CollectionsListResponse {
  collections: VocabularyCollectionWithWords[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Component props types
export interface VocabularyListProps {
  words?: VocabularyWordWithDetails[];
  onWordSelect?: (word: VocabularyWord) => void;
  onWordEdit?: (word: VocabularyWord) => void;
  onWordDelete?: (wordId: string) => void;
  onWordArchive?: (wordId: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  showFilters?: boolean;
  compact?: boolean;
}

export interface VocabularyCardProps {
  word: VocabularyWordWithDetails;
  onEdit?: (word: VocabularyWord) => void;
  onDelete?: (wordId: string) => void;
  onArchive?: (wordId: string) => void;
  onSelect?: (word: VocabularyWord) => void;
  onPractice?: (word: VocabularyWord) => void;
  isSelected?: boolean;
  showActions?: boolean;
  compact?: boolean;
  showMastery?: boolean;
}

export interface VocabularyFormProps {
  word?: VocabularyWord;
  onSubmit: (data: CreateWordRequest | UpdateWordRequest) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

export interface CollectionFormProps {
  collection?: VocabularyCollection;
  onSubmit: (data: CreateCollectionRequest | UpdateCollectionRequest) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

// Hook return types
export interface UseVocabularyReturn {
  words: VocabularyWord[];
  currentWord: VocabularyWord | null;
  isLoading: boolean;
  error: string | null;
  createWord: (data: CreateWordRequest) => Promise<VocabularyWord>;
  updateWord: (id: string, data: UpdateWordRequest) => Promise<VocabularyWord>;
  deleteWord: (id: string) => Promise<void>;
  archiveWord: (id: string) => Promise<void>;
  restoreWord: (id: string) => Promise<void>;
  loadWords: (filters?: VocabularyFilters) => Promise<void>;
  setCurrentWord: (word: VocabularyWord | null) => void;
  refreshWords: () => Promise<void>;
  searchWords: (query: string) => Promise<VocabularyWord[]>;
}

export interface UseVocabularyCollectionsReturn {
  collections: VocabularyCollection[];
  currentCollection: VocabularyCollection | null;
  isLoading: boolean;
  error: string | null;
  createCollection: (data: CreateCollectionRequest) => Promise<VocabularyCollection>;
  updateCollection: (id: string, data: UpdateCollectionRequest) => Promise<VocabularyCollection>;
  deleteCollection: (id: string) => Promise<void>;
  archiveCollection: (id: string) => Promise<void>;
  restoreCollection: (id: string) => Promise<void>;
  loadCollections: () => Promise<void>;
  setCurrentCollection: (collection: VocabularyCollection | null) => void;
  refreshCollections: () => Promise<void>;
}

export interface UseVocabularyPracticeReturn {
  practiceSessions: VocabularyPracticeSession[];
  currentPracticeSession: VocabularyPracticeSession | null;
  practiceResults: VocabularyPracticeResult[];
  isLoading: boolean;
  error: string | null;
  isPracticing: boolean;
  startPracticeSession: (data: PracticeSessionRequest) => Promise<VocabularyPracticeSession>;
  completePracticeSession: (sessionId: string, results: VocabularyPracticeResultInsert[]) => Promise<void>;
  abandonPracticeSession: (sessionId: string) => Promise<void>;
  loadPracticeSessions: () => Promise<void>;
  loadPracticeResults: (sessionId: string) => Promise<void>;
  markWordAsReviewed: (wordId: string, isCorrect: boolean) => Promise<void>;
  getWordsForReview: (limit?: number) => Promise<VocabularyWord[]>;
}

// Utility types
export type PartOfSpeech = VocabularyWordInsert['part_of_speech'];
export type CefrLevel = VocabularyWordInsert['cefr_level'];
export type WordStatus = VocabularyWordInsert['status'];
export type SourceType = VocabularyWordInsert['source_type'];
export type CollectionType = VocabularyCollectionInsert['collection_type'];
export type PracticeSessionType = VocabularyPracticeSessionInsert['session_type'];
export type DifficultyLevel = VocabularyPracticeSessionInsert['difficulty_level'];

export interface VocabularyStatistics {
  totalWords: number;
  activeWords: number;
  archivedWords: number;
  totalCollections: number;
  publicCollections: number;
  privateCollections: number;
  averageMasteryLevel: number;
  wordsForReview: number;
  masteredWords: number;
  learningWords: number;
  newWords: number;
  mostRecentWord?: VocabularyWord;
  mostPracticedCollection?: VocabularyCollection;
  practiceSessionsCompleted: number;
  averageAccuracy: number;
}

// Error types
export interface VocabularyError {
  code: 'WORD_NOT_FOUND' | 'WORD_CREATE_FAILED' | 'WORD_UPDATE_FAILED' | 'WORD_DELETE_FAILED' | 'COLLECTION_NOT_FOUND' | 'COLLECTION_CREATE_FAILED' | 'COLLECTION_UPDATE_FAILED' | 'COLLECTION_DELETE_FAILED' | 'PRACTICE_SESSION_FAILED' | 'REVIEW_FAILED' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
  message: string;
  details?: any;
}