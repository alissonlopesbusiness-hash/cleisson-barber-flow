import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount } from "@/lib/account.functions";
import { Screen, PageTitle, Loading, BottomNav, EmptyState, SectionHeading } from "@/components/app/shell";
import { clientNav } from "./conta";
import { brl, formatDateBR } from "@/lib/date";

export const Route = createFileRoute("/_authenticated/assinatura")({
  head: () => ({
    meta: [
      { title: "Minha assinatura — Cleisson Barber Club" },
      { name: "description", content: "Veja seu plano, validade e benefícios utilizados." },
      { property: "og:title", content: "Minha assinatura — Cleisson Barber Club" },
      { property: "og:description", content: "Planos e benefícios da Cleisson Barber Club." },
    ],
  }),
  component: AssinaturaPage,
});

function AssinaturaPage() {
  const accountFn = useServerFn(getMyAccount);
  const { data, isLoading } = useQuery({
    queryKey: ["account"],
    queryFn: () => accountFn({ data: undefined as never }),
  });

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  const sub = data?.subscription;

  return (
    <>
      <Screen>
        <PageTitle eyebrow="Clube" title="Minha assinatura" />

        {isLoading ? (
          <Loading rows={2} />
        ) : sub ? (
          <>
            <SectionHeading label="Plano atual" />
            <div className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-3xl leading-none text-gold">{sub.plano}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDateBR(sub.data_inicio)} — {formatDateBR(sub.data_fim)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.58rem] font-semibold tracking-[0.12em] ${
                    sub.ativa ? "border-success/40 text-success" : "border-destructive/40 text-destructive"
                  }`}
                >
                  {sub.ativa ? "ATIVA" : "EXPIRADA"}
                </span>
              </div>

              <div className="mt-6 space-y-5 border-t border-border/70 pt-5">
                {sub.beneficios.map((b) => (
                  <div key={b.tipo}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{b.tipo === "corte" ? "Cortes" : "Barbas"}</span>
                      <span className="text-gold">
                        {b.limite === null ? "Ilimitado" : `${b.usados} / ${b.limite}`}
                      </span>
                    </div>
                    <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-gold"
                        style={{
                          width: b.limite === null ? "100%" : `${Math.min(100, (b.usados / b.limite) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title="Sem assinatura ativa"
            description="Fale com o barbeiro para ativar um dos planos do clube."
          />
        )}

        <section className="mt-9">
          <SectionHeading label="Planos do clube" />
          <div className="space-y-3">
            {(plans ?? []).map((p) => {
              const premium = p.id === destaqueId;
              return (
                <div
                  key={p.id}
                  className={`panel p-5 ${premium ? "border-gold/45" : ""}`}
                >
                  {premium ? (
                    <p className="mb-3 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold">
                      Mais vantajoso ★★★
                    </p>
                  ) : null}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display text-2xl leading-tight">{p.nome}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.ilimitado
                          ? `Ilimitado · ${p.duracao_dias} dias`
                          : [
                              p.cortes_limite ? `${p.cortes_limite} cortes` : null,
                              p.barbas_limite ? `${p.barbas_limite} barbas` : null,
                            ]
                              .filter(Boolean)
                              .join(" + ")}
                      </p>
                    </div>
                    <p className="shrink-0 font-display text-2xl text-gold">{brl(p.preco)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </Screen>
      <BottomNav items={clientNav} />
    </>
  );
}
