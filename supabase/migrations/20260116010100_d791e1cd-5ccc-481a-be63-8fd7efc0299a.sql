-- Add module permissions to user_roles table
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS modulos_permitidos TEXT[] DEFAULT ARRAY['apropriacao', 'pedreira', 'pipas', 'cal']::TEXT[];

-- Add comment explaining the column
COMMENT ON COLUMN public.user_roles.modulos_permitidos IS 'Lista de módulos que o usuário pode acessar: apropriacao, pedreira, pipas, cal';