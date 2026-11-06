import type { AppSettings, MainPrayerName } from "@/modules/spiritual/types";
import { calculatePrayerDay } from "@/modules/spiritual/prayers";
import { PRAYER_LABELS } from "@/modules/spiritual/temporal";
import type { LocalNotificationSchema } from "@capacitor/local-notifications";

const CHANNEL_ID = "lifeos-reminders";
const DAILY_ID = 19_001;
const PRAYER_ID_START = 20_000;
const PRAYER_ID_END = 20_099;
const PRAYERS: MainPrayerName[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export interface ReminderResult {
  ok: boolean;
  count: number;
  message: string;
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

export async function disableLifeOSReminders(): Promise<ReminderResult> {
  const notifications = await nativeNotifications();
  if (!notifications) return { ok: false, count: 0, message: "Les rappels natifs sont disponibles dans l’application Android." };
  const pending = await notifications.getPending();
  const ours = pending.notifications.filter((item) => isLifeOSReminder(item.id)).map(({ id }) => ({ id }));
  if (ours.length) await notifications.cancel({ notifications: ours });
  return { ok: true, count: 0, message: "Rappels LifeOS désactivés." };
}

export async function scheduleLifeOSReminders(settings: AppSettings): Promise<ReminderResult> {
  const notifications = await nativeNotifications();
  if (!notifications) return { ok: false, count: 0, message: "Installe l’APK Android pour activer les rappels locaux." };

  const permission = await notifications.checkPermissions();
  const granted = permission.display === "granted" ? permission : await notifications.requestPermissions();
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

  const [briefingHour = 5, briefingMinute = 45] = settings.briefingTime.split(":").map(Number);
  const scheduled: LocalNotificationSchema[] = [{
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

  const now = new Date();
  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 12);
    const prayerDay = calculatePrayerDay(day, settings);
    PRAYERS.forEach((prayer, prayerIndex) => {
      const at = prayerDay[prayer];
      if (at <= now) return;
      scheduled.push({
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

  await notifications.schedule({ notifications: scheduled });
  return {
    ok: true,
    count: scheduled.length,
    message: `${scheduled.length} rappels programmés sur cet appareil.`,
  };
}
