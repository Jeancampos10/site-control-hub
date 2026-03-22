
-- Tabela de Tanques/Locais de Estoque
CREATE TABLE public.cad_tanques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'Fixo',
  capacidade numeric DEFAULT 0,
  local text DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.cad_tanques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cad_tanques_select" ON public.cad_tanques FOR SELECT TO authenticated USING (true);
CREATE POLICY "cad_tanques_insert" ON public.cad_tanques FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "cad_tanques_update" ON public.cad_tanques FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "cad_tanques_delete" ON public.cad_tanques FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Tabela de Obras
CREATE TABLE public.cad_obras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text DEFAULT '',
  localizacao text DEFAULT '',
  responsavel text DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.cad_obras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cad_obras_select" ON public.cad_obras FOR SELECT TO authenticated USING (true);
CREATE POLICY "cad_obras_insert" ON public.cad_obras FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "cad_obras_update" ON public.cad_obras FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "cad_obras_delete" ON public.cad_obras FOR DELETE TO authenticated USING (is_admin(auth.uid()));
