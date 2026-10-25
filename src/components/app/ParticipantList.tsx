import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Users, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registrationsQuery, registrationStatusLabels, paymentStatusLabels, rupiah } from "@/lib/registrations";

export function ParticipantList({ userId }: { userId: string }) {
  const { data } = useSuspenseQuery(registrationsQuery(userId));
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const entries = data.registrations.filter(r => `${r.team_name} ${data.events.find(e => e.id === r.event_id)?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="mt-8 border-t pt-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-xl font-semibold">Daftar peserta</h2><p className="mt-1 text-sm text-muted-foreground">{data.registrations.length} tim · {data.players.length} pemain</p></div>
      <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden/><Input aria-label="Cari tim atau turnamen" placeholder="Cari tim atau turnamen" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
    </div>
    {entries.length === 0 ? <div className="py-12 text-center"><Users className="mx-auto size-9 text-muted-foreground"/><p className="mt-3 text-sm text-muted-foreground">{search ? "Peserta tidak ditemukan." : "Belum ada tim terdaftar."}</p></div> : <div className="mt-5 divide-y">
      {entries.map(r => {
        const event = data.events.find(e => e.id === r.event_id);
        const payment = data.payments.find(p => p.registration_id === r.id);
        const players = data.players.filter(p => p.registration_id === r.id);
        return <div key={r.id} className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><h3 className="break-words font-semibold">{r.team_name}</h3><p className="break-words text-sm text-muted-foreground">{event?.name} · {players.length} pemain</p></div>
            <div className="flex flex-wrap items-center gap-3 text-xs"><span className="text-brand">{registrationStatusLabels[r.status]}</span><span className="text-muted-foreground">{paymentStatusLabels[payment?.status ?? "unpaid"]} · {rupiah(payment?.amount ?? 0)}</span><Button variant="ghost" size="icon" aria-label={`Lihat pemain ${r.team_name}`} aria-expanded={expanded === r.id} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>{expanded === r.id ? <ChevronUp/> : <ChevronDown/>}</Button></div>
          </div>
          {expanded === r.id && <div className="mt-4 border-l-2 border-brand pl-4"><p className="break-words text-sm">{r.contact_name} · {r.contact_phone} · {r.contact_email}</p><ul className="mt-3 grid gap-2 sm:grid-cols-2">{players.map(p => <li key={p.id} className="flex gap-3 text-sm"><span className="w-8 text-brand">#{p.jersey_number}</span><span className="break-words">{p.full_name}</span></li>)}</ul></div>}
        </div>;
      })}
    </div>}
  </section>;
}