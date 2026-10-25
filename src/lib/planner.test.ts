import { it, expect } from "vitest";
import { plannerSchema } from "./planner";
it("requires sport format requirements and organization", () => {
  const valid = {
    organizationId: "00000000-0000-4000-8000-000000000001",
    sport: "Futsal",
    format: "Grup lalu gugur",
    requirements: "16 tim, dua lapangan, dua hari.",
  };
  expect(plannerSchema.safeParse(valid).success).toBe(true);
  for (const field of ["sport", "format", "requirements", "organizationId"])
    expect(plannerSchema.safeParse({ ...valid, [field]: "" }).success).toBe(false);
});
