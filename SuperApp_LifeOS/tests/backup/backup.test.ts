import { describe, expect, it } from "vitest";
import {
  createLifeOSBackup,
  parseLifeOSBackup,
} from "../../src/lib/lifeos/backup";
import { createDefaultModulesState } from "../../src/lib/modules/store";
import type { LifeOSState } from "../../src/lib/lifeos/types";

function financeState(): LifeOSState {
  return {
    user: { id: "user-1", email: "test@example.com", name: "Test", avatarUrl: null },
    settings: {
      id: "settings-1",
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
    auditEvents: [],
    accounts: [],
    transactions: [],
    categories: [],
    charges: [],
    envelopes: [],
    lifeAreas: [],
    yearPlans: [],
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
    today: "2026-11-06T00:00:00.000Z",
  };
}

describe("LifeOS backup", () => {
  it("round-trips a complete finance and modules backup", () => {
    const finance = financeState();
    const modules = createDefaultModulesState();
    modules.mk.projects.push({
      id: "project-1",
      name: "Projet test",
      progress: 25,
      nextStep: "Continuer",
      state: "ACTIVE",
      createdAt: "2026-11-06T00:00:00.000Z",
    });

    const backup = createLifeOSBackup(
      finance,
      modules,
      "2026-11-06T12:00:00.000Z"
    );
    const restored = parseLifeOSBackup(JSON.stringify(backup));

    expect(restored.kind).toBe("full");
    expect(restored.finance).toEqual(finance);
    expect(restored.modules?.mk.projects[0]?.name).toBe("Projet test");
  });

  it("keeps accepting legacy FinanceOS-only backups", () => {
    const finance = financeState();
    const restored = parseLifeOSBackup(JSON.stringify(finance));

    expect(restored.kind).toBe("legacy-finance");
    expect(restored.finance).toEqual(finance);
    expect(restored.modules).toBeNull();
  });

  it("rejects a full backup before any partial restore can happen", () => {
    const corrupted = {
      format: "lifeos-full-backup",
      version: 1,
      finance: financeState(),
      modules: { version: 1 },
    };

    expect(() => parseLifeOSBackup(JSON.stringify(corrupted))).toThrow(
      "incomplète ou endommagée"
    );
  });

  it("rejects malformed JSON and unknown data", () => {
    expect(() => parseLifeOSBackup("{invalid")).toThrow("JSON valide");
    expect(() => parseLifeOSBackup(JSON.stringify({ hello: "world" }))).toThrow(
      "sauvegarde LifeOS reconnue"
    );
  });
});
