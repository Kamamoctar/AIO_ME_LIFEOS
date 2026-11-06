import { describe, expect, it } from "vitest";
import { monarchStatForDomain, nextEvolutionDueDate } from "@/lib/modules/domain-core";
import { computeQuestStreak, type ModuleDailyEntry } from "@/lib/modules/store";

function daily(date: string, completed: number): ModuleDailyEntry {
  return {
    date,
    priority: "",
    energy: 5,
    blocks: [false, false, false, false],
    morningRituals: [false, false, false, false],
    eveningRituals: [false, false, false, false],
    journalHead: "",
    journalHeart: "",
    mindDump: "",
    evolutionDone: [],
    questDone: Array.from({ length: completed }, (_, index) => `q${index}`),
    prayersDone: [],
  };
}

describe("domain core", () => {
  it("calcule les prochaines échéances sans déborder en fin de mois", () => {
    expect(nextEvolutionDueDate("Hebdomadaire", new Date(2026, 0, 1))).toEqual(new Date(2026, 0, 8));
    expect(nextEvolutionDueDate("Chaque matin", new Date(2026, 0, 1))).toEqual(new Date(2026, 0, 2));
    expect(nextEvolutionDueDate("Mensuelle", new Date(2026, 0, 31))).toEqual(new Date(2026, 1, 28));
    expect(nextEvolutionDueDate("Trimestrielle", new Date(2026, 10, 30))).toEqual(new Date(2027, 1, 28));
  });

  it("relie les domaines aux statistiques du Royaume", () => {
    expect(monarchStatForDomain("Finances & business")).toBe("WLT");
    expect(monarchStatForDomain("Santé & forme")).toBe("VIT");
    expect(monarchStatForDomain("Vie spirituelle")).toBe("SPI");
  });

  it("compte uniquement une série quotidienne continue", () => {
    const entries = {
      "2026-11-06": daily("2026-11-06", 3),
      "2026-11-05": daily("2026-11-05", 3),
      "2026-11-04": daily("2026-11-04", 2),
    };
    expect(computeQuestStreak(entries, 3, new Date(2026, 10, 6))).toBe(2);
  });

  it("conserve la série de la veille tant que la journée courante est en cours", () => {
    const entries = {
      "2026-11-06": daily("2026-11-06", 1),
      "2026-11-05": daily("2026-11-05", 3),
      "2026-11-04": daily("2026-11-04", 3),
    };
    expect(computeQuestStreak(entries, 3, new Date(2026, 10, 6))).toBe(2);
  });
});
