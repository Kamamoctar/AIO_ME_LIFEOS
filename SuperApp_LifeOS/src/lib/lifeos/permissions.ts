export const FEATURE_DEFINITIONS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "plan", label: "Planifier" },
  { id: "domains", label: "Domaines" },
  { id: "review", label: "Bilan" },
  { id: "cockpit", label: "Cockpit" },
  { id: "vision", label: "Vision" },
  { id: "goals", label: "Objectifs" },
  { id: "projects", label: "Projets" },
  { id: "finances", label: "Finances" },
  { id: "accounts", label: "Comptes" },
  { id: "investments", label: "Investissements et boutiques" },
  { id: "patrimoine", label: "Patrimoine" },
  { id: "decisions", label: "Decisions" },
  { id: "simulations", label: "Simulations" },
  { id: "health", label: "Sante" },
  { id: "skills", label: "Competences" },
  { id: "calendar", label: "Calendrier" },
  { id: "settings", label: "Parametres personnels" },
] as const;

export type FeatureId = (typeof FEATURE_DEFINITIONS)[number]["id"];
export type AccessLevel = "NONE" | "VIEW" | "EDIT";
export type DataVisibility = "SHARED" | "PERSONAL";
export type CoupleRole = "ADMIN" | "MEMBER";

export const DEFAULT_MEMBER_ACCESS: Record<FeatureId, AccessLevel> =
  Object.fromEntries(
    FEATURE_DEFINITIONS.map(({ id }) => [id, "EDIT"])
  ) as Record<FeatureId, AccessLevel>;

export const ENTITY_FEATURE: Record<string, FeatureId> = {
  account: "accounts",
  transaction: "finances",
  category: "finances",
  charge: "finances",
  provisionCharge: "finances",
  envelope: "finances",
  lifeArea: "vision",
  yearPlan: "vision",
  goal: "goals",
  goalSuggestion: "goals",
  project: "projects",
  milestone: "projects",
  asset: "patrimoine",
  liability: "patrimoine",
  position: "investments",
  copyTrading: "investments",
  otherInvestment: "investments",
  business: "investments",
  healthMetric: "health",
  skill: "skills",
  action: "today",
  note: "today",
  settings: "settings",
  incomeSource: "finances",
  dependent: "settings",
  fundAllocation: "finances",
  closeMonth: "finances",
};

export function normalizeAccess(value: unknown): AccessLevel {
  return value === "NONE" || value === "VIEW" || value === "EDIT"
    ? value
    : "NONE";
}

export function normalizeVisibility(value: unknown): DataVisibility {
  return value === "PERSONAL" ? "PERSONAL" : "SHARED";
}

export function canView(access: AccessLevel): boolean {
  return access === "VIEW" || access === "EDIT";
}

export function canEdit(access: AccessLevel): boolean {
  return access === "EDIT";
}

export function clientItemAccess(
  couple: {
    role: string;
    currentMemberId: string;
    permissions: Record<string, AccessLevel>;
    members: Array<{
      id: string;
      itemPermissions: Array<{
        resourceType: string;
        resourceId: string;
        access: AccessLevel;
      }>;
    }>;
  } | undefined,
  feature: FeatureId,
  resourceType: string,
  resourceId: string
): AccessLevel {
  if (!couple || couple.role === "ADMIN") return "EDIT";
  const member = couple.members.find(({ id }) => id === couple.currentMemberId);
  const override = member?.itemPermissions.find(
    (permission) =>
      permission.resourceType === resourceType &&
      permission.resourceId === resourceId
  );
  return override?.access ?? couple.permissions[feature] ?? "NONE";
}

export function canAccessScopedRecord(input: {
  actorUserId: string;
  memberUserIds: string[];
  ownerUserId: string;
  visibility: string;
  access: AccessLevel;
}): boolean {
  if (!input.memberUserIds.includes(input.ownerUserId)) return false;
  if (
    input.visibility === "PERSONAL" &&
    input.ownerUserId !== input.actorUserId
  ) {
    return false;
  }
  return canView(input.access);
}
