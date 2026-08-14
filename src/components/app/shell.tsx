import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return <img src="/logo-cleisson.png" alt="Cleisson Barber Club" className={cn("select-none", className)} />;
}

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn("mx-auto min-h-screen w-full max-w-md px-5 pb-28 pt-6", className)}>{children}</main>
  );
}

export function PageTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <header className="mb-5">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="mt-1 text-3xl font-semibold text-foreground">{title}</h1>
    </header>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("panel p-4", className)}>{children}</div>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="panel px-5 py-10 text-center">
      <p className="font-display text-xl text-gold">{title}</p>
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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-[0.68rem] font-medium transition-colors",
                active ? "text-gold" : "text-muted-foreground",
              )}
            >
              {item.icon}
              <span>{item.label}</span>
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
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-widest", s.className)}>
      {s.label}
    </span>
  );
}
