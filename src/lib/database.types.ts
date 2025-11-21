export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          hit_count: number
          id: string
          model: string
          operation: string
          provider: string
          request_hash: string
          response_data: Json
          updated_at: string | null
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          hit_count?: number
          id?: string
          model: string
          operation: string
          provider: string
          request_hash: string
          response_data: Json
          updated_at?: string | null
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          hit_count?: number
          id?: string
          model?: string
          operation?: string
          provider?: string
          request_hash?: string
          response_data?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          capabilities: string[]
          cost_per_request: number
          cost_per_token: number
          created_at: string | null
          deprecated_at: string | null
          id: string
          is_available: boolean
          max_tokens: number
          model_id: string
          name: string
          provider: string
          type: string
          updated_at: string | null
        }
        Insert: {
          capabilities?: string[]
          cost_per_request?: number
          cost_per_token?: number
          created_at?: string | null
          deprecated_at?: string | null
          id?: string
          is_available?: boolean
          max_tokens: number
          model_id: string
          name: string
          provider: string
          type: string
          updated_at?: string | null
        }
        Update: {
          capabilities?: string[]
          cost_per_request?: number
          cost_per_token?: number
          created_at?: string | null
          deprecated_at?: string | null
          id?: string
          is_available?: boolean
          max_tokens?: number
          model_id?: string
          name?: string
          provider?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_provider_performance: {
        Row: {
          average_response_time: number | null
          created_at: string | null
          date: string
          error_rate: number | null
          failed_requests: number
          id: string
          model: string
          provider: string
          success_rate: number | null
          successful_requests: number
          total_cost: number
          total_requests: number
          total_tokens: number
          updated_at: string | null
        }
        Insert: {
          average_response_time?: number | null
          created_at?: string | null
          date: string
          error_rate?: number | null
          failed_requests?: number
          id?: string
          model: string
          provider: string
          success_rate?: number | null
          successful_requests?: number
          total_cost?: number
          total_requests?: number
          total_tokens?: number
          updated_at?: string | null
        }
        Update: {
          average_response_time?: number | null
          created_at?: string | null
          date?: string
          error_rate?: number | null
          failed_requests?: number
          id?: string
          model?: string
          provider?: string
          success_rate?: number | null
          successful_requests?: number
          total_cost?: number
          total_requests?: number
          total_tokens?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          request_count: number
          updated_at: string | null
          user_id: string
          window_start: string
          window_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          request_count?: number
          updated_at?: string | null
          user_id: string
          window_start: string
          window_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          request_count?: number
          updated_at?: string | null
          user_id?: string
          window_start?: string
          window_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_rate_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_tiers: {
        Row: {
          created_at: string | null
          features: string[]
          id: string
          max_cost_per_day: number
          max_requests_per_day: number
          max_tokens_per_day: number
          name: string
          rate_limit_per_hour: number
          rate_limit_per_minute: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: string[]
          id?: string
          max_cost_per_day?: number
          max_requests_per_day?: number
          max_tokens_per_day?: number
          name: string
          rate_limit_per_hour?: number
          rate_limit_per_minute?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: string[]
          id?: string
          max_cost_per_day?: number
          max_requests_per_day?: number
          max_tokens_per_day?: number
          name?: string
          rate_limit_per_hour?: number
          rate_limit_per_minute?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          cost: number
          created_at: string | null
          duration: number | null
          error: string | null
          id: string
          input_tokens: number
          metadata: Json | null
          model: string
          operation: string
          output_tokens: number
          provider: string
          success: boolean
          timestamp: string | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          cost?: number
          created_at?: string | null
          duration?: number | null
          error?: string | null
          id?: string
          input_tokens?: number
          metadata?: Json | null
          model: string
          operation: string
          output_tokens?: number
          provider: string
          success?: boolean
          timestamp?: string | null
          total_tokens?: number
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          duration?: number | null
          error?: string | null
          id?: string
          input_tokens?: number
          metadata?: Json | null
          model?: string
          operation?: string
          output_tokens?: number
          provider?: string
          success?: boolean
          timestamp?: string | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      analysis_sessions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          last_accessed_at: string | null
          paragraph_analyses_count: number | null
          sentence_analyses_count: number | null
          session_type: string
          status: string
          title: string
          total_analyses: number | null
          updated_at: string | null
          user_id: string | null
          word_analyses_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_accessed_at?: string | null
          paragraph_analyses_count?: number | null
          sentence_analyses_count?: number | null
          session_type: string
          status?: string
          title: string
          total_analyses?: number | null
          updated_at?: string | null
          user_id?: string | null
          word_analyses_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          last_accessed_at?: string | null
          paragraph_analyses_count?: number | null
          sentence_analyses_count?: number | null
          session_type?: string
          status?: string
          title?: string
          total_analyses?: number | null
          updated_at?: string | null
          user_id?: string | null
          word_analyses_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      documents: {
        Row: {
          content: Json
          created_at: string | null
          html: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          html?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          html?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      paragraph_analyses: {
        Row: {
          better_version: string | null
          created_at: string | null
          document_id: string | null
          flow_score: number | null
          gap_analysis: string | null
          id: string
          keywords: string[] | null
          logic_score: number | null
          main_topic: string | null
          paragraph: string
          sentence_variety: string | null
          sentiment_intensity: number | null
          sentiment_justification: string | null
          sentiment_label: string | null
          target_audience: string | null
          tone: string | null
          transition_words: string[] | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          vocabulary_level: string | null
        }
        Insert: {
          better_version?: string | null
          created_at?: string | null
          document_id?: string | null
          flow_score?: number | null
          gap_analysis?: string | null
          id?: string
          keywords?: string[] | null
          logic_score?: number | null
          main_topic?: string | null
          paragraph: string
          sentence_variety?: string | null
          sentiment_intensity?: number | null
          sentiment_justification?: string | null
          sentiment_label?: string | null
          target_audience?: string | null
          tone?: string | null
          transition_words?: string[] | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          vocabulary_level?: string | null
        }
        Update: {
          better_version?: string | null
          created_at?: string | null
          document_id?: string | null
          flow_score?: number | null
          gap_analysis?: string | null
          id?: string
          keywords?: string[] | null
          logic_score?: number | null
          main_topic?: string | null
          paragraph?: string
          sentence_variety?: string | null
          sentiment_intensity?: number | null
          sentiment_justification?: string | null
          sentiment_label?: string | null
          target_audience?: string | null
          tone?: string | null
          transition_words?: string[] | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          vocabulary_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paragraph_analyses_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paragraph_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      paragraph_constructive_feedback: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          issue_type: string | null
          paragraph_analysis_id: string | null
          suggestion: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          issue_type?: string | null
          paragraph_analysis_id?: string | null
          suggestion?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          issue_type?: string | null
          paragraph_analysis_id?: string | null
          suggestion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paragraph_constructive_feedback_paragraph_analysis_id_fkey"
            columns: ["paragraph_analysis_id"]
            isOneToOne: false
            referencedRelation: "paragraph_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      paragraph_structure_breakdown: {
        Row: {
          analysis: string | null
          created_at: string | null
          id: string
          paragraph_analysis_id: string | null
          role: string | null
          sentence_index: number
          snippet: string | null
        }
        Insert: {
          analysis?: string | null
          created_at?: string | null
          id?: string
          paragraph_analysis_id?: string | null
          role?: string | null
          sentence_index: number
          snippet?: string | null
        }
        Update: {
          analysis?: string | null
          created_at?: string | null
          id?: string
          paragraph_analysis_id?: string | null
          role?: string | null
          sentence_index?: number
          snippet?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paragraph_structure_breakdown_paragraph_analysis_id_fkey"
            columns: ["paragraph_analysis_id"]
            isOneToOne: false
            referencedRelation: "paragraph_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sentence_analyses: {
        Row: {
          clauses: Json | null
          complexity_level: string | null
          created_at: string | null
          document_id: string | null
          function: string | null
          id: string
          literal_translation: string | null
          main_idea: string | null
          main_verb: string | null
          natural_translation: string | null
          object: string | null
          paragraph_context: string | null
          relation_to_previous: string | null
          sentence: string
          sentence_type: string | null
          sentiment: string | null
          subject: string | null
          subtext: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          clauses?: Json | null
          complexity_level?: string | null
          created_at?: string | null
          document_id?: string | null
          function?: string | null
          id?: string
          literal_translation?: string | null
          main_idea?: string | null
          main_verb?: string | null
          natural_translation?: string | null
          object?: string | null
          paragraph_context?: string | null
          relation_to_previous?: string | null
          sentence: string
          sentence_type?: string | null
          sentiment?: string | null
          subject?: string | null
          subtext?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          clauses?: Json | null
          complexity_level?: string | null
          created_at?: string | null
          document_id?: string | null
          function?: string | null
          id?: string
          literal_translation?: string | null
          main_idea?: string | null
          main_verb?: string | null
          natural_translation?: string | null
          object?: string | null
          paragraph_context?: string | null
          relation_to_previous?: string | null
          sentence?: string
          sentence_type?: string | null
          sentiment?: string | null
          subject?: string | null
          subtext?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sentence_analyses_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentence_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sentence_key_components: {
        Row: {
          created_at: string | null
          id: string
          meaning: string | null
          phrase: string
          sentence_analysis_id: string | null
          significance: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          meaning?: string | null
          phrase: string
          sentence_analysis_id?: string | null
          significance?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          meaning?: string | null
          phrase?: string
          sentence_analysis_id?: string | null
          significance?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sentence_key_components_sentence_analysis_id_fkey"
            columns: ["sentence_analysis_id"]
            isOneToOne: false
            referencedRelation: "sentence_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      sentence_rewrite_suggestions: {
        Row: {
          change_log: string | null
          created_at: string | null
          id: string
          sentence_analysis_id: string | null
          style: string
          text: string
        }
        Insert: {
          change_log?: string | null
          created_at?: string | null
          id?: string
          sentence_analysis_id?: string | null
          style: string
          text: string
        }
        Update: {
          change_log?: string | null
          created_at?: string | null
          id?: string
          sentence_analysis_id?: string | null
          style?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "sentence_rewrite_suggestions_sentence_analysis_id_fkey"
            columns: ["sentence_analysis_id"]
            isOneToOne: false
            referencedRelation: "sentence_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      session_analyses: {
        Row: {
          analysis_data: Json | null
          analysis_id: string
          analysis_summary: string | null
          analysis_title: string | null
          analysis_type: string
          created_at: string | null
          id: string
          position: number | null
          session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_data?: Json | null
          analysis_id: string
          analysis_summary?: string | null
          analysis_title?: string | null
          analysis_type: string
          created_at?: string | null
          id?: string
          position?: number | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          analysis_id?: string
          analysis_summary?: string | null
          analysis_title?: string | null
          analysis_type?: string
          created_at?: string | null
          id?: string
          position?: number | null
          session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_analyses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_analyses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      session_settings: {
        Row: {
          analysis_depth: string | null
          auto_save: boolean | null
          compact_view: boolean | null
          created_at: string | null
          default_export_format: string | null
          email_notifications: boolean | null
          id: string
          include_metadata: boolean | null
          preferred_ai_model: string | null
          preferred_ai_provider: string | null
          session_id: string | null
          session_reminders: boolean | null
          show_summaries: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_depth?: string | null
          auto_save?: boolean | null
          compact_view?: boolean | null
          created_at?: string | null
          default_export_format?: string | null
          email_notifications?: boolean | null
          id?: string
          include_metadata?: boolean | null
          preferred_ai_model?: string | null
          preferred_ai_provider?: string | null
          session_id?: string | null
          session_reminders?: boolean | null
          show_summaries?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_depth?: string | null
          auto_save?: boolean | null
          compact_view?: boolean | null
          created_at?: string | null
          default_export_format?: string | null
          email_notifications?: boolean | null
          id?: string
          include_metadata?: boolean | null
          preferred_ai_model?: string | null
          preferred_ai_provider?: string | null
          session_id?: string | null
          session_reminders?: boolean | null
          show_summaries?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_settings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_settings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "session_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      session_tag_relations: {
        Row: {
          created_at: string | null
          id: string
          session_id: string | null
          tag_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          tag_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_tag_relations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_tag_relations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "session_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      session_tags: {
        Row: {
          created_at: string | null
          id: string
          tag_color: string | null
          tag_description: string | null
          tag_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          tag_color?: string | null
          tag_description?: string | null
          tag_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          tag_color?: string | null
          tag_description?: string | null
          tag_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_ai_tiers: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          tier_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          tier_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          tier_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ai_tiers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_ai_tiers_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ai_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ai_tiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vocabulary_antonyms: {
        Row: {
          antonym_definition: string | null
          antonym_ipa: string | null
          antonym_translation: string | null
          antonym_word: string
          context_explanation: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
          vocabulary_word_id: string | null
        }
        Insert: {
          antonym_definition?: string | null
          antonym_ipa?: string | null
          antonym_translation?: string | null
          antonym_word: string
          context_explanation?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Update: {
          antonym_definition?: string | null
          antonym_ipa?: string | null
          antonym_translation?: string | null
          antonym_word?: string
          context_explanation?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_antonyms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocabulary_antonyms_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_antonyms_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "words_for_review"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_collections: {
        Row: {
          collection_type: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          is_public: boolean | null
          mastered_count: number | null
          name: string
          practice_enabled: boolean | null
          review_interval_days: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          word_count: number | null
        }
        Insert: {
          collection_type?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          mastered_count?: number | null
          name: string
          practice_enabled?: boolean | null
          review_interval_days?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          word_count?: number | null
        }
        Update: {
          collection_type?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          mastered_count?: number | null
          name?: string
          practice_enabled?: boolean | null
          review_interval_days?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vocabulary_collocations: {
        Row: {
          collocation_type: string | null
          created_at: string | null
          frequency_level: string | null
          id: string
          meaning: string | null
          phrase: string
          register_level: string | null
          updated_at: string | null
          usage_example: string | null
          usage_translation: string | null
          user_id: string | null
          vocabulary_word_id: string | null
        }
        Insert: {
          collocation_type?: string | null
          created_at?: string | null
          frequency_level?: string | null
          id?: string
          meaning?: string | null
          phrase: string
          register_level?: string | null
          updated_at?: string | null
          usage_example?: string | null
          usage_translation?: string | null
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Update: {
          collocation_type?: string | null
          created_at?: string | null
          frequency_level?: string | null
          id?: string
          meaning?: string | null
          phrase?: string
          register_level?: string | null
          updated_at?: string | null
          usage_example?: string | null
          usage_translation?: string | null
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_collocations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocabulary_collocations_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_collocations_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "words_for_review"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_contexts: {
        Row: {
          context_text: string
          context_translation: string | null
          context_type: string
          created_at: string | null
          id: string
          notes: string | null
          source_author: string | null
          source_page_number: number | null
          source_title: string | null
          source_url: string | null
          updated_at: string | null
          user_id: string | null
          vocabulary_word_id: string | null
        }
        Insert: {
          context_text: string
          context_translation?: string | null
          context_type: string
          created_at?: string | null
          id?: string
          notes?: string | null
          source_author?: string | null
          source_page_number?: number | null
          source_title?: string | null
          source_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Update: {
          context_text?: string
          context_translation?: string | null
          context_type?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          source_author?: string | null
          source_page_number?: number | null
          source_title?: string | null
          source_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_contexts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocabulary_contexts_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_contexts_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "words_for_review"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_practice_results: {
        Row: {
          correct_answer: string
          created_at: string | null
          id: string
          is_correct: boolean
          mastery_after: number | null
          mastery_before: number | null
          practice_session_id: string | null
          question_text: string
          question_type: string
          response_time_ms: number | null
          user_answer: string
          user_id: string | null
          vocabulary_word_id: string | null
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          id?: string
          is_correct: boolean
          mastery_after?: number | null
          mastery_before?: number | null
          practice_session_id?: string | null
          question_text: string
          question_type: string
          response_time_ms?: number | null
          user_answer: string
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          mastery_after?: number | null
          mastery_before?: number | null
          practice_session_id?: string | null
          question_text?: string
          question_type?: string
          response_time_ms?: number | null
          user_answer?: string
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_practice_results_practice_session_id_fkey"
            columns: ["practice_session_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_practice_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_practice_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocabulary_practice_results_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_practice_results_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "words_for_review"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_practice_sessions: {
        Row: {
          accuracy_percentage: number | null
          collection_id: string | null
          completed_at: string | null
          correct_answers: number | null
          created_at: string | null
          difficulty_level: string | null
          id: string
          session_type: string
          started_at: string | null
          status: string | null
          time_limit_seconds: number | null
          time_spent_seconds: number | null
          total_questions: number | null
          user_id: string | null
          word_count: number
        }
        Insert: {
          accuracy_percentage?: number | null
          collection_id?: string | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          session_type: string
          started_at?: string | null
          status?: string | null
          time_limit_seconds?: number | null
          time_spent_seconds?: number | null
          total_questions?: number | null
          user_id?: string | null
          word_count: number
        }
        Update: {
          accuracy_percentage?: number | null
          collection_id?: string | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          difficulty_level?: string | null
          id?: string
          session_type?: string
          started_at?: string | null
          status?: string | null
          time_limit_seconds?: number | null
          time_spent_seconds?: number | null
          total_questions?: number | null
          user_id?: string | null
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_practice_sessions_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_practice_sessions_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_practice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vocabulary_synonyms: {
        Row: {
          context_difference: string | null
          created_at: string | null
          frequency_level: string | null
          id: string
          synonym_definition: string | null
          synonym_ipa: string | null
          synonym_translation: string | null
          synonym_word: string
          updated_at: string | null
          user_id: string | null
          vocabulary_word_id: string | null
        }
        Insert: {
          context_difference?: string | null
          created_at?: string | null
          frequency_level?: string | null
          id?: string
          synonym_definition?: string | null
          synonym_ipa?: string | null
          synonym_translation?: string | null
          synonym_word: string
          updated_at?: string | null
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Update: {
          context_difference?: string | null
          created_at?: string | null
          frequency_level?: string | null
          id?: string
          synonym_definition?: string | null
          synonym_ipa?: string | null
          synonym_translation?: string | null
          synonym_word?: string
          updated_at?: string | null
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_synonyms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocabulary_synonyms_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_synonyms_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "words_for_review"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_word_collections: {
        Row: {
          added_at: string | null
          added_manually: boolean | null
          collection_id: string | null
          id: string
          user_id: string | null
          vocabulary_word_id: string | null
        }
        Insert: {
          added_at?: string | null
          added_manually?: boolean | null
          collection_id?: string | null
          id?: string
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Update: {
          added_at?: string | null
          added_manually?: boolean | null
          collection_id?: string | null
          id?: string
          user_id?: string | null
          vocabulary_word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_word_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_word_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_word_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vocabulary_word_collections_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_word_collections_vocabulary_word_id_fkey"
            columns: ["vocabulary_word_id"]
            isOneToOne: false
            referencedRelation: "words_for_review"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_words: {
        Row: {
          audio_url: string | null
          cefr_level: string | null
          context_notes: string | null
          correct_count: number | null
          created_at: string | null
          definition_en: string | null
          definition_vi: string | null
          difficulty_level: number | null
          etymology: string | null
          example_sentence: string | null
          example_translation: string | null
          id: string
          image_url: string | null
          ipa: string | null
          last_reviewed_at: string | null
          mastery_level: number | null
          next_review_at: string | null
          origin: string | null
          part_of_speech: string | null
          personal_notes: string | null
          review_count: number | null
          source_reference: string | null
          source_type: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          vietnamese_translation: string | null
          word: string
        }
        Insert: {
          audio_url?: string | null
          cefr_level?: string | null
          context_notes?: string | null
          correct_count?: number | null
          created_at?: string | null
          definition_en?: string | null
          definition_vi?: string | null
          difficulty_level?: number | null
          etymology?: string | null
          example_sentence?: string | null
          example_translation?: string | null
          id?: string
          image_url?: string | null
          ipa?: string | null
          last_reviewed_at?: string | null
          mastery_level?: number | null
          next_review_at?: string | null
          origin?: string | null
          part_of_speech?: string | null
          personal_notes?: string | null
          review_count?: number | null
          source_reference?: string | null
          source_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vietnamese_translation?: string | null
          word: string
        }
        Update: {
          audio_url?: string | null
          cefr_level?: string | null
          context_notes?: string | null
          correct_count?: number | null
          created_at?: string | null
          definition_en?: string | null
          definition_vi?: string | null
          difficulty_level?: number | null
          etymology?: string | null
          example_sentence?: string | null
          example_translation?: string | null
          id?: string
          image_url?: string | null
          ipa?: string | null
          last_reviewed_at?: string | null
          mastery_level?: number | null
          next_review_at?: string | null
          origin?: string | null
          part_of_speech?: string | null
          personal_notes?: string | null
          review_count?: number | null
          source_reference?: string | null
          source_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vietnamese_translation?: string | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      word_analyses: {
        Row: {
          cefr: string | null
          context_meaning: string | null
          created_at: string | null
          document_id: string | null
          example_sentence: string | null
          example_translation: string | null
          id: string
          inference_clues: string | null
          inference_reasoning: string | null
          ipa: string | null
          paragraph_context: string | null
          pos: string | null
          root_meaning: string | null
          sentence_context: string | null
          tone: string | null
          updated_at: string | null
          user_id: string | null
          vietnamese_translation: string | null
          word: string
        }
        Insert: {
          cefr?: string | null
          context_meaning?: string | null
          created_at?: string | null
          document_id?: string | null
          example_sentence?: string | null
          example_translation?: string | null
          id?: string
          inference_clues?: string | null
          inference_reasoning?: string | null
          ipa?: string | null
          paragraph_context?: string | null
          pos?: string | null
          root_meaning?: string | null
          sentence_context?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string | null
          vietnamese_translation?: string | null
          word: string
        }
        Update: {
          cefr?: string | null
          context_meaning?: string | null
          created_at?: string | null
          document_id?: string | null
          example_sentence?: string | null
          example_translation?: string | null
          id?: string
          inference_clues?: string | null
          inference_reasoning?: string | null
          ipa?: string | null
          paragraph_context?: string | null
          pos?: string | null
          root_meaning?: string | null
          sentence_context?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string | null
          vietnamese_translation?: string | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_analyses_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      word_antonyms: {
        Row: {
          antonym_word: string
          created_at: string | null
          id: string
          ipa: string | null
          meaning_en: string | null
          meaning_vi: string | null
          word_analysis_id: string | null
        }
        Insert: {
          antonym_word: string
          created_at?: string | null
          id?: string
          ipa?: string | null
          meaning_en?: string | null
          meaning_vi?: string | null
          word_analysis_id?: string | null
        }
        Update: {
          antonym_word?: string
          created_at?: string | null
          id?: string
          ipa?: string | null
          meaning_en?: string | null
          meaning_vi?: string | null
          word_analysis_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "word_antonyms_word_analysis_id_fkey"
            columns: ["word_analysis_id"]
            isOneToOne: false
            referencedRelation: "word_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      word_collocations: {
        Row: {
          created_at: string | null
          frequency_level: string | null
          id: string
          meaning: string | null
          phrase: string
          updated_at: string | null
          usage_example: string | null
          word_analysis_id: string | null
        }
        Insert: {
          created_at?: string | null
          frequency_level?: string | null
          id?: string
          meaning?: string | null
          phrase: string
          updated_at?: string | null
          usage_example?: string | null
          word_analysis_id?: string | null
        }
        Update: {
          created_at?: string | null
          frequency_level?: string | null
          id?: string
          meaning?: string | null
          phrase?: string
          updated_at?: string | null
          usage_example?: string | null
          word_analysis_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "word_collocations_word_analysis_id_fkey"
            columns: ["word_analysis_id"]
            isOneToOne: false
            referencedRelation: "word_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      word_synonyms: {
        Row: {
          created_at: string | null
          id: string
          ipa: string | null
          meaning_en: string | null
          meaning_vi: string | null
          synonym_word: string
          word_analysis_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ipa?: string | null
          meaning_en?: string | null
          meaning_vi?: string | null
          synonym_word: string
          word_analysis_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ipa?: string | null
          meaning_en?: string | null
          meaning_vi?: string | null
          synonym_word?: string
          word_analysis_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "word_synonyms_word_analysis_id_fkey"
            columns: ["word_analysis_id"]
            isOneToOne: false
            referencedRelation: "word_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_provider_analytics: {
        Row: {
          average_cost_per_request: number | null
          average_response_time: number | null
          date: string | null
          error_rate: number | null
          failed_requests: number | null
          model: string | null
          provider: string | null
          success_rate: number | null
          successful_requests: number | null
          total_cost: number | null
          total_requests: number | null
          total_tokens: number | null
        }
        Insert: {
          average_cost_per_request?: never
          average_response_time?: number | null
          date?: string | null
          error_rate?: number | null
          failed_requests?: number | null
          model?: string | null
          provider?: string | null
          success_rate?: number | null
          successful_requests?: number | null
          total_cost?: number | null
          total_requests?: number | null
          total_tokens?: number | null
        }
        Update: {
          average_cost_per_request?: never
          average_response_time?: number | null
          date?: string | null
          error_rate?: number | null
          failed_requests?: number | null
          model?: string | null
          provider?: string | null
          success_rate?: number | null
          successful_requests?: number | null
          total_cost?: number | null
          total_requests?: number | null
          total_tokens?: number | null
        }
        Relationships: []
      }
      ai_usage_analytics: {
        Row: {
          cost_today: number | null
          email: string | null
          max_cost_per_day: number | null
          max_requests_per_day: number | null
          max_tokens_per_day: number | null
          remaining_cost: number | null
          remaining_requests: number | null
          remaining_tokens: number | null
          requests_today: number | null
          tier_name: string | null
          tokens_today: number | null
          user_id: string | null
        }
        Relationships: []
      }
      collection_details: {
        Row: {
          actual_mastered_count: number | null
          actual_word_count: number | null
          average_mastery: number | null
          collection_type: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string | null
          is_default: boolean | null
          is_public: boolean | null
          learning_count: number | null
          mastered_count: number | null
          name: string | null
          new_count: number | null
          practice_enabled: boolean | null
          review_interval_days: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          word_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      recent_analyses: {
        Row: {
          analysis_data: Json | null
          analysis_id: string | null
          analysis_summary: string | null
          analysis_title: string | null
          analysis_type: string | null
          created_at: string | null
          id: string | null
          position: number | null
          session_id: string | null
          session_status: string | null
          session_title: string | null
          session_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_analyses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_analyses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      session_summary: {
        Row: {
          actual_analyses_count: number | null
          actual_paragraph_count: number | null
          actual_sentence_count: number | null
          actual_word_count: number | null
          created_at: string | null
          description: string | null
          id: string | null
          last_accessed_at: string | null
          paragraph_analyses_count: number | null
          sentence_analyses_count: number | null
          session_type: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          total_analyses: number | null
          updated_at: string | null
          user_id: string | null
          word_analyses_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vocabulary_statistics: {
        Row: {
          average_mastery: number | null
          cefr_levels_covered: number | null
          learning_words: number | null
          mastered_words: number | null
          new_words: number | null
          total_words: number | null
          user_id: string | null
          words_for_review: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      words_for_review: {
        Row: {
          audio_url: string | null
          cefr_level: string | null
          collection_name: string | null
          context_notes: string | null
          correct_count: number | null
          created_at: string | null
          definition_en: string | null
          definition_vi: string | null
          difficulty_level: number | null
          etymology: string | null
          example_sentence: string | null
          example_translation: string | null
          id: string | null
          image_url: string | null
          ipa: string | null
          last_reviewed_at: string | null
          mastery_level: number | null
          next_review_at: string | null
          origin: string | null
          part_of_speech: string | null
          personal_notes: string | null
          review_count: number | null
          source_reference: string | null
          source_type: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          vietnamese_translation: string | null
          word: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      aggregate_provider_performance: { Args: never; Returns: undefined }
      calculate_next_review_date: {
        Args: { current_mastery_level: number; is_correct: boolean }
        Returns: string
      }
      cleanup_ai_cache: { Args: never; Returns: undefined }
      cleanup_old_usage_logs: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
