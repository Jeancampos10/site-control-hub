
-- System configuration table for server admin panel
CREATE TABLE public.system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Only admin_principal can manage system config
CREATE POLICY "system_config_select" ON public.system_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "system_config_insert" ON public.system_config
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin_principal'::app_role));

CREATE POLICY "system_config_update" ON public.system_config
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin_principal'::app_role));

CREATE POLICY "system_config_delete" ON public.system_config
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin_principal'::app_role));
