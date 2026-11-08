import { describe, expect, it } from "vitest";
import { buildDailyRecommendations, buildWeeklyLifeReview } from "@/lib/lifeos/intelligence";
import { createInitialOfflineState } from "@/lib/lifeos/local-backend";
import { createDefaultModulesState, type ModuleDailyEntry } from "@/lib/modules/store";

function daily(date: string, quests: number, prayers: number, energy: number): ModuleDailyEntry {
  return {
    date,
    priority: "",
    energy,
    blocks: [false, false, false, false],
    morningRituals: [true, true, false, false],
    eveningRituals: [true, false, false, false],
    journalHead: "",
    journalHeart: "",
    mindDump: "",
    evolutionDone: [],
    questDone: Array.from({ length: quests }, (_, index) => `q${index}`),
    prayersDone: ["fajr", "dhuhr", "asr", "maghrib", "isha"].slice(0, prayers) as ModuleDailyEntry["prayersDone"],
  };
}

describe("LifeOS local intelligence", () => {
  it("prioritizes a missing daily priority and overdue actions", () => {
    const state = createInitialOfflineState();
    state.today = "2026-11-08T12:00:00.000Z";
    state.actions.push({ id: "a1", title: "Action urgente", done: false, dueDate: "2026-11-07T12:00:00.000Z", goalId: null, projectId: null, priority: "HAUTE" });
    const modules = createDefaultModulesState();

    const recommendations = buildDailyRecommendations(state, modules, new Date(state.today));

    expect(recommendations[0]?.id).toBe("set-priority");
    expect(recommendations.some((item) => item.id === "overdue")).toBe(true);
  });

  it("builds a seven-day review from module history", () => {
    const modules = createDefaultModulesState();
    for (let day = 2; day <= 8; day += 1) {
      const key = `2026-11-${String(day).padStart(2, "0")}`;
      modules.daily[key] = daily(key, 5, 4, 7);
    }
    modules.events.push({ id: "e1", date: "2026-11-07", createdAt: "2026-11-07T12:00:00.000Z", source: "monarch", type: "completion", title: "Test", xp: 10 });

    const review = buildWeeklyLifeReview(modules, new Date(2026, 10, 8, 12));

    expect(review.questRate).toBe(50);
    expect(review.prayerRate).toBe(80);
    expect(review.averageEnergy).toBe(7);
    expect(review.xpEarned).toBe(10);
  });
});
