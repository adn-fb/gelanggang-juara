import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { profileSchema } from "@/lib/auth";
import { profileQuery } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Profil Saya — Arena" },
      { name: "description", content: "Kelola nama, nomor WhatsApp, dan foto profil Anda." },
      { property: "og:title", content: "Profil Saya — Arena" },
      { property: "og:description", content: "Kelola nama, nomor WhatsApp, dan foto profil Anda." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery(context.user.id)),
  component: ProfilePage,
});

type FormValues = z.infer<typeof profileSchema>;
const MAX_AVATAR = 2 * 1024 * 1024;

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile } = useSuspenseQuery(profileQuery(user.id));
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: profile?.full_name ?? "", phone: profile?.phone ?? "" },
  });

  const save = useMutation({
    mutationFn: async (v: FormValues) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: v.fullName, phone: v.phone || null })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profile", user.id] });
      form.reset(form.getValues());
      toast.success("Profil berhasil disimpan.");
    },
    onError: () => toast.error("Gagal menyimpan profil. Coba lagi."),
  });

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Gunakan gambar JPG, PNG, atau WebP."); return; }
    if (file.size > MAX_AVATAR) { toast.error("Ukuran foto maksimal 2 MB."); return; }
    setUploading(true);
    try {
      const ext = file.type.split("/")[1];
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const old = profile?.avatar_path;
      const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
      if (error) throw error;
      if (old) await supabase.storage.from("avatars").remove([old]);
      await qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Foto profil diperbarui.");
    } catch {
      toast.error("Gagal mengunggah foto.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const initials = (profile?.full_name || user.email || "?").slice(0, 2).toUpperCase();
  const { errors, isDirty } = form.formState;

  return (
    <AppShell>
      <p className="text-sm font-medium text-brand">Akun</p>
      <h1 className="mt-1 text-3xl font-semibold">Profil saya</h1>

      <div className="mt-8 max-w-xl rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            {profile?.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="Foto profil" /> : null}
            <AvatarFallback className="bg-secondary font-semibold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="avatar" onChange={(e) => onAvatar(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}
              {uploading ? "Mengunggah..." : "Ganti foto"}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, atau WebP. Maks. 2 MB.</p>
          </div>
        </div>

        <form className="mt-6 space-y-4" noValidate onSubmit={form.handleSubmit((v) => save.mutate(v))}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nama lengkap</Label>
            <Input id="fullName" autoComplete="name" aria-invalid={!!errors.fullName} {...form.register("fullName")} />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Nomor WhatsApp</Label>
            <Input id="phone" type="tel" inputMode="tel" placeholder="0812 3456 7890" autoComplete="tel" aria-invalid={!!errors.phone} {...form.register("phone")} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
          <Button type="submit" disabled={save.isPending || !isDirty}>
            {save.isPending && <Loader2 className="animate-spin" aria-hidden />}
            {save.isPending ? "Menyimpan..." : "Simpan perubahan"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
