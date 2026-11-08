import { describe, expect, it } from "vitest";
import { decryptLifeOSBackup, encryptLifeOSBackup } from "@/lib/lifeos/encrypted-backup";

describe("encrypted LifeOS transfers", () => {
  it("round-trips an encrypted payload without exposing its content", async () => {
    const source = JSON.stringify({ private: "journal confidentiel", amount: 42 });
    const encrypted = await encryptLifeOSBackup(source, "une phrase vraiment secrete");
    const serialized = JSON.stringify(encrypted);
    expect(serialized).not.toContain("journal confidentiel");
    await expect(decryptLifeOSBackup(serialized, "une phrase vraiment secrete")).resolves.toBe(source);
  });

  it("rejects a wrong passphrase", async () => {
    const encrypted = await encryptLifeOSBackup("secret", "phrase correcte 123");
    await expect(decryptLifeOSBackup(JSON.stringify(encrypted), "mauvaise phrase 123")).rejects.toThrow("incorrecte");
  });

  it("rejects a tampered payload", async () => {
    const encrypted = await encryptLifeOSBackup("secret", "phrase correcte 123");
    encrypted.payload = `${encrypted.payload.slice(0, -2)}AA`;
    await expect(decryptLifeOSBackup(JSON.stringify(encrypted), "phrase correcte 123")).rejects.toThrow("endommagé");
  });
});
