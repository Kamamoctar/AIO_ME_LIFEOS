import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.user.count();
    return Response.json({ status: "ok", database: "ready" });
  } catch (error) {
    console.error("[health]", error);
    return Response.json(
      { status: "error", database: "unavailable" },
      { status: 503 }
    );
  }
}

