"use client";

// Life OS — Décisions : « Puis-je me le permettre ? »
// Jamais un simple Oui/Non : verdict nuancé + conséquences chiffrées.
// Une simulation ne modifie jamais les données réelles.
import { useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import { SectionCard, Kpi, Field, MoneyInput, ExplainLine } from "@/components/lifeos/ui-bits";
import { formatFCFA, todayInputDate } from "@/lib/lifeos/format";
import { DISCLAIMER_SIMULATION } from "@/lib/lifeos/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircleHelp, AlertTriangle, CheckCircle2, Clock4, XCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DecisionAnalysis } from "@/lib/lifeos/engine";

const VERDICT_STYLES: Record<
  string,
  { bg: string; icon: typeof CheckCircle2; label: string }
> = {
  FAISABLE: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300", icon: CheckCircle2, label: "Faisable maintenant" },
  FAISABLE_SOUS_CONDITIONS: { bg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300", icon: Clock4, label: "Faisable sous conditions" },
  RISQUE: { bg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300", icon: ShieldAlert, label: "Risqué actuellement" },
  NON_COMPATIBLE: { bg: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300", icon: XCircle, label: "Non compatible" },
};

export function DecisionsView() {
  const [type, setType] = useState<"ACHAT" | "INVESTISSEMENT">("ACHAT");
  const [amount, setAmount] = useState<number | null>(null);
  const [date, setDate] = useState(todayInputDate());
  const [months, setMonths] = useState(12);
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!amount || amount <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "decision",
          data: { amount, type, date, months },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur d'analyse");
      setAnalysis(json.analysis as DecisionAnalysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const v = analysis ? VERDICT_STYLES[analysis.verdict] : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <CircleHelp className="size-5 text-primary" />
          Décisions
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          « Puis-je me le permettre ? » — analyse de liquidités, charges, fonds d&apos;urgence, projets et objectifs
        </p>
      </div>

      <SectionCard
        title="Puis-je me le permettre ?"
        description="Saisis l'opération envisagée — le moteur chiffre les conséquences"
        icon={<CircleHelp className="size-4" />}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Type d'opération">
            <Select value={type} onValueChange={(v) => setType(v as "ACHAT" | "INVESTISSEMENT")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACHAT">Achat / dépense</SelectItem>
                <SelectItem value="INVESTISSEMENT">Investissement</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Montant envisagé">
            <MoneyInput value={amount} onChange={setAmount} />
          </Field>
          <Field label="Date souhaitée">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Sur quelle durée évaluer l'effort ? (mois)">
            <Input type="number" value={months} min={1} onChange={(e) => setMonths(Number(e.target.value) || 12)} />
          </Field>
        </div>
        <Button className="mt-4" onClick={analyze} disabled={loading || !amount}>
          {loading ? "Analyse…" : "Analyser la décision"}
        </Button>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </SectionCard>

      {analysis && v && (
        <>
          {/* Verdict */}
          <div className={cn("rounded-xl p-5 flex items-start gap-3", v.bg)}>
            <v.icon className="size-7 shrink-0 mt-0.5" />
            <div>
              <p className="text-base font-bold">{analysis.verdictLabel}</p>
              <p className="text-xs mt-1 opacity-80">
                {analysis.verdict === "FAISABLE"
                  ? "Cette opération préserve ton fonds d'urgence, tes provisions et ta marge de sécurité."
                  : analysis.verdict === "FAISABLE_SOUS_CONDITIONS"
                    ? "Faisable si tu acceptes de réduire temporairement ta marge de sécurité."
                    : analysis.verdict === "RISQUE"
                      ? "Cette operation entamerait ton fonds d'urgence ou tes provisions."
                      : "Cette opération entrerait en conflit avec tes objectifs prioritaires."}
              </p>
            </div>
          </div>

          {/* Avant / Après */}
          <SectionCard
            title="Comparaison avant / après"
            description="Projection — aucune donnée réelle n'est modifiée"
            icon={<AlertTriangle className="size-4" />}
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Avant</p>
                <p className="text-sm font-bold tabular-nums mt-1">{formatFCFA(analysis.before.cash)}</p>
                <p className="text-[10px] text-muted-foreground">cash</p>
              </div>
              <div className="rounded-lg border border-dashed p-3">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Action</p>
                <p className="text-sm font-bold tabular-nums mt-1 text-primary">− {formatFCFA(analysis.amount)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {analysis.verdict === "NON_COMPATIBLE" ? "à éviter" : type === "INVESTISSEMENT" ? "investissement" : "achat"}
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Après</p>
                <p className="text-sm font-bold tabular-nums mt-1">{formatFCFA(analysis.after.cash)}</p>
                <p className="text-[10px] text-muted-foreground">cash</p>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              {analysis.impacts.map((imp) => (
                <ExplainLine key={imp.label} label={imp.label} value={imp.value} />
              ))}
            </div>
          </SectionCard>

          {/* Objectifs impactés */}
          <SectionCard
            title="Impacts sur tes objectifs"
            description="Conséquences chiffrées — pas de décision automatique"
            icon={<CircleHelp className="size-4" />}
          >
            {analysis.impactedGoals.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun objectif prioritaire n&apos;est compromis par cette opération.
              </p>
            ) : (
              <ul className="space-y-2">
                {analysis.impactedGoals.map((g, i) => (
                  <li key={i} className="rounded-lg border border-l-4 border-l-amber-500 bg-card p-3">
                    <p className="text-[13px] font-medium">{g.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Besoin : {formatFCFA(g.monthlyNeed)}/mois
                      {g.delayMonths
                        ? g.delayMonths >= 120
                          ? " · horizon repoussé de plus de 10 ans"
                          : ` · retard estimé : +${g.delayMonths} mois`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Explication */}
          <SectionCard title="Comment ce verdict est-il calculé ?" icon={<AlertTriangle className="size-4" />}>
            <div className="space-y-1.5">
              {analysis.explanation.map((line, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                  • {line}
                </p>
              ))}
            </div>
          </SectionCard>

          <p className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
            <AlertTriangle className="size-3 shrink-0" /> {DISCLAIMER_SIMULATION} Aucune donnée réelle n&apos;a été modifiée.
          </p>
        </>
      )}
    </div>
  );
}
