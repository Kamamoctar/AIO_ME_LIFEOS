import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ApiAccessError,
  accessErrorStatus,
  ensureDefaultPermissions,
  getLifeOSAccessContext,
} from "@/lib/lifeos/access";
import {
  DEFAULT_MEMBER_ACCESS,
  normalizeAccess,
} from "@/lib/lifeos/permissions";

interface CoupleActionBody {
  action: string;
  data?: Record<string, unknown>;
}

const ITEM_MODELS = {
  GOAL: "goal",
  PROJECT: "project",
  BUSINESS: "business",
} as const;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requireAdmin(isAdmin: boolean) {
  if (!isAdmin) {
    throw new ApiAccessError("Action reservee a l'administrateur", 403);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getLifeOSAccessContext();
    requireAdmin(context.isAdmin);
    const body = (await request.json()) as CoupleActionBody;
    const data = body.data ?? {};

    switch (body.action) {
      case "rename": {
        const name = text(data.name);
        if (!name) throw new ApiAccessError("Nom requis", 400);
        await db.coupleSpace.update({
          where: { id: context.coupleId },
          data: { name: name.slice(0, 80) },
        });
        return NextResponse.json({ ok: true });
      }

      case "invite": {
        const email = text(data.email).toLowerCase();
        const name = text(data.name) || null;
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          throw new ApiAccessError("Adresse e-mail invalide", 400);
        }
        if (email === context.user.email.toLowerCase()) {
          throw new ApiAccessError("Ce profil est deja administrateur", 409);
        }

        const existingMember = await db.coupleMember.findFirst({
          where: { coupleId: context.coupleId, user: { email } },
        });
        if (existingMember) {
          throw new ApiAccessError("Cette personne fait deja partie de l'espace", 409);
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const invitation = await db.coupleInvitation.upsert({
          where: { coupleId_email: { coupleId: context.coupleId, email } },
          update: {
            name,
            role: "MEMBER",
            status: "PENDING",
            invitedById: context.user.id,
            expiresAt,
            acceptedAt: null,
          },
          create: {
            coupleId: context.coupleId,
            email,
            name,
            role: "MEMBER",
            status: "PENDING",
            invitedById: context.user.id,
            expiresAt,
          },
        });
        return NextResponse.json({
          ok: true,
          invitation: { id: invitation.id, email: invitation.email },
        });
      }

      case "revokeInvitation": {
        const invitationId = text(data.invitationId);
        const result = await db.coupleInvitation.updateMany({
          where: { id: invitationId, coupleId: context.coupleId },
          data: { status: "REVOKED" },
        });
        if (!result.count) throw new ApiAccessError("Invitation introuvable", 404);
        return NextResponse.json({ ok: true });
      }

      case "updatePermission": {
        const memberId = text(data.memberId);
        const feature = text(data.feature);
        const access = normalizeAccess(data.access);
        if (!(feature in DEFAULT_MEMBER_ACCESS)) {
          throw new ApiAccessError("Rubrique inconnue", 400);
        }
        const member = await db.coupleMember.findFirst({
          where: { id: memberId, coupleId: context.coupleId },
        });
        if (!member) throw new ApiAccessError("Membre introuvable", 404);
        if (member.role === "ADMIN") {
          throw new ApiAccessError("Les droits administrateur sont permanents", 400);
        }
        await ensureDefaultPermissions(member.id);
        await db.featurePermission.upsert({
          where: { memberId_feature: { memberId, feature } },
          update: { access },
          create: { memberId, feature, access },
        });
        return NextResponse.json({ ok: true });
      }

      case "updateItemPermission": {
        const memberId = text(data.memberId);
        const resourceType = text(data.resourceType).toUpperCase();
        const resourceId = text(data.resourceId);
        const access = normalizeAccess(data.access);
        const modelName = ITEM_MODELS[resourceType as keyof typeof ITEM_MODELS];
        if (!modelName || !resourceId) {
          throw new ApiAccessError("Element partage invalide", 400);
        }
        const member = await db.coupleMember.findFirst({
          where: { id: memberId, coupleId: context.coupleId, role: "MEMBER" },
        });
        if (!member) throw new ApiAccessError("Membre introuvable", 404);

        const model = (db as unknown as Record<
          string,
          {
            findUnique(args: unknown): Promise<
              { id: string; userId: string; visibility: string } | null
            >;
          }
        >)[modelName];
        const resource = await model.findUnique({
          where: { id: resourceId },
          select: { id: true, userId: true, visibility: true },
        });
        if (
          !resource ||
          !context.memberUserIds.includes(resource.userId) ||
          resource.visibility !== "SHARED"
        ) {
          throw new ApiAccessError("Element partage introuvable", 404);
        }

        await db.itemPermission.upsert({
          where: {
            memberId_resourceType_resourceId: {
              memberId,
              resourceType,
              resourceId,
            },
          },
          update: { access },
          create: { memberId, resourceType, resourceId, access },
        });
        return NextResponse.json({ ok: true });
      }

      default:
        throw new ApiAccessError("Action foyer inconnue", 400);
    }
  } catch (error) {
    console.error("[couple]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: accessErrorStatus(error) }
    );
  }
}
