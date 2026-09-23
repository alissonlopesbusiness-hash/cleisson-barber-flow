import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type MyAppointment = {
  id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  tipo_atendimento: string;
  preco: string | number;
  servico: string;
};

export type MyAccount = {
  profileId: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  isStaff: boolean;
  isAdmin: boolean;
  staffExists: boolean;
  appointments: MyAppointment[];
};

async function loadProfile(supabase: any, userId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  return data;
}

export const getMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyAccount> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    let profile = await loadProfile(supabaseAdmin, userId);
    if (!profile) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .insert({ user_id: userId, nome: context.claims?.email?.split("@")[0] ?? "Cliente", email: context.claims?.email ?? null })
        .select("*")
        .single();
      profile = data;
    }

    const [{ data: roles }, { count: adminCount }, { data: appts }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
      supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).in("role", ["admin", "barber"]),
      supabaseAdmin
        .from("appointments")
        .select("id, data, hora_inicio, hora_fim, status, tipo_atendimento, preco, services(nome)")
        .eq("cliente_id", profile.id)
        .order("data", { ascending: false })
        .order("hora_inicio", { ascending: false })
        .limit(60),
    ]);

    return {
      profileId: profile.id,
      nome: profile.nome,
      email: profile.email,
      telefone: profile.telefone,
      isStaff: (roles ?? []).some((r: any) => r.role === "admin" || r.role === "barber"),
      isAdmin: (roles ?? []).some((r: any) => r.role === "admin"),
      staffExists: (staffCount ?? 0) > 0,
      appointments: (appts ?? []).map((a: any) => ({
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

const bookingInput = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  nome: z.string().trim().min(3).max(100).optional(),
  telefone: z.string().trim().min(10).max(20).optional(),
});

export const createMyBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bookingInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const profile = await loadProfile(supabaseAdmin, context.userId);
    if (!profile) return { ok: false as const, code: "nao_encontrado" };

    if (data.nome || data.telefone) {
      await supabaseAdmin
        .from("profiles")
        .update({
          ...(data.nome ? { nome: data.nome } : {}),
          ...(data.telefone ? { telefone: data.telefone.replace(/\D/g, "") } : {}),
        })
        .eq("id", profile.id);
    }

    const { data: result, error } = await supabaseAdmin.rpc("book_appointment", {
      p_cliente_id: profile.id,
      p_servico_id: data.serviceId,
      p_data: data.date,
      p_hora: data.time,
      p_usar_assinatura: false,
    });
    if (error) return { ok: false as const };
    return result as { ok: boolean; code?: string; id?: string };
  });

export const cancelMyAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const profile = await loadProfile(supabaseAdmin, context.userId);
    if (!profile) return { ok: false as const, code: "nao_encontrado" };
    const { data: appt } = await supabaseAdmin
      .from("appointments")
      .select("id, cliente_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!appt || appt.cliente_id !== profile.id) return { ok: false as const, code: "nao_encontrado" };
    const { data: result, error } = await supabaseAdmin.rpc("cancel_appointment", { p_id: data.id });
    if (error) return { ok: false as const };
    return result as { ok: boolean; code?: string };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        nome: z.string().trim().min(3, "Informe seu nome completo").max(100),
        telefone: z.string().trim().min(10, "WhatsApp inválido").max(20),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("profiles")
      .update({ nome: data.nome, telefone: data.telefone.replace(/\D/g, "") })
      .eq("user_id", context.userId);
    return { ok: true as const };
  });

/** Primeiro acesso: se ainda não existe barbeiro, o usuário atual assume o painel. */
export const claimBarberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .in("role", ["admin", "barber"]);
    if ((count ?? 0) > 0) return { ok: false as const, code: "ja_existe" };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "barber" });
    if (error) return { ok: false as const };
    return { ok: true as const };
  });
