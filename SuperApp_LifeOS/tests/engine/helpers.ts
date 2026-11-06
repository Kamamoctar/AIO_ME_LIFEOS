// tests/engine/helpers.ts — Fabriques de données minimales pour les tests du moteur financier.
// Chaque factory crée un objet valide avec des défauts raisonnables, surchargeable par spread.

import type {
  AppAccount,
  AppCategory,
  AppCharge,
  AppGoal,
  AppPosition,
  AppProject,
  AppSettings,
  AppTransaction,
  AppMilestone,
  AppAsset,
  AppLiability,
  AppCopyTrading,
  AppOtherInvestment,
  AppBusiness,
  LifeOSState,
} from "@/lib/lifeos/types";

// ---------------------------------------------------------------------------
// Entités atomiques
// ---------------------------------------------------------------------------

let _id = 0;
function uid(prefix = "test"): string {
  return `${prefix}-${++_id}`;
}

/** Reset internal ID counter (call in beforeEach if needed). */
export function resetIds() {
  _id = 0;
}

export function makeAccount(overrides: Partial<AppAccount> = {}): AppAccount {
  return {
    id: uid("acc"),
    name: "Compte Test",
    type: "BANK",
    currency: "XOF",
    initialBalance: 0,
    institution: null,
    archived: false,
    createdAt: "2027-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeTx(overrides: Partial<AppTransaction> = {}): AppTransaction {
  return {
    id: uid("tx"),
    accountId: "acc-1",
    toAccountId: null,
    type: "EXPENSE",
    amount: 0,
    fee: 0,
    date: "2027-01-15T12:00:00.000Z",
    categoryId: null,
    category: null,
    subCategory: null,
    description: null,
    projectId: null,
    goalId: null,
    positionId: null,
    recurring: false,
    createdAt: "2027-01-15T12:00:00.000Z",
    ...overrides,
  };
}

export function makeCategory(overrides: Partial<AppCategory> = {}): AppCategory {
  return {
    id: uid("cat"),
    name: "Catégorie Test",
    kind: "EXPENSE",
    icon: null,
    essential: false,
    budgetMonthly: null,
    ...overrides,
  };
}

export function makeCharge(overrides: Partial<AppCharge> = {}): AppCharge {
  return {
    id: uid("chg"),
    label: "Charge Test",
    amount: 10000,
    frequency: "MONTHLY",
    nextDueDate: null,
    categoryId: null,
    accountId: null,
    active: true,
    provision: false,
    provisioned: 0,
    notes: null,
    ...overrides,
  };
}

export function makeGoal(overrides: Partial<AppGoal> = {}): AppGoal {
  return {
    id: uid("goal"),
    title: "Objectif Test",
    description: null,
    area: null,
    category: null,
    year: 2027,
    priority: "MOYENNE",
    status: "EN_COURS",
    startDate: null,
    targetDate: null,
    targetValue: null,
    currentValue: 0,
    unit: null,
    budget: null,
    funded: 0,
    committed: 0,
    notes: null,
    parentGoalId: null,
    isSuggested: false,
    suggestedState: null,
    ...overrides,
  };
}

export function makeProject(overrides: Partial<AppProject> = {}): AppProject {
  return {
    id: uid("proj"),
    name: "Projet Test",
    description: null,
    budget: null,
    targetDate: null,
    priority: "HAUTE",
    status: "PLANIFIE",
    physicalProgress: 0,
    icon: null,
    notes: null,
    archived: false,
    milestones: [],
    ...overrides,
  };
}

export function makePosition(overrides: Partial<AppPosition> = {}): AppPosition {
  return {
    id: uid("pos"),
    company: "SONATEL",
    ticker: "SNTS",
    quantity: 0,
    avgBuyPrice: 0,
    feesPaid: 0,
    currentPrice: 0,
    dividends: 0,
    buyDate: null,
    active: true,
    notes: null,
    ...overrides,
  };
}

export function makeAsset(overrides: Partial<AppAsset> = {}): AppAsset {
  return {
    id: uid("asset"),
    name: "Actif Test",
    type: "OTHER",
    value: 0,
    notes: null,
    ...overrides,
  };
}

export function makeLiability(overrides: Partial<AppLiability> = {}): AppLiability {
  return {
    id: uid("liab"),
    name: "Passif Test",
    amount: 0,
    type: "DEBT",
    notes: null,
    ...overrides,
  };
}

export function makeCopyTrading(overrides: Partial<AppCopyTrading> = {}): AppCopyTrading {
  return {
    id: uid("ct"),
    name: "Copy Trading Test",
    platform: null,
    capitalDeposited: 0,
    withdrawn: 0,
    currentValue: 0,
    fees: 0,
    notes: null,
    ...overrides,
  };
}

export function makeOtherInvestment(overrides: Partial<AppOtherInvestment> = {}): AppOtherInvestment {
  return {
    id: uid("oi"),
    name: "Autre Investissement Test",
    type: "OTHER",
    initialCapital: 0,
    contributions: 0,
    withdrawals: 0,
    income: 0,
    expenses: 0,
    currentValue: 0,
    risk: "MOYEN",
    notes: null,
    ...overrides,
  };
}

export function makeBusiness(overrides: Partial<AppBusiness> = {}): AppBusiness {
  return {
    id: uid("biz"),
    name: "Business Test",
    capitalInvested: 0,
    revenue: 0,
    charges: 0,
    launchDate: null,
    status: "PLANIFIE",
    notes: null,
    ...overrides,
  };
}

export function makeSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    id: uid("set"),
    currency: "XOF",
    salaryMonthly: 169933,
    emergencyFundMonths: 3,
    safetyMargin: 10000,
    mode: "analyse",
    defaultAccountId: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// État applicatif complet minimal
// ---------------------------------------------------------------------------

export function makeState(overrides: Partial<LifeOSState> = {}): LifeOSState {
  return {
    user: { id: "user-1", email: "test@lifeos.app", name: "Test" },
    settings: makeSettings(),
    incomeSources: [],
    dependents: [],
    fundAllocations: [],
    auditEvents: [],
    accounts: [],
    transactions: [],
    categories: [],
    charges: [],
    envelopes: [],
    lifeAreas: [],
    yearPlans: [],
    goals: [],
    projects: [],
    assets: [],
    liabilities: [],
    positions: [],
    copyTrading: [],
    otherInvestments: [],
    businesses: [],
    healthMetrics: [],
    skills: [],
    actions: [],
    snapshots: [],
    notes: [],
    today: "2027-01-15T12:00:00.000Z",
    ...overrides,
  };
}
