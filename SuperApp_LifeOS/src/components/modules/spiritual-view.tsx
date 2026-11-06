"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import zikrLibrary from "@/data/zikr.json";
import { calculatePrayerDay } from "@/modules/spiritual/prayers";
import { formatWindow, PRAYER_LABELS, resolveProgram } from "@/modules/spiritual/temporal";
import type { MainPrayerName, ProgramItem, Zikr, ZikrData } from "@/modules/spiritual/types";
import { getTodayEntry, localDateKey, useUnifiedModules } from "@/lib/modules/store";
import { disableLifeOSReminders, scheduleLifeOSReminders } from "@/lib/native/reminders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BarChart3, BellRing, Check, Clock3, HeartHandshake, LocateFixed, MapPin, Minus, MoonStar, RotateCcw, Settings2, Sparkles, X } from "lucide-react";

const library = zikrLibrary as unknown as ZikrData;
const PRAYERS: MainPrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export function SpiritualView() {
  const store = useUnifiedModules();
  const { data } = store;
  const [now, setNow] = useState(() => new Date());
  const [active, setActive] = useState<ProgramItem | null>(null);
  const [intentionText, setIntentionText] = useState("");
  const [intentionZikr, setIntentionZikr] = useState(library.zikrs[0]?.id ?? "");
  const [manualLat, setManualLat] = useState(String(data.spiritual.settings.coordinates.latitude));
  const [manualLon, setManualLon] = useState(String(data.spiritual.settings.coordinates.longitude));
  const [locationMessage, setLocationMessage] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const today = getTodayEntry(data);
  const dayKey = localDateKey(now);
  const prayerDay = useMemo(() => {
    const [year, month, day] = dayKey.split("-").map(Number);
    return calculatePrayerDay(
      new Date(year, month - 1, day, 12),
      data.spiritual.settings
    );
  }, [dayKey, data.spiritual.settings]);
  const program = useMemo(() => resolveProgram({
    day: now,
    now,
    prayerDay,
    zikrs: library.zikrs,
    prayerSelections: data.spiritual.settings.prayerSelections,
  }), [now, prayerDay, data.spiritual.settings.prayerSelections]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setLocationMessage("Géolocalisation indisponible sur cet appareil.");
      return;
    }
    setLocationMessage("Localisation en cours…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        store.updateSpiritualSettings({ coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: "Ma position",
          source: "geolocation",
        } });
        setManualLat(String(position.coords.latitude));
        setManualLon(String(position.coords.longitude));
        setLocationMessage("Position enregistrée uniquement sur cet appareil.");
      },
      () => setLocationMessage("Position refusée. Lomé ou les coordonnées manuelles restent disponibles."),
      { enableHighAccuracy: false, timeout: 10_000 }
    );
  };

  const enableReminders = async () => {
    setReminderMessage("Programmation des rappels…");
    try {
      const result = await scheduleLifeOSReminders(data.spiritual.settings);
      if (result.ok) store.updateSpiritualSettings({ notificationsEnabled: true });
      setReminderMessage(result.message);
    } catch {
      setReminderMessage("Impossible de programmer les rappels sur cet appareil.");
    }
  };

  const disableReminders = async () => {
    try {
      const result = await disableLifeOSReminders();
      store.updateSpiritualSettings({ notificationsEnabled: false });
      setReminderMessage(result.message);
    } catch {
      setReminderMessage("Impossible de désactiver les rappels Android.");
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Misbaha</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold"><MoonStar className="size-6" /> Prières, zikr et présence</h1>
        <p className="mt-1 text-sm text-muted-foreground">Horaires calculés sur l’appareil · tasbih persistant · intentions privées.</p>
      </header>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-5">
          <TabsTrigger value="today">Jour</TabsTrigger>
          <TabsTrigger value="zikrs">Zikrs</TabsTrigger>
          <TabsTrigger value="requests">Intentions</TabsTrigger>
          <TabsTrigger value="progress">Progrès</TabsTrigger>
          <TabsTrigger value="settings"><Settings2 className="size-4" /></TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">Prières · {data.spiritual.settings.coordinates.label}</CardTitle><Badge variant="outline">{data.spiritual.settings.prayerMethod}</Badge></div></CardHeader>
            <CardContent className="grid grid-cols-5 gap-2">
              {PRAYERS.map((prayer) => {
                const done = today.prayersDone.includes(prayer);
                return <button key={prayer} onClick={() => store.togglePrayer(prayer)} className={`rounded-xl border px-1 py-3 text-center ${done ? "border-primary bg-primary/10" : ""}`}><span className="block text-[10px] font-semibold uppercase text-muted-foreground">{PRAYER_LABELS[prayer]}</span><strong className="mt-1 block text-sm">{format(prayerDay[prayer], "HH:mm")}</strong>{done && <Check className="mx-auto mt-1 size-3 text-primary" />}</button>;
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Programme du jour</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {program.map((item) => {
                const count = data.spiritual.dailyCounts[localDateKey()]?.[item.zikrId] ?? 0;
                const target = item.target;
                return (
                  <button key={item.id} onClick={() => setActive(item)} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:bg-muted/50">
                    <span className={`size-2.5 shrink-0 rounded-full ${item.status === "active" ? "bg-emerald-500" : item.status === "passed" ? "bg-muted-foreground/40" : "bg-amber-500"}`} />
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.zikr.nom}</p><Badge variant="secondary" className="text-[9px]">{formatWindow(item)}</Badge></div><p className="arabic mt-1 truncate text-lg" lang="ar">{item.zikr.arabe}</p></div>
                    <div className="text-right"><strong className="text-primary">{count.toLocaleString("fr-FR")}</strong><p className="text-[10px] text-muted-foreground">{target ? `/ ${target.toLocaleString("fr-FR")}` : "libre"}</p></div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zikrs">
          <div className="grid gap-3 md:grid-cols-2">
            {library.zikrs.map((zikr) => {
              const count = data.spiritual.lifetimeCounts[zikr.id] ?? 0;
              const item = program.find((entry) => entry.zikrId === zikr.id) ?? freeProgramItem(zikr, now);
              return (
                <Card key={zikr.id} className="cursor-pointer transition hover:border-primary/50" onClick={() => setActive(item)}>
                  <CardContent className="pt-5"><div className="flex items-start justify-between gap-3"><div><Badge variant="outline">{zikr.nature}</Badge><h2 className="mt-3 font-bold">{zikr.nom}</h2><p className="arabic mt-2 text-2xl" lang="ar">{zikr.arabe}</p></div><div className="text-right"><strong className="text-xl text-primary">{count.toLocaleString("fr-FR")}</strong><p className="text-[10px] text-muted-foreground">à vie</p></div></div><p className="mt-3 text-sm text-muted-foreground">{zikr.sens}</p><p className="mt-2 text-xs">{zikr.instruction}</p></CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><HeartHandshake className="size-4" /> Déposer une intention</CardTitle></CardHeader><CardContent className="space-y-3"><select value={intentionZikr} onChange={(event) => setIntentionZikr(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{library.zikrs.map((zikr) => <option key={zikr.id} value={zikr.id}>{zikr.nom}</option>)}</select><Textarea value={intentionText} onChange={(event) => setIntentionText(event.target.value)} placeholder="Ton intention reste sur cet appareil" /><Button onClick={() => { if (!intentionText.trim()) return; store.addIntention(intentionZikr, intentionText); setIntentionText(""); }}><Sparkles className="mr-1.5 size-4" /> Confier l’intention</Button></CardContent></Card>
          <div className="grid gap-3 md:grid-cols-2">{data.spiritual.intentions.map((intention) => <Card key={intention.id}><CardContent className="pt-5"><Badge variant="secondary">{intention.status}</Badge><p className="mt-3 font-medium">{intention.text}</p><p className="mt-2 text-xs text-muted-foreground">{library.zikrs.find((zikr) => zikr.id === intention.zikrId)?.nom} · {new Date(intention.createdAt).toLocaleDateString("fr-FR")}</p></CardContent></Card>)}</div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Metric label="Récitations à vie" value={Object.values(data.spiritual.lifetimeCounts).reduce((sum, value) => sum + value, 0).toLocaleString("fr-FR")} />
            <Metric label="Zikrs pratiqués" value={String(Object.values(data.spiritual.lifetimeCounts).filter((value) => value > 0).length)} />
            <Metric label="Prières aujourd’hui" value={`${today.prayersDone.length}/5`} />
            <Metric label="Intentions" value={String(data.spiritual.intentions.length)} />
            <Metric label="Jours de cure" value={String(data.spiritual.cureDays.filter((day) => day.status === "fait").length)} />
          </div>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="size-4" /> Détail par zikr</CardTitle></CardHeader><CardContent className="space-y-3">{library.zikrs.map((zikr) => { const count = data.spiritual.lifetimeCounts[zikr.id] ?? 0; const max = Math.max(...Object.values(data.spiritual.lifetimeCounts), 1); return <div key={zikr.id}><div className="mb-1 flex justify-between text-xs"><span>{zikr.nom}</span><strong>{count.toLocaleString("fr-FR")}</strong></div><Progress value={(count / max) * 100} /></div>; })}</CardContent></Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MapPin className="size-4" /> Position & calcul des prières</CardTitle></CardHeader><CardContent className="space-y-3"><Button variant="outline" onClick={locate}><LocateFixed className="mr-1.5 size-4" /> Utiliser ma position</Button><div className="grid grid-cols-2 gap-2"><Input value={manualLat} onChange={(event) => setManualLat(event.target.value)} inputMode="decimal" placeholder="Latitude" /><Input value={manualLon} onChange={(event) => setManualLon(event.target.value)} inputMode="decimal" placeholder="Longitude" /></div><Button size="sm" onClick={() => { const latitude = Number(manualLat.replace(",", ".")); const longitude = Number(manualLon.replace(",", ".")); if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) { setLocationMessage("Coordonnées invalides."); return; } store.updateSpiritualSettings({ coordinates: { latitude, longitude, label: "Position manuelle", source: "manual" } }); setLocationMessage("Coordonnées appliquées."); }}>Appliquer</Button>{locationMessage && <p className="text-xs text-muted-foreground">{locationMessage}</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><BellRing className="size-4" /> Rappels Android</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Un briefing quotidien et les cinq prières des sept prochains jours, calculés localement.</p><label className="block text-xs font-medium">Heure du briefing<Input type="time" value={data.spiritual.settings.briefingTime} onChange={(event) => store.updateSpiritualSettings({ briefingTime: event.target.value })} className="mt-1 max-w-40" /></label><div className="flex flex-wrap gap-2"><Button onClick={() => void enableReminders()}><BellRing className="mr-1.5 size-4" /> {data.spiritual.settings.notificationsEnabled ? "Reprogrammer" : "Activer"}</Button>{data.spiritual.settings.notificationsEnabled && <Button variant="outline" onClick={() => void disableReminders()}>Désactiver</Button>}</div>{reminderMessage && <p className="text-xs text-muted-foreground" role="status">{reminderMessage}</p>}</CardContent></Card>
        </TabsContent>
      </Tabs>

      {active && <Tasbih item={active} count={data.spiritual.dailyCounts[localDateKey()]?.[active.zikrId] ?? 0} onAdd={(amount) => { const current = data.spiritual.dailyCounts[localDateKey()]?.[active.zikrId] ?? 0; store.incrementZikr(active.zikrId, amount); if (active.zikr.nature === "cure" && active.target && current < active.target && current + amount >= active.target) store.completeCureDay(active.zikrId); }} onReset={() => store.resetTodayZikr(active.zikrId)} onClose={() => setActive(null)} />}
    </div>
  );
}

function freeProgramItem(zikr: Zikr, now: Date): ProgramItem {
  return { id: `${localDateKey()}:${zikr.id}:free`, zikrId: zikr.id, zikr, instanceKey: `${localDateKey()}:${zikr.id}:free`, label: "Libre", start: now, end: now, target: zikr.quantite, kind: zikr.fenetre.type, status: "active", remainingCount: zikr.quantite, requiredPacePerMinute: null };
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="pt-5"><p className="text-2xl font-black text-primary">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></CardContent></Card>;
}

function Tasbih({ item, count, onAdd, onReset, onClose }: { item: ProgramItem; count: number; onAdd: (amount: number) => void; onReset: () => void; onClose: () => void }) {
  const target = item.target;
  const progress = target ? Math.min(100, (count / target) * 100) : 0;
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    if ("wakeLock" in navigator) void navigator.wakeLock.request("screen").then((value) => { lock = value; }).catch(() => undefined);
    return () => { void lock?.release(); };
  }, []);
  const add = (amount: number) => {
    onAdd(amount);
    if ("vibrate" in navigator) navigator.vibrate(count + amount > 0 && (count + amount) % 33 === 0 ? [35, 45, 35] : 15);
  };
  return (
    <div className="safe-screen fixed inset-0 z-[100] flex flex-col bg-[#120d08] p-4 text-[#fff7ea] sm:p-6">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between"><button onClick={onClose} className="grid size-10 place-items-center rounded-xl bg-white/5"><X className="size-5" /></button><div className="text-center"><p className="text-[10px] uppercase tracking-[.2em] text-amber-300">Tasbih</p><p className="font-semibold">{item.zikr.nom}</p></div><button onClick={onReset} className="grid size-10 place-items-center rounded-xl bg-white/5" aria-label="Réinitialiser"><RotateCcw className="size-4" /></button></div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center">
        <p className="arabic max-w-xl text-center text-4xl leading-relaxed sm:text-6xl" lang="ar">{item.zikr.arabe}</p>
        <p className="mt-3 text-sm text-white/50">{item.zikr.sens}</p>
        <div className="mt-8 text-center"><strong className="text-7xl font-black tabular-nums text-amber-300">{count.toLocaleString("fr-FR")}</strong><p className="mt-2 text-sm text-white/50">{target ? `sur ${target.toLocaleString("fr-FR")}` : "quantité libre"}</p></div>
        {target && <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full bg-amber-300" style={{ width: `${progress}%` }} /></div>}
        <button onClick={() => add(1)} className="mt-8 h-40 w-full rounded-[2rem] border border-amber-300/30 bg-amber-300/10 text-2xl font-black text-amber-200 active:scale-[.99]">TAP</button>
        <div className="mt-4 grid w-full grid-cols-3 gap-2">{[10, 33, 100].map((amount) => <button key={amount} onClick={() => add(amount)} className="rounded-xl border border-white/10 py-3 font-semibold text-white/70">+{amount}</button>)}</div>
      </div>
    </div>
  );
}
