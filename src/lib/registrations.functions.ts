import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { eventSchema, registrationSchema } from "./registrations";
export const createTournament = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator(eventSchema)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("create_tournament_event", { _org: data.organizationId, _name: data.name, _sport: data.sport, _fee: data.fee });
    if (result.error) throw new Error(result.error.code === "P0001" ? result.error.message : "Turnamen tidak dapat disimpan.");
    return { id: result.data };
  });
export const submitRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth]).inputValidator(registrationSchema)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("submit_tournament_registration", { _payload: data });
    if (result.error) throw new Error(result.error.code === "23505" ? "Nama tim atau nomor punggung sudah digunakan." : result.error.code === "P0001" ? result.error.message : "Pendaftaran tidak dapat disimpan.");
    return { id: result.data };
  });