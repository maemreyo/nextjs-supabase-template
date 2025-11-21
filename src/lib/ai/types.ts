// Core AI Types and Interfaces

export interface AIProvider {
  name: string
  generateText(params: GenerateTextParams): Promise<GenerateTextResponse>
  generateEmbedding(params: GenerateEmbeddingParams): Promise<GenerateEmbeddingResponse>
  getModels(): Promise<AIModel[]>
  validateApiKey(apiKey: string): Promise<boolean>
}

export interface AIModel {
  id: string
  name: string
  provider: string
  type: 'text' | 'embedding' | 'image' | 'audio' | 'multimodal'
  maxTokens: number
  costPerToken: number
  costPerRequest: number
  capabilities: string[]
}

export interface GenerateTextParams {
  prompt: string
  model?: string
  maxTokens?: number
  temperature?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
  systemPrompt?: string
  conversationHistory?: Message[]
  metadata?: Record<string, any>
}

export interface GenerateTextResponse {
  text: string
  model: string
  provider: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost: number
  metadata?: Record<string, any>
  finishReason?: 'stop' | 'length' | 'content_filter'
}

export interface GenerateEmbeddingParams {
  input: string | string[]
  model?: string
  metadata?: Record<string, any>
}

export interface GenerateEmbeddingResponse {
  embeddings: number[][]
  model: string
  provider: string
  usage: {
    promptTokens: number
    totalTokens: number
  }
  cost: number
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface AIUsageLog {
  id: string
  userId: string
  provider: string
  model: string
  operation: 'text-generation' | 'embedding' | 'image-generation' | 'other'
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  timestamp: Date
  duration: number
  success: boolean
  error?: string
  metadata: Record<string, any>
}

export interface AIUsageStats {
  totalRequests: number
  totalTokens: number
  totalCost: number
  averageResponseTime: number
  successRate: number
  requestsByProvider: Record<string, number>
  requestsByModel: Record<string, number>
  costByProvider: Record<string, number>
  dailyUsage: DailyUsage[]
}

export interface DailyUsage {
  date: string
  requests: number
  tokens: number
  cost: number
}

export interface UserTier {
  id: string
  name: string
  maxRequestsPerDay: number
  maxTokensPerDay: number
  maxCostPerDay: number
  features: string[]
  rateLimitPerMinute: number
  rateLimitPerHour: number
}

export interface AIProviderConfig {
  apiKey: string
  baseURL?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
  maxConcurrency?: number
}

export interface AIError extends Error {
  code: string
  provider: string
  statusCode?: number
  isRetryable: boolean
  metadata?: Record<string, any>
}

export interface UsageTrackingConfig {
  enabled: boolean
  realTimeUpdates: boolean
  batchSize: number
  flushInterval: number
  retentionDays: number
}

export interface CacheConfig {
  enabled: boolean
  ttl: number
  maxSize: number
  strategy: 'lru' | 'fifo' | 'lfu'
}

export interface RateLimitConfig {
  enabled: boolean
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  tokensPerDay: number
  costPerDay: number
}

export interface AIServiceConfig {
  defaultProvider: string
  defaultModel: string
  providers: Record<string, AIProviderConfig>
  usageTracking: UsageTrackingConfig
  cache: CacheConfig
  rateLimit: RateLimitConfig
  fallbackProviders: string[]
  errorReporting: boolean
}

// Provider-specific types
export interface OpenAIConfig extends AIProviderConfig {
  organization?: string
}

export interface AnthropicConfig extends AIProviderConfig {
  version?: string
}

export interface GoogleAIConfig extends AIProviderConfig {
  projectId?: string
  location?: string
}

export interface CohereConfig extends AIProviderConfig {
  clientName?: string
}

// Response types for API routes
export interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: Record<string, any>
}

export interface UsageCheckResponse {
  canUseAI: boolean
  remainingRequests: number
  remainingTokens: number
  remainingCost: number
  resetTime: Date
  tier: UserTier
  usage: AIUsageStats
}

// Event types for real-time updates
export interface AIUsageEvent {
  type: 'usage_update' | 'limit_reached' | 'error'
  userId: string
  data: any
  timestamp: Date
}

export interface ProviderPerformanceEvent {
  type: 'performance_update'
  provider: string
  model: string
  metrics: {
    averageResponseTime: number
    successRate: number
    errorRate: number
    totalRequests: number
  }
  timestamp: Date
}

// Semantic Analysis Types
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

export interface SentenceAnalysis {
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

export interface ParagraphAnalysis {
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

// Analysis Request/Response Types
export interface AnalyzeWordRequest {
  word: string;
  sentenceContext: string;
  paragraphContext?: string;
  maxItems?: number;
}

export interface AnalyzeSentenceRequest {
  sentence: string;
  paragraphContext?: string;
}

export interface AnalyzeParagraphRequest {
  paragraph: string;
}

export interface AnalysisResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    processingTime: number;
    tokensUsed: number;
    cost: number;
    model: string;
    provider: string;
  };
}

// Database Integration Types
export interface WordAnalysisDB {
  id: string;
  word: string;
  ipa: string | null;
  pos: string | null;
  cefr: string | null;
  tone: string | null;
  root_meaning: string | null;
  context_meaning: string | null;
  vietnamese_translation: string | null;
  inference_clues: string | null;
  inference_reasoning: string | null;
  sentence_context: string | null;
  paragraph_context: string | null;
  example_sentence: string | null;
  example_translation: string | null;
  user_id: string | null;
  document_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SentenceAnalysisDB {
  id: string;
  sentence: string;
  complexity_level: string | null;
  sentence_type: string | null;
  main_idea: string | null;
  subtext: string | null;
  sentiment: string | null;
  subject: string | null;
  main_verb: string | null;
  object: string | null;
  function: string | null;
  relation_to_previous: string | null;
  literal_translation: string | null;
  natural_translation: string | null;
  paragraph_context: string | null;
  user_id: string | null;
  document_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ParagraphAnalysisDB {
  id: string;
  paragraph: string;
  type: string | null;
  tone: string | null;
  target_audience: string | null;
  main_topic: string | null;
  sentiment_label: string | null;
  sentiment_intensity: number | null;
  sentiment_justification: string | null;
  keywords: string[] | null;
  logic_score: number | null;
  flow_score: number | null;
  transition_words: string[] | null;
  gap_analysis: string | null;
  vocabulary_level: string | null;
  sentence_variety: string | null;
  better_version: string | null;
  user_id: string | null;
  document_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}