import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const signingDir = path.join(root, ".signing");
const keystorePath = path.join(signingDir, "lifeos-release.jks");
const configPath = path.join(signingDir, "lifeos-release.json");
const alias = "lifeos-release";

function javaMajor(javaHome) {
  const executable = path.join(javaHome, "bin", process.platform === "win32" ? "java.exe" : "java");
  if (!fs.existsSync(executable)) return 0;
  const result = spawnSync(executable, ["-version"], { encoding: "utf8" });
  const match = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.match(/version\s+"(?:1\.)?(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function childDirectories(parent) {
  if (!parent || !fs.existsSync(parent)) return [];
  return fs.readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(parent, entry.name));
}

function resolveJava21() {
  const candidates = [process.env.LIFEOS_JAVA_HOME, process.env.JAVA_HOME].filter(Boolean);
  if (process.platform === "win32") {
    const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
    candidates.push(path.join(programFiles, "Android", "Android Studio", "jbr"));
    candidates.push(...childDirectories(path.join(process.env.TEMP ?? "", "lifeos-jdk21-portable")));
    candidates.push(...childDirectories(path.join(programFiles, "Eclipse Adoptium")));
  } else {
    candidates.push(...childDirectories("/usr/lib/jvm"));
    candidates.push(...childDirectories("/Library/Java/JavaVirtualMachines").map((home) => path.join(home, "Contents", "Home")));
  }
  return candidates.find((candidate) => javaMajor(candidate) === 21);
}

if (fs.existsSync(keystorePath) || fs.existsSync(configPath)) {
  throw new Error("Une signature locale existe déjà dans .signing. Aucun fichier n’a été remplacé.");
}

const javaHome = resolveJava21();
if (!javaHome) throw new Error("JDK 21 introuvable. Définis LIFEOS_JAVA_HOME avant de créer la signature.");

const keytool = path.join(javaHome, "bin", process.platform === "win32" ? "keytool.exe" : "keytool");
const password = randomBytes(30).toString("base64url");
fs.mkdirSync(signingDir, { recursive: true });

const result = spawnSync(keytool, [
  "-genkeypair",
  "-keystore", keystorePath,
  "-storepass", password,
  "-keypass", password,
  "-alias", alias,
  "-keyalg", "RSA",
  "-keysize", "4096",
  "-validity", "9125",
  "-dname", "CN=LifeOS, OU=Mobile, O=MOC Life, L=Lome, C=TG",
], { encoding: "utf8" });

if (result.status !== 0) {
  fs.rmSync(signingDir, { recursive: true, force: true });
  throw new Error(`Création de la signature impossible : ${result.stderr || result.stdout}`);
}

fs.writeFileSync(configPath, JSON.stringify({
  keystorePath,
  keystorePassword: password,
  keyAlias: alias,
  keyPassword: password,
  createdAt: new Date().toISOString(),
  host: os.hostname(),
}, null, 2), { mode: 0o600 });

console.log("Signature Android créée dans .signing (dossier ignoré par Git).");
console.log("Sauvegarde ce dossier en lieu sûr : il est indispensable pour publier les futures mises à jour.");
