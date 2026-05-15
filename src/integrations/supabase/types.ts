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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ammo_settings: {
        Row: {
          forced_server_slug: string | null
          id: number
          max_qty: number
          min_qty: number
          price_per_1000: number
          step_qty: number
          updated_at: string
        }
        Insert: {
          forced_server_slug?: string | null
          id?: number
          max_qty?: number
          min_qty?: number
          price_per_1000?: number
          step_qty?: number
          updated_at?: string
        }
        Update: {
          forced_server_slug?: string | null
          id?: number
          max_qty?: number
          min_qty?: number
          price_per_1000?: number
          step_qty?: number
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          color: string
          created_at: string
          dismissible: boolean
          effect: string
          ends_at: string | null
          id: string
          message: string
          sort_order: number
          starts_at: string | null
          tag: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          dismissible?: boolean
          effect?: string
          ends_at?: string | null
          id?: string
          message?: string
          sort_order?: number
          starts_at?: string | null
          tag?: string
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          dismissible?: boolean
          effect?: string
          ends_at?: string | null
          id?: string
          message?: string
          sort_order?: number
          starts_at?: string | null
          tag?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          image_url: string | null
          pinned: boolean
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          pinned?: boolean
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          pinned?: boolean
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          ammo_packs: number | null
          amount_brl: number
          contact_email: string
          contact_whatsapp: string | null
          created_at: string
          delivered_at: string | null
          id: string
          nick: string
          notes: string | null
          paid_at: string | null
          payment_provider: string | null
          payment_reference: string | null
          plan_tier: string | null
          product_type: string
          server_slug: string
          status: string
          steamid: string | null
          user_id: string | null
        }
        Insert: {
          ammo_packs?: number | null
          amount_brl: number
          contact_email: string
          contact_whatsapp?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          nick: string
          notes?: string | null
          paid_at?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          plan_tier?: string | null
          product_type: string
          server_slug: string
          status?: string
          steamid?: string | null
          user_id?: string | null
        }
        Update: {
          ammo_packs?: number | null
          amount_brl?: number
          contact_email?: string
          contact_whatsapp?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          nick?: string
          notes?: string | null
          paid_at?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          plan_tier?: string | null
          product_type?: string
          server_slug?: string
          status?: string
          steamid?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          description: string | null
          enabled: boolean
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          id: string
          label: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          enabled?: boolean
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          highlight: boolean
          id: string
          label: string
          perks: Json
          price_brl: number
          sort_order: number
          tier: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          highlight?: boolean
          id?: string
          label: string
          perks?: Json
          price_brl: number
          sort_order?: number
          tier: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          highlight?: boolean
          id?: string
          label?: string
          perks?: Json
          price_brl?: number
          sort_order?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean
          created_at: string
          email: string | null
          id: string
          nick: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          email?: string | null
          id: string
          nick?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nick?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          notes: string | null
          occurred_at: string
          reported_nick: string
          reporter_name: string
          reporter_nick: string
          status: string
          user_id: string | null
          video_path: string | null
          video_url: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at: string
          reported_nick: string
          reporter_name: string
          reporter_nick: string
          status?: string
          user_id?: string | null
          video_path?: string | null
          video_url?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          reported_nick?: string
          reporter_name?: string
          reporter_nick?: string
          status?: string
          user_id?: string | null
          video_path?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      servers: {
        Row: {
          coming_soon: boolean
          commands: Json
          country: string
          created_at: string
          description: string
          flag: string
          ip: string
          mode: string
          name: string
          port: number
          rules: Json
          short: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          coming_soon?: boolean
          commands?: Json
          country?: string
          created_at?: string
          description?: string
          flag?: string
          ip?: string
          mode?: string
          name: string
          port?: number
          rules?: Json
          short: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          coming_soon?: boolean
          commands?: Json
          country?: string
          created_at?: string
          description?: string
          flag?: string
          ip?: string
          mode?: string
          name?: string
          port?: number
          rules?: Json
          short?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_admins: {
        Row: {
          active: boolean
          created_at: string
          display: string
          id: string
          name: string
          phone: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          display: string
          id?: string
          name: string
          phone: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          display?: string
          id?: string
          name?: string
          phone?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
