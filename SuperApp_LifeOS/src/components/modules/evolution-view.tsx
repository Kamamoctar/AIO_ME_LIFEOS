"use client";

import { useMemo, useState } from "react";
import { EVOLUTION_ACTIONS } from "@/data/evolution-actions";
import { getTodayEntry, useUnifiedModules } from "@/lib/modules/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Check, CirclePlus, Search, Sparkles, Target, X } from "lucide-react";

const DOMAIN_COLORS = ["bg-rose-500", "bg-sky-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500"];

export function EvolutionView() {
  const { data, toggleEvolutionAction, toggleEvolutionComplete } = useUnifiedModules();
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("Tous");
  const [message, setMessage] = useState("");
  const today = getTodayEntry(data);
  const active = data.evolution.activeActionCodes
    .map((code) => EVOLUTION_ACTIONS.find((action) => action.code === code))
    .filter(Boolean);
  const domains = useMemo(() => ["Tous", ...Array.from(new Set(EVOLUTION_ACTIONS.map((action) => action.domaine)))], []);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr");
    return EVOLUTION_ACTIONS.filter((action) => {
      const inDomain = domain === "Tous" || action.domaine === domain;
      const inQuery = !needle || [action.action, action.axe, action.sous_domaine, action.frequence]
        .some((value) => value.toLocaleLowerCase("fr").includes(needle));
      return inDomain && inQuery;
    });
  }, [domain, query]);

  const addFocus = (code: string) => {
    const result = toggleEvolutionAction(code);
    setMessage(result.ok ? "Focus mis à jour." : result.message);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Zone d’évolution</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold"><Sparkles className="size-6" /> Grandir sans se disperser</h1>
          <p className="mt-1 text-sm text-muted-foreground">141 actions réutilisées · trois focus maximum · progression par XP.</p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3 text-right shadow-sm">
          <p className="text-[11px] uppercase text-muted-foreground">XP Évolution</p>
          <p className="text-2xl font-black text-primary">{data.evolution.xp}</p>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base"><Target className="size-4 text-primary" /> Trio de focus</CardTitle>
            <Badge variant={active.length >= 3 ? "default" : "secondary"}>{active.length}/3</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Choisis jusqu’à trois actions dans le catalogue.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {active.map((action) => {
                if (!action) return null;
                const done = today.evolutionDone.includes(action.code);
                return (
                  <div key={action.code} className="rounded-xl border bg-background p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-[10px]">{action.frequence}</Badge>
                      <button onClick={() => addFocus(action.code)} aria-label="Retirer du focus" className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
                    </div>
                    <h2 className="mt-3 text-sm font-semibold leading-5">{action.action}</h2>
                    <p className="mt-2 text-xs text-muted-foreground">Petit pas : {action.minimum}</p>
                    <Button
                      className="mt-4 w-full"
                      size="sm"
                      variant={done ? "secondary" : "default"}
                      onClick={() => toggleEvolutionComplete(action.code, action.xp, action.domaine)}
                    >
                      <Check className="mr-1.5 size-4" /> {done ? "Accompli aujourd’hui" : `Valider · +${action.xp} XP`}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {message && <p className="mt-3 text-xs text-muted-foreground" role="status">{message}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Catalogue d’actions</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une action, un rythme…" className="pl-9" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 pt-2">
              {domains.map((item) => (
                <Button key={item} size="sm" variant={domain === item ? "default" : "outline"} className="shrink-0" onClick={() => setDomain(item)}>
                  {item === "Tous" ? item : item.split("/")[0].trim()}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.slice(0, 40).map((action) => {
              const selected = data.evolution.activeActionCodes.includes(action.code);
              return (
                <article key={action.code} className="flex items-start gap-3 rounded-xl border p-3">
                  <div className={`mt-1 size-2.5 shrink-0 rounded-full ${DOMAIN_COLORS[(Number(action.domain_num) - 1) % DOMAIN_COLORS.length]}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-1.5"><Badge variant="secondary" className="text-[9px]">{action.type}</Badge><Badge variant="outline" className="text-[9px]">{action.frequence}</Badge></div>
                    <h3 className="mt-2 text-sm font-semibold">{action.action}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{action.declencheur}</p>
                  </div>
                  <Button size="icon" variant={selected ? "secondary" : "outline"} onClick={() => addFocus(action.code)} aria-label={selected ? "Retirer" : "Ajouter au focus"}>
                    {selected ? <Check className="size-4" /> : <CirclePlus className="size-4" />}
                  </Button>
                </article>
              );
            })}
            {filtered.length > 40 && <p className="py-2 text-center text-xs text-muted-foreground">Affichage des 40 premiers résultats sur {filtered.length}. Affine la recherche.</p>}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle className="text-base">Progression par domaine</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {domains.slice(1).map((item) => {
              const xp = data.evolution.xpByDomain[item] ?? 0;
              const levelProgress = xp % 50;
              return (
                <div key={item}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-xs"><span className="truncate font-medium">{item.split("/")[0]}</span><span className="text-muted-foreground">Niv. {Math.floor(xp / 50) + 1}</span></div>
                  <Progress value={levelProgress * 2} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
