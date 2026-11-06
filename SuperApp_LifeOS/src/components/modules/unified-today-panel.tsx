"use client";

import { EVOLUTION_ACTIONS } from "@/data/evolution-actions";
import { initialDailyQuests } from "@/data/monarch-seed";
import { getTodayEntry, useUnifiedModules } from "@/lib/modules/store";
import { useLifeOS } from "@/lib/lifeos/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity, CheckCircle2, MoonStar, Sparkles, Target } from "lucide-react";

export function UnifiedTodayPanel() {
  const modules = useUnifiedModules();
  const { data } = modules;
  const { setView } = useLifeOS();
  const today = getTodayEntry(data);
  const focus = data.evolution.activeActionCodes
    .map((code) => EVOLUTION_ACTIONS.find((action) => action.code === code))
    .filter(Boolean);
  const questDone = today.questDone.length;
  const ritualsDone = today.morningRituals.filter(Boolean).length + today.eveningRituals.filter(Boolean).length;

  return (
    <section className="space-y-3" aria-label="Ma journée LifeOS">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">Vue unifiée</p><h2 className="text-lg font-bold">Ma journée LifeOS</h2></div>
        <Badge variant="secondary">Énergie {today.energy}/10</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-primary/30">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Target className="size-4 text-primary" /> Priorité unique</CardTitle></CardHeader>
          <CardContent><p className="min-h-10 text-sm font-medium">{today.priority || "Définis ta priorité dans Système MK."}</p><Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => setView("mk")}>Ouvrir MK →</Button></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Sparkles className="size-4 text-violet-500" /> Focus Évolution</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black">{today.evolutionDone.length}/{focus.length}</p><p className="text-xs text-muted-foreground">actions accomplies · {data.evolution.xp} XP</p><Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => setView("evolution")}>Voir le trio →</Button></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Activity className="size-4 text-amber-500" /> Quêtes & rituels</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black">{questDone}/{initialDailyQuests.length}</p><p className="text-xs text-muted-foreground">quêtes · {ritualsDone}/8 rituels</p><Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => setView("monarch")}>Ouvrir le Royaume →</Button></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><MoonStar className="size-4 text-emerald-500" /> Présence spirituelle</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-black">{today.prayersDone.length}/5</p><p className="text-xs text-muted-foreground">prières · {Object.values(data.spiritual.dailyCounts[today.date] ?? {}).reduce((sum, value) => sum + value, 0).toLocaleString("fr-FR")} récitations</p><Button variant="ghost" size="sm" className="mt-2 px-0" onClick={() => setView("spiritual")}>Ouvrir Misbaha →</Button></CardContent>
        </Card>
      </div>
      {focus.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-3">
          {focus.map((action) => {
            if (!action) return null;
            const checked = today.evolutionDone.includes(action.code);
            return <label key={action.code} className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3"><Checkbox checked={checked} onCheckedChange={() => modules.toggleEvolutionComplete(action.code, action.xp, action.domaine, action.frequence)} />{checked ? <CheckCircle2 className="size-4 shrink-0 text-emerald-500" /> : null}<span className={`text-xs font-medium ${checked ? "line-through opacity-60" : ""}`}>{action.action}</span></label>;
          })}
        </div>
      )}
    </section>
  );
}
