"use client";

import { useMemo, useState } from "react";
import grid from "@/data/destiny-grid.json";
import { DESTINY_DOMAINS, evaluateDestiny, planDestinyDays } from "@/modules/destiny/engine";
import { useUnifiedModules } from "@/lib/modules/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Compass, HeartPulse, MoonStar, Search, ShieldAlert, Sparkles, Users } from "lucide-react";

export function DestinyView() {
  const { data, setBirthDate } = useUnifiedModules();
  const [intent, setIntent] = useState("prendre une décision importante");
  const profile = evaluateDestiny(new Date(), data.destiny.birthDate);
  const planned = useMemo(() => planDestinyDays(intent, data.destiny.birthDate, 45).slice(0, 8), [intent, data.destiny.birthDate]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Mon Astre</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold"><Compass className="size-6" /> Copilote du jour</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lecture locale de la grille personnelle : jour, mois, âge et moment de la journée.</p>
        </div>
        <label className="text-xs text-muted-foreground">Date de naissance
          <Input type="date" value={data.destiny.birthDate} onChange={(event) => setBirthDate(event.target.value)} className="mt-1 bg-card" />
        </label>
      </header>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-4">
          <TabsTrigger value="today">Aujourd’hui</TabsTrigger>
          <TabsTrigger value="plan">Planifier</TabsTrigger>
          <TabsTrigger value="spiritual">Spirituel</TabsTrigger>
          <TabsTrigger value="life">Vie</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[260px_1fr]">
            <Card className="overflow-hidden border-primary/30">
              <div className={`h-2 ${profile.globalScore >= 60 ? "bg-emerald-500" : profile.globalScore >= 40 ? "bg-amber-500" : "bg-red-500"}`} />
              <CardContent className="flex flex-col items-center pt-6 text-center">
                <div className="grid size-28 place-items-center rounded-full border-8 border-primary/10 bg-primary/5">
                  <span className="text-4xl font-black text-primary">{profile.globalScore}</span>
                </div>
                <h2 className="mt-4 text-lg font-bold">{profile.verdict}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Moment : {profile.moment}</p>
                {profile.chanceStage && <Badge className="mt-3">Étape {profile.chanceStage[0]}–{profile.chanceStage[1]} ans</Badge>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Scores par domaine</CardTitle></CardHeader>
              <CardContent className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {DESTINY_DOMAINS.map(([key, label]) => (
                  <div key={key}>
                    <div className="mb-1.5 flex justify-between text-xs"><span className="font-medium">{label}</span><span>{profile.domainScores[key]}/100</span></div>
                    <Progress value={profile.domainScores[key]} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          {profile.hardBlocks.length > 0 && (
            <Card className="border-destructive/40 bg-destructive/5"><CardContent className="flex items-center gap-3 pt-5"><ShieldAlert className="size-6 text-destructive" /><div><p className="font-semibold">Vigilance renforcée</p><p className="text-sm text-muted-foreground">À éviter aujourd’hui : {profile.hardBlocks.join(", ")}.</p></div></CardContent></Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Pourquoi ce score ?</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {profile.traces.map((trace, index) => (
                <div key={`${trace.source}-${index}`} className="rounded-xl border p-3">
                  <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{trace.source}</Badge>{Object.entries(trace.impacts).map(([key, value]) => <span key={key} className={`text-[11px] font-semibold ${value > 0 ? "text-emerald-600" : value < 0 ? "text-red-600" : ""}`}>{key} {value > 0 ? "+" : ""}{value}</span>)}</div>
                  <p className="mt-2 text-sm">{trace.message}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={intent} onChange={(event) => setIntent(event.target.value)} className="pl-9" placeholder="Ex. voyager, investir, se réconcilier…" /></div>
              <Button><Sparkles className="mr-1.5 size-4" /> Classer 45 jours</Button>
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {planned.map((day, index) => (
              <Card key={day.date.toISOString()} className={index === 0 ? "border-primary shadow-sm" : ""}>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between"><Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge><strong className="text-xl text-primary">{day.globalScore}</strong></div>
                  <p className="mt-3 font-semibold capitalize">{day.date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{day.verdict}</p>
                  {day.hardBlocks.length > 0 && <p className="mt-2 text-xs font-medium text-destructive">Éviter : {day.hardBlocks.join(", ")}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="spiritual" className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MoonStar className="size-4" /> Prières hebdomadaires</CardTitle></CardHeader><CardContent className="space-y-2">{grid.spirituel.prieresHebdomadaires.map((prayer) => <div key={prayer.jour} className="rounded-lg border p-3"><p className="font-semibold capitalize">{prayer.jour} {prayer.heure && `· ${prayer.heure}`}</p><p className="mt-1 text-sm text-muted-foreground">{prayer.texte}</p></div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="size-4" /> Repères mensuels</CardTitle></CardHeader><CardContent className="space-y-4"><Repere title="Jeûnes conseillés" values={grid.spirituel.jeunes} /><Repere title="Aumônes" values={grid.spirituel.aumones} /><Repere title="Veillées" values={grid.spirituel.veilles} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="life" className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><HeartPulse className="size-4" /> Santé & alimentation</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>{grid.alimentation.totheme}</p><p>{grid.alimentation.venSamDim}</p><div className="flex flex-wrap gap-2">{grid.alimentation.reglesPermanentes.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="size-4" /> Relations</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>{grid.relations.territoire}</p><p>{grid.relations.argent}</p><p className="text-muted-foreground">{grid.relations.amitiesAVerifier}</p></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Repere({ title, values }: { title: string; values: number[] }) {
  return <div><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{title}</p><div className="flex flex-wrap gap-2">{values.map((value) => <span key={value} className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{value}</span>)}</div></div>;
}
