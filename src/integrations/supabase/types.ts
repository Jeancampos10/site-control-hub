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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abastecimentos: {
        Row: {
          arla: boolean | null
          created_at: string | null
          data: string
          descricao: string | null
          empresa: string | null
          filtro: string | null
          fornecedor: string | null
          fotos: string | null
          hora: string | null
          horimetro_anterior: number | null
          horimetro_atual: number | null
          id: string
          km_anterior: number | null
          km_atual: number | null
          local_abastecimento: string | null
          localizacao: string | null
          lubrificacao: boolean | null
          motorista: string | null
          nota_fiscal: string | null
          obra: string | null
          observacao: string | null
          oleo: string | null
          potencia: string | null
          quantidade_arla: number | null
          quantidade_combustivel: number
          sincronizado_sheets: boolean | null
          tipo: string | null
          tipo_combustivel: string | null
          updated_at: string | null
          valor_total: number | null
          valor_unitario: number | null
          veiculo: string
        }
        Insert: {
          arla?: boolean | null
          created_at?: string | null
          data: string
          descricao?: string | null
          empresa?: string | null
          filtro?: string | null
          fornecedor?: string | null
          fotos?: string | null
          hora?: string | null
          horimetro_anterior?: number | null
          horimetro_atual?: number | null
          id?: string
          km_anterior?: number | null
          km_atual?: number | null
          local_abastecimento?: string | null
          localizacao?: string | null
          lubrificacao?: boolean | null
          motorista?: string | null
          nota_fiscal?: string | null
          obra?: string | null
          observacao?: string | null
          oleo?: string | null
          potencia?: string | null
          quantidade_arla?: number | null
          quantidade_combustivel?: number
          sincronizado_sheets?: boolean | null
          tipo?: string | null
          tipo_combustivel?: string | null
          updated_at?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
          veiculo: string
        }
        Update: {
          arla?: boolean | null
          created_at?: string | null
          data?: string
          descricao?: string | null
          empresa?: string | null
          filtro?: string | null
          fornecedor?: string | null
          fotos?: string | null
          hora?: string | null
          horimetro_anterior?: number | null
          horimetro_atual?: number | null
          id?: string
          km_anterior?: number | null
          km_atual?: number | null
          local_abastecimento?: string | null
          localizacao?: string | null
          lubrificacao?: boolean | null
          motorista?: string | null
          nota_fiscal?: string | null
          obra?: string | null
          observacao?: string | null
          oleo?: string | null
          potencia?: string | null
          quantidade_arla?: number | null
          quantidade_combustivel?: number
          sincronizado_sheets?: boolean | null
          tipo?: string | null
          tipo_combustivel?: string | null
          updated_at?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
          veiculo?: string
        }
        Relationships: []
      }
      apontamentos_pipa: {
        Row: {
          capacidade: string | null
          created_at: string
          data: string
          descricao: string | null
          empresa: string | null
          hora_chegada: string | null
          hora_saida: string | null
          id: string
          motorista: string | null
          n_viagens: number
          prefixo: string
          sincronizado_sheets: boolean
          updated_at: string
        }
        Insert: {
          capacidade?: string | null
          created_at?: string
          data: string
          descricao?: string | null
          empresa?: string | null
          hora_chegada?: string | null
          hora_saida?: string | null
          id?: string
          motorista?: string | null
          n_viagens?: number
          prefixo: string
          sincronizado_sheets?: boolean
          updated_at?: string
        }
        Update: {
          capacidade?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          empresa?: string | null
          hora_chegada?: string | null
          hora_saida?: string | null
          id?: string
          motorista?: string | null
          n_viagens?: number
          prefixo?: string
          sincronizado_sheets?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      bulk_edit_logs: {
        Row: {
          affected_rows_count: number
          affected_rows_sample: Json | null
          applied_at: string | null
          applied_by: string | null
          created_at: string
          created_by: string | null
          date_filter: string | null
          filters: Json
          id: string
          notes: string | null
          sheet_name: string
          status: string
          updates: Json
        }
        Insert: {
          affected_rows_count?: number
          affected_rows_sample?: Json | null
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string
          created_by?: string | null
          date_filter?: string | null
          filters?: Json
          id?: string
          notes?: string | null
          sheet_name: string
          status?: string
          updates?: Json
        }
        Update: {
          affected_rows_count?: number
          affected_rows_sample?: Json | null
          applied_at?: string | null
          applied_by?: string | null
          created_at?: string
          created_by?: string | null
          date_filter?: string | null
          filters?: Json
          id?: string
          notes?: string | null
          sheet_name?: string
          status?: string
          updates?: Json
        }
        Relationships: []
      }
      cad_fornecedores_cal: {
        Row: {
          ativo: boolean
          cnpj: string | null
          contato: string | null
          created_at: string
          created_by: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      cad_locais: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          id: string
          nome: string
          obra: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          obra?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          obra?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      cad_materiais: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          id: string
          nome: string
          unidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      horimetros: {
        Row: {
          created_at: string
          data: string
          descricao_veiculo: string | null
          horas_trabalhadas: number | null
          horimetro_anterior: number
          horimetro_atual: number
          id: string
          obra: string | null
          observacao: string | null
          operador: string | null
          sincronizado_sheets: boolean
          updated_at: string
          veiculo: string
        }
        Insert: {
          created_at?: string
          data: string
          descricao_veiculo?: string | null
          horas_trabalhadas?: number | null
          horimetro_anterior?: number
          horimetro_atual?: number
          id?: string
          obra?: string | null
          observacao?: string | null
          operador?: string | null
          sincronizado_sheets?: boolean
          updated_at?: string
          veiculo: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao_veiculo?: string | null
          horas_trabalhadas?: number | null
          horimetro_anterior?: number
          horimetro_atual?: number
          id?: string
          obra?: string | null
          observacao?: string | null
          operador?: string | null
          sincronizado_sheets?: boolean
          updated_at?: string
          veiculo?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ordens_servico: {
        Row: {
          created_at: string
          custo_estimado: number | null
          custo_real: number | null
          data_abertura: string
          data_fechamento: string | null
          descricao_veiculo: string | null
          diagnostico: string | null
          encarregado: string | null
          horimetro_km: number | null
          id: string
          local_servico: string | null
          mecanico_responsavel: string | null
          motorista_operador: string | null
          numero_os: number
          observacoes: string | null
          pecas_utilizadas: string | null
          prioridade: string
          problema_relatado: string
          solucao_aplicada: string | null
          status: string
          tempo_estimado_horas: number | null
          tempo_real_horas: number | null
          tipo: string
          updated_at: string
          veiculo: string
        }
        Insert: {
          created_at?: string
          custo_estimado?: number | null
          custo_real?: number | null
          data_abertura?: string
          data_fechamento?: string | null
          descricao_veiculo?: string | null
          diagnostico?: string | null
          encarregado?: string | null
          horimetro_km?: number | null
          id?: string
          local_servico?: string | null
          mecanico_responsavel?: string | null
          motorista_operador?: string | null
          numero_os?: number
          observacoes?: string | null
          pecas_utilizadas?: string | null
          prioridade?: string
          problema_relatado: string
          solucao_aplicada?: string | null
          status?: string
          tempo_estimado_horas?: number | null
          tempo_real_horas?: number | null
          tipo?: string
          updated_at?: string
          veiculo: string
        }
        Update: {
          created_at?: string
          custo_estimado?: number | null
          custo_real?: number | null
          data_abertura?: string
          data_fechamento?: string | null
          descricao_veiculo?: string | null
          diagnostico?: string | null
          encarregado?: string | null
          horimetro_km?: number | null
          id?: string
          local_servico?: string | null
          mecanico_responsavel?: string | null
          motorista_operador?: string | null
          numero_os?: number
          observacoes?: string | null
          pecas_utilizadas?: string | null
          prioridade?: string
          problema_relatado?: string
          solucao_aplicada?: string | null
          status?: string
          tempo_estimado_horas?: number | null
          tempo_real_horas?: number | null
          tipo?: string
          updated_at?: string
          veiculo?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          foto_url: string | null
          id: string
          nome: string
          sobrenome: string
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email: string
          foto_url?: string | null
          id: string
          nome: string
          sobrenome: string
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          foto_url?: string | null
          id?: string
          nome?: string
          sobrenome?: string
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          id: string
          modulos_permitidos: string[] | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          modulos_permitidos?: string[] | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          modulos_permitidos?: string[] | null
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
      approve_user: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      reject_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin_principal" | "admin" | "colaborador" | "visualizacao"
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
      app_role: ["admin_principal", "admin", "colaborador", "visualizacao"],
    },
  },
} as const
