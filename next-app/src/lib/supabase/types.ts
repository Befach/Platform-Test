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
      ai_usage: {
        Row: {
          cost_usd: number | null
          created_at: string
          id: string
          message_count: number
          model: string
          month: string
          team_id: string
          tokens_used: number
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          id: string
          message_count?: number
          model: string
          month: string
          team_id: string
          tokens_used?: number
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          id?: string
          message_count?: number
          model?: string
          month?: string
          team_id?: string
          tokens_used?: number
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_dashboards: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          layout: Json
          name: string
          updated_at: string
          widgets: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id: string
          layout: Json
          name: string
          updated_at?: string
          widgets: Json
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          layout?: Json
          name?: string
          updated_at?: string
          widgets?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_dashboards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_dashboards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          acceptance_criteria: string[] | null
          actual_end_date: string | null
          actual_hours: number | null
          actual_start_date: string | null
          ai_created: boolean | null
          ai_generated: Json | null
          ai_modified: boolean | null
          blockers: Json | null
          business_value: string | null
          category: string | null
          completed_steps: number | null
          contributors: string[] | null
          created_at: string | null
          created_by: string | null
          customer_impact: string | null
          definition_of_done: string[] | null
          effort_confidence: string | null
          estimated_hours: number | null
          health: string | null
          id: string
          is_blocked: boolean | null
          last_modified_by: string | null
          last_viewed_at: string | null
          name: string
          owner: string | null
          planned_end_date: string | null
          planned_start_date: string | null
          priority: string | null
          progress_percent: number | null
          purpose: string | null
          stage_completion_percent: number | null
          stage_history: Json | null
          stage_ready_to_advance: boolean | null
          stakeholders: string[] | null
          status: string | null
          story_points: number | null
          strategic_alignment: string | null
          success_metrics: Json | null
          tags: string[] | null
          target_release: string | null
          total_steps: number | null
          type: string
          updated_at: string | null
          user_id: string | null
          workflow_stage: string | null
          workspace_id: string | null
        }
        Insert: {
          acceptance_criteria?: string[] | null
          actual_end_date?: string | null
          actual_hours?: number | null
          actual_start_date?: string | null
          ai_created?: boolean | null
          ai_generated?: Json | null
          ai_modified?: boolean | null
          blockers?: Json | null
          business_value?: string | null
          category?: string | null
          completed_steps?: number | null
          contributors?: string[] | null
          created_at?: string | null
          created_by?: string | null
          customer_impact?: string | null
          definition_of_done?: string[] | null
          effort_confidence?: string | null
          estimated_hours?: number | null
          health?: string | null
          id?: string
          is_blocked?: boolean | null
          last_modified_by?: string | null
          last_viewed_at?: string | null
          name: string
          owner?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: string | null
          progress_percent?: number | null
          purpose?: string | null
          stage_completion_percent?: number | null
          stage_history?: Json | null
          stage_ready_to_advance?: boolean | null
          stakeholders?: string[] | null
          status?: string | null
          story_points?: number | null
          strategic_alignment?: string | null
          success_metrics?: Json | null
          tags?: string[] | null
          target_release?: string | null
          total_steps?: number | null
          type: string
          updated_at?: string | null
          user_id?: string | null
          workflow_stage?: string | null
          workspace_id?: string | null
        }
        Update: {
          acceptance_criteria?: string[] | null
          actual_end_date?: string | null
          actual_hours?: number | null
          actual_start_date?: string | null
          ai_created?: boolean | null
          ai_generated?: Json | null
          ai_modified?: boolean | null
          blockers?: Json | null
          business_value?: string | null
          category?: string | null
          completed_steps?: number | null
          contributors?: string[] | null
          created_at?: string | null
          created_by?: string | null
          customer_impact?: string | null
          definition_of_done?: string[] | null
          effort_confidence?: string | null
          estimated_hours?: number | null
          health?: string | null
          id?: string
          is_blocked?: boolean | null
          last_modified_by?: string | null
          last_viewed_at?: string | null
          name?: string
          owner?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          priority?: string | null
          progress_percent?: number | null
          purpose?: string | null
          stage_completion_percent?: number | null
          stage_history?: Json | null
          stage_ready_to_advance?: boolean | null
          stakeholders?: string[] | null
          status?: string | null
          story_points?: number | null
          strategic_alignment?: string | null
          success_metrics?: Json | null
          tags?: string[] | null
          target_release?: string | null
          total_steps?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
          workflow_stage?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          attachments: string[] | null
          comment: string | null
          created_at: string
          feature_id: string | null
          id: string
          rating: number | null
          review_link_id: string
          reviewer_email: string | null
          reviewer_name: string | null
          status: string | null
        }
        Insert: {
          attachments?: string[] | null
          comment?: string | null
          created_at?: string
          feature_id?: string | null
          id: string
          rating?: number | null
          review_link_id: string
          reviewer_email?: string | null
          reviewer_name?: string | null
          status?: string | null
        }
        Update: {
          attachments?: string[] | null
          comment?: string | null
          created_at?: string
          feature_id?: string | null
          id?: string
          rating?: number | null
          review_link_id?: string
          reviewer_email?: string | null
          reviewer_name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_review_link_id_fkey"
            columns: ["review_link_id"]
            isOneToOne: false
            referencedRelation: "review_links"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id: string
          invited_by?: string | null
          role?: string
          team_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_map_edges: {
        Row: {
          created_at: string
          id: string
          label: string | null
          mind_map_id: string
          source_node_id: string
          style: Json | null
          target_node_id: string
          type: string | null
        }
        Insert: {
          created_at?: string
          id: string
          label?: string | null
          mind_map_id: string
          source_node_id: string
          style?: Json | null
          target_node_id: string
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          mind_map_id?: string
          source_node_id?: string
          style?: Json | null
          target_node_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mind_map_edges_mind_map_id_fkey"
            columns: ["mind_map_id"]
            isOneToOne: false
            referencedRelation: "mind_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mind_map_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "mind_map_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mind_map_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "mind_map_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_map_nodes: {
        Row: {
          converted_to_feature_id: string | null
          created_at: string
          data: Json | null
          description: string | null
          height: number | null
          id: string
          label: string
          mind_map_id: string
          position_x: number
          position_y: number
          style: Json | null
          type: string
          updated_at: string
          width: number | null
        }
        Insert: {
          converted_to_feature_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          height?: number | null
          id: string
          label: string
          mind_map_id: string
          position_x: number
          position_y: number
          style?: Json | null
          type: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          converted_to_feature_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          height?: number | null
          id?: string
          label?: string
          mind_map_id?: string
          position_x?: number
          position_y?: number
          style?: Json | null
          type?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mind_map_nodes_mind_map_id_fkey"
            columns: ["mind_map_id"]
            isOneToOne: false
            referencedRelation: "mind_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_maps: {
        Row: {
          canvas_data: Json
          created_at: string
          id: string
          name: string
          updated_at: string
          viewport: Json | null
          workspace_id: string
        }
        Insert: {
          canvas_data?: Json
          created_at?: string
          id: string
          name?: string
          updated_at?: string
          viewport?: Json | null
          workspace_id: string
        }
        Update: {
          canvas_data?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          viewport?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mind_maps_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      review_links: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          name: string | null
          token: string
          type: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id: string
          is_active?: boolean | null
          name?: string | null
          token: string
          type: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          token?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_subscription_id: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id: string
          plan_id: string
          status: string
          stripe_subscription_id?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_subscription_id?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      success_metrics: {
        Row: {
          actual_value: number | null
          created_at: string
          feature_id: string | null
          id: string
          measured_at: string | null
          metric_name: string
          target_value: number | null
          unit: string | null
          workspace_id: string
        }
        Insert: {
          actual_value?: number | null
          created_at?: string
          feature_id?: string | null
          id: string
          measured_at?: string | null
          metric_name: string
          target_value?: number | null
          unit?: string | null
          workspace_id: string
        }
        Update: {
          actual_value?: number | null
          created_at?: string
          feature_id?: string | null
          id?: string
          measured_at?: string | null
          metric_name?: string
          target_value?: number | null
          unit?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_metrics_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_metrics_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          member_count: number
          name: string
          owner_id: string | null
          plan: string
          slug: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          member_count?: number
          name: string
          owner_id?: string | null
          plan?: string
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_count?: number
          name?: string
          owner_id?: string | null
          plan?: string
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          ai_memory: Json | null
          color: string
          created_at: string | null
          custom_instructions: string | null
          description: string | null
          enabled_modules: Json | null
          icon: string | null
          id: string
          name: string
          phase: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string
          workflow_config: Json | null
          workflow_mode_enabled: boolean | null
        }
        Insert: {
          ai_memory?: Json | null
          color?: string
          created_at?: string | null
          custom_instructions?: string | null
          description?: string | null
          enabled_modules?: Json | null
          icon?: string | null
          id: string
          name: string
          phase?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
          workflow_config?: Json | null
          workflow_mode_enabled?: boolean | null
        }
        Update: {
          ai_memory?: Json | null
          color?: string
          created_at?: string | null
          custom_instructions?: string | null
          description?: string | null
          enabled_modules?: Json | null
          icon?: string | null
          id?: string
          name?: string
          phase?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
          workflow_config?: Json | null
          workflow_mode_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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

// Helper type exports
export type User = Tables<"users">
export type Team = Tables<"teams">
export type TeamMember = Tables<"team_members">
export type Workspace = Tables<"workspaces">
export type Feature = Tables<"features">
export type MindMap = Tables<"mind_maps">
export type MindMapNode = Tables<"mind_map_nodes">
export type MindMapEdge = Tables<"mind_map_edges">
export type ReviewLink = Tables<"review_links">
export type Feedback = Tables<"feedback">
export type Subscription = Tables<"subscriptions">
export type Invitation = Tables<"invitations">
export type AIUsage = Tables<"ai_usage">
export type CustomDashboard = Tables<"custom_dashboards">
export type SuccessMetric = Tables<"success_metrics">
