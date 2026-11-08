export type TasbihFeedback = "tap" | "milestone" | "target";

export function getTasbihFeedback(
  previousCount: number,
  amount: number,
  target: number | null
): TasbihFeedback {
  const nextCount = previousCount + amount;
  if (target && previousCount < target && nextCount >= target) return "target";
  if (Math.floor(nextCount / 33) > Math.floor(previousCount / 33)) return "milestone";
  return "tap";
}

function browserVibration(feedback: TasbihFeedback): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  const pattern = feedback === "target"
    ? [120, 80, 240]
    : feedback === "milestone"
      ? [45, 45, 100]
      : 12;
  navigator.vibrate(pattern);
}

export async function performTasbihFeedback(
  previousCount: number,
  amount: number,
  target: number | null,
  enabled: boolean
): Promise<void> {
  if (!enabled) return;
  const feedback = getTasbihFeedback(previousCount, amount, target);

  try {
    const [{ Capacitor }, { Haptics, ImpactStyle, NotificationType }] = await Promise.all([
      import("@capacitor/core"),
      import("@capacitor/haptics"),
    ]);
    if (!Capacitor.isNativePlatform()) {
      browserVibration(feedback);
      return;
    }
    if (feedback === "target") {
      await Haptics.notification({ type: NotificationType.Success });
      await Haptics.vibrate({ duration: 400 });
    } else if (feedback === "milestone") {
      await Haptics.vibrate({ duration: 160 });
    } else {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  } catch {
    browserVibration(feedback);
  }
}
