import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { orgActionSchema } from "./organizations";
export const organizationAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(orgActionSchema)
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc("organization_action", {
      _action: data.action,
      ...(data.organizationId ? { _org: data.organizationId } : {}),
      _payload: data.payload,
    });
    if (result.error) {
      const message =
        result.error.code === "23505"
          ? "Undangan aktif untuk email ini sudah ada."
          : result.error.code === "P0001"
            ? result.error.message
            : "Tindakan tidak dapat disimpan. Silakan coba lagi.";
      throw new Error(message);
    }
    return { id: result.data };
  });
