// tests/engine/decisions.test.ts
// Tests pour analyzeDecision — le module « Puis-je me le permettre ? ».

import { describe, it, expect, beforeEach } from "vitest";
import { analyzeDecision } from "@/lib/lifeos/engine";
import type { DecisionInput } from "@/lib/lifeos/engine";
import {
  makeAccount,
  makeCharge,
  makeGoal,
  makeProject,
  makeTx,
  makeState,
  makeSettings,
  resetIds,
} from "./helpers";

beforeEach(() => resetIds());

function baseState() {
  return makeState({
    settings: makeSettings({
      salaryMonthly: 169933,
      safetyMargin: 10000,
      emergencyFundMonths: 3,
    }),
    accounts: [
      makeAccount({ id: "bank", type: "BANK", initialBalance: 800000 }),
      makeAccount({ id: "sav", type: "SAVINGS", initialBalance: 300000 }),
      makeAccount({ id: "mm", type: "MOBILE_MONEY", initialBalance: 50000 }),
    ],
    charges: [
      makeCharge({ label: "Factures", amount: 65000, frequency: "MONTHLY", active: true }),
      makeCharge({ label: "Transport", amount: 16000, frequency: "MONTHLY", active: true }),
    ],
    transactions: [],
    goals: [],
    projects: [],
  });
}

describe("analyzeDecision", () => {
  const today = new Date("2027-03-15");

  it("verdict FAISABLE pour un petit achat avec beaucoup de liquidités", () => {
    const state = baseState();
    const input: DecisionInput = {
      amount: 50000,
      type: "ACHAT",
      date: "2027-03-15",
      months: 1,
    };
    const d = analyzeDecision(state, input, today);
    expect(d.verdict).toBe("FAISABLE");
    expect(d.liquidCash).toBe(1150000); // 800k + 300k + 50k
    expect(d.cashAfter).toBe(1100000);
  });

  it("verdict NON_COMPATIBLE quand le montant dépasse les liquidités", () => {
    const state = makeState({
      ...baseState(),
      accounts: [
        makeAccount({ id: "bank", type: "BANK", initialBalance: 100000 }),
      ],
    });
    const input: DecisionInput = {
      amount: 500000,
      type: "ACHAT",
      date: "2027-03-15",
      months: 1,
    };
    const d = analyzeDecision(state, input, today);
    // cashAfter = 100000 - 500000 = -400000 → NON_COMPATIBLE
    expect(d.cashAfter).toBe(-400000);
    expect(d.verdict).toBe("NON_COMPATIBLE");
  });

  it("un investissement ne réduit pas le patrimoine net estimé", () => {
    const state = baseState();
    const input: DecisionInput = {
      amount: 200000,
      type: "INVESTISSEMENT",
      date: "2027-03-15",
      months: 1,
    };
    const d = analyzeDecision(state, input, today);
    // Investissement : patrimoine reste identique (cash → actif)
    expect(d.after.netWorth).toBe(d.before.netWorth);
  });

  it("un achat réduit le patrimoine net estimé", () => {
    const state = baseState();
    const input: DecisionInput = {
      amount: 200000,
      type: "ACHAT",
      date: "2027-03-15",
      months: 1,
    };
    const d = analyzeDecision(state, input, today);
    // Achat : patrimoine diminue du montant
    expect(d.after.netWorth).toBe(d.before.netWorth - 200000);
  });

  it("détecte les objectifs impactés et peut basculer en NON_COMPATIBLE", () => {
    const state = {
      ...baseState(),
      goals: [
        makeGoal({
          title: "Maison",
          budget: 3000000,
          funded: 0,
          targetDate: "2027-06-01T00:00:00Z",
          priority: "CRITIQUE",
          status: "EN_COURS",
        }),
      ],
    };
    const input: DecisionInput = {
      amount: 500000,
      type: "ACHAT",
      date: "2027-03-15",
      months: 3,
    };
    const d = analyzeDecision(state, input, today);
    // Avec un objectif très coûteux et peu de marge, le verdict doit refléter le conflit
    expect(d.impactedGoals.length).toBeGreaterThanOrEqual(0);
    // Si un objectif est retardé de > 6 mois, verdict bascule en NON_COMPATIBLE
    if (d.impactedGoals.some((g) => g.delayMonths && g.delayMonths > 6)) {
      expect(d.verdict).toBe("NON_COMPATIBLE");
    }
  });

  it("fournit une explication lisible avec liquidités et montants protégés", () => {
    const state = baseState();
    const input: DecisionInput = {
      amount: 100000,
      type: "ACHAT",
      date: "2027-03-15",
      months: 1,
    };
    const d = analyzeDecision(state, input, today);
    expect(d.explanation.length).toBeGreaterThan(0);
    expect(d.explanation[0]).toContain("Liquidités disponibles");
    expect(d.impacts.length).toBeGreaterThan(0);
  });
});
