import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "src/app/api");
const apiTempDir = path.join(root, "src/app/_api_temp");
const proxyFile = path.join(root, "src/proxy.ts");
const proxyTempFile = path.join(root, "src/_proxy_temp.ts");

function javaExecutable(javaHome) {
  return path.join(javaHome, "bin", process.platform === "win32" ? "java.exe" : "java");
}

function javaMajor(javaHome) {
  const executable = javaExecutable(javaHome);
  if (!fs.existsSync(executable)) return 0;
  const result = spawnSync(executable, ["-version"], { encoding: "utf8" });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const match = output.match(/version\s+"(?:1\.)?(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function childDirectories(parent) {
  if (!parent || !fs.existsSync(parent)) return [];
  return fs.readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(parent, entry.name));
}

function resolveAndroidJavaHome() {
  const candidates = [process.env.LIFEOS_JAVA_HOME, process.env.JAVA_HOME].filter(Boolean);
  if (process.platform === "win32") {
    const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
    candidates.push(path.join(programFiles, "Android", "Android Studio", "jbr"));
    candidates.push(...childDirectories(path.join(programFiles, "Eclipse Adoptium")));
    candidates.push(...childDirectories(path.join(programFiles, "Microsoft")));
    candidates.push(...childDirectories(path.join(programFiles, "Java")));
  } else {
    candidates.push(...childDirectories("/usr/lib/jvm"));
    candidates.push(...childDirectories("/Library/Java/JavaVirtualMachines").map((home) => path.join(home, "Contents", "Home")));
  }
  const compatible = candidates
    .map((home) => ({ home, major: javaMajor(home) }))
    .filter((candidate) => candidate.major === 21);
  if (!compatible.length) {
    throw new Error("LifeOS requiert précisément un JDK 21 pour compiler Capacitor Android. Définis LIFEOS_JAVA_HOME vers ce JDK.");
  }
  return compatible[0];
}

console.log("=== Compilation LifeOS APK (100% hors-ligne) ===");

let apiMoved = false;
let proxyMoved = false;

try {
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, apiTempDir);
    apiMoved = true;
  }
  if (fs.existsSync(proxyFile)) {
    fs.renameSync(proxyFile, proxyTempFile);
    proxyMoved = true;
  }

  // Le serveur de développement génère des validateurs qui référencent les
  // routes API. Elles sont volontairement retirées du bundle APK hors ligne,
  // donc ce cache ne doit pas participer au type-check de l'export statique.
  fs.rmSync(path.join(root, ".next", "dev"), { recursive: true, force: true });

  console.log("1. Generation du bundle web statique (Next.js export)...");
  execSync("npx next build", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, BUILD_TARGET: "apk" },
  });
} finally {
  if (apiMoved && fs.existsSync(apiTempDir)) {
    fs.renameSync(apiTempDir, apiDir);
  }
  if (proxyMoved && fs.existsSync(proxyTempFile)) {
    fs.renameSync(proxyTempFile, proxyFile);
  }
}

console.log("2. Synchronisation Capacitor Android...");
execSync("npx cap sync android", { cwd: root, stdio: "inherit" });

console.log("3. Compilation Gradle APK...");
const gradlewCmd = process.platform === "win32" ? ".\\gradlew.bat assembleDebug" : "./gradlew assembleDebug";
const java = resolveAndroidJavaHome();
console.log(`   Java ${java.major} : ${java.home}`);
execSync(gradlewCmd, {
  cwd: path.join(root, "android"),
  stdio: "inherit",
  env: { ...process.env, JAVA_HOME: java.home },
});

const builtApk = path.join(root, "android/app/build/outputs/apk/debug/app-debug.apk");
const destApk = path.join(root, "LifeOS.apk");

if (fs.existsSync(builtApk)) {
  fs.copyFileSync(builtApk, destApk);
  const sizeMb = (fs.statSync(destApk).size / (1024 * 1024)).toFixed(2);
  console.log(`\n=== SUCCES ! ===\nAPK genere : ${destApk} (${sizeMb} Mo)`);
} else {
  console.error("Erreur : le fichier APK n'a pas ete trouve.");
}
