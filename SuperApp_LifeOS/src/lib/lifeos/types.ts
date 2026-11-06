// Life OS — Types partagés (client + serveur)
// Les montants sont des entiers FCFA (XOF).

export type AccountType =
  | "CASH"
  | "MOBILE_MONEY"
  | "BANK"
  | "SAVINGS"
  | "BRVM"
  | "COPY_TRADING"
  | "BUSINESS"
  | "OTHER";

export type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "DONATION"
  | "INVESTMENT"
  | "TRANSFER"
  | "ASSET_BUY"
  | "ASSET_SELL"
  | "DIVIDEND"
  | "WITHDRAWAL"
  | "DEPOSIT"
  | "PROJECT"
  | "ADJUSTMENT";

export type Frequency = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM";
export type Priority = "CRITIQUE" | "HAUTE" | "MOYENNE" | "FAIBLE";
export type GoalStatus =
  | "A_DEFINIR"
  | "A_PLANIFIER"
  | "PLANIFIE"
  | "EN_COURS"
  | "EN_RETARD"
  | "BLOQUE"
  | "TERMINE"
  | "REPORTE"
  | "ANNULE";
export type EnvelopeGroup =
  | "OBLIGATOIRE"
  | "SECURITE"
  | "PROJETS"
  | "INVESTISSEMENT"
  | "PERSONNEL";
export type DataVisibility = "SHARED" | "PERSONAL";
export type AccessLevel = "NONE" | "VIEW" | "EDIT";

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
}

export interface AppSettings {
  id: string;
  currency: string;
  salaryMonthly: number;
  emergencyFundMonths: number;
  safetyMargin: number;
  mode: "simple" | "analyse";
  defaultAccountId: string | null;
}

export type IncomeSourceKind = "SALARY" | "BUSINESS" | "OTHER";

export interface AppIncomeSource {
  id: string;
  label: string;
  kind: IncomeSourceKind;
  monthlyAmount: number;
  active: boolean;
  notes: string | null;
  createdById: string;
}

export interface AppDependent {
  id: string;
  name: string;
  relationship: string | null;
  birthDate: string | null;
  active: boolean;
  notes: string | null;
}

export interface AppFundAllocation {
  id: string;
  accountId: string;
  projectId: string | null;
  goalId: string | null;
  amount: number;
  status: "ACTIVE" | "RELEASED";
  note: string | null;
  createdById: string;
  createdAt: string;
  releasedAt: string | null;
}

export interface AppAuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  entity: string;
  action: string;
  targetId: string | null;
  summary: string | null;
  createdAt: string;
}

export interface AppAccount {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
  institution: string | null;
  archived: boolean;
  createdAt: string;
}

export interface AppTransaction {
  id: string;
  accountId: string;
  toAccountId: string | null;
  type: TransactionType;
  amount: number;
  fee: number;
  date: string;
  categoryId: string | null;
  category: string | null;
  subCategory: string | null;
  description: string | null;
  projectId: string | null;
  goalId: string | null;
  positionId: string | null;
  recurring: boolean;
  createdAt: string;
  ownerId?: string;
  ownerName?: string | null;
}

export interface AppCategory {
  id: string;
  name: string;
  kind: "EXPENSE" | "INCOME" | "INVESTMENT" | "DONATION";
  icon: string | null;
  essential: boolean;
  budgetMonthly: number | null;
}

export interface AppCharge {
  id: string;
  label: string;
  amount: number;
  frequency: Frequency;
  nextDueDate: string | null;
  categoryId: string | null;
  accountId: string | null;
  active: boolean;
  provision: boolean;
  provisioned: number;
  notes: string | null;
}

export interface AppEnvelope {
  id: string;
  name: string;
  group: EnvelopeGroup;
  budget: number;
  reserved: number;
  order: number;
  targetId: string | null;
  categoryId: string | null;
}

export interface AppLifeArea {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  order: number;
}

export interface AppYearPlan {
  id: string;
  year: number;
  vision: string | null;
  targetIncome: number | null;
  targetNetWorth: number | null;
  targetSavings: number | null;
  targetInvestment: number | null;
  majorProjects: string | null;
  skillsFocus: string | null;
  healthFocus: string | null;
  familyFocus: string | null;
  realEstateFocus: string | null;
  notes: string | null;
}

export interface AppGoal {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  category: string | null;
  year: number | null;
  priority: Priority;
  status: GoalStatus;
  startDate: string | null;
  targetDate: string | null;
  targetValue: number | null;
  currentValue: number;
  unit: string | null;
  budget: number | null; // null = à estimer
  funded: number;
  committed: number;
  notes: string | null;
  parentGoalId: string | null;
  isSuggested: boolean;
  suggestedState: string | null;
  visibility?: DataVisibility;
  ownerId?: string;
  ownerName?: string | null;
}

export interface AppMilestone {
  id: string;
  projectId: string;
  title: string;
  targetDate: string | null;
  amount: number | null;
  done: boolean;
  order: number;
}

export interface AppProject {
  id: string;
  name: string;
  description: string | null;
  budget: number | null; // null = à estimer
  targetDate: string | null;
  priority: Priority;
  status: GoalStatus;
  physicalProgress: number;
  icon: string | null;
  notes: string | null;
  archived: boolean;
  visibility?: DataVisibility;
  ownerId?: string;
  ownerName?: string | null;
  milestones?: AppMilestone[];
}

export interface AppAsset {
  id: string;
  name: string;
  type: string;
  value: number;
  notes: string | null;
}

export interface AppLiability {
  id: string;
  name: string;
  amount: number;
  type: string;
  notes: string | null;
}

export interface AppPosition {
  id: string;
  company: string;
  ticker: string | null;
  quantity: number;
  avgBuyPrice: number;
  feesPaid: number;
  currentPrice: number;
  dividends: number;
  buyDate: string | null;
  active: boolean;
  notes: string | null;
}

export interface AppCopyTrading {
  id: string;
  name: string;
  platform: string | null;
  capitalDeposited: number;
  withdrawn: number;
  currentValue: number;
  fees: number;
  notes: string | null;
}

export interface AppOtherInvestment {
  id: string;
  name: string;
  type: string;
  initialCapital: number;
  contributions: number;
  withdrawals: number;
  income: number;
  expenses: number;
  currentValue: number;
  risk: string;
  notes: string | null;
}

export interface AppBusiness {
  id: string;
  name: string;
  capitalInvested: number;
  revenue: number;
  charges: number;
  launchDate: string | null;
  status: string;
  notes: string | null;
  visibility?: DataVisibility;
  ownerId?: string;
  ownerName?: string | null;
}

export interface AppCoupleItemPermission {
  resourceType: "GOAL" | "PROJECT" | "BUSINESS" | string;
  resourceId: string;
  access: AccessLevel;
}

export interface AppCoupleMember {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: "ADMIN" | "MEMBER";
  status: string;
  permissions: Record<string, AccessLevel>;
  itemPermissions: AppCoupleItemPermission[];
}

export interface AppCoupleInvitation {
  id: string;
  email: string;
  name: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface AppCouple {
  id: string;
  name: string;
  role: "ADMIN" | "MEMBER";
  currentMemberId: string;
  permissions: Record<string, AccessLevel>;
  members: AppCoupleMember[];
  invitations: AppCoupleInvitation[];
}

export interface AppHealthMetric {
  id: string;
  date: string;
  weight: number | null;
  sportDone: boolean;
  sportMinutes: number | null;
  sleepHours: number | null;
  notes: string | null;
}

export interface AppSkill {
  id: string;
  name: string;
  category: string | null;
  level: number;
  targetLevel: number;
  targetDate: string | null;
  notes: string | null;
}

export interface AppActionItem {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  goalId: string | null;
  projectId: string | null;
  priority: Priority;
}

export interface AppSnapshot {
  id: string;
  year: number;
  month: number;
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  netWorth: number;
  brvmValue: number;
  computedBalance: number | null;
  realBalance: number | null;
  closed: boolean;
  notes: string | null;
}

export interface AppNote {
  id: string;
  scope: string;
  title: string;
  content: string | null;
  resolved: boolean;
}

// ---------------------------------------------------------------------------
// État applicatif complet renvoyé par /api/state
// ---------------------------------------------------------------------------

export interface LifeOSState {
  user: AppUser;
  couple?: AppCouple;
  settings: AppSettings;
  incomeSources: AppIncomeSource[];
  dependents: AppDependent[];
  fundAllocations: AppFundAllocation[];
  auditEvents: AppAuditEvent[];
  accounts: AppAccount[];
  transactions: AppTransaction[];
  categories: AppCategory[];
  charges: AppCharge[];
  envelopes: AppEnvelope[];
  lifeAreas: AppLifeArea[];
  yearPlans: AppYearPlan[];
  goals: AppGoal[];
  projects: AppProject[];
  assets: AppAsset[];
  liabilities: AppLiability[];
  positions: AppPosition[];
  copyTrading: AppCopyTrading[];
  otherInvestments: AppOtherInvestment[];
  businesses: AppBusiness[];
  healthMetrics: AppHealthMetric[];
  skills: AppSkill[];
  actions: AppActionItem[];
  snapshots: AppSnapshot[];
  notes: AppNote[];
  today: string; // date ISO serveur
}
