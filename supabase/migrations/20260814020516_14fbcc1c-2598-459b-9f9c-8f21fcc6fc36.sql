
CREATE TYPE public.app_role AS ENUM ('admin','cliente');
CREATE TYPE public.appointment_status AS ENUM ('agendado','confirmado','concluido','cancelado');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  nome text NOT NULL,
  email text,
  telefone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "profiles select own" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  preco numeric(10,2) NOT NULL,
  consome_corte boolean NOT NULL DEFAULT false,
  consome_barba boolean NOT NULL DEFAULT false,
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services public read" ON public.services FOR SELECT TO anon, authenticated USING (ativo);

CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_semana int NOT NULL UNIQUE,
  hora_abertura time NOT NULL,
  hora_fechamento time NOT NULL,
  ativo boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.business_hours TO anon, authenticated;
GRANT ALL ON public.business_hours TO service_role;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hours public read" ON public.business_hours FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('basico','premium')),
  preco numeric(10,2) NOT NULL,
  duracao_dias int NOT NULL DEFAULT 30,
  ilimitado boolean NOT NULL DEFAULT false,
  permite_corte boolean NOT NULL DEFAULT false,
  permite_barba boolean NOT NULL DEFAULT false,
  cortes_limite int,
  barbas_limite int,
  ordem int NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT ALL ON public.subscription_plans TO service_role;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.subscription_plans FOR SELECT TO anon, authenticated USING (ativo);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plano_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date NOT NULL,
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','cancelada')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs select own" ON public.subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR cliente_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  servico_id uuid NOT NULL REFERENCES public.services(id),
  data date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'agendado',
  tipo_atendimento text NOT NULL DEFAULT 'normal' CHECK (tipo_atendimento IN ('normal','assinatura')),
  subscription_id uuid REFERENCES public.subscriptions(id),
  preco numeric(10,2) NOT NULL DEFAULT 0,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX appointments_no_double_booking
  ON public.appointments (data, hora_inicio)
  WHERE status IN ('agendado','confirmado');
CREATE INDEX appointments_data_idx ON public.appointments (data);
GRANT SELECT ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appts select own" ON public.appointments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR cliente_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE TABLE public.subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  tipo_beneficio text NOT NULL CHECK (tipo_beneficio IN ('corte','barba')),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  quantidade int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, tipo_beneficio)
);
GRANT SELECT ON public.subscription_usage TO authenticated;
GRANT ALL ON public.subscription_usage TO service_role;
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage select own" ON public.subscription_usage FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR subscription_id IN (
    SELECT s.id FROM public.subscriptions s JOIN public.profiles p ON p.id = s.cliente_id WHERE p.user_id = auth.uid()));

CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (data, hora_inicio)
);
GRANT SELECT ON public.blocked_slots TO authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks admin read" ON public.blocked_slots FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.appointment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  status_anterior public.appointment_status,
  status_novo public.appointment_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.appointment_history TO authenticated;
GRANT ALL ON public.appointment_history TO service_role;
ALTER TABLE public.appointment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history admin read" ON public.appointment_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- new auth user -> profile + cliente role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, telefone)
  VALUES (NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
          NEW.email,
          NEW.raw_user_meta_data->>'telefone')
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- benefit availability
CREATE OR REPLACE FUNCTION public.subscription_benefit_available(_subscription_id uuid, _tipo text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p RECORD; usados int; lim int;
BEGIN
  SELECT sp.*, s.data_fim, s.data_inicio, s.status INTO p
  FROM public.subscriptions s JOIN public.subscription_plans sp ON sp.id = s.plano_id
  WHERE s.id = _subscription_id;
  IF NOT FOUND THEN RETURN false; END IF;
  IF p.status <> 'ativa' OR p.data_fim < CURRENT_DATE THEN RETURN false; END IF;
  IF _tipo = 'corte' AND NOT p.permite_corte THEN RETURN false; END IF;
  IF _tipo = 'barba' AND NOT p.permite_barba THEN RETURN false; END IF;
  lim := CASE WHEN _tipo = 'corte' THEN p.cortes_limite ELSE p.barbas_limite END;
  IF lim IS NULL THEN RETURN true; END IF;
  SELECT COALESCE(SUM(quantidade),0) INTO usados FROM public.subscription_usage
    WHERE subscription_id = _subscription_id AND tipo_beneficio = _tipo;
  RETURN usados < lim;
END; $$;

-- booking (atomic)
CREATE OR REPLACE FUNCTION public.book_appointment(
  p_cliente_id uuid, p_servico_id uuid, p_data date, p_hora time, p_usar_assinatura boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE svc RECORD; bh RECORD; sub RECORD; new_id uuid; fim time; sub_id uuid := NULL;
BEGIN
  SELECT * INTO svc FROM public.services WHERE id = p_servico_id AND ativo;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','servico_invalido'); END IF;
  IF p_data < CURRENT_DATE THEN RETURN jsonb_build_object('ok',false,'code','data_passada'); END IF;
  IF EXTRACT(MINUTE FROM p_hora)::int NOT IN (0,30) OR EXTRACT(SECOND FROM p_hora) <> 0 THEN
    RETURN jsonb_build_object('ok',false,'code','horario_invalido'); END IF;
  SELECT * INTO bh FROM public.business_hours WHERE dia_semana = EXTRACT(DOW FROM p_data)::int AND ativo;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','fechado'); END IF;
  fim := p_hora + interval '30 minutes';
  IF p_hora < bh.hora_abertura OR fim > bh.hora_fechamento THEN
    RETURN jsonb_build_object('ok',false,'code','fora_horario'); END IF;
  IF p_data = CURRENT_DATE AND p_hora <= ((now() AT TIME ZONE 'America/Sao_Paulo')::time) THEN
    RETURN jsonb_build_object('ok',false,'code','horario_passado'); END IF;
  IF EXISTS (SELECT 1 FROM public.blocked_slots WHERE data = p_data AND hora_inicio = p_hora) THEN
    RETURN jsonb_build_object('ok',false,'code','bloqueado'); END IF;

  IF p_usar_assinatura THEN
    SELECT s.id INTO sub_id FROM public.subscriptions s
      WHERE s.cliente_id = p_cliente_id AND s.status = 'ativa'
        AND s.data_inicio <= CURRENT_DATE AND s.data_fim >= p_data
      ORDER BY s.data_fim DESC LIMIT 1;
    IF sub_id IS NULL THEN RETURN jsonb_build_object('ok',false,'code','sem_assinatura'); END IF;
    IF NOT svc.consome_corte AND NOT svc.consome_barba THEN
      RETURN jsonb_build_object('ok',false,'code','servico_nao_coberto'); END IF;
    IF svc.consome_corte AND NOT public.subscription_benefit_available(sub_id,'corte') THEN
      RETURN jsonb_build_object('ok',false,'code','beneficio_indisponivel'); END IF;
    IF svc.consome_barba AND NOT public.subscription_benefit_available(sub_id,'barba') THEN
      RETURN jsonb_build_object('ok',false,'code','beneficio_indisponivel'); END IF;
  END IF;

  BEGIN
    INSERT INTO public.appointments (cliente_id, servico_id, data, hora_inicio, hora_fim, status,
      tipo_atendimento, subscription_id, preco)
    VALUES (p_cliente_id, p_servico_id, p_data, p_hora, fim, 'agendado',
      CASE WHEN sub_id IS NULL THEN 'normal' ELSE 'assinatura' END, sub_id,
      CASE WHEN sub_id IS NULL THEN svc.preco ELSE 0 END)
    RETURNING id INTO new_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok',false,'code','horario_ocupado');
  END;
  INSERT INTO public.appointment_history (appointment_id, status_anterior, status_novo)
    VALUES (new_id, NULL, 'agendado');
  RETURN jsonb_build_object('ok',true,'id',new_id);
END; $$;

-- complete (consumes benefit once)
CREATE OR REPLACE FUNCTION public.complete_appointment(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ap RECORD; svc RECORD;
BEGIN
  SELECT * INTO ap FROM public.appointments WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','nao_encontrado'); END IF;
  IF ap.status <> 'agendado' AND ap.status <> 'confirmado' THEN
    RETURN jsonb_build_object('ok',false,'code','transicao_invalida'); END IF;
  SELECT * INTO svc FROM public.services WHERE id = ap.servico_id;
  IF ap.subscription_id IS NOT NULL THEN
    IF svc.consome_corte THEN
      IF NOT public.subscription_benefit_available(ap.subscription_id,'corte') THEN
        RETURN jsonb_build_object('ok',false,'code','beneficio_indisponivel'); END IF;
      INSERT INTO public.subscription_usage (subscription_id, tipo_beneficio, appointment_id)
        VALUES (ap.subscription_id,'corte',ap.id) ON CONFLICT DO NOTHING;
    END IF;
    IF svc.consome_barba THEN
      IF NOT public.subscription_benefit_available(ap.subscription_id,'barba') THEN
        RETURN jsonb_build_object('ok',false,'code','beneficio_indisponivel'); END IF;
      INSERT INTO public.subscription_usage (subscription_id, tipo_beneficio, appointment_id)
        VALUES (ap.subscription_id,'barba',ap.id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  UPDATE public.appointments SET status = 'concluido' WHERE id = p_id;
  INSERT INTO public.appointment_history (appointment_id, status_anterior, status_novo)
    VALUES (p_id, ap.status, 'concluido');
  RETURN jsonb_build_object('ok',true);
END; $$;

CREATE OR REPLACE FUNCTION public.cancel_appointment(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ap RECORD;
BEGIN
  SELECT * INTO ap FROM public.appointments WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'code','nao_encontrado'); END IF;
  IF ap.status IN ('concluido','cancelado') THEN
    RETURN jsonb_build_object('ok',false,'code','transicao_invalida'); END IF;
  UPDATE public.appointments SET status = 'cancelado' WHERE id = p_id;
  INSERT INTO public.appointment_history (appointment_id, status_anterior, status_novo)
    VALUES (p_id, ap.status, 'cancelado');
  RETURN jsonb_build_object('ok',true);
END; $$;

REVOKE ALL ON FUNCTION public.book_appointment(uuid,uuid,date,time,boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_appointment(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_appointment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment(uuid,uuid,date,time,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_appointment(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_appointment(uuid) TO service_role;

INSERT INTO public.business_hours (dia_semana, hora_abertura, hora_fechamento) VALUES
 (0,'09:00','19:30'),(1,'09:00','19:00'),(2,'09:00','19:00'),(3,'09:00','19:00'),
 (4,'09:00','19:00'),(5,'09:00','19:00'),(6,'09:00','19:30');

INSERT INTO public.services (nome, preco, consome_corte, consome_barba, ordem) VALUES
 ('Cabelo',30.00,true,false,1),
 ('Barba',20.00,false,true,2),
 ('Cabelo + Barba',50.00,true,true,3),
 ('Pezinho',10.00,false,false,4),
 ('Sobrancelha',10.00,false,false,5);

INSERT INTO public.subscription_plans (nome, tipo, preco, duracao_dias, ilimitado, permite_corte, permite_barba, cortes_limite, barbas_limite, ordem) VALUES
 ('Corte','basico',100.00,30,false,true,false,4,NULL,1),
 ('Barba','basico',70.00,30,false,false,true,NULL,4,2),
 ('Combo Básico','basico',160.00,30,false,true,true,4,4,3),
 ('Corte Premium','premium',180.00,30,true,true,false,NULL,NULL,4),
 ('Barba Premium','premium',120.00,30,true,false,true,NULL,NULL,5),
 ('Corte + Barba Ilimitados','premium',260.00,30,true,true,true,NULL,NULL,6);
