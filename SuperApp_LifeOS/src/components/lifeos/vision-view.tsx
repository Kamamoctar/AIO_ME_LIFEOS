"use client";

// Life OS — Vision 2027–2035
import { useMemo, useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import { SectionCard, Kpi, EmptyState, Field, MoneyInput, MobileSheet, SaveButton, ProgressStat } from "@/components/lifeos/ui-bits";
import { computeNetWorth } from "@/lib/lifeos/engine";
import { formatCompactFCFA, formatFCFA } from "@/lib/lifeos/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Telescope, Pencil, Sparkles, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LifeOSState } from "@/lib/lifeos/types";

const YEARS = Array.from({ length: 9 }, (_, i) => 2027 + i);

const YEAR_HINTS: Record<number, string> = {
  2027: "Année de fondation : construction de la maison, mariage, lancement des activités.",
  2028: "Consolidation : clarifier l'objectif de 3,33 M FCFA, lancer la mercerie.",
  2029: "Croissance : développer les revenus complémentaires.",
  2030: "Diversification : 30 % de revenus hors salaire.",
  2031: "Patrimoine : accélérer les investissements BRVM.",
  2032: "Expansion immobilière éventuelle.",
  2033: "Sécurisation : fonds d'urgence renforcé, diversification.",
  2034: "Préparation de la décennie suivante.",
  2035: "Vision 2035 : patrimoine, liberté financière, équilibre de vie.",
};

export function VisionView() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <VisionInner state={state} />;
}

function VisionInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const [editYear, setEditYear] = useState<number | null>(null);
  // formulaire
  const [vision, setVision] = useState("");
  const [targetIncome, setTargetIncome] = useState<number | null>(null);
  const [targetNetWorth, setTargetNetWorth] = useState<number | null>(null);
  const [targetSavings, setTargetSavings] = useState<number | null>(null);
  const [targetInvestment, setTargetInvestment] = useState<number | null>(null);
  const [majorProjects, setMajorProjects] = useState("");
  const [skillsFocus, setSkillsFocus] = useState("");
  const [healthFocus, setHealthFocus] = useState("");
  const [familyFocus, setFamilyFocus] = useState("");
  const [realEstateFocus, setRealEstateFocus] = useState("");

  const netWorth = useMemo(() => computeNetWorth(state), [state]);
  const today = new Date(state.today);
  const currentYear = today.getFullYear();

  const planFor = (year: number) => state.yearPlans.find((y) => y.year === year);

  const goalsByYear = useMemo(() => {
    const map = new Map<number, number>();
    for (const g of state.goals) {
      if (g.isSuggested && g.suggestedState !== "ACCEPTED") continue;
      if (g.year && g.budget) map.set(g.year, (map.get(g.year) ?? 0) + g.budget);
    }
    return map;
  }, [state.goals]);

  const openEdit = (year: number) => {
    const p = planFor(year);
    setVision(p?.vision ?? "");
    setTargetIncome(p?.targetIncome ?? null);
    setTargetNetWorth(p?.targetNetWorth ?? null);
    setTargetSavings(p?.targetSavings ?? null);
    setTargetInvestment(p?.targetInvestment ?? null);
    setMajorProjects(p?.majorProjects ?? "");
    setSkillsFocus(p?.skillsFocus ?? "");
    setHealthFocus(p?.healthFocus ?? "");
    setFamilyFocus(p?.familyFocus ?? "");
    setRealEstateFocus(p?.realEstateFocus ?? "");
    setEditYear(year);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Telescope className="size-5 text-primary" />
          Vision 2027–2035
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Où je vais · revenus, patrimoine, épargne, investissements, projets, compétences, santé, famille, immobilier
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Patrimoine net actuel (réel)" value={formatFCFA(netWorth.netWorth)} tone="accent" hint="Aujourd'hui" />
        <Kpi label="Objectif patrimoine 2035" value={state.yearPlans.find((y) => y.year === 2035)?.targetNetWorth ? formatFCFA(state.yearPlans.find((y) => y.year === 2035)!.targetNetWorth!) : "À définir"} hint="Modifiable dans la fiche 2035" />
        <Kpi label="Revenu annuel salarial actuel" value={formatFCFA(state.settings.salaryMonthly * 12)} hint={`${formatFCFA(state.settings.salaryMonthly)}/mois × 12`} />
        <Kpi label="Années restantes avant 2035" value={`${2035 - currentYear} ans`} hint={`Nous sommes en ${currentYear}`} />
      </div>

      {/* Frise des années */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {YEARS.map((year) => {
          const p = planFor(year);
          const isPast = year < currentYear;
          const isCurrent = year === currentYear;
          const goalsBudget = goalsByYear.get(year) ?? 0;
          return (
            <div
              key={year}
              className={cn(
                "rounded-xl border bg-card p-4 space-y-3 relative overflow-hidden",
                isCurrent && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "flex size-9 items-center justify-center rounded-lg text-sm font-bold",
                    isCurrent ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                  )}>
                    {String(year).slice(2)}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{year}</p>
                    {isCurrent && <Badge className="text-[9px] px-1.5 py-0">année en cours</Badge>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(year)} aria-label={`Modifier ${year}`}>
                  <Pencil className="size-3.5" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground leading-snug min-h-[32px]">
                {p?.vision ?? YEAR_HINTS[year]}
              </p>

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <TargetRow label="Revenu cible" value={p?.targetIncome} />
                <TargetRow label="Patrimoine cible" value={p?.targetNetWorth} />
                <TargetRow label="Épargne cible" value={p?.targetSavings} />
                <TargetRow label="Investissement cible" value={p?.targetInvestment} />
              </div>

              {goalsBudget > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Objectifs budgétés cette année : {formatFCFA(goalsBudget)}
                </p>
              )}

              {p?.majorProjects && (
                <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                  <Flag className="size-3 mt-0.5 shrink-0" />
                  {p.majorProjects}
                </p>
              )}
              {isPast && <div className="absolute inset-x-0 top-0 h-0.5 bg-muted" />}
            </div>
          );
        })}
      </div>

      {/* Timeline des grands jalons */}
      <SectionCard
        title="Timeline des grands jalons"
        description="Objectifs et projets par échéance"
        icon={<Sparkles className="size-4" />}
      >
        {(() => {
          const items: { title: string; date: Date; kind: string; priority: string }[] = [];
          for (const g of state.goals) {
            if (!g.targetDate || ["TERMINE", "ANNULE", "REPORTE"].includes(g.status)) continue;
            if (g.isSuggested && g.suggestedState !== "ACCEPTED") continue;
            items.push({ title: g.title, date: new Date(g.targetDate), kind: "Objectif", priority: g.priority });
          }
          for (const p of state.projects) {
            if (p.archived || !p.targetDate) continue;
            items.push({ title: p.name, date: new Date(p.targetDate), kind: "Projet", priority: p.priority });
          }
          items.sort((a, b) => a.date.getTime() - b.date.getTime());
          if (items.length === 0)
            return <EmptyState title="Aucun jalon daté" description="Ajoute des dates cibles à tes objectifs." />;
          return (
            <div className="relative border-l-2 border-primary/20 ml-3 space-y-4 py-1">
              {items.map((it, i) => (
                <div key={i} className="relative pl-5">
                  <span
                    className={cn(
                      "absolute -left-[7px] top-1 size-3 rounded-full border-2 border-background",
                      it.priority === "CRITIQUE" ? "bg-red-500" : it.priority === "HAUTE" ? "bg-amber-500" : "bg-primary"
                    )}
                  />
                  <p className="text-[13px] font-medium">{it.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {it.kind} · {it.date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                    {it.date < today && <span className="text-red-500 font-medium"> (passé)</span>}
                  </p>
                </div>
              ))}
            </div>
          );
        })()}
      </SectionCard>

      {/* Fiche d'édition annuelle */}
      <MobileSheet
        open={editYear !== null}
        onOpenChange={(o) => !o && setEditYear(null)}
        title={`Vision ${editYear ?? ""}`}
        description="Définis la vision de l'année et ses cibles. Tout reste modifiable."
      >
        <div className="space-y-3">
          <Field label="Vision de l'année">
            <Textarea value={vision} onChange={(e) => setVision(e.target.value)} rows={2} placeholder={editYear ? YEAR_HINTS[editYear] : ""} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Revenu cible (annuel)">
              <MoneyInput value={targetIncome} onChange={setTargetIncome} />
            </Field>
            <Field label="Patrimoine cible">
              <MoneyInput value={targetNetWorth} onChange={setTargetNetWorth} />
            </Field>
            <Field label="Épargne cible">
              <MoneyInput value={targetSavings} onChange={setTargetSavings} />
            </Field>
            <Field label="Investissements cibles">
              <MoneyInput value={targetInvestment} onChange={setTargetInvestment} />
            </Field>
          </div>
          <Field label="Projets majeurs">
            <Textarea value={majorProjects} onChange={(e) => setMajorProjects(e.target.value)} rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Compétences">
              <Input value={skillsFocus} onChange={(e) => setSkillsFocus(e.target.value)} />
            </Field>
            <Field label="Santé">
              <Input value={healthFocus} onChange={(e) => setHealthFocus(e.target.value)} />
            </Field>
            <Field label="Famille">
              <Input value={familyFocus} onChange={(e) => setFamilyFocus(e.target.value)} />
            </Field>
            <Field label="Immobilier">
              <Input value={realEstateFocus} onChange={(e) => setRealEstateFocus(e.target.value)} />
            </Field>
          </div>
          <SaveButton
            onSave={async () => {
              if (editYear === null) return;
              await mutate("yearPlan", "create", undefined, {
                year: editYear,
                vision: vision || null,
                targetIncome,
                targetNetWorth,
                targetSavings,
                targetInvestment,
                majorProjects: majorProjects || null,
                skillsFocus: skillsFocus || null,
                healthFocus: healthFocus || null,
                familyFocus: familyFocus || null,
                realEstateFocus: realEstateFocus || null,
              });
              setEditYear(null);
            }}
          />
        </div>
      </MobileSheet>
    </div>
  );
}

function TargetRow({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-md bg-muted/60 px-2 py-1.5">
      <p className="text-[9px] text-muted-foreground leading-none">{label}</p>
      <p className="text-[11px] font-semibold tabular-nums mt-0.5">
        {value ? formatCompactFCFA(value) + " FCFA" : "—"}
      </p>
    </div>
  );
}
