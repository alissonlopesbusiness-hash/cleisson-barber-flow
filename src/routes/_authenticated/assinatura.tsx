import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount } from "@/lib/account.functions";
import { Screen, PageTitle, Loading, BottomNav, Panel } from "@/components/app/shell";
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
        <PageTitle eyebrow="Cleisson Barber Club" title="Minha assinatura" />
        {isLoading ? (
          <Loading rows={2} />
        ) : sub ? (
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-gold">{sub.plano.toUpperCase()}</h2>
              <span
                className={`rounded-full border px-3 py-1 text-[0.62rem] font-semibold tracking-widest ${
                  sub.ativa ? "border-success/40 text-success" : "border-destructive/40 text-destructive"
                }`}
              >
                {sub.ativa ? "ATIVA" : "EXPIRADA"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Início em {formatDateBR(sub.data_inicio)} · Válido até {formatDateBR(sub.data_fim)}
            </p>
            <div className="mt-5 space-y-4">
              {sub.beneficios.map((b) => (
                <div key={b.tipo}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{b.tipo === "corte" ? "Cortes" : "Barbas"}</span>
                    <span className="text-gold">
                      {b.limite === null ? "Ilimitado" : `${b.usados} / ${b.limite} utilizados`}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: b.limite === null ? "100%" : `${Math.min(100, (b.usados / b.limite) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : (
          <Panel>
            <p className="text-sm text-muted-foreground">
              Você ainda não possui uma assinatura. Fale com o barbeiro para ativar um plano.
            </p>
          </Panel>
        )}

        <section className="mt-8">
          <p className="eyebrow">Planos disponíveis</p>
          <div className="mt-3 space-y-3">
            {(plans ?? []).map((p) => (
              <div key={p.id} className="panel p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-xl">{p.nome}</p>
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
                    {p.tipo === "premium" ? (
                      <p className="mt-1 text-[0.65rem] font-semibold tracking-widest text-gold">MAIS VANTAJOSO ★★★</p>
                    ) : null}
                  </div>
                  <p className="font-display text-2xl text-gold">{brl(p.preco)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Screen>
      <BottomNav items={clientNav} />
    </>
  );
}
