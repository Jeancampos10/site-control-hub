
-- Planos de manutenção preventiva por equipamento
CREATE TABLE public.planos_manutencao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo TEXT NOT NULL,
  descricao_servico TEXT NOT NULL,
  tipo_intervalo TEXT NOT NULL CHECK (tipo_intervalo IN ('horimetro', 'km', 'dias')),
  intervalo_valor NUMERIC NOT NULL,
  ultimo_valor_executado NUMERIC DEFAULT 0,
  ultima_execucao_data DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

ALTER TABLE public.planos_manutencao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planos_manutencao_select" ON public.planos_manutencao
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "planos_manutencao_insert" ON public.planos_manutencao
  FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "planos_manutencao_update" ON public.planos_manutencao
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "planos_manutencao_delete" ON public.planos_manutencao
  FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TRIGGER update_planos_manutencao_updated_at
  BEFORE UPDATE ON public.planos_manutencao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
