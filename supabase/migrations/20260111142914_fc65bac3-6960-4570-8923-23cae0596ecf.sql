-- Create horimetros table for tracking equipment hours
CREATE TABLE public.horimetros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data DATE NOT NULL,
  veiculo TEXT NOT NULL,
  descricao_veiculo TEXT,
  horimetro_anterior NUMERIC(10,2) NOT NULL DEFAULT 0,
  horimetro_atual NUMERIC(10,2) NOT NULL DEFAULT 0,
  horas_trabalhadas NUMERIC(10,2) GENERATED ALWAYS AS (horimetro_atual - horimetro_anterior) STORED,
  operador TEXT,
  obra TEXT,
  observacao TEXT,
  sincronizado_sheets BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_horimetros_veiculo ON public.horimetros(veiculo);
CREATE INDEX idx_horimetros_data ON public.horimetros(data DESC);
CREATE UNIQUE INDEX idx_horimetros_unique ON public.horimetros(data, veiculo);

-- Enable Row Level Security
ALTER TABLE public.horimetros ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow read access for authenticated users"
ON public.horimetros
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert for authenticated users"
ON public.horimetros
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
ON public.horimetros
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow delete for authenticated users"
ON public.horimetros
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_horimetros_updated_at
BEFORE UPDATE ON public.horimetros
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();