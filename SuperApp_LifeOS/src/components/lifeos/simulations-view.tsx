"use client";

// Life OS — Simulations : investissement général, changement de revenu, arbitrage
import { useMemo, useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import type { LifeOSState } from "@/lib/lifeos/types";
import { SectionCard, Kpi, Field, MoneyInput } from "@/components/lifeos/ui-bits";
import { formatFCFA, formatPercent } from "@/lib/lifeos/format";
import { DISCLAIMER_SIMULATION, MONTHS_FR_SHORT } from "@/lib/lifeos/constants";
import {
  computeCapacity,
  goalFunding,
  monthlySummary,
  projectFunding,
} from "@/lib/lifeos/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlaskConical, ArrowLeftRight, Wallet } from "lucide-react";
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
import { formatFCFA as fmt } from "@/lib/lifeos/format";

interface CompoundResult {
  years: number;
  contributions: number;
  gains: number;
  finalValue: number;
  yearly: { year: number; value: number; contributed: number }[];
}

export function SimulationsView() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <FlaskConical className="size-5 text-primary" />
          Simulations
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Investissement général · changement de revenu · arbitrage entre objectifs — hypothèses toujours affichées
        </p>
      </div>
      <GeneralInvestmentSim />
      <IncomeChangeSim />
      <ArbitrageSim />
      <p className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
        <FlaskConical className="size-3 shrink-0" /> {DISCLAIMER_SIMULATION} Les simulations ne modifient jamais tes données réelles.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

function GeneralInvestmentSim() {
  const [initial, setInitial] = useState<number | null>(null);
  const [monthly, setMonthly] = useState<number | null>(50000);
  const [years, setYears] = useState<number | null>(5);
  const [ratePct, setRatePct] = useState<number | null>(10);
  const [feesPct, setFeesPct] = useState<number | null>(1);
  const [result, setResult] = useState<CompoundResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "compound",
        data: {
          initial: initial ?? 0,
          monthly: monthly ?? 0,
          annualRate: (ratePct ?? 10) / 100,
          years: years ?? 5,
          feesRate: (feesPct ?? 0) / 100,
        },
      }),
    });
    const json = await res.json();
    setResult(json.result);
    setLoading(false);
  };

  return (
    <SectionCard
      title="Simulateur d'investissement général"
      description="Capitalisation composée réelle : capital initial, apports réguliers, rendement et frais"
      icon={<FlaskConical className="size-4" />}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Capital initial">
          <MoneyInput value={initial} onChange={setInitial} />
        </Field>
        <Field label="Apport régulier">
          <MoneyInput value={monthly} onChange={setMonthly} />
        </Field>
        <Field label="Durée (années)">
          <Input type="number" value={years ?? ""} onChange={(e) => setYears(e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rendement %/an">
            <Input type="number" value={ratePct ?? ""} onChange={(e) => setRatePct(e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Frais %/an">
            <Input type="number" value={feesPct ?? ""} onChange={(e) => setFeesPct(e.target.value ? Number(e.target.value) : null)} />
          </Field>
        </div>
      </div>
      <Button className="mt-4" onClick={run} disabled={loading}>
        {loading ? "Simulation…" : "Simuler"}
      </Button>

      {result && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Kpi label="Total versé" value={formatFCFA(result.contributions)} />
            <Kpi label="Gain théorique" value={formatFCFA(result.gains)} tone="positive" />
            <Kpi label="Valeur finale" value={formatFCFA(result.finalValue)} tone="accent" />
            <Kpi
              label="ROI"
              value={formatPercent(result.contributions > 0 ? result.gains / result.contributions : 0, 1)}
            />
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.yearly} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={(y: number) => `An ${y}`} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="contributed" name="Cumul versé" fill="var(--color-chart-3)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="value" name="Valeur estimée" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------

function IncomeChangeSim() {
  const { state } = useLifeOS();
  const [newSalary, setNewSalary] = useState<number | null>(250000);
  const [result, setResult] = useState<{
    newSalary: number;
    oldSalary: number;
    newSavingsCapacity: number;
    newInvestmentCapacity: number;
    annualDelta: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!state) return null;
  return <IncomeChangeInner state={state} newSalary={newSalary} setNewSalary={setNewSalary} result={result} setResult={setResult} loading={loading} setLoading={setLoading} />;
}

function IncomeChangeInner({
  state,
  newSalary,
  setNewSalary,
  result,
  setResult,
  loading,
  setLoading,
}: {
  state: LifeOSState;
  newSalary: number | null;
  setNewSalary: (v: number | null) => void;
  result: {
    newSalary: number;
    oldSalary: number;
    newSavingsCapacity: number;
    newInvestmentCapacity: number;
    annualDelta: number;
  } | null;
  setResult: (r: {
    newSalary: number;
    oldSalary: number;
    newSavingsCapacity: number;
    newInvestmentCapacity: number;
    annualDelta: number;
  } | null) => void;
  loading: boolean;
  setLoading: (b: boolean) => void;
}) {

  const run = async () => {
    setLoading(true);
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "incomeChange", data: { newSalary: newSalary ?? 0 } }),
    });
    const json = await res.json();
    setResult(json.result);
    setLoading(false);
  };

  return (
    <SectionCard
      title="Simulateur de changement de revenu"
      description={`« Que se passe-t-il si mon revenu passe à ${formatFCFA(newSalary ?? 0)} ? »`}
      icon={<Wallet className="size-4" />}
    >
      <div className="grid sm:grid-cols-2 gap-3 items-end">
        <Field label="Nouveau salaire mensuel">
          <MoneyInput value={newSalary} onChange={setNewSalary} />
        </Field>
        <Button onClick={run} disabled={loading || !newSalary}>
          {loading ? "Analyse…" : "Simuler l'impact"}
        </Button>
      </div>

      {result && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Kpi label="Salaire actuel" value={formatFCFA(result.oldSalary)} />
          <Kpi label="Nouveau salaire" value={formatFCFA(result.newSalary)} tone="accent" />
          <Kpi
            label="Nouvelle capacité d'épargne"
            value={`${formatFCFA(result.newSavingsCapacity)}/mois`}
            tone="positive"
            hint={`+${formatFCFA(Math.max(0, result.newSavingsCapacity - computeCapacity(state, new Date(state.today)).savingsCapacity) )} vs actuel`}
          />
          <Kpi label="Delta annuel" value={formatFCFA(result.annualDelta)} tone="positive" hint="Salaire seul, hors revenus annexes" />
        </div>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------

function ArbitrageSim() {
  const { state } = useLifeOS();
  const [budget, setBudget] = useState<number | null>(80000);
  if (!state) return null;
  return <ArbitrageInner state={state} budget={budget} setBudget={setBudget} />;
}

function ArbitrageInner({
  state,
  budget,
  setBudget,
}: {
  state: LifeOSState;
  budget: number | null;
  setBudget: (v: number | null) => void;
}) {
  const today = new Date(state.today);

  // Cibles de financement (objectifs + projets avec budget et échéance)
  const targets = useMemo(() => {
    const list: { title: string; remaining: number; months: number; priority: string; kind: string; isAsset: boolean }[] = [];
    for (const g of state.goals) {
      if (g.isSuggested && g.suggestedState !== "ACCEPTED") continue;
      if (!g.budget || !g.targetDate || ["TERMINE", "ANNULE", "REPORTE"].includes(g.status)) continue;
      const months = Math.max(1, Math.round((new Date(g.targetDate).getTime() - today.getTime()) / (30.4 * 86400000)));
      const remaining = Math.max(
        0,
        g.budget - goalFunding(g, state.fundAllocations)
      );
      if (remaining <= 0) continue;
      list.push({ title: g.title, remaining, months, priority: g.priority, kind: "objectif", isAsset: false });
    }
    for (const p of state.projects) {
      if (p.archived || !p.budget || !p.targetDate || ["TERMINE", "ANNULE"].includes(p.status)) continue;
      const months = Math.max(1, Math.round((new Date(p.targetDate).getTime() - today.getTime()) / (30.4 * 86400000)));
      const funding = projectFunding(p, state.transactions, state.fundAllocations);
      const remaining = Math.max(0, p.budget - Math.max(funding.funded, funding.spent));
      if (remaining <= 0) continue;
      list.push({ title: p.name, remaining, months, priority: p.priority, kind: "projet", isAsset: false });
    }
    return list;
  }, [state, today]);

  const scenarios = useMemo(() => {
    if (targets.length === 0) return [];
    const b = budget ?? 0;

    // 1. Priorité échéances : les plus urgents d'abord
    const byDeadline = [...targets].sort((a, b2) => a.months - b2.months || b2.remaining - a.remaining);
    // 2. Priorité patrimoine : objectifs "actifs" (immobilier, investissement) d'abord
    const assetKeywords = ["maison", "construction", "terrain", "brvm", "immobilier", "mercerie", "boutique", "capital"];
    const byAsset = [...targets].sort((a, b2) => {
      const aAsset = assetKeywords.some((k) => a.title.toLowerCase().includes(k)) ? 0 : 1;
      const bAsset = assetKeywords.some((k) => b2.title.toLowerCase().includes(k)) ? 0 : 1;
      return aAsset - bAsset || a.months - b2.months;
    });
    // 3. Priorité utilisateur : par priorité déclarée puis échéance
    const prioWeight: Record<string, number> = { CRITIQUE: 0, HAUTE: 1, MOYENNE: 2, FAIBLE: 3 };
    const byUser = [...targets].sort(
      (a, b2) => (prioWeight[a.priority] ?? 2) - (prioWeight[b2.priority] ?? 2) || a.months - b2.months
    );

    const allocate = (order: typeof targets) => {
      let rest = b;
      const rows = order.map((t) => {
        const need = Math.ceil(t.remaining / t.months);
        const given = Math.max(0, Math.min(need, rest));
        rest -= given;
        const newMonths = given > 0 ? Math.ceil(t.remaining / given) : null;
        return {
          title: t.title,
          need,
          given,
          months: t.months,
          newMonths,
          shortfall: need - given,
        };
      });
      return { rows, unused: rest };
    };

    return [
      { name: "Priorité échéances", description: "Les deadlines les plus proches d'abord", ...allocate(byDeadline) },
      { name: "Priorité patrimoine", description: "Actifs durables (immobilier, business) d'abord", ...allocate(byAsset) },
      { name: "Priorité utilisateur", description: "Tes priorités déclarées, puis échéances", ...allocate(byUser) },
    ];
  }, [targets, budget]);

  return (
    <SectionCard
      title="Simulateur d'arbitrage"
      description={`Comparer plusieurs objectifs avec un budget limité — actuellement ${formatFCFA(budget ?? 0)}/mois`}
      icon={<ArrowLeftRight className="size-4" />}
    >
      <div className="grid sm:grid-cols-2 gap-3 items-end mb-4">
        <Field label="Montant disponible par mois">
          <MoneyInput value={budget} onChange={setBudget} />
        </Field>
      </div>

      {scenarios.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Ajoute des objectifs avec budget et date cible pour comparer des scénarios d&apos;arbitrage.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {scenarios.map((sc) => (
            <div key={sc.name} className="rounded-lg border p-3">
              <p className="text-[13px] font-semibold">{sc.name}</p>
              <p className="text-[10px] text-muted-foreground mb-2">{sc.description}</p>
              <ul className="space-y-1.5">
                {sc.rows.map((r) => (
                  <li key={r.title} className="text-[11px] border-b last:border-0 pb-1.5">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium truncate">{r.title}</span>
                      <span className="tabular-nums font-semibold text-primary">{formatFCFA(r.given)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>besoin {formatFCFA(r.need)}/mois</span>
                      {r.shortfall > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400">
                          manque {formatFCFA(r.shortfall)}
                          {r.newMonths ? ` · ~${r.newMonths} mois` : ""}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">couvert</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {sc.unused > 0 && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Reste non alloué : {formatFCFA(sc.unused)}/mois (réalisable pour investir).
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground">
        Compromis visibles : chaque scénario montre quels objectifs sont couverts, lesquels manquent de financement,
        et l&apos;allongement de délai estimé. Aucune modification automatique — c&apos;est une suggestion.
      </p>
    </SectionCard>
  );
}
