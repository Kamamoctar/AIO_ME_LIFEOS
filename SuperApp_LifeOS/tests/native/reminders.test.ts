import { describe, expect, it } from "vitest";
import {
  buildReminderSchedule,
  shouldRefreshReminderSchedule,
  type ReminderScheduleMeta,
} from "@/lib/native/reminders";
import type { AppSettings } from "@/modules/spiritual/types";

const settings: AppSettings = {
  id: "main",
  coordinates: { latitude: 6.1319, longitude: 1.2228, label: "Lomé", source: "default" },
  prayerMethod: "MWL",
  offsets: { fajr: 0, maghrib: 0, isha: 0 },
  breakPolicy: "dissocier-jour-manque",
  notificationLevel: "local",
  notificationsEnabled: true,
  soundEnabled: true,
  hapticsEnabled: true,
  tickVolume: 0.35,
  metronomeEnabled: false,
  briefingTime: "05:45",
  prayerSelections: {},
  appearance: "day",
  onboardingDone: true,
};

describe("native reminder planning", () => {
  it("prépare trente jours de prières avec des identifiants uniques", () => {
    const now = new Date(2026, 10, 8, 0, 1);
    const plan = buildReminderSchedule(settings, now);
    const ids = plan.notifications.map((notification) => notification.id);

    expect(plan.notifications.length).toBe(151);
    expect(new Set(ids).size).toBe(ids.length);
    expect(plan.scheduledUntil).toEqual(new Date(2026, 11, 7, 23, 59, 59));
    expect(plan.notifications.every((notification) => notification.isExactNotification === false)).toBe(true);
  });

  it("renouvelle à moins de cinq jours de l'échéance", () => {
    const now = new Date("2026-11-08T08:00:00.000Z");
    const base: ReminderScheduleMeta = {
      version: 1,
      signature: "",
      scheduledAt: "2026-11-01T08:00:00.000Z",
      scheduledUntil: "2026-12-07T23:59:59.000Z",
    };
    const matchingSignature = JSON.stringify({
      coordinates: settings.coordinates,
      prayerMethod: settings.prayerMethod,
      offsets: settings.offsets,
      briefingTime: settings.briefingTime,
    });

    expect(shouldRefreshReminderSchedule({ ...base, signature: matchingSignature }, settings, now)).toBe(false);
    expect(shouldRefreshReminderSchedule({ ...base, signature: matchingSignature, scheduledUntil: "2026-11-12T23:59:59.000Z" }, settings, now)).toBe(true);
  });
});
