/*
# Adicionar role de barbeiro ao enum app_role

Adiciona o valor `barber` ao enum `app_role` (que já possui `admin` e `cliente`).
Nenhum valor existente é removido ou alterado.
*/

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'barber';
