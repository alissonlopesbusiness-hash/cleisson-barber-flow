/*
# Criar conta do barbeiro Cleisson

1. Novo usuário de autenticação
- Cria o usuário cleissonbarber10@gmail.com no Supabase Auth com a senha fornecida.
- A senha é armazenada de forma segura (hash bcrypt), nunca em texto plano.

2. Perfil e permissão
- Cria um perfil na tabela `profiles` vinculado ao novo usuário.
- Atribui a role `barber` na tabela `user_roles`.

3. Notas
- Nenhum dado existente é removido ou alterado.
- A conta de admin existente continua funcionando normalmente.
- Idempotente: se o usuário já existir, apenas garante perfil e role.
*/

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'cleissonbarber10@gmail.com';

  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'cleissonbarber10@gmail.com',
      crypt('barberclub', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{}'::jsonb,
      '{}'::jsonb
    )
    RETURNING id INTO v_user_id;
  END IF;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, nome, email)
    VALUES (v_user_id, 'Cleisson Barber', 'cleissonbarber10@gmail.com')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'barber')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
