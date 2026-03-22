
-- Tabela de estoque inicial por tipo de combustível e local
CREATE TABLE public.estoque_combustivel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_estoque text NOT NULL,
  tipo_combustivel text NOT NULL DEFAULT 'Diesel S10',
  quantidade_inicial numeric NOT NULL DEFAULT 0,
  data_referencia date NOT NULL DEFAULT CURRENT_DATE,
  capacidade numeric NOT NULL DEFAULT 10000,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE(local_estoque, tipo_combustivel)
);

ALTER TABLE public.estoque_combustivel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estoque_combustivel_select" ON public.estoque_combustivel FOR SELECT TO authenticated USING (true);
CREATE POLICY "estoque_combustivel_insert" ON public.estoque_combustivel FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "estoque_combustivel_update" ON public.estoque_combustivel FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "estoque_combustivel_delete" ON public.estoque_combustivel FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- Tabela de entradas de combustível (compras)
CREATE TABLE public.entradas_combustivel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL DEFAULT CURRENT_DATE,
  local_estoque text NOT NULL,
  tipo_combustivel text NOT NULL DEFAULT 'Diesel S10',
  quantidade numeric NOT NULL DEFAULT 0,
  fornecedor text,
  nota_fiscal text,
  valor_total numeric DEFAULT 0,
  valor_unitario numeric DEFAULT 0,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.entradas_combustivel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entradas_combustivel_select" ON public.entradas_combustivel FOR SELECT TO authenticated USING (true);
CREATE POLICY "entradas_combustivel_insert" ON public.entradas_combustivel FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "entradas_combustivel_update" ON public.entradas_combustivel FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "entradas_combustivel_delete" ON public.entradas_combustivel FOR DELETE TO authenticated USING (is_admin(auth.uid()));
