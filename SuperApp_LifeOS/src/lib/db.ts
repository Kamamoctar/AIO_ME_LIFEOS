import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const log: ("warn" | "error")[] =
    process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  const databaseUrl = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL

  if (databaseUrl) {
    if (databaseUrl.startsWith("libsql://") && !process.env.TURSO_AUTH_TOKEN) {
      throw new Error("TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL uses libsql://")
    }

    const adapter = new PrismaLibSql({
      url: databaseUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })

    return new PrismaClient({ adapter, log })
  }

  return new PrismaClient({ log })
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
