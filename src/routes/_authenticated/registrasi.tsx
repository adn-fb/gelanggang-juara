import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Plus, Trash2, Loader2, CheckCircle2, Users, CreditCard, Trophy } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { organizationsQuery } from "@/lib/organizations";
import { eventSchema, registrationSchema, registrationsQuery, canCreateTournament, rupiah } from "@/lib/registrations";
import { createTournament, submitRegistration } from "@/lib/registrations.functions";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/registrasi")({
  head: () => pageHead("Registrasi turnamen", "Pendaftaran tim, pemain, dan catatan pembayaran turnamen di Arena."),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(organizationsQuery(context.user.id)), context.queryClient.ensureQueryData(registrationsQuery(context.user.id))]),
  component: RegistrationPage,
});

function RegistrationPage() {
  const { user } = Route.useRouteContext();
  const { data: orgs } = useSuspenseQuery(organizationsQuery(user.id));
  const { data } = useSuspenseQuery(registrationsQuery(user.id));
  const client = useQueryClient();
  const submit = useServerFn(submitRegistration);
  const create = useServerFn(createTournament);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const eligible = orgs.organizations.filter(o => canCreateTournament(orgs.memberships.find(m => m.organization_id === o.id)?.role));
  const form = useForm<z.infer<typeof registrationSchema>>({ resolver: zodResolver(registrationSchema), defaultValues: { eventId: "", teamName: "", contactName: "", contactEmail: user.email ?? "", contactPhone: "", payerName: "", players: [{ fullName: "", jerseyNumber: 1 }] } });
  const eventForm = useForm<z.infer<typeof eventSchema>>({ resolver: zodResolver(eventSchema), defaultValues: { organizationId: eligible[0]?.id ?? "", name: "", sport: "", fee: 0 } });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "players" });
  const eventId = form.watch("eventId");
  const selected = data.events.find(e => e.id === eventId);
  const validation = Object.values(form.formState.errors).map(e => e?.message).find(Boolean) ?? (form.formState.errors.players ? "Periksa nama pemain dan nomor punggung; nomor harus berbeda." : "");
  async function register(values: z.infer<typeof registrationSchema>) {
    setError(""); setSuccess("");
    try {
      await submit({ data: values });
      await client.invalidateQueries({ queryKey: ["registrations", user.id] });
      setSuccess(values.teamName);
      form.reset({ eventId: values.eventId, teamName: "", contactName: "", contactEmail: user.email ?? "", contactPhone: "", payerName: "", players: [{ fullName: "", jerseyNumber: 1 }] });
    } catch (e) { setError(e instanceof Error ? e.message : "Pendaftaran gagal disimpan."); }
  }
  async function addEvent(values: z.infer<typeof eventSchema>) {
    setCreating(true); setError("");
    try {
      const result = await create({ data: values });
      await client.invalidateQueries({ queryKey: ["registrations", user.id] });
      form.setValue("eventId", result.id);
      setOpen(false); eventForm.reset({ organizationId: values.organizationId, name: "", sport: "", fee: 0 });
    } catch (e) { setError(e instanceof Error ? e.message : "Turnamen gagal disimpan."); }
    finally { setCreating(false); }
  }
  return <AppShell>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-medium text-brand">Pendaftaran</p><h1 className="mt-1 text-3xl font-semibold">Registrasi turnamen</h1></div>{eligible.length > 0 && <Button variant="outline" onClick={() => { setError(""); setOpen(true); }}><Plus/>Buat turnamen</Button>}</div>
    {success && <div role="status" className="mt-6 flex flex-wrap items-center gap-3 border-y border-brand/30 bg-accent py-4 px-3 text-accent-foreground"><CheckCircle2 className="size-5"/><p className="min-w-0 flex-1 break-words">{success} terdaftar. Status pendaftaran menunggu tinjauan.</p><Button asChild variant="outline" size="sm"><Link to="/dashboard">Lihat peserta</Link></Button></div>}
    {data.events.length === 0 ? <section className="py-20 text-center"><Trophy className="mx-auto size-12 text-muted-foreground"/><h2 className="mt-4 text-xl font-semibold">Belum ada turnamen</h2><p className="mt-2 text-sm text-muted-foreground">{eligible.length ? "Buat turnamen pertama untuk membuka pendaftaran." : "Belum ada turnamen yang tersedia dalam organisasi Anda."}</p>{orgs.organizations.length === 0 && <Button asChild variant="brand" className="mt-5"><Link to="/organisasi">Organisasi saya</Link></Button>}</section> :
    <form onSubmit={form.handleSubmit(register)} className="mt-8 space-y-8">
      <section className="border-b pb-6"><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Trophy className="size-5 text-brand"/>Turnamen</h2><Label htmlFor="event">Pilih turnamen</Label><Select value={eventId} onValueChange={value => form.setValue("eventId", value, { shouldValidate: true })}><SelectTrigger id="event" className="mt-2"><SelectValue placeholder="Pilih turnamen"/></SelectTrigger><SelectContent>{data.events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select>{selected && <p className="mt-3 text-sm text-muted-foreground">{selected.sport} · {orgs.organizations.find(o => o.id === selected.organization_id)?.name} · Biaya tim {rupiah(selected.registration_fee)}</p>}</section>
      <section><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Users className="size-5 text-brand"/>Data tim</h2><div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="teamName">Nama tim</Label><Input id="teamName" {...form.register("teamName")} maxLength={120} required/></div>
        <div className="space-y-2"><Label htmlFor="contactName">Nama penanggung jawab</Label><Input id="contactName" {...form.register("contactName")} maxLength={120} required/></div>
        <div className="space-y-2"><Label htmlFor="contactEmail">Email penanggung jawab</Label><Input id="contactEmail" type="email" {...form.register("contactEmail")} maxLength={255} required/></div>
        <div className="space-y-2"><Label htmlFor="contactPhone">Nomor WhatsApp</Label><Input id="contactPhone" type="tel" placeholder="081234567890" {...form.register("contactPhone")} maxLength={20} required/></div>
      </div></section>
      <section className="border-t pt-6"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Daftar pemain <span className="text-sm text-muted-foreground">({fields.length})</span></h2><Button type="button" variant="outline" size="sm" disabled={fields.length >= 100} onClick={() => append({ fullName: "", jerseyNumber: Math.min(999, Math.max(...form.getValues("players").map(p => p.jerseyNumber || 0)) + 1) })}><Plus/>Tambah pemain</Button></div><div className="space-y-4">{fields.map((field, index) => <div key={field.id} className="grid grid-cols-[minmax(0,1fr)_80px_36px] items-end gap-3"><div className="space-y-2"><Label htmlFor={`player-${index}`}>Nama pemain {index + 1}</Label><Input id={`player-${index}`} {...form.register(`players.${index}.fullName`)} maxLength={120} required/></div><div className="space-y-2"><Label htmlFor={`jersey-${index}`}>No. punggung</Label><Input id={`jersey-${index}`} type="number" min={0} max={999} {...form.register(`players.${index}.jerseyNumber`, { valueAsNumber: true })} required/></div><Button type="button" size="icon" variant="ghost" disabled={fields.length === 1} aria-label={`Hapus pemain ${index + 1}`} onClick={() => remove(index)}><Trash2/></Button></div>)}</div></section>
      <section className="border-t pt-6"><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><CreditCard className="size-5 text-brand"/>Pembayaran</h2><div className="flex flex-wrap items-center justify-between gap-3 border-y py-4"><span className="text-sm text-muted-foreground">Biaya pendaftaran tim</span><strong className="text-xl">{rupiah(selected?.registration_fee ?? 0)}</strong></div><div className="mt-4 space-y-2"><Label htmlFor="payerName">Nama pembayar</Label><Input id="payerName" {...form.register("payerName")} maxLength={120} required/></div><p className="mt-3 text-sm text-muted-foreground">Pembayaran online belum tersedia. Catatan pembayaran disimpan sebagai belum dibayar; pendaftaran tidak menagih uang.</p></section>
      {(validation || error) && <p role="alert" className="text-sm text-destructive">{error || validation}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"><Button asChild variant="ghost"><Link to="/dashboard">Kembali ke dasbor</Link></Button><Button type="submit" variant="brand" disabled={form.formState.isSubmitting || !selected}>{form.formState.isSubmitting && <Loader2 className="animate-spin"/>}Kirim pendaftaran</Button></div>
    </form>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Turnamen baru</DialogTitle></DialogHeader><form onSubmit={eventForm.handleSubmit(addEvent)} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="event-org">Organisasi</Label><Select value={eventForm.watch("organizationId")} onValueChange={v => eventForm.setValue("organizationId", v)}><SelectTrigger id="event-org"><SelectValue placeholder="Pilih organisasi"/></SelectTrigger><SelectContent>{eligible.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="event-name">Nama turnamen</Label><Input id="event-name" {...eventForm.register("name")} minLength={2} maxLength={120} required/></div>
      <div className="space-y-2"><Label htmlFor="event-sport">Cabang olahraga</Label><Input id="event-sport" {...eventForm.register("sport")} minLength={2} maxLength={100} required/></div>
      <div className="space-y-2"><Label htmlFor="event-fee">Biaya per tim (IDR)</Label><Input id="event-fee" type="number" min={0} max={100000000} {...eventForm.register("fee", { valueAsNumber: true })} required/></div>
      {(error || Object.keys(eventForm.formState.errors).length > 0) && <p role="alert" className="text-sm text-destructive">{error || "Periksa data turnamen."}</p>}
      <Button variant="brand" type="submit" disabled={creating}>{creating && <Loader2 className="animate-spin"/>}Simpan turnamen</Button>
    </form></DialogContent></Dialog>
  </AppShell>;
}