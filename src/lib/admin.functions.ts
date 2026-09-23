import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

async function adminClient(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .in("role", ["admin", "barber"])
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
  return supabaseAdmin;
}

export type AgendaItem = {
  id: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  tipo_atendimento: string;
  preco: string | number;
  servico: string;
  cliente: string;
  cliente_id: string;
};

export type AgendaDay = {
  date: string;
  items: AgendaItem[];
  blocks: { id: string; hora_inicio: string; motivo: string | null }[];
  stats: { total: number; confirmados: number; concluidos: number; proximo: AgendaItem | null };
};

function mapItem(a: any): AgendaItem {
  return {
    id: a.id,
    hora_inicio: a.hora_inicio,
    hora_fim: a.hora_fim,
    status: a.status,
    tipo_atendimento: a.tipo_atendimento,
    preco: a.preco,
    servico: a.services?.nome ?? "Serviço",
    cliente: a.profiles?.nome ?? "Cliente",
    cliente_id: a.cliente_id,
  };
}

export const getAgendaDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ date: dateSchema }).parse(data))
  .handler(async ({ data, context }): Promise<AgendaDay> => {
    const supabase = await adminClient(context.userId);
    const [{ data: appts }, { data: blocks }] = await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, cliente_id, hora_inicio, hora_fim, status, tipo_atendimento, preco, services(nome), profiles(nome)",
        )
        .eq("data", data.date)
        .order("hora_inicio"),
      supabase.from("blocked_slots").select("id, hora_inicio, motivo").eq("data", data.date).order("hora_inicio"),
    ]);

    const items = (appts ?? []).map(mapItem);
    const ativos = items.filter((i) => i.status === "agendado" || i.status === "confirmado");
    return {
      date: data.date,
      items,
      blocks: blocks ?? [],
      stats: {
        total: items.filter((i) => i.status !== "cancelado").length,
        confirmados: ativos.length,
        concluidos: items.filter((i) => i.status === "concluido").length,
        proximo: ativos[0] ?? null,
      },
    };
  });

export const completeAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = await adminClient(context.userId);
    const { data: result, error } = await supabase.rpc("complete_appointment", { p_id: data.id });
    if (error) return { ok: false as const };
    return result as { ok: boolean; code?: string };
  });

export const adminCancelAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = await adminClient(context.userId);
    const { data: result, error } = await supabase.rpc("cancel_appointment", { p_id: data.id });
    if (error) return { ok: false as const };
    return result as { ok: boolean; code?: string };
  });

export type ClientRow = {
  id: string;
  nome: string;
  telefone: string | null;
};

export const listClients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ search: z.string().max(80).optional() }).parse(data ?? {}))
  .handler(async ({ data, context }): Promise<ClientRow[]> => {
    const supabase = await adminClient(context.userId);
    let query = supabase
      .from("profiles")
      .select("id, nome, telefone")
      .order("nome")
      .limit(200);
    if (data.search) query = query.ilike("nome", `%${data.search}%`);
    const { data: rows } = await query;
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      nome: r.nome,
      telefone: r.telefone,
    }));
  });

export const getClientDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = await adminClient(context.userId);
    const [{ data: profile }, { data: appts }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("appointments")
        .select("id, data, hora_inicio, hora_fim, status, tipo_atendimento, preco, services(nome)")
        .eq("cliente_id", data.id)
        .order("data", { ascending: false })
        .limit(80),
    ]);

    return {
      profile,
      historico: (appts ?? []).map((a: any) => ({
        id: a.id,
        data: a.data,
        hora_inicio: a.hora_inicio,
        hora_fim: a.hora_fim,
        status: a.status,
        tipo_atendimento: a.tipo_atendimento,
        preco: a.preco,
        servico: a.services?.nome ?? "Serviço",
      })),
    };
  });

export const createClientProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        nome: z.string().trim().min(3, "Nome muito curto").max(100),
        telefone: z.string().trim().min(10, "WhatsApp inválido").max(20),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = await adminClient(context.userId);
    const { data: created, error } = await supabase
      .from("profiles")
      .insert({ nome: data.nome, telefone: data.telefone.replace(/\D/g, "") })
      .select("id")
      .single();
    if (error || !created) return { ok: false as const };
    return { ok: true as const, id: created.id };
  });

export const adminCreateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        clienteId: z.string().uuid(),
        serviceId: z.string().uuid(),
        date: dateSchema,
        time: timeSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = await adminClient(context.userId);
    const { data: result, error } = await supabase.rpc("book_appointment", {
      p_cliente_id: data.clienteId,
      p_servico_id: data.serviceId,
      p_data: data.date,
      p_hora: data.time,
      p_usar_assinatura: false,
    });
    if (error) return { ok: false as const };
    return result as { ok: boolean; code?: string; id?: string };
  });

export const blockSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ date: dateSchema, time: timeSchema, motivo: z.string().trim().max(120).optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = await adminClient(context.userId);
    const { error } = await supabase.from("blocked_slots").insert({
      data: data.date,
      hora_inicio: data.time,
      hora_fim: `${String(Math.floor((Number(data.time.slice(0, 2)) * 60 + Number(data.time.slice(3)) + 30) / 60)).padStart(2, "0")}:${String((Number(data.time.slice(3)) + 30) % 60).padStart(2, "0")}`,
      motivo: data.motivo || null,
    });
    if (error) return { ok: false as const, code: "bloqueado" };
    return { ok: true as const };
  });

export const unblockSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = await adminClient(context.userId);
    await supabase.from("blocked_slots").delete().eq("id", data.id);
    return { ok: true as const };
  });
