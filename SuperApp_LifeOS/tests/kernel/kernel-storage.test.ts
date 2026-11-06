import { describe, expect, it } from "vitest";
import {
  LEGACY_FINANCE_STORAGE_KEY,
  LEGACY_MODULES_STORAGE_KEY,
  LIFEOS_KERNEL_STORAGE_KEY,
  migrateLegacyKernel,
  parseKernelEnvelope,
  readKernelSection,
  type StorageLike,
  writeKernelSection,
} from "../../src/lib/lifeos/kernel-storage";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("LifeOS kernel storage", () => {
  it("migrates the two legacy stores into one versioned envelope", () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_FINANCE_STORAGE_KEY, JSON.stringify({ accounts: ["cash"] }));
    storage.setItem(LEGACY_MODULES_STORAGE_KEY, JSON.stringify({ version: 1, daily: {} }));

    const envelope = migrateLegacyKernel(storage);

    expect(envelope?.version).toBe(2);
    expect(envelope?.finance).toEqual({ accounts: ["cash"] });
    expect(envelope?.modules).toEqual({ version: 1, daily: {} });
    expect(storage.getItem(LIFEOS_KERNEL_STORAGE_KEY)).not.toBeNull();
  });

  it("updates one section without overwriting the other", () => {
    const storage = new MemoryStorage();
    writeKernelSection("finance", { balance: 10 }, storage);
    writeKernelSection("modules", { xp: 5 }, storage);
    writeKernelSection("finance", { balance: 25 }, storage);

    expect(readKernelSection("finance", storage)).toEqual({ balance: 25 });
    expect(readKernelSection("modules", storage)).toEqual({ xp: 5 });
  });

  it("rejects malformed or unsupported kernel envelopes", () => {
    expect(parseKernelEnvelope("not-json")).toBeNull();
    expect(parseKernelEnvelope(JSON.stringify({ version: 1 }))).toBeNull();
  });
});
