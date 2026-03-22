import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EstoqueConfig {
  id: string;
  local_estoque: string;
  tipo_combustivel: string;
  quantidade_inicial: number;
  data_referencia: string;
  capacidade: number;
}

export interface EntradaCombustivel {
  id: string;
  data: string;
  local_estoque: string;
  tipo_combustivel: string;
  quantidade: number;
  fornecedor: string | null;
  nota_fiscal: string | null;
  valor_total: number | null;
  valor_unitario: number | null;
  observacao: string | null;
  created_at: string;
}

export interface SaldoEstoque {
  local_estoque: string;
  tipo_combustivel: string;
  capacidade: number;
  quantidade_inicial: number;
  total_entradas: number;
  total_saidas: number;
  saldo_atual: number;
  percentual: number;
}

// Fetch stock configs
export function useEstoqueConfigs() {
  return useQuery({
    queryKey: ["estoque_combustivel"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("estoque_combustivel")
        .select("*")
        .order("local_estoque");
      if (error) throw error;
      return (data || []) as EstoqueConfig[];
    },
    staleTime: 60_000,
  });
}

// Fetch fuel entries
export function useEntradasCombustivel(local?: string) {
  return useQuery({
    queryKey: ["entradas_combustivel", local || "all"],
    queryFn: async () => {
      let q = (supabase as any)
        .from("entradas_combustivel")
        .select("*")
        .order("data", { ascending: false });
      if (local && local !== "all") q = q.eq("local_estoque", local);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as EntradaCombustivel[];
    },
    staleTime: 60_000,
  });
}

// Calculate real stock balances
export function useSaldoEstoque() {
  const { data: configs } = useEstoqueConfigs();
  const { data: entradas } = useEntradasCombustivel("all");
  const { data: abastecimentos } = useQuery({
    queryKey: ["abastecimentos", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abastecimentos")
        .select("local_abastecimento, quantidade_combustivel");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const saldos: SaldoEstoque[] = (configs || []).map((cfg) => {
    const totalEntradas = (entradas || [])
      .filter((e) => e.local_estoque === cfg.local_estoque)
      .reduce((s, e) => s + (e.quantidade || 0), 0);

    const totalSaidas = (abastecimentos || [])
      .filter((a: any) => a.local_abastecimento === cfg.local_estoque)
      .reduce((s, a: any) => s + (a.quantidade_combustivel || 0), 0);

    const saldo = cfg.quantidade_inicial + totalEntradas - totalSaidas;
    return {
      local_estoque: cfg.local_estoque,
      tipo_combustivel: cfg.tipo_combustivel,
      capacidade: cfg.capacidade,
      quantidade_inicial: cfg.quantidade_inicial,
      total_entradas: totalEntradas,
      total_saidas: totalSaidas,
      saldo_atual: Math.max(saldo, 0),
      percentual: cfg.capacidade > 0 ? Math.max((saldo / cfg.capacidade) * 100, 0) : 0,
    };
  });

  return saldos;
}

// Save stock config (upsert)
export function useSaveEstoqueConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cfg: Omit<EstoqueConfig, "id"> & { id?: string }) => {
      if (cfg.id) {
        const { error } = await (supabase as any)
          .from("estoque_combustivel")
          .update({
            quantidade_inicial: cfg.quantidade_inicial,
            capacidade: cfg.capacidade,
            data_referencia: cfg.data_referencia,
            tipo_combustivel: cfg.tipo_combustivel,
          })
          .eq("id", cfg.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("estoque_combustivel")
          .insert({
            local_estoque: cfg.local_estoque,
            tipo_combustivel: cfg.tipo_combustivel,
            quantidade_inicial: cfg.quantidade_inicial,
            capacidade: cfg.capacidade,
            data_referencia: cfg.data_referencia,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estoque_combustivel"] });
      toast.success("Estoque configurado!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// Insert fuel entry
export function useInsertEntrada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entrada: Omit<EntradaCombustivel, "id" | "created_at">) => {
      const { error } = await (supabase as any)
        .from("entradas_combustivel")
        .insert(entrada);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entradas_combustivel"] });
      qc.invalidateQueries({ queryKey: ["estoque_combustivel"] });
      toast.success("Entrada registrada!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// Delete fuel entry
export function useDeleteEntrada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("entradas_combustivel")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entradas_combustivel"] });
      toast.success("Entrada excluída!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
