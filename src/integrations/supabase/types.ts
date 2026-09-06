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
      appointment_history: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          status_anterior:
            | Database["public"]["Enums"]["appointment_status"]
            | null
          status_novo: Database["public"]["Enums"]["appointment_status"]
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          status_anterior?:
            | Database["public"]["Enums"]["appointment_status"]
            | null
          status_novo: Database["public"]["Enums"]["appointment_status"]
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          status_anterior?:
            | Database["public"]["Enums"]["appointment_status"]
            | null
          status_novo?: Database["public"]["Enums"]["appointment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "appointment_history_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cliente_id: string
          created_at: string
          data: string
          hora_fim: string
          hora_inicio: string
          id: string
          observacao: string | null
          preco: number
          servico_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          subscription_id: string | null
          tipo_atendimento: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data: string
          hora_fim: string
          hora_inicio: string
          id?: string
          observacao?: string | null
          preco?: number
          servico_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          subscription_id?: string | null
          tipo_atendimento?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          observacao?: string | null
          preco?: number
          servico_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          subscription_id?: string | null
          tipo_atendimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_slots: {
        Row: {
          created_at: string
          data: string
          hora_fim: string
          hora_inicio: string
          id: string
          motivo: string | null
        }
        Insert: {
          created_at?: string
          data: string
          hora_fim: string
          hora_inicio: string
          id?: string
          motivo?: string | null
        }
        Update: {
          created_at?: string
          data?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          motivo?: string | null
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          ativo: boolean
          dia_semana: number
          hora_abertura: string
          hora_fechamento: string
          id: string
        }
        Insert: {
          ativo?: boolean
          dia_semana: number
          hora_abertura: string
          hora_fechamento: string
          id?: string
        }
        Update: {
          ativo?: boolean
          dia_semana?: number
          hora_abertura?: string
          hora_fechamento?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          ativo: boolean
          consome_barba: boolean
          consome_corte: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
          preco: number
        }
        Insert: {
          ativo?: boolean
          consome_barba?: boolean
          consome_corte?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          preco: number
        }
        Update: {
          ativo?: boolean
          consome_barba?: boolean
          consome_corte?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          preco?: number
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ativo: boolean
          barbas_limite: number | null
          cortes_limite: number | null
          duracao_dias: number
          id: string
          ilimitado: boolean
          nome: string
          ordem: number
          permite_barba: boolean
          permite_corte: boolean
          preco: number
          tipo: string
        }
        Insert: {
          ativo?: boolean
          barbas_limite?: number | null
          cortes_limite?: number | null
          duracao_dias?: number
          id?: string
          ilimitado?: boolean
          nome: string
          ordem?: number
          permite_barba?: boolean
          permite_corte?: boolean
          preco: number
          tipo: string
        }
        Update: {
          ativo?: boolean
          barbas_limite?: number | null
          cortes_limite?: number | null
          duracao_dias?: number
          id?: string
          ilimitado?: boolean
          nome?: string
          ordem?: number
          permite_barba?: boolean
          permite_corte?: boolean
          preco?: number
          tipo?: string
        }
        Relationships: []
      }
      subscription_usage: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          quantidade: number
          subscription_id: string
          tipo_beneficio: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          quantidade?: number
          subscription_id: string
          tipo_beneficio: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          quantidade?: number
          subscription_id?: string
          tipo_beneficio?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_usage_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cliente_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          plano_id: string
          status: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_fim: string
          data_inicio?: string
          id?: string
          plano_id: string
          status?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          plano_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_appointment: {
        Args: {
          p_cliente_id: string
          p_data: string
          p_hora: string
          p_servico_id: string
          p_usar_assinatura: boolean
        }
        Returns: Json
      }
      cancel_appointment: { Args: { p_id: string }; Returns: Json }
      complete_appointment: { Args: { p_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      subscription_benefit_available: {
        Args: { _subscription_id: string; _tipo: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "cliente"
      appointment_status: "agendado" | "confirmado" | "concluido" | "cancelado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "cliente"],
      appointment_status: ["agendado", "confirmado", "concluido", "cancelado"],
    },
  },
} as const
