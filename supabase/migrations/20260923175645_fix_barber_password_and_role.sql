/*
# Corrigir senha da conta do barbeiro

O hash bcrypt anterior foi gerado com cost factor 6, que pode ser
incompatível com o Supabase Auth. Atualiza a senha com cost factor 10
(padrão do Supabase Auth) para garantir compatibilidade.

Também garante que a role `barber` esteja presente e remove a role
`cliente` automática criada pelo trigger, já que esta conta é
exclusivamente do barbeiro.
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'cleissonbarber10@gmail.com';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Barber user not found';
  END IF;

  -- Atualiza a senha com bcrypt cost 10 (padrão do Supabase Auth)
  UPDATE auth.users
  SET encrypted_password = crypt('barberclub', gen_salt('bf', 10)),
      updated_at = now()
  WHERE id = v_user_id;

  -- Garante que a role barber existe
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'barber')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove a role cliente automática criada pelo trigger
  DELETE FROM public.user_roles
  WHERE user_id = v_user_id AND role = 'cliente';
END $$;
