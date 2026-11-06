import { describe, expect, it } from "vitest";
import { householdMonthlyBudget } from "@/lib/lifeos/engine";
import {
  makeCategory,
  makeCharge,
  makeState,
  makeTx,
} from "./helpers";

describe("budget mensuel consolide du foyer", () => {
  it("evite les doubles comptes et projette le reste a vivre", () => {
    const housing = makeCategory({
      id: "housing",
      name: "Logement",
      budgetMonthly: 150000,
      essential: true,
    });
    const state = makeState({
      incomeSources: [
        {
          id: "salary",
          label: "Salaire du foyer",
          kind: "SALARY",
          monthlyAmount: 500000,
          active: true,
          notes: null,
          createdById: "user-1",
        },
      ],
      categories: [housing],
      charges: [
        makeCharge({
          id: "rent",
          label: "Loyer",
          amount: 100000,
          categoryId: "housing",
        }),
        makeCharge({ id: "power", label: "Electricite", amount: 30000 }),
        makeCharge({
          id: "insurance",
          label: "Assurance",
          amount: 120000,
          frequency: "ANNUAL",
          nextDueDate: "2027-03-15T12:00:00.000Z",
          provision: true,
          provisioned: 20000,
        }),
      ],
      envelopes: [
        {
          id: "housing-envelope",
          name: "Logement",
          group: "OBLIGATOIRE",
          budget: 120000,
          reserved: 0,
          order: 0,
          targetId: null,
          categoryId: "housing",
        },
        {
          id: "security",
          name: "Securite",
          group: "SECURITE",
          budget: 20000,
          reserved: 0,
          order: 1,
          targetId: null,
          categoryId: null,
        },
        {
          id: "projects",
          name: "Projets",
          group: "PROJETS",
          budget: 50000,
          reserved: 0,
          order: 2,
          targetId: null,
          categoryId: null,
        },
        {
          id: "investments",
          name: "Investissements",
          group: "INVESTISSEMENT",
          budget: 30000,
          reserved: 0,
          order: 3,
          targetId: null,
          categoryId: null,
        },
      ],
      transactions: [
        makeTx({ category: "Logement", amount: 160000 }),
        makeTx({ category: "Imprevus", amount: 10000 }),
        makeTx({ category: "Maison", amount: 60000, projectId: "home" }),
        makeTx({ type: "INVESTMENT", amount: 40000 }),
      ],
    });

    const plan = householdMonthlyBudget(
      state,
      new Date("2027-01-15T12:00:00.000Z")
    );

    // Le budget logement (150k), le loyer (100k) et l'enveloppe (120k)
    // representent la meme obligation : seul le maximum est compte.
    expect(plan.operatingBudget).toBe(180000);
    expect(plan.provisionsBudget).toBe(50000);
    expect(plan.totalPlannedOutflows).toBe(340000);
    expect(plan.plannedRemainder).toBe(160000);
    expect(plan.forecastRemainder).toBe(120000);
    expect(plan.unbudgetedSpending).toBe(10000);
    expect(plan.upcomingCharges[0]).toMatchObject({
      id: "insurance",
      remainingToProvision: 100000,
    });
  });
});
