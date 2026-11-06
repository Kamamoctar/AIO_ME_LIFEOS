// Life OS — Moteur financier
// Fonctions pures, fortement typées, explicables (chaque KPI expose son calcul).
// RÈGLES ABSOLUES :
//  - Un transfert ne crée NI revenu NI dépense (seuls les frais sont une dépense).
//  - Un investissement déplace du cash vers un actif : le patrimoine ne diminue pas.
//  - Une provision ne crée pas de dépense réelle.
//  - Une simulation ne modifie jamais les données réelles.

import {
  EXPENSE_TYPES,
  INCOME_TYPES,
} from "./constants";
import { daysBetween, monthKey, monthsBetween } from "./format";
import type {
  AppAccount,
  AppCharge,
  AppGoal,
  AppFundAllocation,
  AppPosition,
  AppProject,
  AppSettings,
  AppTransaction,
  LifeOSState,
} from "./types";

// ---------------------------------------------------------------------------
// Soldes de comptes
// ---------------------------------------------------------------------------

/** Signe de l'impact d'une transaction sur le compte source. */
function outflowOf(type: string): boolean {
  return ["EXPENSE", "DONATION", "INVESTMENT", "TRANSFER", "WITHDRAWAL", "ASSET_BUY"].includes(
    type
  );
}

function inflowOf(type: string): boolean {
  return ["INCOME", "DIVIDEND", "DEPOSIT", "ASSET_SELL"].includes(type);
}

export interface AccountBalance {
  accountId: string;
  initial: number;
  inflows: number;
  outflows: number;
  balance: number;
}

export function computeAccountBalances(
  accounts: AppAccount[],
  transactions: AppTransaction[]
): Map<string, AccountBalance> {
  const map = new Map<string, AccountBalance>();
  for (const a of accounts) {
    map.set(a.id, {
      accountId: a.id,
      initial: a.initialBalance,
      inflows: 0,
      outflows: 0,
      balance: a.initialBalance,
    });
  }
  for (const t of transactions) {
    const src = map.get(t.accountId);
    if (src) {
      if (outflowOf(t.type)) {
        src.outflows += t.amount + (t.fee || 0);
      } else if (inflowOf(t.type)) {
        src.inflows += t.amount;
      } else if (t.type === "ADJUSTMENT") {
        // montant signé : positif = correction en hausse
        if (t.amount >= 0) src.inflows += t.amount;
        else src.outflows += -t.amount;
      }
    }
    if (t.toAccountId) {
      const dst = map.get(t.toAccountId);
      if (dst && t.type === "TRANSFER") dst.inflows += t.amount;
    }
  }
  for (const b of map.values()) b.balance = b.initial + b.inflows - b.outflows;
  return map;
}

// ---------------------------------------------------------------------------
// Résumé mensuel (revenus / dépenses réels)
// ---------------------------------------------------------------------------

export interface MonthlySummary {
  key: string; // yyyy-mm
  income: number;
  expenses: number; // consommation réelle (dépenses + dons + frais de transfert)
  fees: number;
  invested: number; // investissements (sorties de cash mais pas de consommation)
  donations: number;
  netSavings: number; // revenus − dépenses
  byCategory: Map<string, number>;
  transactionCount: number;
}

export function monthlySummary(
  transactions: AppTransaction[],
  year: number,
  month: number // 1-12
): MonthlySummary {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const s: MonthlySummary = {
    key,
    income: 0,
    expenses: 0,
    fees: 0,
    invested: 0,
    donations: 0,
    netSavings: 0,
    byCategory: new Map(),
    transactionCount: 0,
  };
  for (const t of transactions) {
    const d = new Date(t.date);
    if (monthKey(d) !== key) continue;
    s.transactionCount++;
    const cat = t.category || "Sans catégorie";
    if (INCOME_TYPES.includes(t.type as never)) {
      s.income += t.amount;
    } else if (t.type === "DONATION") {
      s.donations += t.amount;
      s.expenses += t.amount + t.fee;
      s.fees += t.fee;
      s.byCategory.set(
        "Dons / Solidarité",
        (s.byCategory.get("Dons / Solidarité") || 0) + t.amount + t.fee
      );
    } else if (t.type === "EXPENSE") {
      s.expenses += t.amount + t.fee;
      s.fees += t.fee;
      s.byCategory.set(cat, (s.byCategory.get(cat) || 0) + t.amount + t.fee);
    } else if (t.type === "TRANSFER") {
      // Les frais de transfert sont une vraie dépense
      if (t.fee > 0) {
        s.expenses += t.fee;
        s.fees += t.fee;
      }
    } else if (t.type === "INVESTMENT") {
      s.invested += t.amount;
      if (t.fee > 0) {
        s.expenses += t.fee;
        s.fees += t.fee;
      }
    } else if (t.type === "WITHDRAWAL" || t.type === "DEPOSIT" || t.type === "ASSET_BUY" || t.type === "ASSET_SELL") {
      if (t.fee > 0) s.expenses += t.fee;
    }
  }
  s.netSavings = s.income - s.expenses;
  return s;
}

export interface HouseholdExpenseBreakdown {
  total: number;
  byCategory: { label: string; amount: number; percentage: number }[];
  byMember: { label: string; amount: number; percentage: number }[];
}

export function householdExpenseBreakdown(
  transactions: AppTransaction[],
  year: number,
  month: number
): HouseholdExpenseBreakdown {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const categories = new Map<string, number>();
  const members = new Map<string, number>();
  let total = 0;
  for (const transaction of transactions) {
    if (monthKey(new Date(transaction.date)) !== key) continue;
    let amount = 0;
    if (["EXPENSE", "DONATION"].includes(transaction.type)) {
      amount = transaction.amount + transaction.fee;
    } else if (transaction.fee > 0) {
      amount = transaction.fee;
    }
    if (amount <= 0) continue;
    total += amount;
    const category =
      transaction.type === "DONATION"
        ? "Dons / Solidarité"
        : transaction.category ?? "Sans catégorie";
    const member = transaction.ownerName ?? "Membre non identifié";
    categories.set(category, (categories.get(category) ?? 0) + amount);
    members.set(member, (members.get(member) ?? 0) + amount);
  }
  const rows = (source: Map<string, number>) =>
    [...source.entries()]
      .map(([label, amount]) => ({
        label,
        amount,
        percentage: total > 0 ? amount / total : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  return { total, byCategory: rows(categories), byMember: rows(members) };
}

export interface MonthlyBudgetLine {
  id: string;
  label: string;
  planned: number;
  actual: number;
  remaining: number;
}

export interface UpcomingBudgetCharge {
  id: string;
  label: string;
  dueDate: string;
  daysUntilDue: number;
  amount: number;
  provisioned: number;
  remainingToProvision: number;
}

export interface HouseholdMonthlyBudget {
  expectedIncome: number;
  actualIncome: number;
  operatingBudget: number;
  actualOperatingExpenses: number;
  remainingOperatingBudget: number;
  provisionsBudget: number;
  securityBudget: number;
  projectBudget: number;
  actualProjectExpenses: number;
  investmentBudget: number;
  actualInvestments: number;
  safetyMargin: number;
  totalPlannedOutflows: number;
  plannedRemainder: number;
  forecastRemainder: number;
  currentCashFlow: number;
  unbudgetedSpending: number;
  spendingPace: number;
  lines: MonthlyBudgetLine[];
  upcomingCharges: UpcomingBudgetCharge[];
}

/**
 * Budget consolide du foyer. Une categorie, une charge et une enveloppe liees
 * representent la meme obligation : le maximum est retenu pour eviter de
 * compter deux fois le loyer ou une autre charge garantie.
 */
export function householdMonthlyBudget(
  state: LifeOSState,
  today: Date
): HouseholdMonthlyBudget {
  const summary = monthlySummary(
    state.transactions,
    today.getFullYear(),
    today.getMonth() + 1
  );
  const capacity = computeCapacity(state, today);
  const targetedExpenses = state.transactions.reduce((sum, transaction) => {
    const date = new Date(transaction.date);
    if (
      monthKey(date) !== summary.key ||
      !["EXPENSE", "DONATION"].includes(transaction.type) ||
      (!transaction.projectId && !transaction.goalId)
    ) {
      return sum;
    }
    return sum + transaction.amount + transaction.fee;
  }, 0);
  const operatingByCategory = new Map(summary.byCategory);
  for (const transaction of state.transactions) {
    if (
      monthKey(new Date(transaction.date)) !== summary.key ||
      !["EXPENSE", "DONATION"].includes(transaction.type) ||
      (!transaction.projectId && !transaction.goalId)
    ) {
      continue;
    }
    const label =
      transaction.type === "DONATION"
        ? "Dons / Solidarité"
        : transaction.category ?? "Sans catégorie";
    operatingByCategory.set(
      label,
      Math.max(
        0,
        (operatingByCategory.get(label) ?? 0) -
          transaction.amount -
          transaction.fee
      )
    );
  }
  const categoryPlans = new Map<string, { id: string; label: string; planned: number }>();
  const expenseCategories = state.categories.filter((category) =>
    ["EXPENSE", "DONATION"].includes(category.kind)
  );

  for (const category of expenseCategories) {
    categoryPlans.set(category.id, {
      id: `category:${category.id}`,
      label: category.name,
      planned: Math.max(0, category.budgetMonthly ?? 0),
    });
  }

  const operatingEnvelopeGroups = new Set(["OBLIGATOIRE", "PERSONNEL"]);
  const linkedEnvelopeBudgets = new Map<string, number>();
  const standaloneLines: MonthlyBudgetLine[] = [];
  for (const envelope of state.envelopes) {
    if (!operatingEnvelopeGroups.has(envelope.group)) continue;
    const categoryId =
      envelope.categoryId ??
      expenseCategories.find((category) => category.name === envelope.name)?.id ??
      null;
    if (categoryId && categoryPlans.has(categoryId)) {
      linkedEnvelopeBudgets.set(
        categoryId,
        (linkedEnvelopeBudgets.get(categoryId) ?? 0) + envelope.budget
      );
    } else {
      const actual = operatingByCategory.get(envelope.name) ?? 0;
      standaloneLines.push({
        id: `envelope:${envelope.id}`,
        label: envelope.name,
        planned: Math.max(0, envelope.budget),
        actual,
        remaining: Math.max(0, envelope.budget - actual),
      });
    }
  }

  const linkedMonthlyCharges = new Map<string, number>();
  for (const charge of state.charges) {
    if (!charge.active || charge.frequency !== "MONTHLY") continue;
    const categoryId =
      charge.categoryId ??
      expenseCategories.find((category) => category.name === charge.label)?.id ??
      null;
    if (categoryId && categoryPlans.has(categoryId)) {
      linkedMonthlyCharges.set(
        categoryId,
        (linkedMonthlyCharges.get(categoryId) ?? 0) + charge.amount
      );
    } else {
      const actual = operatingByCategory.get(charge.label) ?? 0;
      standaloneLines.push({
        id: `charge:${charge.id}`,
        label: charge.label,
        planned: charge.amount,
        actual,
        remaining: Math.max(0, charge.amount - actual),
      });
    }
  }

  const categoryLines = [...categoryPlans.entries()].map(([categoryId, plan]) => {
    const planned = Math.max(
      plan.planned,
      linkedEnvelopeBudgets.get(categoryId) ?? 0,
      linkedMonthlyCharges.get(categoryId) ?? 0
    );
    const actual = operatingByCategory.get(plan.label) ?? 0;
    return {
      id: plan.id,
      label: plan.label,
      planned,
      actual,
      remaining: Math.max(0, planned - actual),
    };
  });
  const lines = [...categoryLines, ...standaloneLines]
    .filter((line) => line.planned > 0 || line.actual > 0)
    .sort((a, b) => b.planned - a.planned || b.actual - a.actual);

  const actualOperatingExpenses = Math.max(0, summary.expenses - targetedExpenses);
  const operatingBudget = lines.reduce((sum, line) => sum + line.planned, 0);
  const remainingOperatingBudget = lines.reduce(
    (sum, line) => sum + line.remaining,
    0
  );
  const envelopeBudget = (group: string) =>
    state.envelopes
      .filter((envelope) => envelope.group === group)
      .reduce((sum, envelope) => sum + envelope.budget, 0);
  const securityBudget = envelopeBudget("SECURITE");
  const projectBudget = envelopeBudget("PROJETS");
  const investmentBudget = envelopeBudget("INVESTISSEMENT");
  const provisionsBudget = capacity.provisionsNeeded;
  const safetyMargin = capacity.safetyMargin;
  const totalPlannedOutflows =
    operatingBudget +
    provisionsBudget +
    securityBudget +
    projectBudget +
    investmentBudget +
    safetyMargin;
  const lineActualTotal = lines.reduce((sum, line) => sum + line.actual, 0);
  const actualWithoutLine = Math.max(0, actualOperatingExpenses - lineActualTotal);
  const operatingForecast =
    lines.reduce((sum, line) => sum + Math.max(line.planned, line.actual), 0) +
    actualWithoutLine;
  const forecastOutflows =
    operatingForecast +
    provisionsBudget +
    securityBudget +
    Math.max(projectBudget, targetedExpenses) +
    Math.max(investmentBudget, summary.invested) +
    safetyMargin;

  const unbudgetedSpending =
    lines
      .filter((line) => line.planned <= 0)
      .reduce((sum, line) => sum + line.actual, 0) + actualWithoutLine;
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  const elapsedRatio = Math.max(1 / daysInMonth, today.getDate() / daysInMonth);
  const expectedAtThisDate = operatingBudget * elapsedRatio;
  const spendingPace =
    expectedAtThisDate > 0 ? actualOperatingExpenses / expectedAtThisDate : 0;

  const upcomingCharges = state.charges
    .filter((charge) => charge.active && charge.nextDueDate)
    .map((charge) => {
      const cost = chargeMonthlyCost(charge, today);
      return {
        id: charge.id,
        label: charge.label,
        dueDate: charge.nextDueDate!,
        daysUntilDue: daysBetween(today, new Date(charge.nextDueDate!)),
        amount: charge.amount,
        provisioned: charge.provisioned,
        remainingToProvision: cost.remainingToProvision,
      };
    })
    .filter((charge) => charge.daysUntilDue >= -31 && charge.daysUntilDue <= 120)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return {
    expectedIncome: capacity.expectedMonthlyIncome,
    actualIncome: summary.income,
    operatingBudget,
    actualOperatingExpenses,
    remainingOperatingBudget,
    provisionsBudget,
    securityBudget,
    projectBudget,
    actualProjectExpenses: targetedExpenses,
    investmentBudget,
    actualInvestments: summary.invested,
    safetyMargin,
    totalPlannedOutflows,
    plannedRemainder: capacity.expectedMonthlyIncome - totalPlannedOutflows,
    forecastRemainder: capacity.expectedMonthlyIncome - forecastOutflows,
    currentCashFlow: summary.income - summary.expenses - summary.invested,
    unbudgetedSpending,
    spendingPace,
    lines,
    upcomingCharges,
  };
}

export function monthlySeries(
  transactions: AppTransaction[],
  monthsBack: number,
  today: Date
): { label: string; income: number; expenses: number; savings: number; key: string }[] {
  const out: { label: string; income: number; expenses: number; savings: number; key: string }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const s = monthlySummary(transactions, d.getFullYear(), d.getMonth() + 1);
    out.push({
      key: s.key,
      label: `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`,
      income: s.income,
      expenses: s.expenses,
      savings: s.netSavings,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Dépenses essentielles & charges
// ---------------------------------------------------------------------------

export interface ChargeMonthlyCost {
  id: string;
  label: string;
  monthlyEquivalent: number;
  frequency: string;
  nextDueDate: string | null;
  monthsToDue: number | null;
  remainingToProvision: number; // reste à provisionner
  recommendedMonthlyProvision: number; // provision recommandée / mois
}

export function chargeMonthlyCost(c: AppCharge, today: Date): ChargeMonthlyCost {
  let monthlyEquivalent = c.amount;
  if (c.frequency === "ANNUAL") monthlyEquivalent = Math.round(c.amount / 12);
  else if (c.frequency === "QUARTERLY") monthlyEquivalent = Math.round(c.amount / 3);
  else if (c.frequency === "CUSTOM") monthlyEquivalent = c.amount;

  let monthsToDue: number | null = null;
  let recommended = 0;
  let remaining = 0;
  if (c.nextDueDate) {
    const due = new Date(c.nextDueDate);
    monthsToDue = monthsBetween(today, due);
    remaining = Math.max(0, c.amount - c.provisioned);
    if (c.frequency !== "MONTHLY") {
      recommended =
        monthsToDue > 0 ? Math.ceil(remaining / monthsToDue) : remaining;
    } else {
      recommended = 0;
    }
  }
  return {
    id: c.id,
    label: c.label,
    monthlyEquivalent,
    frequency: c.frequency,
    nextDueDate: c.nextDueDate,
    monthsToDue,
    remainingToProvision: remaining,
    recommendedMonthlyProvision: recommended,
  };
}

export interface EssentialExpenses {
  total: number;
  items: { label: string; amount: number }[];
}

/** Dépenses essentielles mensuelles : charges MENSUELLES actives + catégories essentielles réalisées.
 *  Les charges annuelles/trimestrielles sont traitées via les provisions (pas de double comptage). */
export function essentialMonthlyExpenses(
  state: Pick<LifeOSState, "charges" | "categories" | "transactions">,
  today: Date
): EssentialExpenses {
  const items: { label: string; amount: number }[] = [];
  // Charges récurrentes mensuelles actives uniquement
  for (const c of state.charges) {
    if (!c.active || c.frequency !== "MONTHLY") continue;
    items.push({ label: c.label, amount: c.amount });
  }
  // Catégories essentielles : moyenne des dépenses réelles sur 3 mois
  const essentialCats = new Set(
    state.categories.filter((c) => c.essential).map((c) => c.name)
  );
  const chargeLabels = new Set(state.charges.map((c) => c.label));
  if (essentialCats.size > 0) {
    const totals = new Map<string, number>();
    for (let i = 0; i < 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const s = monthlySummary(state.transactions, d.getFullYear(), d.getMonth() + 1);
      for (const [cat, amount] of s.byCategory) {
        if (essentialCats.has(cat) && !chargeLabels.has(cat)) {
          totals.set(cat, (totals.get(cat) ?? 0) + amount);
        }
      }
    }
    for (const [cat, total] of totals) {
      items.push({ label: cat, amount: Math.round(total / 3) });
    }
  }
  const total = items.reduce((sum, it) => sum + it.amount, 0);
  return { total, items };
}

// ---------------------------------------------------------------------------
// Capacité financière
// ---------------------------------------------------------------------------

export interface CapacityBreakdown {
  expectedMonthlyIncome: number; // salaire + revenus récurrents connus
  salary: number;
  otherRecurringIncome: number;
  essentialExpenses: number;
  provisionsNeeded: number; // provisions recommandées ce mois
  safetyMargin: number;
  savingsCapacity: number; // capacité d'épargne mensuelle
  emergencyFundContribution: number; // contribution fonds d'urgence si non atteint
  projectAllocation: number; // allocation projets prioritaires
  investmentCapacity: number; // capacité d'investissement
  freeMoney: number; // argent libre de ce mois
  steps: { label: string; value: number; kind: "in" | "out" }[];
}

export function computeCapacity(
  state: LifeOSState,
  today: Date
): CapacityBreakdown {
  const settings: AppSettings = state.settings;
  // Revenu attendu : salaire + charges récurrentes de type revenu? (les charges = dépenses)
  // Revenus complémentaires : moyenne des revenus non salariaux sur 3 mois
  const nowS = monthlySummary(state.transactions, today.getFullYear(), today.getMonth() + 1);
  let otherRecurringIncome = 0;
  {
    // moyenne revenus non "Salaire" des 3 derniers mois
    let total = 0;
    for (let i = 0; i < 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const s = monthlySummary(state.transactions, d.getFullYear(), d.getMonth() + 1);
      for (const t of state.transactions) {
        const td = new Date(t.date);
        if (monthKey(td) !== s.key) continue;
        if (INCOME_TYPES.includes(t.type as never) && t.category && t.category !== "Salaire") {
          total += t.amount;
        }
      }
    }
    otherRecurringIncome = Math.round(total / 3);
  }

  const configuredIncome = (state.incomeSources ?? [])
    .filter((source) => source.active)
    .reduce((sum, source) => sum + source.monthlyAmount, 0);
  const configuredSalary = (state.incomeSources ?? [])
    .filter((source) => source.active && source.kind === "SALARY")
    .reduce((sum, source) => sum + source.monthlyAmount, 0);
  const expectedMonthlyIncome =
    configuredIncome > 0
      ? configuredIncome
      : settings.salaryMonthly + otherRecurringIncome;

  const essentials = essentialMonthlyExpenses(state, today);

  // Provisions recommandées ce mois (charges annuelles/trimestrielles)
  const provisionsNeeded = state.charges
    .filter((c) => c.active && c.frequency !== "MONTHLY")
    .reduce((sum, c) => {
      if (c.nextDueDate) {
        return sum + chargeMonthlyCost(c, today).recommendedMonthlyProvision;
      }
      // pas de date d'échéance : équivalent mensuel pour ne pas perdre la charge du budget
      return sum + chargeMonthlyCost(c, today).monthlyEquivalent;
    }, 0);

  const safetyMargin = settings.safetyMargin;

  // Fonds d'urgence
  const ef = computeEmergencyFund(state, today);
  const emergencyFundContribution =
    ef.missing > 0 ? Math.min(Math.ceil(ef.missing / 6), Math.max(0, expectedMonthlyIncome - essentials.total - provisionsNeeded)) : 0;

  // Capacité d'épargne = revenus − essentiels − provisions − marge
  const savingsCapacity = Math.max(
    0,
    expectedMonthlyIncome - essentials.total - provisionsNeeded - safetyMargin
  );

  // Allocation projets prioritaires : besoin mensuel des projets sous-financés à échéance < 18 mois
  const projectsNeed = priorityProjectsNeed(state, today);
  const projectAllocation = Math.min(projectsNeed, savingsCapacity - emergencyFundContribution);

  const investmentCapacity = Math.max(
    0,
    savingsCapacity - emergencyFundContribution - Math.max(0, projectAllocation)
  );

  const freeMoney = Math.max(0, nowS.netSavings); // réalisé ce mois

  const steps: { label: string; value: number; kind: "in" | "out" }[] = [
    {
      label: "Revenus mensuels du foyer",
      value: configuredIncome > 0 ? configuredIncome : settings.salaryMonthly,
      kind: "in",
    },
  ];
  if (otherRecurringIncome > 0)
    steps.push({ label: "Revenus complémentaires (moy. 3 mois)", value: otherRecurringIncome, kind: "in" });
  for (const it of essentials.items)
    steps.push({ label: `Essentiel — ${it.label}`, value: -it.amount, kind: "out" });
  steps.push({ label: "Provisions recommandées", value: -provisionsNeeded, kind: "out" });
  steps.push({ label: "Marge de sécurité", value: -safetyMargin, kind: "out" });
  steps.push({ label: "= Capacité d'épargne mensuelle", value: savingsCapacity, kind: "in" });

  return {
    expectedMonthlyIncome,
    salary: configuredIncome > 0 ? configuredSalary : settings.salaryMonthly,
    otherRecurringIncome:
      configuredIncome > 0
        ? configuredIncome - configuredSalary
        : otherRecurringIncome,
    essentialExpenses: essentials.total,
    provisionsNeeded,
    safetyMargin,
    savingsCapacity,
    emergencyFundContribution,
    projectAllocation: Math.max(0, projectAllocation),
    investmentCapacity,
    freeMoney,
    steps,
  };
}

/** Besoin mensuel des projets/objectifs prioritaires sous-financés (échéance ≤ 18 mois). */
export function priorityProjectsNeed(state: LifeOSState, today: Date): number {
  let need = 0;
  for (const p of state.projects) {
    if (p.archived || p.status === "TERMINE" || p.status === "ANNULE") continue;
    if (!p.budget || !p.targetDate) continue;
    const months = monthsBetween(today, new Date(p.targetDate));
    if (months > 18) continue;
    const funded = projectFunding(p, state.transactions, state.fundAllocations);
    const remaining = Math.max(0, p.budget - funded.funded);
    if (remaining <= 0) continue;
    need += months > 0 ? Math.ceil(remaining / months) : remaining;
  }
  for (const g of state.goals) {
    if (g.isSuggested && g.suggestedState !== "ACCEPTED") continue;
    if (!g.budget || !g.targetDate) continue;
    if (["TERMINE", "ANNULE", "REPORTE"].includes(g.status)) continue;
    const months = monthsBetween(today, new Date(g.targetDate));
    if (months > 18) continue;
    const remaining = Math.max(
      0,
      g.budget - goalFunding(g, state.fundAllocations)
    );
    if (remaining <= 0) continue;
    need += months > 0 ? Math.ceil(remaining / months) : remaining;
  }
  return need;
}

// ---------------------------------------------------------------------------
// Fonds d'urgence
// ---------------------------------------------------------------------------

export interface EmergencyFundStatus {
  target: number;
  months: number;
  essentialMonthly: number;
  available: number; // épargne disponible (comptes épargne) — configurable
  missing: number;
  progress: number; // 0-1
}

export function computeEmergencyFund(
  state: LifeOSState,
  today: Date
): EmergencyFundStatus {
  const essentials = essentialMonthlyExpenses(state, today);
  const target = essentials.total * state.settings.emergencyFundMonths;
  // Disponible : comptes de type Épargne (sinon 0 → à configurer)
  const cash = computeAvailableCash(state);
  let available = 0;
  for (const a of state.accounts) {
    if (a.type === "SAVINGS" && !a.archived) {
      available +=
        cash.accounts.find((account) => account.accountId === a.id)?.available ?? 0;
    }
  }
  const missing = Math.max(0, target - available);
  return {
    target,
    months: state.settings.emergencyFundMonths,
    essentialMonthly: essentials.total,
    available,
    missing,
    progress: target > 0 ? Math.min(1, available / target) : 0,
  };
}

// ---------------------------------------------------------------------------
// Patrimoine
// ---------------------------------------------------------------------------

export interface NetWorthBreakdown {
  cash: number; // comptes cash (espèces, mobile money, banque, épargne)
  brvm: number; // valeur positions BRVM + wallet BRVM
  copyTrading: number;
  otherInvestments: number;
  businesses: number;
  manualAssets: number; // actifs saisis manuellement (terrain, maison…)
  totalAssets: number;
  liabilities: number;
  netWorth: number;
}

export function computeNetWorth(state: LifeOSState): NetWorthBreakdown {
  const balances = computeAccountBalances(state.accounts, state.transactions);
  let cash = 0;
  let brvmWallet = 0;
  for (const a of state.accounts) {
    if (a.archived) continue;
    const b = balances.get(a.id)?.balance ?? 0;
    if (a.type === "BRVM") brvmWallet += b;
    else if (a.type !== "COPY_TRADING") cash += b;
  }
  const brvmPositions = state.positions
    .filter((p) => p.active)
    .reduce((s, p) => s + p.quantity * p.currentPrice, 0);
  const copyTrading = state.copyTrading.reduce((s, c) => s + c.currentValue, 0);
  const otherInvestments = state.otherInvestments.reduce(
    (s, o) => s + o.currentValue,
    0
  );
  const businesses = state.businesses.reduce((s, b) => s + b.capitalInvested, 0);
  const manualAssets = state.assets.reduce((s, a) => s + a.value, 0);
  const liabilities = state.liabilities.reduce((s, l) => s + l.amount, 0);
  const totalAssets =
    cash + brvmWallet + brvmPositions + copyTrading + otherInvestments + businesses + manualAssets;
  return {
    cash,
    brvm: brvmWallet + brvmPositions,
    copyTrading,
    otherInvestments,
    businesses,
    manualAssets,
    totalAssets,
    liabilities,
    netWorth: totalAssets - liabilities,
  };
}

// ---------------------------------------------------------------------------
// BRVM
// ---------------------------------------------------------------------------

export interface BrvmStats {
  totalCost: number; // coût d'acquisition (qty × prix + frais)
  totalValue: number; // valeur actuelle
  totalDividends: number;
  unrealizedGain: number;
  performance: number; // plus-value / coût
  dividendYield: number; // dividendes / coût
  totalPerformance: number; // (valeur + dividendes − coût) / coût
  lines: {
    id: string;
    company: string;
    ticker: string | null;
    quantity: number;
    cost: number;
    value: number;
    gain: number;
    performance: number;
    dividends: number;
    avgBuyPrice: number;
  }[];
}

export function computeBrvmStats(positions: AppPosition[]): BrvmStats {
  const lines = positions
    .filter((p) => p.active && p.quantity > 0)
    .map((p) => {
      const cost = Math.round(p.quantity * p.avgBuyPrice + p.feesPaid);
      const value = Math.round(p.quantity * p.currentPrice);
      const gain = value - cost;
      return {
        id: p.id,
        company: p.company,
        ticker: p.ticker,
        quantity: p.quantity,
        cost,
        value,
        gain,
        performance: cost > 0 ? gain / cost : 0,
        dividends: p.dividends,
        avgBuyPrice: p.avgBuyPrice,
      };
    });
  const totalCost = lines.reduce((s, l) => s + l.cost, 0);
  const totalValue = lines.reduce((s, l) => s + l.value, 0);
  const totalDividends = lines.reduce((s, l) => s + l.dividends, 0);
  const unrealizedGain = totalValue - totalCost;
  return {
    totalCost,
    totalValue,
    totalDividends,
    unrealizedGain,
    performance: totalCost > 0 ? unrealizedGain / totalCost : 0,
    dividendYield: totalCost > 0 ? totalDividends / totalCost : 0,
    totalPerformance:
      totalCost > 0 ? (totalValue + totalDividends - totalCost) / totalCost : 0,
    lines,
  };
}

// ---------------------------------------------------------------------------
// Projets — financement
// ---------------------------------------------------------------------------

export interface ProjectFunding {
  projectId: string;
  budget: number | null;
  funded: number; // montant affecté/sécurisé (funded champ + dépenses projet)
  spent: number; // dépenses réelles rattachées
  available: number; // financé − dépensé
  remainingToFund: number; // budget − financé
  financialProgress: number; // financé / budget
  spentProgress: number; // dépensé / budget
}

export function goalFunding(
  goal: AppGoal,
  allocations: AppFundAllocation[] = []
): number {
  const active = allocations.filter(
    (allocation) => allocation.goalId === goal.id && allocation.status === "ACTIVE"
  );
  return active.length > 0
    ? active.reduce((sum, allocation) => sum + allocation.amount, 0)
    : goal.funded;
}

export function projectFunding(
  project: AppProject,
  transactions: AppTransaction[],
  allocations: AppFundAllocation[] = []
): ProjectFunding {
  let funded = allocations
    .filter(
      (allocation) =>
        allocation.projectId === project.id && allocation.status === "ACTIVE"
    )
    .reduce((sum, allocation) => sum + allocation.amount, 0);
  let spent = 0;
  for (const t of transactions) {
    if (t.projectId !== project.id) continue;
    if (allocations.length === 0 && (t.type === "PROJECT" || t.type === "DEPOSIT")) {
      // affectation de fonds au projet (l'argent est réservé)
      funded += t.amount;
    } else if (["EXPENSE", "DONATION"].includes(t.type)) {
      spent += t.amount;
    }
  }
  const budget = project.budget;
  return {
    projectId: project.id,
    budget,
    funded,
    spent,
    available: funded - spent,
    remainingToFund: budget !== null ? Math.max(0, budget - funded) : 0,
    financialProgress:
      budget && budget > 0 ? Math.min(1, funded / budget) : 0,
    spentProgress: budget && budget > 0 ? Math.min(1, spent / budget) : 0,
  };
}

export interface AvailableCashLine {
  accountId: string;
  balance: number;
  reserved: number;
  available: number;
}

function effectiveReservationsByAccount(state: LifeOSState): Map<string, number> {
  const groups = new Map<string, { accountId: string; allocated: number; spent: number }>();
  for (const allocation of state.fundAllocations ?? []) {
    if (allocation.status !== "ACTIVE") continue;
    const target = allocation.projectId
      ? `project:${allocation.projectId}`
      : allocation.goalId
        ? `goal:${allocation.goalId}`
        : null;
    if (!target) continue;
    const key = `${allocation.accountId}:${target}`;
    const group = groups.get(key) ?? {
      accountId: allocation.accountId,
      allocated: 0,
      spent: 0,
    };
    group.allocated += allocation.amount;
    groups.set(key, group);
  }
  for (const transaction of state.transactions) {
    if (!["EXPENSE", "DONATION"].includes(transaction.type)) continue;
    const target = transaction.projectId
      ? `project:${transaction.projectId}`
      : transaction.goalId
        ? `goal:${transaction.goalId}`
        : null;
    if (!target) continue;
    const key = `${transaction.accountId}:${target}`;
    const group = groups.get(key);
    if (group) group.spent += transaction.amount;
  }
  const byAccount = new Map<string, number>();
  for (const group of groups.values()) {
    byAccount.set(
      group.accountId,
      (byAccount.get(group.accountId) ?? 0) +
        Math.max(0, group.allocated - group.spent)
    );
  }
  return byAccount;
}

/** Solde physiquement present moins les montants deja reserves. */
export function computeAvailableCash(state: LifeOSState): {
  totalBalance: number;
  totalReserved: number;
  totalAvailable: number;
  accounts: AvailableCashLine[];
} {
  const balances = computeAccountBalances(state.accounts, state.transactions);
  const reservations = effectiveReservationsByAccount(state);
  const accounts = state.accounts
    .filter((account) => !account.archived)
    .map((account) => {
      const balance = balances.get(account.id)?.balance ?? 0;
      const reserved = reservations.get(account.id) ?? 0;
      return {
        accountId: account.id,
        balance,
        reserved,
        available: balance - reserved,
      };
    });
  return {
    totalBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
    totalReserved: accounts.reduce((sum, account) => sum + account.reserved, 0),
    totalAvailable: accounts.reduce((sum, account) => sum + account.available, 0),
    accounts,
  };
}

// ---------------------------------------------------------------------------
// Alertes intelligentes (toutes basées sur des données explicables)
// ---------------------------------------------------------------------------

export interface AlertItem {
  id: string;
  severity: "info" | "warning" | "danger" | "success";
  title: string;
  detail: string;
  category: "echeance" | "financement" | "budget" | "fonds" | "retard" | "charge";
  action?: { view: string; label: string };
}

export function generateAlerts(state: LifeOSState, today: Date): AlertItem[] {
  const alerts: AlertItem[] = [];

  // 1. Objectifs / projets sous-financés à échéance proche
  const fundingTargets: {
    kind: string;
    id: string;
    title: string;
    budget: number;
    funded: number;
    targetDate: string | null;
    priority: string;
  }[] = [];
  for (const g of state.goals) {
    if (g.isSuggested && g.suggestedState !== "ACCEPTED") continue;
    if (["TERMINE", "ANNULE", "REPORTE"].includes(g.status)) continue;
    if (g.budget !== null)
      fundingTargets.push({
        kind: "objectif",
        id: g.id,
        title: g.title,
        budget: g.budget,
        funded: goalFunding(g, state.fundAllocations),
        targetDate: g.targetDate,
        priority: g.priority,
      });
  }
  for (const p of state.projects) {
    if (p.archived || ["TERMINE", "ANNULE"].includes(p.status)) continue;
    if (p.budget !== null) {
      const f = projectFunding(p, state.transactions, state.fundAllocations);
      fundingTargets.push({
        kind: "projet",
        id: p.id,
        title: p.name,
        budget: p.budget,
        funded: f.funded,
        targetDate: p.targetDate,
        priority: p.priority,
      });
    }
  }

  const capacity = computeCapacity(state, today);

  for (const f of fundingTargets) {
    const pct = f.budget > 0 ? f.funded / f.budget : 1;
    const remaining = Math.max(0, f.budget - f.funded);
    if (f.targetDate) {
      const months = monthsBetween(today, new Date(f.targetDate));
      const days = daysBetween(today, new Date(f.targetDate));
      if (days >= 0 && days <= 90 && pct < 1) {
        alerts.push({
          id: `ech-${f.id}`,
          severity: days <= 30 ? "danger" : "warning",
          title: `${f.title} : échéance dans ${months} mois`,
        detail: `${f.title} : seulement ${Math.round(pct * 100)} % du budget est financé (${f.funded.toLocaleString(
          "fr-FR"
        )} / ${f.budget.toLocaleString("fr-FR")} FCFA). Reste à financer : ${remaining.toLocaleString(
            "fr-FR"
          )} FCFA.`,
          category: "echeance",
          action: { view: f.kind === "projet" ? "projects" : "goals", label: "Voir" },
        });
      }
      // besoin mensuel vs capacité
      if (months > 0 && remaining > 0) {
        const need = Math.ceil(remaining / months);
        if (need > capacity.savingsCapacity && capacity.savingsCapacity >= 0) {
          alerts.push({
            id: `cap-${f.id}`,
            severity: "warning",
            title: `${f.title} : financement sous tension`,
            detail: `Cet ${f.kind} nécessite ${need.toLocaleString(
              "fr-FR"
            )} FCFA/mois mais ta capacité d'épargne actuelle est de ${capacity.savingsCapacity.toLocaleString(
              "fr-FR"
            )} FCFA/mois. Il faudra augmenter tes revenus, réduire le budget ou reporter l'échéance.`,
            category: "financement",
            action: { view: f.kind === "projet" ? "projects" : "goals", label: "Voir" },
          });
        }
      }
    }
    if (f.budget > 0 && pct < 0.32 && (!f.targetDate || monthsBetween(today, new Date(f.targetDate)) > 3)) {
      alerts.push({
        id: `und-${f.id}`,
        severity: "info",
        title: `${f.title} est sous-financé`,
        detail: `Seulement ${Math.round(pct * 100)} % du budget est financé.`,
        category: "financement",
        action: { view: f.kind === "projet" ? "projects" : "goals", label: "Voir" },
      });
    }
  }

  // 2. Charges annuelles à venir
  for (const c of state.charges) {
    if (!c.active || !c.nextDueDate || c.frequency === "MONTHLY") continue;
    const days = daysBetween(today, new Date(c.nextDueDate));
    if (days >= 0 && days <= 60) {
      const remaining = Math.max(0, c.amount - c.provisioned);
      alerts.push({
        id: `charge-${c.id}`,
        severity: days <= 30 ? "warning" : "info",
        title: `${c.label} arrive dans ${Math.round(days / 30)} mois`,
        detail: `Charge ${c.frequency.toLowerCase()} de ${c.amount.toLocaleString(
          "fr-FR"
        )} FCFA. Reste à provisionner : ${remaining.toLocaleString("fr-FR")} FCFA.`,
        category: "charge",
        action: { view: "finances", label: "Voir les charges" },
      });
    }
  }

  // 3. Dépassements de budget par catégorie (mois courant)
  const nowSummary = monthlySummary(
    state.transactions,
    today.getFullYear(),
    today.getMonth() + 1
  );
  for (const cat of state.categories) {
    if (cat.budgetMonthly === null || cat.budgetMonthly <= 0) continue;
    const spent = nowSummary.byCategory.get(cat.name) || 0;
    if (spent > cat.budgetMonthly) {
      alerts.push({
        id: `budg-${cat.id}`,
        severity: "warning",
        title: `Ton budget ${cat.name} est dépassé`,
        detail: `${cat.name} : réalisé ${spent.toLocaleString("fr-FR")} FCFA pour un budget de ${cat.budgetMonthly.toLocaleString(
          "fr-FR"
        )} FCFA (+${(spent - cat.budgetMonthly).toLocaleString("fr-FR")} FCFA).`,
        category: "budget",
        action: { view: "finances", label: "Voir le budget" },
      });
    }
  }

  // 4. Fonds d'urgence
  const ef = computeEmergencyFund(state, today);
  if (ef.target > 0 && ef.available < ef.target * 0.5) {
    alerts.push({
      id: "ef-low",
      severity: "warning",
      title: "Fonds d'urgence incomplet",
      detail: `Disponible : ${ef.available.toLocaleString("fr-FR")} FCFA sur une cible de ${ef.target.toLocaleString(
        "fr-FR"
      )} FCFA (${ef.months} mois de dépenses essentielles). Manque : ${ef.missing.toLocaleString("fr-FR")} FCFA.`,
      category: "fonds",
      action: { view: "cockpit", label: "Voir le calcul" },
    });
  }

  // 5. Objectifs en retard
  const lateGoals = state.goals.filter((g) => g.status === "EN_RETARD");
  if (lateGoals.length > 0) {
    alerts.push({
      id: "late-goals",
      severity: "danger",
      title: `${lateGoals.length} objectif${lateGoals.length > 1 ? "s" : ""} en retard`,
      detail: lateGoals.map((g) => g.title).join(", "),
      category: "retard",
      action: { view: "goals", label: "Voir les objectifs" },
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Moteur de priorités (top 3-5)
// ---------------------------------------------------------------------------

export interface PriorityItem {
  id: string;
  kind: "objectif" | "projet" | "charge" | "fonds" | "action";
  title: string;
  reason: string;
  score: number;
  amount: number | null;
  view: string;
}

const PRIORITY_WEIGHT: Record<string, number> = {
  CRITIQUE: 40,
  HAUTE: 28,
  MOYENNE: 16,
  FAIBLE: 8,
};

export function computePriorities(state: LifeOSState, today: Date): PriorityItem[] {
  const items: PriorityItem[] = [];
  const capacity = computeCapacity(state, today);

  for (const g of state.goals) {
    if (g.isSuggested && g.suggestedState !== "ACCEPTED") continue;
    if (["TERMINE", "ANNULE", "REPORTE"].includes(g.status)) continue;
    let score = PRIORITY_WEIGHT[g.priority] ?? 10;
    let reason = `Priorité ${g.priority.toLowerCase()}`;
    if (g.targetDate) {
      const months = monthsBetween(today, new Date(g.targetDate));
      if (months <= 12) score += Math.max(0, 24 - months * 2);
      reason += ` · échéance dans ${months} mois`;
      if (g.budget) {
        const remaining = Math.max(
          0,
          g.budget - goalFunding(g, state.fundAllocations)
        );
        const need = months > 0 ? Math.ceil(remaining / months) : remaining;
        if (need > capacity.savingsCapacity) {
          score += 10;
          reason += " · sous tension financière";
        }
      }
    }
    items.push({
      id: g.id,
      kind: "objectif",
      title: g.title,
      reason,
      score,
      amount: g.budget,
      view: "goals",
    });
  }

  for (const p of state.projects) {
    if (p.archived || ["TERMINE", "ANNULE"].includes(p.status)) continue;
    let score = PRIORITY_WEIGHT[p.priority] ?? 10;
    let reason = `Projet · priorité ${p.priority.toLowerCase()}`;
    if (p.targetDate) {
      const months = monthsBetween(today, new Date(p.targetDate));
      if (months <= 12) score += Math.max(0, 22 - months * 2);
      reason += ` · échéance dans ${months} mois`;
    }
    items.push({
      id: p.id,
      kind: "projet",
      title: p.name,
      reason,
      score,
      amount: p.budget,
      view: "projects",
    });
  }

  const ef = computeEmergencyFund(state, today);
  if (ef.missing > 0) {
    items.push({
      id: "ef",
      kind: "fonds",
      title: "Compléter le fonds d'urgence",
      reason: `Manque ${ef.missing.toLocaleString("fr-FR")} FCFA pour atteindre ${ef.months} mois de dépenses essentielles`,
      score: 30,
      amount: ef.missing,
      view: "cockpit",
    });
  }

  return items.sort((a, b) => b.score - a.score).slice(0, 5);
}

// ---------------------------------------------------------------------------
// Projection fin de mois
// ---------------------------------------------------------------------------

export interface EndOfMonthProjection {
  incomeToDate: number;
  expensesToDate: number;
  projectedExpenses: number;
  projectedIncome: number;
  projectedSavings: number;
  daysElapsed: number;
  daysInMonth: number;
  dailyBurn: number;
  assumptions: string[];
}

export function projectEndOfMonth(
  state: LifeOSState,
  today: Date
): EndOfMonthProjection {
  const summary = monthlySummary(
    state.transactions,
    today.getFullYear(),
    today.getMonth() + 1
  );
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  const daysElapsed = today.getDate();
  const dailyBurn = daysElapsed > 0 ? summary.expenses / daysElapsed : 0;
  // Projection : rythme actuel + charges récurrentes restantes du mois
  let knownRemaining = 0;
  const dayOfMonthLeft = daysInMonth - daysElapsed;
  for (const c of state.charges) {
    if (!c.active || c.frequency !== "MONTHLY" || !c.nextDueDate) continue;
    const due = new Date(c.nextDueDate);
    if (due.getMonth() === today.getMonth() && due.getDate() > daysElapsed) {
      // échéance mensuelle encore à venir ce mois-ci (si non déjà payée ce mois)
      const alreadyPaid = state.transactions.some(
        (t) =>
          t.categoryId === c.categoryId &&
          t.type === "EXPENSE" &&
          t.amount === c.amount &&
          monthKey(new Date(t.date)) === monthKey(today)
      );
      if (!alreadyPaid) knownRemaining += c.amount;
    }
  }
  const projectedExpenses = Math.round(
    summary.expenses + dailyBurn * dayOfMonthLeft * 0.7 + knownRemaining
  );
  const projectedIncome =
    summary.income > 0 ? summary.income : state.settings.salaryMonthly;
  return {
    incomeToDate: summary.income,
    expensesToDate: summary.expenses,
    projectedExpenses,
    projectedIncome,
    projectedSavings: projectedIncome - projectedExpenses,
    daysElapsed,
    daysInMonth,
    dailyBurn: Math.round(dailyBurn),
    assumptions: [
      "Rythme de dépense actuel prolongé (pondéré à 70 % pour tenir compte des dépenses déjà réglées)",
      "Charges mensuelles connues non encore payées incluses",
      knownRemaining > 0
        ? `Charges restantes ce mois : ${knownRemaining.toLocaleString("fr-FR")} FCFA`
        : "Aucune charge mensuelle restante détectée",
    ],
  };
}

// ---------------------------------------------------------------------------
// Intérêts composés & projections
// ---------------------------------------------------------------------------

export interface CompoundResult {
  years: number;
  contributions: number; // total versé
  initial: number;
  gains: number; // gains théoriques
  finalValue: number;
  yearly: { year: number; value: number; contributed: number }[];
}

export function compoundProjection(
  initial: number,
  monthly: number,
  annualRate: number, // ex. 0.08
  years: number,
  feesRate = 0 // frais annuels en proportion
): CompoundResult {
  const netRate = annualRate - feesRate;
  const monthlyRate = netRate / 12;
  const yearly: { year: number; value: number; contributed: number }[] = [];
  let value = initial;
  let contributed = initial;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      value = value * (1 + monthlyRate) + monthly;
      contributed += monthly;
    }
    yearly.push({ year: y, value: Math.round(value), contributed: Math.round(contributed) });
  }
  return {
    years,
    contributions: Math.round(contributed),
    initial,
    gains: Math.round(value - contributed),
    finalValue: Math.round(value),
    yearly,
  };
}

/** Quelle mensualité pour atteindre un objectif ? */
export function requiredMonthly(
  target: number,
  initial: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 12;
  const n = years * 12;
  if (n <= 0) return Math.max(0, target - initial);
  const fvInitial = initial * Math.pow(1 + monthlyRate, n);
  const needed = target - fvInitial;
  if (needed <= 0) return 0;
  if (monthlyRate === 0) return Math.ceil(needed / n);
  const annuity = (Math.pow(1 + monthlyRate, n) - 1) / monthlyRate;
  return Math.ceil(needed / annuity);
}

// ---------------------------------------------------------------------------
// Module Décisions — « Puis-je me le permettre ? »
// ---------------------------------------------------------------------------

export type DecisionVerdict =
  | "FAISABLE"
  | "FAISABLE_SOUS_CONDITIONS"
  | "RISQUE"
  | "NON_COMPATIBLE";

export interface DecisionAnalysis {
  verdict: DecisionVerdict;
  verdictLabel: string;
  amount: number;
  liquidCash: number;
  cashAfter: number;
  emergencyFundTarget: number;
  emergencyFundAvailable: number;
  safetyMargin: number;
  provisionsOutstanding: number;
  monthlySavingsCapacity: number;
  impactedGoals: {
    title: string;
    monthlyNeed: number;
    delayMonths: number | null;
    kind: string;
  }[];
  impacts: { label: string; value: string }[];
  explanation: string[];
  before: { cash: number; netWorth: number; savingsCapacity: number };
  after: { cash: number; netWorth: number; savingsCapacity: number };
}

export interface DecisionInput {
  amount: number;
  type: "ACHAT" | "INVESTISSEMENT";
  date: string; // ISO
  months: number; // horizon d'épargne si achat à crédit "mental" (mise de côté)
}

export function analyzeDecision(
  state: LifeOSState,
  input: DecisionInput,
  today: Date
): DecisionAnalysis {
  const cash = computeAvailableCash(state);
  const liquidCash = cash.accounts
    .filter((line) =>
      state.accounts.some(
        (account) =>
          account.id === line.accountId &&
          ["CASH", "MOBILE_MONEY", "BANK", "SAVINGS"].includes(account.type)
      )
    )
    .reduce((sum, line) => sum + line.available, 0);
  const ef = computeEmergencyFund(state, today);
  const capacity = computeCapacity(state, today);
  const netWorth = computeNetWorth(state);

  const provisionsOutstanding = state.charges
    .filter((c) => c.active && c.frequency !== "MONTHLY")
    .reduce((s, c) => s + Math.max(0, c.amount - c.provisioned), 0);

  const cashAfter = liquidCash - input.amount;

  // Objectifs impactés : allocation mensuelle réduite
  const impactedGoals: DecisionAnalysis["impactedGoals"] = [];
  const remainingAfter = Math.max(0, capacity.savingsCapacity - input.amount / Math.max(1, input.months));
  interface FundTarget {
    title: string;
    budget: number | null;
    funded: number;
    targetDate: string | null;
    kind: string;
    priority: string;
  }
  const targets: FundTarget[] = [];
  for (const g of state.goals) {
    if (g.isSuggested && g.suggestedState !== "ACCEPTED") continue;
    if (["TERMINE", "ANNULE", "REPORTE"].includes(g.status)) continue;
    if (g.budget !== null)
      targets.push({ title: g.title, budget: g.budget, funded: goalFunding(g, state.fundAllocations), targetDate: g.targetDate, kind: "objectif", priority: g.priority });
  }
  for (const p of state.projects) {
    if (p.archived || ["TERMINE", "ANNULE"].includes(p.status)) continue;
    if (p.budget !== null) {
      const f = projectFunding(p, state.transactions, state.fundAllocations);
      targets.push({ title: p.name, budget: p.budget, funded: f.funded, targetDate: p.targetDate, kind: "projet", priority: p.priority });
    }
  }
  for (const t of targets) {
    if (t.targetDate && t.budget && t.budget > 0) {
      const months = Math.max(1, monthsBetween(today, new Date(t.targetDate)));
      const remaining = Math.max(0, t.budget - t.funded);
      const monthlyNeed = Math.ceil(remaining / months);
      if (monthlyNeed > remainingAfter && remaining > 0) {
        const newMonths = Math.ceil(remaining / Math.max(1, remainingAfter));
        impactedGoals.push({
          title: t.title,
          monthlyNeed,
          // délai plafonné pour rester lisible (> 20 ans affiché à part)
          delayMonths: Math.min(240, Math.max(0, newMonths - months)),
          kind: t.kind,
        });
      }
    }
  }

  // Verdict
  const protectedAmount = ef.target + capacity.safetyMargin + provisionsOutstanding;
  let verdict: DecisionVerdict;
  let verdictLabel: string;
  if (input.type === "INVESTISSEMENT" && cashAfter >= protectedAmount) {
    verdict = "FAISABLE";
    verdictLabel = "Faisable maintenant";
  } else if (cashAfter >= protectedAmount) {
    verdict = "FAISABLE";
    verdictLabel = "Faisable maintenant";
  } else if (cashAfter >= ef.target + provisionsOutstanding) {
    verdict = "FAISABLE_SOUS_CONDITIONS";
    verdictLabel = "Faisable sous conditions";
  } else if (cashAfter >= 0) {
    verdict = "RISQUE";
    verdictLabel = "Risqué actuellement";
  } else {
    verdict = "NON_COMPATIBLE";
    verdictLabel = "Non compatible avec ta situation actuelle";
  }
  if (impactedGoals.some((g) => g.delayMonths && g.delayMonths > 6)) {
    verdict = "NON_COMPATIBLE";
    verdictLabel = "Non compatible avec tes objectifs actuels";
  }

  const isInvestment = input.type === "INVESTISSEMENT";
  const explanation: string[] = [];
  explanation.push(
    `Liquidités disponibles : ${liquidCash.toLocaleString("fr-FR")} FCFA (espèces, mobile money, banque, épargne).`
  );
  explanation.push(
    `Montants protégés : fonds d'urgence cible ${ef.target.toLocaleString("fr-FR")} + provisions en cours ${provisionsOutstanding.toLocaleString(
      "fr-FR"
    )} + marge de sécurité ${capacity.safetyMargin.toLocaleString("fr-FR")} = ${protectedAmount.toLocaleString("fr-FR")} FCFA.`
  );
  explanation.push(
    `Après l'opération, il resterait ${cashAfter.toLocaleString("fr-FR")} FCFA de liquidités.`
  );
  if (isInvestment) {
    explanation.push(
      "Un investissement ne réduit pas ton patrimoine : l'argent passe du cash vers un actif. L'impact est sur ta liquidité et ta capacité d'épargne future."
    );
  }
  if (impactedGoals.length > 0) {
    for (const g of impactedGoals.slice(0, 3)) {
      explanation.push(
        `Impact sur « ${g.title} » : besoin de ${g.monthlyNeed.toLocaleString(
          "fr-FR"
        )} FCFA/mois${
          g.delayMonths ? `, délai estimé +${g.delayMonths} mois` : ""
        }.`
      );
    }
  } else {
    explanation.push("Aucun objectif prioritaire n'est impacté par cette opération.");
  }

  return {
    verdict,
    verdictLabel,
    amount: input.amount,
    liquidCash,
    cashAfter,
    emergencyFundTarget: ef.target,
    emergencyFundAvailable: ef.available,
    safetyMargin: capacity.safetyMargin,
    provisionsOutstanding,
    monthlySavingsCapacity: capacity.savingsCapacity,
    impactedGoals,
    impacts: [
      { label: "Cash avant", value: `${liquidCash.toLocaleString("fr-FR")} FCFA` },
      { label: "Cash après", value: `${cashAfter.toLocaleString("fr-FR")} FCFA` },
      {
        label: "Patrimoine net avant",
        value: `${netWorth.netWorth.toLocaleString("fr-FR")} FCFA`,
      },
      {
        label: "Patrimoine net après (estimé)",
        value: `${(isInvestment ? netWorth.netWorth : netWorth.netWorth - input.amount).toLocaleString(
          "fr-FR"
        )} FCFA`,
      },
      {
        label: "Capacité d'épargne mensuelle",
        value: `${capacity.savingsCapacity.toLocaleString("fr-FR")} FCFA/mois`,
      },
    ],
    explanation,
    before: { cash: liquidCash, netWorth: netWorth.netWorth, savingsCapacity: capacity.savingsCapacity },
    after: {
      cash: cashAfter,
      netWorth: isInvestment ? netWorth.netWorth : netWorth.netWorth - input.amount,
      savingsCapacity: capacity.savingsCapacity,
    },
  };
}

// ---------------------------------------------------------------------------
// Feasabilité globale des objectifs 2027 (spéc. §79)
// ---------------------------------------------------------------------------

export interface GoalsFeasibility {
  totalBudget: number;
  totalFunded: number;
  remaining: number;
  monthlyNeed: number;
  savingsCapacity: number;
  verdict: "REALISABLE" | "SOUS_TENSION" | "SOUS_FINANCE" | "IMPOSSIBLE";
  verdictLabel: string;
  horizonMonths: number;
  extraMonthlyIncomeNeeded: number;
}

export function goalsFeasibility(
  state: LifeOSState,
  today: Date,
  horizonMonths = 18
): GoalsFeasibility {
  let totalBudget = 0;
  let totalFunded = 0;
  for (const g of state.goals) {
    if (g.isSuggested && g.suggestedState !== "ACCEPTED") continue;
    if (["TERMINE", "ANNULE"].includes(g.status)) continue;
    if (g.budget !== null) {
      totalBudget += g.budget;
      totalFunded += goalFunding(g, state.fundAllocations);
    }
  }
  for (const p of state.projects) {
    if (p.archived || ["TERMINE", "ANNULE"].includes(p.status)) continue;
    if (p.budget !== null) {
      totalBudget += p.budget;
      const f = projectFunding(p, state.transactions, state.fundAllocations);
      totalFunded += f.funded;
    }
  }
  const remaining = Math.max(0, totalBudget - totalFunded);
  const monthlyNeed = horizonMonths > 0 ? Math.ceil(remaining / horizonMonths) : remaining;
  const capacity = computeCapacity(state, today);
  let verdict: GoalsFeasibility["verdict"];
  let verdictLabel: string;
  if (monthlyNeed <= capacity.savingsCapacity * 0.7) {
    verdict = "REALISABLE";
    verdictLabel = "Réalisable";
  } else if (monthlyNeed <= capacity.savingsCapacity) {
    verdict = "SOUS_TENSION";
    verdictLabel = "Sous tension";
  } else if (monthlyNeed <= capacity.savingsCapacity * 2) {
    verdict = "SOUS_FINANCE";
    verdictLabel = "Sous-financé";
  } else {
    verdict = "IMPOSSIBLE";
    verdictLabel = "Impossible avec les hypothèses actuelles";
  }
  return {
    totalBudget,
    totalFunded,
    remaining,
    monthlyNeed,
    savingsCapacity: capacity.savingsCapacity,
    verdict,
    verdictLabel,
    horizonMonths,
    extraMonthlyIncomeNeeded: Math.max(0, monthlyNeed - capacity.savingsCapacity),
  };
}

// ---------------------------------------------------------------------------
// Indicateur de couverture des charges par revenus non salariaux
// ---------------------------------------------------------------------------

export function nonSalaryCoverage(state: LifeOSState, today: Date): {
  ratio: number;
  nonSalaryIncome3mAvg: number;
  essentialExpenses: number;
} {
  let nonSalary = 0;
  for (let i = 0; i < 3; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const s = monthlySummary(state.transactions, d.getFullYear(), d.getMonth() + 1);
    for (const t of state.transactions) {
      const td = new Date(t.date);
      if (monthKey(td) !== s.key) continue;
      if (INCOME_TYPES.includes(t.type as never) && (!t.category || t.category !== "Salaire")) {
        nonSalary += t.amount;
      }
    }
  }
  const avg = Math.round(nonSalary / 3);
  const essentials = essentialMonthlyExpenses(state, today).total;
  return {
    ratio: essentials > 0 ? avg / essentials : 0,
    nonSalaryIncome3mAvg: avg,
    essentialExpenses: essentials,
  };
}
