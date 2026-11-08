import {
  LIFEOS_KERNEL_STORAGE_KEY,
  LIFEOS_KERNEL_VERSION,
  parseKernelEnvelope,
} from "@/lib/lifeos/kernel-storage";
import { LIFEOS_LAST_BACKUP_KEY } from "@/lib/lifeos/backup";

export type DiagnosticStatus = "ok" | "warning" | "error" | "info";

export interface DiagnosticItem {
  id: string;
  label: string;
  status: DiagnosticStatus;
  detail: string;
}

export interface LifeOSDiagnosticReport {
  appVersion: string;
  generatedAt: string;
  platform: string;
  items: DiagnosticItem[];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function backupDiagnostic(raw: string | null, now: Date): DiagnosticItem {
  if (!raw) {
    return { id: "backup", label: "Dernière sauvegarde", status: "warning", detail: "Aucun export enregistré sur cet appareil." };
  }
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) {
    return { id: "backup", label: "Dernière sauvegarde", status: "warning", detail: "Date de sauvegarde illisible." };
  }
  const ageDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  return {
    id: "backup",
    label: "Dernière sauvegarde",
    status: ageDays > 14 ? "warning" : "ok",
    detail: `${date.toLocaleString("fr-FR")} · il y a ${Math.max(0, ageDays)} jour${ageDays > 1 ? "s" : ""}.`,
  };
}

export async function runLifeOSDiagnostics(now = new Date()): Promise<LifeOSDiagnosticReport> {
  const items: DiagnosticItem[] = [];
  let platform = "web";

  try {
    const raw = window.localStorage.getItem(LIFEOS_KERNEL_STORAGE_KEY);
    const kernel = parseKernelEnvelope(raw);
    items.push(kernel
      ? {
          id: "kernel",
          label: "Noyau de données",
          status: kernel.version === LIFEOS_KERNEL_VERSION ? "ok" : "error",
          detail: `Format v${kernel.version} · mis à jour le ${new Date(kernel.updatedAt).toLocaleString("fr-FR")}.`,
        }
      : { id: "kernel", label: "Noyau de données", status: "error", detail: "Stockage LifeOS absent ou illisible." });
    items.push(backupDiagnostic(window.localStorage.getItem(LIFEOS_LAST_BACKUP_KEY), now));
  } catch {
    items.push({ id: "kernel", label: "Noyau de données", status: "error", detail: "Le stockage local est inaccessible." });
    items.push({ id: "backup", label: "Dernière sauvegarde", status: "warning", detail: "État indisponible." });
  }

  if (navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage ?? 0;
      const quota = estimate.quota ?? 0;
      const ratio = quota > 0 ? used / quota : 0;
      items.push({
        id: "quota",
        label: "Espace local",
        status: ratio > 0.85 ? "warning" : "ok",
        detail: `${formatBytes(used)} utilisés${quota ? ` sur ${formatBytes(quota)}` : ""}.`,
      });
    } catch {
      items.push({ id: "quota", label: "Espace local", status: "info", detail: "Quota non communiqué par l’appareil." });
    }
  }

  try {
    const [{ Capacitor }, { LocalNotifications }] = await Promise.all([
      import("@capacitor/core"),
      import("@capacitor/local-notifications"),
    ]);
    platform = Capacitor.getPlatform();
    if (Capacitor.isNativePlatform()) {
      const [permission, pending] = await Promise.all([
        LocalNotifications.checkPermissions(),
        LocalNotifications.getPending(),
      ]);
      items.push({
        id: "notifications",
        label: "Notifications Android",
        status: permission.display === "granted" ? "ok" : "warning",
        detail: permission.display === "granted"
          ? `${pending.notifications.length} rappel${pending.notifications.length > 1 ? "s" : ""} en attente.`
          : "Autorisation non accordée.",
      });
    } else {
      items.push({ id: "notifications", label: "Notifications Android", status: "info", detail: "Disponibles dans l’application Android." });
    }
  } catch {
    items.push({ id: "notifications", label: "Notifications Android", status: "warning", detail: "Plugin natif indisponible." });
  }

  if ("serviceWorker" in navigator && platform === "web") {
    const registration = await navigator.serviceWorker.getRegistration().catch(() => undefined);
    items.push({
      id: "offline",
      label: "Mode hors ligne",
      status: registration ? "ok" : "warning",
      detail: registration ? "Service hors ligne actif." : "Service hors ligne non enregistré pour cette session.",
    });
  } else {
    items.push({ id: "offline", label: "Mode hors ligne", status: "ok", detail: "Bundle Android embarqué dans l’application." });
  }

  items.push({
    id: "network",
    label: "Connexion",
    status: navigator.onLine ? "ok" : "info",
    detail: navigator.onLine ? "Réseau disponible ; LifeOS reste utilisable hors ligne." : "Hors ligne ; les fonctions locales restent disponibles.",
  });

  return {
    appVersion: "1.2.0",
    generatedAt: now.toISOString(),
    platform,
    items,
  };
}
