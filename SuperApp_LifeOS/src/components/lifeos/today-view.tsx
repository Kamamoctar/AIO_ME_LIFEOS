"use client";

// Life OS — Page « Aujourd'hui » : point d'entrée quotidien
import { useMemo } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import {
  Kpi,
  SectionCard,
  ProgressStat,
  AlertCard,
  ExplainDialog,
  ExplainLine,
  EmptyState,
} from "@/components/lifeos/ui-bits";
import {
  computeAvailableCash,
  computeCapacity,
  computePriorities,
  goalFunding,
  generateAlerts,
  monthlySummary,
  projectEndOfMonth,
} from "@/lib/lifeos/engine";
import {
  formatFCFA,
  formatDateLongFR,
  formatDateFR,
  monthKey,
} from "@/lib/lifeos/format";
import { MONTHS_FR } from "@/lib/lifeos/constants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sun,
  Wallet,
  TrendingDown,
  PiggyBank,
  TrendingUp,
  CalendarClock,
  CheckCircle2,
  ListTodo,
  Flag,
  Bell,
} from "lucide-react";
import { AlertTriangle } from "lucide-react";
import type { LifeOSState } from "@/lib/lifeos/types";
import { UnifiedTodayPanel } from "@/components/modules/unified-today-panel";

export function TodayView() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <TodayInner state={state} />;
}

function TodayInner({ state }: { state: LifeOSState }) {
  const { setView, mutate } = useLifeOS();
  const today = new Date(state.today);

  const summary = useMemo(
    () => monthlySummary(state.transactions, today.getFullYear(), today.getMonth() + 1),
    [state.transactions, today]
  );
  const cash = useMemo(() => computeAvailableCash(state), [state]);
  const priorities = useMemo(() => computePriorities(state, today), [state, today]);
  const alerts = useMemo(() => generateAlerts(state, today), [state, today]);
  const capacity = useMemo(() => computeCapacity(state, today), [state, today]);
  const projection = useMemo(() => projectEndOfMonth(state, today), [state, today]);

  // Actions du jour (non terminées, les plus récentes d'abord)
  const openActions = state.actions.filter((a) => !a.done).slice(0, 6);
  const doneToday = state.actions.filter(
    (a) => a.done && a.dueDate && monthKey(new Date(a.dueDate)) === monthKey(today)
  );

  // Prochaine grande échéance : objectif/projet avec date la plus proche dans le futur
  const nextDeadline = useMemo(() => {
    const items: { title: string; date: Date; kind: string; view: string }[] = [];
    for (const g of state.goals) {
      if (["TERMINE", "ANNULE", "REPORTE"].includes(g.status) || !g.targetDate) continue;
      items.push({ title: g.title, date: new Date(g.targetDate), kind: "Objectif", view: "goals" });
    }
    for (const p of state.projects) {
      if (p.archived || !p.targetDate) continue;
      items.push({ title: p.name, date: new Date(p.targetDate), kind: "Projet", view: "projects" });
    }
    const future = items.filter((i) => i.date >= today).sort((a, b) => a.date.getTime() - b.date.getTime());
    return future[0] ?? null;
  }, [state, today]);

  const activeGoals = state.goals
    .filter(
      (g) =>
        !g.isSuggested &&
        !["TERMINE", "ANNULE", "REPORTE"].includes(g.status)
    )
    .slice(0, 4);

  const monthName = `${MONTHS_FR[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Sun className="size-5 text-amber-500" />
            Aujourd&apos;hui
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDateLongFR(state.today)} · {monthName}
          </p>
        </div>
      </div>

      <UnifiedTodayPanel />

      {/* Argent du mois */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi
          label="Argent disponible (tous comptes)"
          value={formatFCFA(cash.totalAvailable)}
          icon={<Wallet className="size-4" />}
          hint="Solde réel calculé"
          explain={
            <>
              {state.accounts
                .filter((a) => !a.archived)
                .map((a) => (
                  <ExplainLine
                    key={a.id}
                    label={`${a.name} : solde ${formatFCFA(
                      cash.accounts.find((line) => line.accountId === a.id)?.balance ?? 0
                    )} − réserves ${formatFCFA(
                      cash.accounts.find((line) => line.accountId === a.id)?.reserved ?? 0
                    )}`}
                    value={formatFCFA(
                      cash.accounts.find((line) => line.accountId === a.id)?.available ?? 0
                    )}
                  />
                ))}
              <ExplainLine
                label="Total réellement disponible"
                value={formatFCFA(cash.totalAvailable)}
                kind="total"
              />
            </>
          }
        />
        <Kpi
          label="Dépensé ce mois"
          value={formatFCFA(summary.expenses)}
          icon={<TrendingDown className="size-4" />}
          tone="negative"
          hint={`dont ${formatFCFA(summary.donations)} de dons`}
        />
        <Kpi
          label="Épargné ce mois"
          value={formatFCFA(summary.netSavings)}
          icon={<PiggyBank className="size-4" />}
          tone={summary.netSavings >= 0 ? "positive" : "negative"}
          hint="Revenus − dépenses"
        />
        <Kpi
          label="Investi ce mois"
          value={formatFCFA(summary.invested)}
          icon={<TrendingUp className="size-4" />}
          tone="accent"
          hint="Cash → actifs (patrimoine intact)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Priorités */}
        <SectionCard
          title="Mes 3 priorités"
          description="Proposé par le moteur de priorité — tu gardes le contrôle"
          icon={<Flag className="size-4" />}
        >
          {priorities.length === 0 ? (
            <EmptyState title="Aucune priorité détectée" description="Ajoute des objectifs pour guider le moteur." />
          ) : (
            <ol className="space-y-2">
              {priorities.slice(0, 3).map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-start gap-2.5 rounded-lg border bg-card p-2.5"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <button
                      className="text-[13px] font-medium text-left hover:underline"
                      onClick={() => setView(p.view as never)}
                    >
                      {p.title}
                    </button>
                    <p className="text-[11px] text-muted-foreground leading-snug">{p.reason}</p>
                  </div>
                  {p.amount !== null && p.amount > 0 && (
                    <span className="text-[11px] font-semibold tabular-nums shrink-0">
                      {formatFCFA(p.amount)}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </SectionCard>

        {/* Actions */}
        <SectionCard
          title="Mes actions"
          description={`${openActions.length} en cours · ${doneToday.length} terminée${doneToday.length > 1 ? "s" : ""}`}
          icon={<ListTodo className="size-4" />}
          action={
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView("calendar")}>
              Tout voir
            </Button>
          }
        >
          {openActions.length === 0 ? (
            <EmptyState
              title="Rien à faire pour l'instant"
              description="Ajoute des actions depuis le calendrier ou les objectifs."
            />
          ) : (
            <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {openActions.map((a) => (
                <li key={a.id} className="flex items-start gap-2.5 rounded-lg border bg-card p-2.5">
                  <Checkbox
                    id={`act-${a.id}`}
                    checked={a.done}
                    onCheckedChange={() => mutate("action", "update", a.id, { done: true })}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`act-${a.id}`} className="text-[13px] font-medium leading-snug cursor-pointer">
                      {a.title}
                    </label>
                    {a.dueDate && (
                      <p className="text-[11px] text-muted-foreground">
                        Échéance : {formatDateFR(a.dueDate)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <SectionCard
          title="Mes alertes"
          description="Basées uniquement sur tes données réelles"
          icon={<Bell className="size-4" />}
          action={
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView("cockpit")}>
              Cockpit
            </Button>
          }
        >
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {alerts.slice(0, 4).map((a) => (
              <AlertCard key={a.id} severity={a.severity} title={a.title} detail={a.detail} />
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Objectifs */}
        <SectionCard
          title="Objectifs — progression"
          icon={<Flag className="size-4" />}
          action={
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView("goals")}>
              Tous les objectifs
            </Button>
          }
        >
          {activeGoals.length === 0 ? (
            <EmptyState title="Aucun objectif actif" />
          ) : (
            <div className="space-y-3">
              {activeGoals.map((g) => (
                <ProgressStat
                  key={g.id}
                  label={g.title}
                  value={goalFunding(g, state.fundAllocations)}
                  max={g.budget ?? 0}
                  tone={g.status === "EN_RETARD" ? "danger" : "default"}
                />
              ))}
              <p className="text-[10px] text-muted-foreground">
                Objectifs sans budget : {state.goals.filter((g) => g.budget === null && !g.isSuggested).length} (à estimer)
              </p>
            </div>
          )}
        </SectionCard>

        {/* Prochaine grande échéance + projection */}
        <div className="space-y-4">
          <SectionCard
            title="Prochaine grande échéance"
            icon={<CalendarClock className="size-4" />}
          >
            {nextDeadline ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{nextDeadline.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {nextDeadline.kind} · {formatDateLongFR(nextDeadline.date.toISOString())}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setView(nextDeadline.view as never)}>
                  Voir
                </Button>
              </div>
            ) : (
              <EmptyState title="Aucune échéance future" />
            )}
          </SectionCard>

          <SectionCard
            title="Projection fin de mois"
            description={`Réalisé vs projection — ${projection.daysElapsed}/${projection.daysInMonth} jours`}
            icon={<TrendingUp className="size-4" />}
          >
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Dépenses réalisées</p>
                <p className="font-bold tabular-nums">{formatFCFA(projection.expensesToDate)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Dépenses projetées</p>
                <p className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {formatFCFA(projection.projectedExpenses)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Épargne projetée</p>
                <p
                  className={`font-bold tabular-nums ${
                    projection.projectedSavings >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatFCFA(projection.projectedSavings)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Rythme quotidien</p>
                <p className="font-bold tabular-nums">{formatFCFA(projection.dailyBurn)}/j</p>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground leading-snug">
              Hypothèses : {projection.assumptions[0]}.
            </p>
          </SectionCard>
        </div>
      </div>

      {/* Rappel marge de manœuvre */}
      <SectionCard
        title="Ma marge de manœuvre (capacité mensuelle)"
        description="Revenus − essentiels − provisions − marge de sécurité"
        icon={<AlertTriangle className="size-4" />}
        action={
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView("cockpit")}>
            Détail
          </Button>
        }
      >
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-[11px] text-muted-foreground">Capacité d&apos;épargne</p>
            <p className="font-bold tabular-nums text-primary">{formatFCFA(capacity.savingsCapacity)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">dont fonds d&apos;urgence</p>
            <p className="font-bold tabular-nums">{formatFCFA(capacity.emergencyFundContribution)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Capacité d&apos;investissement</p>
            <p className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatFCFA(capacity.investmentCapacity)}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
