import { describe, expect, it } from "vitest";
import { safeRedirect, signUpSchema } from "./auth";

describe("safeRedirect", () => {
  it("keeps same-origin paths", () => expect(safeRedirect("/profil")).toBe("/profil"));
  it("rejects external URLs", () => expect(safeRedirect("https://evil.com")).toBe("/dashboard"));
  it("rejects protocol-relative URLs", () => expect(safeRedirect("//evil.com")).toBe("/dashboard"));
});

describe("signUpSchema", () => {
  it("requires passwords of at least 8 characters", () => {
    expect(signUpSchema.safeParse({ fullName: "Budi", email: "b@x.id", password: "1234567" }).success).toBe(false);
    expect(signUpSchema.safeParse({ fullName: "Budi", email: "b@x.id", password: "12345678" }).success).toBe(true);
  });
});
