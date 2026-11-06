"use client";

// Life OS — Application racine (SPA)
import { useEffect } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import { AppShell } from "@/components/lifeos/app-shell";
import { TodayView } from "@/components/lifeos/today-view";
import { CockpitView } from "@/components/lifeos/cockpit-view";
import { VisionView } from "@/components/lifeos/vision-view";
import { GoalsView } from "@/components/lifeos/goals-view";
import { ProjectsView } from "@/components/lifeos/projects-view";
import { FinancesView } from "@/components/lifeos/finances-view";
import { AccountsView } from "@/components/lifeos/accounts-view";
import { InvestmentsView } from "@/components/lifeos/investments-view";
import { PatrimoineView } from "@/components/lifeos/patrimoine-view";
import { DecisionsView } from "@/components/lifeos/decisions-view";
import { SimulationsView } from "@/components/lifeos/simulations-view";
import { HealthView } from "@/components/lifeos/health-view";
import { SkillsView } from "@/components/lifeos/skills-view";
import { CalendarView } from "@/components/lifeos/calendar-view";
import { SettingsView } from "@/components/lifeos/settings-view";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { EvolutionView } from "@/components/modules/evolution-view";
import { MkView } from "@/components/modules/mk-view";
import { DestinyView } from "@/components/modules/destiny-view";
import { MonarchView } from "@/components/modules/monarch-view";
import { SpiritualView } from "@/components/modules/spiritual-view";
import { useUnifiedModules } from "@/lib/modules/store";
import { DomainsHub, PlanningHub, ReviewHub } from "@/components/lifeos/life-hubs";

export function LifeOSApp() {
  const { state, view, error, setView, setQuickAddOpen } = useLifeOS();
  const { toast } = useToast();
  const hydrateModules = useUnifiedModules((store) => store.hydrate);

  useEffect(() => {
    hydrateModules();
  }, [hydrateModules]);

  // En développement local, un ancien cache PWA peut masquer les changements
  // de l'interface. On le désactive ; il reste actif dans les builds production.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister()))
        )
        .then(() =>
          "caches" in window
            ? caches
                .keys()
                .then((keys) =>
                  Promise.all(
                    keys
                      .filter((key) => key.startsWith("lifeos-"))
                      .map((key) => caches.delete(key))
                  )
                )
            : undefined
        )
        .catch(() => {
          /* silencieux : le mode local reste utilisable sans CacheStorage */
        });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* silencieux : la PWA reste utilisable */
    });
  }, []);

  // Raccourcis PWA : /?view=... et /?quickadd=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v) setView(v as never);
    if (params.get("quickadd")) setQuickAddOpen(true);
  }, [setView, setQuickAddOpen]);

  useEffect(() => {
    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;
    void Promise.all([import("@capacitor/core"), import("@capacitor/local-notifications")]).then(
      async ([{ Capacitor }, { LocalNotifications }]) => {
        if (disposed || !Capacitor.isNativePlatform()) return;
        const handle = await LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
          const target = action.notification.extra?.lifeosView;
          if (typeof target === "string") setView(target as never);
        });
        removeListener = () => handle.remove();
      }
    ).catch(() => undefined);
    return () => {
      disposed = true;
      void removeListener?.();
    };
  }, [setView]);

  // Messages d'erreur globaux
  useEffect(() => {
    if (error) {
      toast({ title: "Erreur", description: error, variant: "destructive" });
    }
  }, [error, toast]);

  // Rendu des vues uniquement si l'état est chargé
  const views: Record<string, React.ReactNode> = {
    today: <TodayView />,
    plan: <PlanningHub />,
    domains: <DomainsHub />,
    review: <ReviewHub />,
    evolution: <EvolutionView />,
    mk: <MkView />,
    destiny: <DestinyView />,
    monarch: <MonarchView />,
    spiritual: <SpiritualView />,
    cockpit: <CockpitView />,
    vision: <VisionView />,
    goals: <GoalsView />,
    projects: <ProjectsView />,
    finances: <FinancesView />,
    accounts: <AccountsView />,
    investments: <InvestmentsView />,
    patrimoine: <PatrimoineView />,
    decisions: <DecisionsView />,
    simulations: <SimulationsView />,
    health: <HealthView />,
    skills: <SkillsView />,
    calendar: <CalendarView />,
    settings: <SettingsView />,
  };

  return (
    <AppShell>
      {state ? views[view] : null}
      <Toaster />
    </AppShell>
  );
}
