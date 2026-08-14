import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAvailability, createGuestBooking } from "@/lib/booking.functions";
import { createMyBooking, getMyAccount } from "@/lib/account.functions";
import { Logo, Screen, Loading, EmptyState } from "@/components/app/shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, todayISO, formatDateBR, weekdayName, addMinutes, dateToISO } from "@/lib/date";
import { bookingMessage } from "@/lib/messages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar horário — Cleisson Barber Club" },
      { name: "description", content: "Escolha serviço, data e horário e confirme seu agendamento." },
      { property: "og:title", content: "Agendar horário — Cleisson Barber Club" },
      { property: "og:description", content: "Agende cabelo, barba e mais em poucos toques." },
    ],
  }),
  component: BookingPage,
});

function nextDays(count: number) {
  const base = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    return dateToISO(d);
  });
}

function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string>(todayISO());
  const [time, setTime] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [usarAssinatura, setUsarAssinatura] = useState(false);
  const [done, setDone] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  const accountFn = useServerFn(getMyAccount);
  const { data: account } = useQuery({
    queryKey: ["account"],
    queryFn: () => accountFn({ data: undefined as never }),
    enabled: signedIn === true,
  });

  useEffect(() => {
    if (account) {
      setNome((n) => n || account.nome);
      setTelefone((t) => t || account.telefone || "");
    }
  }, [account]);

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("ativo", true).order("ordem");
      if (error) throw error;
      return data;
    },
  });

  const availabilityFn = useServerFn(getAvailability);
  const { data: availability, isLoading: loadingSlots } = useQuery({
    queryKey: ["availability", date],
    queryFn: () => availabilityFn({ data: { date } }),
    enabled: step >= 3,
  });

  const service = (services ?? []).find((s) => s.id === serviceId);
  const sub = account?.subscription;
  const podeUsarAssinatura = Boolean(
    sub?.ativa &&
      service &&
      ((service.consome_corte && sub.beneficios.some((b) => b.tipo === "corte" && (b.limite === null || b.usados < b.limite))) ||
        (service.consome_barba && sub.beneficios.some((b) => b.tipo === "barba" && (b.limite === null || b.usados < b.limite)))) &&
      (!service.consome_corte || sub.beneficios.some((b) => b.tipo === "corte" && (b.limite === null || b.usados < b.limite))) &&
      (!service.consome_barba || sub.beneficios.some((b) => b.tipo === "barba" && (b.limite === null || b.usados < b.limite))),
  );

  const guestFn = useServerFn(createGuestBooking);
  const myFn = useServerFn(createMyBooking);

  const confirm = useMutation({
    mutationFn: async () => {
      if (!serviceId || !time) throw new Error("dados");
      if (signedIn) {
        return myFn({
          data: { serviceId, date, time, usarAssinatura: podeUsarAssinatura && usarAssinatura, nome, telefone },
        });
      }
      return guestFn({ data: { serviceId, date, time, nome, telefone } });
    },
    onSuccess: (res) => {
      if (res?.ok) {
        setDone(true);
      } else {
        toast.error(bookingMessage(res?.code));
        if (res?.code === "horario_ocupado" || res?.code === "bloqueado" || res?.code === "horario_passado") {
          setTime(null);
          setStep(3);
        }
      }
    },
    onError: () => toast.error("Não foi possível concluir o agendamento. Tente novamente."),
  });

  if (done) {
    return (
      <Screen className="pb-10">
        <div className="flex flex-col items-center pt-10 text-center">
          <Logo className="w-32" />
          <h1 className="mt-8 text-3xl font-semibold text-gold">AGENDAMENTO CONFIRMADO</h1>
          <div className="panel mt-6 w-full space-y-2 p-5 text-left text-sm">
            <p>✓ {service?.nome}</p>
            <p>✓ {formatDateBR(date)}</p>
            <p>✓ {time} — {time ? addMinutes(time, 30) : ""}</p>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">Seu horário foi reservado com sucesso.</p>
          <Link
            to={signedIn ? "/conta" : "/entrar"}
            className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-primary text-sm font-bold tracking-widest text-primary-foreground"
          >
            VER MEU AGENDAMENTO
          </Link>
          <Link to="/" className="mt-4 text-sm text-muted-foreground">
            Voltar ao início
          </Link>
        </div>
      </Screen>
    );
  }

  return (
    <Screen className="pb-16">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => (step === 1 ? navigate({ to: "/" }) : setStep(step - 1))}
          className="text-sm text-muted-foreground"
        >
          ← Voltar
        </button>
        <span className="eyebrow">Etapa {step} de 5</span>
      </div>

      {step === 1 ? (
        <section>
          <h1 className="text-2xl font-semibold">Escolha o serviço</h1>
          <div className="mt-4 space-y-3">
            {loadingServices ? (
              <Loading />
            ) : (
              (services ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setServiceId(s.id);
                    setStep(2);
                  }}
                  className={cn(
                    "panel flex w-full items-center justify-between p-4 text-left transition-colors",
                    serviceId === s.id && "border-gold",
                  )}
                >
                  <span className="text-base font-medium">{s.nome}</span>
                  <span className="font-display text-xl text-gold">{brl(s.preco)}</span>
                </button>
              ))
            )}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <h1 className="text-2xl font-semibold">Escolha a data</h1>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {nextDays(21).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDate(d);
                  setTime(null);
                  setStep(3);
                }}
                className={cn(
                  "panel px-2 py-3 text-center",
                  date === d && "border-gold",
                )}
              >
                <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  {weekdayName(d).slice(0, 3)}
                </p>
                <p className="mt-1 font-display text-xl text-gold">{d.slice(8)}</p>
                <p className="text-[0.65rem] text-muted-foreground">{d.slice(5, 7)}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section>
          <h1 className="text-2xl font-semibold">Escolha o horário</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {weekdayName(date)}, {formatDateBR(date)}
          </p>
          <div className="mt-4">
            {loadingSlots ? (
              <Loading rows={2} />
            ) : availability?.closed ? (
              <EmptyState title="Fechado" description="A barbearia não atende nesta data." />
            ) : availability?.slots.every((s) => !s.available) ? (
              <EmptyState title="Sem horários" description="Escolha outra data." />
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {(availability?.slots ?? []).map((s) => (
                  <button
                    key={s.time}
                    disabled={!s.available}
                    onClick={() => {
                      setTime(s.time);
                      setStep(4);
                    }}
                    className={cn(
                      "rounded-xl border py-3 text-sm font-medium transition-colors",
                      s.available
                        ? "border-gold/25 bg-surface text-foreground"
                        : "cursor-not-allowed border-border bg-secondary/40 text-muted-foreground/50 line-through",
                      time === s.time && "border-gold bg-primary text-primary-foreground",
                    )}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section>
          <h1 className="text-2xl font-semibold">Seus dados</h1>
          <div className="panel mt-4 space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="n">Nome completo</Label>
              <Input id="n" value={nome} onChange={(e) => setNome(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="w">WhatsApp</Label>
              <Input
                id="w"
                inputMode="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          {podeUsarAssinatura ? (
            <button
              onClick={() => setUsarAssinatura(!usarAssinatura)}
              className={cn("panel mt-4 flex w-full items-center justify-between p-4 text-left", usarAssinatura && "border-gold")}
            >
              <span>
                <span className="block text-sm font-semibold text-gold">USAR BENEFÍCIO DA ASSINATURA</span>
                <span className="text-xs text-muted-foreground">{sub?.plano}</span>
              </span>
              <span className={cn("h-5 w-5 rounded-full border", usarAssinatura ? "border-gold bg-primary" : "border-border")} />
            </button>
          ) : null}

          <button
            onClick={() => {
              if (nome.trim().length < 3) {
                toast.error("Informe seu nome completo.");
                return;
              }
              if (telefone.replace(/\D/g, "").length < 10) {
                toast.error("Informe um WhatsApp válido.");
                return;
              }
              setStep(5);
            }}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-primary text-sm font-bold tracking-widest text-primary-foreground"
          >
            CONTINUAR
          </button>
        </section>
      ) : null}

      {step === 5 ? (
        <section>
          <h1 className="text-2xl font-semibold">Seu agendamento</h1>
          <div className="panel mt-4 space-y-3 p-5 text-sm">
            <Row label="Serviço" value={service?.nome ?? ""} />
            <Row label="Data" value={formatDateBR(date)} />
            <Row label="Horário" value={`${time} — ${time ? addMinutes(time, 30) : ""}`} />
            <Row
              label="Valor"
              value={usarAssinatura && podeUsarAssinatura ? "Assinatura" : brl(Number(service?.preco ?? 0))}
            />
          </div>
          <button
            disabled={confirm.isPending}
            onClick={() => confirm.mutate()}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-primary text-sm font-bold tracking-widest text-primary-foreground disabled:opacity-60"
          >
            {confirm.isPending ? "CONFIRMANDO..." : "CONFIRMAR AGENDAMENTO"}
          </button>
        </section>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
