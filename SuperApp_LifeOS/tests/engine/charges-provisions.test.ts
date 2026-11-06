// tests/engine/charges-provisions.test.ts
// Tests pour chargeMonthlyCost et essentialMonthlyExpenses.

import { describe, it, expect, beforeEach } from "vitest";
import { chargeMonthlyCost, essentialMonthlyExpenses } from "@/lib/lifeos/engine";
import { makeCharge, makeCategory, makeTx, makeState, resetIds } from "./helpers";

beforeEach(() => resetIds());

describe("chargeMonthlyCost", () => {
  const today = new Date("2027-06-15");

  it("charge mensuelle → monthlyEquivalent = amount", () => {
    const c = makeCharge({ amount: 65000, frequency: "MONTHLY" });
    const r = chargeMonthlyCost(c, today);
    expect(r.monthlyEquivalent).toBe(65000);
  });

  it("charge annuelle → monthlyEquivalent = amount / 12", () => {
    const c = makeCharge({ amount: 102000, frequency: "ANNUAL" });
    const r = chargeMonthlyCost(c, today);
    expect(r.monthlyEquivalent).toBe(Math.round(102000 / 12)); // 8500
  });

  it("charge trimestrielle → monthlyEquivalent = amount / 3", () => {
    const c = makeCharge({ amount: 30000, frequency: "QUARTERLY" });
    const r = chargeMonthlyCost(c, today);
    expect(r.monthlyEquivalent).toBe(10000);
  });

  it("calcule la provision recommandée pour une charge annuelle avec échéance", () => {
    // Charge annuelle de 120 000, échéance dans 6 mois, 30 000 déjà provisionnés
    const c = makeCharge({
      amount: 120000,
      frequency: "ANNUAL",
      nextDueDate: "2027-12-15T00:00:00Z",
      provisioned: 30000,
    });
    const r = chargeMonthlyCost(c, today);
    expect(r.remainingToProvision).toBe(90000);
    expect(r.monthsToDue).toBe(6);
    // recommandé = ceil(90000 / 6) = 15000
    expect(r.recommendedMonthlyProvision).toBe(15000);
  });

  it("charge mensuelle → pas de provision recommandée même avec échéance", () => {
    const c = makeCharge({
      amount: 65000,
      frequency: "MONTHLY",
      nextDueDate: "2027-07-01T00:00:00Z",
    });
    const r = chargeMonthlyCost(c, today);
    expect(r.recommendedMonthlyProvision).toBe(0);
  });

  it("échéance imminente (0 mois) → provision = totalité du restant", () => {
    const c = makeCharge({
      amount: 100000,
      frequency: "ANNUAL",
      nextDueDate: "2027-06-20T00:00:00Z", // dans 5 jours
      provisioned: 40000,
    });
    const r = chargeMonthlyCost(c, today);
    expect(r.monthsToDue).toBe(0);
    expect(r.recommendedMonthlyProvision).toBe(60000); // tout d'un coup
  });

  it("charge entièrement provisionnée → remainingToProvision = 0", () => {
    const c = makeCharge({
      amount: 100000,
      frequency: "ANNUAL",
      nextDueDate: "2027-12-01T00:00:00Z",
      provisioned: 100000,
    });
    const r = chargeMonthlyCost(c, today);
    expect(r.remainingToProvision).toBe(0);
    expect(r.recommendedMonthlyProvision).toBe(0);
  });
});

describe("essentialMonthlyExpenses", () => {
  const today = new Date("2027-03-15");

  it("inclut les charges mensuelles actives", () => {
    const state = makeState({
      charges: [
        makeCharge({ label: "Factures", amount: 65000, frequency: "MONTHLY", active: true }),
        makeCharge({ label: "Transport", amount: 16000, frequency: "MONTHLY", active: true }),
      ],
      categories: [],
      transactions: [],
    });
    const r = essentialMonthlyExpenses(state, today);
    expect(r.total).toBe(81000);
    expect(r.items).toHaveLength(2);
  });

  it("exclut les charges inactives", () => {
    const state = makeState({
      charges: [
        makeCharge({ label: "Active", amount: 50000, frequency: "MONTHLY", active: true }),
        makeCharge({ label: "Inactive", amount: 30000, frequency: "MONTHLY", active: false }),
      ],
      categories: [],
      transactions: [],
    });
    const r = essentialMonthlyExpenses(state, today);
    expect(r.total).toBe(50000);
  });

  // RÈGLE MÉTIER : les charges annuelles passent par les provisions, pas les essentiels
  it("exclut les charges annuelles/trimestrielles (pas de double comptage)", () => {
    const state = makeState({
      charges: [
        makeCharge({ label: "Factures", amount: 65000, frequency: "MONTHLY", active: true }),
        makeCharge({ label: "Assurance", amount: 102000, frequency: "ANNUAL", active: true }),
      ],
      categories: [],
      transactions: [],
    });
    const r = essentialMonthlyExpenses(state, today);
    expect(r.total).toBe(65000); // l'assurance annuelle n'est PAS incluse
  });

  it("ajoute la moyenne 3 mois des catégories essentielles", () => {
    const state = makeState({
      charges: [],
      categories: [
        makeCategory({ name: "Alimentation", essential: true }),
      ],
      transactions: [
        // 3 mois de dépenses alimentation
        makeTx({ type: "EXPENSE", amount: 30000, category: "Alimentation", date: "2027-01-10T00:00:00Z" }),
        makeTx({ type: "EXPENSE", amount: 36000, category: "Alimentation", date: "2027-02-10T00:00:00Z" }),
        makeTx({ type: "EXPENSE", amount: 24000, category: "Alimentation", date: "2027-03-10T00:00:00Z" }),
      ],
    });
    const r = essentialMonthlyExpenses(state, today);
    // moyenne = (30000+36000+24000)/3 = 30000
    expect(r.total).toBe(30000);
  });
});
