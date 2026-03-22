
-- Tabela de Lubrificantes
CREATE TABLE public.cad_lubrificantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT '',
  marca text DEFAULT '',
  unidade text DEFAULT 'Litro',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.cad_lubrificantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cad_lubrificantes_select" ON public.cad_lubrificantes FOR SELECT TO authenticated USING (true);
CREATE POLICY "cad_lubrificantes_insert" ON public.cad_lubrificantes FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "cad_lubrificantes_update" ON public.cad_lubrificantes FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "cad_lubrificantes_delete" ON public.cad_lubrificantes FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Tabela de Tipos de Óleo
CREATE TABLE public.cad_tipos_oleo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  viscosidade text DEFAULT '',
  aplicacao text DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.cad_tipos_oleo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cad_tipos_oleo_select" ON public.cad_tipos_oleo FOR SELECT TO authenticated USING (true);
CREATE POLICY "cad_tipos_oleo_insert" ON public.cad_tipos_oleo FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "cad_tipos_oleo_update" ON public.cad_tipos_oleo FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "cad_tipos_oleo_delete" ON public.cad_tipos_oleo FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Tabela de Mecânicos
CREATE TABLE public.cad_mecanicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  especialidade text DEFAULT '',
  telefone text DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.cad_mecanicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cad_mecanicos_select" ON public.cad_mecanicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "cad_mecanicos_insert" ON public.cad_mecanicos FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "cad_mecanicos_update" ON public.cad_mecanicos FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "cad_mecanicos_delete" ON public.cad_mecanicos FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Tabela de Peças
CREATE TABLE public.cad_pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text DEFAULT '',
  categoria text DEFAULT '',
  unidade text DEFAULT 'Un',
  estoque_minimo integer DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.cad_pecas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cad_pecas_select" ON public.cad_pecas FOR SELECT TO authenticated USING (true);
CREATE POLICY "cad_pecas_insert" ON public.cad_pecas FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "cad_pecas_update" ON public.cad_pecas FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "cad_pecas_delete" ON public.cad_pecas FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Triggers de updated_at
CREATE TRIGGER update_cad_lubrificantes_updated_at BEFORE UPDATE ON public.cad_lubrificantes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cad_tipos_oleo_updated_at BEFORE UPDATE ON public.cad_tipos_oleo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cad_mecanicos_updated_at BEFORE UPDATE ON public.cad_mecanicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cad_pecas_updated_at BEFORE UPDATE ON public.cad_pecas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
