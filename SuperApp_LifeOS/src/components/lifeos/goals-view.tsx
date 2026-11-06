"use client";

// Life OS — Objectifs : Vision 2035 → Objectif annuel → Projet → Jalons → Actions
import { useMemo, useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import type { LifeOSState } from "@/lib/lifeos/types";
import {
  SectionCard,
  PriorityBadge,
  StatusBadge,
  ProgressStat,
  EmptyState,
  Field,
  MoneyInput,
  MobileSheet,
  SaveButton,
} from "@/components/lifeos/ui-bits";
import {
  computeAvailableCash,
  computeCapacity,
  goalFunding,
} from "@/lib/lifeos/engine";
import { formatFCFA, formatDateFR, toInputDate, monthsBetween } from "@/lib/lifeos/format";
import { LIFE_AREAS } from "@/lib/lifeos/constants";
import type { DataVisibility, GoalStatus, Priority } from "@/lib/lifeos/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Plus,
  Trash2,
  Pencil,
  Sparkles,
  Check,
  X,
  Clock4,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { canEdit, clientItemAccess } from "@/lib/lifeos/permissions";

const PRIORITY_OPTIONS: Priority[] = ["CRITIQUE", "HAUTE", "MOYENNE", "FAIBLE"];
const STATUS_OPTIONS: GoalStatus[] = [
  "A_DEFINIR",
  "A_PLANIFIER",
  "PLANIFIE",
  "EN_COURS",
  "EN_RETARD",
  "BLOQUE",
  "TERMINE",
  "REPORTE",
  "ANNULE",
];

export function GoalsView() {
  return (
    <Tabs defaultValue="mine" className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Target className="size-5 text-primary" />
          Objectifs
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Vision 2035 → objectif annuel → projet → jalons → actions
        </p>
      </div>
      <TabsList className="grid grid-cols-2 h-9 w-full max-w-xs">
        <TabsTrigger value="mine" className="text-xs">Mes objectifs</TabsTrigger>
        <TabsTrigger value="suggested" className="text-xs">
          Suggérés
        </TabsTrigger>
      </TabsList>
      <TabsContent value="mine" className="space-y-4">
        <MyGoals />
      </TabsContent>
      <TabsContent value="suggested" className="space-y-4">
        <SuggestedGoals />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------

function MyGoals() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <MyGoalsInner state={state} />;
}

function MyGoalsInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  // formulaire
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [year, setYear] = useState<number | null>(new Date().getFullYear() + 1);
  const [priority, setPriority] = useState<Priority>("MOYENNE");
  const [status, setStatus] = useState<GoalStatus>("A_PLANIFIER");
  const [targetDate, setTargetDate] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<DataVisibility>("SHARED");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "SHARED" | "MINE">("ALL");
  // financement rapide
  const [fundFor, setFundFor] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState<number | null>(null);
  const [fundAccountId, setFundAccountId] = useState("");
  const today = new Date(state.today);
  const capacity = useMemo(() => computeCapacity(state, today), [state, today]);
  const availableCash = useMemo(() => computeAvailableCash(state), [state]);
  const canCreateGoal = canEdit(state.couple?.permissions.goals ?? "EDIT");

  const goals = state.goals.filter((goal) => {
    if (goal.isSuggested && goal.suggestedState !== "ACCEPTED") return false;
    if (scopeFilter === "SHARED") return (goal.visibility ?? "SHARED") === "SHARED";
    if (scopeFilter === "MINE") {
      return (
        (goal.visibility ?? "SHARED") === "PERSONAL" &&
        goal.ownerId === state.user.id
      );
    }
    return true;
  });
  const byYear = useMemo(() => {
    const map = new Map<number, typeof goals>();
    for (const g of goals) {
      const y = g.year ?? 0;
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(g);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [goals]);

  const openForm = (id?: string) => {
    if (id) {
      const g = state.goals.find((x) => x.id === id);
      if (!g) return;
      setEditId(id);
      setTitle(g.title);
      setDescription(g.description ?? "");
      setArea(g.area ?? "");
      setYear(g.year);
      setPriority(g.priority);
      setStatus(g.status);
      setTargetDate(toInputDate(g.targetDate));
      setBudget(g.budget);
      setNotes(g.notes ?? "");
      setVisibility(g.visibility ?? "SHARED");
    } else {
      setEditId(null);
      setTitle("");
      setDescription("");
      setArea("");
      setYear(today.getFullYear() + 1);
      setPriority("MOYENNE");
      setStatus("A_PLANIFIER");
      setTargetDate("");
      setBudget(null);
      setNotes("");
      setVisibility("SHARED");
    }
    setOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-lg border bg-muted/30 p-0.5">
          {([
            ["ALL", "Tous"],
            ["SHARED", "Partages"],
            ["MINE", "Personnels"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setScopeFilter(value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                scopeFilter === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Button size="sm" disabled={!canCreateGoal} onClick={() => openForm()}>
          <Plus className="size-4 mr-1" /> Objectif
        </Button>
      </div>

      {byYear.length === 0 ? (
        <EmptyState title="Aucun objectif" description="Crée ton premier objectif pour piloter ta trajectoire." />
      ) : (
        byYear.map(([year, list]) => (
          <SectionCard
            key={year}
            title={year === 0 ? "Sans année" : `Objectifs ${year}`}
            description={`${list.length} objectif${list.length > 1 ? "s" : ""} · budget total ${formatFCFA(list.reduce((s, g) => s + (g.budget ?? 0), 0))}`}
            icon={<Target className="size-4" />}
          >
            <div className="space-y-2.5">
              {list.map((g) => {
                const months = g.targetDate ? monthsBetween(today, new Date(g.targetDate)) : null;
                const fundedAmount = goalFunding(g, state.fundAllocations);
                const remaining = g.budget !== null ? Math.max(0, g.budget - fundedAmount) : null;
                const need = remaining !== null && months && months > 0 ? Math.ceil(remaining / months) : null;
                const isOpen = expanded === g.id;
                const editable = canEdit(
                  clientItemAccess(state.couple, "goals", "GOAL", g.id)
                );
                return (
                  <div key={g.id} className="rounded-lg border bg-card">
                    <button
                      className="w-full flex items-start gap-2.5 p-3 text-left"
                      onClick={() => setExpanded(isOpen ? null : g.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[13px] font-semibold">{g.title}</p>
                          <PriorityBadge priority={g.priority} />
                          <StatusBadge status={g.status} />
                          <Badge variant="outline" className="text-[9px]">
                            {(g.visibility ?? "SHARED") === "PERSONAL"
                              ? "Personnel"
                              : "Partage"}
                          </Badge>
                          {g.ownerName && (
                            <span className="text-[9px] text-muted-foreground">
                              par {g.ownerName}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {g.area ? `${g.area} · ` : ""}
                          {g.targetDate ? `échéance ${formatDateFR(g.targetDate)}` : "sans échéance"}
                          {months !== null && months >= 0 && ` (${months} mois)`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {g.budget === null ? (
                          <Badge variant="outline" className="text-[10px]">Budget : à estimer</Badge>
                        ) : (
                          <p className="text-[12px] font-bold tabular-nums">
                            {formatFCFA(fundedAmount)}
                            <span className="text-muted-foreground font-normal"> / {formatFCFA(g.budget)}</span>
                          </p>
                        )}
                      </div>
                      {isOpen ? <ChevronUp className="size-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-1" />}
                    </button>

                    {isOpen && (
                      <div className="border-t px-3 py-3 space-y-3">
                        {g.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{g.description}</p>
                        )}
                        {g.budget !== null && (
                          <ProgressStat
                            label="Financement"
                            value={fundedAmount}
                            max={g.budget}
                            tone={g.status === "EN_RETARD" ? "danger" : "default"}
                          />
                        )}
                        {need !== null && need > capacity.savingsCapacity && (
                          <p className="rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px] p-2">
                            ⚠ Nécessite {formatFCFA(need)}/mois — au-delà de ta capacité d&apos;épargne actuelle
                            ({formatFCFA(capacity.savingsCapacity)}/mois).
                          </p>
                        )}
                        {g.notes && <p className="text-[11px] text-muted-foreground italic">{g.notes}</p>}
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={!editable}
                            onClick={() => {
                              setFundFor(g.id);
                              setFundAmount(null);
                              setFundAccountId(
                                state.settings.defaultAccountId ??
                                  availableCash.accounts.find(
                                    (account) => account.available > 0
                                  )?.accountId ??
                                  ""
                              );
                            }}
                          >
                            Affecter des fonds
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!editable} onClick={() => openForm(g.id)}>
                            <Pencil className="size-3 mr-1" /> Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            disabled={!editable}
                            onClick={() => mutate("goal", "delete", g.id)}
                          >
                            <Trash2 className="size-3 mr-1" /> Supprimer
                          </Button>
                        </div>
                        {state.fundAllocations
                          .filter(
                            (allocation) =>
                              allocation.goalId === g.id &&
                              allocation.status === "ACTIVE"
                          )
                          .map((allocation) => (
                            <div
                              key={allocation.id}
                              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs"
                            >
                              <span>
                                {state.accounts.find(
                                  (account) => account.id === allocation.accountId
                                )?.name ?? "Compte"}{" "}
                                · {formatFCFA(allocation.amount)} réservés
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[11px]"
                                disabled={!editable}
                                onClick={() =>
                                  mutate("fundAllocation", "delete", allocation.id)
                                }
                              >
                                Libérer
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        ))
      )}

      {/* Formulaire objectif */}
      <MobileSheet
        open={open}
        onOpenChange={setOpen}
        title={editId ? "Modifier l'objectif" : "Nouvel objectif"}
        description="Budget « à estimer » possible — renseigne-le progressivement."
      >
        <div className="space-y-3">
          <Field label="Titre">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Construire notre maison" />
          </Field>
          <Field label="Description">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </Field>
          <Field label="Partage">
            <Select
              value={visibility}
              onValueChange={(value) => setVisibility(value as DataVisibility)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SHARED">Partage avec le foyer (par defaut)</SelectItem>
                <SelectItem value="PERSONAL">Personnel · moi uniquement</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Domaine de vie">
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {LIFE_AREAS.map((a) => (
                    <SelectItem key={a.name} value={a.name}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Année">
              <Input
                type="number"
                value={year ?? ""}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priorité">
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Statut">
              <Select value={status} onValueChange={(v) => setStatus(v as GoalStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Date cible">
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>
          <Field label="Budget prévisionnel (vide = à estimer)">
            <MoneyInput value={budget} onChange={setBudget} />
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
          <SaveButton
            onSave={async () => {
              if (!title.trim()) return;
              const data = {
                title,
                description: description || null,
                area: area || null,
                year,
                priority,
                status,
                targetDate: targetDate || null,
                budget,
                notes: notes || null,
                visibility,
              };
              if (editId) await mutate("goal", "update", editId, data);
              else await mutate("goal", "create", undefined, data);
              setOpen(false);
            }}
          />
        </div>
      </MobileSheet>

      {/* Affectation de fonds */}
      <MobileSheet
        open={fundFor !== null}
        onOpenChange={(o) => !o && setFundFor(null)}
        title="Affecter des fonds"
        description="Marque l'argent comme sécurisé pour cet objectif. Aucune dépense n'est créée."
      >
        <div className="space-y-3">
          <Field label="Compte source">
            <Select value={fundAccountId} onValueChange={setFundAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un compte" />
              </SelectTrigger>
              <SelectContent>
                {state.accounts
                  .filter((account) => !account.archived)
                  .map((account) => {
                    const line = availableCash.accounts.find(
                      (candidate) => candidate.accountId === account.id
                    );
                    return (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} · {formatFCFA(line?.available ?? 0)} libres
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Montant à affecter">
            <MoneyInput value={fundAmount} onChange={setFundAmount} />
          </Field>
          <SaveButton
            label="Affecter"
            onSave={async () => {
              if (!fundFor || !fundAmount || !fundAccountId) return;
              const goal = state.goals.find((candidate) => candidate.id === fundFor);
              const result = await mutate("fundAllocation", "create", undefined, {
                amount: fundAmount,
                accountId: fundAccountId,
                goalId: fundFor,
                note: `Affectation de fonds — ${goal?.title ?? "objectif"}`,
              });
              if (!result) return;
              toast({ title: "Fonds affectés", description: formatFCFA(fundAmount) });
              setFundFor(null);
            }}
          />
        </div>
      </MobileSheet>
    </>
  );
}

// ---------------------------------------------------------------------------

function SuggestedGoals() {
  const { state, mutate } = useLifeOS();
  const { toast } = useToast();
  if (!state) return null;

  const pending = state.goals.filter((g) => g.isSuggested && g.suggestedState === "PENDING");
  const decided = state.goals.filter(
    (g) => g.isSuggested && g.suggestedState && g.suggestedState !== "PENDING"
  );

  const handle = async (id: string, st: "ACCEPTED" | "REFUSED" | "POSTPONED") => {
    await mutate("goalSuggestion", "custom", id, { state: st });
    toast({
      title:
        st === "ACCEPTED"
          ? "Objectif accepté — il rejoint « Mes objectifs »"
          : st === "REFUSED"
            ? "Suggestion refusée"
            : "Objectif reporté d'un an",
    });
  };

  return (
    <>
      <SectionCard
        title="Objectifs suggérés"
        description="Propositions du système — modifiables, supprimables, reportables, acceptables ou refusables. Jamais automatiques."
        icon={<Sparkles className="size-4" />}
      >
        {pending.length === 0 ? (
          <EmptyState title="Aucune suggestion en attente" />
        ) : (
          <div className="space-y-2.5">
            {pending.map((g) => (
              <div key={g.id} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[13px] font-semibold">{g.title}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {g.year ?? "—"}
                  </Badge>
                </div>
                {g.description && (
                  <p className="text-xs text-muted-foreground leading-snug">{g.description}</p>
                )}
                {g.targetValue !== null && (
                  <p className="text-xs font-medium">
                    Cible : {g.unit === "%" ? `${g.targetValue} %` : formatFCFA(g.targetValue)}
                    {g.unit && g.unit !== "%" && g.unit !== "FCFA" ? ` ${g.unit}` : ""}
                  </p>
                )}
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs" onClick={() => handle(g.id, "ACCEPTED")}>
                    <Check className="size-3 mr-1" /> Appliquer
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handle(g.id, "POSTPONED")}>
                    <Clock4 className="size-3 mr-1" /> Reporter
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handle(g.id, "REFUSED")}>
                    <X className="size-3 mr-1" /> Ignorer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {decided.length > 0 && (
        <SectionCard title="Suggestions traitées" description="Historique de tes décisions">
          <ul className="space-y-1.5">
            {decided.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <span className="text-[13px] text-muted-foreground truncate">{g.title}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] shrink-0",
                    g.suggestedState === "ACCEPTED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : g.suggestedState === "POSTPONED"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-neutral-100 text-neutral-500"
                  )}
                >
                  {g.suggestedState === "ACCEPTED" ? "Accepté" : g.suggestedState === "POSTPONED" ? `Reporté à ${g.year}` : "Refusé"}
                </Badge>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}
