"use client";

import { useMemo } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDollarSign, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatFCFA } from "@/lib/lifeos/format";
import { computeEmergencyFund } from "@/lib/lifeos/engine";
import {
  computeMoneyAllocation,
  MONEY_POCKETS,
  SIX_POCKETS_PRESET,
  type MoneyPocketId,
} from "@/lib/lifeos/money-plan";
import { useLifeOS } from "@/lib/lifeos/store";
import { useUnifiedModules } from "@/lib/modules/store";

function allocationAdvice(
  result: ReturnType<typeof computeMoneyAllocation>,
  emergencyFundMissing: number
): { title: string; description: string; warning: boolean } {
  if (result.totalPercentage !== 100) {
    return {
      title: `Répartition à corriger : ${result.totalPercentage}%`,
      description: "Les six poches doivent totaliser exactement 100 % du revenu disponible.",
      warning: true,
    };
  }
  if (result.income <= 0) {
    return {
      title: "Ajoute ton revenu mensuel",
      description: "LifeOS calculera alors automatiquement le montant cible de chaque poche.",
      warning: true,
    };
  }
  const necessities = result.rows.find((row) => row.id === "necessities");
  if (necessities && necessities.actualPercentage > necessities.percentage) {
    return {
      title: "Les nécessités dépassent leur cible",
      description: `Elles utilisent ${necessities.actualPercentage.toFixed(1)} % du revenu contre ${necessities.percentage} % prévus. Ajuste le modèle ou cherche les postes compressibles.`,
      warning: true,
    };
  }
  if (result.unclassified > 0) {
    return {
      title: "Classe les dépenses restantes",
      description: `${formatFCFA(result.unclassified)} ne sont associés à aucune poche. Utilise les correspondances de catégories ci-dessous.`,
      warning: true,
    };
  }
  if (emergencyFundMissing > 0) {
    return {
      title: "Priorité adaptative : sécurité",
      description: `Il manque ${formatFCFA(emergencyFundMissing)} au fonds d’urgence. Oriente d’abord la poche Épargne long terme vers ce filet de sécurité, puis vers les autres objectifs.`,
      warning: false,
    };
  }
  const priority = result.rows
    .filter((row) => row.remaining > 0)
    .toSorted((a, b) => b.remaining - a.remaining)[0];
  if (priority) {
    return {
      title: `Prochaine priorité : ${priority.label}`,
      description: `Il reste ${formatFCFA(priority.remaining)} à lui affecter pour atteindre la cible mensuelle.`,
      warning: false,
    };
  }
  return {
    title: "Toutes les poches sont couvertes",
    description: "La répartition réelle atteint ou dépasse les objectifs du mois.",
    warning: false,
  };
}

export function SixPocketsPlan() {
  const state = useLifeOS((store) => store.state);
  const config = useUnifiedModules((store) => store.data.finance.moneyPlan);
  const setMoneyPlanEnabled = useUnifiedModules((store) => store.setMoneyPlanEnabled);
  const setMoneyPlanIncomeBasis = useUnifiedModules((store) => store.setMoneyPlanIncomeBasis);
  const setMoneyPlanPercentages = useUnifiedModules((store) => store.setMoneyPlanPercentages);
  const setMoneyPocketPercentage = useUnifiedModules((store) => store.setMoneyPocketPercentage);
  const assignCategoryToMoneyPocket = useUnifiedModules((store) => store.assignCategoryToMoneyPocket);
  const result = useMemo(
    () => state ? computeMoneyAllocation(state, config, new Date(state.today)) : null,
    [config, state]
  );

  if (!state || !result) return null;
  const emergencyFund = computeEmergencyFund(state, new Date(state.today));
  const advice = allocationAdvice(result, emergencyFund.missing);
  const assignableCategories = state.categories.filter(
    (category) => category.kind === "EXPENSE" && !category.essential
  );

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><CircleDollarSign className="size-5 text-primary" /> Allocation en six poches</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Chaque franc du revenu net disponible reçoit une mission, sans remplacer ton budget actuel.</p>
            </div>
            <div className="flex items-center gap-2"><span className="text-xs font-medium">Activer</span><Switch checked={config.enabled} onCheckedChange={setMoneyPlanEnabled} aria-label="Activer l’allocation en six poches" /></div>
          </div>
        </CardHeader>
        {config.enabled ? (
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-muted/50 p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Base mensuelle</p><p className="mt-1 text-xl font-black text-primary">{formatFCFA(result.income)}</p></div>
              <div className="rounded-xl bg-muted/50 p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Cibles</p><p className="mt-1 text-xl font-black">{result.totalPercentage}%</p></div>
              <div className="rounded-xl bg-muted/50 p-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Réel classé</p><p className="mt-1 text-xl font-black">{formatFCFA(result.totalActual)}</p></div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-52"><p className="mb-1 text-xs font-medium">Revenu utilisé pour les cibles</p><Select value={config.incomeBasis} onValueChange={(value) => setMoneyPlanIncomeBasis(value as "EXPECTED" | "ACTUAL")}><SelectTrigger aria-label="Base de revenu pour les six poches"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EXPECTED">Revenu mensuel attendu</SelectItem><SelectItem value="ACTUAL">Revenu réellement encaissé</SelectItem></SelectContent></Select></div>
              <Button variant="outline" size="sm" onClick={() => setMoneyPlanPercentages(SIX_POCKETS_PRESET)}><RotateCcw className="mr-1.5 size-3.5" /> Modèle 50/10</Button>
            </div>

            <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-label="Répartition cible des six poches">
              {result.rows.map((row) => <span key={row.id} style={{ width: `${row.percentage}%`, backgroundColor: row.color }} title={`${row.label} : ${row.percentage}%`} />)}
            </div>
          </CardContent>
        ) : (
          <CardContent><p className="text-sm text-muted-foreground">Le budget, les enveloppes et les transactions continuent de fonctionner normalement. Active cette couche quand tu veux utiliser la répartition.</p></CardContent>
        )}
      </Card>

      {config.enabled ? (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            {result.rows.map((row) => {
              const progress = row.target > 0 ? Math.min(100, row.actual / row.target * 100) : 0;
              return (
                <Card key={row.id}>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                      <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{row.label}</p><p className="text-[11px] leading-4 text-muted-foreground">{row.description}</p></div>
                      <div className="relative w-20 shrink-0"><Input type="number" min={0} max={100} inputMode="numeric" value={row.percentage} onChange={(event) => setMoneyPocketPercentage(row.id, Number(event.target.value))} className="h-9 pr-7 text-right font-bold" aria-label={`Pourcentage ${row.label}`} /><span className="pointer-events-none absolute right-2.5 top-2 text-xs text-muted-foreground">%</span></div>
                    </div>
                    <Progress value={progress} />
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <PocketMetric label="Cible" value={formatFCFA(row.target)} />
                      <PocketMetric label="Réel" value={formatFCFA(row.actual)} />
                      <PocketMetric label={row.remaining >= 0 ? "À affecter" : "Dépassement"} value={formatFCFA(Math.abs(row.remaining))} warning={row.remaining < 0} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className={advice.warning ? "border-amber-500/50" : "border-emerald-500/40"}>
            <CardContent className="flex items-start gap-3 pt-5">
              {advice.warning ? <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" /> : <Sparkles className="mt-0.5 size-5 shrink-0 text-emerald-500" />}
              <div><p className="text-sm font-semibold">{advice.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{advice.description}</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Correspondance des catégories</CardTitle><p className="text-xs text-muted-foreground">Les catégories essentielles vont automatiquement dans Nécessités. Les dons, investissements et transferts vers un compte Épargne sont reconnus par leur type.</p></CardHeader>
            <CardContent>
              {assignableCategories.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {assignableCategories.map((category) => {
                    const assigned = config.categoryAssignments[category.id];
                    return (
                      <div key={category.id} className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                        <span className="min-w-0 truncate text-xs font-medium">{category.name}</span>
                        <Select value={assigned ?? "AUTO"} onValueChange={(value) => assignCategoryToMoneyPocket(category.id, value === "AUTO" ? null : value as MoneyPocketId)}>
                          <SelectTrigger className="h-8 w-40 text-xs" aria-label={`Poche associée à ${category.name}`}><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="AUTO">Automatique</SelectItem>{MONEY_POCKETS.map((pocket) => <SelectItem key={pocket.id} value={pocket.id}>{pocket.shortLabel}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ajoute des catégories de dépenses pour personnaliser leur poche.</p>
              )}
              {result.unclassified > 0 ? <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-xs"><ArrowRight className="size-4 text-amber-600" /><span><b>{formatFCFA(result.unclassified)}</b> de dépenses restent non classées ce mois.</span></div> : <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs"><CheckCircle2 className="size-4 text-emerald-600" /><span>Toutes les dépenses du mois sont classées.</span></div>}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function PocketMetric({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className="rounded-lg bg-muted/50 p-2"><p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-0.5 truncate text-xs font-bold tabular-nums ${warning ? "text-destructive" : ""}`} title={value}>{value}</p></div>;
}
