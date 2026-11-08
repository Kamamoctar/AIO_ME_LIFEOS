"use client";

// Life OS — Finances : budget du mois, enveloppes, charges, clôture
import { useMemo, useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import type { LifeOSState } from "@/lib/lifeos/types";
import {
  SectionCard,
  Kpi,
  ProgressStat,
  ExplainLine,
  ExplainDialog,
  EmptyState,
  Field,
  MoneyInput,
  MobileSheet,
  SaveButton,
} from "@/components/lifeos/ui-bits";
import { householdMonthlyBudget, monthlySummary } from "@/lib/lifeos/engine";
import {
  formatFCFA,
  formatDateFR,
  formatMonthFR,
  todayInputDate,
  toInputDate,
} from "@/lib/lifeos/format";
import {
  FREQUENCY_LABELS,
  MONTHS_FR,
  ENVELOPE_GROUP_LABELS,
} from "@/lib/lifeos/constants";
import type { AppEnvelope, EnvelopeGroup, Frequency } from "@/lib/lifeos/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Receipt,
  Package,
  PiggyBank,
  CalendarCheck,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SixPocketsPlan } from "@/components/lifeos/six-pockets-plan";

export function FinancesView() {
  return (
    <Tabs defaultValue="budget" className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Wallet className="size-5 text-primary" />
          Finances
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Budget prévisionnel vs réel · six poches · enveloppes · charges · clôture
        </p>
      </div>
      <TabsList className="grid h-9 grid-cols-5">
        <TabsTrigger value="budget" className="text-[10px] sm:text-xs">Budget</TabsTrigger>
        <TabsTrigger value="allocation" className="text-[10px] sm:text-xs">6 poches</TabsTrigger>
        <TabsTrigger value="envelopes" className="text-[10px] sm:text-xs">Enveloppes</TabsTrigger>
        <TabsTrigger value="charges" className="text-[10px] sm:text-xs">Charges</TabsTrigger>
        <TabsTrigger value="cloture" className="text-[10px] sm:text-xs">Clôture</TabsTrigger>
      </TabsList>
      <TabsContent value="budget" className="space-y-4">
        <BudgetTab />
      </TabsContent>
      <TabsContent value="allocation" className="space-y-4">
        <SixPocketsPlan />
      </TabsContent>
      <TabsContent value="envelopes" className="space-y-4">
        <EnvelopesTab />
      </TabsContent>
      <TabsContent value="charges" className="space-y-4">
        <ChargesTab />
      </TabsContent>
      <TabsContent value="cloture" className="space-y-4">
        <ClotureTab />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Onglet Budget : prévisionnel vs réel
// ---------------------------------------------------------------------------

function BudgetTab() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <BudgetInner state={state} />;
}

function BudgetInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState<number | null>(null);
  const today = new Date(state.today);

  const summary = useMemo(
    () => monthlySummary(state.transactions, today.getFullYear(), today.getMonth() + 1),
    [state.transactions, today]
  );
  const plan = useMemo(() => householdMonthlyBudget(state, today), [state, today]);

  const expenseCats = state.categories.filter((c) => c.kind === "EXPENSE" || c.kind === "DONATION");
  const projectedTotal = plan.totalPlannedOutflows;
  const realTotal = summary.expenses + summary.invested;

  const budgetRows = expenseCats
    .map((c) => {
      const real = summary.byCategory.get(c.name) || 0;
      const budget = c.budgetMonthly ?? 0;
      return { c, real, budget, ecart: real - budget };
    })
    .sort((a, b) => b.real - a.real);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Revenus attendus" value={formatFCFA(plan.expectedIncome)} tone="positive" />
        <Kpi label="Sorties planifiées" value={formatFCFA(projectedTotal)} hint="Budget, provisions, projets et marge" />
        <Kpi label="Sorties réelles (mois)" value={formatFCFA(realTotal)} tone={realTotal > projectedTotal && projectedTotal > 0 ? "negative" : "default"} />
        <Kpi
          label="Reste à vivre projeté"
          value={formatFCFA(plan.forecastRemainder)}
          tone={plan.forecastRemainder >= 0 ? "positive" : "negative"}
          hint={`Prévu initialement : ${formatFCFA(plan.plannedRemainder)}`}
        />
      </div>

      <SectionCard
        title={`Mon budget du mois — ${formatMonthFR(today.getFullYear(), today.getMonth() + 1)}`}
        description="Structure : charges fixes, variables, provisions, projets, investissements"
        icon={<Receipt className="size-4" />}
      >
        <div className="grid gap-2 text-sm">
          <BudgetRow label="Revenus attendus du foyer" value={plan.expectedIncome} kind="in" />
          <BudgetRow label="Budget de vie courante et charges mensuelles" value={plan.operatingBudget} kind="out" />
          <BudgetRow label="Provisions pour charges futures" value={plan.provisionsBudget} kind="out" />
          <BudgetRow label="Sécurité / épargne protégée" value={plan.securityBudget} kind="out" />
          <BudgetRow label="Projets du foyer" value={plan.projectBudget} kind="out" />
          <BudgetRow label="Investissements" value={plan.investmentBudget} kind="out" />
          <BudgetRow label="Marge de sécurité" value={plan.safetyMargin} kind="out" />
          <BudgetRow label="= Reste à vivre projeté" value={plan.forecastRemainder} kind="total" />
          <div className="mt-1 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-muted p-2.5">
              <p className="text-[10px] text-muted-foreground">Budget courant restant</p>
              <p className="text-sm font-bold tabular-nums">{formatFCFA(plan.remainingOperatingBudget)}</p>
            </div>
            <div className="rounded-lg bg-muted p-2.5">
              <p className="text-[10px] text-muted-foreground">Rythme de dépenses</p>
              <p className={`text-sm font-bold tabular-nums ${plan.spendingPace > 1.1 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {Math.round(plan.spendingPace * 100)} % du rythme prévu
              </p>
            </div>
            <div className="rounded-lg bg-muted p-2.5">
              <p className="text-[10px] text-muted-foreground">Dépenses non budgétées</p>
              <p className={`text-sm font-bold tabular-nums ${plan.unbudgetedSpending > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
                {formatFCFA(plan.unbudgetedSpending)}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Charges à venir — 120 jours"
        description="Échéances connues et niveau de provision disponible"
        icon={<CalendarCheck className="size-4" />}
      >
        {plan.upcomingCharges.length === 0 ? (
          <EmptyState title="Aucune échéance renseignée" description="Ajoute une date aux charges pour anticiper les sorties de trésorerie." />
        ) : (
          <div className="space-y-2">
            {plan.upcomingCharges.map((charge) => (
              <div key={charge.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{charge.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDateFR(charge.dueDate)} · {charge.daysUntilDue < 0 ? `${Math.abs(charge.daysUntilDue)} j de retard` : `dans ${charge.daysUntilDue} j`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold tabular-nums">{formatFCFA(charge.amount)}</p>
                  <p className={`text-[10px] tabular-nums ${charge.remainingToProvision > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {charge.remainingToProvision > 0 ? `${formatFCFA(charge.remainingToProvision)} à provisionner` : "provision couverte"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Prévisionnel vs réel par catégorie"
        description="Les dépassements sont affichés en rouge — clique sur un budget pour le modifier"
        icon={<Receipt className="size-4" />}
      >
        {budgetRows.length === 0 ? (
          <EmptyState title="Aucune catégorie" />
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="border-b text-left text-[11px] text-muted-foreground">
                  <th className="pb-2 font-medium">Élément</th>
                  <th className="pb-2 font-medium text-right">Budget</th>
                  <th className="pb-2 font-medium text-right">Réalisé</th>
                  <th className="pb-2 font-medium text-right">Écart</th>
                </tr>
              </thead>
              <tbody>
                {budgetRows.map(({ c, real, budget, ecart }) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 pr-2">
                      <button
                        className="font-medium text-[13px] hover:underline text-left"
                        onClick={() => {
                          setEditingCat(c.id);
                          setEditBudget(c.budgetMonthly);
                        }}
                      >
                        {c.name}
                        {c.essential && (
                          <span className="ml-1.5 text-[9px] text-primary font-semibold">essentiel</span>
                        )}
                      </button>
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {editingCat === c.id ? (
                        <div className="flex items-center gap-1 justify-end">
                          <div className="w-24">
                            <MoneyInput value={editBudget} onChange={setEditBudget} />
                          </div>
                          <Button
                            size="sm"
                            className="h-7"
                            onClick={async () => {
                              await mutate("category", "update", c.id, { budgetMonthly: editBudget });
                              setEditingCat(null);
                            }}
                          >
                            ✓
                          </Button>
                        </div>
                      ) : (
                        formatFCFA(budget)
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatFCFA(real)}</td>
                    <td
                      className={`py-2 text-right tabular-nums font-medium ${
                        budget > 0 && ecart > 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {budget > 0 ? `${ecart > 0 ? "+" : ""}${formatFCFA(ecart)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </>
  );
}

function BudgetRow({ label, value, kind }: { label: string; value: number; kind: "in" | "out" | "total" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 bg-muted/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`tabular-nums text-sm font-semibold ${
          kind === "in"
            ? "text-emerald-600 dark:text-emerald-400"
            : kind === "out"
              ? "text-red-600 dark:text-red-400"
              : "text-primary"
        }`}
      >
        {formatFCFA(value)}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onglet Enveloppes
// ---------------------------------------------------------------------------

function EnvelopesTab() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <EnvelopesInner state={state} />;
}

function EnvelopesInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState<EnvelopeGroup>("OBLIGATOIRE");
  const [budget, setBudget] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState("NONE");
  const [editingEnvelope, setEditingEnvelope] = useState<AppEnvelope | null>(null);

  const groups: EnvelopeGroup[] = ["OBLIGATOIRE", "SECURITE", "PROJETS", "INVESTISSEMENT", "PERSONNEL"];
  const summary = monthlySummary(state.transactions, new Date(state.today).getFullYear(), new Date(state.today).getMonth() + 1);

  const expenseCategories = state.categories.filter((category) =>
    ["EXPENSE", "DONATION"].includes(category.kind)
  );
  const spentForEnvelope = (envelope: AppEnvelope) => {
    const cat = envelope.categoryId
      ? state.categories.find((category) => category.id === envelope.categoryId)
      : state.categories.find(
          (category) =>
            category.name === envelope.name || envelope.name.startsWith(category.name)
        );
    return cat ? summary.byCategory.get(cat.name) || 0 : 0;
  };
  const resetForm = () => {
    setName("");
    setGroup("OBLIGATOIRE");
    setBudget(null);
    setCategoryId("NONE");
    setEditingEnvelope(null);
  };

  return (
    <>
      <SectionCard
        title="Enveloppes budgétaires"
        description="Budget · réservé · dépensé · disponible par enveloppe"
        icon={<Package className="size-4" />}
        action={
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            <Plus className="size-3.5 mr-1" /> Enveloppe
          </Button>
        }
      >
        {state.envelopes.length === 0 ? (
          <EmptyState title="Aucune enveloppe" description="Crée des enveloppes pour réserver de l'argent par objectif." />
        ) : (
          <div className="space-y-5">
            {groups.map((g) => {
              const envs = state.envelopes.filter((e) => e.group === g);
              if (envs.length === 0) return null;
              const totalBudget = envs.reduce((s, e) => s + e.budget, 0);
              const totalReserved = envs.reduce((s, e) => s + e.reserved, 0);
              return (
                <div key={g}>
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {ENVELOPE_GROUP_LABELS[g]}
                    </h3>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {formatFCFA(totalBudget)} / mois
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {envs.map((e) => {
                      const spent = spentForEnvelope(e);
                      const availablePool = e.budget + e.reserved;
                      const available = Math.max(0, availablePool - spent);
                      const used = availablePool > 0 ? spent / availablePool : 0;
                      return (
                        <div key={e.id} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[13px] font-medium truncate">{e.name}</p>
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-[11px] font-bold tabular-nums ${used > 1 ? "text-red-600 dark:text-red-400" : ""}`}
                              >
                                {Math.round(used * 100)} %
                              </span>
                              <button
                                className="text-muted-foreground hover:text-foreground"
                                aria-label={`Modifier ${e.name}`}
                                onClick={() => {
                                  setEditingEnvelope(e);
                                  setName(e.name);
                                  setGroup(e.group);
                                  setBudget(e.budget);
                                  setCategoryId(e.categoryId ?? "NONE");
                                  setOpen(true);
                                }}
                              >
                                <Pencil className="size-3.5" />
                              </button>
                              <button
                                className="text-muted-foreground hover:text-destructive"
                                aria-label={`Supprimer ${e.name}`}
                                onClick={() => mutate("envelope", "delete", e.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                          <ProgressStat
                            label="Dépensé ce mois"
                            value={spent}
                            max={Math.max(availablePool, 1)}
                            tone={used > 1 ? "danger" : "default"}
                          />
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Budget : {formatFCFA(e.budget)}</span>
                            <span>Disponible : {formatFCFA(available)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <MobileSheet
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetForm();
        }}
        title={editingEnvelope ? "Modifier l'enveloppe" : "Nouvelle enveloppe"}
      >
        <div className="space-y-3">
          <Field label="Nom">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Vacances" />
          </Field>
          <Field label="Groupe">
            <Select value={group} onValueChange={(v) => setGroup(v as EnvelopeGroup)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {ENVELOPE_GROUP_LABELS[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Budget mensuel">
            <MoneyInput value={budget} onChange={setBudget} />
          </Field>
          <Field label="Catégorie suivie (recommandé)">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Aucune catégorie</SelectItem>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Le réalisé sera calculé automatiquement depuis les transactions de cette catégorie.
            </p>
          </Field>
          <SaveButton
            onSave={async () => {
              if (!name.trim()) return;
              await mutate(
                "envelope",
                editingEnvelope ? "update" : "create",
                editingEnvelope?.id,
                {
                  name,
                  group,
                  budget: budget ?? 0,
                  categoryId: categoryId === "NONE" ? null : categoryId,
                }
              );
              setOpen(false);
              resetForm();
            }}
            label={editingEnvelope ? "Mettre à jour" : "Créer"}
          />
        </div>
      </MobileSheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Onglet Charges récurrentes
// ---------------------------------------------------------------------------

function ChargesTab() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <ChargesInner state={state} />;
}

function ChargesInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [provisionFor, setProvisionFor] = useState<string | null>(null);
  const [provisionAmount, setProvisionAmount] = useState<number | null>(null);
  // formulaire
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<Frequency>("MONTHLY");
  const [nextDue, setNextDue] = useState("");
  const [provision, setProvision] = useState(false);
  const today = new Date(state.today);

  const monthlyEquivalent = (freq: string, amt: number) =>
    freq === "ANNUAL" ? Math.round(amt / 12) : freq === "QUARTERLY" ? Math.round(amt / 3) : amt;

  return (
    <>
      <SectionCard
        title="Charges récurrentes"
        description="Mensuelles, trimestrielles, annuelles — avec provisions"
        icon={<Receipt className="size-4" />}
        action={
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setOpen(true)}>
            <Plus className="size-3.5 mr-1" /> Charge
          </Button>
        }
      >
        {state.charges.length === 0 ? (
          <EmptyState title="Aucune charge récurrente" />
        ) : (
          <div className="space-y-2">
            {state.charges.map((c) => {
              const monthsToDue = c.nextDueDate
                ? Math.max(0, Math.round((new Date(c.nextDueDate).getTime() - today.getTime()) / (30.4 * 86400000)))
                : null;
              const remaining = Math.max(0, c.amount - c.provisioned);
              const recommended =
                c.frequency !== "MONTHLY" && monthsToDue && monthsToDue > 0
                  ? Math.ceil(remaining / monthsToDue)
                  : 0;
              return (
                <div key={c.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium flex items-center gap-1.5 flex-wrap">
                        {c.label}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {FREQUENCY_LABELS[c.frequency]}
                        </span>
                        {!c.active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            suspendue
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatFCFA(c.amount)}
                        {c.frequency !== "MONTHLY" && (
                          <span className="ml-1.5">({formatFCFA(monthlyEquivalent(c.frequency, c.amount))}/mois)</span>
                        )}
                        {c.nextDueDate && (
                          <span className="ml-1.5">
                            · prochaine échéance {formatDateFR(c.nextDueDate)}
                            {monthsToDue !== null && monthsToDue <= 3 && (
                              <span className="text-amber-600 dark:text-amber-400 font-medium"> (dans ~{monthsToDue} mois)</span>
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label={`Supprimer ${c.label}`}
                      onClick={() => mutate("charge", "delete", c.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  {c.frequency !== "MONTHLY" && (
                    <div className="rounded-md bg-muted/60 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          Provisionné : <b>{formatFCFA(c.provisioned)}</b> / {formatFCFA(c.amount)}
                        </span>
                        {recommended > 0 && (
                          <span className="text-muted-foreground">
                            Recommandé : <b className="text-primary">{formatFCFA(recommended)}/mois</b>
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, (c.provisioned / c.amount) * 100)}%` }}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[11px]"
                        onClick={() => {
                          setProvisionFor(c.id);
                          setProvisionAmount(recommended || null);
                        }}
                      >
                        <PiggyBank className="size-3 mr-1" /> Provisionner
                      </Button>
                      <p className="text-[10px] text-muted-foreground">
                        La provision réserve l&apos;argent sans créer de dépense réelle.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Sheet provision */}
      <MobileSheet
        open={provisionFor !== null}
        onOpenChange={(o) => !o && setProvisionFor(null)}
        title="Provisionner cette charge"
        description="L'argent est marqué comme réservé — aucune dépense réelle n'est créée."
      >
        <div className="space-y-3">
          <Field label="Montant à provisionner">
            <MoneyInput value={provisionAmount} onChange={setProvisionAmount} />
          </Field>
          <SaveButton
            onSave={async () => {
              if (!provisionFor || !provisionAmount) return;
              await mutate("provisionCharge", "custom", provisionFor, { amount: provisionAmount });
              toast({ title: "Provision enregistrée", description: "L'argent est réservé (pas de dépense réelle)." });
              setProvisionFor(null);
            }}
            label="Réserver"
          />
        </div>
      </MobileSheet>

      {/* Sheet nouvelle charge */}
      <MobileSheet open={open} onOpenChange={setOpen} title="Nouvelle charge récurrente">
        <div className="space-y-3">
          <Field label="Libellé">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Loyer" />
          </Field>
          <Field label="Montant par échéance">
            <MoneyInput value={amount} onChange={setAmount} />
          </Field>
          <Field label="Fréquence">
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                  <SelectItem key={f} value={f}>
                    {FREQUENCY_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Prochaine échéance">
            <Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
          </Field>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-[13px] font-medium">Provision mensuelle</p>
              <p className="text-[11px] text-muted-foreground">Réserver progressivement avant l&apos;échéance</p>
            </div>
            <Switch checked={provision} onCheckedChange={setProvision} />
          </div>
          <SaveButton
            onSave={async () => {
              if (!label.trim() || !amount) return;
              await mutate("charge", "create", undefined, {
                label,
                amount,
                frequency,
                nextDueDate: nextDue || null,
                provision,
                active: true,
              });
              setOpen(false);
              setLabel("");
              setAmount(null);
              setNextDue("");
              setProvision(false);
            }}
          />
        </div>
      </MobileSheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Onglet Clôture mensuelle
// ---------------------------------------------------------------------------

function ClotureTab() {
  const { state } = useLifeOS();
  const [selected, setSelected] = useState(() => {
    const d = new Date(state?.today ?? Date.now());
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  if (!state) return null;
  return (
    <ClotureInner
      state={state}
      selected={selected}
      setSelected={setSelected}
      realBalance={realBalance}
      setRealBalance={setRealBalance}
      notes={notes}
      setNotes={setNotes}
    />
  );
}

function ClotureInner({
  state,
  selected,
  setSelected,
  realBalance,
  setRealBalance,
  notes,
  setNotes,
}: {
  state: LifeOSState;
  selected: { year: number; month: number };
  setSelected: (s: { year: number; month: number }) => void;
  realBalance: number | null;
  setRealBalance: (v: number | null) => void;
  notes: string;
  setNotes: (s: string) => void;
}) {
  const { mutate } = useLifeOS();
  const { toast } = useToast();

  const summary = useMemo(
    () => monthlySummary(state.transactions, selected.year, selected.month),
    [state.transactions, selected]
  );
  const snapshot = state.snapshots.find((s) => s.year === selected.year && s.month === selected.month);

  const months = useMemo(() => {
    const list: { year: number; month: number }[] = [];
    const now = new Date(state.today);
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return list;
  }, [state.today]);

  return (
    <>
      <SectionCard
        title="Clôturer mon mois"
        description="Compare le solde calculé avec le solde réel, puis archive un snapshot"
        icon={<CalendarCheck className="size-4" />}
        action={
          <Select
            value={`${selected.year}-${selected.month}`}
            onValueChange={(v) => {
              const [y, m] = v.split("-").map(Number);
              setSelected({ year: y, month: m });
              const snap = state.snapshots.find((s) => s.year === y && s.month === m);
              setRealBalance(snap?.realBalance ?? null);
            }}
          >
            <SelectTrigger className="h-7 text-xs w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                  {formatMonthFR(m.year, m.month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Kpi label="Revenus" value={formatFCFA(summary.income)} tone="positive" />
          <Kpi label="Dépenses" value={formatFCFA(summary.expenses)} tone="negative" />
          <Kpi label="Épargne nette" value={formatFCFA(summary.netSavings)} tone={summary.netSavings >= 0 ? "positive" : "negative"} />
          <Kpi label="Investissements" value={formatFCFA(summary.invested)} tone="accent" />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Solde réel constaté (tous comptes, à la fin du mois)">
            <MoneyInput value={realBalance} onChange={setRealBalance} />
          </Field>
          <Field label="Notes de clôture">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observations du mois…" />
          </Field>
        </div>

        {snapshot?.computedBalance !== null && snapshot?.computedBalance !== undefined && realBalance !== null && (
          <div
            className={`mt-3 rounded-lg p-3 text-sm ${
              Math.abs((snapshot.computedBalance ?? 0) - realBalance) < 1
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {Math.abs((snapshot.computedBalance ?? 0) - realBalance) < 1 ? (
              "✓ Soldes reconciliés — aucune différence détectée."
            ) : (
              <>
                <b>Écart détecté : {formatFCFA(realBalance - (snapshot.computedBalance ?? 0))}.</b>{" "}
                Ajoute une transaction manquante, corrige une opération, ou crée un ajustement
                (type « Ajustement ») depuis la saisie rapide.
              </>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              await mutate("closeMonth", "custom", undefined, {
                year: selected.year,
                month: selected.month,
                realBalance,
                notes: notes || null,
              });
              toast({
                title: "Mois clôturé",
                description: `${formatMonthFR(selected.year, selected.month)} archivé dans l'historique.`,
              });
            }}
          >
            <CalendarCheck className="size-4 mr-1.5" />
            {snapshot ? "Mettre à jour la clôture" : "Clôturer ce mois"}
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Historique des snapshots"
        description="Évolution mensuelle : revenus, dépenses, épargne, patrimoine"
        icon={<ShieldCheck className="size-4" />}
      >
        {state.snapshots.length === 0 ? (
          <EmptyState title="Aucun mois clôturé" description="Clôture ton premier mois pour commencer l'historique." />
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b text-left text-[11px] text-muted-foreground">
                  <th className="pb-2 font-medium">Mois</th>
                  <th className="pb-2 font-medium text-right">Revenus</th>
                  <th className="pb-2 font-medium text-right">Dépenses</th>
                  <th className="pb-2 font-medium text-right">Épargne</th>
                  <th className="pb-2 font-medium text-right">Patrimoine</th>
                </tr>
              </thead>
              <tbody>
                {state.snapshots.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 font-medium text-[13px]">{formatMonthFR(s.year, s.month)}</td>
                    <td className="py-2 text-right tabular-nums">{formatFCFA(s.income)}</td>
                    <td className="py-2 text-right tabular-nums">{formatFCFA(s.expenses)}</td>
                    <td
                      className={`py-2 text-right tabular-nums font-medium ${
                        s.savings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatFCFA(s.savings)}
                    </td>
                    <td className="py-2 text-right tabular-nums">{formatFCFA(s.netWorth)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </>
  );
}
