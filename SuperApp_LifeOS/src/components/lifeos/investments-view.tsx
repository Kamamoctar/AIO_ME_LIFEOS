"use client";

// Life OS — Investissements : BRVM réel, calculateur, simulateur, copy trading, autres
import { useMemo, useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import type { DataVisibility, LifeOSState } from "@/lib/lifeos/types";
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
import { computeBrvmStats } from "@/lib/lifeos/engine";
import { formatFCFA, formatPercent, toInputDate } from "@/lib/lifeos/format";
import { DISCLAIMER_SIMULATION } from "@/lib/lifeos/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Plus,
  Trash2,
  Pencil,
  Calculator,
  FlaskConical,
  Copy,
  Landmark,
  Store,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { canEdit, clientItemAccess } from "@/lib/lifeos/permissions";

export function InvestmentsView() {
  return (
    <Tabs defaultValue="brvm" className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          Investissements
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Portefeuille BRVM réel · calculateurs · copy trading · autres placements — jamais mélangés
        </p>
      </div>
      <TabsList className="grid grid-cols-3 sm:grid-cols-5 h-9 w-full">
        <TabsTrigger value="brvm" className="text-xs">BRVM</TabsTrigger>
        <TabsTrigger value="calc" className="text-xs">Calculateur</TabsTrigger>
        <TabsTrigger value="sim" className="text-xs">Simulateur</TabsTrigger>
        <TabsTrigger value="copy" className="text-xs">Copy Trading</TabsTrigger>
        <TabsTrigger value="other" className="text-xs">Autres</TabsTrigger>
      </TabsList>
      <TabsContent value="brvm" className="space-y-4">
        <BrvmTab />
      </TabsContent>
      <TabsContent value="calc" className="space-y-4">
        <CalculatorTab />
      </TabsContent>
      <TabsContent value="sim" className="space-y-4">
        <SimulatorTab />
      </TabsContent>
      <TabsContent value="copy" className="space-y-4">
        <CopyTradingTab />
      </TabsContent>
      <TabsContent value="other" className="space-y-4">
        <OtherInvestmentsTab />
      </TabsContent>
    </Tabs>
  );
}

// ---------------------------------------------------------------------------
// Portefeuille BRVM réel
// ---------------------------------------------------------------------------

function BrvmTab() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <BrvmInner state={state} />;
}

function BrvmInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState<number | null>(null);
  const [avgBuyPrice, setAvgBuyPrice] = useState<number | null>(null);
  const [feesPaid, setFeesPaid] = useState<number | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [dividends, setDividends] = useState<number | null>(null);
  const [buyDate, setBuyDate] = useState("");
  const stats = useMemo(() => computeBrvmStats(state.positions), [state.positions]);

  const openForm = (id?: string) => {
    const p = id ? state.positions.find((x) => x.id === id) : null;
    setEditId(id ?? null);
    setCompany(p?.company ?? "");
    setTicker(p?.ticker ?? "");
    setQuantity(p?.quantity ?? null);
    setAvgBuyPrice(p?.avgBuyPrice ?? null);
    setFeesPaid(p?.feesPaid ?? null);
    setCurrentPrice(p?.currentPrice ?? null);
    setDividends(p?.dividends ?? null);
    setBuyDate(toInputDate(p?.buyDate));
    setOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi
          label="Coût d'acquisition"
          value={formatFCFA(stats.totalCost)}
          hint="Quantité × prix + frais"
        />
        <Kpi label="Valeur actuelle" value={formatFCFA(stats.totalValue)} tone="accent" hint="Quantité × cours" />
        <Kpi
          label="Plus-value latente"
          value={formatFCFA(stats.unrealizedGain)}
          tone={stats.unrealizedGain >= 0 ? "positive" : "negative"}
          hint={formatPercent(stats.performance, 1)}
          explain={
            <>
              <ExplainLine label="Valeur actuelle (quantité × cours)" value={formatFCFA(stats.totalValue)} kind="in" />
              <ExplainLine label="− Coût d'acquisition" value={formatFCFA(stats.totalCost)} kind="out" />
              <ExplainLine label="= Plus-value / moins-value" value={formatFCFA(stats.unrealizedGain)} kind="total" />
              <ExplainLine label="Performance = gain / coût" value={formatPercent(stats.performance, 1)} />
            </>
          }
        />
        <Kpi
          label="Performance totale"
          value={formatPercent(stats.totalPerformance, 1)}
          tone={stats.totalPerformance >= 0 ? "positive" : "negative"}
          hint={`Dividendes ${formatFCFA(stats.totalDividends)}`}
          explain={
            <>
              <ExplainLine label="Valeur actuelle" value={formatFCFA(stats.totalValue)} kind="in" />
              <ExplainLine label="Dividendes reçus" value={formatFCFA(stats.totalDividends)} kind="in" />
              <ExplainLine label="− Coût d'acquisition" value={formatFCFA(stats.totalCost)} kind="out" />
              <ExplainLine label="= Gain total" value={formatFCFA(stats.totalValue + stats.totalDividends - stats.totalCost)} kind="total" />
              <ExplainLine label="Rendement dividende = dividendes / coût" value={formatPercent(stats.dividendYield, 1)} />
            </>
          }
        />
      </div>

      <SectionCard
        title="Portefeuille BRVM réel"
        description="Lignes réelles — jamais mélangées avec les simulations"
        icon={<TrendingUp className="size-4" />}
        action={
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openForm()}>
            <Plus className="size-3.5 mr-1" /> Ligne
          </Button>
        }
      >
        {stats.lines.length === 0 ? (
          <EmptyState
            title="Aucune ligne BRVM"
            description="Ajoute tes titres (société, quantité, prix moyen d'achat, cours actuel)."
          />
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b text-left text-[11px] text-muted-foreground">
                  <th className="pb-2 font-medium">Société</th>
                  <th className="pb-2 font-medium text-right">Qté</th>
                  <th className="pb-2 font-medium text-right">PRU</th>
                  <th className="pb-2 font-medium text-right">Cours</th>
                  <th className="pb-2 font-medium text-right">Valeur</th>
                  <th className="pb-2 font-medium text-right">+/- value</th>
                  <th className="pb-2 font-medium text-right">Perf.</th>
                  <th className="pb-2 font-medium text-right">Div.</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {stats.lines.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="py-2">
                      <button className="font-medium text-[13px] hover:underline" onClick={() => openForm(l.id)}>
                        {l.company}
                        {l.ticker && <span className="text-[10px] text-muted-foreground ml-1">{l.ticker}</span>}
                      </button>
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs">{l.quantity}</td>
                    <td className="py-2 text-right tabular-nums text-xs">{l.avgBuyPrice !== undefined ? Math.round(l.avgBuyPrice) : "—"}</td>
                    <td className="py-2 text-right tabular-nums text-xs">{Math.round(l.quantity > 0 ? l.value / l.quantity : 0)}</td>
                    <td className="py-2 text-right tabular-nums text-xs font-medium">{formatFCFA(l.value)}</td>
                    <td
                      className={`py-2 text-right tabular-nums text-xs font-medium ${
                        l.gain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatFCFA(l.gain)}
                    </td>
                    <td
                      className={`py-2 text-right tabular-nums text-xs ${
                        l.gain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatPercent(l.performance, 1)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-xs">{formatFCFA(l.dividends)}</td>
                    <td className="py-2 text-right">
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Supprimer ${l.company}`}
                        onClick={() => mutate("position", "delete", l.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <MobileSheet open={open} onOpenChange={setOpen} title={editId ? "Modifier la ligne" : "Nouvelle ligne BRVM"}>
        <div className="space-y-3">
          <Field label="Société">
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex : ETIT (Ecobank)" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ticker (optionnel)">
              <Input value={ticker} onChange={(e) => setTicker(e.target.value)} />
            </Field>
            <Field label="Date d'achat">
              <Input type="date" value={buyDate} onChange={(e) => setBuyDate(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantité">
              <Input
                type="number"
                value={quantity ?? ""}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : null)}
              />
            </Field>
            <Field label="Prix moyen d'achat (FCFA)">
              <Input
                type="number"
                value={avgBuyPrice ?? ""}
                onChange={(e) => setAvgBuyPrice(e.target.value ? Number(e.target.value) : null)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Frais payés (FCFA)">
              <MoneyInput value={feesPaid} onChange={setFeesPaid} />
            </Field>
            <Field label="Cours actuel (FCFA)">
              <Input
                type="number"
                value={currentPrice ?? ""}
                onChange={(e) => setCurrentPrice(e.target.value ? Number(e.target.value) : null)}
              />
            </Field>
          </div>
          <Field label="Dividendes cumulés reçus (FCFA)">
            <MoneyInput value={dividends} onChange={setDividends} />
          </Field>
          <SaveButton
            onSave={async () => {
              if (!company.trim() || !quantity) return;
              const data = {
                company,
                ticker: ticker || null,
                quantity,
                avgBuyPrice: avgBuyPrice ?? 0,
                feesPaid: feesPaid ?? 0,
                currentPrice: currentPrice ?? avgBuyPrice ?? 0,
                dividends: dividends ?? 0,
                buyDate: buyDate || null,
              };
              if (editId) await mutate("position", "update", editId, data);
              else await mutate("position", "create", undefined, data);
              setOpen(false);
            }}
          />
        </div>
      </MobileSheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Calculateur de rendement BRVM
// ---------------------------------------------------------------------------

function CalculatorTab() {
  const [quantity, setQuantity] = useState<number | null>(null);
  const [buyPrice, setBuyPrice] = useState<number | null>(null);
  const [sellPrice, setSellPrice] = useState<number | null>(null);
  const [buyFees, setBuyFees] = useState<number | null>(null);
  const [sellFees, setSellFees] = useState<number | null>(null);
  const [dividends, setDividends] = useState<number | null>(null);
  const [years, setYears] = useState<number | null>(null);
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);

  const calc = async () => {
    setLoading(true);
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "brvmCalc",
        data: {
          quantity: quantity ?? 0,
          buyPrice: buyPrice ?? 0,
          sellPrice: sellPrice ?? buyPrice ?? 0,
          buyFees: buyFees ?? 0,
          sellFees: sellFees ?? 0,
          dividends: dividends ?? 0,
          years: years ?? 1,
        },
      }),
    });
    const json = await res.json();
    setResult(json.result);
    setLoading(false);
  };

  return (
    <SectionCard
      title="Calculateur de rendement BRVM"
      description="Gain brut, frais, gain net, plus-value, rendements — calcul isolé"
      icon={<Calculator className="size-4" />}
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Quantité">
          <Input type="number" value={quantity ?? ""} onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Prix d'achat (FCFA)">
          <Input type="number" value={buyPrice ?? ""} onChange={(e) => setBuyPrice(e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Prix actuel / de vente (FCFA)">
          <Input type="number" value={sellPrice ?? ""} onChange={(e) => setSellPrice(e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Durée de détention (années)">
          <Input type="number" value={years ?? ""} onChange={(e) => setYears(e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Frais d'achat (FCFA)">
          <MoneyInput value={buyFees} onChange={setBuyFees} />
        </Field>
        <Field label="Frais de vente (FCFA)">
          <MoneyInput value={sellFees} onChange={setSellFees} />
        </Field>
        <Field label="Dividendes reçus (FCFA)" className="sm:col-span-2">
          <MoneyInput value={dividends} onChange={setDividends} />
        </Field>
      </div>
      <Button className="mt-4" onClick={calc} disabled={loading || !quantity || !buyPrice}>
        {loading ? "Calcul…" : "Calculer le rendement"}
      </Button>

      {result && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Kpi label="Coût d'acquisition" value={formatFCFA(result.cost)} />
          <Kpi label="Produit de vente" value={formatFCFA(result.proceeds)} />
          <Kpi label="Gain brut" value={formatFCFA(result.grossGain)} />
          <Kpi label="Frais totaux" value={formatFCFA(result.fees)} tone="negative" />
          <Kpi label="Gain net" value={formatFCFA(result.netGain)} tone={result.netGain >= 0 ? "positive" : "negative"} />
          <Kpi label="Rendement du cours" value={formatPercent(result.priceReturn, 1)} />
          <Kpi label="Rendement dividende" value={formatPercent(result.dividendReturn, 1)} />
          <Kpi label="Rendement total" value={formatPercent(result.totalReturn, 1)} tone="accent" />
          <Kpi label="Rendement annualisé" value={formatPercent(result.annualized, 1)} />
        </div>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1">
        <AlertTriangle className="size-3 shrink-0" /> {DISCLAIMER_SIMULATION}
      </p>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Simulateur BRVM (versements périodiques, dividendes réinvestis)
// ---------------------------------------------------------------------------

interface CompoundResult {
  years: number;
  contributions: number;
  initial: number;
  gains: number;
  finalValue: number;
  yearly: { year: number; value: number; contributed: number }[];
}

function SimulatorTab() {
  const { state } = useLifeOS();
  const [initial, setInitial] = useState<number | null>(null);
  const [monthly, setMonthly] = useState<number | null>(25000);
  const [years, setYears] = useState<number | null>(5);
  const [ratePct, setRatePct] = useState<number | null>(8);
  const [scenario, setScenario] = useState<"prudent" | "intermediaire" | "ambitieux" | "custom">("intermediaire");
  const [targetMode, setTargetMode] = useState(false);
  const [target, setTarget] = useState<number | null>(5000000);
  const [result, setResult] = useState<CompoundResult | null>(null);
  const [required, setRequired] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const rates = { prudent: 5, intermediaire: 8, ambitieux: 12 };
  const effectiveRate = scenario === "custom" ? (ratePct ?? 8) : rates[scenario];

  const run = async (forTarget = false) => {
    setLoading(true);
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: forTarget ? "requiredMonthly" : "compound",
        data: {
          initial: initial ?? 0,
          monthly: monthly ?? 0,
          annualRate: (forTarget ? effectiveRate : effectiveRate) / 100,
          years: years ?? 5,
          target: target ?? 0,
        },
      }),
    });
    const json = await res.json();
    if (forTarget) setRequired(json.result);
    else setResult(json.result);
    setLoading(false);
  };

  return (
    <>
      <SectionCard
        title="Simulateur BRVM"
        description="« Si j'investis 25 000 FCFA/mois pendant 5 ans, combien pourrais-je avoir ? »"
        icon={<FlaskConical className="size-4" />}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Capital initial (FCFA)">
            <MoneyInput value={initial} onChange={setInitial} />
          </Field>
          <Field label="Versement mensuel (FCFA)">
            <MoneyInput value={monthly} onChange={setMonthly} />
          </Field>
          <Field label="Durée (années)">
            <Input type="number" value={years ?? ""} onChange={(e) => setYears(e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Scénario de rendement (modifiable)">
            <Select value={scenario} onValueChange={(v) => setScenario(v as typeof scenario)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prudent">Prudent — {rates.prudent} %/an</SelectItem>
                <SelectItem value="intermediaire">Intermédiaire — {rates.intermediaire} %/an</SelectItem>
                <SelectItem value="ambitieux">Ambitieux — {rates.ambitieux} %/an</SelectItem>
                <SelectItem value="custom">Personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {scenario === "custom" && (
            <Field label="Rendement annuel attendu (%)">
              <Input type="number" value={ratePct ?? ""} onChange={(e) => setRatePct(e.target.value ? Number(e.target.value) : null)} />
            </Field>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => run(false)} disabled={loading}>
            {loading ? "Simulation…" : "Simuler l'évolution"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTargetMode(true);
              run(true);
            }}
          >
            Combien par mois pour atteindre {target ? formatFCFA(target) : "un objectif"} ?
          </Button>
        </div>

        {required !== null && targetMode && (
          <div className="mt-4 rounded-lg bg-primary/10 p-3 text-sm">
            Pour atteindre <b>{formatFCFA(target ?? 0)}</b> en {years ?? 5} ans avec {effectiveRate} %/an,
            il faudrait investir environ <b className="text-primary">{formatFCFA(required)}/mois</b>
            {initial ? ` (avec ${formatFCFA(initial)} de capital initial)` : ""}.
          </div>
        )}

        {result && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Kpi label="Total versé" value={formatFCFA(result.contributions)} />
              <Kpi label="Gains estimés" value={formatFCFA(result.gains)} tone="positive" />
              <Kpi label="Valeur finale estimée" value={formatFCFA(result.finalValue)} tone="accent" />
              <Kpi
                label="Part des gains"
                value={formatPercent(result.contributions > 0 ? result.gains / result.contributions : 0, 1)}
              />
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Évolution annuelle (apports vs valeur)
              </p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] text-muted-foreground border-b">
                    <th className="pb-1 font-medium">Année</th>
                    <th className="pb-1 font-medium text-right">Cumul versé</th>
                    <th className="pb-1 font-medium text-right">Valeur estimée</th>
                    <th className="pb-1 font-medium text-right">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearly.map((y) => (
                    <tr key={y.year} className="border-b last:border-0">
                      <td className="py-1.5 font-medium">Année {y.year}</td>
                      <td className="py-1.5 text-right tabular-nums">{formatFCFA(y.contributed)}</td>
                      <td className="py-1.5 text-right tabular-nums">{formatFCFA(y.value)}</td>
                      <td className="py-1.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{formatFCFA(y.value - y.contributed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <p className="mt-3 text-[10px] text-muted-foreground flex items-center gap-1">
          <AlertTriangle className="size-3 shrink-0" /> {DISCLAIMER_SIMULATION}
        </p>
      </SectionCard>

      <SectionCard
        title="Comparaison de scénarios d'investissement"
        description="Prudent · Intermédiaire · Ambitieux — mêmes versements, hypothèses différentes"
        icon={<FlaskConical className="size-4" />}
      >
        <div className="grid sm:grid-cols-3 gap-3">
          {(["prudent", "intermediaire", "ambitieux"] as const).map((sc) => {
            const r = rates[sc] / 100;
            const m = monthly ?? 25000;
            const init = initial ?? 0;
            const n = (years ?? 5) * 12;
            const monthlyRate = r / 12;
            let value = init;
            for (let i = 0; i < n; i++) value = value * (1 + monthlyRate) + m;
            const contributed = init + m * n;
            return (
              <div key={sc} className="rounded-lg border p-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {sc === "prudent" ? "Prudent" : sc === "intermediaire" ? "Intermédiaire" : "Ambitieux"}
                </p>
                <p className="text-[10px] text-muted-foreground">{rates[sc]} %/an</p>
                <p className="mt-2 text-lg font-bold tabular-nums">{formatFCFA(value)}</p>
                <p className="text-[10px] text-muted-foreground">
                  versé {formatFCFA(contributed)} · gains {formatFCFA(value - contributed)}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">{DISCLAIMER_SIMULATION}</p>
      </SectionCard>
    </>
  );
}

// ---------------------------------------------------------------------------
// Copy Trading
// ---------------------------------------------------------------------------

function CopyTradingTab() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <CopyTradingInner state={state} />;
}

function CopyTradingInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [deposited, setDeposited] = useState<number | null>(null);
  const [withdrawn, setWithdrawn] = useState<number | null>(null);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [fees, setFees] = useState<number | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const totalDeposited = state.copyTrading.reduce((s, c) => s + c.capitalDeposited, 0);
  const totalValue = state.copyTrading.reduce((s, c) => s + c.currentValue, 0);
  const totalWithdrawn = state.copyTrading.reduce((s, c) => s + c.withdrawn, 0);
  const totalFees = state.copyTrading.reduce((s, c) => s + c.fees, 0);
  const netGain = totalValue + totalWithdrawn - totalDeposited - totalFees;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi label="Capital déposé" value={formatFCFA(totalDeposited)} />
        <Kpi label="Valeur actuelle" value={formatFCFA(totalValue)} tone="accent" />
        <Kpi label="Retraits" value={formatFCFA(totalWithdrawn)} />
        <Kpi
          label="Gains / pertes nets"
          value={formatFCFA(netGain)}
          tone={netGain >= 0 ? "positive" : "negative"}
          hint={`Frais : ${formatFCFA(totalFees)}`}
        />
      </div>

      <SectionCard
        title="Comptes de copy trading"
        description="Suivi séparé — jamais mélangé aux performances BRVM"
        icon={<Copy className="size-4" />}
        action={
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => {
              setEditId(null);
              setName("");
              setPlatform("");
              setDeposited(null);
              setWithdrawn(null);
              setCurrentValue(null);
              setFees(null);
              setOpen(true);
            }}
          >
            <Plus className="size-3.5 mr-1" /> Compte
          </Button>
        }
      >
        {state.copyTrading.length === 0 ? (
          <EmptyState title="Aucun compte de copy trading" description="Ajoute ton compte pour suivre capital, retraits, valeur et performance." />
        ) : (
          <div className="space-y-2">
            {state.copyTrading.map((c) => {
              const gain = c.currentValue + c.withdrawn - c.capitalDeposited - c.fees;
              const perf = c.capitalDeposited > 0 ? gain / c.capitalDeposited : 0;
              return (
                <div key={c.id} className="rounded-lg border p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">
                      {c.name}
                      {c.platform && <span className="text-muted-foreground font-normal"> · {c.platform}</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Déposé {formatFCFA(c.capitalDeposited)} · valeur {formatFCFA(c.currentValue)} · retraits {formatFCFA(c.withdrawn)} · frais {formatFCFA(c.fees)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[13px] font-bold tabular-nums ${gain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatFCFA(gain)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatPercent(perf, 1)}</p>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    aria-label={`Supprimer ${c.name}`}
                    onClick={() => mutate("copyTrading", "delete", c.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <MobileSheet open={open} onOpenChange={setOpen} title={editId ? "Modifier" : "Nouveau compte copy trading"}>
        <div className="space-y-3">
          <Field label="Nom">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Compte principal" />
          </Field>
          <Field label="Plateforme">
            <Input value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Ex : eToro, ZuluTrade…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capital déposé">
              <MoneyInput value={deposited} onChange={setDeposited} />
            </Field>
            <Field label="Retraits cumulés">
              <MoneyInput value={withdrawn} onChange={setWithdrawn} />
            </Field>
            <Field label="Valeur actuelle">
              <MoneyInput value={currentValue} onChange={setCurrentValue} />
            </Field>
            <Field label="Frais cumulés">
              <MoneyInput value={fees} onChange={setFees} />
            </Field>
          </div>
          <SaveButton
            onSave={async () => {
              if (!name.trim()) return;
              const data = {
                name,
                platform: platform || null,
                capitalDeposited: deposited ?? 0,
                withdrawn: withdrawn ?? 0,
                currentValue: currentValue ?? 0,
                fees: fees ?? 0,
              };
              if (editId) await mutate("copyTrading", "update", editId, data);
              else await mutate("copyTrading", "create", undefined, data);
              setOpen(false);
              toast({ title: "Compte enregistré" });
            }}
          />
        </div>
      </MobileSheet>
    </>
  );
}

// ---------------------------------------------------------------------------
// Autres investissements + Business
// ---------------------------------------------------------------------------

function OtherInvestmentsTab() {
  const { state } = useLifeOS();
  if (!state) return null;
  return <OtherInvestmentsInner state={state} />;
}

function OtherInvestmentsInner({ state }: { state: LifeOSState }) {
  const { mutate } = useLifeOS();
  const [open, setOpen] = useState<"invest" | "business" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  // form invest
  const [name, setName] = useState("");
  const [type, setType] = useState("PLACEMENT");
  const [initialCapital, setInitialCapital] = useState<number | null>(null);
  const [contributions, setContributions] = useState<number | null>(null);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [income, setIncome] = useState<number | null>(null);
  const [risk, setRisk] = useState("MOYEN");
  // form business
  const [bizName, setBizName] = useState("");
  const [capitalInvested, setCapitalInvested] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [charges, setCharges] = useState<number | null>(null);
  const [bizStatus, setBizStatus] = useState("PLANIFIE");
  const [bizVisibility, setBizVisibility] =
    useState<DataVisibility>("SHARED");
  const [bizEditId, setBizEditId] = useState<string | null>(null);

  const totalInvestValue = state.otherInvestments.reduce((s, o) => s + o.currentValue, 0);
  const totalInvestPut = state.otherInvestments.reduce((s, o) => s + o.initialCapital + o.contributions, 0);
  const canCreateBusiness = canEdit(
    state.couple?.permissions.investments ?? "EDIT"
  );

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Kpi label="Valeur autres investissements" value={formatFCFA(totalInvestValue)} tone="accent" />
        <Kpi label="Capital engagé" value={formatFCFA(totalInvestPut)} />
        <Kpi
          label="Bénéfices business (cumul)"
          value={formatFCFA(state.businesses.reduce((s, b) => s + b.revenue - b.charges, 0))}
          tone="positive"
          hint="CA − charges"
        />
      </div>

      <SectionCard
        title="Autres investissements"
        description="Immobilier, business, placements — structure générique"
        icon={<Landmark className="size-4" />}
        action={
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={!canCreateBusiness}
            onClick={() => {
              setEditId(null);
              setName("");
              setType("PLACEMENT");
              setInitialCapital(null);
              setContributions(null);
              setCurrentValue(null);
              setIncome(null);
              setRisk("MOYEN");
              setOpen("invest");
            }}
          >
            <Plus className="size-3.5 mr-1" /> Placement
          </Button>
        }
      >
        {state.otherInvestments.length === 0 ? (
          <EmptyState title="Aucun autre investissement" />
        ) : (
          <div className="space-y-2">
            {state.otherInvestments.map((o) => {
              const put = o.initialCapital + o.contributions;
              const gain = o.currentValue + o.withdrawals + o.income - put - o.expenses;
              return (
                <div key={o.id} className="rounded-lg border p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">
                      {o.name}
                      <span className="text-[10px] text-muted-foreground ml-1.5">{o.type} · risque {o.risk.toLowerCase()}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Engagé {formatFCFA(put)} · valeur {formatFCFA(o.currentValue)} · revenus {formatFCFA(o.income)}
                    </p>
                  </div>
                  <p className={`text-[13px] font-bold tabular-nums shrink-0 ${gain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatFCFA(gain)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Business / Entrepreneuriat"
        description="Ex : Mercerie — capital investi, chiffre d'affaires, charges, bénéfice"
        icon={<Store className="size-4" />}
        action={
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={!canCreateBusiness}
            onClick={() => {
              setBizEditId(null);
              setBizName("");
              setCapitalInvested(null);
              setRevenue(null);
              setCharges(null);
              setBizStatus("PLANIFIE");
              setBizVisibility("SHARED");
              setOpen("business");
            }}
          >
            <Plus className="size-3.5 mr-1" /> Activité
          </Button>
        }
      >
        {state.businesses.length === 0 ? (
          <EmptyState title="Aucune activité" description="Ex : la mercerie avec un capital cible de 1 000 000 FCFA." />
        ) : (
          <div className="space-y-2">
            {state.businesses.map((b) => {
              const profit = b.revenue - b.charges;
              const roi = b.capitalInvested > 0 ? profit / b.capitalInvested : 0;
              const editable = canEdit(
                clientItemAccess(
                  state.couple,
                  "investments",
                  "BUSINESS",
                  b.id
                )
              );
              return (
                <div key={b.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                        {b.name}
                        <Badge variant="outline" className="text-[9px]">
                          {(b.visibility ?? "SHARED") === "PERSONAL"
                            ? "Personnel"
                            : "Partage"}
                        </Badge>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Capital {formatFCFA(b.capitalInvested)} · CA {formatFCFA(b.revenue)} · charges {formatFCFA(b.charges)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[13px] font-bold tabular-nums ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {formatFCFA(profit)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">ROI {formatPercent(roi, 1)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      disabled={!editable}
                      onClick={() => {
                        setBizEditId(b.id);
                        setBizName(b.name);
                        setCapitalInvested(b.capitalInvested);
                        setRevenue(b.revenue);
                        setCharges(b.charges);
                        setBizStatus(b.status);
                        setBizVisibility(b.visibility ?? "SHARED");
                        setOpen("business");
                      }}
                    >
                      <Pencil className="mr-1 size-3" /> Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      disabled={!editable}
                      onClick={() => mutate("business", "delete", b.id)}
                    >
                      <Trash2 className="mr-1 size-3" /> Supprimer
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Sheet autre investissement */}
      <MobileSheet open={open === "invest"} onOpenChange={(o) => !o && setOpen(null)} title={editId ? "Modifier" : "Nouveau placement"}>
        <div className="space-y-3">
          <Field label="Nom">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Type">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REAL_ESTATE">Immobilier</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
                <SelectItem value="PLACEMENT">Placement</SelectItem>
                <SelectItem value="OTHER">Autre</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capital initial">
              <MoneyInput value={initialCapital} onChange={setInitialCapital} />
            </Field>
            <Field label="Apports cumulés">
              <MoneyInput value={contributions} onChange={setContributions} />
            </Field>
            <Field label="Valeur actuelle">
              <MoneyInput value={currentValue} onChange={setCurrentValue} />
            </Field>
            <Field label="Revenus cumulés">
              <MoneyInput value={income} onChange={setIncome} />
            </Field>
          </div>
          <Field label="Niveau de risque">
            <Select value={risk} onValueChange={setRisk}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FAIBLE">Faible</SelectItem>
                <SelectItem value="MOYEN">Moyen</SelectItem>
                <SelectItem value="ELEVE">Élevé</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <SaveButton
            onSave={async () => {
              if (!name.trim()) return;
              await mutate("otherInvestment", "create", undefined, {
                name,
                type,
                initialCapital: initialCapital ?? 0,
                contributions: contributions ?? 0,
                currentValue: currentValue ?? 0,
                income: income ?? 0,
                risk,
              });
              setOpen(null);
            }}
          />
        </div>
      </MobileSheet>

      {/* Sheet business */}
      <MobileSheet
        open={open === "business"}
        onOpenChange={(isOpen) => !isOpen && setOpen(null)}
        title={bizEditId ? "Modifier l'activite" : "Nouvelle activite"}
      >
        <div className="space-y-3">
          <Field label="Nom de l'activité">
            <Input value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="Ex : Mercerie" />
          </Field>
          <Field label="Partage">
            <Select
              value={bizVisibility}
              onValueChange={(value) =>
                setBizVisibility(value as DataVisibility)
              }
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
            <Field label="Capital investi">
              <MoneyInput value={capitalInvested} onChange={setCapitalInvested} />
            </Field>
            <Field label="Chiffre d'affaires">
              <MoneyInput value={revenue} onChange={setRevenue} />
            </Field>
            <Field label="Charges">
              <MoneyInput value={charges} onChange={setCharges} />
            </Field>
            <Field label="Statut">
              <Select value={bizStatus} onValueChange={setBizStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDEE">Idée</SelectItem>
                  <SelectItem value="PLANIFIE">Planifié</SelectItem>
                  <SelectItem value="EN_COURS">En cours</SelectItem>
                  <SelectItem value="ACTIF">Actif</SelectItem>
                  <SelectItem value="PAUSE">En pause</SelectItem>
                  <SelectItem value="ARRETE">Arrêté</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <SaveButton
            onSave={async () => {
              if (!bizName.trim()) return;
              const businessData = {
                name: bizName,
                capitalInvested: capitalInvested ?? 0,
                revenue: revenue ?? 0,
                charges: charges ?? 0,
                status: bizStatus,
                visibility: bizVisibility,
              };
              if (bizEditId) {
                await mutate("business", "update", bizEditId, businessData);
              } else {
                await mutate("business", "create", undefined, businessData);
              }
              setOpen(null);
            }}
          />
        </div>
      </MobileSheet>
    </>
  );
}
