
-- Itens configuráveis do checklist (template)
CREATE TABLE public.checklist_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  categoria text NOT NULL DEFAULT 'Geral',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.checklist_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_itens_select" ON public.checklist_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "checklist_itens_insert" ON public.checklist_itens FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "checklist_itens_update" ON public.checklist_itens FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "checklist_itens_delete" ON public.checklist_itens FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Checklists preenchidos
CREATE TABLE public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo text NOT NULL,
  descricao_veiculo text,
  tipo text NOT NULL DEFAULT 'entrada',
  data date NOT NULL DEFAULT CURRENT_DATE,
  hora text,
  motorista text,
  operador text,
  obra text,
  km_horimetro text,
  respostas jsonb NOT NULL DEFAULT '[]'::jsonb,
  observacoes text,
  status text NOT NULL DEFAULT 'Concluído',
  assinatura_usuario text,
  assinatura_motorista text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklists_select" ON public.checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "checklists_insert" ON public.checklists FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "checklists_update" ON public.checklists FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "checklists_delete" ON public.checklists FOR DELETE TO authenticated USING (is_admin(auth.uid()));
