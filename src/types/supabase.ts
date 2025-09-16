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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      crawl_sessions: {
        Row: {
          client_name: string | null
          completed_at: string | null
          created_at: string | null
          domain: string
          id: string
          started_at: string | null
          status: string | null
          total_pages: number | null
          updated_at: string | null
        }
        Insert: {
          client_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          domain: string
          id?: string
          started_at?: string | null
          status?: string | null
          total_pages?: number | null
          updated_at?: string | null
        }
        Update: {
          client_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          domain?: string
          id?: string
          started_at?: string | null
          status?: string | null
          total_pages?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          client_name: string | null
          content_hash: string | null
          crawled_at: string | null
          h1_tags: Json | null
          id: string
          link_hash: string | null
          links: Json | null
          meta_description: string | null
          robots_content: string | null
          session_id: string
          status_code: number | null
          title: string | null
          url: string
        }
        Insert: {
          client_name?: string | null
          content_hash?: string | null
          crawled_at?: string | null
          h1_tags?: Json | null
          id?: string
          link_hash?: string | null
          links?: Json | null
          meta_description?: string | null
          robots_content?: string | null
          session_id: string
          status_code?: number | null
          title?: string | null
          url: string
        }
        Update: {
          client_name?: string | null
          content_hash?: string | null
          crawled_at?: string | null
          h1_tags?: Json | null
          id?: string
          link_hash?: string | null
          links?: Json | null
          meta_description?: string | null
          robots_content?: string | null
          session_id?: string
          status_code?: number | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "crawl_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      raw_pages: {
        Row: {
          client_name: string | null
          content_hash: string | null
          crawled_at: string | null
          created_at: string | null
          h1_tags: Json | null
          id: string
          link_hash: string | null
          links: Json | null
          meta_description: string | null
          robots_content: string | null
          session_id: string
          status_code: number | null
          title: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          client_name?: string | null
          content_hash?: string | null
          crawled_at?: string | null
          created_at?: string | null
          h1_tags?: Json | null
          id?: string
          link_hash?: string | null
          links?: Json | null
          meta_description?: string | null
          robots_content?: string | null
          session_id: string
          status_code?: number | null
          title?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          client_name?: string | null
          content_hash?: string | null
          crawled_at?: string | null
          created_at?: string | null
          h1_tags?: Json | null
          id?: string
          link_hash?: string | null
          links?: Json | null
          meta_description?: string | null
          robots_content?: string | null
          session_id?: string
          status_code?: number | null
          title?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_pages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "crawl_sessions"
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
