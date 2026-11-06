"use client";

// Life OS — Cockpit : vue centrale de pilotage
import { useMemo } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import {
  Kpi,
  SectionCard,
  AlertCard,
  ExplainDialog,
  ExplainLine,
  ProgressStat,
  EmptyState,
} from "@/components/lifeos/ui-bits";
import {
  computeAvailableCash,
  computeBrvmStats,
  computeCapacity,
  computeEmergencyFund,
  computeNetWorth,
  computePriorities,
  essentialMonthlyExpenses,
  generateAlerts,
  goalsFeasibility,
  householdExpenseBreakdown,
  monthlySeries,
  nonSalaryCoverage,
  projectFunding,
} from "@/lib/lifeos/engine";
import { formatFCFA, formatPercent } from "@/lib/lifeos/format";
import {
  Gauge,
  Wallet,
  TrendingDown,
  PiggyBank,
  TrendingUp,
  Scale,
  Landmark,
  ShieldCheck,
  Flag,
  Bell,
  Activity,
  CalendarClock,
  ArrowLeftRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import type { LifeOSState } from "@/lib/lifeos/types";

export function CockpitView() {
  const { state, setView } = useLifeOS();
  if (!state) return null;
  return <CockpitInner state={state} />;
}

function CockpitInner({ state }: { state: LifeOSState }) {
  const { setView } = useLifeOS();
  const today = new Date(state.today);

  const capacity = useMemo(() => computeCapacity(state, today), [state, today]);
  const netWorth = useMemo(() => computeNetWorth(state), [state]);
  const brvm = useMemo(() => computeBrvmStats(state.positions), [state.positions]);
  const ef = useMemo(() => computeEmergencyFund(state, today), [state, today]);
  const alerts = useMemo(() => generateAlerts(state, today), [state, today]);
  const priorities = useMemo(() => computePriorities(state, today), [state, today]);
  const feasibility = useMemo(() => goalsFeasibility(state, today), [state, today]);
  const coverage = useMemo(() => nonSalaryCoverage(state, today), [state, today]);
  const series = useMemo(() => monthlySeries(state.transactions, 6, today), [state.transactions, today]);
  const essentials = useMemo(() => essentialMonthlyExpenses(state, today), [state, today]);
  const availableCash = useMemo(() => computeAvailableCash(state), [state]);
  const expenseBreakdown = useMemo(
    () =>
      householdExpenseBreakdown(
        state.transactions,
        today.getFullYear(),
        today.getMonth() + 1
      ),
    [state.transactions, today]
  );
  const liquidCash = useMemo(
    () =>
      availableCash.accounts
        .filter((line) =>
          state.accounts.some(
            (account) =>
              account.id === line.accountId &&
              ["CASH", "MOBILE_MONEY", "BANK", "SAVINGS"].includes(account.type)
          )
        )
        .reduce((sum, line) => sum + line.available, 0),
    [state.accounts, availableCash]
  );

  // Projets sous-financés
  const underfundedProjects = useMemo(
    () =>
      state.projects
        .filter((p) => !p.archived && p.budget !== null && p.budget > 0)
        .map((p) => ({
          p,
          f: projectFunding(p, state.transactions, state.fundAllocations),
        }))
        .filter(({ p, f }) => f.remainingToFund > 0 && f.financialProgress < 0.5)
        .sort((a, b) => b.f.remainingToFund - a.f.remainingToFund),
    [state]
  );

  // Échéances proches (60 jours)
  const upcoming = useMemo(() => {
    const items: { title: string; date: Date; days: number; kind: string; view: string }[] = [];
    for (const g of state.goals) {
      if (!g.targetDate || ["TERMINE", "ANNULE", "REPORTE"].includes(g.status)) continue;
      const d = new Date(g.targetDate);
      const days = Math.round((d.getTime() - today.getTime()) / 86400000);
      if (days >= 0 && days <= 60)
        items.push({ title: g.title, date: d, days, kind: "Objectif", view: "goals" });
    }
    for (const p of state.projects) {
      if (p.archived || !p.targetDate) continue;
      const d = new Date(p.targetDate);
      const days = Math.round((d.getTime() - today.getTime()) / 86400000);
      if (days >= 0 && days <= 60)
        items.push({ title: p.name, date: d, days, kind: "Projet", view: "projects" });
    }
    for (const c of state.charges) {
      if (!c.active || !c.nextDueDate) continue;
      const d = new Date(c.nextDueDate);
      const days = Math.round((d.getTime() - today.getTime()) / 86400000);
      if (days >= 0 && days <= 60)
        items.push({ title: c.label, date: d, days, kind: "Charge", view: "finances" });
    }
    return items.sort((a, b) => a.days - b.days);
  }, [state, today]);

  const lateGoals = state.goals.filter((g) => g.status === "EN_RETARD");
  const openActions = state.actions.filter((a) => !a.done).slice(0, 5);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Gauge className="size-5 text-primary" />
          Cockpit
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Où j&apos;en suis · combien je possède · où va mon argent · que prioriser
        </p>
      </div>

      {/* KPI principaux */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi
          label="Revenus attendus / mois"
          value={formatFCFA(capacity.expectedMonthlyIncome)}
          icon={<Wallet className="size-4" />}
          hint={`Salaire ${formatFCFA(capacity.salary)}`}
          explain={
            <>
              <ExplainLine label="Salaire" value={formatFCFA(capacity.salary)} kind="in" />
              <ExplainLine
                label="Revenus complémentaires (moy. 3 mois)"
                value={formatFCFA(capacity.otherRecurringIncome)}
                kind="in"
              />
              <ExplainLine label="Total attendu" value={formatFCFA(capacity.expectedMonthlyIncome)} kind="total" />
            </>
          }
        />
        <Kpi
          label="Dépenses essentielles / mois"
          value={formatFCFA(capacity.essentialExpenses)}
          icon={<TrendingDown className="size-4" />}
          tone="negative"
          hint="Charges actives + catégories essentielles"
          explain={
            <>
              {essentials.items.map((it) => (
                <ExplainLine key={it.label} label={it.label} value={formatFCFA(it.amount)} kind="out" />
              ))}
              <ExplainLine label="Total essentiel" value={formatFCFA(essentials.total)} kind="total" />
            </>
          }
        />
        <Kpi
          label="Capacité d'épargne / mois"
          value={formatFCFA(capacity.savingsCapacity)}
          icon={<PiggyBank className="size-4" />}
          tone="accent"
          hint="Après essentiels, provisions et marge"
          explain={
            <>
              {capacity.steps.map((s, i) => (
                <ExplainLine
                  key={i}
                  label={s.label}
                  value={formatFCFA(Math.abs(s.value))}
                  kind={s.label.startsWith("=") ? "total" : s.kind}
                />
              ))}
            </>
          }
        />
        <Kpi
          label="Capacité d'investissement / mois"
          value={formatFCFA(capacity.investmentCapacity)}
          icon={<TrendingUp className="size-4" />}
          tone="positive"
          hint="Sans compromettre essentiel, fonds, projets"
          explain={
            <>
              <ExplainLine label="Capacité d'épargne" value={formatFCFA(capacity.savingsCapacity)} kind="in" />
              <ExplainLine label="− Contribution fonds d'urgence" value={formatFCFA(capacity.emergencyFundContribution)} kind="out" />
              <ExplainLine label="− Allocation projets prioritaires" value={formatFCFA(capacity.projectAllocation)} kind="out" />
              <ExplainLine label="= Capacité d'investissement" value={formatFCFA(capacity.investmentCapacity)} kind="total" />
            </>
          }
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi
          label="Liquidités disponibles"
          value={formatFCFA(liquidCash)}
          icon={<Landmark className="size-4" />}
          hint={`${formatFCFA(availableCash.totalReserved)} réservés · épargne incluse`}
        />
        <Kpi
          label="Patrimoine net"
          value={formatFCFA(netWorth.netWorth)}
          icon={<Scale className="size-4" />}
          tone="accent"
          hint="Actifs − passifs"
          explain={
            <>
              <ExplainLine label="Cash (tous comptes)" value={formatFCFA(netWorth.cash)} kind="in" />
              <ExplainLine label="BRVM" value={formatFCFA(netWorth.brvm)} kind="in" />
              <ExplainLine label="Copy trading" value={formatFCFA(netWorth.copyTrading)} kind="in" />
              <ExplainLine label="Autres investissements" value={formatFCFA(netWorth.otherInvestments)} kind="in" />
              <ExplainLine label="Business" value={formatFCFA(netWorth.businesses)} kind="in" />
              <ExplainLine label="Actifs physiques" value={formatFCFA(netWorth.manualAssets)} kind="in" />
              <ExplainLine label="− Dettes et engagements" value={formatFCFA(netWorth.liabilities)} kind="out" />
              <ExplainLine label="= Patrimoine net" value={formatFCFA(netWorth.netWorth)} kind="total" />
            </>
          }
        />
        <Kpi
          label="Capital BRVM"
          value={formatFCFA(brvm.totalValue)}
          icon={<TrendingUp className="size-4" />}
          hint={
            brvm.totalCost > 0
              ? `Perf. totale ${formatPercent(brvm.totalPerformance, 1)}`
              : "Portefeuille réel"
          }
          onClick={() => setView("investments")}
        />
        <Kpi
          label="Fonds d'urgence"
          value={formatFCFA(ef.available)}
          icon={<ShieldCheck className="size-4" />}
          tone={ef.missing === 0 ? "positive" : "warning"}
          hint={`Cible : ${formatFCFA(ef.target)} (${ef.months} mois)`}
          explain={
            <>
              <ExplainLine
                label={`Dépenses essentielles mensuelles × ${ef.months}`}
                value={formatFCFA(ef.essentialMonthly)}
              />
              <ExplainLine label="= Cible du fonds" value={formatFCFA(ef.target)} kind="total" />
              <ExplainLine label="Disponible (comptes Épargne)" value={formatFCFA(ef.available)} kind="in" />
              <ExplainLine label="Manque" value={formatFCFA(ef.missing)} kind="out" />
            </>
          }
        />
      </div>

      <SectionCard
        title="Dépenses du foyer ce mois"
        description={`Total payé : ${formatFCFA(expenseBreakdown.total)} · frais inclus`}
        icon={<TrendingDown className="size-4" />}
      >
        {expenseBreakdown.total === 0 ? (
          <EmptyState
            title="Aucune dépense ce mois"
            description="La répartition apparaîtra dès qu'une dépense sera enregistrée."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <ExpenseBreakdownList
              title="Par catégorie"
              rows={expenseBreakdown.byCategory}
            />
            <ExpenseBreakdownList
              title="Par membre"
              rows={expenseBreakdown.byMember}
            />
          </div>
        )}
      </SectionCard>

      {/* Alertes */}
      <SectionCard
        title="Mes alertes"
        description={`${alerts.length} alerte${alerts.length > 1 ? "s" : ""} — toutes explicables`}
        icon={<Bell className="size-4" />}
      >
        {alerts.length === 0 ? (
          <EmptyState
            icon={<Bell className="size-6" />}
            title="Aucune alerte"
            description="Rien d'inquiétant détecté dans tes données réelles."
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 max-h-80 overflow-y-auto pr-1">
            {alerts.map((a) => (
              <AlertCard
                key={a.id}
                severity={a.severity}
                title={a.title}
                detail={a.detail}
                action={
                  a.action ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] shrink-0"
                      onClick={() => setView(a.action!.view as never)}
                    >
                      {a.action.label}
                    </Button>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Priorités */}
        <SectionCard
          title="Mes 3 à 5 priorités"
          description="Ordre suggéré par le moteur — tu gardes toujours le contrôle"
          icon={<Flag className="size-4" />}
        >
          {priorities.length === 0 ? (
            <EmptyState title="Pas encore de priorités" />
          ) : (
            <ol className="space-y-2">
              {priorities.map((p, i) => (
                <li key={p.id} className="flex items-start gap-2.5 rounded-lg border bg-card p-2.5">
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

        {/* Faisabilité des objectifs */}
        <SectionCard
          title="Faisabilité de mes objectifs"
          description="Le système détecte les incompatibilités"
          icon={<Activity className="size-4" />}
        >
          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Budget total des objectifs</p>
              <p className="font-bold tabular-nums">{formatFCFA(feasibility.totalBudget)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Reste à financer</p>
              <p className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {formatFCFA(feasibility.remaining)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Besoin mensuel</p>
              <p className="font-bold tabular-nums">{formatFCFA(feasibility.monthlyNeed)}/mois</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Capacité actuelle</p>
              <p className="font-bold tabular-nums text-primary">
                {formatFCFA(feasibility.savingsCapacity)}/mois
              </p>
            </div>
          </div>
          <div
            className={`rounded-lg p-3 text-sm font-semibold ${
              feasibility.verdict === "REALISABLE"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : feasibility.verdict === "SOUS_TENSION"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {feasibility.verdictLabel}
            {feasibility.extraMonthlyIncomeNeeded > 0 && (
              <span className="block text-xs font-normal mt-1">
                Il manque {formatFCFA(feasibility.extraMonthlyIncomeNeeded)}/mois : augmente tes revenus,
                réduis les budgets ou reporte certaines échéances.
              </span>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Revenus vs dépenses (6 mois) */}
      <SectionCard
        title="Revenus vs dépenses (6 derniers mois)"
        description="Données réelles uniquement — les transferts sont exclus"
        icon={<ArrowLeftRight className="size-4" />}
      >
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
              />
              <Tooltip
                formatter={(v: number) => formatFCFA(v)}
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 12,
                  border: "1px solid var(--border)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" name="Revenus" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Dépenses" fill="var(--color-chart-5)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Projets sous-financés */}
        <SectionCard
          title="Projets sous-financés"
          description="Financement < 50 % du budget"
          icon={<TrendingDown className="size-4" />}
          action={
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView("projects")}>
              Projets
            </Button>
          }
        >
          {underfundedProjects.length === 0 ? (
            <EmptyState title="Aucun projet sous-financé" />
          ) : (
            <div className="space-y-3">
              {underfundedProjects.slice(0, 5).map(({ p, f }) => (
                <ProgressStat
                  key={p.id}
                  label={`${p.name} — reste ${formatFCFA(f.remainingToFund)}`}
                  value={f.funded}
                  max={p.budget ?? 0}
                  tone="warning"
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Échéances proches */}
        <SectionCard
          title="Échéances proches (60 jours)"
          icon={<CalendarClock className="size-4" />}
        >
          {upcoming.length === 0 ? (
            <EmptyState title="Aucune échéance dans les 60 jours" />
          ) : (
            <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {upcoming.slice(0, 8).map((u, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{u.title}</p>
                    <p className="text-[11px] text-muted-foreground">{u.kind}</p>
                  </div>
                  <span
                    className={`text-xs font-bold tabular-nums shrink-0 ${
                      u.days <= 7 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                    }`}
                  >
                    J{u.days >= 0 ? "+" : ""}
                    {u.days}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Objectifs en retard */}
        <SectionCard title={`Objectifs en retard (${lateGoals.length})`} icon={<Flag className="size-4" />}>
          {lateGoals.length === 0 ? (
            <EmptyState title="Aucun objectif en retard" />
          ) : (
            <ul className="space-y-1.5">
              {lateGoals.map((g) => (
                <li key={g.id} className="rounded-lg border border-l-4 border-l-red-500 bg-card px-3 py-2">
                  <p className="text-[13px] font-medium">{g.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {g.targetDate ? `Échéance : ${new Date(g.targetDate).toLocaleDateString("fr-FR")}` : "Sans échéance"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Prochaines actions */}
        <SectionCard title="Mes prochaines actions" icon={<Activity className="size-4" />}>
          {openActions.length === 0 ? (
            <EmptyState title="Aucune action en attente" />
          ) : (
            <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {openActions.map((a) => (
                <li key={a.id} className="rounded-lg border bg-card px-3 py-2 text-[13px] font-medium">
                  {a.title}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Diversification des revenus */}
      <SectionCard
        title="Diversification des revenus"
        description="Indicateur de couverture des charges par les revenus non salariaux"
        icon={<Activity className="size-4" />}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <ProgressStat
              label="Revenus non salariaux / dépenses essentielles"
              value={coverage.nonSalaryIncome3mAvg}
              max={Math.max(coverage.essentialExpenses, 1)}
              tone={coverage.ratio >= 0.5 ? "success" : coverage.ratio > 0 ? "warning" : "default"}
              format={formatFCFA}
            />
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold tabular-nums text-primary">{formatPercent(coverage.ratio)}</p>
            <p className="text-[10px] text-muted-foreground">couverture</p>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Objectif : suivre progressivement ta dépendance au salaire. Moyenne des revenus hors salaire sur 3 mois ({formatFCFA(coverage.nonSalaryIncome3mAvg)}) rapportée aux dépenses essentielles ({formatFCFA(coverage.essentialExpenses)}).
        </p>
      </SectionCard>
    </div>
  );
}

function ExpenseBreakdownList({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; amount: number; percentage: number }[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-3">
        {rows.slice(0, 6).map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-medium">{row.label}</span>
              <span className="shrink-0 tabular-nums">
                {formatFCFA(row.amount)} · {formatPercent(row.percentage, 0)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(2, row.percentage * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
