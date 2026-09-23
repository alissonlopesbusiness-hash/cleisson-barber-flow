/*
# Atualizar RLS para reconhecer role de barbeiro

As políticas de RLS atuais verificam apenas `has_role(auth.uid(), 'admin')`.
O barbeiro precisa acessar appointments, blocked_slots, profiles,
subscriptions, subscription_usage e appointment_history através do painel.

1. Políticas alteradas
- appointments SELECT: agora aceita admin OU barber
- blocked_slots SELECT: agora aceita admin OU barber
- profiles SELECT: agora aceita admin OU barber
- subscriptions SELECT: agora aceita admin OU barber
- subscription_usage SELECT: agora aceita admin OU barber
- appointment_history SELECT: agora aceita admin OU barber

2. Notas
- A função has_role() já aceita qualquer valor do enum app_role,
  incluindo barber. As políticas apenas passavam 'admin' explicitamente.
- Nenhum dado é removido ou alterado.
*/

-- appointments: permitir barbeiro ver todos os agendamentos
DROP POLICY IF EXISTS "appts select own" ON appointments;
CREATE POLICY "appts select own" ON appointments FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'barber'::app_role)
    OR cliente_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  );

-- blocked_slots: permitir barbeiro ver bloqueios
DROP POLICY IF EXISTS "blocks admin read" ON blocked_slots;
CREATE POLICY "blocks admin read" ON blocked_slots FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'barber'::app_role)
  );

-- profiles: permitir barbeiro ver perfis de clientes
DROP POLICY IF EXISTS "profiles select own" ON profiles;
CREATE POLICY "profiles select own" ON profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'barber'::app_role)
  );

-- subscriptions: permitir barbeiro ver assinaturas
DROP POLICY IF EXISTS "subs select own" ON subscriptions;
CREATE POLICY "subs select own" ON subscriptions FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'barber'::app_role)
    OR cliente_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
    )
  );

-- subscription_usage: permitir barbeiro ver uso de assinaturas
DROP POLICY IF EXISTS "usage select own" ON subscription_usage;
CREATE POLICY "usage select own" ON subscription_usage FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'barber'::app_role)
    OR subscription_id IN (
      SELECT s.id FROM subscriptions s
      JOIN profiles p ON p.id = s.cliente_id
      WHERE p.user_id = auth.uid()
    )
  );

-- appointment_history: permitir barbeiro ver histórico
DROP POLICY IF EXISTS "history admin read" ON appointment_history;
CREATE POLICY "history admin read" ON appointment_history FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'barber'::app_role)
  );
