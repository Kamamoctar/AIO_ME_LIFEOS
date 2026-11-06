"use client";

// Life OS — Santé : suivi simple et non médical
import { useMemo, useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import { SectionCard, Kpi, EmptyState, Field, ProgressStat } from "@/components/lifeos/ui-bits";
import { formatDateFR } from "@/lib/lifeos/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HeartPulse, Dumbbell, Moon, Scale as ScaleIcon, Footprints } from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LifeOSState } from "@/lib/lifeos/types";

export function HealthView() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <HealthInner state={state} />;
}

function HealthInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const [weight, setWeight] = useState<string>("");
  const [sportMinutes, setSportMinutes] = useState<string>("30");
  const [sleepHours, setSleepHours] = useState<string>("");
  const [notes, setNotes] = useState("");


  const metrics = state.healthMetrics;
  const sorted = useMemo(() => [...metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [metrics]);

  const last30 = sorted.slice(-30);
  const sportCount = last30.filter((m) => m.sportDone).length;
  const avgSleep = last30.length > 0 ? last30.reduce((s, m) => s + (m.sleepHours ?? 0), 0) / last30.length : 0;
  const sportTarget = 12; // ~3x/semaine

  const weightData = sorted
    .filter((m) => m.weight !== null)
    .map((m) => ({ date: formatDateFR(m.date).slice(0, 6), poids: m.weight }));

  const save = async () => {
    await mutate("healthMetric", "create", undefined, {
      date: new Date().toISOString(),
      weight: weight ? Number(weight) : null,
      sportDone: !!sportMinutes,
      sportMinutes: sportMinutes ? Number(sportMinutes) : null,
      sleepHours: sleepHours ? Number(sleepHours) : null,
      notes: notes || null,
    });
    setWeight("");
    setSleepHours("");
    setNotes("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <HeartPulse className="size-5 text-primary" />
          Santé & Forme
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Suivi simple et non médical : poids, sport, sommeil, habitudes
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Séances de sport (30 j)" value={`${sportCount}`} tone={sportCount >= sportTarget ? "positive" : "warning"} hint={`Objectif : ${sportTarget}`} icon={<Dumbbell className="size-4" />} />
        <Kpi label="Sommeil moyen" value={avgSleep > 0 ? `${avgSleep.toFixed(1)} h` : "—"} icon={<Moon className="size-4" />} tone={avgSleep >= 7 ? "positive" : "default"} />
        <Kpi label="Dernier poids" value={metrics.find((m) => m.weight !== null)?.weight ? `${metrics.find((m) => m.weight !== null)!.weight} kg` : "—"} icon={<ScaleIcon className="size-4" />} />
        <Kpi label="Points santé (30 j)" value={`${last30.filter((m) => m.sportDone || m.sleepHours).length}`} hint="Jours avec au moins une donnée" icon={<Footprints className="size-4" />} />
      </div>

      <SectionCard title="Point du jour" description="Quelques secondes — saisie rapide" icon={<HeartPulse className="size-4" />}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Poids (kg)">
            <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="—" />
          </Field>
          <Field label="Sport (minutes, 0 = rien)">
            <Input type="number" value={sportMinutes} onChange={(e) => setSportMinutes(e.target.value)} />
          </Field>
          <Field label="Sommeil (heures)">
            <Input type="number" step="0.5" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="—" />
          </Field>
          <Field label="Notes">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optionnel" />
          </Field>
        </div>
        <Button className="mt-3" size="sm" onClick={save}>
          Enregistrer le point du jour
        </Button>
      </SectionCard>

      {weightData.length > 1 && (
        <SectionCard title="Évolution du poids" icon={<ScaleIcon className="size-4" />}>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="poids" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Historique récent" icon={<Dumbbell className="size-4" />}>
        {metrics.length === 0 ? (
          <EmptyState title="Aucune donnée santé" description="Enregistre ton premier point quotidien." />
        ) : (
          <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {metrics.slice(0, 20).map((m) => (
              <li key={m.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs">
                <span className="font-medium w-24 shrink-0">{formatDateFR(m.date)}</span>
                <span className="text-muted-foreground">
                  {m.sportDone ? `🏃 ${m.sportMinutes ?? "?"} min` : "—"}
                  {m.sleepHours ? ` · 💤 ${m.sleepHours} h` : ""}
                  {m.weight ? ` · ⚖ ${m.weight} kg` : ""}
                  {m.notes ? ` · ${m.notes}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
