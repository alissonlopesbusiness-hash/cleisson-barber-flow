import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAvailability, createGuestBooking } from "@/lib/booking.functions";
import { createMyBooking, getMyAccount } from "@/lib/account.functions";
import { Logo, Screen, Loading, EmptyState, StepHeader, SectionHeading } from "@/components/app/shell";
import { MonthCalendar } from "@/components/app/month-calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, todayISO, formatDateBR, weekdayName, addMinutes } from "@/lib/date";
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

const STEP_LABEL = ["Serviço", "Data", "Horário", "Seus dados", "Confirmação"];

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
  const qc = useQueryClient();

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
        qc.invalidateQueries({ queryKey: ["account"] });
        qc.invalidateQueries({ queryKey: ["agenda"] });
        qc.invalidateQueries({ queryKey: ["availability"] });
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
      <Screen className="pb-14">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-gold text-gold">
            <Check className="h-7 w-7" />
          </div>
          <p className="eyebrow mt-6">Tudo certo</p>
          <h1 className="mt-2 text-[2.2rem] leading-none">
            Horário <span className="italic text-gold">confirmado</span>
          </h1>

          <div className="panel mt-7 w-full space-y-3 p-5 text-left text-sm">
            <Row label="Serviço" value={service?.nome ?? ""} />
            <Row label="Data" value={formatDateBR(date)} />
            <Row label="Horário" value={`${time} — ${time ? addMinutes(time, 30) : ""}`} />
          </div>

          <Link to={signedIn ? "/conta" : "/entrar"} className="action-primary focus-ring mt-7 w-full">
            Ver meu agendamento
          </Link>
          <Link to="/" className="focus-ring mt-4 inline-flex h-11 items-center text-sm text-muted-foreground">
            Voltar ao início
          </Link>
          <Logo className="mt-8 h-14 w-14 opacity-50" />
        </div>
      </Screen>
    );
  }

  return (
    <Screen className="pb-14">
      <StepHeader step={step} total={5} onBack={() => (step === 1 ? navigate({ to: "/" }) : setStep(step - 1))} />

      <p className="eyebrow">Etapa {step} de 5</p>
      <h1 className="mt-2 mb-6 text-[2.1rem] leading-none">{STEP_LABEL[step - 1]}</h1>

      {step === 1 ? (
        <section className="space-y-3">
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
                  "panel focus-ring flex w-full items-center gap-3 p-4 text-left",
                  serviceId === s.id && "border-gold",
                )}
              >
                <span className="min-w-0 flex-1 truncate text-base">{s.nome}</span>
                <span className="font-display text-xl text-gold">{brl(s.preco)}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))
          )}
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <MonthCalendar
            value={date}
            onSelect={(iso) => {
              setDate(iso);
              setTime(null);
              setStep(3);
            }}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Toque em um dia para ver os horários livres.
          </p>
        </section>
      ) : null}

      {step === 3 ? (
        <section>
          <p className="-mt-4 mb-5 text-sm text-muted-foreground">
            {weekdayName(date)}, {formatDateBR(date)}
          </p>
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
                    "focus-ring rounded-md border py-3 text-sm tabular-nums transition-colors",
                    s.available
                      ? "border-border text-foreground"
                      : "cursor-not-allowed border-transparent bg-secondary/40 text-muted-foreground/40 line-through",
                    time === s.time && "border-gold bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setStep(2)}
            className="focus-ring mt-6 w-full text-center text-sm text-gold"
          >
            Escolher outra data
          </button>
        </section>
      ) : null}

      {step === 4 ? (
        <section>
          <div className="panel space-y-4 p-5">
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
              className={cn(
                "panel focus-ring mt-4 flex w-full items-center justify-between gap-3 p-4 text-left",
                usarAssinatura && "border-gold",
              )}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gold">Usar benefício da assinatura</span>
                <span className="text-xs text-muted-foreground">{sub?.plano}</span>
              </span>
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                  usarAssinatura ? "border-gold bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {usarAssinatura ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
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
            className="action-primary focus-ring mt-6 w-full"
          >
            Continuar
          </button>
        </section>
      ) : null}

      {step === 5 ? (
        <section>
          <SectionHeading label="Resumo" />
          <div className="panel space-y-3 p-5 text-sm">
            <Row label="Serviço" value={service?.nome ?? ""} />
            <Row label="Data" value={`${weekdayName(date)}, ${formatDateBR(date)}`} />
            <Row label="Horário" value={`${time} — ${time ? addMinutes(time, 30) : ""}`} />
            <Row label="Cliente" value={nome} />
            <div className="border-t border-border/70 pt-3">
              <Row
                label="Valor"
                value={usarAssinatura && podeUsarAssinatura ? "Assinatura" : brl(Number(service?.preco ?? 0))}
              />
            </div>
          </div>
          <button
            disabled={confirm.isPending}
            onClick={() => confirm.mutate()}
            className="action-primary focus-ring mt-6 w-full"
          >
            {confirm.isPending ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </section>
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
