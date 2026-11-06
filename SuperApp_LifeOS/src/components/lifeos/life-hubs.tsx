"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  Crown,
  FolderKanban,
  GraduationCap,
  HeartPulse,
  MoonStar,
  Orbit,
  Sprout,
  Target,
  Telescope,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLifeOS } from "@/lib/lifeos/store";
import type { ViewId } from "@/lib/lifeos/constants";
import { getTodayEntry, useUnifiedModules } from "@/lib/modules/store";
import { initialDailyQuests } from "@/data/monarch-seed";

interface HubLink {
  view: ViewId;
  title: string;
  description: string;
  value?: string;
  icon: LucideIcon;
}

function HubGrid({ links }: { links: HubLink[] }) {
  const setView = useLifeOS((store) => store.setView);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <button key={link.view} onClick={() => setView(link.view)} className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full transition hover:border-primary/50 hover:shadow-sm">
              <CardContent className="flex h-full items-start gap-3 pt-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2"><strong>{link.title}</strong>{link.value && <Badge variant="secondary">{link.value}</Badge>}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{link.description}</span>
                </span>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

export function PlanningHub() {
  const state = useLifeOS((store) => store.state);
  const modules = useUnifiedModules((store) => store.data);
  const activeGoals = state?.goals.filter((goal) => !["TERMINE", "ANNULE"].includes(goal.status)).length ?? 0;
  const activeProjects = (state?.projects.filter((project) => !project.archived && !["TERMINE", "ANNULE"].includes(project.status)).length ?? 0)
    + modules.mk.projects.filter((project) => project.state === "ACTIVE").length;
  const pendingActions = state?.actions.filter((action) => !action.done).length ?? 0;

  return (
    <div className="space-y-5">
      <header><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Planifier</p><h1 className="mt-1 text-2xl font-bold">Du cap à la prochaine action</h1><p className="mt-1 text-sm text-muted-foreground">Vision, objectifs, projets et calendrier réunis dans un seul parcours.</p></header>
      <HubGrid links={[
        { view: "vision", title: "Vision", description: "Clarifier le cap de long terme.", icon: Telescope },
        { view: "goals", title: "Objectifs", description: "Transformer le cap en résultats mesurables.", value: String(activeGoals), icon: Target },
        { view: "projects", title: "Projets", description: "Piloter les chantiers en cours.", value: String(activeProjects), icon: FolderKanban },
        { view: "calendar", title: "Calendrier", description: "Voir les échéances et les actions.", value: String(pendingActions), icon: CalendarDays },
        { view: "mk", title: "Système MK", description: "Protéger le focus et faire les revues.", icon: Brain },
        { view: "destiny", title: "Mon Astre", description: "Lire les cycles et poser tes règles.", icon: Orbit },
      ]} />
    </div>
  );
}

export function DomainsHub() {
  const state = useLifeOS((store) => store.state);
  const modules = useUnifiedModules((store) => store.data);
  const today = getTodayEntry(modules);
  return (
    <div className="space-y-5">
      <header><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Domaines</p><h1 className="mt-1 text-2xl font-bold">Les piliers de ta vie</h1><p className="mt-1 text-sm text-muted-foreground">Chaque domaine garde sa profondeur, mais partage désormais le même noyau.</p></header>
      <HubGrid links={[
        { view: "evolution", title: "Évolution", description: "Actions structurantes et récurrences.", value: `${modules.evolution.activeActionCodes.length}/3`, icon: Sprout },
        { view: "monarch", title: "Royaume", description: "Quêtes, statistiques et discipline.", value: `${today.questDone.length}`, icon: Crown },
        { view: "spiritual", title: "Misbaha", description: "Prières, zikr, cures et intentions.", value: `${today.prayersDone.length}/5`, icon: MoonStar },
        { view: "finances", title: "Finances", description: "Budget, flux et décisions financières.", value: String(state?.accounts.length ?? 0), icon: Wallet },
        { view: "health", title: "Santé", description: "Sommeil, sport et mesures corporelles.", value: String(state?.healthMetrics.length ?? 0), icon: HeartPulse },
        { view: "skills", title: "Compétences", description: "Apprentissages et niveaux cibles.", value: String(state?.skills.length ?? 0), icon: GraduationCap },
      ]} />
    </div>
  );
}

export function ReviewHub() {
  const state = useLifeOS((store) => store.state);
  const modules = useUnifiedModules((store) => store.data);
  const today = getTodayEntry(modules);
  const rituals = [...today.morningRituals, ...today.eveningRituals].filter(Boolean).length;
  const dailyScore = Math.round(((today.questDone.length / initialDailyQuests.length) * 0.45 + (today.prayersDone.length / 5) * 0.35 + (rituals / 8) * 0.2) * 100);
  const recentEvents = modules.events.slice(0, 8);

  return (
    <div className="space-y-5">
      <header><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Bilan</p><h1 className="mt-1 text-2xl font-bold">Voir, apprendre, ajuster</h1><p className="mt-1 text-sm text-muted-foreground">Un bilan transversal au lieu de six historiques isolés.</p></header>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><BarChart3 className="size-5 text-primary" /><p className="mt-2 text-2xl font-black">{dailyScore}%</p><p className="text-xs text-muted-foreground">score du jour</p><Progress className="mt-3" value={dailyScore} /></CardContent></Card>
        <Card><CardContent className="pt-5"><CheckCircle2 className="size-5 text-emerald-500" /><p className="mt-2 text-2xl font-black">{modules.monarch.xpTotal}</p><p className="text-xs text-muted-foreground">XP unifiés</p></CardContent></Card>
        <Card><CardContent className="pt-5"><FolderKanban className="size-5 text-amber-500" /><p className="mt-2 text-2xl font-black">{state?.actions.filter((action) => !action.done).length ?? 0}</p><p className="text-xs text-muted-foreground">actions ouvertes</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Journal d’activité unifié</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recentEvents.length === 0 ? <p className="text-sm text-muted-foreground">Les prochaines actions validées apparaîtront ici.</p> : recentEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 rounded-lg border p-3"><Badge variant="outline">{event.source}</Badge><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{event.title}</p><p className="text-[11px] text-muted-foreground">{new Date(event.createdAt).toLocaleString("fr-FR")}</p></div>{event.xp > 0 && <strong className="text-xs text-primary">+{event.xp} XP</strong>}</div>
          ))}
        </CardContent>
      </Card>
      <HubGrid links={[
        { view: "cockpit", title: "Cockpit", description: "Alertes et indicateurs financiers.", icon: BarChart3 },
        { view: "mk", title: "Revue MK", description: "Bilan hebdomadaire et mensuel.", icon: Brain },
        { view: "monarch", title: "Progression", description: "Séries, XP et récompenses.", icon: Crown },
      ]} />
    </div>
  );
}
