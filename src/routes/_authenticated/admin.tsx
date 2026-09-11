import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getAgendaDay, completeAppointment, adminCancelAppointment, listClients, blockSlot } from "@/lib/admin.functions";
import { Screen, PageTitle, Loading, EmptyState, StatusBadge, SectionHeading } from "@/components/app/shell";
import { brl, formatDateBR, hhmm, todayISO, weekdayName } from "@/lib/date";
import { bookingMessage } from "@/lib/messages";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do barbeiro — Cleisson Barber Club" },
      { name: "description", content: "Agenda do dia, atendimentos e clientes da barbearia." },
      { property: "og:title", content: "Painel do barbeiro — Cleisson Barber Club" },
      { property: "og:description", content: "Gestão da agenda da Cleisson Barber Club." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState<"agenda" | "clientes">("agenda");
  const [blockTime, setBlockTime] = useState("");

  const agendaFn = useServerFn(getAgendaDay);
  const completeFn = useServerFn(completeAppointment);
  const cancelFn = useServerFn(adminCancelAppointment);
  const clientsFn = useServerFn(listClients);
  const blockFn = useServerFn(blockSlot);

  const { data, isLoading, error } = useQuery({
    queryKey: ["agenda", date],
    queryFn: () => agendaFn({ data: { date } }),
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientsFn({ data: {} }),
    enabled: tab === "clientes",
  });

  const act = useMutation({
    mutationFn: async ({ id, kind }: { id: string; kind: "concluir" | "cancelar" }) =>
      kind === "concluir" ? completeFn({ data: { id } }) : cancelFn({ data: { id } }),
    onSuccess: (res) => {
      if (res?.ok) {
        toast.success("Atendimento atualizado.");
        qc.invalidateQueries({ queryKey: ["agenda"] });
      } else {
        toast.error(bookingMessage(res?.code));
      }
    },
    onError: () => toast.error("Não foi possível atualizar o atendimento."),
  });

  const block = useMutation({
    mutationFn: () => blockFn({ data: { date, time: blockTime } }),
    onSuccess: (res) => {
      if (res?.ok) {
        toast.success("Horário bloqueado.");
        setBlockTime("");
        qc.invalidateQueries({ queryKey: ["agenda"] });
      } else toast.error("Não foi possível bloquear esse horário.");
    },
  });

  if (error) {
    return (
      <Screen>
        <EmptyState title="Acesso restrito" description="Esta área é exclusiva do barbeiro." />
        <Link to="/conta" className="focus-ring mt-6 block text-center text-sm text-gold">
          Voltar
        </Link>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageTitle eyebrow="Painel do barbeiro" title={date === todayISO() ? "Hoje" : formatDateBR(date)} />

      <div className="mb-7 grid grid-cols-2 gap-2">
        {(["agenda", "clientes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`focus-ring rounded-full border py-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition-colors ${
              tab === t ? "border-gold text-gold" : "border-border text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "agenda" ? (
        <>
          <div className="mb-7 grid grid-cols-3 gap-2">
            <Stat label="Agenda" value={data?.stats.total ?? 0} />
            <Stat label="Assinantes" value={data?.stats.assinantes ?? 0} />
            <Stat label="Concluídos" value={data?.stats.concluidos ?? 0} />
          </div>

          <SectionHeading label="Data e bloqueios" />
          <div className="panel p-5">
            <label className="eyebrow" htmlFor="d">Dia</label>
            <input
              id="d"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayISO())}
              className="focus-ring mt-2 h-12 w-full rounded-[var(--radius)] border border-border bg-background px-3 text-sm"
            />
            <p className="mt-2 text-xs capitalize text-muted-foreground">{weekdayName(date)}</p>
            <div className="mt-5 flex gap-2 border-t border-border/70 pt-5">
              <input
                type="time"
                step={1800}
                value={blockTime}
                onChange={(e) => setBlockTime(e.target.value)}
                className="focus-ring h-12 min-w-0 flex-1 rounded-[var(--radius)] border border-border bg-background px-3 text-sm"
              />
              <button
                disabled={!blockTime || block.isPending}
                onClick={() => block.mutate()}
                className="focus-ring shrink-0 rounded-full border border-gold/40 px-5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-gold disabled:opacity-50"
              >
                Bloquear
              </button>
            </div>
          </div>

          <div className="mt-9">
            <SectionHeading label="Atendimentos" />
            {isLoading ? (
              <Loading />
            ) : (data?.items.length ?? 0) === 0 && (data?.blocks.length ?? 0) === 0 ? (
              <EmptyState title="Nenhum atendimento" description="Não há agendamentos nesta data." />
            ) : (
              <div className="space-y-3">
                {(data?.blocks ?? []).map((b) => (
                  <div key={b.id} className="panel border-dashed p-4">
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-2xl text-gold">{hhmm(b.hora_inicio)}</span>
                      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Bloqueado
                      </span>
                    </div>
                    {b.motivo ? <p className="mt-1 text-xs text-muted-foreground">{b.motivo}</p> : null}
                  </div>
                ))}
                {(data?.items ?? []).map((a) => (
                  <div key={a.id} className="panel p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-3xl leading-none text-gold">{hhmm(a.hora_inicio)}</p>
                        <p className="mt-3 truncate text-sm font-semibold">{a.cliente}</p>
                        <p className="truncate text-sm text-muted-foreground">{a.servico}</p>
                        {a.plano ? (
                          <p className="mt-1 text-[0.62rem] uppercase tracking-[0.14em] text-gold">
                            Assinante · {a.plano}
                          </p>
                        ) : null}
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="mt-4 border-t border-border/70 pt-4">
                      <p className="text-sm text-muted-foreground">
                        {a.tipo_atendimento === "assinatura" ? "Assinatura" : brl(Number(a.preco))}
                      </p>
                      {a.status === "agendado" || a.status === "confirmado" ? (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => {
                              if (confirm(`Concluir atendimento de ${a.cliente} (${a.servico})?`))
                                act.mutate({ id: a.id, kind: "concluir" });
                            }}
                            className="action-primary focus-ring flex-1"
                          >
                            Concluir
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Cancelar este atendimento?")) act.mutate({ id: a.id, kind: "cancelar" });
                            }}
                            className="focus-ring flex-1 rounded-full border border-destructive/40 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-destructive"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <SectionHeading label="Clientes" />
          <div className="space-y-3">
            {(clients ?? []).map((c) => (
              <div key={c.id} className="panel flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.telefone ?? "sem WhatsApp"}</p>
                </div>
                {c.assinaturaAtiva ? (
                  <span className="shrink-0 rounded-full border border-gold/40 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-gold">
                    {c.plano}
                  </span>
                ) : null}
              </div>
            ))}
            {(clients ?? []).length === 0 ? <EmptyState title="Nenhum cliente cadastrado" /> : null}
          </div>
        </>
      )}

      <Link to="/conta" className="focus-ring mt-9 block text-center text-sm text-muted-foreground">
        Voltar para minha conta
      </Link>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel px-2 py-4 text-center">
      <p className="font-display text-3xl leading-none text-gold">{value}</p>
      <p className="mt-2 text-[0.55rem] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
    </div>
  );
}
