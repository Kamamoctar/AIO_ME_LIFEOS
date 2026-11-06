import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ensureSeed } from "./seed";
import {
  DEFAULT_MEMBER_ACCESS,
  ENTITY_FEATURE,
  FEATURE_DEFINITIONS,
  canAccessScopedRecord,
  canEdit,
  normalizeAccess,
  type AccessLevel,
  type FeatureId,
} from "./permissions";

export class ApiAccessError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiAccessError";
  }
}

interface ContextUser {
  id: string;
  authUserId: string | null;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface ContextMember {
  id: string;
  coupleId: string;
  userId: string;
  role: string;
  status: string;
}

export interface LifeOSAccessContext {
  user: ContextUser;
  member: ContextMember;
  coupleId: string;
  memberUserIds: string[];
  isAdmin: boolean;
  permissions: Map<FeatureId, AccessLevel>;
  itemPermissions: Map<string, AccessLevel>;
}

const RESOURCE_MODELS: Record<
  string,
  { model: string; feature: FeatureId; resourceType?: string }
> = {
  account: { model: "account", feature: "accounts" },
  transaction: { model: "transaction", feature: "finances" },
  category: { model: "category", feature: "finances" },
  charge: { model: "recurringCharge", feature: "finances" },
  provisionCharge: { model: "recurringCharge", feature: "finances" },
  envelope: { model: "envelope", feature: "finances" },
  goal: { model: "goal", feature: "goals", resourceType: "GOAL" },
  goalSuggestion: { model: "goal", feature: "goals", resourceType: "GOAL" },
  project: { model: "project", feature: "projects", resourceType: "PROJECT" },
  asset: { model: "asset", feature: "patrimoine" },
  liability: { model: "liability", feature: "patrimoine" },
  position: { model: "investmentPosition", feature: "investments" },
  copyTrading: { model: "copyTradingAccount", feature: "investments" },
  otherInvestment: { model: "otherInvestment", feature: "investments" },
  business: { model: "business", feature: "investments", resourceType: "BUSINESS" },
  healthMetric: { model: "healthMetric", feature: "health" },
  skill: { model: "skill", feature: "skills" },
  action: { model: "actionItem", feature: "today" },
  note: { model: "note", feature: "today" },
};

function clerkIsConfigured(): boolean {
  return Boolean(
    process.env.CLERK_SECRET_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
}

async function ensureOwnerCouple(ownerId: string) {
  const existing = await db.coupleMember.findUnique({
    where: { userId: ownerId },
  });
  if (existing) return existing;

  const couple = await db.coupleSpace.create({
    data: { name: "Notre foyer" },
  });
  return db.coupleMember.create({
    data: {
      coupleId: couple.id,
      userId: ownerId,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
}

export async function ensureDefaultPermissions(memberId: string) {
  await Promise.all(
    FEATURE_DEFINITIONS.map(({ id }) =>
      db.featurePermission.upsert({
        where: { memberId_feature: { memberId, feature: id } },
        update: {},
        create: {
          memberId,
          feature: id,
          access: DEFAULT_MEMBER_ACCESS[id],
        },
      })
    )
  );
}

async function claimAuthenticatedUser() {
  const session = await auth();
  if (!session.userId) {
    throw new ApiAccessError("Connexion requise", 401);
  }

  const linked = await db.user.findUnique({
    where: { authUserId: session.userId },
  });
  if (linked) return linked;

  const identity = await currentUser();
  const email = identity?.primaryEmailAddress?.emailAddress
    ?.trim()
    .toLowerCase();
  if (!identity || !email) {
    throw new ApiAccessError(
      "Une adresse e-mail verifiee est necessaire pour rejoindre Life OS",
      403
    );
  }

  const displayName =
    [identity.firstName, identity.lastName].filter(Boolean).join(" ") ||
    identity.username ||
    null;

  const invitation = await db.coupleInvitation.findFirst({
    where: { email, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (invitation) {
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await db.coupleInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new ApiAccessError("Cette invitation a expire", 403);
    }

    const existingByEmail = await db.user.findUnique({ where: { email } });
    const user = existingByEmail
      ? await db.user.update({
          where: { id: existingByEmail.id },
          data: {
            authUserId: session.userId,
            name: displayName ?? existingByEmail.name,
            avatarUrl: identity.imageUrl,
          },
        })
      : await db.user.create({
          data: {
            authUserId: session.userId,
            email,
            name: displayName ?? invitation.name,
            avatarUrl: identity.imageUrl,
          },
        });

    const member = await db.coupleMember.upsert({
      where: { userId: user.id },
      update: {
        coupleId: invitation.coupleId,
        role: invitation.role,
        status: "ACTIVE",
      },
      create: {
        coupleId: invitation.coupleId,
        userId: user.id,
        role: invitation.role,
        status: "ACTIVE",
      },
    });
    await ensureDefaultPermissions(member.id);
    await db.setting.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, salaryMonthly: 0, safetyMargin: 0 },
    });
    await db.coupleInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
    return user;
  }

  // Le tout premier profil authentifie revendique le profil historique et
  // conserve ainsi toutes les donnees mono-utilisateur existantes.
  const owner = await ensureSeed();
  const ownerMember = await ensureOwnerCouple(owner.id);
  if (ownerMember.role === "ADMIN" && !owner.authUserId) {
    const conflictingUser = await db.user.findUnique({ where: { email } });
    if (conflictingUser && conflictingUser.id !== owner.id) {
      throw new ApiAccessError(
        "Cette adresse est deja rattachee a un autre profil",
        409
      );
    }
    return db.user.update({
      where: { id: owner.id },
      data: {
        authUserId: session.userId,
        email,
        name: displayName ?? owner.name,
        avatarUrl: identity.imageUrl,
      },
    });
  }

  throw new ApiAccessError(
    "Ce profil n'a pas encore ete invite dans l'espace couple",
    403
  );
}

export async function getLifeOSAccessContext(): Promise<LifeOSAccessContext> {
  let user: ContextUser;

  if (!clerkIsConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiAccessError(
        "Clerk n'est pas configure sur cet environnement",
        503
      );
    }
    user = (await ensureSeed()) as ContextUser;
    await ensureOwnerCouple(user.id);
  } else {
    user = (await claimAuthenticatedUser()) as ContextUser;
  }

  const membership = await db.coupleMember.findUnique({
    where: { userId: user.id },
    include: { permissions: true, itemPermissions: true },
  });
  if (!membership || membership.status !== "ACTIVE") {
    throw new ApiAccessError("Acces a l'espace couple suspendu", 403);
  }

  await db.householdSetting.upsert({
    where: { coupleId: membership.coupleId },
    update: {},
    create: {
      coupleId: membership.coupleId,
      currency: "XOF",
      emergencyFundMonths: 3,
      safetyMargin: 0,
    },
  });

  const members = await db.coupleMember.findMany({
    where: { coupleId: membership.coupleId, status: "ACTIVE" },
    select: { userId: true },
  });
  const isAdmin = membership.role === "ADMIN";
  const permissions = new Map<FeatureId, AccessLevel>();
  for (const definition of FEATURE_DEFINITIONS) {
    permissions.set(definition.id, isAdmin ? "EDIT" : "NONE");
  }
  for (const permission of membership.permissions) {
    if (permission.feature in DEFAULT_MEMBER_ACCESS) {
      permissions.set(
        permission.feature as FeatureId,
        normalizeAccess(permission.access)
      );
    }
  }

  return {
    user,
    member: membership,
    coupleId: membership.coupleId,
    memberUserIds: members.map(({ userId }) => userId),
    isAdmin,
    permissions,
    itemPermissions: new Map(
      membership.itemPermissions.map((permission) => [
        `${permission.resourceType}:${permission.resourceId}`,
        normalizeAccess(permission.access),
      ])
    ),
  };
}

export function featureAccess(
  context: LifeOSAccessContext,
  feature: FeatureId
): AccessLevel {
  return context.isAdmin ? "EDIT" : context.permissions.get(feature) ?? "NONE";
}

export function assertFeatureEdit(
  context: LifeOSAccessContext,
  entity: string
) {
  const feature = ENTITY_FEATURE[entity];
  if (!feature || !canEdit(featureAccess(context, feature))) {
    throw new ApiAccessError("Modification non autorisee", 403);
  }
}

export function visibleRecordWhere(context: LifeOSAccessContext) {
  return {
    OR: [
      { userId: context.user.id },
      {
        userId: { in: context.memberUserIds },
        visibility: "SHARED",
      },
    ],
  };
}

function effectiveItemAccess(
  context: LifeOSAccessContext,
  feature: FeatureId,
  resourceType: string | undefined,
  resourceId: string
) {
  if (!context.isAdmin && resourceType) {
    const override = context.itemPermissions.get(
      `${resourceType}:${resourceId}`
    );
    if (override) return override;
  }
  return featureAccess(context, feature);
}

export function filterVisibleRecords<
  T extends { id: string; userId: string; visibility: string },
>(
  context: LifeOSAccessContext,
  feature: FeatureId,
  records: T[],
  resourceType?: string
): T[] {
  return records.filter((record) => {
    return canAccessScopedRecord({
      actorUserId: context.user.id,
      memberUserIds: context.memberUserIds,
      ownerUserId: record.userId,
      visibility: record.visibility,
      access: effectiveItemAccess(context, feature, resourceType, record.id),
    });
  });
}

export async function resolveWritableOwnerId(
  context: LifeOSAccessContext,
  entity: string,
  id: string
): Promise<string> {
  const config = RESOURCE_MODELS[entity];
  if (!config) {
    assertFeatureEdit(context, entity);
    return context.user.id;
  }

  const model = (db as unknown as Record<
    string,
    {
      findUnique(args: unknown): Promise<
        { id: string; userId: string; visibility: string } | null
      >;
    }
  >)[config.model];
  const record = await model.findUnique({
    where: { id },
    select: { id: true, userId: true, visibility: true },
  });
  if (!record || !context.memberUserIds.includes(record.userId)) {
    throw new ApiAccessError("Element introuvable", 404);
  }
  if (record.visibility === "PERSONAL" && record.userId !== context.user.id) {
    throw new ApiAccessError("Cet element est personnel", 403);
  }
  if (
    !canEdit(
      effectiveItemAccess(
        context,
        config.feature,
        config.resourceType,
        record.id
      )
    )
  ) {
    throw new ApiAccessError("Modification non autorisee", 403);
  }
  return record.userId;
}

export function accessErrorStatus(error: unknown, fallback = 500): number {
  return error instanceof ApiAccessError ? error.status : fallback;
}
