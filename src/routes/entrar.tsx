import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo, Screen } from "@/components/app/shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — Cleisson Barber Club" },
      { name: "description", content: "Acesse sua conta para ver agendamentos." },
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
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        msg.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : msg.includes("already registered") || msg.includes("already been registered")
            ? "Este e-mail já tem conta. Faça login."
            : msg.toLowerCase().includes("weak") || msg.includes("pwned")
              ? "Escolha uma senha mais forte."
              : "Não foi possível continuar. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen className="pb-14">
      <div className="flex flex-col items-center text-center">
        <Logo className="h-24 w-24" />
        <h1 className="mt-5 text-[2.2rem] leading-none">
          {mode === "login" ? "Bem-vindo" : "Criar conta"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Acompanhe seus horários.</p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-1 rounded-full border border-border p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "focus-ring h-10 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-colors",
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {m === "login" ? "Entrar" : "Cadastrar"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="panel mt-5 space-y-4 p-5">
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
        <button type="submit" disabled={loading} className="action-primary focus-ring w-full">
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <Link to="/" className="focus-ring mt-6 block text-center text-sm text-muted-foreground">
        Voltar ao início
      </Link>
    </Screen>
  );
}
