-- Update the handle_new_user function to include WhatsApp
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_user_id UUID;
  user_count INT;
  is_first_user BOOLEAN;
BEGIN
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  is_first_user := (user_count = 0);
  
  -- Insert profile with WhatsApp
  INSERT INTO public.profiles (id, nome, sobrenome, email, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data ->> 'sobrenome', ''),
    NEW.email,
    NEW.raw_user_meta_data ->> 'whatsapp'
  );
  
  -- First user becomes admin_principal and is auto-approved
  IF is_first_user THEN
    INSERT INTO public.user_roles (user_id, role, approved, modulos_permitidos)
    VALUES (NEW.id, 'admin_principal', true, ARRAY['apropriacao', 'pedreira', 'pipas', 'cal']::TEXT[]);
  ELSE
    -- Other users need approval - default to all modules
    INSERT INTO public.user_roles (user_id, role, approved, modulos_permitidos)
    VALUES (NEW.id, 'colaborador', false, ARRAY['apropriacao', 'pedreira', 'pipas', 'cal']::TEXT[]);
    
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
        jsonb_build_object('pending_user_id', NEW.id, 'email', NEW.email, 'whatsapp', NEW.raw_user_meta_data ->> 'whatsapp')
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;