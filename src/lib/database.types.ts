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
          id?: string
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
        Relationships: []
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
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
