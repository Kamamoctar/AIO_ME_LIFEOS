// tests/engine/alerts-priorities.test.ts
// Tests pour generateAlerts, computePriorities, projectEndOfMonth, et nonSalaryCoverage.

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateAlerts,
  computePriorities,
  projectEndOfMonth,
  nonSalaryCoverage,
} from "@/lib/lifeos/engine";
import {
  makeState,
  makeGoal,
  makeProject,
  makeCharge,
  makeCategory,
  makeTx,
  makeAccount,
  makeSettings,
  resetIds,
} from "./helpers";

beforeEach(() => resetIds());

describe("generateAlerts", () => {
  const today = new Date("2027-03-15");

  it("génère une alerte si un objectif/projet approche de l'échéance et est sous-financé", () => {
    const state = makeState({
      goals: [
        makeGoal({
          id: "g1",
          title: "Achat Moto",
          budget: 400000,
          funded: 50000, // 12.5%
          targetDate: "2027-04-14T00:00:00Z", // dans 30 jours
          status: "EN_COURS",
        }),
      ],
    });

    const alerts = generateAlerts(state, today);
    const alert = alerts.find((a) => a.id === "ech-g1");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("danger"); // ≤ 30 jours
    expect(alert!.detail).toContain("Achat Moto");
    expect(alert!.detail).toContain("13 % du budget"); // Math.round(50k/400k)
  });

  it("génère une alerte de budget dépassé pour une catégorie", () => {
    const state = makeState({
      categories: [
        makeCategory({ name: "Alimentation", budgetMonthly: 50000 }),
      ],
      transactions: [
        makeTx({
          type: "EXPENSE",
          amount: 60000,
          category: "Alimentation",
          date: "2027-03-05T00:00:00Z",
        }),
      ],
    });

    const alerts = generateAlerts(state, today);
    const alert = alerts.find((a) => a.id.startsWith("budg-"));
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("warning");
    expect(alert!.detail).toContain("Alimentation");
    expect(alert!.detail).toContain("60\u202F000 FCFA pour un budget de 50\u202F000");
  });

  it("génère une alerte si le fonds d'urgence est incomplet", () => {
    const state = makeState({
      settings: makeSettings({ emergencyFundMonths: 3 }),
      charges: [
        makeCharge({ label: "Loyer", amount: 100000, frequency: "MONTHLY", active: true }),
      ],
      accounts: [
        makeAccount({ type: "SAVINGS", initialBalance: 50000 }), // cible = 300 000, dispos = 50 000
      ],
    });

    const alerts = generateAlerts(state, today);
    const alert = alerts.find((a) => a.id === "ef-low");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("warning");
    expect(alert!.detail).toContain("300\u202F000"); // 100k x 3
  });
});

describe("computePriorities", () => {
  const today = new Date("2027-03-15");

  it("classe et limite les priorités au top 5", () => {
    const state = makeState({
      goals: [
        makeGoal({ id: "g1", title: "Goal 1", priority: "FAIBLE", targetDate: "2027-12-15T00:00:00Z" }),
        makeGoal({ id: "g2", title: "Goal 2", priority: "CRITIQUE", targetDate: "2027-04-15T00:00:00Z" }),
        makeGoal({ id: "g3", title: "Goal 3", priority: "HAUTE", targetDate: "2027-05-15T00:00:00Z" }),
        makeGoal({ id: "g4", title: "Goal 4", priority: "MOYENNE", targetDate: "2027-06-15T00:00:00Z" }),
        makeGoal({ id: "g5", title: "Goal 5", priority: "HAUTE", targetDate: "2027-07-15T00:00:00Z" }),
        makeGoal({ id: "g6", title: "Goal 6", priority: "FAIBLE", targetDate: "2027-11-15T00:00:00Z" }),
      ],
    });

    const priorities = computePriorities(state, today);
    expect(priorities.length).toBeLessThanOrEqual(5);
    // Goal 2 (CRITIQUE + échéance proche) doit être en premier
    expect(priorities[0].id).toBe("g2");
    // Doit être trié par score décroissant
    for (let i = 1; i < priorities.length; i++) {
      expect(priorities[i].score).toBeLessThanOrEqual(priorities[i - 1].score);
    }
  });

  it("ajoute le fonds d'urgence aux priorités s'il est incomplet", () => {
    const state = makeState({
      settings: makeSettings({ emergencyFundMonths: 3 }),
      charges: [
        makeCharge({ label: "Factures", amount: 50000, frequency: "MONTHLY", active: true }),
      ],
      accounts: [
        makeAccount({ type: "SAVINGS", initialBalance: 20000 }), // cible = 150 000, dispo = 20 000
      ],
    });

    const priorities = computePriorities(state, today);
    const efPriority = priorities.find((p) => p.kind === "fonds");
    expect(efPriority).toBeDefined();
    expect(efPriority!.title).toContain("fonds d'urgence");
  });
});

describe("projectEndOfMonth", () => {
  const today = new Date("2027-03-15");

  it("calcule une projection cohérente de fin de mois", () => {
    const state = makeState({
      settings: makeSettings({ salaryMonthly: 169933 }),
      transactions: [
        makeTx({ type: "EXPENSE", amount: 30000, date: "2027-03-05T00:00:00Z" }),
        makeTx({ type: "EXPENSE", amount: 15000, date: "2027-03-10T00:00:00Z" }),
      ],
      charges: [
        makeCharge({
          label: "Abonnement",
          amount: 5000,
          frequency: "MONTHLY",
          active: true,
          nextDueDate: "2027-03-25T00:00:00Z", // après today
          categoryId: "ab",
        }),
      ],
    });

    const proj = projectEndOfMonth(state, today);
    expect(proj.daysElapsed).toBe(15);
    expect(proj.daysInMonth).toBe(31);
    expect(proj.incomeToDate).toBe(0); // pas de transaction income reçue ce mois
    expect(proj.expensesToDate).toBe(45000);
    expect(proj.dailyBurn).toBe(3000); // 45000 / 15
    // expenses = 45000 + (3000 * 16 * 0.7) + 5000 = 45000 + 33600 + 5000 = 83600
    expect(proj.projectedExpenses).toBe(83600);
    expect(proj.projectedIncome).toBe(169933); // se base sur le salaire par défaut
    expect(proj.projectedSavings).toBe(169933 - 83600);
  });
});

describe("nonSalaryCoverage", () => {
  const today = new Date("2027-03-15");

  it("calcule le ratio de couverture des charges par les revenus non salariaux", () => {
    const state = makeState({
      charges: [
        makeCharge({ label: "Loyer", amount: 100000, frequency: "MONTHLY", active: true }),
      ],
      transactions: [
        // Revenu non salarial (ex: Dividende ou autre catégorie)
        makeTx({ type: "INCOME", amount: 60000, category: "BRVM", date: "2027-03-05T00:00:00Z" }),
        makeTx({ type: "INCOME", amount: 40000, category: "BRVM", date: "2027-02-05T00:00:00Z" }),
        makeTx({ type: "INCOME", amount: 50000, category: "BRVM", date: "2027-01-05T00:00:00Z" }),
        // Salaire (doit être ignoré dans nonSalary)
        makeTx({ type: "INCOME", amount: 169933, category: "Salaire", date: "2027-03-25T00:00:00Z" }),
      ],
    });

    const cov = nonSalaryCoverage(state, today);
    // moyenne non salariale = (60k+40k+50k)/3 = 50000
    expect(cov.nonSalaryIncome3mAvg).toBe(50000);
    expect(cov.essentialExpenses).toBe(100000); // Loyer
    expect(cov.ratio).toBe(0.5); // 50k / 100k
  });
});
