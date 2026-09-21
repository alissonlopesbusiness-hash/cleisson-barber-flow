import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, Home, Scissors, User } from "lucide-react";
import { getMyAccount, cancelMyAppointment } from "@/lib/account.functions";
import {
  Screen,
  PageTitle,
  Loading,
  EmptyState,
  StatusBadge,
  BottomNav,
  SectionHeading,
} from "@/components/app/shell";
import { brl, formatDateBR, hhmm, addMinutes, weekdayName } from "@/lib/date";
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
  const [next, ...outros] = proximos;
  const anteriores = (data?.appointments ?? []).filter((a) => a.status === "concluido" || a.status === "cancelado");

  return (
    <>
      <Screen>
        <PageTitle eyebrow={data?.nome ? `Olá, ${data.nome.split(" ")[0]}` : "Área do cliente"} title="Meus horários" />

        {data?.isAdmin ? (
          <Link to="/admin" className="panel focus-ring mb-6 block p-4 text-sm font-semibold text-gold">
            Abrir painel do barbeiro →
          </Link>
        ) : null}

        {isLoading ? (
          <Loading />
        ) : !next ? (
          <EmptyState title="Nenhum horário marcado" description="Agende seu próximo atendimento." />
        ) : (
          <>
            <SectionHeading label="Próximo atendimento" />
            <div className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-4xl leading-none text-gold">{hhmm(next.hora_inicio)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    até {addMinutes(hhmm(next.hora_inicio), 30)}
                  </p>
                </div>
                <StatusBadge status={next.status} />
              </div>
              <p className="mt-4 truncate text-base">{next.servico}</p>
              <p className="text-sm text-muted-foreground">
                {weekdayName(next.data)}, {formatDateBR(next.data)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
                <span className="text-sm text-muted-foreground">
                  {brl(Number(next.preco))}
                </span>
                <button
                  onClick={() => cancel.mutate(next.id)}
                  disabled={cancel.isPending}
                  className="focus-ring rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-destructive"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}

        {outros.length > 0 ? (
          <section className="mt-9">
            <SectionHeading label="Também agendados" />
            <div className="space-y-3">
              {outros.map((a) => (
                <div key={a.id} className="panel flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{a.servico}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBR(a.data)} · {hhmm(a.hora_inicio)}
                    </p>
                  </div>
                  <button
                    onClick={() => cancel.mutate(a.id)}
                    disabled={cancel.isPending}
                    className="focus-ring shrink-0 rounded-full border border-destructive/40 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-destructive"
                  >
                    Cancelar
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {anteriores.length > 0 ? (
          <section className="mt-9">
            <SectionHeading label="Histórico" />
            <div className="panel divide-y divide-border/70">
              {anteriores.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{a.servico}</p>
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
