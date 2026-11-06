import { describe, expect, it } from "vitest";
import {
  canAccessScopedRecord,
  clientItemAccess,
  normalizeVisibility,
} from "../../src/lib/lifeos/permissions";

const memberCouple = {
  role: "MEMBER",
  currentMemberId: "member-partner",
  permissions: { goals: "VIEW" as const, projects: "NONE" as const },
  members: [
    {
      id: "member-partner",
      itemPermissions: [
        {
          resourceType: "PROJECT",
          resourceId: "marriage",
          access: "VIEW" as const,
        },
        {
          resourceType: "PROJECT",
          resourceId: "shop",
          access: "EDIT" as const,
        },
      ],
    },
  ],
};

describe("couple permissions", () => {
  it("uses shared visibility when no personal scope is specified", () => {
    expect(normalizeVisibility(undefined)).toBe("SHARED");
    expect(normalizeVisibility("UNKNOWN")).toBe("SHARED");
    expect(normalizeVisibility("PERSONAL")).toBe("PERSONAL");
  });

  it("keeps a personal record private even from the administrator", () => {
    expect(
      canAccessScopedRecord({
        actorUserId: "admin",
        memberUserIds: ["admin", "partner"],
        ownerUserId: "partner",
        visibility: "PERSONAL",
        access: "EDIT",
      })
    ).toBe(false);
  });

  it("shares a record with the other active member", () => {
    expect(
      canAccessScopedRecord({
        actorUserId: "partner",
        memberUserIds: ["admin", "partner"],
        ownerUserId: "admin",
        visibility: "SHARED",
        access: "VIEW",
      })
    ).toBe(true);
  });

  it("does not expose records from another couple", () => {
    expect(
      canAccessScopedRecord({
        actorUserId: "partner",
        memberUserIds: ["admin", "partner"],
        ownerUserId: "outsider",
        visibility: "SHARED",
        access: "EDIT",
      })
    ).toBe(false);
  });

  it("can reveal the marriage while the projects section is hidden", () => {
    expect(
      clientItemAccess(memberCouple, "projects", "PROJECT", "marriage")
    ).toBe("VIEW");
  });

  it("can grant edit access to the partner's shop", () => {
    expect(
      clientItemAccess(memberCouple, "projects", "PROJECT", "shop")
    ).toBe("EDIT");
  });

  it("falls back to the feature permission when there is no override", () => {
    expect(
      clientItemAccess(memberCouple, "projects", "PROJECT", "other")
    ).toBe("NONE");
    expect(clientItemAccess(memberCouple, "goals", "GOAL", "goal-1")).toBe(
      "VIEW"
    );
  });
});
