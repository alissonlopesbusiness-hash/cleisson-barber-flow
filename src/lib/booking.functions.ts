import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido");

export type Slot = { time: string; available: boolean };
export type Availability = { closed: boolean; slots: Slot[] };

const availabilityInput = z.object({ date: dateSchema });

/** Horários do dia com disponibilidade real (público). */
export const getAvailability = createServerFn({ method: "POST" })
  .inputValidator((data: { date: string }) => availabilityInput.parse(data))
  .handler(async ({ data }): Promise<Availability> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [y, m, d] = data.date.split("-").map(Number);
    const dow = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();

    const { data: hours } = await supabaseAdmin
      .from("business_hours")
      .select("hora_abertura, hora_fechamento, ativo")
      .eq("dia_semana", dow)
      .maybeSingle();

    if (!hours || !hours.ativo) return { closed: true, slots: [] };

    const [{ data: appts }, { data: blocks }] = await Promise.all([
      supabaseAdmin
        .from("appointments")
        .select("hora_inicio")
        .eq("data", data.date)
        .in("status", ["agendado", "confirmado"]),
      supabaseAdmin.from("blocked_slots").select("hora_inicio").eq("data", data.date),
    ]);

    const taken = new Set<string>([
      ...(appts ?? []).map((a) => a.hora_inicio.slice(0, 5)),
      ...(blocks ?? []).map((b) => b.hora_inicio.slice(0, 5)),
    ]);

    const toMin = (t: string) => {
      const [hh, mm] = t.split(":").map(Number);
      return hh! * 60 + mm!;
    };
    const open = toMin(hours.hora_abertura);
    const close = toMin(hours.hora_fechamento);

    const nowSP = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const part = (t: string) => nowSP.find((p) => p.type === t)?.value ?? "00";
    const todayISO = `${part("year")}-${part("month")}-${part("day")}`;
    const nowMin = Number(part("hour")) * 60 + Number(part("minute"));

    const slots: Slot[] = [];
    for (let t = open; t + 30 <= close; t += 30) {
      const label = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
      const past = data.date < todayISO || (data.date === todayISO && t <= nowMin);
      slots.push({ time: label, available: !taken.has(label) && !past });
    }
    return { closed: false, slots };
  });

const guestInput = z.object({
  serviceId: z.string().uuid(),
  date: dateSchema,
  time: timeSchema,
  nome: z.string().trim().min(3, "Informe seu nome completo").max(100),
  telefone: z
    .string()
    .trim()
    .min(10, "Informe um WhatsApp válido")
    .max(20)
    .regex(/^[\d\s()+-]+$/, "WhatsApp inválido"),
});

export type BookingResult = { ok: boolean; code?: string; id?: string };

/** Agendamento de visitante (sem login). Nunca usa assinatura. */
export const createGuestBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => guestInput.parse(data))
  .handler(async ({ data }): Promise<BookingResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const telefone = data.telefone.replace(/\D/g, "");

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("telefone", telefone)
      .limit(1)
      .maybeSingle();

    let clienteId = existing?.id;
    if (!clienteId) {
      const { data: created, error } = await supabaseAdmin
        .from("profiles")
        .insert({ nome: data.nome, telefone })
        .select("id")
        .single();
      if (error || !created) return { ok: false };
      clienteId = created.id;
    }

    const { data: result, error } = await supabaseAdmin.rpc("book_appointment", {
      p_cliente_id: clienteId,
      p_servico_id: data.serviceId,
      p_data: data.date,
      p_hora: data.time,
      p_usar_assinatura: false,
    });
    if (error) return { ok: false };
    return result as BookingResult;
  });
