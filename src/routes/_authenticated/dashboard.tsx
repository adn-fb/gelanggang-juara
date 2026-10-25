import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, ClipboardList, Trophy } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { profileQuery } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dasbor — Arena" },
      { name: "description", content: "Ringkasan turnamen dan organisasi Anda di Arena." },
      { property: "og:title", content: "Dasbor — Arena" },
      { property: "og:description", content: "Ringkasan turnamen dan organisasi Anda di Arena." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery(context.user.id)),
  component: Dashboard,
});

const upcoming = [
  { icon: Trophy, title: "Turnamen", text: "Atur event, kategori, dan kuota peserta." },
  { icon: ClipboardList, title: "Pendaftaran", text: "Formulir dan verifikasi peserta." },
  { icon: CalendarDays, title: "Jadwal & hasil", text: "Bagan, jadwal, dan klasemen otomatis." },
];

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useSuspenseQuery(profileQuery(user.id));
  const name = profile?.full_name || user.email;

  return (
    <AppShell>
      <p className="text-sm font-medium text-brand">Dasbor</p>
      <h1 className="mt-1 text-3xl font-semibold">Halo, {name}</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Akun Anda sudah siap. Modul penyelenggaraan turnamen akan tersedia bertahap di sini.
      </p>

      {!profile?.full_name || !profile?.phone ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-accent p-4 text-accent-foreground">
          <p className="text-sm">Lengkapi nama dan nomor WhatsApp agar panitia mudah menghubungi Anda.</p>
          <Button asChild size="sm" variant="brand"><Link to="/profil">Lengkapi profil</Link></Button>
        </div>
      ) : null}

      <h2 className="mt-10 text-lg font-semibold">Segera hadir</h2>
      <div className="mt-4 flex flex-wrap gap-3"><Button asChild variant="brand"><Link to="/organisasi"><Building2/>Organisasi saya</Link></Button><Button asChild variant="outline"><Link to="/perencana">Perencana turnamen AI</Link></Button></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {upcoming.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3 rounded-xl border bg-card p-4 shadow-card">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><Icon className="size-4" aria-hidden /></span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
