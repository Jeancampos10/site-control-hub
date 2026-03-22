
CREATE TABLE public.frota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  descricao text NOT NULL DEFAULT '',
  categoria text NOT NULL DEFAULT '',
  potencia text DEFAULT '',
  motorista text DEFAULT '',
  empresa text DEFAULT '',
  obra text DEFAULT '',
  status text NOT NULL DEFAULT 'Mobilizado',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT NULL
);

ALTER TABLE public.frota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frota_select" ON public.frota FOR SELECT TO authenticated USING (true);
CREATE POLICY "frota_insert" ON public.frota FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "frota_update" ON public.frota FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "frota_delete" ON public.frota FOR DELETE TO authenticated USING (is_admin(auth.uid()));
