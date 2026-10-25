import { z } from "zod";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { OrgRole } from "./organizations";

const name = z.string().trim().min(2, "Nama minimal 2 karakter").max(120);
export const canCreateTournament = (role?: OrgRole) =>
  role === "owner" || role === "org_admin" || role === "event_manager";
export const eventSchema = z.object({
  organizationId: z.string().uuid(), name, sport: z.string().trim().min(2).max(100),
  fee: z.number().int().min(0).max(100000000),
});
export const registrationSchema = z.object({
  eventId: z.string().uuid(), teamName: name, contactName: name,
  contactEmail: z.string().trim().email("Email tidak valid").max(255),
  contactPhone: z.string().regex(/^(\+62|62|0)[0-9]{7,17}$/, "Gunakan nomor Indonesia tanpa spasi").min(8).max(20),
  payerName: name,
  players: z.array(z.object({ fullName: name, jerseyNumber: z.number().int().min(0).max(999) })).min(1).max(100),
}).superRefine((data, ctx) => {
  if (new Set(data.players.map(p => p.jerseyNumber)).size !== data.players.length)
    ctx.addIssue({ code: "custom", path: ["players"], message: "Nomor punggung tidak boleh sama" });
});
export const registrationStatusLabels: Record<string, string> = {
  submitted: "Menunggu tinjauan", accepted: "Diterima", rejected: "Ditolak", cancelled: "Dibatalkan",
};
export const paymentStatusLabels: Record<string, string> = {
  unpaid: "Belum dibayar", paid: "Lunas", failed: "Gagal", refunded: "Dikembalikan",
};
export const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
export const registrationsQuery = (userId: string) => queryOptions({
  queryKey: ["registrations", userId],
  queryFn: async () => {
    const [events, registrations, players, payments] = await Promise.all([
      supabase.from("tournament_events").select("*").order("created_at", { ascending: false }),
      supabase.from("tournament_registrations").select("*").order("created_at", { ascending: false }),
      supabase.from("tournament_players").select("*"),
      supabase.from("tournament_registration_payments").select("*"),
    ]);
    for (const response of [events, registrations, players, payments]) if (response.error) throw response.error;
    return { events: events.data ?? [], registrations: registrations.data ?? [], players: players.data ?? [], payments: payments.data ?? [] };
  },
});