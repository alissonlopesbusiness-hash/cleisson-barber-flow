import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccount, updateMyProfile, claimBarberRole } from "@/lib/account.functions";
import { Screen, PageTitle, BottomNav, SectionHeading } from "@/components/app/shell";
import { clientNav } from "./conta";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Cleisson Barber Club" },
      { name: "description", content: "Atualize seus dados de contato." },
      { property: "og:title", content: "Perfil — Cleisson Barber Club" },
      { property: "og:description", content: "Seus dados na Cleisson Barber Club." },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const accountFn = useServerFn(getMyAccount);
  const updateFn = useServerFn(updateMyProfile);
  const claimFn = useServerFn(claimBarberRole);

  const { data } = useQuery({ queryKey: ["account"], queryFn: () => accountFn({ data: undefined as never }) });
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  useEffect(() => {
    if (data) {
      setNome(data.nome);
      setTelefone(data.telefone ?? "");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => updateFn({ data: { nome, telefone } }),
    onSuccess: () => {
      toast.success("Dados atualizados.");
      qc.invalidateQueries({ queryKey: ["account"] });
    },
    onError: () => toast.error("Não foi possível salvar. Verifique os dados."),
  });

  const claim = useMutation({
    mutationFn: () => claimFn({ data: undefined as never }),
    onSuccess: (res) => {
      if (res?.ok) {
        toast.success("Acesso de barbeiro ativado.");
        qc.invalidateQueries();
      } else {
        toast.error("O painel do barbeiro já pertence a outra conta.");
      }
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <>
      <Screen>
        <PageTitle eyebrow="Sua conta" title="Perfil" />

        <SectionHeading label="Dados pessoais" />
        <div className="panel space-y-5 p-5">
          <div className="space-y-2">
            <Label htmlFor="n" className="eyebrow">Nome completo</Label>
            <Input id="n" value={nome} onChange={(e) => setNome(e.target.value)} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t" className="eyebrow">WhatsApp</Label>
            <Input id="t" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="h-12" />
          </div>
          {data?.email ? (
            <p className="text-xs text-muted-foreground">Acesso: {data.email}</p>
          ) : null}
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="action-primary focus-ring w-full disabled:opacity-60"
          >
            Salvar alterações
          </button>
        </div>

        {data && !data.isAdmin && !data.adminExists ? (
          <button
            onClick={() => claim.mutate()}
            className="panel focus-ring mt-6 w-full p-4 text-left text-sm font-semibold text-gold"
          >
            Sou o barbeiro — ativar painel administrativo
          </button>
        ) : null}

        <button
          onClick={signOut}
          className="focus-ring mt-8 w-full rounded-full border border-destructive/35 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-destructive"
        >
          Sair da conta
        </button>
      </Screen>
      <BottomNav items={clientNav} />
    </>
  );
}
