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
      connection_insights: {
        Row: {
          acknowledged_at: string | null
          action_taken: string | null
          action_taken_at: string | null
          affected_feature_count: number | null
          analysis_data: Json | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          detected_at: string | null
          detected_by: string | null
          detection_method: string | null
          evidence: Json | null
          expires_at: string | null
          id: string
          impact_assessment: string | null
          impact_score: number | null
          insight_type: string
          is_expired: boolean | null
          primary_feature_id: string | null
          priority: number | null
          recommendation: string | null
          related_feature_ids: string[] | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_acknowledged: boolean | null
          user_id: string
          user_notes: string | null
          workspace_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          action_taken?: string | null
          action_taken_at?: string | null
          affected_feature_count?: number | null
          analysis_data?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          detected_by?: string | null
          detection_method?: string | null
          evidence?: Json | null
          expires_at?: string | null
          id: string
          impact_assessment?: string | null
          impact_score?: number | null
          insight_type: string
          is_expired?: boolean | null
          primary_feature_id?: string | null
          priority?: number | null
          recommendation?: string | null
          related_feature_ids?: string[] | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_acknowledged?: boolean | null
          user_id?: string
          user_notes?: string | null
          workspace_id: string
        }
        Update: {
          acknowledged_at?: string | null
          action_taken?: string | null
          action_taken_at?: string | null
          affected_feature_count?: number | null
          analysis_data?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          detected_by?: string | null
          detection_method?: string | null
          evidence?: Json | null
          expires_at?: string | null
          id?: string
          impact_assessment?: string | null
          impact_score?: number | null
          insight_type?: string
          is_expired?: boolean | null
          primary_feature_id?: string | null
          priority?: number | null
          recommendation?: string | null
          related_feature_ids?: string[] | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_acknowledged?: boolean | null
          user_id?: string
          user_notes?: string | null
          workspace_id?: string
        }
        Relationships: []
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
      customer_insights: {
        Row: {
          ai_confidence: number | null
          ai_extracted: boolean | null
          ai_summary: string | null
          context: string | null
          created_at: string
          created_by: string | null
          customer_company: string | null
          customer_email: string | null
          customer_name: string | null
          customer_segment: string | null
          frequency: number | null
          id: string
          impact_score: number | null
          pain_point: string | null
          quote: string | null
          search_vector: unknown
          sentiment: string | null
          source: string
          source_date: string | null
          source_feedback_id: string | null
          source_url: string | null
          status: string | null
          tags: string[] | null
          team_id: string
          title: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_extracted?: boolean | null
          ai_summary?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_segment?: string | null
          frequency?: number | null
          id?: string
          impact_score?: number | null
          pain_point?: string | null
          quote?: string | null
          search_vector?: unknown
          sentiment?: string | null
          source: string
          source_date?: string | null
          source_feedback_id?: string | null
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          team_id: string
          title: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_extracted?: boolean | null
          ai_summary?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          customer_company?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_segment?: string | null
          frequency?: number | null
          id?: string
          impact_score?: number | null
          pain_point?: string | null
          quote?: string | null
          search_vector?: unknown
          sentiment?: string | null
          source?: string
          source_date?: string | null
          source_feedback_id?: string | null
          source_url?: string | null
          status?: string | null
          tags?: string[] | null
          team_id?: string
          title?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_insights_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_insights_source_feedback_id_fkey"
            columns: ["source_feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_insights_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_insights_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean
          name: string
          sort_order: number
          team_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
          team_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_steps: {
        Row: {
          actual_hours: number | null
          assignee: string | null
          blocked_by: string | null
          checklist_items: Json | null
          completed: boolean | null
          completed_date: string | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          estimated_hours: number | null
          feature_id: string
          id: string
          start_date: string | null
          status: string
          step_order: number
          title: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          actual_hours?: number | null
          assignee?: string | null
          blocked_by?: string | null
          checklist_items?: Json | null
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          estimated_hours?: number | null
          feature_id: string
          id: string
          start_date?: string | null
          status?: string
          step_order?: number
          title: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          actual_hours?: number | null
          assignee?: string | null
          blocked_by?: string | null
          checklist_items?: Json | null
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          estimated_hours?: number | null
          feature_id?: string
          id?: string
          start_date?: string | null
          status?: string
          step_order?: number
          title?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_steps_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_correlations: {
        Row: {
          category_similarity: number | null
          common_categories: string[] | null
          common_keywords: string[] | null
          confidence: number | null
          correlation_score: number | null
          correlation_type: string | null
          cosine_similarity: number | null
          created_at: string | null
          detected_at: string | null
          detection_algorithm_version: string | null
          detection_method: string | null
          feature_a_id: string
          feature_b_id: string
          id: string
          keyword_overlap_score: number | null
          relevance: number | null
          reviewed_at: string | null
          similarity_factors: Json | null
          status: string | null
          structural_similarity: number | null
          updated_at: string | null
          user_id: string
          user_notes: string | null
          user_rating: number | null
          user_reviewed: boolean | null
          workspace_id: string
        }
        Insert: {
          category_similarity?: number | null
          common_categories?: string[] | null
          common_keywords?: string[] | null
          confidence?: number | null
          correlation_score?: number | null
          correlation_type?: string | null
          cosine_similarity?: number | null
          created_at?: string | null
          detected_at?: string | null
          detection_algorithm_version?: string | null
          detection_method?: string | null
          feature_a_id: string
          feature_b_id: string
          id: string
          keyword_overlap_score?: number | null
          relevance?: number | null
          reviewed_at?: string | null
          similarity_factors?: Json | null
          status?: string | null
          structural_similarity?: number | null
          updated_at?: string | null
          user_id?: string
          user_notes?: string | null
          user_rating?: number | null
          user_reviewed?: boolean | null
          workspace_id: string
        }
        Update: {
          category_similarity?: number | null
          common_categories?: string[] | null
          common_keywords?: string[] | null
          confidence?: number | null
          correlation_score?: number | null
          correlation_type?: string | null
          cosine_similarity?: number | null
          created_at?: string | null
          detected_at?: string | null
          detection_algorithm_version?: string | null
          detection_method?: string | null
          feature_a_id?: string
          feature_b_id?: string
          id?: string
          keyword_overlap_score?: number | null
          relevance?: number | null
          reviewed_at?: string | null
          similarity_factors?: Json | null
          status?: string | null
          structural_similarity?: number | null
          updated_at?: string | null
          user_id?: string
          user_notes?: string | null
          user_rating?: number | null
          user_reviewed?: boolean | null
          workspace_id?: string
        }
        Relationships: []
      }
      feature_importance_scores: {
        Row: {
          blocking_count: number | null
          blocking_score: number | null
          business_value_score: number | null
          calculated_at: string | null
          calculation_method: string | null
          calculation_version: string | null
          calculation_weights: Json | null
          complexity_score: number | null
          connection_score: number | null
          correlation_count: number | null
          correlation_score: number | null
          created_at: string | null
          critical_path_position: number | null
          dependency_score: number | null
          feature_id: string
          id: string
          incoming_dependency_count: number | null
          is_bottleneck: boolean | null
          is_on_critical_path: boolean | null
          outgoing_dependency_count: number | null
          overall_score: number | null
          percentile: number | null
          priority_score: number | null
          total_connection_count: number | null
          updated_at: string | null
          user_id: string
          workflow_score: number | null
          workspace_id: string
          workspace_rank: number | null
        }
        Insert: {
          blocking_count?: number | null
          blocking_score?: number | null
          business_value_score?: number | null
          calculated_at?: string | null
          calculation_method?: string | null
          calculation_version?: string | null
          calculation_weights?: Json | null
          complexity_score?: number | null
          connection_score?: number | null
          correlation_count?: number | null
          correlation_score?: number | null
          created_at?: string | null
          critical_path_position?: number | null
          dependency_score?: number | null
          feature_id: string
          id: string
          incoming_dependency_count?: number | null
          is_bottleneck?: boolean | null
          is_on_critical_path?: boolean | null
          outgoing_dependency_count?: number | null
          overall_score?: number | null
          percentile?: number | null
          priority_score?: number | null
          total_connection_count?: number | null
          updated_at?: string | null
          user_id?: string
          workflow_score?: number | null
          workspace_id: string
          workspace_rank?: number | null
        }
        Update: {
          blocking_count?: number | null
          blocking_score?: number | null
          business_value_score?: number | null
          calculated_at?: string | null
          calculation_method?: string | null
          calculation_version?: string | null
          calculation_weights?: Json | null
          complexity_score?: number | null
          connection_score?: number | null
          correlation_count?: number | null
          correlation_score?: number | null
          created_at?: string | null
          critical_path_position?: number | null
          dependency_score?: number | null
          feature_id?: string
          id?: string
          incoming_dependency_count?: number | null
          is_bottleneck?: boolean | null
          is_on_critical_path?: boolean | null
          outgoing_dependency_count?: number | null
          overall_score?: number | null
          percentile?: number | null
          priority_score?: number | null
          total_connection_count?: number | null
          updated_at?: string | null
          user_id?: string
          workflow_score?: number | null
          workspace_id?: string
          workspace_rank?: number | null
        }
        Relationships: []
      }
      feature_resources: {
        Row: {
          actual_budget: number | null
          actual_hours: number | null
          api_requirements: string[] | null
          created_at: string | null
          currency: string | null
          estimated_budget: string | null
          estimated_hours: number | null
          external_dependencies: string[] | null
          feature_id: string
          id: string
          infrastructure_needs: string[] | null
          team_roles: Json | null
          technologies: string[] | null
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          actual_budget?: number | null
          actual_hours?: number | null
          api_requirements?: string[] | null
          created_at?: string | null
          currency?: string | null
          estimated_budget?: string | null
          estimated_hours?: number | null
          external_dependencies?: string[] | null
          feature_id: string
          id: string
          infrastructure_needs?: string[] | null
          team_roles?: Json | null
          technologies?: string[] | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          actual_budget?: number | null
          actual_hours?: number | null
          api_requirements?: string[] | null
          created_at?: string | null
          currency?: string | null
          estimated_budget?: string | null
          estimated_hours?: number | null
          external_dependencies?: string[] | null
          feature_id?: string
          id?: string
          infrastructure_needs?: string[] | null
          team_roles?: Json | null
          technologies?: string[] | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_resources_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: true
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          content: string
          context: string | null
          created_at: string
          decision: string | null
          decision_at: string | null
          decision_by: string | null
          decision_reason: string | null
          id: string
          implemented_in_id: string | null
          priority: string
          received_at: string
          source: string
          source_email: string | null
          source_name: string
          source_role: string | null
          status: string
          team_id: string
          updated_at: string
          work_item_id: string
          workspace_id: string
        }
        Insert: {
          content: string
          context?: string | null
          created_at?: string
          decision?: string | null
          decision_at?: string | null
          decision_by?: string | null
          decision_reason?: string | null
          id?: string
          implemented_in_id?: string | null
          priority?: string
          received_at?: string
          source: string
          source_email?: string | null
          source_name: string
          source_role?: string | null
          status?: string
          team_id: string
          updated_at?: string
          work_item_id: string
          workspace_id: string
        }
        Update: {
          content?: string
          context?: string | null
          created_at?: string
          decision?: string | null
          decision_at?: string | null
          decision_by?: string | null
          decision_reason?: string | null
          id?: string
          implemented_in_id?: string | null
          priority?: string
          received_at?: string
          source?: string
          source_email?: string | null
          source_name?: string
          source_role?: string | null
          status?: string
          team_id?: string
          updated_at?: string
          work_item_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_implemented_in_id_fkey"
            columns: ["implemented_in_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_votes: {
        Row: {
          created_at: string
          id: string
          insight_id: string
          team_id: string
          vote_type: string | null
          voter_email: string
          voter_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          insight_id: string
          team_id: string
          vote_type?: string | null
          voter_email: string
          voter_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          insight_id?: string
          team_id?: string
          vote_type?: string | null
          voter_email?: string
          voter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insight_votes_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "customer_insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_votes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_items: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          feature_id: string
          id: string
          image_url: string | null
          notes: string | null
          relevance_score: number | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          url: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          feature_id: string
          id: string
          image_url?: string | null
          notes?: string | null
          relevance_score?: number | null
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          feature_id?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          relevance_score?: number | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          url?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_items_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "work_items"
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
      linked_items: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          priority: string | null
          reason: string | null
          relationship_type: string
          source_item_id: string
          target_item_id: string
          team_id: string | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          priority?: string | null
          reason?: string | null
          relationship_type: string
          source_item_id: string
          target_item_id: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          priority?: string | null
          reason?: string | null
          relationship_type?: string
          source_item_id?: string
          target_item_id?: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "linked_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linked_items_source_item_id_fkey"
            columns: ["source_item_id"]
            isOneToOne: false
            referencedRelation: "timeline_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linked_items_target_item_id_fkey"
            columns: ["target_item_id"]
            isOneToOne: false
            referencedRelation: "timeline_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linked_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          actual_date: string | null
          created_at: string | null
          criteria: string[] | null
          critical_path: boolean | null
          dependencies: string[] | null
          description: string | null
          feature_id: string
          id: string
          name: string
          owner: string | null
          progress_percent: number | null
          status: string
          target_date: string | null
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          actual_date?: string | null
          created_at?: string | null
          criteria?: string[] | null
          critical_path?: boolean | null
          dependencies?: string[] | null
          description?: string | null
          feature_id: string
          id: string
          name: string
          owner?: string | null
          progress_percent?: number | null
          status?: string
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          actual_date?: string | null
          created_at?: string | null
          criteria?: string[] | null
          critical_path?: boolean | null
          dependencies?: string[] | null
          description?: string | null
          feature_id?: string
          id?: string
          name?: string
          owner?: string | null
          progress_percent?: number | null
          status?: string
          target_date?: string | null
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_map_edges: {
        Row: {
          created_at: string
          edge_type: string | null
          id: string
          label: string | null
          mind_map_id: string
          source_node_id: string
          style: Json | null
          target_node_id: string
          team_id: string
          type: string | null
        }
        Insert: {
          created_at?: string
          edge_type?: string | null
          id: string
          label?: string | null
          mind_map_id: string
          source_node_id: string
          style?: Json | null
          target_node_id: string
          team_id: string
          type?: string | null
        }
        Update: {
          created_at?: string
          edge_type?: string | null
          id?: string
          label?: string | null
          mind_map_id?: string
          source_node_id?: string
          style?: Json | null
          target_node_id?: string
          team_id?: string
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
          {
            foreignKeyName: "mind_map_edges_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_map_nodes: {
        Row: {
          converted_to_work_item_id: string | null
          created_at: string
          data: Json | null
          description: string | null
          height: number | null
          id: string
          mind_map_id: string
          node_type: string
          position: Json
          referenced_work_item_id: string | null
          shape_type: string | null
          style: Json | null
          team_id: string
          title: string
          updated_at: string
          width: number | null
        }
        Insert: {
          converted_to_work_item_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          height?: number | null
          id: string
          mind_map_id: string
          node_type: string
          position?: Json
          referenced_work_item_id?: string | null
          shape_type?: string | null
          style?: Json | null
          team_id: string
          title: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          converted_to_work_item_id?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          height?: number | null
          id?: string
          mind_map_id?: string
          node_type?: string
          position?: Json
          referenced_work_item_id?: string | null
          shape_type?: string | null
          style?: Json | null
          team_id?: string
          title?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mind_map_nodes_converted_to_work_item_id_fkey"
            columns: ["converted_to_work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mind_map_nodes_mind_map_id_fkey"
            columns: ["mind_map_id"]
            isOneToOne: false
            referencedRelation: "mind_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mind_map_nodes_referenced_work_item_id_fkey"
            columns: ["referenced_work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mind_map_nodes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_maps: {
        Row: {
          canvas_data: Json
          canvas_type: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          team_id: string
          updated_at: string
          user_id: string | null
          viewport: Json | null
          workspace_id: string
        }
        Insert: {
          canvas_data?: Json
          canvas_type?: string | null
          created_at?: string
          description?: string | null
          id: string
          name?: string
          team_id: string
          updated_at?: string
          user_id?: string | null
          viewport?: Json | null
          workspace_id: string
        }
        Update: {
          canvas_data?: Json
          canvas_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          team_id?: string
          updated_at?: string
          user_id?: string | null
          viewport?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mind_maps_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mind_maps_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      prerequisites: {
        Row: {
          category: string | null
          completion_date: string | null
          created_at: string | null
          display_order: number | null
          feature_id: string
          id: string
          notes: string | null
          prerequisite_text: string
          status: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          completion_date?: string | null
          created_at?: string | null
          display_order?: number | null
          feature_id: string
          id: string
          notes?: string | null
          prerequisite_text: string
          status?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          completion_date?: string | null
          created_at?: string | null
          display_order?: number | null
          feature_id?: string
          id?: string
          notes?: string | null
          prerequisite_text?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prerequisites_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      product_strategies: {
        Row: {
          calculated_progress: number | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          metric_current: number | null
          metric_name: string | null
          metric_target: number | null
          metric_unit: string | null
          owner_id: string | null
          parent_id: string | null
          progress: number | null
          progress_mode: string | null
          sort_order: number | null
          start_date: string | null
          status: string | null
          target_date: string | null
          team_id: string
          title: string
          type: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          calculated_progress?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metric_current?: number | null
          metric_name?: string | null
          metric_target?: number | null
          metric_unit?: string | null
          owner_id?: string | null
          parent_id?: string | null
          progress?: number | null
          progress_mode?: string | null
          sort_order?: number | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          team_id: string
          title: string
          type: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          calculated_progress?: number | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metric_current?: number | null
          metric_name?: string | null
          metric_target?: number | null
          metric_unit?: string | null
          owner_id?: string | null
          parent_id?: string | null
          progress?: number | null
          progress_mode?: string | null
          sort_order?: number | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          team_id?: string
          title?: string
          type?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_strategies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_strategies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_strategies_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_strategies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          order_index: number
          priority: string | null
          status: string
          task_type: string
          team_id: string
          timeline_item_id: string | null
          title: string
          updated_at: string
          work_item_id: string | null
          workspace_id: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id: string
          order_index?: number
          priority?: string | null
          status?: string
          task_type?: string
          team_id: string
          timeline_item_id?: string | null
          title: string
          updated_at?: string
          work_item_id?: string | null
          workspace_id: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          order_index?: number
          priority?: string | null
          status?: string
          task_type?: string
          team_id?: string
          timeline_item_id?: string | null
          title?: string
          updated_at?: string
          work_item_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tasks_timeline_item_id_fkey"
            columns: ["timeline_item_id"]
            isOneToOne: false
            referencedRelation: "timeline_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tasks_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          changes: Json | null
          id: string
          performed_at: string
          resource_id: string
          team_id: string
          work_item_id: string | null
          workspace_id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          changes?: Json | null
          id?: string
          performed_at?: string
          resource_id: string
          team_id: string
          work_item_id?: string | null
          workspace_id: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          changes?: Json | null
          id?: string
          performed_at?: string
          resource_id?: string
          team_id?: string
          work_item_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_audit_log_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_audit_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_audit_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          favicon_url: string | null
          id: string
          image_url: string | null
          is_deleted: boolean
          last_modified_by: string | null
          notes: string | null
          resource_type: string
          search_vector: unknown
          source_domain: string | null
          team_id: string
          title: string
          updated_at: string
          url: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          favicon_url?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          last_modified_by?: string | null
          notes?: string | null
          resource_type?: string
          search_vector?: unknown
          source_domain?: string | null
          team_id: string
          title: string
          updated_at?: string
          url?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          favicon_url?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          last_modified_by?: string | null
          notes?: string | null
          resource_type?: string
          search_vector?: unknown
          source_domain?: string | null
          team_id?: string
          title?: string
          updated_at?: string
          url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_workspace_id_fkey"
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
      risks: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          feature_id: string
          id: string
          identified_date: string | null
          mitigation: string | null
          owner: string | null
          probability: string
          review_date: string | null
          risk_score: number | null
          severity: string
          status: string
          updated_at: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          feature_id: string
          id: string
          identified_date?: string | null
          mitigation?: string | null
          owner?: string | null
          probability?: string
          review_date?: string | null
          risk_score?: number | null
          severity?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          feature_id?: string
          id?: string
          identified_date?: string | null
          mitigation?: string | null
          owner?: string | null
          probability?: string
          review_date?: string | null
          risk_score?: number | null
          severity?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risks_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "work_items"
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
            referencedRelation: "work_items"
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
      timeline_items: {
        Row: {
          actual_end_date: string | null
          actual_hours: number | null
          actual_start_date: string | null
          assigned_to: string | null
          blockers: Json | null
          category: string[] | null
          created_at: string | null
          description: string | null
          difficulty: string
          estimated_hours: number | null
          id: string
          integration_type: string | null
          is_blocked: boolean
          phase: string | null
          planned_end_date: string | null
          planned_start_date: string | null
          progress_percent: number | null
          status: string | null
          team_id: string | null
          timeline: string
          updated_at: string | null
          user_id: string | null
          work_item_id: string
          workspace_id: string | null
        }
        Insert: {
          actual_end_date?: string | null
          actual_hours?: number | null
          actual_start_date?: string | null
          assigned_to?: string | null
          blockers?: Json | null
          category?: string[] | null
          created_at?: string | null
          description?: string | null
          difficulty: string
          estimated_hours?: number | null
          id?: string
          integration_type?: string | null
          is_blocked?: boolean
          phase?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          progress_percent?: number | null
          status?: string | null
          team_id?: string | null
          timeline: string
          updated_at?: string | null
          user_id?: string | null
          work_item_id: string
          workspace_id?: string | null
        }
        Update: {
          actual_end_date?: string | null
          actual_hours?: number | null
          actual_start_date?: string | null
          assigned_to?: string | null
          blockers?: Json | null
          category?: string[] | null
          created_at?: string | null
          description?: string | null
          difficulty?: string
          estimated_hours?: number | null
          id?: string
          integration_type?: string | null
          is_blocked?: boolean
          phase?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          progress_percent?: number | null
          status?: string | null
          team_id?: string | null
          timeline?: string
          updated_at?: string | null
          user_id?: string | null
          work_item_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_items_feature_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_phase_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          can_edit: boolean
          id: string
          is_lead: boolean
          notes: string | null
          phase: string
          team_id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          can_edit?: boolean
          id?: string
          is_lead?: boolean
          notes?: string | null
          phase: string
          team_id: string
          user_id: string
          workspace_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          can_edit?: boolean
          id?: string
          is_lead?: boolean
          notes?: string | null
          phase?: string
          team_id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_phase_team"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_phase_assignments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          ai_memory: Json | null
          created_at: string | null
          custom_instructions: string | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_memory?: Json | null
          created_at?: string | null
          custom_instructions?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_memory?: Json | null
          created_at?: string | null
          custom_instructions?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      work_flows: {
        Row: {
          canvas_position: Json | null
          child_count: number | null
          color: string | null
          created_at: string | null
          depth: number | null
          description: string | null
          id: string
          is_collapsed: boolean | null
          name: string
          parent_flow_id: string | null
          team_id: string
          updated_at: string | null
          viewport: Json | null
          work_item_count: number | null
          workspace_id: string
        }
        Insert: {
          canvas_position?: Json | null
          child_count?: number | null
          color?: string | null
          created_at?: string | null
          depth?: number | null
          description?: string | null
          id?: string
          is_collapsed?: boolean | null
          name: string
          parent_flow_id?: string | null
          team_id: string
          updated_at?: string | null
          viewport?: Json | null
          work_item_count?: number | null
          workspace_id: string
        }
        Update: {
          canvas_position?: Json | null
          child_count?: number | null
          color?: string | null
          created_at?: string | null
          depth?: number | null
          description?: string | null
          id?: string
          is_collapsed?: boolean | null
          name?: string
          parent_flow_id?: string | null
          team_id?: string
          updated_at?: string | null
          viewport?: Json | null
          work_item_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_flows_parent_flow_id_fkey"
            columns: ["parent_flow_id"]
            isOneToOne: false
            referencedRelation: "work_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_flows_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_flows_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_connections: {
        Row: {
          confidence: number | null
          connection_type: string
          created_at: string | null
          discovered_at: string | null
          discovered_by: string | null
          evidence: Json | null
          id: string
          is_bidirectional: boolean | null
          last_reviewed_at: string | null
          reason: string | null
          source_work_item_id: string
          status: string | null
          strength: number | null
          target_work_item_id: string
          updated_at: string | null
          user_confirmed: boolean | null
          user_id: string
          user_rejected: boolean | null
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          connection_type: string
          created_at?: string | null
          discovered_at?: string | null
          discovered_by?: string | null
          evidence?: Json | null
          id: string
          is_bidirectional?: boolean | null
          last_reviewed_at?: string | null
          reason?: string | null
          source_work_item_id: string
          status?: string | null
          strength?: number | null
          target_work_item_id: string
          updated_at?: string | null
          user_confirmed?: boolean | null
          user_id?: string
          user_rejected?: boolean | null
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          connection_type?: string
          created_at?: string | null
          discovered_at?: string | null
          discovered_by?: string | null
          evidence?: Json | null
          id?: string
          is_bidirectional?: boolean | null
          last_reviewed_at?: string | null
          reason?: string | null
          source_work_item_id?: string
          status?: string | null
          strength?: number | null
          target_work_item_id?: string
          updated_at?: string | null
          user_confirmed?: boolean | null
          user_id?: string
          user_rejected?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_connections_source_work_item_id_fkey"
            columns: ["source_work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_connections_target_work_item_id_fkey"
            columns: ["target_work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_connections_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_insights: {
        Row: {
          id: string
          insight_id: string
          linked_at: string
          linked_by: string | null
          notes: string | null
          relevance_score: number | null
          team_id: string
          work_item_id: string
        }
        Insert: {
          id?: string
          insight_id: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          relevance_score?: number | null
          team_id: string
          work_item_id: string
        }
        Update: {
          id?: string
          insight_id?: string
          linked_at?: string
          linked_by?: string | null
          notes?: string | null
          relevance_score?: number | null
          team_id?: string
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_insights_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "customer_insights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_insights_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_insights_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_insights_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_resources: {
        Row: {
          added_at: string
          added_by: string
          context_note: string | null
          display_order: number
          is_unlinked: boolean
          resource_id: string
          tab_type: string
          team_id: string
          unlinked_at: string | null
          unlinked_by: string | null
          work_item_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          context_note?: string | null
          display_order?: number
          is_unlinked?: boolean
          resource_id: string
          tab_type?: string
          team_id: string
          unlinked_at?: string | null
          unlinked_by?: string | null
          work_item_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          context_note?: string | null
          display_order?: number
          is_unlinked?: boolean
          resource_id?: string
          tab_type?: string
          team_id?: string
          unlinked_at?: string | null
          unlinked_by?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_resources_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_resources_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_resources_unlinked_by_fkey"
            columns: ["unlinked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_resources_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      work_item_strategies: {
        Row: {
          alignment_strength: string | null
          created_at: string | null
          id: string
          notes: string | null
          strategy_id: string
          work_item_id: string
        }
        Insert: {
          alignment_strength?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          strategy_id: string
          work_item_id: string
        }
        Update: {
          alignment_strength?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          strategy_id?: string
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_item_strategies_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "product_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_item_strategies_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      work_items: {
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
          canvas_metadata: Json | null
          canvas_position: Json | null
          category: string | null
          completed_steps: number | null
          contributors: string[] | null
          conversion_chain: Json | null
          conversion_reason: string | null
          converted_at: string | null
          converted_by: string | null
          converted_from_id: string | null
          converted_from_type: string | null
          created_at: string | null
          created_by: string | null
          customer_impact: string | null
          definition_of_done: string[] | null
          department_id: string | null
          duration_days: number | null
          effort_confidence: string | null
          estimated_hours: number | null
          flow_id: string | null
          health: string | null
          id: string
          is_blocked: boolean | null
          is_epic: boolean
          is_note: boolean | null
          is_placeholder: boolean | null
          last_modified_by: string | null
          last_viewed_at: string | null
          name: string
          note_content: string | null
          note_type: string | null
          owner: string | null
          parent_id: string | null
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
          strategy_id: string | null
          success_metrics: Json | null
          tags: string[] | null
          target_release: string | null
          team_id: string | null
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
          canvas_metadata?: Json | null
          canvas_position?: Json | null
          category?: string | null
          completed_steps?: number | null
          contributors?: string[] | null
          conversion_chain?: Json | null
          conversion_reason?: string | null
          converted_at?: string | null
          converted_by?: string | null
          converted_from_id?: string | null
          converted_from_type?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_impact?: string | null
          definition_of_done?: string[] | null
          department_id?: string | null
          duration_days?: number | null
          effort_confidence?: string | null
          estimated_hours?: number | null
          flow_id?: string | null
          health?: string | null
          id?: string
          is_blocked?: boolean | null
          is_epic?: boolean
          is_note?: boolean | null
          is_placeholder?: boolean | null
          last_modified_by?: string | null
          last_viewed_at?: string | null
          name: string
          note_content?: string | null
          note_type?: string | null
          owner?: string | null
          parent_id?: string | null
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
          strategy_id?: string | null
          success_metrics?: Json | null
          tags?: string[] | null
          target_release?: string | null
          team_id?: string | null
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
          canvas_metadata?: Json | null
          canvas_position?: Json | null
          category?: string | null
          completed_steps?: number | null
          contributors?: string[] | null
          conversion_chain?: Json | null
          conversion_reason?: string | null
          converted_at?: string | null
          converted_by?: string | null
          converted_from_id?: string | null
          converted_from_type?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_impact?: string | null
          definition_of_done?: string[] | null
          department_id?: string | null
          duration_days?: number | null
          effort_confidence?: string | null
          estimated_hours?: number | null
          flow_id?: string | null
          health?: string | null
          id?: string
          is_blocked?: boolean | null
          is_epic?: boolean
          is_note?: boolean | null
          is_placeholder?: boolean | null
          last_modified_by?: string | null
          last_viewed_at?: string | null
          name?: string
          note_content?: string | null
          note_type?: string | null
          owner?: string | null
          parent_id?: string | null
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
          strategy_id?: string | null
          success_metrics?: Json | null
          tags?: string[] | null
          target_release?: string | null
          team_id?: string | null
          total_steps?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
          workflow_stage?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "features_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_converted_by_fkey"
            columns: ["converted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "work_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "product_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
          mode: string
          mode_changed_at: string | null
          mode_settings: Json | null
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
          mode?: string
          mode_changed_at?: string | null
          mode_settings?: Json | null
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
          mode?: string
          mode_changed_at?: string | null
          mode_settings?: Json | null
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
      cron_job_status: {
        Row: {
          active: boolean | null
          database: string | null
          jobid: number | null
          jobname: string | null
          schedule: string | null
          username: string | null
        }
        Insert: {
          active?: boolean | null
          database?: string | null
          jobid?: number | null
          jobname?: string | null
          schedule?: string | null
          username?: string | null
        }
        Update: {
          active?: boolean | null
          database?: string | null
          jobid?: number | null
          jobname?: string | null
          schedule?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      advance_feature_stage: {
        Args: { advanced_by?: string; feature_id_param: string; notes?: string }
        Returns: string
      }
      analyze_critical_path: {
        Args: { workspace_id_param: string }
        Returns: number
      }
      analyze_workspace: { Args: { workspace_id_param: string }; Returns: Json }
      are_features_connected: {
        Args: { feature_a_id: string; feature_b_id: string }
        Returns: boolean
      }
      calculate_importance_score: {
        Args: { feature_id_param: string }
        Returns: number
      }
      calculate_stage_completion: {
        Args: { feature_id_param: string }
        Returns: number
      }
      calculate_strategy_progress: {
        Args: { strategy_id_param: string }
        Returns: number
      }
      calculate_text_similarity: {
        Args: { text1: string; text2: string }
        Returns: number
      }
      calculate_work_item_progress: {
        Args: { p_work_item_id: string }
        Returns: number
      }
      calculate_work_item_status: {
        Args: { p_work_item_id: string }
        Returns: string
      }
      check_stage_readiness: {
        Args: { feature_id_param: string }
        Returns: boolean
      }
      create_bidirectional_connection: {
        Args: {
          p_confidence?: number
          p_connection_type: string
          p_discovered_by?: string
          p_feature_a_id: string
          p_feature_b_id: string
          p_reason?: string
          p_strength?: number
          p_user_id: string
          p_workspace_id: string
        }
        Returns: string
      }
      create_insight: {
        Args: {
          p_confidence_score?: number
          p_description: string
          p_detection_method?: string
          p_insight_type: string
          p_primary_feature_id?: string
          p_recommendation?: string
          p_related_feature_ids?: string[]
          p_severity?: string
          p_title: string
          p_workspace_id: string
        }
        Returns: string
      }
      detect_bottlenecks: {
        Args: { workspace_id_param: string }
        Returns: number
      }
      detect_orphaned_features: {
        Args: { workspace_id_param: string }
        Returns: number
      }
      detect_workspace_correlations: {
        Args: { min_threshold?: number; workspace_id_param: string }
        Returns: number
      }
      find_feature_correlations: {
        Args: { feature_id_param: string; min_threshold?: number }
        Returns: {
          common_keywords: string[]
          correlated_feature_id: string
          correlation_score: number
          cosine_sim: number
          keyword_overlap: number
        }[]
      }
      generate_text_id: { Args: never; Returns: string }
      get_connection_count: {
        Args: { feature_id_param: string }
        Returns: number
      }
      get_conversion_lineage: {
        Args: { work_item_id_param: string }
        Returns: Json
      }
      get_feature_connections: {
        Args: { feature_id_param: string }
        Returns: {
          confidence: number
          connection_id: string
          connection_type: string
          direction: string
          reason: string
          related_feature_id: string
          status: string
          strength: number
        }[]
      }
      get_feature_correlations: {
        Args: { feature_id_param: string; min_score?: number }
        Returns: {
          common_keywords: string[]
          confidence: number
          correlated_feature_id: string
          correlation_id: string
          correlation_score: number
          correlation_type: string
          status: string
        }[]
      }
      get_resource_history: {
        Args: { resource_id_param: string }
        Returns: {
          action: string
          actor_email: string
          actor_id: string
          changes: Json
          performed_at: string
          work_item_id: string
        }[]
      }
      get_timeline_dependencies: {
        Args: { timeline_item_id_param: string }
        Returns: Json
      }
      get_top_important_features: {
        Args: { limit_count?: number; workspace_id_param: string }
        Returns: {
          feature_id: string
          is_bottleneck: boolean
          is_on_critical_path: boolean
          overall_score: number
          workspace_rank: number
        }[]
      }
      get_work_item_conversion_lineage: {
        Args: { work_item_id_param: string }
        Returns: Json
      }
      get_work_item_dependencies_aggregated: {
        Args: { work_item_id_param: string }
        Returns: Json
      }
      get_work_item_descendants: {
        Args: { work_item_id_param: string }
        Returns: Json
      }
      get_work_item_tasks: {
        Args: { work_item_id_param: string }
        Returns: Json
      }
      get_workspace_insights: {
        Args: {
          limit_count?: number
          min_severity?: string
          workspace_id_param: string
        }
        Returns: {
          confidence_score: number
          description: string
          detected_at: string
          insight_id: string
          insight_type: string
          primary_feature_id: string
          priority: number
          recommendation: string
          related_feature_ids: string[]
          severity: string
          title: string
        }[]
      }
      get_workspace_task_stats: {
        Args: { workspace_id_param: string }
        Returns: Json
      }
      manual_purge_all_deleted: { Args: { days?: number }; Returns: Json }
      purge_deleted_resources: { Args: { days?: number }; Returns: number }
      purge_soft_deleted: {
        Args: { days?: number; table_name: string }
        Returns: number
      }
      purge_unlinked_work_item_resources: {
        Args: { days?: number }
        Returns: number
      }
      recalculate_workspace_importance: {
        Args: { workspace_id_param: string }
        Returns: number
      }
      search_resources: {
        Args: {
          p_include_deleted?: boolean
          p_limit?: number
          p_offset?: number
          p_query: string
          p_resource_type?: string
          p_team_id: string
          p_workspace_id?: string
        }
        Returns: {
          created_at: string
          created_by: string
          description: string
          id: string
          image_url: string
          is_deleted: boolean
          linked_work_items_count: number
          notes: string
          resource_type: string
          search_rank: number
          source_domain: string
          title: string
          url: string
        }[]
      }
      user_is_team_admin: { Args: { p_team_id: string }; Returns: boolean }
      user_is_team_member: { Args: { p_team_id: string }; Returns: boolean }
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
