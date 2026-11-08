import type { AppSettings, MainPrayerName } from "@/modules/spiritual/types";
import { calculatePrayerDay } from "@/modules/spiritual/prayers";
import { PRAYER_LABELS } from "@/modules/spiritual/temporal";
import type { LocalNotificationSchema } from "@capacitor/local-notifications";

const CHANNEL_ID = "lifeos-reminders";
const DAILY_ID = 19_001;
const PRAYER_ID_START = 20_000;
const PRAYER_ID_END = 20_999;
const REMINDER_META_KEY = "lifeos_reminder_schedule_v1";
const REMINDER_HORIZON_DAYS = 30;
const REFRESH_THRESHOLD_DAYS = 5;
const PRAYERS: MainPrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export interface ReminderResult {
  ok: boolean;
  count: number;
  message: string;
}

export interface ReminderScheduleMeta {
  version: 1;
  signature: string;
  scheduledAt: string;
  scheduledUntil: string;
}

interface ScheduleOptions {
  requestPermission?: boolean;
  now?: Date;
}

function isLifeOSReminder(id: number): boolean {
  return id === DAILY_ID || (id >= PRAYER_ID_START && id <= PRAYER_ID_END);
}

async function nativeNotifications() {
  const [{ Capacitor }, { LocalNotifications }] = await Promise.all([
    import("@capacitor/core"),
    import("@capacitor/local-notifications"),
  ]);
  if (!Capacitor.isNativePlatform()) return null;
  return LocalNotifications;
}

function reminderSignature(settings: AppSettings): string {
  return JSON.stringify({
    coordinates: settings.coordinates,
    prayerMethod: settings.prayerMethod,
    offsets: settings.offsets,
    briefingTime: settings.briefingTime,
  });
}

function readReminderMeta(): ReminderScheduleMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(REMINDER_META_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<ReminderScheduleMeta>;
    if (value.version !== 1 || !value.signature || !value.scheduledUntil || !value.scheduledAt) return null;
    return value as ReminderScheduleMeta;
  } catch {
    return null;
  }
}

function writeReminderMeta(meta: ReminderScheduleMeta | null): void {
  if (typeof window === "undefined") return;
  try {
    if (meta) window.localStorage.setItem(REMINDER_META_KEY, JSON.stringify(meta));
    else window.localStorage.removeItem(REMINDER_META_KEY);
  } catch {
    // Les rappels natifs restent valides même si le stockage web est indisponible.
  }
}

export function shouldRefreshReminderSchedule(
  meta: ReminderScheduleMeta | null,
  settings: AppSettings,
  now = new Date()
): boolean {
  if (!meta || meta.signature !== reminderSignature(settings)) return true;
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() + REFRESH_THRESHOLD_DAYS);
  return new Date(meta.scheduledUntil).getTime() <= threshold.getTime();
}

export function buildReminderSchedule(
  settings: AppSettings,
  now = new Date(),
  horizonDays = REMINDER_HORIZON_DAYS
): { notifications: LocalNotificationSchema[]; scheduledUntil: Date } {
  const [briefingHour = 5, briefingMinute = 45] = settings.briefingTime.split(":").map(Number);
  const notifications: LocalNotificationSchema[] = [{
    id: DAILY_ID,
    title: "Briefing LifeOS",
    body: "Choisis ta priorité, ton focus et ta première action.",
    channelId: CHANNEL_ID,
    isExactNotification: false,
    schedule: {
      on: { hour: briefingHour, minute: briefingMinute },
      repeats: true,
      allowWhileIdle: true,
    },
    extra: { lifeosView: "today" },
  }];

  for (let dayOffset = 0; dayOffset < horizonDays; dayOffset += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 12);
    const prayerDay = calculatePrayerDay(day, settings);
    PRAYERS.forEach((prayer, prayerIndex) => {
      const at = prayerDay[prayer];
      if (at <= now) return;
      notifications.push({
        id: PRAYER_ID_START + dayOffset * 10 + prayerIndex,
        title: `Prière · ${PRAYER_LABELS[prayer]}`,
        body: "Prends un moment pour te recentrer.",
        channelId: CHANNEL_ID,
        isExactNotification: false,
        schedule: { at, allowWhileIdle: true },
        extra: { lifeosView: "spiritual", prayer },
      });
    });
  }

  return {
    notifications,
    scheduledUntil: new Date(now.getFullYear(), now.getMonth(), now.getDate() + horizonDays - 1, 23, 59, 59),
  };
}

export async function disableLifeOSReminders(): Promise<ReminderResult> {
  const notifications = await nativeNotifications();
  if (!notifications) return { ok: false, count: 0, message: "Les rappels natifs sont disponibles dans l’application Android." };
  const pending = await notifications.getPending();
  const ours = pending.notifications.filter((item) => isLifeOSReminder(item.id)).map(({ id }) => ({ id }));
  if (ours.length) await notifications.cancel({ notifications: ours });
  writeReminderMeta(null);
  return { ok: true, count: 0, message: "Rappels LifeOS désactivés." };
}

export async function scheduleLifeOSReminders(
  settings: AppSettings,
  options: ScheduleOptions = {}
): Promise<ReminderResult> {
  const notifications = await nativeNotifications();
  if (!notifications) return { ok: false, count: 0, message: "Installe l’APK Android pour activer les rappels locaux." };

  const permission = await notifications.checkPermissions();
  const granted = permission.display === "granted"
    ? permission
    : options.requestPermission === false
      ? permission
      : await notifications.requestPermissions();
  if (granted.display !== "granted") {
    return { ok: false, count: 0, message: "Autorisation de notifications refusée dans Android." };
  }

  await disableLifeOSReminders();
  await notifications.createChannel({
    id: CHANNEL_ID,
    name: "Rappels LifeOS",
    description: "Briefing quotidien et horaires de prière",
    importance: 3,
    vibration: true,
  });

  const now = options.now ?? new Date();
  const plan = buildReminderSchedule(settings, now);

  await notifications.schedule({ notifications: plan.notifications });
  writeReminderMeta({
    version: 1,
    signature: reminderSignature(settings),
    scheduledAt: now.toISOString(),
    scheduledUntil: plan.scheduledUntil.toISOString(),
  });
  return {
    ok: true,
    count: plan.notifications.length,
    message: `${plan.notifications.length} rappels programmés pour les 30 prochains jours.`,
  };
}

export async function refreshLifeOSRemindersIfNeeded(settings: AppSettings): Promise<ReminderResult> {
  if (!settings.notificationsEnabled) {
    return { ok: true, count: 0, message: "Rappels désactivés." };
  }
  const meta = readReminderMeta();
  if (!shouldRefreshReminderSchedule(meta, settings)) {
    return { ok: true, count: 0, message: "Rappels déjà à jour." };
  }
  return scheduleLifeOSReminders(settings, { requestPermission: false });
}
