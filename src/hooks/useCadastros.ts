import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CadLocal {
  id: string;
  tipo: 'Origem' | 'Destino';
  nome: string;
  obra: string;
  ativo: boolean;
}

export interface CadMaterial {
  id: string;
  nome: string;
  unidade: string;
  ativo: boolean;
}

export interface CadFornecedorCal {
  id: string;
  nome: string;
  cnpj: string | null;
  contato: string | null;
  ativo: boolean;
}

export function useCadLocais() {
  return useQuery({
    queryKey: ['cadastros', 'locais'],
    queryFn: async (): Promise<CadLocal[]> => {
      const { data, error } = await supabase
        .from('cad_locais')
        .select('id,tipo,nome,obra,ativo')
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data || []) as CadLocal[];
    },
  });
}

export function useCadMateriais() {
  return useQuery({
    queryKey: ['cadastros', 'materiais'],
    queryFn: async (): Promise<CadMaterial[]> => {
      const { data, error } = await supabase
        .from('cad_materiais')
        .select('id,nome,unidade,ativo')
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data || []) as CadMaterial[];
    },
  });
}

export function useCadFornecedoresCal() {
  return useQuery({
    queryKey: ['cadastros', 'fornecedores_cal'],
    queryFn: async (): Promise<CadFornecedorCal[]> => {
      const { data, error } = await supabase
        .from('cad_fornecedores_cal')
        .select('id,nome,cnpj,contato,ativo')
        .order('nome', { ascending: true });
      if (error) throw error;
      return (data || []) as CadFornecedorCal[];
    },
  });
}

export function useCadLocaisMutations() {
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['cadastros', 'locais'] });
    await qc.invalidateQueries({ queryKey: ['google-sheets', 'locais'] });
  };

  const create = useMutation({
    mutationFn: async (payload: Omit<CadLocal, 'id'>) => {
      const { error } = await supabase.from('cad_locais').insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Local salvo!');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao salvar local'),
  });

  const update = useMutation({
    mutationFn: async (payload: CadLocal) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from('cad_locais').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Local atualizado!');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao atualizar local'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cad_locais').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Local excluído!');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao excluir local'),
  });

  return { create, update, remove };
}

export function useCadMateriaisMutations() {
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['cadastros', 'materiais'] });
    await qc.invalidateQueries({ queryKey: ['google-sheets', 'materiais'] });
  };

  const create = useMutation({
    mutationFn: async (payload: Omit<CadMaterial, 'id'>) => {
      const { error } = await supabase.from('cad_materiais').insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Material salvo!');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao salvar material'),
  });

  const update = useMutation({
    mutationFn: async (payload: CadMaterial) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from('cad_materiais').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Material atualizado!');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao atualizar material'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cad_materiais').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Material excluído!');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao excluir material'),
  });

  return { create, update, remove };
}

export function useCadFornecedoresCalMutations() {
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['cadastros', 'fornecedores_cal'] });
    await qc.invalidateQueries({ queryKey: ['google-sheets', 'fornecedores_cal'] });
  };

  const create = useMutation({
    mutationFn: async (payload: Omit<CadFornecedorCal, 'id'>) => {
      const { error } = await supabase.from('cad_fornecedores_cal').insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Fornecedor salvo!');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao salvar fornecedor'),
  });

  const update = useMutation({
    mutationFn: async (payload: CadFornecedorCal) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from('cad_fornecedores_cal').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Fornecedor atualizado!');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao atualizar fornecedor'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cad_fornecedores_cal').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success('Fornecedor excluído!');
    },
    onError: (e: any) => toast.error(e?.message || 'Erro ao excluir fornecedor'),
  });

  return { create, update, remove };
}
