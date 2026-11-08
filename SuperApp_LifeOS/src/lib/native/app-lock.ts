import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";

export const LIFEOS_APP_LOCK_KEY = "lifeos_app_lock_v1";
export const LIFEOS_SECURITY_EVENT = "lifeos:security-change";
export const LIFEOS_LOCK_NOW_EVENT = "lifeos:lock-now";

export interface AppLockSettings {
  enabled: boolean;
  timeoutMinutes: number;
}

export const DEFAULT_APP_LOCK_SETTINGS: AppLockSettings = {
  enabled: false,
  timeoutMinutes: 2,
};

export function getAppLockSettings(): AppLockSettings {
  if (typeof window === "undefined") return DEFAULT_APP_LOCK_SETTINGS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(LIFEOS_APP_LOCK_KEY) ?? "{}") as Partial<AppLockSettings>;
    return {
      enabled: stored.enabled === true,
      timeoutMinutes: [0, 1, 2, 5, 15].includes(stored.timeoutMinutes ?? -1)
        ? stored.timeoutMinutes!
        : DEFAULT_APP_LOCK_SETTINGS.timeoutMinutes,
    };
  } catch {
    return DEFAULT_APP_LOCK_SETTINGS;
  }
}

export function saveAppLockSettings(value: AppLockSettings): void {
  window.localStorage.setItem(LIFEOS_APP_LOCK_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(LIFEOS_SECURITY_EVENT));
}

export async function checkBiometricAvailability(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    return (await NativeBiometric.isAvailable({ useFallback: false })).isAvailable;
  } catch {
    return false;
  }
}

export async function verifyLifeOSIdentity(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Le verrou biométrique est disponible dans l’application Android.");
  }
  const availability = await NativeBiometric.isAvailable({ useFallback: false });
  if (!availability.isAvailable) {
    throw new Error("Aucune biométrie n’est configurée sur cet appareil.");
  }
  await NativeBiometric.verifyIdentity({
    title: "Déverrouiller LifeOS",
    subtitle: "Tes données personnelles restent privées",
    description: "Confirme ton identité pour ouvrir l’application.",
    negativeButtonText: "Annuler",
    reason: "Accéder à LifeOS",
    maxAttempts: 3,
  });
}

export function requestImmediateLock(): void {
  window.dispatchEvent(new Event(LIFEOS_LOCK_NOW_EVENT));
}
