// Life OS — Moteur de persistance locale hors-ligne (Offline First)
// Permet à l'application de fonctionner 100% sans serveur, sans internet, dans l'APK.
import {
  analyzeDecision,
  compoundProjection,
  requiredMonthly,
} from "./engine";
import type {
  AppAccount,
  AppActionItem,
  AppAsset,
  AppAuditEvent,
  AppBusiness,
  AppCategory,
  AppCharge,
  AppCopyTrading,
  AppDependent,
  AppEnvelope,
  AppFundAllocation,
  AppGoal,
  AppHealthMetric,
  AppIncomeSource,
  AppLiability,
  AppMilestone,
  AppNote,
  AppOtherInvestment,
  AppPosition,
  AppProject,
  AppSkill,
  AppSnapshot,
  AppTransaction,
  LifeOSState,
} from "./types";
import { LIFE_AREAS } from "./constants";
import { isOfflineLifeOSState } from "./backup";
import { readKernelSection, writeKernelSection } from "./kernel-storage";

function generateId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialOfflineState(): LifeOSState {
  const adminUserId = "local-admin-user";
  const coupleId = "local-foyer-space";

  const defaultCategories: AppCategory[] = [
    { id: generateId("cat"), name: "Salaire", kind: "INCOME", icon: null, essential: false, budgetMonthly: null },
    { id: generateId("cat"), name: "Business", kind: "INCOME", icon: null, essential: false, budgetMonthly: null },
    { id: generateId("cat"), name: "Prestations", kind: "INCOME", icon: null, essential: false, budgetMonthly: null },
    { id: generateId("cat"), name: "Dividendes", kind: "INCOME", icon: null, essential: false, budgetMonthly: null },
    { id: generateId("cat"), name: "Factures", kind: "EXPENSE", icon: null, essential: true, budgetMonthly: 65000 },
    { id: generateId("cat"), name: "Déplacements", kind: "EXPENSE", icon: null, essential: true, budgetMonthly: 16000 },
    { id: generateId("cat"), name: "Alimentation", kind: "EXPENSE", icon: null, essential: true, budgetMonthly: null },
    { id: generateId("cat"), name: "Logement", kind: "EXPENSE", icon: null, essential: true, budgetMonthly: null },
    { id: generateId("cat"), name: "Santé", kind: "EXPENSE", icon: null, essential: true, budgetMonthly: null },
    { id: generateId("cat"), name: "Famille", kind: "EXPENSE", icon: null, essential: false, budgetMonthly: null },
    { id: generateId("cat"), name: "Loisirs", kind: "EXPENSE", icon: null, essential: false, budgetMonthly: null },
    { id: generateId("cat"), name: "Formation", kind: "EXPENSE", icon: null, essential: false, budgetMonthly: null },
    { id: generateId("cat"), name: "Dons / Solidarité", kind: "DONATION", icon: null, essential: false, budgetMonthly: null },
    { id: generateId("cat"), name: "Assurance", kind: "EXPENSE", icon: null, essential: true, budgetMonthly: null },
    { id: generateId("cat"), name: "Abonnements", kind: "EXPENSE", icon: null, essential: true, budgetMonthly: null },
    { id: generateId("cat"), name: "Projets", kind: "EXPENSE", icon: null, essential: false, budgetMonthly: null },
    { id: generateId("cat"), name: "Autre", kind: "EXPENSE", icon: null, essential: false, budgetMonthly: null },
  ];

  const areaIcons: Record<string, string> = {
    "Carrière / Business": "briefcase",
    "Finances": "wallet",
    "Santé & Forme": "heart-pulse",
    "Relations / Famille": "users",
    "Compétences": "graduation-cap",
    "Immobilier / Lieu de vie": "home",
  };

  const lifeAreas = LIFE_AREAS.map((a, i) => ({
    id: generateId("area"),
    name: a.name,
    icon: areaIcons[a.name] ?? null,
    color: null,
    order: i,
  }));

  const yearPlans: import("./types").AppYearPlan[] = [];
  for (let year = 2027; year <= 2035; year++) {
    yearPlans.push({
      id: generateId("yp"),
      year,
      vision:
        year === 2027
          ? "Année de fondation : construction, projets majeurs et structuration financière."
          : null,
      targetIncome: null,
      targetNetWorth: null,
      targetSavings: null,
      targetInvestment: null,
      majorProjects: year === 2027 ? "Fondation & Organisation financière" : null,
      skillsFocus: null,
      healthFocus: null,
      familyFocus: null,
      realEstateFocus: null,
      notes: null,
    });
  }

  return {
    user: {
      id: adminUserId,
      email: "admin@foyer.local",
      name: "Administrateur du foyer",
      avatarUrl: null,
    },
    settings: {
      id: generateId("set"),
      currency: "XOF",
      salaryMonthly: 0,
      emergencyFundMonths: 3,
      safetyMargin: 0,
      mode: "simple",
      defaultAccountId: null,
    },
    incomeSources: [],
    dependents: [],
    fundAllocations: [],
    auditEvents: [
      {
        id: generateId("audit"),
        actorId: adminUserId,
        actorName: "Administrateur",
        entity: "settings",
        action: "create",
        targetId: null,
        summary: "Initialisation locale autonome de FinanceOS",
        createdAt: new Date().toISOString(),
      },
    ],
    accounts: [],
    transactions: [],
    categories: defaultCategories,
    charges: [],
    envelopes: [],
    lifeAreas,
    yearPlans,
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
    couple: {
      id: coupleId,
      name: "Notre foyer",
      role: "ADMIN",
      currentMemberId: "local-member-1",
      permissions: {
        today: "EDIT",
        plan: "EDIT",
        domains: "EDIT",
        review: "EDIT",
        cockpit: "EDIT",
        vision: "EDIT",
        goals: "EDIT",
        projects: "EDIT",
        finances: "EDIT",
        accounts: "EDIT",
        investments: "EDIT",
        patrimoine: "EDIT",
        decisions: "EDIT",
        simulations: "EDIT",
        health: "EDIT",
        skills: "EDIT",
        calendar: "EDIT",
        diagnostics: "EDIT",
        settings: "EDIT",
      },
      members: [
        {
          id: "local-member-1",
          userId: adminUserId,
          name: "Administrateur",
          email: "admin@foyer.local",
          avatarUrl: null,
          role: "ADMIN",
          status: "ACTIVE",
          permissions: {
            today: "EDIT",
            plan: "EDIT",
            domains: "EDIT",
            review: "EDIT",
            cockpit: "EDIT",
            vision: "EDIT",
            goals: "EDIT",
            projects: "EDIT",
            finances: "EDIT",
            accounts: "EDIT",
            investments: "EDIT",
            patrimoine: "EDIT",
            decisions: "EDIT",
            simulations: "EDIT",
            health: "EDIT",
            skills: "EDIT",
            calendar: "EDIT",
            diagnostics: "EDIT",
            settings: "EDIT",
          },
          itemPermissions: [],
        },
      ],
      invitations: [],
    },
    today: new Date().toISOString(),
  };
}

export function getLocalState(): LifeOSState {
  if (typeof window === "undefined") {
    return createInitialOfflineState();
  }

  try {
    const parsed = readKernelSection<LifeOSState>("finance");
    if (parsed) {
      parsed.today = new Date().toISOString();
      return parsed;
    }
  } catch (err) {
    console.warn("[offline-storage] Impossible de lire l'état local, réinitialisation", err);
  }

  const initial = createInitialOfflineState();
  saveLocalState(initial);
  return initial;
}

export function saveLocalState(state: LifeOSState): void {
  if (typeof window === "undefined") return;
  try {
    writeKernelSection("finance", state);
  } catch (err) {
    console.error("[offline-storage] Erreur lors de la sauvegarde locale", err);
  }
}

export function resetOfflineLifeOSState(): LifeOSState {
  const state = createInitialOfflineState();
  saveLocalState(state);
  return state;
}

function addAuditEvent(
  state: LifeOSState,
  entity: string,
  action: string,
  targetId: string | null = null,
  summary: string | null = null
) {
  const event: AppAuditEvent = {
    id: generateId("evt"),
    actorId: state.user.id,
    actorName: state.user.name ?? "Administrateur",
    entity,
    action,
    targetId,
    summary,
    createdAt: new Date().toISOString(),
  };
  state.auditEvents = [event, ...state.auditEvents.slice(0, 99)];
}

export function mutateLocalState(
  entity: string,
  action: "create" | "update" | "delete" | "custom",
  id?: string,
  data?: Record<string, unknown>
): { ok: boolean; id?: string; error?: string } {
  const state = getLocalState();
  const d = data ?? {};
  let targetId = id;

  const num = (v: unknown, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const str = (v: unknown) => (v !== undefined && v !== null ? String(v) : null);
  const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);

  switch (entity) {
    // -------------------------------------------------------------------------
    case "account": {
      if (action === "create") {
        targetId = generateId("acc");
        const newAcc: AppAccount = {
          id: targetId,
          name: str(d.name) ?? "Nouveau compte",
          type: (str(d.type) as AppAccount["type"]) ?? "BANK",
          currency: "XOF",
          initialBalance: num(d.initialBalance),
          institution: str(d.institution),
          archived: bool(d.archived),
          createdAt: new Date().toISOString(),
        };
        state.accounts.push(newAcc);
        addAuditEvent(state, "account", "create", targetId, `Compte ${newAcc.name}`);
      } else if (action === "update" && id) {
        state.accounts = state.accounts.map((a) => {
          if (a.id !== id) return a;
          return {
            ...a,
            name: d.name !== undefined ? str(d.name) ?? a.name : a.name,
            type: d.type !== undefined ? ((str(d.type) as AppAccount["type"]) ?? a.type) : a.type,
            initialBalance: d.initialBalance !== undefined ? num(d.initialBalance) : a.initialBalance,
            institution: d.institution !== undefined ? str(d.institution) : a.institution,
            archived: d.archived !== undefined ? bool(d.archived) : a.archived,
          };
        });
        addAuditEvent(state, "account", "update", id);
      } else if (action === "delete" && id) {
        state.accounts = state.accounts.filter((a) => a.id !== id);
        addAuditEvent(state, "account", "delete", id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "transaction": {
      if (action === "create") {
        targetId = generateId("tx");
        const newTx: AppTransaction = {
          id: targetId,
          accountId: str(d.accountId) ?? "",
          toAccountId: str(d.toAccountId),
          type: (str(d.type) as AppTransaction["type"]) ?? "EXPENSE",
          amount: Math.abs(num(d.amount)),
          fee: num(d.fee),
          date: str(d.date) ?? new Date().toISOString(),
          categoryId: str(d.categoryId),
          category: str(d.category),
          subCategory: str(d.subCategory),
          description: str(d.description),
          projectId: str(d.projectId),
          goalId: str(d.goalId),
          positionId: str(d.positionId),
          recurring: bool(d.recurring),
          createdAt: new Date().toISOString(),
          ownerId: state.user.id,
          ownerName: state.user.name,
        };
        state.transactions.unshift(newTx);
        addAuditEvent(state, "transaction", "create", targetId, `${newTx.type} ${newTx.amount} FCFA`);
      } else if (action === "update" && id) {
        state.transactions = state.transactions.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            accountId: d.accountId !== undefined ? str(d.accountId) ?? t.accountId : t.accountId,
            toAccountId: d.toAccountId !== undefined ? str(d.toAccountId) : t.toAccountId,
            type: d.type !== undefined ? ((str(d.type) as AppTransaction["type"]) ?? t.type) : t.type,
            amount: d.amount !== undefined ? Math.abs(num(d.amount)) : t.amount,
            fee: d.fee !== undefined ? num(d.fee) : t.fee,
            date: d.date !== undefined ? (str(d.date) ?? t.date) : t.date,
            categoryId: d.categoryId !== undefined ? str(d.categoryId) : t.categoryId,
            category: d.category !== undefined ? str(d.category) : t.category,
            subCategory: d.subCategory !== undefined ? str(d.subCategory) : t.subCategory,
            description: d.description !== undefined ? str(d.description) : t.description,
            projectId: d.projectId !== undefined ? str(d.projectId) : t.projectId,
            goalId: d.goalId !== undefined ? str(d.goalId) : t.goalId,
            positionId: d.positionId !== undefined ? str(d.positionId) : t.positionId,
            recurring: d.recurring !== undefined ? bool(d.recurring) : t.recurring,
          };
        });
        addAuditEvent(state, "transaction", "update", id);
      } else if (action === "delete" && id) {
        state.transactions = state.transactions.filter((t) => t.id !== id);
        addAuditEvent(state, "transaction", "delete", id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "category": {
      if (action === "create") {
        targetId = generateId("cat");
        const newCat: AppCategory = {
          id: targetId,
          name: str(d.name) ?? "Nouvelle catégorie",
          kind: (str(d.kind) as AppCategory["kind"]) ?? "EXPENSE",
          icon: str(d.icon),
          essential: bool(d.essential),
          budgetMonthly: d.budgetMonthly !== undefined && d.budgetMonthly !== null ? num(d.budgetMonthly) : null,
        };
        state.categories.push(newCat);
        addAuditEvent(state, "category", "create", targetId, newCat.name);
      } else if (action === "update" && id) {
        state.categories = state.categories.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            name: d.name !== undefined ? str(d.name) ?? c.name : c.name,
            kind: d.kind !== undefined ? ((str(d.kind) as AppCategory["kind"]) ?? c.kind) : c.kind,
            essential: d.essential !== undefined ? bool(d.essential) : c.essential,
            budgetMonthly:
              d.budgetMonthly !== undefined
                ? d.budgetMonthly !== null
                  ? num(d.budgetMonthly)
                  : null
                : c.budgetMonthly,
          };
        });
        addAuditEvent(state, "category", "update", id);
      } else if (action === "delete" && id) {
        state.categories = state.categories.filter((c) => c.id !== id);
        addAuditEvent(state, "category", "delete", id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "charge": {
      if (action === "create") {
        targetId = generateId("chg");
        const newCharge: AppCharge = {
          id: targetId,
          label: str(d.label) ?? "Nouvelle charge",
          amount: num(d.amount),
          frequency: (str(d.frequency) as AppCharge["frequency"]) ?? "MONTHLY",
          nextDueDate: str(d.nextDueDate),
          categoryId: str(d.categoryId),
          accountId: str(d.accountId),
          active: bool(d.active, true),
          provision: bool(d.provision),
          provisioned: num(d.provisioned),
          notes: str(d.notes),
        };
        state.charges.push(newCharge);
        addAuditEvent(state, "charge", "create", targetId, newCharge.label);
      } else if (action === "update" && id) {
        state.charges = state.charges.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            label: d.label !== undefined ? str(d.label) ?? c.label : c.label,
            amount: d.amount !== undefined ? num(d.amount) : c.amount,
            frequency: d.frequency !== undefined ? ((str(d.frequency) as AppCharge["frequency"]) ?? c.frequency) : c.frequency,
            nextDueDate: d.nextDueDate !== undefined ? str(d.nextDueDate) : c.nextDueDate,
            categoryId: d.categoryId !== undefined ? str(d.categoryId) : c.categoryId,
            accountId: d.accountId !== undefined ? str(d.accountId) : c.accountId,
            active: d.active !== undefined ? bool(d.active) : c.active,
            provision: d.provision !== undefined ? bool(d.provision) : c.provision,
            provisioned: d.provisioned !== undefined ? num(d.provisioned) : c.provisioned,
            notes: d.notes !== undefined ? str(d.notes) : c.notes,
          };
        });
        addAuditEvent(state, "charge", "update", id);
      } else if (action === "delete" && id) {
        state.charges = state.charges.filter((c) => c.id !== id);
        addAuditEvent(state, "charge", "delete", id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "provisionCharge": {
      if (action === "custom" && d.action === "provision" && id) {
        state.charges = state.charges.map((c) => {
          if (c.id !== id) return c;
          return { ...c, provisioned: c.provisioned + num(d.amount) };
        });
        addAuditEvent(state, "provisionCharge", "update", id, `Provision +${num(d.amount)} FCFA`);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "envelope": {
      if (action === "create") {
        targetId = generateId("env");
        const newEnv: AppEnvelope = {
          id: targetId,
          name: str(d.name) ?? "Nouvelle enveloppe",
          group: (str(d.group) as AppEnvelope["group"]) ?? "OBLIGATOIRE",
          budget: num(d.budget),
          reserved: num(d.reserved),
          order: state.envelopes.length,
          targetId: str(d.targetId),
          categoryId: str(d.categoryId),
        };
        state.envelopes.push(newEnv);
        addAuditEvent(state, "envelope", "create", targetId, newEnv.name);
      } else if (action === "update" && id) {
        state.envelopes = state.envelopes.map((e) => {
          if (e.id !== id) return e;
          return {
            ...e,
            name: d.name !== undefined ? str(d.name) ?? e.name : e.name,
            group: d.group !== undefined ? ((str(d.group) as AppEnvelope["group"]) ?? e.group) : e.group,
            budget: d.budget !== undefined ? num(d.budget) : e.budget,
            reserved: d.reserved !== undefined ? num(d.reserved) : e.reserved,
            categoryId: d.categoryId !== undefined ? str(d.categoryId) : e.categoryId,
            targetId: d.targetId !== undefined ? str(d.targetId) : e.targetId,
          };
        });
        addAuditEvent(state, "envelope", "update", id);
      } else if (action === "delete" && id) {
        state.envelopes = state.envelopes.filter((e) => e.id !== id);
        addAuditEvent(state, "envelope", "delete", id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "incomeSource": {
      if (action === "create") {
        targetId = generateId("inc");
        const newSource: AppIncomeSource = {
          id: targetId,
          label: str(d.label) ?? "Revenu",
          kind: (str(d.kind) as AppIncomeSource["kind"]) ?? "SALARY",
          monthlyAmount: num(d.monthlyAmount),
          active: bool(d.active, true),
          notes: str(d.notes),
          createdById: state.user.id,
        };
        state.incomeSources.push(newSource);
        addAuditEvent(state, "incomeSource", "create", targetId, `${newSource.label} ${newSource.monthlyAmount} FCFA`);
      } else if (action === "update" && id) {
        state.incomeSources = state.incomeSources.map((s) => {
          if (s.id !== id) return s;
          return {
            ...s,
            label: d.label !== undefined ? str(d.label) ?? s.label : s.label,
            kind: d.kind !== undefined ? ((str(d.kind) as AppIncomeSource["kind"]) ?? s.kind) : s.kind,
            monthlyAmount: d.monthlyAmount !== undefined ? num(d.monthlyAmount) : s.monthlyAmount,
            active: d.active !== undefined ? bool(d.active) : s.active,
            notes: d.notes !== undefined ? str(d.notes) : s.notes,
          };
        });
        addAuditEvent(state, "incomeSource", "update", id);
      } else if (action === "delete" && id) {
        state.incomeSources = state.incomeSources.filter((s) => s.id !== id);
        addAuditEvent(state, "incomeSource", "delete", id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "dependent": {
      if (action === "create") {
        targetId = generateId("dep");
        const newDep: AppDependent = {
          id: targetId,
          name: str(d.name) ?? "Personne à charge",
          relationship: str(d.relationship),
          birthDate: str(d.birthDate),
          active: bool(d.active, true),
          notes: str(d.notes),
        };
        state.dependents.push(newDep);
        addAuditEvent(state, "dependent", "create", targetId, newDep.name);
      } else if (action === "update" && id) {
        state.dependents = state.dependents.map((dep) => {
          if (dep.id !== id) return dep;
          return {
            ...dep,
            name: d.name !== undefined ? str(d.name) ?? dep.name : dep.name,
            relationship: d.relationship !== undefined ? str(d.relationship) : dep.relationship,
            birthDate: d.birthDate !== undefined ? str(d.birthDate) : dep.birthDate,
            active: d.active !== undefined ? bool(d.active) : dep.active,
            notes: d.notes !== undefined ? str(d.notes) : dep.notes,
          };
        });
        addAuditEvent(state, "dependent", "update", id);
      } else if (action === "delete" && id) {
        state.dependents = state.dependents.filter((dep) => dep.id !== id);
        addAuditEvent(state, "dependent", "delete", id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "fundAllocation": {
      if (action === "create") {
        targetId = generateId("fa");
        const newFa: AppFundAllocation = {
          id: targetId,
          accountId: str(d.accountId) ?? "",
          projectId: str(d.projectId),
          goalId: str(d.goalId),
          amount: Math.abs(num(d.amount)),
          status: "ACTIVE",
          note: str(d.note),
          createdById: state.user.id,
          createdAt: new Date().toISOString(),
          releasedAt: null,
        };
        state.fundAllocations.push(newFa);
        addAuditEvent(state, "fundAllocation", "create", targetId, `Réservation ${newFa.amount} FCFA`);
      } else if (action === "custom" && d.action === "release" && id) {
        state.fundAllocations = state.fundAllocations.map((fa) => {
          if (fa.id !== id) return fa;
          return { ...fa, status: "RELEASED", releasedAt: new Date().toISOString() };
        });
        addAuditEvent(state, "fundAllocation", "custom", id, "Libération de fonds");
      } else if (action === "delete" && id) {
        state.fundAllocations = state.fundAllocations.filter((fa) => fa.id !== id);
        addAuditEvent(state, "fundAllocation", "delete", id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "settings": {
      if (state.settings) {
        state.settings = {
          ...state.settings,
          salaryMonthly: d.salaryMonthly !== undefined ? num(d.salaryMonthly) : state.settings.salaryMonthly,
          emergencyFundMonths: d.emergencyFundMonths !== undefined ? num(d.emergencyFundMonths) : state.settings.emergencyFundMonths,
          safetyMargin: d.safetyMargin !== undefined ? num(d.safetyMargin) : state.settings.safetyMargin,
          mode: d.mode === "analyse" ? "analyse" : "simple",
          defaultAccountId: d.defaultAccountId !== undefined ? str(d.defaultAccountId) : state.settings.defaultAccountId,
        };
        addAuditEvent(state, "settings", "update", state.settings.id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "goal": {
      if (action === "create") {
        targetId = generateId("goal");
        const newGoal: AppGoal = {
          id: targetId,
          title: str(d.title) ?? "Nouvel objectif",
          description: str(d.description),
          area: str(d.area),
          category: str(d.category),
          year: d.year !== undefined && d.year !== null ? num(d.year) : null,
          priority: (str(d.priority) as AppGoal["priority"]) ?? "MOYENNE",
          status: (str(d.status) as AppGoal["status"]) ?? "A_PLANIFIER",
          startDate: str(d.startDate),
          targetDate: str(d.targetDate),
          targetValue: d.targetValue !== undefined && d.targetValue !== null ? num(d.targetValue) : null,
          currentValue: num(d.currentValue),
          unit: str(d.unit),
          budget: d.budget !== undefined && d.budget !== null ? num(d.budget) : null,
          funded: num(d.funded),
          committed: num(d.committed),
          notes: str(d.notes),
          parentGoalId: str(d.parentGoalId),
          isSuggested: bool(d.isSuggested),
          suggestedState: str(d.suggestedState),
          ownerId: state.user.id,
          ownerName: state.user.name,
        };
        state.goals.push(newGoal);
        addAuditEvent(state, "goal", "create", targetId, newGoal.title);
      } else if (action === "update" && id) {
        state.goals = state.goals.map((g) => {
          if (g.id !== id) return g;
          return {
            ...g,
            title: d.title !== undefined ? str(d.title) ?? g.title : g.title,
            description: d.description !== undefined ? str(d.description) : g.description,
            area: d.area !== undefined ? str(d.area) : g.area,
            category: d.category !== undefined ? str(d.category) : g.category,
            year: d.year !== undefined ? (d.year !== null ? num(d.year) : null) : g.year,
            priority: d.priority !== undefined ? ((str(d.priority) as AppGoal["priority"]) ?? g.priority) : g.priority,
            status: d.status !== undefined ? ((str(d.status) as AppGoal["status"]) ?? g.status) : g.status,
            startDate: d.startDate !== undefined ? str(d.startDate) : g.startDate,
            targetDate: d.targetDate !== undefined ? str(d.targetDate) : g.targetDate,
            targetValue: d.targetValue !== undefined ? (d.targetValue !== null ? num(d.targetValue) : null) : g.targetValue,
            currentValue: d.currentValue !== undefined ? num(d.currentValue) : g.currentValue,
            unit: d.unit !== undefined ? str(d.unit) : g.unit,
            budget: d.budget !== undefined ? (d.budget !== null ? num(d.budget) : null) : g.budget,
            funded: d.funded !== undefined ? num(d.funded) : g.funded,
            committed: d.committed !== undefined ? num(d.committed) : g.committed,
            notes: d.notes !== undefined ? str(d.notes) : g.notes,
            parentGoalId: d.parentGoalId !== undefined ? str(d.parentGoalId) : g.parentGoalId,
            suggestedState: d.suggestedState !== undefined ? str(d.suggestedState) : g.suggestedState,
          };
        });
        addAuditEvent(state, "goal", "update", id);
      } else if (action === "delete" && id) {
        state.goals = state.goals.filter((g) => g.id !== id);
        addAuditEvent(state, "goal", "delete", id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "project": {
      if (action === "create") {
        targetId = generateId("prj");
        const newProj: AppProject = {
          id: targetId,
          name: str(d.name) ?? "Nouveau projet",
          description: str(d.description),
          budget: d.budget !== undefined && d.budget !== null ? num(d.budget) : null,
          targetDate: str(d.targetDate),
          priority: (str(d.priority) as AppProject["priority"]) ?? "HAUTE",
          status: (str(d.status) as AppProject["status"]) ?? "PLANIFIE",
          physicalProgress: num(d.physicalProgress),
          icon: str(d.icon),
          notes: str(d.notes),
          archived: bool(d.archived),
          milestones: [],
          ownerId: state.user.id,
          ownerName: state.user.name,
        };
        state.projects.push(newProj);
        addAuditEvent(state, "project", "create", targetId, newProj.name);
      } else if (action === "update" && id) {
        state.projects = state.projects.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            name: d.name !== undefined ? str(d.name) ?? p.name : p.name,
            description: d.description !== undefined ? str(d.description) : p.description,
            budget: d.budget !== undefined ? (d.budget !== null ? num(d.budget) : null) : p.budget,
            targetDate: d.targetDate !== undefined ? str(d.targetDate) : p.targetDate,
            priority: d.priority !== undefined ? ((str(d.priority) as AppProject["priority"]) ?? p.priority) : p.priority,
            status: d.status !== undefined ? ((str(d.status) as AppProject["status"]) ?? p.status) : p.status,
            physicalProgress: d.physicalProgress !== undefined ? num(d.physicalProgress) : p.physicalProgress,
            icon: d.icon !== undefined ? str(d.icon) : p.icon,
            notes: d.notes !== undefined ? str(d.notes) : p.notes,
            archived: d.archived !== undefined ? bool(d.archived) : p.archived,
          };
        });
        addAuditEvent(state, "project", "update", id);
      } else if (action === "delete" && id) {
        state.projects = state.projects.filter((p) => p.id !== id);
        addAuditEvent(state, "project", "delete", id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "milestone": {
      const projId = str(d.projectId);
      if (action === "create" && projId) {
        targetId = generateId("ms");
        const newMs: AppMilestone = {
          id: targetId,
          projectId: projId,
          title: str(d.title) ?? "Nouveau jalon",
          targetDate: str(d.targetDate),
          amount: d.amount !== undefined && d.amount !== null ? num(d.amount) : null,
          done: bool(d.done),
          order: num(d.order),
        };
        state.projects = state.projects.map((p) => {
          if (p.id !== projId) return p;
          return { ...p, milestones: [...(p.milestones ?? []), newMs] };
        });
      } else if (action === "update" && id) {
        state.projects = state.projects.map((p) => {
          const msList = p.milestones ?? [];
          const has = msList.some((m) => m.id === id);
          if (!has) return p;
          return {
            ...p,
            milestones: msList.map((m) => {
              if (m.id !== id) return m;
              return {
                ...m,
                title: d.title !== undefined ? str(d.title) ?? m.title : m.title,
                targetDate: d.targetDate !== undefined ? str(d.targetDate) : m.targetDate,
                amount: d.amount !== undefined ? (d.amount !== null ? num(d.amount) : null) : m.amount,
                done: d.done !== undefined ? bool(d.done) : m.done,
                order: d.order !== undefined ? num(d.order) : m.order,
              };
            }),
          };
        });
      } else if (action === "delete" && id) {
        state.projects = state.projects.map((p) => ({
          ...p,
          milestones: (p.milestones ?? []).filter((m) => m.id !== id),
        }));
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "asset": {
      if (action === "create") {
        targetId = generateId("ast");
        const item: AppAsset = {
          id: targetId,
          name: str(d.name) ?? "Nouvel actif",
          type: str(d.type) ?? "OTHER",
          value: num(d.value),
          notes: str(d.notes),
        };
        state.assets.push(item);
        addAuditEvent(state, "asset", "create", targetId, item.name);
      } else if (action === "update" && id) {
        state.assets = state.assets.map((a) => (a.id === id ? { ...a, ...d, id: a.id } as AppAsset : a));
      } else if (action === "delete" && id) {
        state.assets = state.assets.filter((a) => a.id !== id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "liability": {
      if (action === "create") {
        targetId = generateId("lia");
        const item: AppLiability = {
          id: targetId,
          name: str(d.name) ?? "Nouveau passif",
          amount: num(d.amount),
          type: str(d.type) ?? "DEBT",
          notes: str(d.notes),
        };
        state.liabilities.push(item);
      } else if (action === "update" && id) {
        state.liabilities = state.liabilities.map((l) => (l.id === id ? { ...l, ...d, id: l.id } as AppLiability : l));
      } else if (action === "delete" && id) {
        state.liabilities = state.liabilities.filter((l) => l.id !== id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "position": {
      if (action === "create") {
        targetId = generateId("pos");
        const item: AppPosition = {
          id: targetId,
          company: str(d.company) ?? "Action BRVM",
          ticker: str(d.ticker),
          quantity: num(d.quantity),
          avgBuyPrice: num(d.avgBuyPrice),
          feesPaid: num(d.feesPaid),
          currentPrice: num(d.currentPrice),
          dividends: num(d.dividends),
          buyDate: str(d.buyDate),
          active: bool(d.active, true),
          notes: str(d.notes),
        };
        state.positions.push(item);
      } else if (action === "update" && id) {
        state.positions = state.positions.map((p) => (p.id === id ? { ...p, ...d, id: p.id } as AppPosition : p));
      } else if (action === "delete" && id) {
        state.positions = state.positions.filter((p) => p.id !== id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "copyTrading": {
      if (action === "create") {
        targetId = generateId("cp");
        const item: AppCopyTrading = {
          id: targetId,
          name: str(d.name) ?? "Compte Copy Trading",
          platform: str(d.platform),
          capitalDeposited: num(d.capitalDeposited),
          withdrawn: num(d.withdrawn),
          currentValue: num(d.currentValue),
          fees: num(d.fees),
          notes: str(d.notes),
        };
        state.copyTrading.push(item);
      } else if (action === "update" && id) {
        state.copyTrading = state.copyTrading.map((c) => (c.id === id ? { ...c, ...d, id: c.id } as AppCopyTrading : c));
      } else if (action === "delete" && id) {
        state.copyTrading = state.copyTrading.filter((c) => c.id !== id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "otherInvestment": {
      if (action === "create") {
        targetId = generateId("oth");
        const item: AppOtherInvestment = {
          id: targetId,
          name: str(d.name) ?? "Placement",
          type: str(d.type) ?? "OTHER",
          initialCapital: num(d.initialCapital),
          contributions: num(d.contributions),
          withdrawals: num(d.withdrawals),
          income: num(d.income),
          expenses: num(d.expenses),
          currentValue: num(d.currentValue),
          risk: str(d.risk) ?? "MOYEN",
          notes: str(d.notes),
        };
        state.otherInvestments.push(item);
      } else if (action === "update" && id) {
        state.otherInvestments = state.otherInvestments.map((o) => (o.id === id ? { ...o, ...d, id: o.id } as AppOtherInvestment : o));
      } else if (action === "delete" && id) {
        state.otherInvestments = state.otherInvestments.filter((o) => o.id !== id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "business": {
      if (action === "create") {
        targetId = generateId("biz");
        const item: AppBusiness = {
          id: targetId,
          name: str(d.name) ?? "Mon activité",
          capitalInvested: num(d.capitalInvested),
          revenue: num(d.revenue),
          charges: num(d.charges),
          launchDate: str(d.launchDate),
          status: str(d.status) ?? "PLANIFIE",
          notes: str(d.notes),
          ownerId: state.user.id,
          ownerName: state.user.name,
        };
        state.businesses.push(item);
      } else if (action === "update" && id) {
        state.businesses = state.businesses.map((b) => (b.id === id ? { ...b, ...d, id: b.id } as AppBusiness : b));
      } else if (action === "delete" && id) {
        state.businesses = state.businesses.filter((b) => b.id !== id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "healthMetric": {
      if (action === "create") {
        targetId = generateId("hlth");
        const item: AppHealthMetric = {
          id: targetId,
          date: str(d.date) ?? new Date().toISOString(),
          weight: d.weight !== undefined && d.weight !== null ? num(d.weight) : null,
          sportDone: bool(d.sportDone),
          sportMinutes: d.sportMinutes !== undefined && d.sportMinutes !== null ? num(d.sportMinutes) : null,
          sleepHours: d.sleepHours !== undefined && d.sleepHours !== null ? num(d.sleepHours) : null,
          notes: str(d.notes),
        };
        state.healthMetrics.unshift(item);
      } else if (action === "delete" && id) {
        state.healthMetrics = state.healthMetrics.filter((h) => h.id !== id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "skill": {
      if (action === "create") {
        targetId = generateId("skl");
        const item: AppSkill = {
          id: targetId,
          name: str(d.name) ?? "Nouvelle compétence",
          category: str(d.category),
          level: num(d.level),
          targetLevel: num(d.targetLevel, 100),
          targetDate: str(d.targetDate),
          notes: str(d.notes),
        };
        state.skills.push(item);
      } else if (action === "update" && id) {
        state.skills = state.skills.map((s) => (s.id === id ? { ...s, ...d, id: s.id } as AppSkill : s));
      } else if (action === "delete" && id) {
        state.skills = state.skills.filter((s) => s.id !== id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "action": {
      if (action === "create") {
        targetId = generateId("act");
        const item: AppActionItem = {
          id: targetId,
          title: str(d.title) ?? "Action à faire",
          done: bool(d.done),
          dueDate: str(d.dueDate),
          goalId: str(d.goalId),
          projectId: str(d.projectId),
          priority: (str(d.priority) as AppActionItem["priority"]) ?? "MOYENNE",
        };
        state.actions.unshift(item);
      } else if (action === "update" && id) {
        state.actions = state.actions.map((a) => (a.id === id ? { ...a, ...d, id: a.id } as AppActionItem : a));
      } else if (action === "delete" && id) {
        state.actions = state.actions.filter((a) => a.id !== id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "note": {
      if (action === "create") {
        targetId = generateId("not");
        const item: AppNote = {
          id: targetId,
          scope: str(d.scope) ?? "GENERAL",
          title: str(d.title) ?? "Note",
          content: str(d.content),
          resolved: bool(d.resolved),
        };
        state.notes.unshift(item);
      } else if (action === "update" && id) {
        state.notes = state.notes.map((n) => (n.id === id ? { ...n, ...d, id: n.id } as AppNote : n));
      } else if (action === "delete" && id) {
        state.notes = state.notes.filter((n) => n.id !== id);
      }
      break;
    }

    // -------------------------------------------------------------------------
    case "closeMonth": {
      const year = num(d.year, new Date().getFullYear());
      const month = num(d.month, new Date().getMonth() + 1);
      targetId = generateId("snp");
      const snap: AppSnapshot = {
        id: targetId,
        year,
        month,
        income: num(d.income),
        expenses: num(d.expenses),
        savings: num(d.savings),
        investments: num(d.investments),
        netWorth: num(d.netWorth),
        brvmValue: num(d.brvmValue),
        computedBalance: d.computedBalance !== undefined ? num(d.computedBalance) : null,
        realBalance: d.realBalance !== undefined ? num(d.realBalance) : null,
        closed: true,
        notes: str(d.notes),
      };
      state.snapshots = [snap, ...state.snapshots.filter((s) => !(s.year === year && s.month === month))];
      addAuditEvent(state, "closeMonth", "create", targetId, `Clôture ${month}/${year}`);
      break;
    }

    default:
      console.warn(`[offline-backend] Entité non prise en charge: ${entity}`);
      return { ok: false, error: `Entité inconnue: ${entity}` };
  }

  saveLocalState(state);
  return { ok: true, id: targetId };
}

export function simulateLocal(
  kind: string,
  data: Record<string, unknown>
): { analysis?: unknown; result?: unknown } {
  const state = getLocalState();
  const n = (k: string, d = 0) => {
    const v = data[k];
    const x = typeof v === "string" ? Number(v.replace(/[\s,]/g, "")) : Number(v);
    return Number.isFinite(x) ? x : d;
  };

  switch (kind) {
    case "decision": {
      const analysis = analyzeDecision(
        state,
        {
          amount: n("amount"),
          type: data.type === "INVESTISSEMENT" ? "INVESTISSEMENT" : "ACHAT",
          date: String(data.date ?? new Date().toISOString()),
          months: Math.max(1, n("months", 12)),
        },
        new Date()
      );
      return { analysis };
    }

    case "compound": {
      const result = compoundProjection(
        n("initial"),
        n("monthly"),
        n("annualRate"),
        Math.max(1, n("years", 5)),
        n("feesRate")
      );
      return { result };
    }

    case "requiredMonthly": {
      const result = requiredMonthly(
        n("target"),
        n("initial"),
        n("annualRate"),
        Math.max(0.5, n("years", 5))
      );
      return { result };
    }

    case "brvmCalc": {
      const quantity = n("quantity");
      const buyPrice = n("buyPrice");
      const sellPrice = n("sellPrice", n("currentPrice"));
      const buyFees = n("buyFees");
      const sellFees = n("sellFees");
      const dividends = n("dividends");
      const yearsHeld = Math.max(0, n("years", 1));
      const cost = quantity * buyPrice + buyFees;
      const proceeds = quantity * sellPrice - sellFees;
      const grossGain = proceeds - quantity * buyPrice;
      const netGain = proceeds - cost + dividends;
      return {
        result: {
          cost: Math.round(cost),
          proceeds: Math.round(proceeds),
          grossGain: Math.round(grossGain),
          fees: Math.round(buyFees + sellFees),
          netGain: Math.round(netGain),
          capitalGain: Math.round(proceeds - cost),
          priceReturn: cost > 0 ? (proceeds - cost) / cost : 0,
          dividendReturn: cost > 0 ? dividends / cost : 0,
          totalReturn: cost > 0 ? netGain / cost : 0,
          annualized: cost > 0 && yearsHeld > 0 ? Math.pow(1 + netGain / cost, 1 / yearsHeld) - 1 : 0,
          dividends: Math.round(dividends),
        },
      };
    }

    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Intercepteur transparent de requêtes réseau pour fonctionnement hors-ligne
// ---------------------------------------------------------------------------
let interceptorInstalled = false;

export function installFetchInterceptor(): void {
  if (typeof window === "undefined" || interceptorInstalled) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;

    const createJsonResponse = (data: unknown, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    };

    // 1. /api/state
    if (url.startsWith("/api/state")) {
      const state = getLocalState();
      return createJsonResponse(state);
    }

    // 2. /api/mutate
    if (url.startsWith("/api/mutate")) {
      try {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        const res = mutateLocalState(body.entity, body.action, body.id, body.data);
        return createJsonResponse(res, res.ok ? 200 : 400);
      } catch (err) {
        return createJsonResponse({ ok: false, error: String(err) }, 400);
      }
    }

    // 3. /api/simulate
    if (url.startsWith("/api/simulate")) {
      try {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        const res = simulateLocal(body.kind, body.data ?? {});
        return createJsonResponse(res);
      } catch (err) {
        return createJsonResponse({ error: String(err) }, 400);
      }
    }

    // 4. /api/export
    if (url.startsWith("/api/export")) {
      const state = getLocalState();
      return createJsonResponse(state);
    }

    // 5. /api/import
    if (url.startsWith("/api/import")) {
      try {
        const body = init?.body ? JSON.parse(String(init.body)) : null;
        if (!isOfflineLifeOSState(body)) {
          return createJsonResponse({ error: "Sauvegarde APK invalide ou incompatible" }, 400);
        }
        saveLocalState(body);
        return createJsonResponse({ ok: true });
      } catch (err) {
        return createJsonResponse({ error: "Format JSON invalide" }, 400);
      }
    }

    // 6. /api/health
    if (url.startsWith("/api/health")) {
      return createJsonResponse({ status: "ok", database: "local-offline" });
    }

    // 7. /api/couple
    if (url.startsWith("/api/couple")) {
      const state = getLocalState();
      try {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        if (body.action === "updateHouseholdSettings" && body.data) {
          if (state.settings) {
            state.settings.emergencyFundMonths = Number(body.data.emergencyFundMonths ?? state.settings.emergencyFundMonths);
            state.settings.safetyMargin = Number(body.data.safetyMargin ?? state.settings.safetyMargin);
            saveLocalState(state);
          }
        }
        return createJsonResponse({ ok: true });
      } catch (err) {
        return createJsonResponse({ ok: false, error: String(err) }, 400);
      }
    }

    // Autres requêtes : appel fetch normal
    return originalFetch(input, init);
  };

  interceptorInstalled = true;
  console.log("[FinanceOS] Adaptateur local hors-ligne activé avec succès.");
}
