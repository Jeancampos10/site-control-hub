-- Update handle_new_user to auto-approve admin_principal role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  user_count INT;
  is_first_user BOOLEAN;
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  is_first_user := (user_count = 0);
  
  -- Insert profile
  INSERT INTO public.profiles (id, nome, sobrenome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data ->> 'sobrenome', ''),
    NEW.email
  );
  
  -- First user becomes admin_principal and is auto-approved
  IF is_first_user THEN
    INSERT INTO public.user_roles (user_id, role, approved)
    VALUES (NEW.id, 'admin_principal', true);
  ELSE
    -- Other users need approval
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
  END IF;
  
  RETURN NEW;
END;
$$;