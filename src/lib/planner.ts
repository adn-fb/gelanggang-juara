import { z } from "zod";
export const plannerSchema = z.object({
  organizationId: z.string().uuid(),
  sport: z.string().trim().min(2, "Olahraga wajib diisi.").max(100),
  format: z.string().trim().min(2, "Format wajib diisi.").max(200),
  requirements: z.string().trim().min(10, "Jelaskan kebutuhan minimal 10 karakter.").max(4000),
});
