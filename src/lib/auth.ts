import { z } from "zod";

/** Only allow same-origin relative paths as post-login destinations. */
export function safeRedirect(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

export const emailSchema = z.string().trim().email("Format email tidak valid").max(255);
export const passwordSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter")
  .max(72, "Kata sandi maksimal 72 karakter");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Nama minimal 2 karakter").max(120),
  email: emailSchema,
  password: passwordSchema,
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Nama minimal 2 karakter").max(120, "Nama terlalu panjang"),
  phone: z
    .string()
    .trim()
    .max(20, "Nomor terlalu panjang")
    .regex(/^(\+?62|0)?[0-9\s-]*$/, "Gunakan format nomor Indonesia, mis. 0812xxxx")
    .optional()
    .or(z.literal("")),
});

export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email atau kata sandi salah.";
  if (m.includes("email not confirmed")) return "Email belum dikonfirmasi. Cek kotak masuk Anda.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Email ini sudah terdaftar. Silakan masuk.";
  if (m.includes("rate limit") || m.includes("too many")) return "Terlalu banyak percobaan. Coba lagi beberapa saat.";
  if (m.includes("pwned") || m.includes("weak")) return "Kata sandi terlalu lemah atau pernah bocor. Gunakan kata sandi lain.";
  return "Terjadi kesalahan. Silakan coba lagi.";
}
