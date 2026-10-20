
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
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
            "account_deletion_requests": {
                  Row: {
                    "created_at": string,"requested_at": string,"scheduled_for": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"requested_at"?: string,"scheduled_for": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"requested_at"?: string,"scheduled_for"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"agencies": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"name": string,"plan_code": string,"referral_code": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"name": string,"plan_code"?: string,"referral_code"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"name"?: string,"plan_code"?: string,"referral_code"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "agencies_plan_code_fkey"
      columns: ["plan_code"]
isOneToOne: false
      referencedRelation: "plan_capabilities"
      referencedColumns: ["code"]
    }
                  ]
                },"agency_members": {
                  Row: {
                    "agency_id": string,"created_at": string,"role": Database["public"]['Enums']["agency_role"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "agency_id": string,"created_at"?: string,"role": Database["public"]['Enums']["agency_role"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "agency_id"?: string,"created_at"?: string,"role"?: Database["public"]['Enums']["agency_role"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "agency_members_agency_id_fkey"
      columns: ["agency_id"]
isOneToOne: false
      referencedRelation: "agencies"
      referencedColumns: ["id"]
    }
                  ]
                },"agency_wedding_staff": {
                  Row: {
                    "created_at": string,"updated_at": string,"user_id": string,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"updated_at"?: string,"user_id": string,"wedding_id": string
                  }
                  Update: {
                    "created_at"?: string,"updated_at"?: string,"user_id"?: string,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "agency_wedding_staff_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"agency_id": string | null,"id": number,"new_data": Json | null,"occurred_at": string,"old_data": Json | null,"record_id": string | null,"table_name": string,"wedding_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"agency_id"?: string | null,"id"?: never,"new_data"?: Json | null,"occurred_at"?: string,"old_data"?: Json | null,"record_id"?: string | null,"table_name": string,"wedding_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"agency_id"?: string | null,"id"?: never,"new_data"?: Json | null,"occurred_at"?: string,"old_data"?: Json | null,"record_id"?: string | null,"table_name"?: string,"wedding_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"consents": {
                  Row: {
                    "accepted_at": string,"created_at": string,"document": string,"id": string,"updated_at": string,"user_id": string,"version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string,"created_at"?: string,"document": string,"id"?: string,"updated_at"?: string,"user_id": string,"version": string
                  }
                  Update: {
                    "accepted_at"?: string,"created_at"?: string,"document"?: string,"id"?: string,"updated_at"?: string,"user_id"?: string,"version"?: string
                  }
                  Relationships: [
                    
                  ]
                },"couple_permissions": {
                  Row: {
                    "created_at": string,"level": Database["public"]['Enums']["access_level"],"module": string,"updated_at": string,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"level": Database["public"]['Enums']["access_level"],"module": string,"updated_at"?: string,"wedding_id": string
                  }
                  Update: {
                    "created_at"?: string,"level"?: Database["public"]['Enums']["access_level"],"module"?: string,"updated_at"?: string,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "couple_permissions_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"invites": {
                  Row: {
                    "agency_id": string | null,"created_at": string,"created_by": string,"expires_at": string,"id": string,"kind": Database["public"]['Enums']["invite_kind"],"revoked_at": string | null,"token_hash": string,"updated_at": string,"used_at": string | null,"used_by": string | null,"wedding_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "agency_id"?: string | null,"created_at"?: string,"created_by": string,"expires_at": string,"id"?: string,"kind": Database["public"]['Enums']["invite_kind"],"revoked_at"?: string | null,"token_hash": string,"updated_at"?: string,"used_at"?: string | null,"used_by"?: string | null,"wedding_id"?: string | null
                  }
                  Update: {
                    "agency_id"?: string | null,"created_at"?: string,"created_by"?: string,"expires_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["invite_kind"],"revoked_at"?: string | null,"token_hash"?: string,"updated_at"?: string,"used_at"?: string | null,"used_by"?: string | null,"wedding_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "invites_agency_id_fkey"
      columns: ["agency_id"]
isOneToOne: false
      referencedRelation: "agencies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_capabilities": {
                  Row: {
                    "audience": string,"capabilities": NonNullable<Json>,"code": string,"created_at": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "audience": string,"capabilities": NonNullable<Json>,"code": string,"created_at"?: string,"updated_at"?: string
                  }
                  Update: {
                    "audience"?: string,"capabilities"?: NonNullable<Json>,"code"?: string,"created_at"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"platform_admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"full_name": string | null,"id": string,"is_demo": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"full_name"?: string | null,"id": string,"is_demo"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"full_name"?: string | null,"id"?: string,"is_demo"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"wedding_members": {
                  Row: {
                    "created_at": string,"role": Database["public"]['Enums']["wedding_role"],"updated_at": string,"user_id": string,"wedding_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"role": Database["public"]['Enums']["wedding_role"],"updated_at"?: string,"user_id": string,"wedding_id": string
                  }
                  Update: {
                    "created_at"?: string,"role"?: Database["public"]['Enums']["wedding_role"],"updated_at"?: string,"user_id"?: string,"wedding_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "wedding_members_wedding_id_fkey"
      columns: ["wedding_id"]
isOneToOne: false
      referencedRelation: "weddings"
      referencedColumns: ["id"]
    }
                  ]
                },"weddings": {
                  Row: {
                    "agency_id": string | null,"city": string | null,"contact_email": string | null,"contact_phone": string | null,"couple_plan_code": string,"created_at": string,"created_by": string | null,"deletion_scheduled_for": string | null,"estimated_budget_cents": number | null,"estimated_guests": number | null,"id": string,"partner1_name": string,"partner2_name": string,"style": string | null,"updated_at": string,"venue_name": string | null,"wedding_date": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "agency_id"?: string | null,"city"?: string | null,"contact_email"?: string | null,"contact_phone"?: string | null,"couple_plan_code"?: string,"created_at"?: string,"created_by"?: string | null,"deletion_scheduled_for"?: string | null,"estimated_budget_cents"?: number | null,"estimated_guests"?: number | null,"id"?: string,"partner1_name": string,"partner2_name": string,"style"?: string | null,"updated_at"?: string,"venue_name"?: string | null,"wedding_date"?: string | null
                  }
                  Update: {
                    "agency_id"?: string | null,"city"?: string | null,"contact_email"?: string | null,"contact_phone"?: string | null,"couple_plan_code"?: string,"created_at"?: string,"created_by"?: string | null,"deletion_scheduled_for"?: string | null,"estimated_budget_cents"?: number | null,"estimated_guests"?: number | null,"id"?: string,"partner1_name"?: string,"partner2_name"?: string,"style"?: string | null,"updated_at"?: string,"venue_name"?: string | null,"wedding_date"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "weddings_agency_id_fkey"
      columns: ["agency_id"]
isOneToOne: false
      referencedRelation: "agencies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "weddings_couple_plan_code_fkey"
      columns: ["couple_plan_code"]
isOneToOne: false
      referencedRelation: "plan_capabilities"
      referencedColumns: ["code"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invite":
{ Args: { "p_token": string }; Returns: Json
                           },
"cancel_account_deletion":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"create_agency":
{ Args: { "p_name": string }; Returns: string
                           },
"create_agency_wedding":
{ Args: { "p_agency_id": string,"p_city"?: string,"p_contact_email"?: string,"p_contact_phone"?: string,"p_estimated_budget_cents"?: number,"p_estimated_guests"?: number,"p_partner1_name": string,"p_partner2_name": string,"p_style"?: string,"p_venue_name"?: string,"p_wedding_date": string }; Returns: string
                           },
"create_couple_wedding":
{ Args: { "p_city": string,"p_estimated_budget_cents": number,"p_estimated_guests": number,"p_partner1_name": string,"p_partner2_name": string,"p_style": string,"p_venue_name"?: string,"p_wedding_date": string }; Returns: string
                           },
"create_invite":
{ Args: { "p_agency_id"?: string,"p_kind": Database["public"]['Enums']["invite_kind"],"p_wedding_id"?: string }; Returns: string
                           },
"delete_agency_wedding":
{ Args: { "p_wedding_id": string }; Returns: undefined
                           },
"invite_preview":
{ Args: { "p_token": string }; Returns: Json
                           },
"request_account_deletion":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"revoke_invite":
{ Args: { "p_invite_id": string }; Returns: undefined
                           }
          }
          Enums: {
            "access_level": "none"|"view"|"edit","agency_role": "owner"|"staff","invite_kind": "couple"|"partner"|"staff","wedding_role": "couple"|"family"
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
            "access_level": ["none", "view", "edit"],"agency_role": ["owner", "staff"],"invite_kind": ["couple", "partner", "staff"],"wedding_role": ["couple", "family"]
          }
        }
} as const
