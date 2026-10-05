export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          details: NonNullable<Json>;
          entity_id: string | null;
          entity_type: string;
          id: number;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          details?: NonNullable<Json>;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          details?: NonNullable<Json>;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          display_order: number;
          end_time: string;
          event_id: string;
          id: string;
          start_time: string;
        };
        Insert: {
          display_order: number;
          end_time: string;
          event_id: string;
          id?: string;
          start_time: string;
        };
        Update: {
          display_order?: number;
          end_time?: string;
          event_id?: string;
          id?: string;
          start_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string;
          event_date: string;
          guest_limit: number;
          id: string;
          name: string;
          registration_close_at: string | null;
          registration_open_at: string | null;
          schedule_published_at: string | null;
          site_public_at: string | null;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          event_date: string;
          guest_limit?: number;
          id?: string;
          name: string;
          registration_close_at?: string | null;
          registration_open_at?: string | null;
          schedule_published_at?: string | null;
          site_public_at?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          event_date?: string;
          guest_limit?: number;
          id?: string;
          name?: string;
          registration_close_at?: string | null;
          registration_open_at?: string | null;
          schedule_published_at?: string | null;
          site_public_at?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guests: {
        Row: {
          created_at: string;
          display_email: string;
          event_id: string;
          full_name: string;
          id: string;
          normalized_email: string;
          status: Database["public"]["Enums"]["guest_status"];
        };
        Insert: {
          created_at?: string;
          display_email: string;
          event_id: string;
          full_name: string;
          id?: string;
          normalized_email: string;
          status?: Database["public"]["Enums"]["guest_status"];
        };
        Update: {
          created_at?: string;
          display_email?: string;
          event_id?: string;
          full_name?: string;
          id?: string;
          normalized_email?: string;
          status?: Database["public"]["Enums"]["guest_status"];
        };
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      lecturers: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          photo_path: string | null;
          short_bio: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          photo_path?: string | null;
          short_bio?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          photo_path?: string | null;
          short_bio?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lectures: {
        Row: {
          annotation: string;
          id: string;
          lecturer_id: string;
          title: string;
        };
        Insert: {
          annotation?: string;
          id?: string;
          lecturer_id: string;
          title: string;
        };
        Update: {
          annotation?: string;
          id?: string;
          lecturer_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lectures_lecturer_id_fkey";
            columns: ["lecturer_id"];
            isOneToOne: false;
            referencedRelation: "lecturers";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          active: boolean;
          capacity: number;
          event_id: string;
          id: string;
          room_number: string;
        };
        Insert: {
          active?: boolean;
          capacity: number;
          event_id: string;
          id?: string;
          room_number: string;
        };
        Update: {
          active?: boolean;
          capacity?: number;
          event_id?: string;
          id?: string;
          room_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          active: boolean;
          block_id: string;
          event_id: string;
          id: string;
          lecture_id: string;
          room_id: string;
        };
        Insert: {
          active?: boolean;
          block_id: string;
          event_id: string;
          id?: string;
          lecture_id: string;
          room_id: string;
        };
        Update: {
          active?: boolean;
          block_id?: string;
          event_id?: string;
          id?: string;
          lecture_id?: string;
          room_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_block_event_fkey";
            columns: ["block_id", "event_id"];
            isOneToOne: false;
            referencedRelation: "blocks";
            referencedColumns: ["id", "event_id"];
          },
          {
            foreignKeyName: "sessions_block_id_fkey";
            columns: ["block_id"];
            isOneToOne: false;
            referencedRelation: "blocks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_final_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_lecture_id_fkey";
            columns: ["lecture_id"];
            isOneToOne: false;
            referencedRelation: "lectures";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sessions_room_event_fkey";
            columns: ["room_id", "event_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id", "event_id"];
          },
        ];
      };
      student_profiles: {
        Row: {
          class_name: string | null;
          created_at: string;
          display_name: string;
          email: string;
          user_id: string;
        };
        Insert: {
          class_name?: string | null;
          created_at?: string;
          display_name?: string;
          email: string;
          user_id: string;
        };
        Update: {
          class_name?: string | null;
          created_at?: string;
          display_name?: string;
          email?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      student_selections: {
        Row: {
          block_id: string;
          created_at: string;
          session_id: string;
          student_id: string;
          updated_at: string;
        };
        Insert: {
          block_id: string;
          created_at?: string;
          session_id: string;
          student_id: string;
          updated_at?: string;
        };
        Update: {
          block_id?: string;
          created_at?: string;
          session_id?: string;
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_selections_block_id_fkey";
            columns: ["block_id"];
            isOneToOne: false;
            referencedRelation: "blocks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_selections_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_selections_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "student_profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          granted_by: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          granted_by?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          granted_by?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ensure_student_profile: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      event_registration_ready: {
        Args: { p_event_id: string };
        Returns: boolean;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_owner: { Args: Record<PropertyKey, never>; Returns: boolean };
      register_guest: {
        Args: { p_email: string; p_full_name: string };
        Returns: Json;
      };
      registration_state: {
        Args: { p_event_id: string; p_now?: string };
        Returns: string;
      };
      select_session: { Args: { p_session_id: string }; Returns: Json };
      session_availability: {
        Args: { p_event_id: string };
        Returns: {
          block_id: string;
          capacity: number;
          registrations: number;
          room_number: string;
          session_id: string;
        }[];
      };
      set_student_class: { Args: { p_class_name: string }; Returns: undefined };
    };
    Enums: {
      app_role: "student" | "admin" | "owner";
      guest_status: "active" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["student", "admin", "owner"],
      guest_status: ["active", "cancelled"],
    },
  },
} as const;
