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
    .eq("role", "admin")
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
  plano: string | null;
};

export type AgendaDay = {
  date: string;
  items: AgendaItem[];
  blocks: { id: string; hora_inicio: string; motivo: string | null }[];
  stats: { total: number; assinantes: number; concluidos: number; proximo: AgendaItem | null };
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
    plano: a.subscriptions?.subscription_plans?.nome ?? null,
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
          "id, cliente_id, hora_inicio, hora_fim, status, tipo_atendimento, preco, services(nome), profiles(nome), subscriptions(subscription_plans(nome))",
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
        assinantes: items.filter((i) => i.tipo_atendimento === "assinatura" && i.status !== "cancelado").length,
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
  plano: string | null;
  assinaturaAtiva: boolean;
};

export const listClients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ search: z.string().max(80).optional() }).parse(data ?? {}))
  .handler(async ({ data, context }): Promise<ClientRow[]> => {
    const supabase = await adminClient(context.userId);
    let query = supabase
      .from("profiles")
      .select("id, nome, telefone, subscriptions(status, data_fim, subscription_plans(nome))")
      .order("nome")
      .limit(200);
    if (data.search) query = query.ilike("nome", `%${data.search}%`);
    const { data: rows } = await query;
    const today = new Date().toISOString().slice(0, 10);
    return (rows ?? []).map((r: any) => {
      const sub = (r.subscriptions ?? []).find((s: any) => s.status === "ativa" && s.data_fim >= today);
      return {
        id: r.id,
        nome: r.nome,
        telefone: r.telefone,
        plano: sub?.subscription_plans?.nome ?? null,
        assinaturaAtiva: Boolean(sub),
      };
    });
  });

export const getClientDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = await adminClient(context.userId);
    const [{ data: profile }, { data: appts }, { data: subs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("appointments")
        .select("id, data, hora_inicio, hora_fim, status, tipo_atendimento, preco, services(nome)")
        .eq("cliente_id", data.id)
        .order("data", { ascending: false })
        .limit(80),
      supabase
        .from("subscriptions")
        .select("*, subscription_plans(*)")
        .eq("cliente_id", data.id)
        .order("data_fim", { ascending: false }),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const active = (subs ?? []).find((s: any) => s.status === "ativa" && s.data_fim >= today);
    let beneficios: { tipo: string; usados: number; limite: number | null }[] = [];
    if (active) {
      const { data: usage } = await supabase
        .from("subscription_usage")
        .select("tipo_beneficio, quantidade")
        .eq("subscription_id", active.id);
      const count = (t: string) =>
        (usage ?? []).filter((u: any) => u.tipo_beneficio === t).reduce((a: number, u: any) => a + u.quantidade, 0);
      const plan: any = active.subscription_plans;
      if (plan.permite_corte) beneficios.push({ tipo: "corte", usados: count("corte"), limite: plan.cortes_limite });
      if (plan.permite_barba) beneficios.push({ tipo: "barba", usados: count("barba"), limite: plan.barbas_limite });
    }

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
      assinatura: active
        ? {
            id: active.id,
            plano: (active.subscription_plans as any).nome,
            ilimitado: (active.subscription_plans as any).ilimitado,
            data_inicio: active.data_inicio,
            data_fim: active.data_fim,
            beneficios,
          }
        : null,
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
        usarAssinatura: z.boolean(),
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
      p_usar_assinatura: data.usarAssinatura,
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

export const listSubscriptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = await adminClient(context.userId);
    const { data: rows } = await supabase
      .from("subscriptions")
      .select("id, data_inicio, data_fim, status, profiles(id, nome), subscription_plans(nome, ilimitado)")
      .order("data_fim", { ascending: false })
      .limit(200);
    const today = new Date().toISOString().slice(0, 10);
    return (rows ?? []).map((s: any) => ({
      id: s.id,
      cliente: s.profiles?.nome ?? "Cliente",
      clienteId: s.profiles?.id as string,
      plano: s.subscription_plans?.nome ?? "",
      ilimitado: s.subscription_plans?.ilimitado as boolean,
      data_inicio: s.data_inicio,
      data_fim: s.data_fim,
      ativa: s.status === "ativa" && s.data_fim >= today,
    }));
  });

export const assignSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ clienteId: z.string().uuid(), planoId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const supabase = await adminClient(context.userId);
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("duracao_dias")
      .eq("id", data.planoId)
      .maybeSingle();
    if (!plan) return { ok: false as const };
    const inicio = new Date();
    const fim = new Date(inicio.getTime() + plan.duracao_dias * 86400000);
    const { error } = await supabase.from("subscriptions").insert({
      cliente_id: data.clienteId,
      plano_id: data.planoId,
      data_inicio: inicio.toISOString().slice(0, 10),
      data_fim: fim.toISOString().slice(0, 10),
      status: "ativa",
    });
    if (error) return { ok: false as const };
    return { ok: true as const };
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = await adminClient(context.userId);
    await supabase.from("subscriptions").update({ status: "cancelada" }).eq("id", data.id);
    return { ok: true as const };
  });
