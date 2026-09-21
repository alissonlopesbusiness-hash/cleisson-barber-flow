import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return <img src="/logo-cleisson.png" alt="Cleisson Barber Club" className={cn("select-none object-contain", className)} />;
}

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn("mx-auto min-h-dvh w-full max-w-md overflow-x-hidden px-5 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))]", className)}>{children}</main>
  );
}

export function PageTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <header className="mb-7">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="mt-2 text-[2.35rem] leading-[0.98] text-foreground">{title}</h1>
    </header>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("panel p-4", className)}>{children}</div>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="panel px-6 py-12 text-center">
      <div className="mx-auto mb-5 h-px w-10 bg-gold/60" />
      <p className="font-display text-2xl text-foreground">{title}</p>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function Loading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-[var(--radius)] bg-secondary/70" />
      ))}
    </div>
  );
}

export type NavItem = { to: string; label: string; icon: ReactNode };

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-4 px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex min-w-0 flex-col items-center gap-1.5 py-3 text-[0.62rem] font-medium transition-colors",
                active ? "text-gold" : "text-muted-foreground",
              )}
            >
              {active ? <span className="absolute inset-x-4 top-0 h-px bg-gold" /> : null}
              {item.icon}
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const STATUS: Record<string, { label: string; className: string }> = {
  agendado: { label: "AGENDADO", className: "border-gold/40 text-gold" },
  confirmado: { label: "CONFIRMADO", className: "border-gold/40 text-gold" },
  concluido: { label: "CONCLUÍDO", className: "border-success/40 text-success" },
  cancelado: { label: "CANCELADO", className: "border-destructive/40 text-destructive" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status.toUpperCase(), className: "border-border text-muted-foreground" };
  return (
    <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[0.58rem] font-semibold tracking-[0.12em]", s.className)}>
      {s.label}
    </span>
  );
}

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center", compact ? "gap-3" : "flex-col text-center")}>
      <Logo className={compact ? "h-12 w-16" : "h-28 w-44"} />
      {compact ? (
        <div className="min-w-0">
          <p className="truncate font-display text-xl leading-none">Cleisson Barber Club</p>
          <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-gold">Barbearia & clube</p>
        </div>
      ) : null}
    </div>
  );
}

export function StepHeader({ step, total, onBack }: { step: number; total: number; onBack: () => void }) {
  return (
    <header className="mb-8">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Voltar" className="focus-ring grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="h-px overflow-hidden bg-border"><div className="h-full bg-gold transition-all" style={{ width: `${(step / total) * 100}%` }} /></div>
        <span className="text-xs tabular-nums text-muted-foreground">{String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
      </div>
    </header>
  );
}

export function SectionHeading({ label }: { label: string }) {
  return (
    <div className="mb-4 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
      <p className="eyebrow whitespace-nowrap">{label}</p>
      <div className="h-px bg-gold/20" />
    </div>
  );
}
