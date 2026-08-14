import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo, Screen } from "@/components/app/shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Cleisson Barber Club" },
      { name: "description", content: "Acesse sua conta para ver agendamentos e assinatura." },
      { property: "og:title", content: "Entrar — Cleisson Barber Club" },
      { property: "og:description", content: "Área do cliente da Cleisson Barber Club." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/conta", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        if (nome.trim().length < 3) {
          toast.error("Informe seu nome completo.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome: nome.trim(), telefone: telefone.replace(/\D/g, "") },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Confira seu e-mail para confirmar o cadastro.");
          return;
        }
        navigate({ to: "/conta" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigate({ to: "/conta" });
      }
    } catch (err) {
      toast.error(
        err instanceof Error && err.message.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : "Não foi possível continuar. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="pb-10">
      <div className="flex flex-col items-center pt-4 text-center">
        <Logo className="w-40" />
        <h1 className="mt-6 text-3xl font-semibold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Acompanhe seus horários e sua assinatura.</p>
      </div>

      <form onSubmit={submit} className="panel mt-8 space-y-4 p-5">
        {mode === "signup" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="h-12" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel">WhatsApp</Label>
              <Input
                id="tel"
                inputMode="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="h-12"
                required
              />
            </div>
          </>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="h-12"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex h-14 w-full items-center justify-center rounded-full bg-primary text-sm font-bold tracking-widest text-primary-foreground disabled:opacity-60"
        >
          {loading ? "AGUARDE..." : mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-5 w-full text-center text-sm text-gold"
      >
        {mode === "login" ? "Ainda não tenho conta" : "Já tenho conta"}
      </button>
      <Link to="/" className="mt-4 block text-center text-sm text-muted-foreground">
        Voltar ao início
      </Link>
    </Screen>
  );
}
