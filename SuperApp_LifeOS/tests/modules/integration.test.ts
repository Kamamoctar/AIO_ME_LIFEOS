import { describe, expect, it } from "vitest";
import zikrLibrary from "../../src/data/zikr.json";
import { EVOLUTION_ACTIONS } from "../../src/data/evolution-actions";
import { evaluateDestiny, planDestinyDays } from "../../src/modules/destiny/engine";
import { calculatePrayerDay } from "../../src/modules/spiritual/prayers";
import { resolveProgram } from "../../src/modules/spiritual/temporal";
import type { AppSettings, ZikrData } from "../../src/modules/spiritual/types";

const settings: AppSettings = {
  id: "main",
  coordinates: { latitude: 6.1319, longitude: 1.2228, label: "Lomé", source: "default" },
  prayerMethod: "MWL",
  offsets: { fajr: 0, maghrib: 0, isha: 0 },
  breakPolicy: "dissocier-jour-manque",
  notificationLevel: "local",
  notificationsEnabled: false,
  soundEnabled: true,
  hapticsEnabled: true,
  tickVolume: 0.35,
  metronomeEnabled: false,
  briefingTime: "05:45",
  prayerSelections: {},
  appearance: "day",
  onboardingDone: true,
};

describe("LifeOS module integration", () => {
  it("reuses the complete Evolution action catalogue", () => {
    expect(EVOLUTION_ACTIONS.length).toBe(141);
    expect(new Set(EVOLUTION_ACTIONS.map((action) => action.code)).size).toBe(141);
  });

  it("keeps Mon Astre hard blocks and 45-day planning", () => {
    const blocked = evaluateDestiny(new Date(2026, 10, 10, 10, 0), "1990-01-01");
    expect(blocked.hardBlocks).toEqual(expect.arrayContaining(["Prêter", "Emprunter"]));
    const planned = planDestinyDays("voyager", "1990-01-01", 45);
    expect(planned).toHaveLength(45);
    expect(planned[0].hardBlocks).not.toContain("Voyager");
  });

  it("calculates ordered local prayer times and anchors Ya-Rachid", () => {
    const day = new Date(2026, 10, 6, 12, 0);
    const prayers = calculatePrayerDay(day, settings);
    expect(prayers.fajr.getTime()).toBeLessThan(prayers.sunrise.getTime());
    expect(prayers.dhuhr.getTime()).toBeLessThan(prayers.asr.getTime());
    expect(prayers.maghrib.getTime()).toBeLessThan(prayers.isha.getTime());

    const data = zikrLibrary as unknown as ZikrData;
    const program = resolveProgram({ day, now: day, prayerDay: prayers, zikrs: data.zikrs });
    const yaRachid = program.find((item) => item.zikrId === "ya_rachid");
    expect(yaRachid?.start.getTime()).toBe(prayers.maghrib.getTime());
    expect(yaRachid?.end.getTime()).toBe(prayers.isha.getTime());
  });
});
