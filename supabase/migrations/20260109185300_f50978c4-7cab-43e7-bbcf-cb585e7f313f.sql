-- Create table to store bulk edit history/log
CREATE TABLE public.bulk_edit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_name TEXT NOT NULL,
  date_filter TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  updates JSONB NOT NULL DEFAULT '{}',
  affected_rows_count INTEGER NOT NULL DEFAULT 0,
  affected_rows_sample JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_at TIMESTAMP WITH TIME ZONE,
  applied_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.bulk_edit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view all bulk edit logs" 
ON public.bulk_edit_logs 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create bulk edit logs" 
ON public.bulk_edit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update bulk edit logs" 
ON public.bulk_edit_logs 
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

-- Create index for faster queries
CREATE INDEX idx_bulk_edit_logs_sheet_name ON public.bulk_edit_logs(sheet_name);
CREATE INDEX idx_bulk_edit_logs_created_at ON public.bulk_edit_logs(created_at DESC);
CREATE INDEX idx_bulk_edit_logs_status ON public.bulk_edit_logs(status);