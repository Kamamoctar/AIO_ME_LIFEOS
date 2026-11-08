export const LIFEOS_ENCRYPTED_FORMAT = "lifeos-encrypted-transfer";
export const LIFEOS_ENCRYPTED_VERSION = 1;
export const LIFEOS_KDF_ITERATIONS = 310_000;

export interface EncryptedLifeOSBackup {
  format: typeof LIFEOS_ENCRYPTED_FORMAT;
  version: typeof LIFEOS_ENCRYPTED_VERSION;
  createdAt: string;
  encryption: {
    algorithm: "AES-GCM";
    kdf: "PBKDF2-SHA-256";
    iterations: number;
    salt: string;
    iv: string;
  };
  payload: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: toArrayBuffer(salt), iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptLifeOSBackup(plaintext: string, passphrase: string): Promise<EncryptedLifeOSBackup> {
  if (passphrase.length < 10) throw new Error("La phrase secrète doit contenir au moins 10 caractères.");
  if (!globalThis.crypto?.subtle) throw new Error("Le chiffrement n’est pas disponible sur cet appareil.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, LIFEOS_KDF_ITERATIONS);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return {
    format: LIFEOS_ENCRYPTED_FORMAT,
    version: LIFEOS_ENCRYPTED_VERSION,
    createdAt: new Date().toISOString(),
    encryption: {
      algorithm: "AES-GCM",
      kdf: "PBKDF2-SHA-256",
      iterations: LIFEOS_KDF_ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
    },
    payload: bytesToBase64(new Uint8Array(encrypted)),
  };
}

function isEncryptedBackup(value: unknown): value is EncryptedLifeOSBackup {
  if (typeof value !== "object" || value === null) return false;
  const backup = value as Partial<EncryptedLifeOSBackup>;
  return backup.format === LIFEOS_ENCRYPTED_FORMAT &&
    backup.version === LIFEOS_ENCRYPTED_VERSION &&
    backup.encryption?.algorithm === "AES-GCM" &&
    backup.encryption.kdf === "PBKDF2-SHA-256" &&
    typeof backup.encryption.salt === "string" &&
    typeof backup.encryption.iv === "string" &&
    typeof backup.encryption.iterations === "number" &&
    typeof backup.payload === "string";
}

export async function decryptLifeOSBackup(serialized: string, passphrase: string): Promise<string> {
  try {
    const parsed = JSON.parse(serialized) as unknown;
    if (!isEncryptedBackup(parsed) || parsed.encryption.iterations !== LIFEOS_KDF_ITERATIONS) throw new Error();
    const key = await deriveKey(passphrase, base64ToBytes(parsed.encryption.salt), parsed.encryption.iterations);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(parsed.encryption.iv)) },
      key,
      toArrayBuffer(base64ToBytes(parsed.payload))
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error("Phrase secrète incorrecte ou fichier chiffré endommagé.");
  }
}
