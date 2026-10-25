import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Logo } from "@/components/app/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { emailSchema, safeRedirect, signInSchema, signUpSchema, translateAuthError } from "@/lib/auth";

type Mode = "masuk" | "daftar" | "lupa";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: safeRedirect(search.redirect) });
  },
  head: () => ({
    meta: [
      { title: "Masuk atau Daftar — Arena" },
      { name: "description", content: "Masuk ke Arena untuk mengelola turnamen dan pendaftaran Anda." },
      { property: "og:title", content: "Masuk atau Daftar — Arena" },
      { property: "og:description", content: "Masuk ke Arena untuk mengelola turnamen dan pendaftaran Anda." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const dest = safeRedirect(search.redirect);
  const [mode, setMode] = useState<Mode>("masuk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "masuk") {
        const p = signInSchema.safeParse(form);
        if (!p.success) { setError(p.error.issues[0]?.message ?? "Data tidak valid"); return; }
        const { error: err } = await supabase.auth.signInWithPassword(p.data);
        if (err) { setError(translateAuthError(err.message)); return; }
        navigate({ to: dest, replace: true });
      } else if (mode === "daftar") {
        const p = signUpSchema.safeParse(form);
        if (!p.success) { setError(p.error.issues[0]?.message ?? "Data tidak valid"); return; }
        const { data, error: err } = await supabase.auth.signUp({
          email: p.data.email,
          password: p.data.password,
          options: { emailRedirectTo: window.location.origin + dest, data: { full_name: p.data.fullName } },
        });
        if (err) { setError(translateAuthError(err.message)); return; }
        if (data.session) navigate({ to: dest, replace: true });
        else setSent("confirm");
      } else {
        const p = emailSchema.safeParse(form.email);
        if (!p.success) { setError(p.error.issues[0]?.message ?? "Data tidak valid"); return; }
        const { error: err } = await supabase.auth.resetPasswordForEmail(p.data, { redirectTo: `${window.location.origin}/reset-password` });
        if (err) { setError(translateAuthError(err.message)); return; }
        setSent("reset");
      }
    } finally {
      setLoading(false);
    }
  }

  async function oauth(provider: "google" | "lovable") {
    setError(null);
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth?redirect=" + encodeURIComponent(dest) });
    if (r.error) { toast.error("Gagal masuk. Coba lagi."); return; }
    if (r.redirected) return;
    navigate({ to: dest, replace: true });
  }

  const title = { masuk: "Masuk ke akun Anda", daftar: "Buat akun baru", lupa: "Lupa kata sandi" }[mode];

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo />
        {sent ? (
          <div className="mt-8 rounded-xl border bg-card p-6 shadow-card" role="status">
            <MailCheck className="size-8 text-brand" aria-hidden />
            <h1 className="mt-3 text-xl font-semibold">Cek email Anda</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {sent === "confirm"
                ? `Kami mengirim tautan konfirmasi ke ${form.email}. Klik tautan itu untuk mengaktifkan akun.`
                : `Jika ${form.email} terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim.`}
            </p>
            <Button variant="outline" className="mt-5 w-full" onClick={() => { setSent(null); setMode("masuk"); }}>Kembali ke halaman masuk</Button>
          </div>
        ) : (
          <>
            <h1 className="mt-8 text-2xl font-semibold">{title}</h1>
            {mode !== "lupa" && (
              <>
                <div className="mt-6 grid gap-2">
                  <Button type="button" variant="outline" onClick={() => oauth("google")}>Lanjutkan dengan Google</Button>
                  <button type="button" className="lovable-auth-button" onClick={() => oauth("lovable")}>Continue with Lovable</button>
                </div>
                <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><Separator className="flex-1" />atau dengan email<Separator className="flex-1" /></div>
              </>
            )}
            <form onSubmit={submit} noValidate className={mode === "lupa" ? "mt-6 space-y-4" : "space-y-4"}>
              {mode === "daftar" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Nama lengkap</Label>
                  <Input id="fullName" autoComplete="name" value={form.fullName} onChange={set("fullName")} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
              </div>
              {mode !== "lupa" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Kata sandi</Label>
                    {mode === "masuk" && (
                      <button type="button" className="rounded text-xs font-medium text-primary underline-offset-4 hover:underline" onClick={() => { setMode("lupa"); setError(null); }}>Lupa kata sandi?</button>
                    )}
                  </div>
                  <Input id="password" type="password" autoComplete={mode === "daftar" ? "new-password" : "current-password"} value={form.password} onChange={set("password")} />
                  {mode === "daftar" && <p className="text-xs text-muted-foreground">Minimal 8 karakter.</p>}
                </div>
              )}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="animate-spin" aria-hidden />}
                {mode === "masuk" ? "Masuk" : mode === "daftar" ? "Daftar" : "Kirim tautan pemulihan"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "masuk" ? "Belum punya akun? " : "Sudah punya akun? "}
              <button type="button" className="rounded font-medium text-primary underline-offset-4 hover:underline" onClick={() => { setMode(mode === "masuk" ? "daftar" : "masuk"); setError(null); }}>
                {mode === "masuk" ? "Daftar gratis" : "Masuk"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
