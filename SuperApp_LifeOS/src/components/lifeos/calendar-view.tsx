"use client";

// Life OS — Calendrier financier : échéances, pression par mois, actions
import { useMemo, useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import { SectionCard, EmptyState, Field, MobileSheet, SaveButton, PriorityBadge } from "@/components/lifeos/ui-bits";
import { formatFCFA, formatDateFR, todayInputDate, toInputDate } from "@/lib/lifeos/format";
import { MONTHS_FR_SHORT, PRIORITY_LABELS } from "@/lib/lifeos/constants";
import { goalFunding, projectFunding } from "@/lib/lifeos/engine";
import type { Priority } from "@/lib/lifeos/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Plus, Trash2, AlertTriangle, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LifeOSState } from "@/lib/lifeos/types";

export function CalendarView() {
  const { state } = useLifeOS();
  const [monthOffset, setMonthOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayInputDate());
  const [priority, setPriority] = useState<Priority>("MOYENNE");

  if (!state) return null;
  return (
    <CalendarInner
      state={state}
      monthOffset={monthOffset}
      setMonthOffset={setMonthOffset}
      open={open}
      setOpen={setOpen}
      title={title}
      setTitle={setTitle}
      dueDate={dueDate}
      setDueDate={setDueDate}
      priority={priority}
      setPriority={setPriority}
    />
  );
}

function CalendarInner({
  state,
  monthOffset,
  setMonthOffset,
  open,
  setOpen,
  title,
  setTitle,
  dueDate,
  setDueDate,
  priority,
  setPriority,
}: {
  state: LifeOSState;
  monthOffset: number;
  setMonthOffset: (n: number) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  title: string;
  setTitle: (s: string) => void;
  dueDate: string;
  setDueDate: (s: string) => void;
  priority: Priority;
  setPriority: (p: Priority) => void;
}) {
  const { mutate } = useLifeOS();
  const today = new Date(state.today);
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);

  // Événements du mois affiché (calcul direct — peu coûteux)
  const monthEvents = (() => {
    const events: { title: string; date: Date; amount: number | null; kind: string; urgent: boolean }[] = [];
    const y = today.getFullYear();
    const m = today.getMonth() + monthOffset;
    const inMonth = (d: Date) => d.getFullYear() === y && d.getMonth() === m;

    for (const c of state.charges) {
      if (!c.active || !c.nextDueDate) continue;
      const d = new Date(c.nextDueDate);
      if (inMonth(d)) events.push({ title: c.label, date: d, amount: c.amount, kind: "Charge", urgent: false });
    }
    for (const g of state.goals) {
      if (!g.targetDate || ["TERMINE", "ANNULE", "REPORTE"].includes(g.status)) continue;
      if (g.isSuggested && g.suggestedState !== "ACCEPTED") continue;
      const d = new Date(g.targetDate);
      if (inMonth(d)) events.push({ title: g.title, date: d, amount: g.budget, kind: "Objectif", urgent: g.priority === "CRITIQUE" });
    }
    for (const p of state.projects) {
      if (p.archived || !p.targetDate) continue;
      const d = new Date(p.targetDate);
      if (inMonth(d)) events.push({ title: p.name, date: d, amount: p.budget, kind: "Projet", urgent: p.priority === "CRITIQUE" });
    }
    for (const a of state.actions) {
      if (!a.dueDate) continue;
      const d = new Date(a.dueDate);
      if (inMonth(d)) events.push({ title: a.title, date: d, amount: null, kind: "Action", urgent: false });
    }
    return [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  })();

  // Pression financière par mois (12 prochains mois)
  const pressure = useMemo(() => {
    const map = new Map<string, number>();
    const add = (d: Date, amount: number) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map.set(key, (map.get(key) ?? 0) + amount);
    };
    for (const c of state.charges) {
      if (!c.active || !c.nextDueDate) continue;
      const d = new Date(c.nextDueDate);
      add(d, c.amount);
    }
    for (const g of state.goals) {
      if (!g.targetDate || !g.budget || ["TERMINE", "ANNULE", "REPORTE"].includes(g.status)) continue;
      if (g.isSuggested && g.suggestedState !== "ACCEPTED") continue;
      add(
        new Date(g.targetDate),
        g.budget - goalFunding(g, state.fundAllocations)
      );
    }
    for (const p of state.projects) {
      if (p.archived || !p.targetDate || !p.budget) continue;
      const funding = projectFunding(p, state.transactions, state.fundAllocations);
      add(new Date(p.targetDate), Math.max(0, p.budget - funding.funded));
    }
    return map;
  }, [state]);

  const next12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    return { date: d, key: `${d.getFullYear()}-${d.getMonth()}`, amount: pressure.get(`${d.getFullYear()}-${d.getMonth()}`) ?? 0 };
  });
  const maxPressure = Math.max(1, ...next12.map((m) => m.amount));

  const actionsWithDue = state.actions.filter((a) => a.dueDate);
  const overdue = actionsWithDue.filter((a) => !a.done && new Date(a.dueDate!) < today);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="size-5 text-primary" />
          Calendrier financier
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Échéances, charges, projets · identification des mois à forte pression financière
        </p>
      </div>

      {/* Pression financière 12 mois */}
      <SectionCard
        title="Pression financière — 12 prochains mois"
        description="Somme des échéances (charges + restes à financer des objectifs et projets)"
        icon={<AlertTriangle className="size-4" />}
      >
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {next12.map((m) => {
            const intensity = m.amount / maxPressure;
            return (
              <button
                key={m.key}
                onClick={() => setMonthOffset(next12.findIndex((x) => x.key === m.key))}
                className={cn(
                  "rounded-lg p-1.5 text-center border transition-all hover:scale-105",
                  m.key === `${viewDate.getFullYear()}-${viewDate.getMonth()}` && "ring-2 ring-primary"
                )}
                style={{
                  backgroundColor:
                    intensity > 0.66
                      ? "rgb(254 226 226)"
                      : intensity > 0.33
                        ? "rgb(254 243 199)"
                        : "rgb(220 252 231)",
                }}
                title={`${MONTHS_FR_SHORT[m.date.getMonth()]} ${m.date.getFullYear()} : ${formatFCFA(m.amount)}`}
              >
                <p className="text-[9px] font-medium text-muted-foreground">{MONTHS_FR_SHORT[m.date.getMonth()]}</p>
                <p className="text-[9px] font-bold tabular-nums">
                  {m.amount > 0 ? `${Math.round(m.amount / 1000)}k` : "—"}
                </p>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Rouge = forte pression · ambre = moyenne · vert = faible. Clique sur un mois pour voir ses échéances.
        </p>
      </SectionCard>

      {/* Événements du mois */}
      <SectionCard
        title={`Échéances — ${viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`}
        icon={<CalendarDays className="size-4" />}
        action={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setMonthOffset(monthOffset - 1)} aria-label="Mois précédent">
              ←
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setMonthOffset(0)} aria-label="Mois courant">
              •
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => setMonthOffset(monthOffset + 1)} aria-label="Mois suivant">
              →
            </Button>
          </div>
        }
      >
        {monthEvents.length === 0 ? (
          <EmptyState title="Aucune échéance ce mois-ci" />
        ) : (
          <ul className="space-y-1.5">
            {monthEvents.map((e, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
                  e.urgent && "border-l-4 border-l-red-500"
                )}
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium truncate">{e.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {e.kind} · {formatDateFR(e.date.toISOString())}
                    {e.date < today && e.date.toDateString() !== today.toDateString() && (
                      <span className="text-red-500 font-medium"> (dépassé)</span>
                    )}
                  </p>
                </div>
                {e.amount !== null && e.amount > 0 && (
                  <span className="text-[12px] font-bold tabular-nums shrink-0">{formatFCFA(e.amount)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Actions */}
      <SectionCard
        title={`Mes actions (${state.actions.filter((a) => !a.done).length} en cours)`}
        description={overdue.length > 0 ? `⚠ ${overdue.length} action(s) en retard` : "Aucun retard"}
        icon={<ListTodo className="size-4" />}
        action={
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              setTitle("");
              setDueDate(todayInputDate());
              setPriority("MOYENNE");
              setOpen(true);
            }}
          >
            <Plus className="size-3.5 mr-1" /> Action
          </Button>
        }
      >
        {state.actions.length === 0 ? (
          <EmptyState title="Aucune action" description="Ajoute les prochaines étapes de tes projets." />
        ) : (
          <ul className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {state.actions.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border px-3 py-2",
                  a.done && "opacity-50"
                )}
              >
                <Checkbox
                  checked={a.done}
                  onCheckedChange={() => mutate("action", "update", a.id, { done: !a.done })}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-medium leading-snug ${a.done ? "line-through" : ""}`}>{a.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.dueDate && (
                      <span
                        className={cn(
                          "text-[11px]",
                          !a.done && new Date(a.dueDate) < today ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
                        )}
                      >
                        {formatDateFR(a.dueDate)}
                      </span>
                    )}
                    <PriorityBadge priority={a.priority} />
                  </div>
                </div>
                <button
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label={`Supprimer ${a.title}`}
                  onClick={() => mutate("action", "delete", a.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <MobileSheet open={open} onOpenChange={setOpen} title="Nouvelle action">
        <div className="space-y-3">
          <Field label="Titre">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Demander un devis" />
          </Field>
          <Field label="Échéance">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Priorité">
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <SaveButton
            onSave={async () => {
              if (!title.trim()) return;
              await mutate("action", "create", undefined, { title, dueDate, priority });
              setOpen(false);
            }}
          />
        </div>
      </MobileSheet>
    </div>
  );
}
