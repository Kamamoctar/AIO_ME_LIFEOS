import { spawnSync } from "node:child_process";

if (process.env.SKIP_PRISMA_GENERATE === "1") {
  process.exit(0);
}

process.env.DATABASE_URL ||= "file:./prisma/dev.db";

const result = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

process.exit(result.status ?? 1);
