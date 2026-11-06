"use client";

// Life OS — Projets : budget, jalons, financement multi-sources, dépenses
import { useMemo, useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
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
  ExplainDialog,
  ExplainLine,
} from "@/components/lifeos/ui-bits";
import {
  computeAvailableCash,
  computeCapacity,
  projectFunding,
} from "@/lib/lifeos/engine";
import { formatFCFA, formatDateFR, toInputDate } from "@/lib/lifeos/format";
import type { DataVisibility, GoalStatus, Priority, LifeOSState } from "@/lib/lifeos/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderKanban,
  Plus,
  Trash2,
  Pencil,
  Milestone,
  PiggyBank,
  Home,
  Heart,
  Bike,
  Car,
  Store,
  Gift,
  Wrench,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { canEdit, clientItemAccess } from "@/lib/lifeos/permissions";

const PROJECT_ICONS = [Home, Heart, Bike, Car, Store, Gift, Wrench, FolderKanban];
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

export function ProjectsView() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <ProjectsInner state={state} />;
}

function ProjectsInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  // formulaire projet
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<Priority>("HAUTE");
  const [status, setStatus] = useState<GoalStatus>("PLANIFIE");
  const [iconIdx, setIconIdx] = useState(7);
  const [visibility, setVisibility] = useState<DataVisibility>("SHARED");
  // jalons
  const [milestoneFor, setMilestoneFor] = useState<string | null>(null);
  const [msTitle, setMsTitle] = useState("");
  const [msAmount, setMsAmount] = useState<number | null>(null);
  // financement
  const [fundFor, setFundFor] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState<number | null>(null);
  const [fundAccountId, setFundAccountId] = useState("");
  const { toast } = useToast();

  const today = new Date(state.today);
  const capacity = useMemo(() => computeCapacity(state, today), [state, today]);
  const availableCash = useMemo(() => computeAvailableCash(state), [state]);
  const canCreateProject = canEdit(state.couple?.permissions.projects ?? "EDIT");

  const projects = state.projects.filter((p) => !p.archived);

  const openForm = (id?: string) => {
    if (id) {
      const p = state.projects.find((x) => x.id === id);
      if (!p) return;
      setEditId(id);
      setName(p.name);
      setDescription(p.description ?? "");
      setBudget(p.budget);
      setTargetDate(toInputDate(p.targetDate));
      setPriority(p.priority);
      setStatus(p.status);
      setIconIdx(7);
      setVisibility(p.visibility ?? "SHARED");
    } else {
      setEditId(null);
      setName("");
      setDescription("");
      setBudget(null);
      setTargetDate("");
      setPriority("HAUTE");
      setStatus("PLANIFIE");
      setIconIdx(7);
      setVisibility("SHARED");
    }
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FolderKanban className="size-5 text-primary" />
            Projets
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Financement multi-sources · jalons · progression physique et financière
          </p>
        </div>
        <Button size="sm" disabled={!canCreateProject} onClick={() => openForm()}>
          <Plus className="size-4 mr-1" /> Projet
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState title="Aucun projet" description="Crée un projet pour structurer son financement." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {projects.map((p) => {
            const f = projectFunding(p, state.transactions, state.fundAllocations);
            const isOpen = expanded === p.id;
            const Icon = PROJECT_ICONS[iconIdx] ?? FolderKanban;
            const editable = canEdit(
              clientItemAccess(state.couple, "projects", "PROJECT", p.id)
            );
            return (
              <div key={p.id} className="rounded-xl border bg-card overflow-hidden">
                <button
                  className="w-full flex items-start gap-3 p-4 text-left"
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold">{p.name}</p>
                      <PriorityBadge priority={p.priority} />
                      <StatusBadge status={p.status} />
                      <Badge variant="outline" className="text-[9px]">
                        {(p.visibility ?? "SHARED") === "PERSONAL"
                          ? "Personnel"
                          : "Partage"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {p.budget === null
                        ? "Budget : à estimer"
                        : `Budget : ${formatFCFA(p.budget)}`}
                      {p.targetDate ? ` · échéance ${formatDateFR(p.targetDate)}` : ""}
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {p.budget !== null && (
                        <ProgressStat
                          label="Financement"
                          value={f.funded}
                          max={p.budget}
                          tone={f.financialProgress < 0.5 ? "warning" : "success"}
                        />
                      )}
                      <ProgressStat
                        label="Progression physique"
                        value={p.physicalProgress}
                        max={100}
                        format={(n) => `${Math.round(n)} %`}
                      />
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t px-4 py-3 space-y-3 bg-muted/20">
                    {p.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                    )}

                    {/* Financement détaillé */}
                    <div className="rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Financement
                        </p>
                        {p.budget !== null && (
                          <ExplainDialog title={`Financement ${p.name}`}>
                            <ExplainLine label="Budget prévisionnel" value={formatFCFA(p.budget)} />
                            <ExplainLine label="Affectations de fonds (financé)" value={formatFCFA(f.funded)} kind="in" />
                            <ExplainLine label="Dépenses réelles rattachées" value={formatFCFA(f.spent)} kind="out" />
                            <ExplainLine label="Disponible projet (financé − dépensé)" value={formatFCFA(f.available)} />
                            <ExplainLine label="Reste à financer (budget − financé)" value={formatFCFA(f.remainingToFund)} kind="total" />
                          </ExplainDialog>
                        )}
                      </div>
                      {p.budget !== null ? (
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <span className="text-muted-foreground">Financé : <b className="text-foreground">{formatFCFA(f.funded)}</b></span>
                          <span className="text-muted-foreground">Dépensé : <b className="text-foreground">{formatFCFA(f.spent)}</b></span>
                          <span className="text-muted-foreground">Disponible : <b className="text-foreground">{formatFCFA(f.available)}</b></span>
                          <span className="text-muted-foreground">Reste à financer : <b className="text-foreground">{formatFCFA(f.remainingToFund)}</b></span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">
                          Renseigne un budget pour suivre le financement.
                        </p>
                      )}
                      {f.remainingToFund > 0 && capacity.savingsCapacity > 0 && (
                        <p className="mt-2 text-[10px] text-muted-foreground">
                          À ta capacité actuelle ({formatFCFA(capacity.savingsCapacity)}/mois), il faudrait{" "}
                          {Math.ceil(f.remainingToFund / capacity.savingsCapacity)} mois pour compléter.
                        </p>
                      )}
                    </div>

                    {/* Jalons */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Jalons
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[11px]"
                          disabled={!editable}
                          onClick={() => {
                            setMilestoneFor(p.id);
                            setMsTitle("");
                            setMsAmount(null);
                          }}
                        >
                          <Plus className="size-3 mr-1" /> Jalon
                        </Button>
                      </div>
                      {(p.milestones ?? []).length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">Aucun jalon.</p>
                      ) : (
                        <ul className="space-y-1">
                          {(p.milestones ?? []).map((m) => (
                            <li key={m.id} className="flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5">
                              <Checkbox
                                checked={m.done}
                                disabled={!editable}
                                onCheckedChange={() => mutate("milestone", "update", m.id, { done: !m.done })}
                              />
                              <span className={`text-xs flex-1 ${m.done ? "line-through text-muted-foreground" : ""}`}>
                                {m.title}
                              </span>
                              {m.amount !== null && (
                                <span className="text-[10px] tabular-nums text-muted-foreground">{formatFCFA(m.amount)}</span>
                              )}
                              <button
                                className="text-muted-foreground hover:text-destructive"
                                disabled={!editable}
                                aria-label="Supprimer le jalon"
                                onClick={() => mutate("milestone", "delete", m.id)}
                              >
                                <Trash2 className="size-3" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={!editable}
                        onClick={() => {
                          setFundFor(p.id);
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
                        <PiggyBank className="size-3 mr-1" /> Affecter des fonds
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!editable} onClick={() => openForm(p.id)}>
                        <Pencil className="size-3 mr-1" /> Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        disabled={!editable}
                        onClick={() => mutate("project", "delete", p.id)}
                      >
                        <Trash2 className="size-3 mr-1" /> Supprimer
                      </Button>
                    </div>
                    {state.fundAllocations.some(
                      (allocation) =>
                        allocation.projectId === p.id && allocation.status === "ACTIVE"
                    ) && (
                      <div className="space-y-1 rounded-lg border bg-card p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Fonds reserves par compte
                        </p>
                        {state.fundAllocations
                          .filter(
                            (allocation) =>
                              allocation.projectId === p.id &&
                              allocation.status === "ACTIVE"
                          )
                          .map((allocation) => (
                            <div
                              key={allocation.id}
                              className="flex items-center justify-between gap-2 text-xs"
                            >
                              <span>
                                {state.accounts.find(
                                  (account) => account.id === allocation.accountId
                                )?.name ?? "Compte"}{" "}
                                · {formatFCFA(allocation.amount)}
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
                                Liberer
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Formulaire projet */}
      <MobileSheet
        open={open}
        onOpenChange={setOpen}
        title={editId ? "Modifier le projet" : "Nouveau projet"}
        description="Budget « à estimer » possible pour la construction ou le mariage."
      >
        <div className="space-y-3">
          <Field label="Nom du projet">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Construction maison" />
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
          <Field label="Budget prévisionnel (vide = à estimer)">
            <MoneyInput value={budget} onChange={setBudget} />
          </Field>
          <Field label="Date cible">
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>
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
          <SaveButton
            onSave={async () => {
              if (!name.trim()) return;
              const data = {
                name,
                description: description || null,
                budget,
                targetDate: targetDate || null,
                priority,
                status,
                visibility,
              };
              if (editId) await mutate("project", "update", editId, data);
              else await mutate("project", "create", undefined, data);
              setOpen(false);
            }}
          />
        </div>
      </MobileSheet>

      {/* Nouveau jalon */}
      <MobileSheet
        open={milestoneFor !== null}
        onOpenChange={(o) => !o && setMilestoneFor(null)}
        title="Nouveau jalon"
        description="Ex : terminer le gros œuvre, acheter les matériaux…"
      >
        <div className="space-y-3">
          <Field label="Titre du jalon">
            <Input value={msTitle} onChange={(e) => setMsTitle(e.target.value)} />
          </Field>
          <Field label="Coût estimé (optionnel)">
            <MoneyInput value={msAmount} onChange={setMsAmount} />
          </Field>
          <SaveButton
            onSave={async () => {
              if (!milestoneFor || !msTitle.trim()) return;
              await mutate("milestone", "create", undefined, {
                projectId: milestoneFor,
                title: msTitle,
                amount: msAmount,
              });
              setMilestoneFor(null);
            }}
          />
        </div>
      </MobileSheet>

      {/* Affectation de fonds projet */}
      <MobileSheet
        open={fundFor !== null}
        onOpenChange={(o) => !o && setFundFor(null)}
        title="Affecter des fonds au projet"
        description="L'argent est marqué comme réservé pour ce projet — aucune dépense réelle n'est créée."
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
          <Field label="Montant">
            <MoneyInput value={fundAmount} onChange={setFundAmount} />
          </Field>
          <SaveButton
            label="Affecter"
            onSave={async () => {
              if (!fundFor || !fundAmount || !fundAccountId) return;
              const p = state.projects.find((x) => x.id === fundFor);
              const result = await mutate("fundAllocation", "create", undefined, {
                amount: fundAmount,
                accountId: fundAccountId,
                projectId: fundFor,
                note: `Affectation de fonds — ${p?.name ?? "projet"}`,
              });
              if (!result) return;
              toast({ title: "Fonds affectés", description: formatFCFA(fundAmount) });
              setFundFor(null);
            }}
          />
        </div>
      </MobileSheet>
    </div>
  );
}
