import { describe, it, expect } from "vitest";
import { canCreateTournament, registrationSchema } from "./registrations";
const entry = { eventId: "11111111-1111-4111-8111-111111111111", teamName: "Tim Adinda", contactName: "Adinda", contactEmail: "adinda@example.com", contactPhone: "081234567890", payerName: "Adinda", players: [{ fullName: "Pemain Satu", jerseyNumber: 7 }] };
describe("Registration rules", () => {
  it("accepts valid team and player data", () => expect(registrationSchema.safeParse(entry).success).toBe(true));
  it("rejects no players", () => expect(registrationSchema.safeParse({ ...entry, players: [] }).success).toBe(false));
  it("rejects duplicate jersey numbers", () => expect(registrationSchema.safeParse({ ...entry, players: [...entry.players, { fullName: "Pemain Dua", jerseyNumber: 7 }] }).success).toBe(false));
  it("does not accept client supplied payment or registration status", () => {
    const result = registrationSchema.parse({ ...entry, paymentStatus: "paid", status: "accepted", userId: "other" });
    expect(result).not.toHaveProperty("paymentStatus");
    expect(result).not.toHaveProperty("status");
    expect(result).not.toHaveProperty("userId");
  });
  it("limits event creation to organizer roles", () => {
    expect(canCreateTournament("owner")).toBe(true);
    expect(canCreateTournament("org_admin")).toBe(true);
    expect(canCreateTournament("event_manager")).toBe(true);
    expect(canCreateTournament("finance")).toBe(false);
    expect(canCreateTournament("match_operator")).toBe(false);
    expect(canCreateTournament("viewer")).toBe(false);
  });
});