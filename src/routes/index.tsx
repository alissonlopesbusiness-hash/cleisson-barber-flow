import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo, Screen, SectionHeading } from "@/components/app/shell";
import { brl } from "@/lib/date";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cleisson Barber Club — Agende seu horário" },
      {
        name: "description",
        content: "Cabelo, barba e assinaturas na Cleisson Barber Club. Escolha serviço, data e horário pelo celular.",
      },
      { property: "og:title", content: "Cleisson Barber Club — Agende seu horário" },
      { property: "og:description", content: "Escolha seu serviço, data e horário em poucos toques." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("ativo", true).order("ordem");
      if (error) throw error;
      return data;
    },
  });

  return (
    <Screen className="pb-16">
      <div className="flex flex-col items-center text-center">
        <Logo className="h-40 w-40" />
        <p className="eyebrow mt-5">Barbearia & clube</p>
        <h1 className="mt-3 text-[2.6rem] leading-[0.95]">
          Agende seu
          <br />
          <span className="italic text-gold">horário</span>
        </h1>
        <p className="mt-4 max-w-[17rem] text-sm text-muted-foreground">
          Serviço, data e horário em poucos toques. Sem fila, sem espera.
        </p>

        <Link to="/agendar" className="action-primary focus-ring mt-7 w-full">
          Agendar horário
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/entrar"
          className="focus-ring mt-4 inline-flex h-11 items-center justify-center text-sm font-medium text-gold"
        >
          Área do cliente
        </Link>
      </div>

      <section className="mt-12">
        <SectionHeading label="Serviços" />
        <div className="panel divide-y divide-border/70">
          {(services ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="min-w-0 truncate text-sm">{s.nome}</span>
              <span className="font-display text-xl text-gold">{brl(s.preco)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading label="Funcionamento" />
        <div className="panel space-y-3 p-4 text-sm">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <div className="min-w-0">
              <p>Segunda a sexta — 09:00 às 19:00</p>
              <p className="mt-1 text-muted-foreground">Sábado e domingo — 09:00 às 19:30</p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-border/70 pt-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p className="min-w-0 text-muted-foreground">Atendimento com hora marcada.</p>
          </div>
        </div>
      </section>
    </Screen>
  );
}
