-- Tabela para Ordens de Serviço de Manutenção
CREATE TABLE public.ordens_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_os SERIAL NOT NULL,
  data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fechamento DATE,
  veiculo TEXT NOT NULL,
  descricao_veiculo TEXT,
  tipo TEXT NOT NULL DEFAULT 'Corretiva',
  status TEXT NOT NULL DEFAULT 'Em Andamento',
  prioridade TEXT NOT NULL DEFAULT 'Média',
  problema_relatado TEXT NOT NULL,
  diagnostico TEXT,
  solucao_aplicada TEXT,
  pecas_utilizadas TEXT,
  observacoes TEXT,
  motorista_operador TEXT,
  encarregado TEXT,
  mecanico_responsavel TEXT,
  horimetro_km NUMERIC,
  tempo_estimado_horas NUMERIC,
  tempo_real_horas NUMERIC,
  custo_estimado NUMERIC,
  custo_real NUMERIC,
  local_servico TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Todos usuários autenticados podem visualizar
CREATE POLICY "Authenticated users can view ordens_servico"
ON public.ordens_servico
FOR SELECT
TO authenticated
USING (true);

-- Apenas admins podem inserir/atualizar/deletar
CREATE POLICY "Admins can insert ordens_servico"
ON public.ordens_servico
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin_principal', 'admin')
    AND approved = true
  )
);

CREATE POLICY "Admins can update ordens_servico"
ON public.ordens_servico
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin_principal', 'admin')
    AND approved = true
  )
);

CREATE POLICY "Admins can delete ordens_servico"
ON public.ordens_servico
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin_principal', 'admin')
    AND approved = true
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ordens_servico_updated_at
BEFORE UPDATE ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();