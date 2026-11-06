"use client";

import { useMemo, useState } from "react";
import {
  initialBusinessProjects,
  initialDailyQuests,
  initialMonthlyBoss,
  initialStats,
  initialTitles,
  initialWorkouts,
  quotes,
} from "@/data/monarch-seed";
import { getTodayEntry, useUnifiedModules } from "@/lib/modules/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BookOpen, Crown, Dumbbell, Flame, Shield, Sparkles, Swords, Trophy, X } from "lucide-react";

type Quest = (typeof initialDailyQuests)[number];

export function MonarchView() {
  const store = useUnifiedModules();
  const { data } = store;
  const today = getTodayEntry(data);
  const [panicOpen, setPanicOpen] = useState(false);
  const [panicStep, setPanicStep] = useState(0);
  const level = Math.floor(data.monarch.xpTotal / 100) + 1;
  const levelXp = data.monarch.xpTotal % 100;
  const rank = level >= 50 ? "S" : level >= 35 ? "A" : level >= 25 ? "B" : level >= 15 ? "C" : level >= 7 ? "D" : "E";
  const quote = useMemo(() => quotes[new Date().getDate() % quotes.length], []);
  const completedXp = initialDailyQuests.filter((quest) => today.questDone.includes(quest.id)).reduce((sum, quest) => sum + quest.xp, 0);
  const totalXp = initialDailyQuests.reduce((sum, quest) => sum + quest.xp, 0);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 p-5 text-white shadow-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.25em] text-violet-300">Silent Monarch</p>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-black"><Crown className="size-6 text-amber-400" /> {data.monarch.codename}</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">« {quote} »</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="grid size-20 place-items-center rounded-full border-4 border-violet-400/40 bg-violet-400/10 text-center"><div><span className="block text-[10px] uppercase text-violet-300">Niveau</span><strong className="text-3xl">{level}</strong></div></div>
            <div><Badge className="bg-amber-400 text-slate-950 hover:bg-amber-400">Rang {rank}</Badge><p className="mt-2 text-xs text-slate-300">{data.monarch.xpTotal} XP total</p></div>
          </div>
        </div>
        <div className="mt-5"><div className="mb-1 flex justify-between text-xs text-slate-300"><span>Vers le niveau {level + 1}</span><span>{levelXp}/100 XP</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-amber-400" style={{ width: `${levelXp}%` }} /></div></div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={<Flame className="size-5 text-orange-500" />} label="Pureté" value={`${data.monarch.streakNoFap} j`} detail={`Record ${data.monarch.recordNoFap}`} />
        <StatCard icon={<Crown className="size-5 text-violet-500" />} label="Série de quêtes" value={`${data.monarch.streakQuests} j`} detail="jours complets" />
        <StatCard icon={<Trophy className="size-5 text-amber-500" />} label="Quêtes du jour" value={`${today.questDone.length}/${initialDailyQuests.length}`} detail={`${completedXp}/${totalXp} XP`} />
        <StatCard icon={<Shield className="size-5 text-sky-500" />} label="Victoires SOS" value={String(data.monarch.panicWins)} detail="résistances" />
        <button onClick={() => { setPanicStep(0); setPanicOpen(true); }} className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-left transition hover:bg-red-500/20"><AlertTriangle className="size-5 text-red-500" /><p className="mt-2 text-sm font-bold text-red-600 dark:text-red-400">SOS Tentation</p><p className="text-xs text-muted-foreground">Protocole d’urgence</p></button>
      </div>

      <Tabs defaultValue="quests" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-4">
          <TabsTrigger value="quests">Quêtes</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="dungeons">Donjons</TabsTrigger>
          <TabsTrigger value="body">Corps</TabsTrigger>
        </TabsList>

        <TabsContent value="quests" className="space-y-4">
          {(["matin", "trajet", "journee", "soir"] as const).map((block) => {
            const quests = initialDailyQuests.filter((quest) => quest.bloc === block);
            if (!quests.length) return null;
            return (
              <Card key={block}>
                <CardHeader className="pb-3"><CardTitle className="text-base capitalize">{block === "journee" ? "Journée" : block}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {quests.map((quest) => <QuestRow key={quest.id} quest={quest} checked={today.questDone.includes(quest.id)} onToggle={() => store.toggleQuest(quest.id, quest.xp, quest.stat)} />)}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(initialStats).map(([key, stat]) => {
              const earned = data.monarch.statXp[key] ?? 0;
              const value = stat.base + Math.floor(earned / 50);
              return (
                <Card key={key}><CardContent className="pt-5"><div className="flex items-center justify-between"><span className="text-2xl">{stat.emoji}</span><Badge variant="outline">{stat.code}</Badge></div><p className="mt-3 font-semibold">{stat.name}</p><p className="text-3xl font-black text-primary">{value}</p><p className="mt-1 text-xs text-muted-foreground">{stat.description}</p><Progress value={(earned % 50) * 2} className="mt-3" /></CardContent></Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="dungeons" className="space-y-4">
          <Card className="border-violet-500/30"><CardContent className="pt-5"><div className="flex items-start gap-3"><Swords className="size-7 text-violet-500" /><div><p className="text-xs font-semibold uppercase text-violet-500">Boss mensuel</p><h2 className="text-xl font-black">{initialMonthlyBoss.name}</h2><p className="mt-1 text-sm text-muted-foreground">{initialMonthlyBoss.description}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{initialMonthlyBoss.targets.slice(0, 6).map((target) => <div key={target.id} className="rounded-lg border p-3 text-xs"><p className="font-medium">{target.label}</p><Progress value={(target.current / target.max) * 100} className="mt-2" /></div>)}</div></CardContent></Card>
          <div className="grid gap-3 md:grid-cols-2">
            {initialBusinessProjects.map((project) => (
              <Card key={project.id}><CardContent className="pt-5"><Badge variant={project.status === "en_cours" ? "default" : "secondary"}>{project.status === "en_cours" ? "Actif" : "À lancer"}</Badge><h3 className="mt-3 font-bold">{project.name}</h3><p className="mt-1 text-sm text-muted-foreground">{project.description}</p><div className="mt-3 flex justify-between text-xs"><span>{project.cost}</span><span className="font-medium text-emerald-600">{project.potential}</span></div><p className="mt-3 text-xs font-medium">Prochaine étape : {project.steps.find((step) => !step.completed)?.text}</p></CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="body" className="space-y-3">
          {Object.entries(initialWorkouts).map(([day, workout]) => (
            <Card key={day}><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Dumbbell className="size-4" /> {workout.name}</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2">{workout.exercises.map((exercise) => <div key={exercise.name} className="rounded-lg border p-3"><p className="text-sm font-semibold">{exercise.name}</p><p className="text-xs text-muted-foreground">{exercise.sets} séries · {exercise.reps}</p></div>)}</CardContent></Card>
          ))}
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="size-4" /> Titres à conquérir</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2">{initialTitles.map((title) => <div key={title.id} className="rounded-lg border p-3"><p className="font-semibold">{title.emoji} {title.name}</p><p className="mt-1 text-xs text-muted-foreground">{title.condition}</p></div>)}</CardContent></Card>
        </TabsContent>
      </Tabs>

      {panicOpen && <PanicProtocol step={panicStep} onStep={setPanicStep} onClose={() => setPanicOpen(false)} onWin={() => { store.resistTemptation(); setPanicOpen(false); }} onRelapse={() => { store.declareRelapse(); setPanicOpen(false); }} />}
    </div>
  );
}

function StatCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <Card><CardContent className="pt-4">{icon}<p className="mt-2 text-xs text-muted-foreground">{label}</p><p className="text-xl font-black">{value}</p><p className="text-[11px] text-muted-foreground">{detail}</p></CardContent></Card>;
}

function QuestRow({ quest, checked, onToggle }: { quest: Quest; checked: boolean; onToggle: () => void }) {
  return <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${checked ? "bg-primary/5" : ""}`}><Checkbox className="mt-0.5" checked={checked} onCheckedChange={onToggle} /><span className="text-xl">{quest.emoji}</span><div className="min-w-0 flex-1"><p className={`text-sm font-semibold ${checked ? "line-through opacity-60" : ""}`}>{quest.title}</p><p className="mt-1 text-xs text-muted-foreground">{quest.timeSlot} · {quest.stat} · +{quest.xp} XP</p></div></label>;
}

const PANIC_STEPS = [
  { title: "Respire", text: "Inspire 4 secondes, bloque 4 secondes, expire 4 secondes. Répète trois fois." },
  { title: "Bouge", text: "Fais 20 pompes maintenant. Compte chaque répétition, lentement." },
  { title: "Recentre-toi", text: "Récite : أَسْتَغْفِرُ اللّٰهَ — Astaghfirullah." },
  { title: "Change d’espace", text: "Quitte la pièce, bois un verre d’eau et éloigne l’écran." },
  { title: "Rappelle ton identité", text: "Tu protèges la personne que tu construis, pas seulement une série de jours." },
  { title: "Décide", text: "La vague est passée. Choisis maintenant l’issue réelle." },
];

function PanicProtocol({ step, onStep, onClose, onWin, onRelapse }: { step: number; onStep: (step: number) => void; onClose: () => void; onWin: () => void; onRelapse: () => void }) {
  const current = PANIC_STEPS[step];
  return (
    <div className="safe-screen fixed inset-0 z-[100] grid place-items-center bg-slate-950/95 p-4 text-white">
      <button onClick={onClose} className="safe-top-offset absolute right-4 rounded-full p-2 text-slate-300 hover:bg-white/10" aria-label="Fermer"><X className="size-6" /></button>
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto grid size-24 place-items-center rounded-full border-4 border-violet-400/40 bg-violet-400/10"><Shield className="size-11 text-violet-300" /></div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[.25em] text-violet-300">Étape {step + 1}/{PANIC_STEPS.length}</p>
        <h2 className="mt-2 text-3xl font-black">{current.title}</h2>
        <p className="mx-auto mt-4 max-w-md text-lg leading-8 text-slate-300">{current.text}</p>
        {step < PANIC_STEPS.length - 1 ? (
          <Button size="lg" className="mt-8 min-w-48 bg-violet-500 hover:bg-violet-600" onClick={() => onStep(step + 1)}>Étape suivante</Button>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2"><Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={onWin}><Sparkles className="mr-2 size-5" /> J’ai résisté · +15 XP</Button><Button size="lg" variant="destructive" onClick={onRelapse}>Déclarer la rechute</Button></div>
        )}
      </div>
    </div>
  );
}
