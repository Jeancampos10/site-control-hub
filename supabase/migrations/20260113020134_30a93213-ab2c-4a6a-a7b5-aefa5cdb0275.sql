-- Create table for apontamentos_pipa
CREATE TABLE public.apontamentos_pipa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  prefixo TEXT NOT NULL,
  descricao TEXT,
  empresa TEXT,
  motorista TEXT,
  capacidade TEXT,
  hora_chegada TEXT,
  hora_saida TEXT,
  n_viagens INTEGER NOT NULL DEFAULT 1,
  sincronizado_sheets BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.apontamentos_pipa ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can view apontamentos_pipa" 
ON public.apontamentos_pipa 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert apontamentos_pipa" 
ON public.apontamentos_pipa 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update apontamentos_pipa" 
ON public.apontamentos_pipa 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete apontamentos_pipa" 
ON public.apontamentos_pipa 
FOR DELETE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_apontamentos_pipa_updated_at
BEFORE UPDATE ON public.apontamentos_pipa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();