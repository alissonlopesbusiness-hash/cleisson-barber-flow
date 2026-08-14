import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, Home, Scissors, Star, User } from "lucide-react";
import { getMyAccount, cancelMyAppointment } from "@/lib/account.functions";
import { Screen, PageTitle, Loading, EmptyState, StatusBadge, BottomNav } from "@/components/app/shell";
import { brl, formatDateBR, hhmm } from "@/lib/date";
import { bookingMessage } from "@/lib/messages";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({
    meta: [
      { title: "Meus horários — Cleisson Barber Club" },
      { name: "description", content: "Acompanhe seus agendamentos na Cleisson Barber Club." },
      { property: "og:title", content: "Meus horários — Cleisson Barber Club" },
      { property: "og:description", content: "Seus agendamentos em um só lugar." },
    ],
  }),
  component: ContaPage,
});

export const clientNav = [
  { to: "/", label: "Início", icon: <Home className="h-5 w-5" /> },
  { to: "/agendar", label: "Agendar", icon: <Scissors className="h-5 w-5" /> },
  { to: "/conta", label: "Horários", icon: <CalendarDays className="h-5 w-5" /> },
  { to: "/assinatura", label: "Assinatura", icon: <Star className="h-5 w-5" /> },
  { to: "/perfil", label: "Perfil", icon: <User className="h-5 w-5" /> },
];

function ContaPage() {
  const qc = useQueryClient();
  const accountFn = useServerFn(getMyAccount);
  const cancelFn = useServerFn(cancelMyAppointment);

  const { data, isLoading } = useQuery({
    queryKey: ["account"],
    queryFn: () => accountFn({ data: undefined as never }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: (res) => {
      if (res?.ok) {
        toast.success("Agendamento cancelado.");
        qc.invalidateQueries({ queryKey: ["account"] });
      } else {
        toast.error(bookingMessage(res?.code));
      }
    },
    onError: () => toast.error("Não foi possível cancelar. Tente novamente."),
  });

  const proximos = (data?.appointments ?? []).filter((a) => a.status === "agendado" || a.status === "confirmado");
  const anteriores = (data?.appointments ?? []).filter((a) => a.status === "concluido" || a.status === "cancelado");

  return (
    <>
      <Screen>
        <PageTitle eyebrow={`Olá, ${data?.nome ?? ""}`} title="Meus horários" />
        {data?.isAdmin ? (
          <Link to="/admin" className="panel mb-5 block p-4 text-sm font-semibold text-gold">
            Abrir painel do barbeiro →
          </Link>
        ) : null}

        {isLoading ? (
          <Loading />
        ) : proximos.length === 0 ? (
          <EmptyState title="Nenhum horário marcado" description="Agende seu próximo atendimento." />
        ) : (
          <div className="space-y-3">
            {proximos.map((a) => (
              <div key={a.id} className="panel p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-2xl text-gold">{hhmm(a.hora_inicio)}</p>
                    <p className="text-sm font-medium">{a.servico}</p>
                    <p className="text-xs text-muted-foreground">{formatDateBR(a.data)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {a.tipo_atendimento === "assinatura" ? "Assinatura" : brl(Number(a.preco))}
                  </span>
                  <button
                    onClick={() => cancel.mutate(a.id)}
                    disabled={cancel.isPending}
                    className="rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive"
                  >
                    CANCELAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {anteriores.length > 0 ? (
          <section className="mt-8">
            <p className="eyebrow">Histórico</p>
            <div className="panel mt-3 divide-y divide-border">
              {anteriores.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{a.servico}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBR(a.data)} · {hhmm(a.hora_inicio)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </Screen>
      <BottomNav items={clientNav} />
    </>
  );
}
