"use client";

// Life OS — Saisie rapide mobile (« + Ajouter »)
// Dépense / Revenu / Don / Investissement / Transfert / Projet en quelques secondes.
import { useMemo, useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import { MobileSheet } from "@/components/lifeos/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ArrowDownCircle, ArrowUpCircle, HeartHandshake, TrendingUp, ArrowLeftRight, FolderKanban, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { todayInputDate, formatFCFA } from "@/lib/lifeos/format";
import { useToast } from "@/hooks/use-toast";
import type { TransactionType } from "@/lib/lifeos/types";
import { LIFEOS_CAPTURE_EVENT } from "@/components/lifeos/universal-capture";

const TYPES: {
  id: TransactionType;
  label: string;
  icon: typeof Plus;
  color: string;
}[] = [
  { id: "EXPENSE", label: "Dépense", icon: ArrowDownCircle, color: "text-red-600 dark:text-red-400" },
  { id: "INCOME", label: "Revenu", icon: ArrowUpCircle, color: "text-emerald-600 dark:text-emerald-400" },
  { id: "DONATION", label: "Don", icon: HeartHandshake, color: "text-amber-600 dark:text-amber-400" },
  { id: "INVESTMENT", label: "Investissement", icon: TrendingUp, color: "text-primary" },
  { id: "TRANSFER", label: "Transfert", icon: ArrowLeftRight, color: "text-sky-600 dark:text-sky-400" },
  { id: "PROJECT", label: "Projet", icon: FolderKanban, color: "text-violet-600 dark:text-violet-400" },
];

export function QuickAddButton() {
  const state = useLifeOS((store) => store.state);
  if (!state) return null;
  return (
    <button
      onClick={() => window.dispatchEvent(new Event(LIFEOS_CAPTURE_EVENT))}
      className="fixed right-4 bottom-20 lg:bottom-6 z-50 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all pl-3.5 pr-4 py-3 font-semibold text-sm"
      aria-label="Ouvrir la capture universelle"
    >
      <Plus className="size-5" />
      <span className="hidden sm:inline">Ajouter</span>
    </button>
  );
}

interface Favorite {
  key: string;
  type: TransactionType;
  category: string | null;
  categoryId: string | null;
  amount: number;
  count: number;
}

export function QuickAddSheet() {
  const { state, quickAddOpen, setQuickAddOpen, mutate } = useLifeOS();
  const { toast } = useToast();
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState<number | null>(null);
  const [accountId, setAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [goalId, setGoalId] = useState<string>("");
  const [date, setDate] = useState(todayInputDate());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const accounts = useMemo(
    () => (state?.accounts ?? []).filter((a) => !a.archived),
    [state]
  );
  const categories = useMemo(() => {
    const cats = state?.categories ?? [];
    if (type === "INCOME") return cats.filter((c) => c.kind === "INCOME");
    if (type === "DONATION") return cats.filter((c) => c.kind === "DONATION");
    if (type === "INVESTMENT") return cats.filter((c) => c.kind === "INVESTMENT");
    return cats.filter((c) => c.kind === "EXPENSE");
  }, [state, type]);

  // Favoris : combinaisons (type, catégorie, montant) les plus fréquentes
  const favorites = useMemo<Favorite[]>(() => {
    const counts = new Map<string, Favorite>();
    for (const t of state?.transactions ?? []) {
      const key = `${t.type}|${t.categoryId ?? t.category ?? ""}|${t.amount}`;
      const existing = counts.get(key);
      if (existing) existing.count++;
      else
        counts.set(key, {
          key,
          type: t.type,
          category: t.category,
          categoryId: t.categoryId,
          amount: t.amount,
          count: 1,
        });
    }
    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .filter((f) => f.type === "EXPENSE" || f.type === "DONATION")
      .slice(0, 4);
  }, [state]);

  const reset = () => {
    setAmount(null);
    setNote("");
    setProjectId("");
    setGoalId("");
    setCategoryId("");
  };

  const save = async () => {
    if (!state) return;
    if (!amount || amount <= 0) {
      toast({ title: "Montant requis", variant: "destructive" });
      return;
    }
    const acct = accountId || state.settings.defaultAccountId || accounts[0]?.id;
    if (!acct) {
      toast({ title: "Crée d'abord un compte", variant: "destructive" });
      return;
    }
    if (type === "TRANSFER" && !toAccountId) {
      toast({ title: "Choisis le compte destination", variant: "destructive" });
      return;
    }
    if (type === "PROJECT" && !projectId) {
      toast({ title: "Choisis le projet", variant: "destructive" });
      return;
    }
    setSaving(true);
    const ok =
      type === "PROJECT"
        ? await mutate("fundAllocation", "create", undefined, {
            amount,
            accountId: acct,
            projectId,
            note: note || null,
          })
        : await mutate("transaction", "create", undefined, {
            type,
            amount,
            accountId: acct,
            toAccountId:
              type === "TRANSFER" || type === "INVESTMENT" ? toAccountId : null,
            categoryId: categoryId || null,
            date: new Date(date + "T12:00:00").toISOString(),
            description: note || null,
            projectId:
              (type === "EXPENSE" || type === "DONATION") && projectId
                ? projectId
                : null,
            goalId:
              (type === "EXPENSE" || type === "DONATION") && goalId
                ? goalId
                : null,
          });
    setSaving(false);
    if (ok) {
      toast({
        title: type === "PROJECT" ? "Fonds réservés" : "Opération enregistrée",
        description: `${formatFCFA(amount)} · tous les indicateurs sont à jour.`,
      });
      reset();
      setQuickAddOpen(false);
    }
  };

  if (!state) return null;

  return (
    <MobileSheet
      open={quickAddOpen}
      onOpenChange={(o) => {
        setQuickAddOpen(o);
        if (!o) reset();
      }}
      title="Ajouter une opération"
      description="Quelques secondes suffisent — tout est recalculé immédiatement."
    >
      <div className="space-y-4">
        {/* Favoris */}
        {favorites.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
              <Star className="size-3" /> Favoris (les plus fréquents)
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {favorites.map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setType(f.type);
                    setAmount(f.amount);
                    setCategoryId(f.categoryId ?? "");
                  }}
                  className="rounded-full border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  {f.category ?? "Sans catégorie"} · {formatFCFA(f.amount)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type */}
        <div>
          <Label className="text-xs font-medium">Type d&apos;opération</Label>
          <div className="grid grid-cols-3 gap-1.5 mt-1.5">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const active = type === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[11px] font-medium transition-colors",
                    active ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                  )}
                >
                  <Icon className={cn("size-4", active ? "" : t.color)} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Montant */}
        <div>
          <Label htmlFor="qa-amount" className="text-xs font-medium">Montant</Label>
          <div className="relative mt-1.5">
            <Input
              id="qa-amount"
              type="text"
              inputMode="numeric"
              autoFocus
              value={amount === null ? "" : amount.toLocaleString("fr-FR")}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, "");
                setAmount(raw === "" ? null : Number(raw));
              }}
              placeholder="0"
              className="text-lg font-bold tabular-nums pr-16 h-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              FCFA
            </span>
          </div>
        </div>

        {/* Compte source */}
        <div>
          <Label className="text-xs font-medium">Compte</Label>
          <Select value={accountId || state.settings.defaultAccountId || accounts[0]?.id} onValueChange={setAccountId}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Compte" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Compte destination (transfert / investissement) */}
        {(type === "TRANSFER" || type === "INVESTMENT") && (
          <div>
            <Label className="text-xs font-medium">
              {type === "TRANSFER" ? "Vers le compte" : "Vers (portefeuille, optionnel)"}
            </Label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== (accountId || state.settings.defaultAccountId))
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {type === "TRANSFER" && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Un transfert ne compte ni comme revenu ni comme dépense.
              </p>
            )}
          </div>
        )}

        {/* Catégorie */}
        {type !== "TRANSFER" && type !== "PROJECT" && (
          <div>
            <Label className="text-xs font-medium">Catégorie</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(type === "EXPENSE" || type === "DONATION") && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">Projet lié (optionnel)</Label>
              <Select
                value={projectId || "NONE"}
                onValueChange={(value) => {
                  setProjectId(value === "NONE" ? "" : value);
                  if (value !== "NONE") setGoalId("");
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Aucun projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Aucun projet</SelectItem>
                  {state.projects
                    .filter((project) => !project.archived)
                    .map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Objectif lié (optionnel)</Label>
              <Select
                value={goalId || "NONE"}
                onValueChange={(value) => {
                  setGoalId(value === "NONE" ? "" : value);
                  if (value !== "NONE") setProjectId("");
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Aucun objectif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Aucun objectif</SelectItem>
                  {state.goals
                    .filter(
                      (goal) =>
                        !goal.isSuggested || goal.suggestedState === "ACCEPTED"
                    )
                    .map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-muted-foreground sm:col-span-2">
              Une dépense liée consomme automatiquement la réserve correspondante
              sur ce compte.
            </p>
          </div>
        )}

        {/* Projet */}
        {type === "PROJECT" && (
          <div>
            <Label className="text-xs font-medium">Projet</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {(state.projects ?? [])
                  .filter((p) => !p.archived)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date */}
        <div>
          <Label htmlFor="qa-date" className="text-xs font-medium">Date</Label>
          <Input
            id="qa-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1.5"
          />
        </div>

        {/* Note */}
        <div>
          <Label htmlFor="qa-note" className="text-xs font-medium">Note (optionnel)</Label>
          <Input
            id="qa-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex : taxi, déjeuner…"
            className="mt-1.5"
          />
        </div>

        <Button onClick={save} disabled={saving} className="w-full h-11 font-semibold">
          {saving ? "Enregistrement…" : "Valider"}
        </Button>
      </div>
    </MobileSheet>
  );
}
