/*
# Fechar aos domingos

A Cleisson Barber Club não atende aos domingos. Esta migração marca
o domingo (dia_semana = 0) como inativo na tabela business_hours.

- Nenhum outro dia da semana é alterado.
- Nenhum dado de agendamento existente é removido ou modificado.
- A função book_appointment já verifica business_hours.ativo, então
  agendamentos aos domingos passam a ser rejeitados automaticamente.
*/

UPDATE public.business_hours SET ativo = false WHERE dia_semana = 0;
