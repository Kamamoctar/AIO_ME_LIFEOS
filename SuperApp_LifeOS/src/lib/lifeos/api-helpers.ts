// Life OS — Helpers API
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  accessErrorStatus,
  getLifeOSAccessContext,
  type LifeOSAccessContext,
} from "./access";

export async function withUser<T>(
  handler: (userId: string, context: LifeOSAccessContext) => Promise<T>,
  audit?: {
    entity: string;
    action: string;
    targetId?: string;
    data?: Record<string, unknown>;
  }
): Promise<NextResponse> {
  try {
    const context = await getLifeOSAccessContext();
    const result = await handler(context.user.id, context);
    if (audit) {
      const resultId =
        result && typeof result === "object" && "id" in result
          ? String((result as { id: unknown }).id)
          : undefined;
      const safeSummary = Object.fromEntries(
        ["amount", "type", "label", "name", "status", "year", "month"]
          .filter((key) => audit.data?.[key] !== undefined)
          .map((key) => [key, audit.data?.[key]])
      );
      await db.auditEvent.create({
        data: {
          coupleId: context.coupleId,
          actorId: context.user.id,
          entity: audit.entity,
          action: audit.action,
          targetId: resultId ?? audit.targetId ?? null,
          summary:
            Object.keys(safeSummary).length > 0
              ? JSON.stringify(safeSummary)
              : null,
        },
      });
    }
    return NextResponse.json(result as object);
  } catch (e) {
    console.error("[lifeos-api]", e);
    const message = e instanceof Error ? e.message : "Erreur interne";
    return NextResponse.json(
      { error: message },
      { status: accessErrorStatus(e, 400) }
    );
  }
}

export function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v.replace(/\s/g, "")) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function intOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v.replace(/\s/g, "")) : Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function floatOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function dateOrNull(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function bool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}
