-- Create abastecimentos table for fuel records
CREATE TABLE public.abastecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  hora TEXT,
  tipo TEXT,
  veiculo TEXT NOT NULL,
  potencia TEXT,
  descricao TEXT,
  motorista TEXT,
  empresa TEXT,
  obra TEXT,
  horimetro_anterior NUMERIC DEFAULT 0,
  horimetro_atual NUMERIC DEFAULT 0,
  km_anterior NUMERIC DEFAULT 0,
  km_atual NUMERIC DEFAULT 0,
  quantidade_combustivel NUMERIC NOT NULL DEFAULT 0,
  tipo_combustivel TEXT DEFAULT 'Diesel S10',
  local_abastecimento TEXT,
  arla BOOLEAN DEFAULT false,
  quantidade_arla NUMERIC DEFAULT 0,
  fornecedor TEXT,
  nota_fiscal TEXT,
  valor_unitario NUMERIC DEFAULT 0,
  valor_total NUMERIC DEFAULT 0,
  localizacao TEXT,
  observacao TEXT,
  fotos TEXT,
  lubrificacao BOOLEAN DEFAULT false,
  oleo TEXT,
  filtro TEXT,
  sincronizado_sheets BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique constraint for upsert operations
CREATE UNIQUE INDEX idx_abastecimentos_data_veiculo_hora ON public.abastecimentos (data, veiculo, COALESCE(hora, ''));

-- Enable Row Level Security
ALTER TABLE public.abastecimentos ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (similar to horimetros)
CREATE POLICY "Allow authenticated users to read abastecimentos"
ON public.abastecimentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert abastecimentos"
ON public.abastecimentos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update abastecimentos"
ON public.abastecimentos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete abastecimentos"
ON public.abastecimentos FOR DELETE
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_abastecimentos_updated_at
BEFORE UPDATE ON public.abastecimentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();