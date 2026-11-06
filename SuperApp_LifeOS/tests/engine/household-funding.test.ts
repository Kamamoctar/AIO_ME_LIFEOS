import { describe, expect, it } from "vitest";
import {
  computeAvailableCash,
  computeCapacity,
  goalFunding,
  householdExpenseBreakdown,
  projectFunding,
} from "@/lib/lifeos/engine";
import {
  makeAccount,
  makeGoal,
  makeProject,
  makeState,
  makeTx,
} from "./helpers";

describe("finances du foyer", () => {
  it("additionne toutes les sources de revenu actives du foyer", () => {
    const state = makeState({
      incomeSources: [
        {
          id: "salary",
          label: "Salaire",
          kind: "SALARY",
          monthlyAmount: 300000,
          active: true,
          notes: null,
          createdById: "user-1",
        },
        {
          id: "shop",
          label: "Boutique",
          kind: "BUSINESS",
          monthlyAmount: 50000,
          active: true,
          notes: null,
          createdById: "user-1",
        },
        {
          id: "paused",
          label: "Mission terminee",
          kind: "OTHER",
          monthlyAmount: 90000,
          active: false,
          notes: null,
          createdById: "user-1",
        },
      ],
    });

    const capacity = computeCapacity(state, new Date(state.today));
    expect(capacity.expectedMonthlyIncome).toBe(350000);
    expect(capacity.salary).toBe(300000);
    expect(capacity.otherRecurringIncome).toBe(50000);
  });

  it("soustrait les reservations du cash encore disponible sans modifier le solde", () => {
    const state = makeState({
      accounts: [makeAccount({ id: "bank", initialBalance: 200000 })],
      fundAllocations: [
        {
          id: "allocation",
          accountId: "bank",
          projectId: "home",
          goalId: null,
          amount: 75000,
          status: "ACTIVE",
          note: null,
          createdById: "user-1",
          createdAt: stateDate,
          releasedAt: null,
        },
      ],
    });

    const cash = computeAvailableCash(state);
    expect(cash.totalBalance).toBe(200000);
    expect(cash.totalReserved).toBe(75000);
    expect(cash.totalAvailable).toBe(125000);
  });

  it("calcule le financement projet depuis les reservations actives", () => {
    const project = makeProject({ id: "home", budget: 500000 });
    const funding = projectFunding(project, [], [
      {
        id: "active",
        accountId: "bank",
        projectId: "home",
        goalId: null,
        amount: 100000,
        status: "ACTIVE",
        note: null,
        createdById: "user-1",
        createdAt: stateDate,
        releasedAt: null,
      },
      {
        id: "released",
        accountId: "bank",
        projectId: "home",
        goalId: null,
        amount: 50000,
        status: "RELEASED",
        note: null,
        createdById: "user-1",
        createdAt: stateDate,
        releasedAt: stateDate,
      },
    ]);

    expect(funding.funded).toBe(100000);
    expect(funding.remainingToFund).toBe(400000);
    expect(funding.financialProgress).toBe(0.2);
  });

  it("consomme une reservation quand une depense est liee a sa cible", () => {
    const state = makeState({
      accounts: [makeAccount({ id: "bank", initialBalance: 200000 })],
      transactions: [
        makeTx({
          accountId: "bank",
          projectId: "home",
          amount: 20000,
        }),
      ],
      fundAllocations: [
        {
          id: "allocation",
          accountId: "bank",
          projectId: "home",
          goalId: null,
          amount: 75000,
          status: "ACTIVE",
          note: null,
          createdById: "user-1",
          createdAt: stateDate,
          releasedAt: null,
        },
      ],
    });

    const cash = computeAvailableCash(state);
    expect(cash.totalBalance).toBe(180000);
    expect(cash.totalReserved).toBe(55000);
    expect(cash.totalAvailable).toBe(125000);
  });

  it("ventile les depenses du mois par categorie et par membre", () => {
    const breakdown = householdExpenseBreakdown(
      [
        makeTx({
          amount: 60000,
          fee: 1000,
          category: "Maison",
          ownerName: "Awa",
        }),
        makeTx({
          amount: 39000,
          category: "Maison",
          ownerName: "Moussa",
        }),
        makeTx({
          amount: 50000,
          category: "Transport",
          ownerName: "Awa",
          date: "2026-12-15T12:00:00.000Z",
        }),
      ],
      2027,
      1
    );

    expect(breakdown.total).toBe(100000);
    expect(breakdown.byCategory).toEqual([
      { label: "Maison", amount: 100000, percentage: 1 },
    ]);
    expect(breakdown.byMember).toEqual([
      { label: "Awa", amount: 61000, percentage: 0.61 },
      { label: "Moussa", amount: 39000, percentage: 0.39 },
    ]);
  });

  it("calcule aussi le financement d'un objectif depuis un vrai compte", () => {
    const goal = makeGoal({ id: "school", budget: 300000, funded: 0 });
    const funded = goalFunding(goal, [
      {
        id: "goal-allocation",
        accountId: "bank",
        projectId: null,
        goalId: "school",
        amount: 80000,
        status: "ACTIVE",
        note: null,
        createdById: "user-1",
        createdAt: stateDate,
        releasedAt: null,
      },
    ]);

    expect(funded).toBe(80000);
  });
});

const stateDate = "2027-01-15T12:00:00.000Z";
