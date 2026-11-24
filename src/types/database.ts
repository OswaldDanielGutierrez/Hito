
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activity_log": {
                  Row: {
                    "created_at": string,"entity_id": string | null,"entity_type": string | null,"id": number,"kind": Database["public"]['Enums']["change_kind"],"new_value": string | null,"old_value": string | null,"owner_id": string,"project_id": string,"reason": string | null,"summary": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: never,"kind": Database["public"]['Enums']["change_kind"],"new_value"?: string | null,"old_value"?: string | null,"owner_id"?: string,"project_id": string,"reason"?: string | null,"summary": string
                  }
                  Update: {
                    "created_at"?: string,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: never,"kind"?: Database["public"]['Enums']["change_kind"],"new_value"?: string | null,"old_value"?: string | null,"owner_id"?: string,"project_id"?: string,"reason"?: string | null,"summary"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_log_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "activity_log_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"alert_rules": {
                  Row: {
                    "days_before": number,"enabled": boolean,"id": string,"kind": Database["public"]['Enums']["alert_kind"],"owner_id": string,"project_id": string | null,"send_time": string
                  }
                  ComputedFields: never
                  Insert: {
                    "days_before"?: number,"enabled"?: boolean,"id"?: string,"kind": Database["public"]['Enums']["alert_kind"],"owner_id"?: string,"project_id"?: string | null,"send_time"?: string
                  }
                  Update: {
                    "days_before"?: number,"enabled"?: boolean,"id"?: string,"kind"?: Database["public"]['Enums']["alert_kind"],"owner_id"?: string,"project_id"?: string | null,"send_time"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "alert_rules_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "alert_rules_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "body": string | null,"channel": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["alert_kind"],"owner_id": string,"phase_id": string | null,"project_id": string | null,"read_at": string | null,"scheduled_for": string,"sent_at": string | null,"task_id": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"channel": string,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["alert_kind"],"owner_id"?: string,"phase_id"?: string | null,"project_id"?: string | null,"read_at"?: string | null,"scheduled_for": string,"sent_at"?: string | null,"task_id"?: string | null,"title": string
                  }
                  Update: {
                    "body"?: string | null,"channel"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["alert_kind"],"owner_id"?: string,"phase_id"?: string | null,"project_id"?: string | null,"read_at"?: string | null,"scheduled_for"?: string,"sent_at"?: string | null,"task_id"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_phase_id_fkey"
      columns: ["phase_id"]
isOneToOne: false
      referencedRelation: "phases"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "notifications_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"phase_templates": {
                  Row: {
                    "id": string,"name": string,"owner_id": string | null,"phases": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"owner_id"?: string | null,"phases": NonNullable<Json>
                  }
                  Update: {
                    "id"?: string,"name"?: string,"owner_id"?: string | null,"phases"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"phases": {
                  Row: {
                    "completed_at": string | null,"created_at": string,"estimated_date": string | null,"id": string,"name": string,"original_date": string | null,"owner_id": string,"position": number,"project_id": string,"status": Database["public"]['Enums']["phase_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"created_at"?: string,"estimated_date"?: string | null,"id"?: string,"name": string,"original_date"?: string | null,"owner_id"?: string,"position": number,"project_id": string,"status"?: Database["public"]['Enums']["phase_status"],"updated_at"?: string
                  }
                  Update: {
                    "completed_at"?: string | null,"created_at"?: string,"estimated_date"?: string | null,"id"?: string,"name"?: string,"original_date"?: string | null,"owner_id"?: string,"position"?: number,"project_id"?: string,"status"?: Database["public"]['Enums']["phase_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "phases_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "phases_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_contacts": {
                  Row: {
                    "created_at": string,"detail": string | null,"id": string,"name": string,"owner_id": string,"project_id": string,"role": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"detail"?: string | null,"id"?: string,"name": string,"owner_id"?: string,"project_id": string,"role"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"detail"?: string | null,"id"?: string,"name"?: string,"owner_id"?: string,"project_id"?: string,"role"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_contacts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_contacts_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_notes": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"owner_id": string,"position": number,"project_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"owner_id"?: string,"position"?: number,"project_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"owner_id"?: string,"position"?: number,"project_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_notes_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_notes_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"project_tags": {
                  Row: {
                    "owner_id": string,"project_id": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "owner_id"?: string,"project_id": string,"tag_id": string
                  }
                  Update: {
                    "owner_id"?: string,"project_id"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_tags_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "project_tags_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "project_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "archived_at": string | null,"area": string | null,"created_at": string,"description": string | null,"id": string,"name": string,"notepad": string,"owner_id": string,"responsible": string | null,"start_date": string | null,"status": Database["public"]['Enums']["project_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"area"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"notepad"?: string,"owner_id"?: string,"responsible"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"area"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"notepad"?: string,"owner_id"?: string,"responsible"?: string | null,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"quick_task_tags": {
                  Row: {
                    "owner_id": string,"quick_task_id": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "owner_id"?: string,"quick_task_id": string,"tag_id": string
                  }
                  Update: {
                    "owner_id"?: string,"quick_task_id"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quick_task_tags_quick_task_id_fkey"
      columns: ["quick_task_id"]
isOneToOne: false
      referencedRelation: "quick_tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quick_task_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"quick_tasks": {
                  Row: {
                    "created_at": string,"done": boolean,"done_at": string | null,"due_date": string | null,"id": string,"owner_id": string,"priority": Database["public"]['Enums']["task_priority"],"project_id": string | null,"requested_by": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"done"?: boolean,"done_at"?: string | null,"due_date"?: string | null,"id"?: string,"owner_id"?: string,"priority"?: Database["public"]['Enums']["task_priority"],"project_id"?: string | null,"requested_by"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"done"?: boolean,"done_at"?: string | null,"due_date"?: string | null,"id"?: string,"owner_id"?: string,"priority"?: Database["public"]['Enums']["task_priority"],"project_id"?: string | null,"requested_by"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quick_tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "quick_tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"resources": {
                  Row: {
                    "created_at": string,"id": string,"kind": Database["public"]['Enums']["resource_kind"],"name": string,"owner_id": string,"phase_id": string | null,"pinned": boolean,"project_id": string,"source": string | null,"storage_path": string | null,"updated_at": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["resource_kind"],"name": string,"owner_id"?: string,"phase_id"?: string | null,"pinned"?: boolean,"project_id": string,"source"?: string | null,"storage_path"?: string | null,"updated_at"?: string,"url"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["resource_kind"],"name"?: string,"owner_id"?: string,"phase_id"?: string | null,"pinned"?: boolean,"project_id"?: string,"source"?: string | null,"storage_path"?: string | null,"updated_at"?: string,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "resources_phase_id_fkey"
      columns: ["phase_id"]
isOneToOne: false
      referencedRelation: "phases"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resources_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "resources_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"tags": {
                  Row: {
                    "color": string,"created_at": string,"id": string,"name": string,"owner_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string,"created_at"?: string,"id"?: string,"name": string,"owner_id"?: string,"updated_at"?: string
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"id"?: string,"name"?: string,"owner_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"task_resources": {
                  Row: {
                    "owner_id": string,"resource_id": string,"task_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "owner_id"?: string,"resource_id": string,"task_id": string
                  }
                  Update: {
                    "owner_id"?: string,"resource_id"?: string,"task_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "task_resources_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "task_resources_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"tasks": {
                  Row: {
                    "blocked_reason": string | null,"completed_at": string | null,"created_at": string,"description": string | null,"due_date": string | null,"estimated_hours": number | null,"id": string,"owner_id": string,"parent_task_id": string | null,"phase_id": string,"position": number,"priority": Database["public"]['Enums']["task_priority"],"project_id": string,"state": Database["public"]['Enums']["task_state"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_reason"?: string | null,"completed_at"?: string | null,"created_at"?: string,"description"?: string | null,"due_date"?: string | null,"estimated_hours"?: number | null,"id"?: string,"owner_id"?: string,"parent_task_id"?: string | null,"phase_id": string,"position"?: number,"priority"?: Database["public"]['Enums']["task_priority"],"project_id": string,"state"?: Database["public"]['Enums']["task_state"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "blocked_reason"?: string | null,"completed_at"?: string | null,"created_at"?: string,"description"?: string | null,"due_date"?: string | null,"estimated_hours"?: number | null,"id"?: string,"owner_id"?: string,"parent_task_id"?: string | null,"phase_id"?: string,"position"?: number,"priority"?: Database["public"]['Enums']["task_priority"],"project_id"?: string,"state"?: Database["public"]['Enums']["task_state"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_parent_task_id_fkey"
      columns: ["parent_task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_phase_id_fkey"
      columns: ["phase_id"]
isOneToOne: false
      referencedRelation: "phases"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "project_overview"
      referencedColumns: ["project_id"]
    },{
      foreignKeyName: "tasks_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"user_settings": {
                  Row: {
                    "display_name": string | null,"email_address": string | null,"notify_email": boolean,"notify_in_app": boolean,"notify_teams": boolean,"timezone": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "display_name"?: string | null,"email_address"?: string | null,"notify_email"?: boolean,"notify_in_app"?: boolean,"notify_teams"?: boolean,"timezone"?: string,"user_id": string
                  }
                  Update: {
                    "display_name"?: string | null,"email_address"?: string | null,"notify_email"?: boolean,"notify_in_app"?: boolean,"notify_teams"?: boolean,"timezone"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "project_overview": {
                  Row: {
                    "area": string | null,"current_phase_id": string | null,"final_due_date": string | null,"name": string,"owner_id": string,"phases_done": number | null,"phases_total": number | null,"project_id": string,"resources_documents": number | null,"resources_flows_code": number | null,"resources_links": number | null,"start_date": string | null,"status": Database["public"]['Enums']["project_status"],"tasks_done": number | null,"tasks_total": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                           "area"?: string | null,"current_phase_id"?: never,"final_due_date"?: never,"name"?: string | null,"owner_id"?: string | null,"phases_done"?: never,"phases_total"?: never,"project_id"?: string | null,"resources_documents"?: never,"resources_flows_code"?: never,"resources_links"?: never,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"] | null,"tasks_done"?: never,"tasks_total"?: never,"updated_at"?: string | null
                         }
                        Update: {
                           "area"?: string | null,"current_phase_id"?: never,"final_due_date"?: never,"name"?: string | null,"owner_id"?: string | null,"phases_done"?: never,"phases_total"?: never,"project_id"?: string | null,"resources_documents"?: never,"resources_flows_code"?: never,"resources_links"?: never,"start_date"?: string | null,"status"?: Database["public"]['Enums']["project_status"] | null,"tasks_done"?: never,"tasks_total"?: never,"updated_at"?: string | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "alert_when":
{ Args: { "p_days": number }; Returns: string
                           },
"create_project":
{ Args: { "p_area": string,"p_description": string,"p_name": string,"p_notify_phase"?: boolean,"p_phases": Json,"p_resources"?: Json,"p_responsible": string,"p_start_date": string }; Returns: string
                           },
"dispatch_email_alerts":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"generate_alerts":
{ Args: { "p_today"?: string }; Returns: number
                           },
"move_phase":
{ Args: { "p_direction": string,"p_phase_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "alert_kind": "phase_due_soon"|"final_due"|"task_due"|"stale"|"overdue"|"weekly_summary","change_kind": "status"|"date"|"task"|"phase"|"scope","phase_status": "pending"|"in_progress"|"completed","project_status": "development"|"qa"|"production"|"delivered"|"on_hold","resource_kind": "document"|"flow"|"code"|"link","task_priority": "high"|"medium"|"low","task_state": "pending"|"in_progress"|"done"|"blocked"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "alert_kind": ["phase_due_soon", "final_due", "task_due", "stale", "overdue", "weekly_summary"],"change_kind": ["status", "date", "task", "phase", "scope"],"phase_status": ["pending", "in_progress", "completed"],"project_status": ["development", "qa", "production", "delivered", "on_hold"],"resource_kind": ["document", "flow", "code", "link"],"task_priority": ["high", "medium", "low"],"task_state": ["pending", "in_progress", "done", "blocked"]
          }
        }
} as const
