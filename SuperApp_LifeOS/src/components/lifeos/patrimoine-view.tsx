"use client";

// Life OS — Patrimoine : actifs, passifs, patrimoine net, évolution
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
import { computeAccountBalances, computeNetWorth } from "@/lib/lifeos/engine";
import { formatFCFA, formatCompactFCFA, formatMonthFR } from "@/lib/lifeos/format";
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
import {
  Scale,
  Plus,
  Trash2,
  Home,
  Car,
  Bike,
  Landmark,
  TrendingUp,
  Building2,
  Package,
  Banknote,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LifeOSState } from "@/lib/lifeos/types";

const ASSET_TYPES: { id: string; label: string; icon: typeof Home }[] = [
  { id: "LAND", label: "Terrain", icon: Landmark },
  { id: "HOUSE", label: "Maison", icon: Home },
  { id: "CAR", label: "Voiture", icon: Car },
  { id: "MOTO", label: "Moto", icon: Bike },
  { id: "BUSINESS", label: "Business", icon: Building2 },
  { id: "OTHER", label: "Autre actif", icon: Package },
];

export function PatrimoineView() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <PatrimoineInner state={state} />;
}

function PatrimoineInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const [open, setOpen] = useState<"asset" | "liability" | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("LAND");
  const [value, setValue] = useState<number | null>(null);
  const [notes, setNotes] = useState("");


  const nw = useMemo(() => computeNetWorth(state), [state]);
  const balances = useMemo(
    () => computeAccountBalances(state.accounts, state.transactions),
    [state.accounts, state.transactions]
  );

  // Évolution depuis les snapshots
  const evolution = useMemo(() => {
    const snaps = [...state.snapshots].sort((a, b) => a.year - b.year || a.month - b.month);
    return snaps.map((s) => ({
      label: formatMonthFR(s.year, s.month).slice(0, 4),
      patrimoine: s.netWorth,
      brvm: s.brvmValue,
    }));
  }, [state.snapshots]);

  const assetSections = [
    {
      title: "Liquidités & comptes",
      items: state.accounts
        .filter((a) => !a.archived && a.type !== "COPY_TRADING")
        .map((a) => ({ name: a.name, value: balances.get(a.id)?.balance ?? 0 })),
      total: nw.cash,
      icon: Banknote,
    },
    {
      title: "BRVM",
      items: [{ name: "Portefeuille + wallet", value: nw.brvm }],
      total: nw.brvm,
      icon: TrendingUp,
    },
    { title: "Copy trading", items: state.copyTrading.map((c) => ({ name: c.name, value: c.currentValue })), total: nw.copyTrading, icon: TrendingUp },
    { title: "Autres investissements", items: state.otherInvestments.map((o) => ({ name: o.name, value: o.currentValue })), total: nw.otherInvestments, icon: TrendingUp },
    { title: "Business", items: state.businesses.map((b) => ({ name: b.name, value: b.capitalInvested })), total: nw.businesses, icon: Building2 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Scale className="size-5 text-primary" />
          Patrimoine
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Actifs − passifs · où se trouve ton argent · évolution dans le temps
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi
          label="Total actifs"
          value={formatFCFA(nw.totalAssets)}
          tone="positive"
          explain={
            <>
              <ExplainLine label="Cash (tous comptes)" value={formatFCFA(nw.cash)} kind="in" />
              <ExplainLine label="BRVM (positions + wallet)" value={formatFCFA(nw.brvm)} kind="in" />
              <ExplainLine label="Copy trading" value={formatFCFA(nw.copyTrading)} kind="in" />
              <ExplainLine label="Autres investissements" value={formatFCFA(nw.otherInvestments)} kind="in" />
              <ExplainLine label="Business" value={formatFCFA(nw.businesses)} kind="in" />
              <ExplainLine label="Actifs physiques saisis" value={formatFCFA(nw.manualAssets)} kind="in" />
              <ExplainLine label="= Total actifs" value={formatFCFA(nw.totalAssets)} kind="total" />
            </>
          }
        />
        <Kpi label="Passifs (dettes, crédits, engagements)" value={formatFCFA(nw.liabilities)} tone="negative" />
        <Kpi
          label="Patrimoine net"
          value={formatFCFA(nw.netWorth)}
          tone="accent"
          hint="Actifs − passifs"
          explain={
            <>
              <ExplainLine label="Total actifs" value={formatFCFA(nw.totalAssets)} kind="in" />
              <ExplainLine label="− Total passifs" value={formatFCFA(nw.liabilities)} kind="out" />
              <ExplainLine label="= Patrimoine net" value={formatFCFA(nw.netWorth)} kind="total" />
            </>
          }
        />
        <Kpi
          label="Part financière"
          value={`${Math.round(((nw.cash + nw.brvm + nw.copyTrading + nw.otherInvestments) / Math.max(1, nw.totalAssets)) * 100)} %`}
          hint="Liquidités + investissements"
        />
      </div>

      {/* Répartition */}
      <SectionCard title="Où se trouve ton argent" description="Répartition réelle de tes actifs" icon={<Banknote className="size-4" />}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {assetSections.map((section) => {
            const Icon = section.icon;
            const pct = nw.totalAssets > 0 ? (section.total / nw.totalAssets) * 100 : 0;
            return (
              <div key={section.title} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    <p className="text-[13px] font-medium">{section.title}</p>
                  </div>
                  <p className="text-[13px] font-bold tabular-nums">{formatFCFA(section.total)}</p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">{Math.round(pct)} % du total</p>
                {section.items.length > 0 && section.items.length <= 4 && (
                  <ul className="mt-2 space-y-0.5">
                    {section.items.map((it) => (
                      <li key={it.name} className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="truncate">{it.name}</span>
                        <span className="tabular-nums">{formatCompactFCFA(it.value)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Actifs manuels */}
      <SectionCard
        title="Actifs physiques & autres"
        description="Terrain, maison, voiture, moto… (valeur indicative)"
        icon={<Home className="size-4" />}
        action={
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              setName("");
              setType("LAND");
              setValue(null);
              setNotes("");
              setOpen("asset");
            }}
          >
            <Plus className="size-3.5 mr-1" /> Actif
          </Button>
        }
      >
        {state.assets.length === 0 ? (
          <EmptyState title="Aucun actif saisi" description="Ex : ton terrain déjà disponible pour la construction." />
        ) : (
          <ul className="space-y-1.5">
            {state.assets.map((a) => {
              const Icon = ASSET_TYPES.find((t) => t.id === a.type)?.icon ?? Package;
              return (
                <li key={a.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2">
                  <Icon className="size-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {ASSET_TYPES.find((t) => t.id === a.type)?.label ?? a.type}
                      {a.notes ? ` · ${a.notes}` : ""}
                    </p>
                  </div>
                  <span className="text-[13px] font-bold tabular-nums shrink-0">{formatFCFA(a.value)}</span>
                  <button
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    aria-label={`Supprimer ${a.name}`}
                    onClick={() => mutate("asset", "delete", a.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {/* Passifs */}
      <SectionCard
        title="Passifs"
        description="Dettes, crédits, engagements financiers"
        icon={<Scale className="size-4" />}
        action={
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              setName("");
              setType("DEBT");
              setValue(null);
              setNotes("");
              setOpen("liability");
            }}
          >
            <Plus className="size-3.5 mr-1" /> Passif
          </Button>
        }
      >
        {state.liabilities.length === 0 ? (
          <EmptyState title="Aucun passif" description="Aucune dette ou crédit enregistré — c'est une bonne nouvelle." />
        ) : (
          <ul className="space-y-1.5">
            {state.liabilities.map((l) => (
              <li key={l.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium truncate">{l.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {l.type === "DEBT" ? "Dette" : l.type === "CREDIT" ? "Crédit" : "Engagement"}
                    {l.notes ? ` · ${l.notes}` : ""}
                  </p>
                </div>
                <span className="text-[13px] font-bold tabular-nums text-red-600 dark:text-red-400 shrink-0">
                  {formatFCFA(l.amount)}
                </span>
                <button
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label={`Supprimer ${l.name}`}
                  onClick={() => mutate("liability", "delete", l.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Évolution */}
      {evolution.length > 1 && (
        <SectionCard title="Évolution du patrimoine" description="Depuis tes clôtures mensuelles" icon={<TrendingUp className="size-4" />}>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolution} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="patrimoineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: number) => `${Math.round(v / 1000000)}M`}
                />
                <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="patrimoine" name="Patrimoine net" stroke="var(--color-chart-1)" fill="url(#patrimoineFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* Sheets */}
      <MobileSheet open={open === "asset"} onOpenChange={(o) => !o && setOpen(null)} title="Nouvel actif">
        <div className="space-y-3">
          <Field label="Nom">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Terrain de Sotuba" />
          </Field>
          <Field label="Type">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Valeur indicative">
            <MoneyInput value={value} onChange={setValue} />
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
          <SaveButton
            onSave={async () => {
              if (!name.trim()) return;
              await mutate("asset", "create", undefined, { name, type, value: value ?? 0, notes: notes || null });
              setOpen(null);
            }}
          />
        </div>
      </MobileSheet>

      <MobileSheet open={open === "liability"} onOpenChange={(o) => !o && setOpen(null)} title="Nouveau passif">
        <div className="space-y-3">
          <Field label="Nom">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Crédit moto" />
          </Field>
          <Field label="Type">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEBT">Dette</SelectItem>
                <SelectItem value="CREDIT">Crédit</SelectItem>
                <SelectItem value="COMMITMENT">Engagement</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Montant restant">
            <MoneyInput value={value} onChange={setValue} />
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
          <SaveButton
            onSave={async () => {
              if (!name.trim()) return;
              await mutate("liability", "create", undefined, { name, type, amount: value ?? 0, notes: notes || null });
              setOpen(null);
            }}
          />
        </div>
      </MobileSheet>
    </div>
  );
}
