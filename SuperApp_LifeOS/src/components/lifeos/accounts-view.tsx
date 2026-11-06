"use client";

// Life OS — Mes comptes + journal des transactions
import { useMemo, useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import {
  SectionCard,
  Kpi,
  EmptyState,
  Field,
  MoneyInput,
  MobileSheet,
  SaveButton,
  ExplainDialog,
  ExplainLine,
} from "@/components/lifeos/ui-bits";
import { computeAccountBalances, computeAvailableCash } from "@/lib/lifeos/engine";
import { formatFCFA, formatDateFR } from "@/lib/lifeos/format";
import { ACCOUNT_TYPE_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/lifeos/constants";
import type { AccountType, TransactionType, LifeOSState } from "@/lib/lifeos/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Landmark,
  Plus,
  Trash2,
  Archive,
  Banknote,
  Smartphone,
  Building2,
  PiggyBank,
  TrendingUp,
  Copy,
  Wallet,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<AccountType, typeof Banknote> = {
  CASH: Banknote,
  MOBILE_MONEY: Smartphone,
  BANK: Building2,
  SAVINGS: PiggyBank,
  BRVM: TrendingUp,
  COPY_TRADING: Copy,
  BUSINESS: Landmark,
  OTHER: Wallet,
};

export function AccountsView() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <AccountsInner state={state} />;
}

function AccountsInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [initialBalance, setInitialBalance] = useState<number | null>(null);
  const [institution, setInstitution] = useState("");
  // filtres transactions
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterAccount, setFilterAccount] = useState<string>("ALL");


  const balances = useMemo(
    () => computeAccountBalances(state.accounts, state.transactions),
    [state.accounts, state.transactions]
  );
  const active = state.accounts.filter((a) => !a.archived);
  const archived = state.accounts.filter((a) => a.archived);
  const total = active.reduce((s, a) => s + (balances.get(a.id)?.balance ?? 0), 0);
  const availableCash = useMemo(() => computeAvailableCash(state), [state]);

  const transactions = useMemo(() => {
    let list = state.transactions;
    if (filterType !== "ALL") list = list.filter((t) => t.type === filterType);
    if (filterAccount !== "ALL") list = list.filter((t) => t.accountId === filterAccount);
    return list.slice(0, 60);
  }, [state.transactions, filterType, filterAccount]);

  const startEdit = (id: string) => {
    const a = state.accounts.find((x) => x.id === id);
    if (!a) return;
    setEditId(id);
    setName(a.name);
    setType(a.type);
    setInitialBalance(a.initialBalance);
    setInstitution(a.institution ?? "");
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="size-5 text-primary" />
            Mes comptes
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Solde = solde initial + entrées − sorties
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditId(null);
            setName("");
            setType("BANK");
            setInitialBalance(null);
            setInstitution("");
            setOpen(true);
          }}
        >
          <Plus className="size-4 mr-1" /> Compte
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Kpi
          label="Solde total (comptes actifs)"
          value={formatFCFA(total)}
          tone="accent"
          explain={
            <>
              {active.map((a) => (
                <ExplainLine
                  key={a.id}
                  label={`${a.name} : ${formatFCFA(a.initialBalance)} initial + ${formatFCFA(balances.get(a.id)?.inflows ?? 0)} entrées − ${formatFCFA(balances.get(a.id)?.outflows ?? 0)} sorties`}
                  value={formatFCFA(balances.get(a.id)?.balance ?? 0)}
                />
              ))}
              <ExplainLine label="Total" value={formatFCFA(total)} kind="total" />
            </>
          }
        />
        <Kpi label="Comptes actifs" value={String(active.length)} hint={`${archived.length} archivé${archived.length > 1 ? "s" : ""}`} />
        <Kpi
          label="Argent libre"
          value={formatFCFA(availableCash.totalAvailable)}
          hint={`${formatFCFA(availableCash.totalReserved)} réservés aux projets`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {active.map((a) => {
          const Icon = TYPE_ICONS[a.type] ?? Wallet;
          const b = balances.get(a.id);
          const cashLine = availableCash.accounts.find(
            (candidate) => candidate.accountId === a.id
          );
          return (
            <div key={a.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {ACCOUNT_TYPE_LABELS[a.type]}
                      {a.institution ? ` · ${a.institution}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Modifier ${a.name}`}
                    onClick={() => startEdit(a.id)}
                  >
                    <Plus className="size-3.5 rotate-45" />
                  </button>
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Archiver ${a.name}`}
                    onClick={() => mutate("account", "update", a.id, { archived: true })}
                  >
                    <Archive className="size-3.5" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">{formatFCFA(b?.balance ?? 0)}</p>
                <p className="text-[10px] text-muted-foreground">
                  initial {formatFCFA(a.initialBalance)} · +{formatFCFA(b?.inflows ?? 0)} · −{formatFCFA(b?.outflows ?? 0)}
                </p>
                {(cashLine?.reserved ?? 0) > 0 && (
                  <p className="mt-1 text-[11px] font-medium text-primary">
                    {formatFCFA(cashLine?.reserved ?? 0)} réservés · {formatFCFA(cashLine?.available ?? 0)} libres
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {archived.length > 0 && (
        <SectionCard title="Comptes archivés" description="Conservés pour l'historique">
          <div className="space-y-1.5">
            {archived.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-[13px] text-muted-foreground">
                  {a.name} · {ACCOUNT_TYPE_LABELS[a.type]} · {formatFCFA(balances.get(a.id)?.balance ?? 0)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px]"
                  onClick={() => mutate("account", "update", a.id, { archived: false })}
                >
                  Réactiver
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Journal des transactions */}
      <SectionCard
        title="Journal des transactions"
        description="Toutes les opérations — source de vérité"
        icon={<ArrowLeftRight className="size-4" />}
      >
        <div className="flex flex-wrap gap-2 mb-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 text-xs w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les types</SelectItem>
              {(Object.keys(TRANSACTION_TYPE_LABELS) as TransactionType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {TRANSACTION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="h-8 text-xs w-44">
              <SelectValue placeholder="Compte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les comptes</SelectItem>
              {state.accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            title="Aucune transaction"
            description="Utilise le bouton « + Ajouter » pour enregistrer ta première opération."
          />
        ) : (
          <ul className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {transactions.map((t) => {
              const account = state.accounts.find((a) => a.id === t.accountId);
              const toAccount = t.toAccountId ? state.accounts.find((a) => a.id === t.toAccountId) : null;
              const isOut = ["EXPENSE", "DONATION", "INVESTMENT", "TRANSFER", "WITHDRAWAL"].includes(t.type);
              const isIn = ["INCOME", "DIVIDEND", "DEPOSIT"].includes(t.type);
              return (
                <li key={t.id} className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      isOut
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : isIn
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {TRANSACTION_TYPE_LABELS[t.type].slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate">
                      {t.description || t.category || TRANSACTION_TYPE_LABELS[t.type]}
                      {t.type === "TRANSFER" && toAccount && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          {account?.name} → {toAccount.name}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateFR(t.date)} · {account?.name}
                      {t.category ? ` · ${t.category}` : ""}
                      {t.projectId ? " · 📁 projet" : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "text-[13px] font-bold tabular-nums",
                        isOut
                          ? "text-red-600 dark:text-red-400"
                          : isIn
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground"
                      )}
                    >
                      {t.type === "ADJUSTMENT" ? "" : isOut ? "−" : isIn ? "+" : ""}
                      {formatFCFA(t.amount)}
                    </p>
                    {t.fee > 0 && (
                      <p className="text-[10px] text-muted-foreground">frais {formatFCFA(t.fee)}</p>
                    )}
                  </div>
                  <button
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    aria-label="Supprimer la transaction"
                    onClick={() => mutate("transaction", "delete", t.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {/* Sheet compte */}
      <MobileSheet
        open={open}
        onOpenChange={setOpen}
        title={editId ? "Modifier le compte" : "Nouveau compte"}
        description="Types : espèces, mobile money, banque, épargne, BRVM, copy trading…"
      >
        <div className="space-y-3">
          <Field label="Nom du compte">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Wave, Orange Money…" />
          </Field>
          <Field label="Type">
            <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {ACCOUNT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Solde initial">
            <MoneyInput value={initialBalance} onChange={setInitialBalance} />
          </Field>
          <Field label="Institution (optionnel)">
            <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Ex : Ecobank, Wave…" />
          </Field>
          <SaveButton
            onSave={async () => {
              if (!name.trim()) return;
              const data = {
                name,
                type,
                initialBalance: initialBalance ?? 0,
                institution: institution || null,
              };
              if (editId) await mutate("account", "update", editId, data);
              else await mutate("account", "create", undefined, data);
              setOpen(false);
            }}
          />
        </div>
      </MobileSheet>
    </div>
  );
}
