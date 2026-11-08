import { computeCapacity, monthlySummary } from "@/lib/lifeos/engine";
import type { LifeOSState } from "@/lib/lifeos/types";

export const MONEY_POCKET_IDS = [
  "necessities",
  "freedom",
  "enjoyment",
  "longTerm",
  "education",
  "giving",
] as const;

export type MoneyPocketId = (typeof MONEY_POCKET_IDS)[number];
export type MoneyPlanIncomeBasis = "EXPECTED" | "ACTUAL";
export type MoneyPocketPercentages = Record<MoneyPocketId, number>;

export interface MoneyAllocationConfig {
  enabled: boolean;
  incomeBasis: MoneyPlanIncomeBasis;
  percentages: MoneyPocketPercentages;
  categoryAssignments: Record<string, MoneyPocketId>;
}

export interface MoneyPocketDefinition {
  id: MoneyPocketId;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
}

export interface MoneyPocketResult extends MoneyPocketDefinition {
  percentage: number;
  target: number;
  actual: number;
  remaining: number;
  actualPercentage: number;
}

export interface MoneyAllocationResult {
  income: number;
  totalPercentage: number;
  totalTarget: number;
  totalActual: number;
  unclassified: number;
  rows: MoneyPocketResult[];
}

export const MONEY_POCKETS: MoneyPocketDefinition[] = [
  { id: "necessities", label: "Nécessités", shortLabel: "Nécessités", description: "Logement, alimentation, santé et obligations essentielles.", color: "#db2777" },
  { id: "freedom", label: "Liberté financière", shortLabel: "Liberté", description: "Actifs et investissements destinés à produire des revenus.", color: "#ef4444" },
  { id: "enjoyment", label: "Plaisir et loisirs", shortLabel: "Plaisir", description: "Loisirs assumés, sans culpabilité ni dépassement.", color: "#4f46e5" },
  { id: "longTerm", label: "Épargne long terme", shortLabel: "Long terme", description: "Sécurité, fonds d’urgence et projets de long terme.", color: "#22c55e" },
  { id: "education", label: "Éducation", shortLabel: "Éducation", description: "Formations, livres et développement des compétences.", color: "#f59e0b" },
  { id: "giving", label: "Dons et solidarité", shortLabel: "Dons", description: "Générosité, famille, communauté et œuvres.", color: "#e11d48" },
];

export const SIX_POCKETS_PRESET: MoneyPocketPercentages = {
  necessities: 50,
  freedom: 10,
  enjoyment: 10,
  longTerm: 10,
  education: 10,
  giving: 10,
};

export const DEFAULT_MONEY_ALLOCATION_CONFIG: MoneyAllocationConfig = {
  enabled: true,
  incomeBasis: "EXPECTED",
  percentages: SIX_POCKETS_PRESET,
  categoryAssignments: {},
};

export function moneyPlanPercentageTotal(percentages: MoneyPocketPercentages): number {
  return MONEY_POCKET_IDS.reduce((sum, id) => sum + percentages[id], 0);
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function inferExpensePocket(categoryName: string): MoneyPocketId | null {
  const value = normalize(categoryName);
  if (/formation|education|livre|certification|cours/.test(value)) return "education";
  if (/loisir|plaisir|sortie|vacance|jeu|divertissement/.test(value)) return "enjoyment";
  return null;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function computeMoneyAllocation(
  state: LifeOSState,
  config: MoneyAllocationConfig,
  today = new Date(state.today)
): MoneyAllocationResult {
  const summary = monthlySummary(state.transactions, today.getFullYear(), today.getMonth() + 1);
  const income = config.incomeBasis === "ACTUAL"
    ? summary.income
    : computeCapacity(state, today).expectedMonthlyIncome;
  const actual = Object.fromEntries(MONEY_POCKET_IDS.map((id) => [id, 0])) as MoneyPocketPercentages;
  const categoriesById = new Map(state.categories.map((category) => [category.id, category]));
  const accountsById = new Map(state.accounts.map((account) => [account.id, account]));
  const activeMonth = monthKey(today);
  let unclassified = 0;

  for (const transaction of state.transactions) {
    if (monthKey(new Date(transaction.date)) !== activeMonth) continue;
    const amountWithFees = transaction.amount + transaction.fee;
    if (transaction.type === "DONATION") {
      actual.giving += amountWithFees;
      continue;
    }
    if (transaction.type === "INVESTMENT" || transaction.type === "ASSET_BUY") {
      actual.freedom += amountWithFees;
      continue;
    }
    if (transaction.type === "TRANSFER") {
      const destination = transaction.toAccountId ? accountsById.get(transaction.toAccountId) : null;
      if (destination?.type === "SAVINGS") actual.longTerm += transaction.amount;
      else if (transaction.fee > 0) unclassified += transaction.fee;
      continue;
    }
    if (transaction.type === "DEPOSIT") {
      if (accountsById.get(transaction.accountId)?.type === "SAVINGS") actual.longTerm += transaction.amount;
      if (transaction.fee > 0) unclassified += transaction.fee;
      continue;
    }
    if (transaction.type !== "EXPENSE") {
      if (transaction.fee > 0) unclassified += transaction.fee;
      continue;
    }

    const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : undefined;
    const categoryName = category?.name ?? transaction.category ?? "Sans catégorie";
    const assigned = transaction.categoryId
      ? config.categoryAssignments[transaction.categoryId]
      : undefined;
    const pocket = assigned ?? (category?.essential ? "necessities" : inferExpensePocket(categoryName));
    if (pocket) actual[pocket] += amountWithFees;
    else unclassified += amountWithFees;
  }

  const rows = MONEY_POCKETS.map((pocket) => {
    const percentage = config.percentages[pocket.id];
    const target = Math.round(income * percentage / 100);
    const pocketActual = actual[pocket.id];
    return {
      ...pocket,
      percentage,
      target,
      actual: pocketActual,
      remaining: target - pocketActual,
      actualPercentage: income > 0 ? pocketActual / income * 100 : 0,
    };
  });

  return {
    income,
    totalPercentage: moneyPlanPercentageTotal(config.percentages),
    totalTarget: rows.reduce((sum, row) => sum + row.target, 0),
    totalActual: rows.reduce((sum, row) => sum + row.actual, 0),
    unclassified,
    rows,
  };
}
