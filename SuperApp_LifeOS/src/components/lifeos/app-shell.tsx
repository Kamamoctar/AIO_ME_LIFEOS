"use client";

// Life OS — Coquille applicative (navigation desktop + mobile)
import { useEffect } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import { PRIMARY_VIEWS, type ViewId } from "@/lib/lifeos/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/lifeos/theme-toggle";
import { QuickAddButton, QuickAddSheet } from "@/components/lifeos/quick-add";
import {
  Sun,
  Gauge,
  Telescope,
  Target,
  FolderKanban,
  Wallet,
  Landmark,
  TrendingUp,
  Scale,
  CircleHelp,
  FlaskConical,
  HeartPulse,
  GraduationCap,
  CalendarDays,
  Settings,
  MoreHorizontal,
  Compass,
  Sprout,
  Brain,
  Orbit,
  Crown,
  MoonStar,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { generateAlerts } from "@/lib/lifeos/engine";
import { AuthUserControl } from "@/components/auth/user-control";

const NAV: { id: ViewId; label: string; icon: typeof Sun; group: "main" | "more" }[] = [
  { id: "today", label: "Aujourd'hui", icon: Sun, group: "main" },
  { id: "evolution", label: "Évolution", icon: Sprout, group: "main" },
  { id: "mk", label: "Système MK", icon: Brain, group: "main" },
  { id: "destiny", label: "Mon Astre", icon: Orbit, group: "main" },
  { id: "monarch", label: "Royaume", icon: Crown, group: "main" },
  { id: "spiritual", label: "Misbaha", icon: MoonStar, group: "main" },
  { id: "cockpit", label: "Cockpit", icon: Gauge, group: "main" },
  { id: "vision", label: "Vision 2027–2035", icon: Telescope, group: "main" },
  { id: "goals", label: "Objectifs", icon: Target, group: "main" },
  { id: "projects", label: "Projets", icon: FolderKanban, group: "main" },
  { id: "finances", label: "Finances", icon: Wallet, group: "main" },
  { id: "accounts", label: "Comptes", icon: Landmark, group: "main" },
  { id: "investments", label: "Investissements", icon: TrendingUp, group: "more" },
  { id: "patrimoine", label: "Patrimoine", icon: Scale, group: "more" },
  { id: "decisions", label: "Décisions", icon: CircleHelp, group: "more" },
  { id: "simulations", label: "Simulations", icon: FlaskConical, group: "more" },
  { id: "health", label: "Santé", icon: HeartPulse, group: "more" },
  { id: "skills", label: "Compétences", icon: GraduationCap, group: "more" },
  { id: "calendar", label: "Calendrier", icon: CalendarDays, group: "more" },
  { id: "settings", label: "Paramètres", icon: Settings, group: "more" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, view, setView, refresh, loaded, loading } = useLifeOS();

  useEffect(() => {
    if (!loaded) void refresh();
  }, [loaded, refresh]);

  const alerts = state ? generateAlerts(state, new Date(state.today)) : [];
  const importantAlerts = alerts.filter((a) => a.severity !== "info").length;
  const availableNav = NAV.filter(
    (item) => !state?.couple || state.couple.permissions[item.id] !== "NONE"
  );

  useEffect(() => {
    if (state?.couple?.permissions[view] === "NONE") {
      setView(availableNav[0]?.id ?? "today");
    }
  }, [availableNav, setView, state?.couple?.permissions, view]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="brand-stripe" aria-hidden="true" />
      {/* ---------------------------------------------------------------- */}
      {/* Desktop : barre latérale */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-1">
        <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r bg-sidebar sticky top-0 h-screen">
          <div className="flex items-center gap-2.5 px-5 pt-6 pb-4">
            <div className="brand-mark flex size-9 items-center justify-center rounded-xl text-white shadow-sm">
              <Compass className="size-5" />
            </div>
            <div>
              <p className="font-bold leading-none tracking-tight">Life OS</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Ma vie en un seul système
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5" aria-label="Navigation principale">
            {availableNav.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors text-left",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.id === "cockpit" && importantAlerts > 0 && !active && (
                    <Badge className="ml-auto bg-red-500 hover:bg-red-500 text-[9px] px-1.5 min-w-5 flex justify-center">
                      {importantAlerts}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="border-t px-4 py-3 flex items-center gap-2">
            <AuthUserControl compact />
            <p className="text-[10px] text-muted-foreground">
              FCFA · {state?.settings.mode === "analyse" ? "Mode Analyse" : "Mode Simple"}
            </p>
            <ThemeToggle />
          </div>
        </aside>

        {/* -------------------------------------------------------------- */}
        {/* Contenu principal */}
        {/* -------------------------------------------------------------- */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* En-tête mobile */}
          <header className="lg:hidden sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center justify-between gap-2 px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="brand-mark flex size-8 items-center justify-center rounded-lg text-white shadow-sm shrink-0">
                  <Compass className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm leading-none">Life OS</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {NAV.find((n) => n.id === view)?.label}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {importantAlerts > 0 && (
                  <button
                    onClick={() => setView("cockpit")}
                    className="flex items-center justify-center size-8 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                    aria-label={`${importantAlerts} alertes`}
                  >
                    <span className="text-xs font-bold">{importantAlerts}</span>
                  </button>
                )}
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-5 pt-4 pb-28 lg:pb-10 lg:pt-6">
            {loading && !state ? (
              <LoadingScreen />
            ) : !state ? (
              <ErrorScreen onRetry={refresh} />
            ) : (
              children
            )}
          </main>

          <footer className="hidden lg:block mt-auto border-t">
            <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                LifeOS — organisation, évolution, finances et spiritualité · Données locales
              </span>
              <span>
                Réel · Budget · Prévision · Provision · Objectif · Projection · Simulation — jamais mélangés
              </span>
            </div>
          </footer>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile : navigation basse */}
      {/* ---------------------------------------------------------------- */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur safe-bottom"
        aria-label="Navigation mobile"
      >
        <div className="grid grid-cols-6">
          {availableNav.filter((n) => PRIMARY_VIEWS.includes(n.id)).map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-[18px]" />
                <span className="truncate max-w-full px-0.5">
                  {item.id === "vision" ? "Vision" : item.id === "today" ? "Jour" : item.label}
                </span>
              </button>
            );
          })}
          <MoreNav />
        </div>
      </nav>

      {/* Bouton flottant + saisie rapide */}
      <QuickAddButton />
      <QuickAddSheet />
    </div>
  );
}

function MoreNav() {
  const { view, setView, state } = useLifeOS();
  const more = NAV.filter(
    (item) =>
      !PRIMARY_VIEWS.includes(item.id) &&
      (!state?.couple || state.couple.permissions[item.id] !== "NONE")
  );
  const active = more.some((m) => m.id === view);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 text-[9px] font-medium transition-colors",
            active ? "text-primary" : "text-muted-foreground"
          )}
          aria-label="Plus de sections"
        >
          <MoreHorizontal className="size-[18px]" />
          <span>Plus</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="safe-bottom">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">Toutes les sections</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-1.5 px-4 pb-8">
          {more.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] font-medium text-left hover:bg-accent transition-colors"
              >
                <Icon className="size-4 text-primary shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LoadingScreen() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-sm font-medium text-red-600 dark:text-red-400">
        Impossible de charger tes données.
      </p>
      <Button onClick={onRetry} variant="outline" size="sm">
        Réessayer
      </Button>
    </div>
  );
}
