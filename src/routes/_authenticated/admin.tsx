import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import {
  getAgendaDay,
  completeAppointment,
  adminCancelAppointment,
  listClients,
  blockSlot,
  unblockSlot,
  getClientDetail,
  createClientProfile,
  adminCreateBooking,
  listSubscriptions,
  assignSubscription,
  cancelSubscription,
} from "@/lib/admin.functions";
import { getAvailability } from "@/lib/booking.functions";
import { supabase } from "@/integrations/supabase/client";
import { Screen, PageTitle, Loading, EmptyState, StatusBadge, SectionHeading } from "@/components/app/shell";
import { brl, formatDateBR, hhmm, todayISO, weekdayName } from "@/lib/date";
import { bookingMessage } from "@/lib/messages";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel do barbeiro — Cleisson Barber Club" },
      { name: "description", content: "Agenda do dia, atendimentos, clientes e assinaturas da barbearia." },
      { property: "og:title", content: "Painel do barbeiro — Cleisson Barber Club" },
      { property: "og:description", content: "Gestão da agenda da Cleisson Barber Club." },
    ],
  }),
  component: AdminPage,
});

type Tab = "agenda" | "clientes" | "assinaturas";

function AdminPage() {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState<Tab>("agenda");
  const [clientId, setClientId] = useState<string | null>(null);

  const agendaFn = useServerFn(getAgendaDay);
  const completeFn = useServerFn(completeAppointment);
  const cancelFn = useServerFn(adminCancelAppointment);
  const blockFn = useServerFn(blockSlot);
  const unblockFn = useServerFn(unblockSlot);

  const [blockTime, setBlockTime] = useState("");
  const [blockMotivo, setBlockMotivo] = useState("");
  const [newBooking, setNewBooking] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["agenda", date],
    queryFn: () => agendaFn({ data: { date } }),
    retry: false,
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
    mutationFn: () => blockFn({ data: { date, time: blockTime, motivo: blockMotivo || undefined } }),
    onSuccess: (res) => {
      if (res?.ok) {
        toast.success("Horário bloqueado.");
        setBlockTime("");
        setBlockMotivo("");
        qc.invalidateQueries({ queryKey: ["agenda"] });
      } else toast.error("Não foi possível bloquear esse horário.");
    },
  });

  const unblock = useMutation({
    mutationFn: (id: string) => unblockFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Bloqueio removido.");
      qc.invalidateQueries({ queryKey: ["agenda"] });
    },
  });

  if (isLoading && !data) {
    return (
      <Screen>
        <PageTitle eyebrow="Painel do barbeiro" title="Carregando" />
        <Loading rows={3} />
      </Screen>
    );
  }

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

  if (clientId) {
    return <ClientDetail id={clientId} onBack={() => setClientId(null)} />;
  }

  return (
    <Screen>
      <PageTitle eyebrow="Painel do barbeiro" title={date === todayISO() ? "Hoje" : formatDateBR(date)} />

      <div className="mb-7 grid grid-cols-3 gap-2">
        {(["agenda", "clientes", "assinaturas"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`focus-ring rounded-full border py-3 text-[0.6rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
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
            <div className="mt-5 space-y-2 border-t border-border/70 pt-5">
              <div className="flex gap-2">
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
              <input
                placeholder="Motivo (opcional)"
                value={blockMotivo}
                onChange={(e) => setBlockMotivo(e.target.value)}
                className="focus-ring h-12 w-full rounded-[var(--radius)] border border-border bg-background px-3 text-sm"
              />
            </div>
          </div>

          <div className="mt-7">
            <button
              onClick={() => setNewBooking((v) => !v)}
              className="action-primary focus-ring w-full"
            >
              {newBooking ? "Fechar" : "Novo agendamento"}
            </button>
            {newBooking ? (
              <NewBookingForm
                date={date}
                onDone={() => {
                  setNewBooking(false);
                  qc.invalidateQueries({ queryKey: ["agenda"] });
                }}
              />
            ) : null}
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
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-3">
                          <span className="font-display text-2xl text-gold">{hhmm(b.hora_inicio)}</span>
                          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Bloqueado
                          </span>
                        </div>
                        {b.motivo ? <p className="mt-1 text-xs text-muted-foreground">{b.motivo}</p> : null}
                      </div>
                      <button
                        onClick={() => unblock.mutate(b.id)}
                        className="focus-ring shrink-0 rounded-full border border-border px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                      >
                        Liberar
                      </button>
                    </div>
                  </div>
                ))}
                {(data?.items ?? []).map((a) => (
                  <div key={a.id} className="panel p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-3xl leading-none text-gold">{hhmm(a.hora_inicio)}</p>
                        <button
                          onClick={() => setClientId(a.cliente_id)}
                          className="focus-ring mt-3 block max-w-full truncate text-left text-sm font-semibold underline-offset-4 hover:underline"
                        >
                          {a.cliente}
                        </button>
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
      ) : tab === "clientes" ? (
        <ClientsTab onOpen={setClientId} />
      ) : (
        <SubscriptionsTab onOpen={setClientId} />
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

function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("ativo", true).order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscription_plans").select("*").eq("ativo", true).order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

const fieldClass =
  "focus-ring h-12 w-full rounded-[var(--radius)] border border-border bg-background px-3 text-sm";

function NewBookingForm({ date, onDone }: { date: string; onDone: () => void }) {
  const clientsFn = useServerFn(listClients);
  const availabilityFn = useServerFn(getAvailability);
  const bookFn = useServerFn(adminCreateBooking);

  const { data: clients } = useQuery({ queryKey: ["clients", ""], queryFn: () => clientsFn({ data: {} }) });
  const { data: services } = useServices();
  const { data: availability } = useQuery({
    queryKey: ["availability", date],
    queryFn: () => availabilityFn({ data: { date } }),
  });

  const [clienteId, setClienteId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [time, setTime] = useState("");
  const [usarAssinatura, setUsarAssinatura] = useState(false);

  const create = useMutation({
    mutationFn: () => bookFn({ data: { clienteId, serviceId, date, time, usarAssinatura } }),
    onSuccess: (res) => {
      if (res?.ok) {
        toast.success("Agendamento criado.");
        setTime("");
        onDone();
      } else toast.error(bookingMessage(res?.code));
    },
    onError: () => toast.error("Não foi possível criar o agendamento."),
  });

  const livres = (availability?.slots ?? []).filter((s) => s.available);

  return (
    <div className="panel mt-3 space-y-4 p-5">
      <div className="space-y-2">
        <label className="eyebrow" htmlFor="cli">Cliente</label>
        <select id="cli" value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={fieldClass}>
          <option value="">Selecione</option>
          {(clients ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
              {c.assinaturaAtiva ? ` · ${c.plano}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="eyebrow" htmlFor="srv">Serviço</label>
        <select id="srv" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={fieldClass}>
          <option value="">Selecione</option>
          {(services ?? []).map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.nome} — {brl(Number(s.preco))}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="eyebrow" htmlFor="hr">Horário livre em {formatDateBR(date)}</label>
        <select id="hr" value={time} onChange={(e) => setTime(e.target.value)} className={fieldClass}>
          <option value="">Selecione</option>
          {livres.map((s) => (
            <option key={s.time} value={s.time}>
              {s.time}
            </option>
          ))}
        </select>
        {availability?.closed ? <p className="text-xs text-muted-foreground">Barbearia fechada nesta data.</p> : null}
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={usarAssinatura}
          onChange={(e) => setUsarAssinatura(e.target.checked)}
          className="h-4 w-4 accent-[var(--gold,#D6A83F)]"
        />
        Usar benefício da assinatura
      </label>
      <button
        disabled={!clienteId || !serviceId || !time || create.isPending}
        onClick={() => create.mutate()}
        className="action-primary focus-ring w-full disabled:opacity-50"
      >
        Confirmar agendamento
      </button>
    </div>
  );
}

function ClientsTab({ onOpen }: { onOpen: (id: string) => void }) {
  const qc = useQueryClient();
  const clientsFn = useServerFn(listClients);
  const createFn = useServerFn(createClientProfile);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients", search],
    queryFn: () => clientsFn({ data: search ? { search } : {} }),
  });

  const create = useMutation({
    mutationFn: () => createFn({ data: { nome, telefone } }),
    onSuccess: (res) => {
      if (res?.ok) {
        toast.success("Cliente cadastrado.");
        setNome("");
        setTelefone("");
        setAdding(false);
        qc.invalidateQueries({ queryKey: ["clients"] });
      } else toast.error("Não foi possível cadastrar o cliente.");
    },
    onError: () => toast.error("Verifique nome e WhatsApp."),
  });

  return (
    <>
      <SectionHeading label="Clientes" />
      <input
        placeholder="Buscar por nome"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={fieldClass}
      />

      <button onClick={() => setAdding((v) => !v)} className="action-primary focus-ring mt-3 w-full">
        {adding ? "Fechar" : "Novo cliente"}
      </button>
      {adding ? (
        <div className="panel mt-3 space-y-4 p-5">
          <div className="space-y-2">
            <label className="eyebrow" htmlFor="cn">Nome completo</label>
            <input id="cn" value={nome} onChange={(e) => setNome(e.target.value)} className={fieldClass} />
          </div>
          <div className="space-y-2">
            <label className="eyebrow" htmlFor="ct">WhatsApp</label>
            <input
              id="ct"
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className={fieldClass}
            />
          </div>
          <button
            disabled={create.isPending}
            onClick={() => create.mutate()}
            className="action-primary focus-ring w-full disabled:opacity-50"
          >
            Cadastrar cliente
          </button>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <Loading />
        ) : (clients ?? []).length === 0 ? (
          <EmptyState title="Nenhum cliente encontrado" />
        ) : (
          (clients ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => onOpen(c.id)}
              className="panel focus-ring flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{c.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{c.telefone ?? "sem WhatsApp"}</p>
              </div>
              {c.assinaturaAtiva ? (
                <span className="shrink-0 rounded-full border border-gold/40 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-gold">
                  {c.plano}
                </span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </>
  );
}

function SubscriptionsTab({ onOpen }: { onOpen: (id: string) => void }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listSubscriptions);
  const cancelFn = useServerFn(cancelSubscription);

  const { data: subs, isLoading } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => listFn({ data: undefined as never }),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Assinatura cancelada.");
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  return (
    <>
      <SectionHeading label="Assinaturas" />
      {isLoading ? (
        <Loading />
      ) : (subs ?? []).length === 0 ? (
        <EmptyState title="Nenhuma assinatura" description="Ative um plano na ficha do cliente." />
      ) : (
        <div className="space-y-3">
          {(subs ?? []).map((s) => (
            <div key={s.id} className="panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    onClick={() => onOpen(s.clienteId)}
                    className="focus-ring block max-w-full truncate text-left text-sm font-semibold underline-offset-4 hover:underline"
                  >
                    {s.cliente}
                  </button>
                  <p className="truncate text-xs text-gold">{s.plano}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateBR(s.data_inicio)} — {formatDateBR(s.data_fim)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.58rem] font-semibold tracking-[0.12em] ${
                    s.ativa ? "border-success/40 text-success" : "border-destructive/40 text-destructive"
                  }`}
                >
                  {s.ativa ? "ATIVA" : "INATIVA"}
                </span>
              </div>
              {s.ativa ? (
                <button
                  onClick={() => {
                    if (confirm(`Cancelar a assinatura de ${s.cliente}?`)) cancel.mutate(s.id);
                  }}
                  className="focus-ring mt-4 w-full rounded-full border border-destructive/40 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-destructive"
                >
                  Cancelar assinatura
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ClientDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient();
  const detailFn = useServerFn(getClientDetail);
  const assignFn = useServerFn(assignSubscription);
  const { data: plans } = usePlans();
  const [planoId, setPlanoId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["client-detail", id],
    queryFn: () => detailFn({ data: { id } }),
  });

  const assign = useMutation({
    mutationFn: () => assignFn({ data: { clienteId: id, planoId } }),
    onSuccess: (res) => {
      if (res?.ok) {
        toast.success("Plano ativado para o cliente.");
        setPlanoId("");
        qc.invalidateQueries({ queryKey: ["client-detail", id] });
        qc.invalidateQueries({ queryKey: ["subscriptions"] });
        qc.invalidateQueries({ queryKey: ["clients"] });
      } else toast.error("Não foi possível ativar o plano.");
    },
  });

  return (
    <Screen>
      <button
        onClick={onBack}
        className="focus-ring mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {isLoading ? (
        <Loading />
      ) : !data?.profile ? (
        <EmptyState title="Cliente não encontrado" />
      ) : (
        <>
          <PageTitle eyebrow="Ficha do cliente" title={data.profile.nome} />
          <div className="panel p-5 text-sm">
            <p className="text-muted-foreground">{data.profile.telefone ?? "Sem WhatsApp cadastrado"}</p>
            {data.profile.email ? <p className="text-muted-foreground">{data.profile.email}</p> : null}
            {data.profile.telefone ? (
              <a
                href={`https://wa.me/55${data.profile.telefone}`}
                target="_blank"
                rel="noreferrer"
                className="focus-ring mt-4 inline-block rounded-full border border-gold/40 px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-gold"
              >
                Chamar no WhatsApp
              </a>
            ) : null}
          </div>

          <div className="mt-9">
            <SectionHeading label="Assinatura" />
            {data.assinatura ? (
              <div className="panel p-5">
                <p className="font-display text-2xl text-gold">{data.assinatura.plano}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateBR(data.assinatura.data_inicio)} — {formatDateBR(data.assinatura.data_fim)}
                </p>
                <div className="mt-4 space-y-2 border-t border-border/70 pt-4 text-sm">
                  {data.assinatura.beneficios.map((b) => (
                    <div key={b.tipo} className="flex items-center justify-between">
                      <span>{b.tipo === "corte" ? "Cortes" : "Barbas"}</span>
                      <span className="text-gold">
                        {b.limite === null ? "Ilimitado" : `${b.usados} / ${b.limite}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="panel space-y-4 p-5">
                <p className="text-sm text-muted-foreground">Este cliente não possui plano ativo.</p>
                <select value={planoId} onChange={(e) => setPlanoId(e.target.value)} className={fieldClass}>
                  <option value="">Escolher plano</option>
                  {(plans ?? []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {brl(Number(p.preco))}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!planoId || assign.isPending}
                  onClick={() => assign.mutate()}
                  className="action-primary focus-ring w-full disabled:opacity-50"
                >
                  Ativar plano
                </button>
              </div>
            )}
          </div>

          <div className="mt-9">
            <SectionHeading label="Histórico" />
            {data.historico.length === 0 ? (
              <EmptyState title="Sem atendimentos" />
            ) : (
              <div className="panel divide-y divide-border/70">
                {data.historico.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{a.servico}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateBR(a.data)} · {hhmm(a.hora_inicio)} ·{" "}
                        {a.tipo_atendimento === "assinatura" ? "Assinatura" : brl(Number(a.preco))}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Screen>
  );
}
