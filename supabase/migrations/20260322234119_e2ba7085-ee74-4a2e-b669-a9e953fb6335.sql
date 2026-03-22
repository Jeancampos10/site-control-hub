
CREATE TABLE public.cad_fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text DEFAULT '',
  contato text DEFAULT '',
  telefone text DEFAULT '',
  tipo text NOT NULL DEFAULT 'Combustível',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.cad_fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cad_fornecedores_select" ON public.cad_fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "cad_fornecedores_insert" ON public.cad_fornecedores FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "cad_fornecedores_update" ON public.cad_fornecedores FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "cad_fornecedores_delete" ON public.cad_fornecedores FOR DELETE TO authenticated USING (is_admin(auth.uid()));
