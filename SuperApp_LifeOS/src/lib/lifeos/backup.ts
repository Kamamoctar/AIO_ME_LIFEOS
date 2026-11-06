import type { UnifiedModulesState } from "@/lib/modules/store";
import type { LifeOSState } from "./types";

export const LIFEOS_BACKUP_FORMAT = "lifeos-full-backup";
export const LIFEOS_BACKUP_VERSION = 1;

type JsonObject = Record<string, unknown>;

export interface LifeOSFullBackup {
  format: typeof LIFEOS_BACKUP_FORMAT;
  version: typeof LIFEOS_BACKUP_VERSION;
  exportedAt: string;
  finance: JsonObject;
  modules: UnifiedModulesState;
}

export interface ParsedLifeOSBackup {
  finance: JsonObject;
  modules: UnifiedModulesState | null;
  kind: "full" | "legacy-finance";
}

const FINANCE_ARRAYS = [
  "accounts",
  "transactions",
  "categories",
  "goals",
  "projects",
  "actions",
  "notes",
] as const;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isOfflineLifeOSState(value: unknown): value is LifeOSState {
  if (!isObject(value) || !isObject(value.user) || !isObject(value.settings)) {
    return false;
  }
  return FINANCE_ARRAYS.every((key) => Array.isArray(value[key]));
}

export function isServerFinanceBackup(value: unknown): value is JsonObject {
  if (!isObject(value) || value.app !== "Life OS" || !isObject(value.settings)) {
    return false;
  }
  return FINANCE_ARRAYS.every((key) => Array.isArray(value[key]));
}

export function isFinanceBackup(value: unknown): value is JsonObject {
  return isOfflineLifeOSState(value) || isServerFinanceBackup(value);
}

export function isUnifiedModulesState(value: unknown): value is UnifiedModulesState {
  if (!isObject(value) || value.version !== 1) return false;
  if (
    !isObject(value.daily) ||
    !isObject(value.evolution) ||
    !isObject(value.mk) ||
    !isObject(value.destiny) ||
    !isObject(value.monarch) ||
    !isObject(value.spiritual)
  ) {
    return false;
  }

  return (
    Array.isArray(value.evolution.activeActionCodes) &&
    Array.isArray(value.mk.ideas) &&
    Array.isArray(value.mk.projects) &&
    Array.isArray(value.spiritual.intentions) &&
    isObject(value.spiritual.settings)
  );
}

export function createLifeOSBackup(
  finance: unknown,
  modules: UnifiedModulesState,
  exportedAt = new Date().toISOString()
): LifeOSFullBackup {
  if (!isFinanceBackup(finance)) {
    throw new Error("Les données financières à exporter sont invalides.");
  }
  if (!isUnifiedModulesState(modules)) {
    throw new Error("Les données des modules à exporter sont invalides.");
  }

  return {
    format: LIFEOS_BACKUP_FORMAT,
    version: LIFEOS_BACKUP_VERSION,
    exportedAt,
    finance,
    modules,
  };
}

export function parseLifeOSBackup(text: string): ParsedLifeOSBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Le fichier n’est pas un JSON valide.");
  }

  if (isObject(parsed) && parsed.format === LIFEOS_BACKUP_FORMAT) {
    if (parsed.version !== LIFEOS_BACKUP_VERSION) {
      throw new Error("Cette version de sauvegarde n’est pas prise en charge.");
    }
    if (!isFinanceBackup(parsed.finance) || !isUnifiedModulesState(parsed.modules)) {
      throw new Error("La sauvegarde LifeOS est incomplète ou endommagée.");
    }
    return { finance: parsed.finance, modules: parsed.modules, kind: "full" };
  }

  if (isFinanceBackup(parsed)) {
    return { finance: parsed, modules: null, kind: "legacy-finance" };
  }

  throw new Error("Ce fichier n’est pas une sauvegarde LifeOS reconnue.");
}
