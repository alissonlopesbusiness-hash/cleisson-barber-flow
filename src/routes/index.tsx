import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Logo, Screen } from "@/components/app/shell";
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
      { property: "og:description", content: "Escolha seu serviço, data e horário." },
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
    <Screen className="pb-10">
      <div className="flex flex-col items-center pt-6 text-center">
        <Logo className="w-56" />
        <p className="eyebrow mt-6">Cleisson Barber Club</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-wide">AGENDE SEU HORÁRIO</h1>
        <p className="mt-3 text-sm text-muted-foreground">Escolha seu serviço, data e horário.</p>

        <Link
          to="/agendar"
          className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-primary text-sm font-bold tracking-widest text-primary-foreground"
        >
          AGENDAR HORÁRIO
        </Link>
        <Link to="/entrar" className="mt-4 text-sm font-medium text-gold underline-offset-4">
          Área do cliente
        </Link>
      </div>

      <section className="mt-10">
        <p className="eyebrow">Serviços</p>
        <div className="mt-3 panel divide-y divide-border">
          {(services ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">{s.nome}</span>
              <span className="font-display text-lg text-gold">{brl(s.preco)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <p className="eyebrow">Horário de funcionamento</p>
        <div className="panel mt-3 px-4 py-3 text-sm text-muted-foreground">
          <p>Segunda a sexta — 09:00 às 19:00</p>
          <p className="mt-1">Sábado e domingo — 09:00 às 19:30</p>
        </div>
      </section>
    </Screen>
  );
}
