export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activity_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          payload: Json;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          payload?: Json;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          payload?: Json;
          user_id?: string;
        };
        Relationships: [];
      };
      admin_invites: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          expires_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          expires_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [];
      };
      case_studies: {
        Row: {
          category: string;
          code: string | null;
          created_at: string;
          description: string;
          difficulty: number;
          estimated_hours: number;
          id: string;
          prerequisites: string[];
          tech_stack: string[];
          title: string;
        };
        Insert: {
          category: string;
          code?: string | null;
          created_at?: string;
          description: string;
          difficulty?: number;
          estimated_hours?: number;
          id?: string;
          prerequisites?: string[];
          tech_stack?: string[];
          title: string;
        };
        Update: {
          category?: string;
          code?: string | null;
          created_at?: string;
          description?: string;
          difficulty?: number;
          estimated_hours?: number;
          id?: string;
          prerequisites?: string[];
          tech_stack?: string[];
          title?: string;
        };
        Relationships: [];
      };
      completed_case_studies: {
        Row: {
          case_study_id: string;
          completed_at: string;
          id: string;
          mentor_rating: number | null;
          notes: string | null;
          user_id: string;
        };
        Insert: {
          case_study_id: string;
          completed_at?: string;
          id?: string;
          mentor_rating?: number | null;
          notes?: string | null;
          user_id: string;
        };
        Update: {
          case_study_id?: string;
          completed_at?: string;
          id?: string;
          mentor_rating?: number | null;
          notes?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "completed_case_studies_case_study_id_fkey";
            columns: ["case_study_id"];
            isOneToOne: false;
            referencedRelation: "case_studies";
            referencedColumns: ["id"];
          },
        ];
      };
      intern_skills: {
        Row: {
          id: string;
          proficiency: number;
          skill_id: string;
          updated_at: string;
          user_id: string;
          verified: boolean;
        };
        Insert: {
          id?: string;
          proficiency?: number;
          skill_id: string;
          updated_at?: string;
          user_id: string;
          verified?: boolean;
        };
        Update: {
          id?: string;
          proficiency?: number;
          skill_id?: string;
          updated_at?: string;
          user_id?: string;
          verified?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "intern_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
        ];
      };
      mentor_reviews: {
        Row: {
          feedback: string;
          id: string;
          intern_id: string;
          mentor_id: string;
          rating: number;
          review_date: string;
        };
        Insert: {
          feedback?: string;
          id?: string;
          intern_id: string;
          mentor_id: string;
          rating: number;
          review_date?: string;
        };
        Update: {
          feedback?: string;
          id?: string;
          intern_id?: string;
          mentor_id?: string;
          rating?: number;
          review_date?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          dedupe_key: string | null;
          id: string;
          kind: string;
          link: string | null;
          message: string;
          read_at: string | null;
          severity: string;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          kind: string;
          link?: string | null;
          message: string;
          read_at?: string | null;
          severity?: string;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dedupe_key?: string | null;
          id?: string;
          kind?: string;
          link?: string | null;
          message?: string;
          read_at?: string | null;
          severity?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          attendance_score: number;
          avatar_url: string | null;
          bio: string | null;
          coding_speed: number;
          created_at: string;
          current_level: string;
          email: string;
          engineering_credits: number;
          full_name: string;
          github_username: string | null;
          id: string;
          joined_at: string;
          last_email_digest_at: string | null;
          mentor_id: string | null;
          notification_prefs: Json;
          onboarding_completed: boolean;
          target_role: string;
          updated_at: string;
        };
        Insert: {
          attendance_score?: number;
          avatar_url?: string | null;
          bio?: string | null;
          coding_speed?: number;
          created_at?: string;
          current_level?: string;
          email: string;
          engineering_credits?: number;
          full_name?: string;
          github_username?: string | null;
          id: string;
          joined_at?: string;
          last_email_digest_at?: string | null;
          mentor_id?: string | null;
          notification_prefs?: Json;
          onboarding_completed?: boolean;
          target_role?: string;
          updated_at?: string;
        };
        Update: {
          attendance_score?: number;
          avatar_url?: string | null;
          bio?: string | null;
          coding_speed?: number;
          created_at?: string;
          current_level?: string;
          email?: string;
          engineering_credits?: number;
          full_name?: string;
          github_username?: string | null;
          id?: string;
          joined_at?: string;
          last_email_digest_at?: string | null;
          mentor_id?: string | null;
          notification_prefs?: Json;
          onboarding_completed?: boolean;
          target_role?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_mentor_id_fkey";
            columns: ["mentor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      roadmap_generations: {
        Row: {
          created_at: string;
          duration_ms: number | null;
          id: string;
          inputs: Json;
          model: string;
          scores: Json;
          summary: string | null;
          triggered_by: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          duration_ms?: number | null;
          id?: string;
          inputs?: Json;
          model: string;
          scores?: Json;
          summary?: string | null;
          triggered_by?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          duration_ms?: number | null;
          id?: string;
          inputs?: Json;
          model?: string;
          scores?: Json;
          summary?: string | null;
          triggered_by?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      roadmaps: {
        Row: {
          ai_summary: string;
          current_level: string;
          estimated_graduation_date: string | null;
          generated_at: string;
          id: string;
          job_readiness: number;
          missing_skills: Json;
          monthly_goals: Json;
          next_target: string;
          promotion_readiness: number;
          recommended_case_studies: Json;
          strong_skills: Json;
          technology_dependencies: Json;
          user_id: string;
          weak_skills: Json;
          weekly_goals: Json;
        };
        Insert: {
          ai_summary?: string;
          current_level?: string;
          estimated_graduation_date?: string | null;
          generated_at?: string;
          id?: string;
          job_readiness?: number;
          missing_skills?: Json;
          monthly_goals?: Json;
          next_target?: string;
          promotion_readiness?: number;
          recommended_case_studies?: Json;
          strong_skills?: Json;
          technology_dependencies?: Json;
          user_id: string;
          weak_skills?: Json;
          weekly_goals?: Json;
        };
        Update: {
          ai_summary?: string;
          current_level?: string;
          estimated_graduation_date?: string | null;
          generated_at?: string;
          id?: string;
          job_readiness?: number;
          missing_skills?: Json;
          monthly_goals?: Json;
          next_target?: string;
          promotion_readiness?: number;
          recommended_case_studies?: Json;
          strong_skills?: Json;
          technology_dependencies?: Json;
          user_id?: string;
          weak_skills?: Json;
          weekly_goals?: Json;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
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
      bootstrap_first_admin: { Args: never; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      redeem_admin_invite: {
        Args: { _code: string };
        Returns: {
          role: Database["public"]["Enums"]["app_role"];
        }[];
      };
    };
    Enums: {
      app_role: "admin" | "mentor" | "intern";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
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
  public: {
    Enums: {
      app_role: ["admin", "mentor", "intern"],
    },
  },
} as const;
