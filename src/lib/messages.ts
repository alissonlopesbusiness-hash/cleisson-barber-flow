export const BOOKING_ERRORS: Record<string, string> = {
  horario_ocupado: "Esse horário acabou de ser reservado. Escolha outro horário.",
  bloqueado: "Esse horário está bloqueado pela barbearia.",
  fora_horario: "Esse horário está fora do funcionamento da barbearia.",
  fechado: "A barbearia não atende nesse dia.",
  data_passada: "Não é possível agendar em uma data que já passou.",
  horario_passado: "Esse horário já passou. Escolha outro.",
  horario_invalido: "Horário inválido. Os atendimentos começam a cada 30 minutos.",
  servico_invalido: "Serviço indisponível.",
  sem_assinatura: "Você não possui uma assinatura ativa.",
  servico_nao_coberto: "Sua assinatura não cobre esse serviço.",
  beneficio_indisponivel: "Você já utilizou todos os benefícios desse plano.",
  transicao_invalida: "Esse atendimento não pode mais ser alterado.",
  nao_encontrado: "Atendimento não encontrado.",
};

export function bookingMessage(code?: string | null): string {
  if (code && BOOKING_ERRORS[code]) return BOOKING_ERRORS[code];
  return "Não foi possível concluir a ação. Tente novamente.";
}
