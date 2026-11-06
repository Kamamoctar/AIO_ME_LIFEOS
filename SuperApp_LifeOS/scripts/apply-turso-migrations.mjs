import { createClient } from "@libsql/client";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const { DATABASE_URL, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env;
const databaseUrl = TURSO_DATABASE_URL || DATABASE_URL;

if (!databaseUrl) {
  console.error("TURSO_DATABASE_URL or DATABASE_URL is required.");
  process.exit(1);
}

if (!TURSO_AUTH_TOKEN && databaseUrl.startsWith("libsql://")) {
  console.error("TURSO_AUTH_TOKEN is required for remote Turso databases.");
  process.exit(1);
}

const migrationsDir = path.resolve("prisma", "migrations");

if (!existsSync(migrationsDir)) {
  console.error("No prisma/migrations directory found.");
  process.exit(1);
}

const migrationFiles = readdirSync(migrationsDir)
  .map((name) => path.join(migrationsDir, name, "migration.sql"))
  .filter((file) => existsSync(file))
  .sort();

if (migrationFiles.length === 0) {
  console.error("No migration.sql files found.");
  process.exit(1);
}

const client = createClient({
  url: databaseUrl,
  authToken: TURSO_AUTH_TOKEN,
});

function splitSql(sql) {
  return sql
    .split(";")
    .map((statement) =>
      statement
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter(Boolean);
}

await client.execute(`
  CREATE TABLE IF NOT EXISTS _lifeos_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

for (const file of migrationFiles) {
  const name = path.basename(path.dirname(file));
  const applied = await client.execute({
    sql: "SELECT name FROM _lifeos_migrations WHERE name = ?",
    args: [name],
  });

  if (applied.rows.length > 0) {
    console.log(`Skipping ${name} (already applied)`);
    continue;
  }

  console.log(`Applying ${name}`);
  const statements = splitSql(readFileSync(file, "utf8"));
  await client.batch(statements.map((sql) => ({ sql, args: [] })), "write");
  await client.execute({
    sql: "INSERT INTO _lifeos_migrations (name) VALUES (?)",
    args: [name],
  });
}

console.log("Database migrations applied.");
