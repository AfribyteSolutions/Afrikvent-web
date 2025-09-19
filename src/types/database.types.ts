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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      EVENT_COMMENTS: {
        Row: {
          created_at: string
          event_id: number | null
          id: number
          is_deleted: boolean | null
          message: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: number | null
          id?: number
          is_deleted?: boolean | null
          message?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: number | null
          id?: number
          is_deleted?: boolean | null
          message?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "EVENT_COMMENTS_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "EVENTS"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "EVENT_COMMENTS_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "USERS"
            referencedColumns: ["user_id"]
          },
        ]
      }
      EVENT_IMAGES: {
        Row: {
          created_at: string
          display_order: number | null
          event_id: number | null
          id: number
          image_url: string | null
          is_primary: boolean | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          event_id?: number | null
          id?: number
          image_url?: string | null
          is_primary?: boolean | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          event_id?: number | null
          id?: number
          image_url?: string | null
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "EVENT_IMAGES_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "EVENTS"
            referencedColumns: ["id"]
          },
        ]
      }
      EVENTS: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string | null
          event_status: string
          id: number
          images: string[] | null
          is_featured: boolean | null
          is_sponsored: boolean | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          organizer_id: string | null
          sponsor_logo_url: string | null
          sponsor_name: string | null
          start_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_status?: string
          id?: number
          images?: string[] | null
          is_featured?: boolean | null
          is_sponsored?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          organizer_id?: string | null
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_status?: string
          id?: number
          images?: string[] | null
          is_featured?: boolean | null
          is_sponsored?: boolean | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          organizer_id?: string | null
          sponsor_logo_url?: string | null
          sponsor_name?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "EVENTS_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "USERS"
            referencedColumns: ["user_id"]
          },
        ]
      }
      EVENTS_SAVED: {
        Row: {
          created_at: string
          event_id: number
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "EVENTS_SAVED_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "EVENTS"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "EVENTS_SAVED_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "USERS"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ORGANIZER_KYC: {
        Row: {
          bio: string | null
          created_at: string
          id: number
          id_back_photo_url: string | null
          id_front_photo_url: string | null
          kyc_status: string | null
          organization_name: string | null
          passport_photo_url: string | null
          rejection_reason: string | null
          selfie_with_id_url: string | null
          social_links: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: number
          id_back_photo_url?: string | null
          id_front_photo_url?: string | null
          kyc_status?: string | null
          organization_name?: string | null
          passport_photo_url?: string | null
          rejection_reason?: string | null
          selfie_with_id_url?: string | null
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: number
          id_back_photo_url?: string | null
          id_front_photo_url?: string | null
          kyc_status?: string | null
          organization_name?: string | null
          passport_photo_url?: string | null
          rejection_reason?: string | null
          selfie_with_id_url?: string | null
          social_links?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ORGANIZER_KYC_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "USERS"
            referencedColumns: ["user_id"]
          },
        ]
      }
      PAYMENT_TICKETS: {
        Row: {
          created_at: string
          id: number
          payment_id: number | null
          ticket_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          payment_id?: number | null
          ticket_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          payment_id?: number | null
          ticket_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "PAYMENT_TICKETS_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "PAYMENTS"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PAYMENT_TICKETS_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "TICKETS"
            referencedColumns: ["id"]
          },
        ]
      }
      PAYMENTS: {
        Row: {
          amount: number | null
          completed_at: string | null
          created_at: string
          currency: string | null
          failed_at: string | null
          id: number
          mobile_money_provider: string | null
          mobile_number: string | null
          payment_method: string | null
          payment_status: string | null
          provider_response: Json | null
          reference_number: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          failed_at?: string | null
          id?: number
          mobile_money_provider?: string | null
          mobile_number?: string | null
          payment_method?: string | null
          payment_status?: string | null
          provider_response?: Json | null
          reference_number?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          failed_at?: string | null
          id?: number
          mobile_money_provider?: string | null
          mobile_number?: string | null
          payment_method?: string | null
          payment_status?: string | null
          provider_response?: Json | null
          reference_number?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "PAYMENTS_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "USERS"
            referencedColumns: ["user_id"]
          },
        ]
      }
      TICKET_TYPES: {
        Row: {
          created_at: string
          description: string | null
          event_id: number | null
          id: number
          max_quatity: number | null
          name: string | null
          price: number | null
          ticket_image_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id?: number | null
          id?: number
          max_quatity?: number | null
          name?: string | null
          price?: number | null
          ticket_image_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: number | null
          id?: number
          max_quatity?: number | null
          name?: string | null
          price?: number | null
          ticket_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "TICKET_TYPES_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "EVENTS"
            referencedColumns: ["id"]
          },
        ]
      }
      TICKETS: {
        Row: {
          created_at: string
          event_id: number | null
          id: number
          qr_code_data: string | null
          quantity: string | null
          scanned_by: string | null
          ticket_status: string | null
          ticket_type_id: number | null
          total: number | null
          unit_price: number | null
          updated_at: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: number | null
          id?: number
          qr_code_data?: string | null
          quantity?: string | null
          scanned_by?: string | null
          ticket_status?: string | null
          ticket_type_id?: number | null
          total?: number | null
          unit_price?: number | null
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: number | null
          id?: number
          qr_code_data?: string | null
          quantity?: string | null
          scanned_by?: string | null
          ticket_status?: string | null
          ticket_type_id?: number | null
          total?: number | null
          unit_price?: number | null
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "TICKETS_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "EVENTS"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TICKETS_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "USERS"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "TICKETS_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "TICKET_TYPES"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TICKETS_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "USERS"
            referencedColumns: ["user_id"]
          },
        ]
      }
      USERS: {
        Row: {
          created_at: string
          email: string | null
          id: number
          image_url: string | null
          is_active: boolean | null
          last_login_at: string | null
          name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
