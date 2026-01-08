-- Add approval status to user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Create notifications table for admin
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_principal'));

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin_principal'));

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Update user_roles policy to allow admins to update approval
DROP POLICY IF EXISTS "Only admin principal can manage roles" ON public.user_roles;

CREATE POLICY "Admin principal can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin_principal'));

CREATE POLICY "Users can update their own role approval"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Update handle_new_user function to set approved = false for self-registered users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, nome, sobrenome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data ->> 'sobrenome', ''),
    NEW.email
  );
  
  -- Assign default role with approved = false (pending approval)
  INSERT INTO public.user_roles (user_id, role, approved)
  VALUES (NEW.id, 'colaborador', false);
  
  -- Notify admin principal about new registration
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin_principal'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      admin_user_id,
      'new_user_registration',
      'Novo cadastro pendente',
      COALESCE(NEW.raw_user_meta_data ->> 'nome', 'Usuário') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'sobrenome', '') || ' solicitou acesso ao sistema.',
      jsonb_build_object('pending_user_id', NEW.id, 'email', NEW.email)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Function to approve user
CREATE OR REPLACE FUNCTION public.approve_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin principal
  IF NOT public.has_role(auth.uid(), 'admin_principal') THEN
    RETURN false;
  END IF;
  
  UPDATE public.user_roles
  SET approved = true, approved_at = now(), approved_by = auth.uid()
  WHERE user_id = _user_id;
  
  RETURN true;
END;
$$;

-- Function to reject/delete user
CREATE OR REPLACE FUNCTION public.reject_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin principal
  IF NOT public.has_role(auth.uid(), 'admin_principal') THEN
    RETURN false;
  END IF;
  
  -- Delete from user_roles (cascade will handle notifications)
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
  
  RETURN true;
END;
$$;

-- Function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT approved FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    false
  )
$$;