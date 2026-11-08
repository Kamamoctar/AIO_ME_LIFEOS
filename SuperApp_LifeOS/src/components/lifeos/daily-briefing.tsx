"use client";

import { useMemo } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildDailyRecommendations } from "@/lib/lifeos/intelligence";
import { useLifeOS } from "@/lib/lifeos/store";
import { useUnifiedModules } from "@/lib/modules/store";

const CATEGORY_LABEL = {
  focus: "Focus",
  deadline: "Échéance",
  habit: "Habitude",
  spiritual: "Spirituel",
  finance: "Finances",
} as const;

export function DailyBriefing() {
  const state = useLifeOS((store) => store.state);
  const setView = useLifeOS((store) => store.setView);
  const modules = useUnifiedModules((store) => store.data);
  const recommendations = useMemo(
    () => state ? buildDailyRecommendations(state, modules) : [],
    [modules, state]
  );

  if (!state || !recommendations.length) return null;
  const first = recommendations[0];

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-primary" /> Briefing intelligent</CardTitle>
          <Badge variant="secondary">Local · privé</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <button onClick={() => setView(first.view)} className="flex w-full items-center gap-3 rounded-xl border bg-background/80 p-4 text-left transition hover:border-primary/50">
          <span className="min-w-0 flex-1"><span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Priorité recommandée</span><strong className="mt-1 block">{first.title}</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">{first.reason}</span></span>
          <ArrowRight className="size-5 shrink-0 text-primary" />
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          {recommendations.slice(1, 5).map((item) => (
            <button key={item.id} onClick={() => setView(item.view)} className="flex items-start gap-2 rounded-lg border p-3 text-left transition hover:bg-muted/50">
              <Badge variant="outline" className="mt-0.5 shrink-0 text-[9px]">{CATEGORY_LABEL[item.category]}</Badge>
              <span className="text-xs font-medium leading-5">{item.title}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
