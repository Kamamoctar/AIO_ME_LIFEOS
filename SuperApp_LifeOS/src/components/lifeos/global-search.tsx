"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ViewId } from "@/lib/lifeos/constants";
import { useLifeOS } from "@/lib/lifeos/store";
import { useUnifiedModules } from "@/lib/modules/store";

export const LIFEOS_SEARCH_EVENT = "lifeos:open-search";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  kind: string;
  view: ViewId;
  keywords: string;
}

const SECTIONS: SearchItem[] = [
  ["today", "Aujourd’hui", "Priorités et actions du jour"],
  ["plan", "Planifier", "Vision, objectifs, projets et calendrier"],
  ["domains", "Domaines", "Tous les piliers de vie"],
  ["review", "Bilan", "Revue et progression"],
  ["evolution", "Évolution", "Actions et focus"],
  ["mk", "Système MK", "Priorité, idées et projets"],
  ["monarch", "Royaume", "Quêtes, XP et séries"],
  ["spiritual", "Misbaha", "Prières, zikr et intentions"],
  ["finances", "Finances", "Flux et budget"],
  ["calendar", "Calendrier", "Échéances transversales"],
  ["diagnostics", "Diagnostic", "Santé technique de LifeOS"],
  ["settings", "Paramètres", "Sécurité et sauvegardes"],
].map(([view, title, subtitle]) => ({
  id: `section:${view}`,
  view: view as ViewId,
  title,
  subtitle,
  kind: "Section",
  keywords: `${title} ${subtitle}`,
}));

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

export function GlobalSearch() {
  const state = useLifeOS((store) => store.state);
  const setView = useLifeOS((store) => store.setView);
  const modules = useUnifiedModules((store) => store.data);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const show = () => setOpen(true);
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(LIFEOS_SEARCH_EVENT, show);
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener(LIFEOS_SEARCH_EVENT, show);
      window.removeEventListener("keydown", keydown);
    };
  }, []);

  const items = useMemo<SearchItem[]>(() => {
    if (!state) return SECTIONS;
    return [
      ...SECTIONS,
      ...state.goals.map((goal) => ({ id: `goal:${goal.id}`, title: goal.title, subtitle: goal.status, kind: "Objectif", view: "goals" as const, keywords: `${goal.title} ${goal.description ?? ""} ${goal.area ?? ""}` })),
      ...state.projects.map((project) => ({ id: `project:${project.id}`, title: project.name, subtitle: project.status, kind: "Projet", view: "projects" as const, keywords: `${project.name} ${project.description ?? ""}` })),
      ...state.actions.map((action) => ({ id: `action:${action.id}`, title: action.title, subtitle: action.done ? "Terminée" : "À faire", kind: "Action", view: "calendar" as const, keywords: action.title })),
      ...modules.mk.ideas.map((idea) => ({ id: `idea:${idea.id}`, title: idea.title, subtitle: idea.status, kind: "Idée", view: "mk" as const, keywords: `${idea.title} ${idea.excitement}` })),
      ...modules.mk.projects.map((project) => ({ id: `mk-project:${project.id}`, title: project.name, subtitle: project.nextStep || project.state, kind: "Projet MK", view: "mk" as const, keywords: `${project.name} ${project.nextStep}` })),
      ...modules.spiritual.intentions.map((intention) => ({ id: `intention:${intention.id}`, title: intention.text, subtitle: intention.status, kind: "Intention", view: "spiritual" as const, keywords: intention.text })),
    ];
  }, [modules.mk.ideas, modules.mk.projects, modules.spiritual.intentions, state]);

  const results = useMemo(() => {
    const needle = normalize(deferredQuery.trim());
    if (!needle) return items.slice(0, 12);
    return items.filter((item) => normalize(`${item.title} ${item.subtitle} ${item.keywords}`).includes(needle)).slice(0, 20);
  }, [deferredQuery, items]);

  const select = (view: ViewId) => {
    setView(view);
    setOpen(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setQuery(""); }}>
      <DialogContent className="top-[max(12%,calc(env(safe-area-inset-top,0px)+4rem))] max-h-[75vh] translate-y-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-4 pb-3 pt-4">
          <DialogTitle className="flex items-center gap-2 text-base"><Search className="size-4" /> Recherche LifeOS</DialogTitle>
        </DialogHeader>
        <div className="px-4"><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Section, objectif, projet, idée, action…" aria-label="Rechercher dans LifeOS" /></div>
        <div className="max-h-[55vh] space-y-1 overflow-y-auto px-3 pb-4">
          {results.length ? results.map((item) => (
            <button key={item.id} onClick={() => select(item.view)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted">
              <Badge variant="outline" className="shrink-0 text-[9px]">{item.kind}</Badge>
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><span className="block truncate text-[11px] text-muted-foreground">{item.subtitle}</span></span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          )) : <p className="py-10 text-center text-sm text-muted-foreground">Aucun résultat.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
