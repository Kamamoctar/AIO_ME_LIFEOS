"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarClock, Check, ClipboardCheck, LayoutGrid, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const ONBOARDING_KEY = "lifeos_onboarding_v1";
export const LIFEOS_ONBOARDING_EVENT = "lifeos:show-onboarding";

interface OnboardingStep {
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
}

const STEPS: OnboardingStep[] = [
  {
    title: "Ta journée en un regard",
    description: "Jour rassemble la priorité, les quêtes, les prières et les actions essentielles.",
    detail: "Commence ici chaque matin et valide uniquement ce que tu as réellement accompli.",
    icon: Sun,
  },
  {
    title: "Du cap à l’action",
    description: "Planifier relie ta vision, tes objectifs, tes projets et ton calendrier.",
    detail: "Chaque projet doit toujours avoir une prochaine action concrète.",
    icon: CalendarClock,
  },
  {
    title: "Tous tes domaines",
    description: "Domaines ouvre Évolution, Royaume, Misbaha, Finances, Santé et Compétences.",
    detail: "Les modules restent spécialisés mais partagent désormais le même noyau de données.",
    icon: LayoutGrid,
  },
  {
    title: "Apprendre et ajuster",
    description: "Bilan consolide ton score du jour, tes XP et ton journal d’activité.",
    detail: "Fais une revue courte chaque semaine et sauvegarde après les changements importants.",
    icon: ClipboardCheck,
  },
];

export function LifeOSOnboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        setOpen(window.localStorage.getItem(ONBOARDING_KEY) !== "done");
      } catch {
        setOpen(true);
      }
    });
    const show = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(LIFEOS_ONBOARDING_EVENT, show);
    return () => {
      active = false;
      window.removeEventListener(LIFEOS_ONBOARDING_EVENT, show);
    };
  }, []);

  const finish = () => {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, "done");
    } catch {
      // L'onboarding reste fermable même si le stockage est indisponible.
    }
    setOpen(false);
  };

  if (!open) return null;
  const current = STEPS[step];
  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  return (
    <div className="safe-screen fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="lifeos-onboarding-title">
      <div className="safe-top-offset safe-bottom w-full max-w-lg rounded-3xl border bg-background p-5 shadow-2xl sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary"><Sparkles className="size-5" /><span className="text-xs font-semibold uppercase tracking-[.18em]">Bienvenue dans LifeOS</span></div>
          <span className="text-xs text-muted-foreground">{step + 1}/{STEPS.length}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-4 h-1.5" />

        <div className="py-10 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary"><Icon className="size-9" /></div>
          <h2 id="lifeos-onboarding-title" className="mt-6 text-2xl font-black">{current.title}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{current.description}</p>
          <p className="mx-auto mt-4 max-w-md rounded-xl border bg-muted/40 p-3 text-xs leading-5">{current.detail}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={finish}>Passer</Button>
          <div className="flex gap-2">
            {step > 0 ? <Button variant="outline" onClick={() => setStep((value) => value - 1)}>Retour</Button> : null}
            <Button onClick={() => last ? finish() : setStep((value) => value + 1)}>
              {last ? <><Check className="mr-1.5 size-4" /> Commencer</> : "Suivant"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
