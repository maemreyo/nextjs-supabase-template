// Base types for session management system
export interface AnalysisSession {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  session_type: 'word' | 'sentence' | 'paragraph' | 'mixed';
  status: 'active' | 'archived' | 'deleted';
  total_analyses: number;
  word_analyses_count: number;
  sentence_analyses_count: number;
  paragraph_analyses_count: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
}

export interface AnalysisSessionInsert {
  user_id?: string;
  title: string;
  description?: string | null;
  session_type: 'word' | 'sentence' | 'paragraph' | 'mixed';
  status?: 'active' | 'archived' | 'deleted';
  total_analyses?: number;
  word_analyses_count?: number;
  sentence_analyses_count?: number;
  paragraph_analyses_count?: number;
}

export interface AnalysisSessionUpdate {
  title?: string;
  description?: string | null;
  session_type?: 'word' | 'sentence' | 'paragraph' | 'mixed';
  status?: 'active' | 'archived' | 'deleted';
  total_analyses?: number;
  word_analyses_count?: number;
  sentence_analyses_count?: number;
  paragraph_analyses_count?: number;
  last_accessed_at?: string;
}

export interface SessionAnalysis {
  id: string;
  session_id: string;
  user_id: string;
  analysis_type: 'word' | 'sentence' | 'paragraph';
  analysis_id: string;
  analysis_title?: string | null;
  analysis_summary?: string | null;
  analysis_data?: any;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface SessionAnalysisInsert {
  session_id: string;
  user_id?: string;
  analysis_type: 'word' | 'sentence' | 'paragraph';
  analysis_id: string;
  analysis_title?: string | null;
  analysis_summary?: string | null;
  analysis_data?: any;
  position?: number;
}

export interface SessionAnalysisUpdate {
  analysis_type?: 'word' | 'sentence' | 'paragraph';
  analysis_id?: string;
  analysis_title?: string | null;
  analysis_summary?: string | null;
  analysis_data?: any;
  position?: number;
}

export interface SessionSettings {
  id: string;
  session_id: string;
  user_id: string;
  auto_save: boolean;
  show_summaries: boolean;
  compact_view: boolean;
  preferred_ai_provider?: string | null;
  preferred_ai_model?: string | null;
  analysis_depth: 'basic' | 'standard' | 'detailed';
  default_export_format: 'json' | 'pdf' | 'markdown' | 'csv';
  include_metadata: boolean;
  email_notifications: boolean;
  session_reminders: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionSettingsInsert {
  session_id: string;
  user_id?: string;
  auto_save?: boolean;
  show_summaries?: boolean;
  compact_view?: boolean;
  preferred_ai_provider?: string | null;
  preferred_ai_model?: string | null;
  analysis_depth?: 'basic' | 'standard' | 'detailed';
  default_export_format?: 'json' | 'pdf' | 'markdown' | 'csv';
  include_metadata?: boolean;
  email_notifications?: boolean;
  session_reminders?: boolean;
}

export interface SessionSettingsUpdate {
  auto_save?: boolean;
  show_summaries?: boolean;
  compact_view?: boolean;
  preferred_ai_provider?: string | null;
  preferred_ai_model?: string | null;
  analysis_depth?: 'basic' | 'standard' | 'detailed';
  default_export_format?: 'json' | 'pdf' | 'markdown' | 'csv';
  include_metadata?: boolean;
  email_notifications?: boolean;
  session_reminders?: boolean;
}

export interface SessionTag {
  id: string;
  user_id: string;
  tag_name: string;
  tag_color: string;
  tag_description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionTagInsert {
  user_id?: string;
  tag_name: string;
  tag_color?: string;
  tag_description?: string | null;
}

export interface SessionTagUpdate {
  tag_name?: string;
  tag_color?: string;
  tag_description?: string | null;
}

export interface SessionTagRelation {
  id: string;
  session_id: string;
  tag_id: string;
  created_at: string;
}

export interface SessionTagRelationInsert {
  session_id: string;
  tag_id: string;
}

// View types
export interface SessionSummary {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  session_type: 'word' | 'sentence' | 'paragraph' | 'mixed';
  status: 'active' | 'archived' | 'deleted';
  total_analyses: number;
  word_analyses_count: number;
  sentence_analyses_count: number;
  paragraph_analyses_count: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  actual_analyses_count: number;
  actual_word_count: number;
  actual_sentence_count: number;
  actual_paragraph_count: number;
  tags: string[];
}

export interface RecentAnalyses {
  id: string;
  session_id: string;
  user_id: string;
  analysis_type: 'word' | 'sentence' | 'paragraph';
  analysis_id: string;
  analysis_title?: string | null;
  analysis_summary?: string | null;
  analysis_data?: any;
  position: number;
  created_at: string;
  updated_at: string;
  session_title: string;
  session_type: 'word' | 'sentence' | 'paragraph' | 'mixed';
  session_status: 'active' | 'archived' | 'deleted';
}

// Extended types with additional computed properties
export interface AnalysisSessionWithTags extends AnalysisSession {
  tags: SessionTag[];
  analyses_count?: number;
}

export interface SessionAnalysisWithDetails extends SessionAnalysis {
  word_analysis?: any; // word_analyses type
  sentence_analysis?: any; // sentence_analyses type
  paragraph_analysis?: any; // paragraph_analyses type
}

export interface SessionWithAnalyses extends AnalysisSession {
  analyses: SessionAnalysisWithDetails[];
  settings?: SessionSettings;
  tags: SessionTag[];
}

// Store state types
export interface SessionState {
  sessions: AnalysisSession[];
  currentSession: AnalysisSession | null;
  sessionAnalyses: SessionAnalysis[];
  sessionSettings: SessionSettings | null;
  sessionTags: SessionTag[];
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  sessionsPage: number;
  sessionsPerPage: number;
  totalSessions: number;
  
  // Filters
  statusFilter: 'all' | 'active' | 'archived' | 'deleted';
  typeFilter: 'all' | 'word' | 'sentence' | 'paragraph' | 'mixed';
  searchQuery: string;
}

export interface SessionActions {
  // Session CRUD
  createSession: (session: AnalysisSessionInsert) => Promise<AnalysisSession>;
  updateSession: (id: string, updates: AnalysisSessionUpdate) => Promise<AnalysisSession>;
  deleteSession: (id: string) => Promise<void>;
  archiveSession: (id: string) => Promise<void>;
  restoreSession: (id: string) => Promise<void>;
  
  // Session management
  setCurrentSession: (session: AnalysisSession | null) => void;
  loadSessions: (filters?: SessionFilters) => Promise<void>;
  loadSession: (id: string) => Promise<AnalysisSession>;
  refreshCurrentSession: () => Promise<void>;
  
  // Session analyses
  addAnalysisToSession: (sessionId: string, analysis: SessionAnalysisInsert) => Promise<SessionAnalysis>;
  removeAnalysisFromSession: (sessionId: string, analysisId: string) => Promise<void>;
  reorderSessionAnalyses: (sessionId: string, analysisIds: string[]) => Promise<void>;
  loadSessionAnalyses: (sessionId: string) => Promise<void>;
  
  // Session settings
  updateSessionSettings: (sessionId: string, settings: Partial<SessionSettingsInsert>) => Promise<SessionSettings>;
  loadSessionSettings: (sessionId: string) => Promise<void>;
  
  // Session tags
  createTag: (tag: SessionTagInsert) => Promise<SessionTag>;
  updateTag: (id: string, updates: SessionTagUpdate) => Promise<SessionTag>;
  deleteTag: (id: string) => Promise<void>;
  addTagToSession: (sessionId: string, tagId: string) => Promise<void>;
  removeTagFromSession: (sessionId: string, tagId: string) => Promise<void>;
  loadSessionTags: () => Promise<void>;
  
  // UI state
  setStatusFilter: (filter: SessionState['statusFilter']) => void;
  setTypeFilter: (filter: SessionState['typeFilter']) => void;
  setSearchQuery: (query: string) => void;
  setSessionsPage: (page: number) => void;
  clearError: () => void;
  reset: () => void;
}

// Filter and search types
export interface SessionFilters {
  status?: SessionState['statusFilter'];
  type?: SessionState['typeFilter'];
  search?: string;
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// API request/response types
export interface CreateSessionRequest {
  title: string;
  description?: string;
  session_type: AnalysisSessionInsert['session_type'];
  tag_ids?: string[];
  settings?: Partial<SessionSettingsInsert>;
}

export interface UpdateSessionRequest {
  title?: string;
  description?: string;
  status?: AnalysisSessionUpdate['status'];
  tag_ids?: string[];
}

export interface AddAnalysisRequest {
  analysis_type: SessionAnalysisInsert['analysis_type'];
  analysis_id: string;
  analysis_title?: string;
  analysis_summary?: string;
  analysis_data?: any;
  position?: number;
}

export interface SessionResponse {
  session: AnalysisSessionWithTags;
  analyses: SessionAnalysisWithDetails[];
  settings?: SessionSettings;
}

export interface SessionsListResponse {
  sessions: AnalysisSessionWithTags[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Component props types
export interface SessionListProps {
  sessions?: AnalysisSessionWithTags[];
  onSessionSelect?: (session: AnalysisSession) => void;
  onSessionEdit?: (session: AnalysisSession) => void;
  onSessionDelete?: (sessionId: string) => void;
  onSessionArchive?: (sessionId: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  showFilters?: boolean;
}

export interface SessionCardProps {
  session: AnalysisSessionWithTags;
  onEdit?: (session: AnalysisSession) => void;
  onDelete?: (sessionId: string) => void;
  onArchive?: (sessionId: string) => void;
  onSelect?: (session: AnalysisSession) => void;
  isSelected?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export interface SessionFormProps {
  session?: AnalysisSession;
  onSubmit: (data: CreateSessionRequest | UpdateSessionRequest) => void;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
}

// Hook return types
export interface UseSessionsReturn {
  sessions: AnalysisSession[];
  currentSession: AnalysisSession | null;
  isLoading: boolean;
  error: string | null;
  createSession: (data: CreateSessionRequest) => Promise<AnalysisSession>;
  updateSession: (id: string, data: UpdateSessionRequest) => Promise<AnalysisSession>;
  deleteSession: (id: string) => Promise<void>;
  archiveSession: (id: string) => Promise<void>;
  restoreSession: (id: string) => Promise<void>;
  loadSessions: (filters?: SessionFilters) => Promise<void>;
  setCurrentSession: (session: AnalysisSession | null) => void;
  refreshSessions: () => Promise<void>;
}

export interface UseSessionAnalysesReturn {
  analyses: SessionAnalysisWithDetails[];
  isLoading: boolean;
  error: string | null;
  addAnalysis: (sessionId: string, data: AddAnalysisRequest) => Promise<SessionAnalysis>;
  removeAnalysis: (sessionId: string, analysisId: string) => Promise<void>;
  reorderAnalyses: (sessionId: string, analysisIds: string[]) => Promise<void>;
  loadAnalyses: (sessionId: string) => Promise<void>;
  refreshAnalyses: () => Promise<void>;
}

export interface UseSessionSettingsReturn {
  settings: SessionSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (sessionId: string, data: Partial<SessionSettingsInsert>) => Promise<SessionSettings>;
  loadSettings: (sessionId: string) => Promise<void>;
  resetSettings: (sessionId: string) => Promise<void>;
}

// Utility types
export type SessionType = AnalysisSessionInsert['session_type'];
export type SessionStatus = AnalysisSessionInsert['status'];
export type AnalysisType = SessionAnalysisInsert['analysis_type'];

export interface SessionStatistics {
  totalSessions: number;
  activeSessions: number;
  archivedSessions: number;
  totalAnalyses: number;
  wordAnalyses: number;
  sentenceAnalyses: number;
  paragraphAnalyses: number;
  averageAnalysesPerSession: number;
  mostRecentSession?: AnalysisSession;
  mostActiveSession?: AnalysisSession;
}

// Error types
export interface SessionError {
  code: 'SESSION_NOT_FOUND' | 'SESSION_CREATE_FAILED' | 'SESSION_UPDATE_FAILED' | 'SESSION_DELETE_FAILED' | 'ANALYSIS_ADD_FAILED' | 'SETTINGS_UPDATE_FAILED' | 'TAG_OPERATION_FAILED' | 'NETWORK_ERROR' | 'PERMISSION_DENIED';
  message: string;
  details?: any;
}