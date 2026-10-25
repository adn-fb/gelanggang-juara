import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck2, ClipboardCheck, QrCode, Trophy, Wallet } from "lucide-react";
import heroImg from "@/assets/hero-futsal.jpg";
import { Logo } from "@/components/app/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arena — Kelola Turnamen Olahraga dalam Satu Platform" },
      { name: "description", content: "Pendaftaran, jadwal otomatis, hasil pertandingan, klasemen, tiket, dan sertifikat untuk penyelenggara turnamen di Indonesia." },
      { property: "og:title", content: "Arena — Kelola Turnamen Olahraga dalam Satu Platform" },
      { property: "og:description", content: "Pendaftaran, jadwal otomatis, hasil pertandingan, klasemen, tiket, dan sertifikat untuk penyelenggara turnamen di Indonesia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: ClipboardCheck, title: "Pendaftaran rapi", text: "Formulir khusus per kategori, unggah dokumen, dan verifikasi peserta." },
  { icon: CalendarCheck2, title: "Jadwal otomatis", text: "Fase grup dan sistem gugur disusun dalam hitungan detik." },
  { icon: Trophy, title: "Hasil terverifikasi", text: "Skor dikonfirmasi panitia sebelum masuk klasemen resmi." },
  { icon: Wallet, title: "Pembayaran", text: "Biaya pendaftaran dalam Rupiah dengan konfirmasi otomatis." },
  { icon: QrCode, title: "Tiket & check-in", text: "Tiket QR sekali pakai, dipindai langsung dari ponsel." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/auth">Masuk</Link></Button>
          <Button asChild size="sm"><Link to="/auth">Mulai gratis</Link></Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 md:grid-cols-[1.1fr_1fr] md:px-8 md:pt-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            Untuk EO, sekolah, kampus, dan klub
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] md:text-6xl">
            Turnamen berjalan tertib, dari pendaftaran sampai podium.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Arena menyatukan pendaftaran, jadwal, hasil pertandingan, dan klasemen dalam satu tempat — tanpa spreadsheet berserakan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="brand"><Link to="/auth">Buat akun penyelenggara <ArrowRight aria-hidden /></Link></Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border shadow-card">
          <img src={heroImg} alt="Pertandingan futsal antar tim pelajar di gedung olahraga" width={1280} height={960} className="aspect-[4/3] w-full object-cover" />
        </div>
      </section>

      <section className="border-t bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <h2 className="max-w-md text-2xl font-semibold md:text-3xl">Semua yang dibutuhkan panitia, dalam satu alur kerja.</h2>
          <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon className="size-5 text-brand" aria-hidden />
                <p className="mt-3 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground md:px-8">
        © {new Date().getFullYear()} Arena. Dibuat untuk olahraga Indonesia.
      </footer>
    </div>
  );
}
