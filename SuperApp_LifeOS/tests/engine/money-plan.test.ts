import { describe, expect, it } from "vitest";
import {
  computeMoneyAllocation,
  DEFAULT_MONEY_ALLOCATION_CONFIG,
  moneyPlanPercentageTotal,
  SIX_POCKETS_PRESET,
} from "@/lib/lifeos/money-plan";
import { makeAccount, makeCategory, makeSettings, makeState, makeTx } from "./helpers";

describe("allocation en six poches", () => {
  it("répartit 100 % du revenu attendu selon le modèle 50/10", () => {
    const state = makeState({ settings: makeSettings({ salaryMonthly: 300_000, safetyMargin: 0 }) });
    const result = computeMoneyAllocation(state, DEFAULT_MONEY_ALLOCATION_CONFIG);
    expect(moneyPlanPercentageTotal(SIX_POCKETS_PRESET)).toBe(100);
    expect(result.income).toBe(300_000);
    expect(result.rows.find((row) => row.id === "necessities")?.target).toBe(150_000);
    expect(result.rows.filter((row) => row.id !== "necessities").every((row) => row.target === 30_000)).toBe(true);
  });

  it("classe les dépenses, dons, investissements et transferts vers l’épargne", () => {
    const essential = makeCategory({ id: "cat-essential", name: "Logement", essential: true });
    const education = makeCategory({ id: "cat-education", name: "Formation" });
    const leisure = makeCategory({ id: "cat-leisure", name: "Loisirs" });
    const savings = makeAccount({ id: "savings", type: "SAVINGS" });
    const state = makeState({
      settings: makeSettings({ salaryMonthly: 300_000, safetyMargin: 0 }),
      accounts: [makeAccount({ id: "bank" }), savings],
      categories: [essential, education, leisure],
      transactions: [
        makeTx({ type: "EXPENSE", amount: 120_000, categoryId: essential.id, category: essential.name }),
        makeTx({ type: "EXPENSE", amount: 15_000, categoryId: education.id, category: education.name }),
        makeTx({ type: "EXPENSE", amount: 20_000, categoryId: leisure.id, category: leisure.name }),
        makeTx({ type: "DONATION", amount: 10_000 }),
        makeTx({ type: "INVESTMENT", amount: 30_000 }),
        makeTx({ type: "TRANSFER", amount: 25_000, accountId: "bank", toAccountId: "savings" }),
      ],
    });
    const result = computeMoneyAllocation(state, DEFAULT_MONEY_ALLOCATION_CONFIG);
    const actual = Object.fromEntries(result.rows.map((row) => [row.id, row.actual]));
    expect(actual).toMatchObject({
      necessities: 120_000,
      education: 15_000,
      enjoyment: 20_000,
      giving: 10_000,
      freedom: 30_000,
      longTerm: 25_000,
    });
    expect(result.unclassified).toBe(0);
  });

  it("respecte les correspondances personnalisées et le revenu réellement encaissé", () => {
    const family = makeCategory({ id: "cat-family", name: "Famille" });
    const state = makeState({
      categories: [family],
      transactions: [
        makeTx({ type: "INCOME", amount: 200_000 }),
        makeTx({ type: "EXPENSE", amount: 12_000, categoryId: family.id, category: family.name }),
      ],
    });
    const result = computeMoneyAllocation(state, {
      ...DEFAULT_MONEY_ALLOCATION_CONFIG,
      incomeBasis: "ACTUAL",
      categoryAssignments: { [family.id]: "giving" },
    });
    expect(result.income).toBe(200_000);
    expect(result.rows.find((row) => row.id === "giving")?.actual).toBe(12_000);
    expect(result.unclassified).toBe(0);
  });
});
