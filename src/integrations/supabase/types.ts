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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          class_number: number
          client_id: string
          created_at: string
          date: string
          id: string
        }
        Insert: {
          class_number: number
          client_id: string
          created_at?: string
          date: string
          id?: string
        }
        Update: {
          class_number?: number
          client_id?: string
          created_at?: string
          date?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          cedula: string
          created_at: string
          id: string
          name: string
          program: string
          total_classes: number
          total_value: number
          unit_value: number
          updated_at: string
        }
        Insert: {
          cedula: string
          created_at?: string
          id?: string
          name: string
          program: string
          total_classes?: number
          total_value?: number
          unit_value?: number
          updated_at?: string
        }
        Update: {
          cedula?: string
          created_at?: string
          id?: string
          name?: string
          program?: string
          total_classes?: number
          total_value?: number
          unit_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      group_classes: {
        Row: {
          checkin_token: string
          class_date: string
          created_at: string
          description: string | null
          end_time: string
          id: string
          instructor: string
          is_recurring: boolean
          max_capacity: number
          program: string
          recurrence_group_id: string | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          checkin_token?: string
          class_date: string
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          instructor?: string
          is_recurring?: boolean
          max_capacity?: number
          program: string
          recurrence_group_id?: string | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          checkin_token?: string
          class_date?: string
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          instructor?: string
          is_recurring?: boolean
          max_capacity?: number
          program?: string
          recurrence_group_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cedula: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cedula?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cedula?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          class_id: string
          client_cedula: string
          client_name: string
          created_at: string
          id: string
          status: string
        }
        Insert: {
          class_id: string
          client_cedula: string
          client_name: string
          created_at?: string
          id?: string
          status?: string
        }
        Update: {
          class_id?: string
          client_cedula?: string
          client_name?: string
          created_at?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "group_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          class_id: string
          client_cedula: string
          client_name: string
          created_at: string
          id: string
          position: number
        }
        Insert: {
          class_id: string
          client_cedula: string
          client_name: string
          created_at?: string
          id?: string
          position: number
        }
        Update: {
          class_id?: string
          client_cedula?: string
          client_name?: string
          created_at?: string
          id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "group_classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      checkin_via_qr: {
        Args: { _cedula: string; _token: string }
        Returns: {
          class_number: number
          class_title: string
          message: string
          success: boolean
        }[]
      }
      create_reservation: {
        Args: { _cedula: string; _class_id: string }
        Returns: string
      }
      get_attendance_by_cedula: {
        Args: { _cedula: string }
        Returns: {
          class_number: number
          client_id: string
          created_at: string
          date: string
          id: string
        }[]
      }
      get_class_counts: {
        Args: { _class_id: string }
        Returns: {
          confirmed_count: number
          waitlist_count: number
        }[]
      }
      get_client_by_cedula: {
        Args: { _cedula: string }
        Returns: {
          cedula: string
          id: string
          name: string
          program: string
          total_classes: number
          total_value: number
          unit_value: number
        }[]
      }
      get_public_class: {
        Args: { _id: string }
        Returns: {
          class_date: string
          description: string
          end_time: string
          id: string
          instructor: string
          max_capacity: number
          program: string
          start_time: string
          title: string
        }[]
      }
      get_reservations_by_cedula: {
        Args: { _cedula: string }
        Returns: {
          class_id: string
          client_cedula: string
          client_name: string
          created_at: string
          id: string
          status: string
        }[]
      }
      get_user_cedula: { Args: { _user_id: string }; Returns: string }
      get_waitlist_by_cedula: {
        Args: { _cedula: string }
        Returns: {
          class_id: string
          client_cedula: string
          client_name: string
          created_at: string
          id: string
          wait_position: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_waitlist: {
        Args: { _cedula: string; _class_id: string }
        Returns: string
      }
      list_public_classes: {
        Args: { _from?: string }
        Returns: {
          class_date: string
          description: string
          end_time: string
          id: string
          instructor: string
          is_recurring: boolean
          max_capacity: number
          program: string
          recurrence_group_id: string
          start_time: string
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "instructor" | "client"
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
    Enums: {
      app_role: ["admin", "instructor", "client"],
    },
  },
} as const
