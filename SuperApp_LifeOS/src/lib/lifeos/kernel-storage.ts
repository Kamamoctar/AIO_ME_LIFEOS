export const LIFEOS_KERNEL_STORAGE_KEY = "lifeos_kernel_v2";
export const LEGACY_FINANCE_STORAGE_KEY = "financeos_local_state_v1";
export const LEGACY_MODULES_STORAGE_KEY = "lifeos_unified_modules_v1";
export const LIFEOS_KERNEL_VERSION = 2;

export type KernelSection = "finance" | "modules";

export interface LifeOSKernelEnvelope {
  version: typeof LIFEOS_KERNEL_VERSION;
  updatedAt: string;
  migratedAt?: string;
  finance?: unknown;
  modules?: unknown;
}

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

function activeStorage(): StorageLike | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function emptyEnvelope(now = new Date().toISOString()): LifeOSKernelEnvelope {
  return { version: LIFEOS_KERNEL_VERSION, updatedAt: now };
}

export function parseKernelEnvelope(raw: string | null): LifeOSKernelEnvelope | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<LifeOSKernelEnvelope>;
    if (value.version !== LIFEOS_KERNEL_VERSION) return null;
    return {
      version: LIFEOS_KERNEL_VERSION,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date(0).toISOString(),
      migratedAt: typeof value.migratedAt === "string" ? value.migratedAt : undefined,
      finance: value.finance,
      modules: value.modules,
    };
  } catch {
    return null;
  }
}

function readLegacy(storage: StorageLike, key: string): unknown {
  const raw = storage.getItem(key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export function migrateLegacyKernel(storage: StorageLike | null = activeStorage()): LifeOSKernelEnvelope | null {
  if (!storage) return null;
  const existing = parseKernelEnvelope(storage.getItem(LIFEOS_KERNEL_STORAGE_KEY));
  if (existing) return existing;

  const finance = readLegacy(storage, LEGACY_FINANCE_STORAGE_KEY);
  const modules = readLegacy(storage, LEGACY_MODULES_STORAGE_KEY);
  const now = new Date().toISOString();
  const envelope: LifeOSKernelEnvelope = {
    ...emptyEnvelope(now),
    migratedAt: finance !== undefined || modules !== undefined ? now : undefined,
    finance,
    modules,
  };
  storage.setItem(LIFEOS_KERNEL_STORAGE_KEY, JSON.stringify(envelope));
  return envelope;
}

export function readKernelSection<T>(
  section: KernelSection,
  storage: StorageLike | null = activeStorage()
): T | null {
  const envelope = migrateLegacyKernel(storage);
  const value = envelope?.[section];
  return value === undefined ? null : (value as T);
}

export function writeKernelSection(
  section: KernelSection,
  value: unknown,
  storage: StorageLike | null = activeStorage()
): void {
  if (!storage) return;
  const envelope = migrateLegacyKernel(storage) ?? emptyEnvelope();
  const next: LifeOSKernelEnvelope = {
    ...envelope,
    version: LIFEOS_KERNEL_VERSION,
    updatedAt: new Date().toISOString(),
    [section]: value,
  };
  storage.setItem(LIFEOS_KERNEL_STORAGE_KEY, JSON.stringify(next));
}
