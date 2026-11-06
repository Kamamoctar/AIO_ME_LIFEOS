// tests/engine/capacity-emergency.test.ts
// Tests pour computeCapacity et computeEmergencyFund.

import { describe, it, expect, beforeEach } from "vitest";
import { computeCapacity, computeEmergencyFund } from "@/lib/lifeos/engine";
import { makeAccount, makeCharge, makeState, makeSettings, resetIds } from "./helpers";

beforeEach(() => resetIds());

describe("computeEmergencyFund", () => {
  const today = new Date("2027-03-15");

  it("calcule la cible = dépenses essentielles × nombre de mois configuré", () => {
    const state = makeState({
      settings: makeSettings({ emergencyFundMonths: 3 }),
      charges: [
        makeCharge({ label: "Factures", amount: 65000, frequency: "MONTHLY", active: true }),
        makeCharge({ label: "Transport", amount: 16000, frequency: "MONTHLY", active: true }),
      ],
      accounts: [],
    });
    const ef = computeEmergencyFund(state, today);
    // Essentiels = 81000 → cible = 81000 × 3 = 243000
    expect(ef.essentialMonthly).toBe(81000);
    expect(ef.target).toBe(243000);
    expect(ef.months).toBe(3);
  });

  it("calcule les disponibilités à partir des comptes épargne non archivés", () => {
    const state = makeState({
      settings: makeSettings({ emergencyFundMonths: 3 }),
      charges: [
        makeCharge({ label: "Factures", amount: 50000, frequency: "MONTHLY", active: true }),
      ],
      accounts: [
        makeAccount({ id: "sav", type: "SAVINGS", initialBalance: 120000 }),
        makeAccount({ id: "bank", type: "BANK", initialBalance: 500000 }), // pas épargne
        makeAccount({ id: "archived", type: "SAVINGS", initialBalance: 50000, archived: true }), // archivé
      ],
      transactions: [],
    });
    const ef = computeEmergencyFund(state, today);
    expect(ef.available).toBe(120000); // seul le compte épargne non archivé
    expect(ef.target).toBe(150000); // 50000 × 3
    expect(ef.missing).toBe(30000);
    expect(ef.progress).toBeCloseTo(0.8, 2);
  });

  it("progress ne dépasse pas 1 même si available > target", () => {
    const state = makeState({
      settings: makeSettings({ emergencyFundMonths: 3 }),
      charges: [
        makeCharge({ label: "Loyer", amount: 10000, frequency: "MONTHLY", active: true }),
      ],
      accounts: [
        makeAccount({ id: "sav", type: "SAVINGS", initialBalance: 100000 }),
      ],
      transactions: [],
    });
    const ef = computeEmergencyFund(state, today);
    // cible = 30000, disponible = 100000
    expect(ef.progress).toBe(1);
    expect(ef.missing).toBe(0);
  });
});

describe("computeCapacity", () => {
  const today = new Date("2027-03-15");

  it("calcule la capacité d'épargne de base : salaire - essentiels - provisions - marge", () => {
    const state = makeState({
      settings: makeSettings({
        salaryMonthly: 169933,
        safetyMargin: 10000,
        emergencyFundMonths: 3,
      }),
      charges: [
        makeCharge({ label: "Factures", amount: 65000, frequency: "MONTHLY", active: true }),
        makeCharge({ label: "Transport", amount: 16000, frequency: "MONTHLY", active: true }),
        // Charge annuelle → provision
        makeCharge({
          label: "Assurance",
          amount: 102000,
          frequency: "ANNUAL",
          active: true,
          nextDueDate: "2027-12-01T00:00:00Z",
          provisioned: 0,
        }),
      ],
      accounts: [
        makeAccount({ id: "sav", type: "SAVINGS", initialBalance: 500000 }),
      ],
      transactions: [],
      goals: [],
      projects: [],
    });
    const cap = computeCapacity(state, today);

    expect(cap.salary).toBe(169933);
    expect(cap.essentialExpenses).toBe(81000); // 65k + 16k
    expect(cap.safetyMargin).toBe(10000);
    // Provisions: assurance annuelle 102000 sur ~8-9 mois restants
    expect(cap.provisionsNeeded).toBeGreaterThan(0);
    // savingsCapacity = salaire - essentiels - provisions - marge
    expect(cap.savingsCapacity).toBe(
      Math.max(0, 169933 - 81000 - cap.provisionsNeeded - 10000)
    );
    // investmentCapacity ≤ savingsCapacity
    expect(cap.investmentCapacity).toBeLessThanOrEqual(cap.savingsCapacity);
  });

  it("sans revenus complémentaires, expectedMonthlyIncome = salaire", () => {
    const state = makeState({
      settings: makeSettings({ salaryMonthly: 169933 }),
      charges: [],
      accounts: [],
      transactions: [],
      goals: [],
      projects: [],
    });
    // Pas de revenus non-salariaux → expectedMonthlyIncome = salaire seul
    const cap = computeCapacity(state, today);
    expect(cap.expectedMonthlyIncome).toBe(169933);
    expect(cap.otherRecurringIncome).toBe(0);
  });
});
