import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateToISO, todayISO } from "@/lib/date";

const WD = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Calendário mensal da marca: data selecionada em dourado, passado desabilitado. */
export function MonthCalendar({
  value,
  onSelect,
  maxDaysAhead = 60,
}: {
  value: string;
  onSelect: (iso: string) => void;
  maxDaysAhead?: number;
}) {
  const today = todayISO();
  const [y0, m0] = value.split("-").map(Number);
  const [cursor, setCursor] = useState({ year: y0 ?? 2026, month: (m0 ?? 1) - 1 });

  const limit = (() => {
    const [ty, tm, td] = today.split("-").map(Number);
    return dateToISO(new Date(ty!, tm! - 1, td! + maxDaysAhead));
  })();

  const first = new Date(cursor.year, cursor.month, 1);
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const lead = first.getDay();

  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <div className="panel p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mês anterior"
          onClick={() => shift(-1)}
          className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-display text-xl">
          {MONTHS[cursor.month]} <span className="text-gold">{cursor.year}</span>
        </p>
        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => shift(1)}
          className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
        {WD.map((d, i) => (
          <span key={i} className="py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: lead }).map((_, i) => (
          <span key={`l${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const iso = dateToISO(new Date(cursor.year, cursor.month, i + 1));
          const isSunday = new Date(cursor.year, cursor.month, i + 1).getDay() === 0;
          const disabled = iso < today || iso > limit || isSunday;
          const selected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(iso)}
              className={cn(
                "focus-ring aspect-square rounded-md text-sm tabular-nums transition-colors",
                disabled
                  ? "cursor-not-allowed text-muted-foreground/30"
                  : selected
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "border border-border/60 text-foreground",
                !disabled && !selected && iso === today && "border-gold/60 text-gold",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
