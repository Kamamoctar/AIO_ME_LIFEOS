// tests/engine/goals-feasibility.test.ts
// Tests pour goalsFeasibility et priorityProjectsNeed.

import { describe, it, expect, beforeEach } from "vitest";
import { goalsFeasibility, priorityProjectsNeed } from "@/lib/lifeos/engine";
import {
  makeGoal,
  makeProject,
  makeTx,
  makeCharge,
  makeAccount,
  makeState,
  makeSettings,
  resetIds,
} from "./helpers";

beforeEach(() => resetIds());

// ---------------------------------------------------------------------------
// priorityProjectsNeed
// ---------------------------------------------------------------------------

describe("priorityProjectsNeed", () => {
  const today = new Date("2027-03-15");

  it("retourne 0 sans projets ni objectifs", () => {
    const state = makeState();
    expect(priorityProjectsNeed(state, today)).toBe(0);
  });

  it("calcule le besoin mensuel des projets à échéance ≤ 18 mois", () => {
    const state = makeState({
      projects: [
        makeProject({
          id: "p1",
          budget: 600000,
          targetDate: "2027-09-15T00:00:00Z", // 6 mois
          status: "PLANIFIE",
        }),
      ],
      transactions: [],
    });
    const need = priorityProjectsNeed(state, today);
    // 600000 / 6 = 100000
    expect(need).toBe(100000);
  });

  it("ignore les projets à échéance > 18 mois", () => {
    const state = makeState({
      projects: [
        makeProject({
          id: "p1",
          budget: 5000000,
          targetDate: "2029-03-15T00:00:00Z", // 24 mois
          status: "PLANIFIE",
        }),
      ],
      transactions: [],
    });
    expect(priorityProjectsNeed(state, today)).toBe(0);
  });

  it("ignore les projets archivés / terminés / annulés", () => {
    const state = makeState({
      projects: [
        makeProject({ budget: 500000, targetDate: "2027-06-01T00:00:00Z", archived: true }),
        makeProject({ budget: 500000, targetDate: "2027-06-01T00:00:00Z", status: "TERMINE" }),
        makeProject({ budget: 500000, targetDate: "2027-06-01T00:00:00Z", status: "ANNULE" }),
      ],
      transactions: [],
    });
    expect(priorityProjectsNeed(state, today)).toBe(0);
  });

  it("prend en compte les objectifs acceptés avec budget", () => {
    const state = makeState({
      goals: [
        makeGoal({
          title: "Moto",
          budget: 400000,
          funded: 100000,
          targetDate: "2027-07-15T00:00:00Z", // 4 mois
          status: "EN_COURS",
        }),
      ],
      projects: [],
      transactions: [],
    });
    const need = priorityProjectsNeed(state, today);
    // remaining = 300000, months = 4 → ceil(300000/4) = 75000
    expect(need).toBe(75000);
  });

  it("ignore les objectifs suggérés non acceptés", () => {
    const state = makeState({
      goals: [
        makeGoal({
          budget: 500000,
          targetDate: "2027-06-01T00:00:00Z",
          isSuggested: true,
          suggestedState: "PENDING",
        }),
      ],
      transactions: [],
    });
    expect(priorityProjectsNeed(state, today)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// goalsFeasibility
// ---------------------------------------------------------------------------

describe("goalsFeasibility", () => {
  const today = new Date("2027-03-15");

  it("verdict REALISABLE quand le besoin mensuel est < 70% de la capacité", () => {
    const state = makeState({
      settings: makeSettings({ salaryMonthly: 500000, safetyMargin: 10000 }),
      charges: [
        makeCharge({ label: "Loyer", amount: 50000, frequency: "MONTHLY", active: true }),
      ],
      accounts: [makeAccount({ id: "sav", type: "SAVINGS", initialBalance: 2000000 })],
      goals: [
        makeGoal({ budget: 100000, funded: 50000, status: "EN_COURS" }),
      ],
      projects: [],
      transactions: [],
    });
    const f = goalsFeasibility(state, today, 18);
    // Capacité = 500000 - 50000 - 10000 = 440000
    // Besoin = 50000 / 18 ≈ 2778 → largement < 70% de 440000
    expect(f.verdict).toBe("REALISABLE");
    expect(f.remaining).toBe(50000);
  });

  it("verdict IMPOSSIBLE quand le besoin mensuel >> capacité", () => {
    const state = makeState({
      settings: makeSettings({ salaryMonthly: 169933, safetyMargin: 10000 }),
      charges: [
        makeCharge({ label: "Charges", amount: 81000, frequency: "MONTHLY", active: true }),
      ],
      accounts: [makeAccount({ id: "sav", type: "SAVINGS", initialBalance: 300000 })],
      goals: [
        makeGoal({ budget: 50000000, funded: 0, status: "EN_COURS" }), // 50M !
      ],
      projects: [],
      transactions: [],
    });
    const f = goalsFeasibility(state, today, 18);
    // Besoin mensuel = 50M / 18 ≈ 2.7M >> capacité
    expect(f.verdict).toBe("IMPOSSIBLE");
    expect(f.extraMonthlyIncomeNeeded).toBeGreaterThan(0);
  });

  it("exclut les objectifs terminés/annulés du calcul", () => {
    const state = makeState({
      settings: makeSettings({ salaryMonthly: 200000 }),
      charges: [],
      accounts: [makeAccount({ id: "sav", type: "SAVINGS", initialBalance: 500000 })],
      goals: [
        makeGoal({ budget: 1000000, funded: 0, status: "TERMINE" }),
        makeGoal({ budget: 500000, funded: 0, status: "ANNULE" }),
      ],
      projects: [],
      transactions: [],
    });
    const f = goalsFeasibility(state, today, 18);
    expect(f.totalBudget).toBe(0);
    expect(f.remaining).toBe(0);
  });
});
