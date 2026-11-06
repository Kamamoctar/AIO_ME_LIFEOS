// Life OS — etat applicatif filtre selon le profil et ses permissions.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  accessErrorStatus,
  featureAccess,
  filterVisibleRecords,
  getLifeOSAccessContext,
  visibleRecordWhere,
} from "@/lib/lifeos/access";
import { FEATURE_DEFINITIONS } from "@/lib/lifeos/permissions";

export async function GET() {
  try {
    const context = await getLifeOSAccessContext();
    const where = visibleRecordWhere(context);

    const [
      settings,
      householdSettings,
      incomeSources,
      dependents,
      fundAllocations,
      accountsRaw,
      transactionsRaw,
      categoriesRaw,
      chargesRaw,
      envelopesRaw,
      lifeAreasRaw,
      yearPlansRaw,
      goalsRaw,
      projectsRaw,
      assetsRaw,
      liabilitiesRaw,
      positionsRaw,
      copyTradingRaw,
      otherInvestmentsRaw,
      businessesRaw,
      healthMetricsRaw,
      skillsRaw,
      actionsRaw,
      snapshotsRaw,
      notesRaw,
      auditEventsRaw,
      couple,
      members,
      invitations,
    ] = await Promise.all([
      db.setting.findUnique({ where: { userId: context.user.id } }),
      db.householdSetting.findUnique({ where: { coupleId: context.coupleId } }),
      db.incomeSource.findMany({
        where: { coupleId: context.coupleId },
        orderBy: { createdAt: "asc" },
      }),
      db.dependent.findMany({
        where: { coupleId: context.coupleId },
        orderBy: { createdAt: "asc" },
      }),
      db.fundAllocation.findMany({
        where: { coupleId: context.coupleId },
        orderBy: { createdAt: "asc" },
      }),
      db.account.findMany({ where, orderBy: { createdAt: "asc" } }),
      // Les soldes et indicateurs utilisent le registre complet. Tronquer cette
      // liste rendrait tous les calculs faux dès que le foyer dépasse un seuil.
      db.transaction.findMany({ where, orderBy: { date: "desc" } }),
      db.category.findMany({ where, orderBy: { name: "asc" } }),
      db.recurringCharge.findMany({ where, orderBy: { label: "asc" } }),
      db.envelope.findMany({ where, orderBy: { order: "asc" } }),
      db.lifeArea.findMany({ where, orderBy: { order: "asc" } }),
      db.yearPlan.findMany({ where, orderBy: { year: "asc" } }),
      db.goal.findMany({ where, orderBy: { createdAt: "asc" } }),
      db.project.findMany({ where, orderBy: { createdAt: "asc" } }),
      db.asset.findMany({ where }),
      db.liability.findMany({ where }),
      db.investmentPosition.findMany({ where }),
      db.copyTradingAccount.findMany({ where }),
      db.otherInvestment.findMany({ where }),
      db.business.findMany({ where }),
      db.healthMetric.findMany({ where, orderBy: { date: "desc" }, take: 120 }),
      db.skill.findMany({ where }),
      db.actionItem.findMany({ where, orderBy: { createdAt: "desc" } }),
      db.monthlySnapshot.findMany({
        where: { OR: [{ coupleId: context.coupleId }, where] },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),
      db.note.findMany({ where, orderBy: { createdAt: "desc" } }),
      db.auditEvent.findMany({
        where: { coupleId: context.coupleId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.coupleSpace.findUnique({ where: { id: context.coupleId } }),
      db.coupleMember.findMany({
        where: { coupleId: context.coupleId },
        include: { user: true, permissions: true, itemPermissions: true },
        orderBy: { joinedAt: "asc" },
      }),
      context.isAdmin
        ? db.coupleInvitation.findMany({
            where: { coupleId: context.coupleId },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

    const accounts = filterVisibleRecords(context, "accounts", accountsRaw);
    const transactions = filterVisibleRecords(context, "finances", transactionsRaw);
    const categories = filterVisibleRecords(context, "finances", categoriesRaw);
    const charges = filterVisibleRecords(context, "finances", chargesRaw);
    const envelopes = filterVisibleRecords(context, "finances", envelopesRaw);
    const lifeAreas = filterVisibleRecords(context, "vision", lifeAreasRaw);
    const yearPlans = filterVisibleRecords(context, "vision", yearPlansRaw);
    const goals = filterVisibleRecords(context, "goals", goalsRaw, "GOAL");
    const projects = filterVisibleRecords(context, "projects", projectsRaw, "PROJECT");
    const assets = filterVisibleRecords(context, "patrimoine", assetsRaw);
    const liabilities = filterVisibleRecords(context, "patrimoine", liabilitiesRaw);
    const positions = filterVisibleRecords(context, "investments", positionsRaw);
    const copyTrading = filterVisibleRecords(context, "investments", copyTradingRaw);
    const otherInvestments = filterVisibleRecords(
      context,
      "investments",
      otherInvestmentsRaw
    );
    const businesses = filterVisibleRecords(
      context,
      "investments",
      businessesRaw,
      "BUSINESS"
    );
    const healthMetrics = filterVisibleRecords(context, "health", healthMetricsRaw);
    const skills = filterVisibleRecords(context, "skills", skillsRaw);
    const actions = filterVisibleRecords(context, "today", actionsRaw);
    const snapshots = filterVisibleRecords(context, "finances", snapshotsRaw);
    const notes = filterVisibleRecords(context, "today", notesRaw);

    const milestones = projects.length
      ? await db.milestone.findMany({
          where: { projectId: { in: projects.map(({ id }) => id) } },
          orderBy: { order: "asc" },
        })
      : [];

    const memberNames = new Map(
      members.map((member) => [
        member.userId,
        member.user.name ?? member.user.email,
      ])
    );
    const withOwner = <T extends { userId: string }>(record: T) => ({
      ...record,
      ownerId: record.userId,
      ownerName: memberNames.get(record.userId) ?? null,
    });

    return NextResponse.json({
      user: {
        id: context.user.id,
        email: context.user.email,
        name: context.user.name,
        avatarUrl: context.user.avatarUrl,
      },
      settings: settings
        ? {
            ...settings,
            currency: householdSettings?.currency ?? settings.currency,
            salaryMonthly:
              incomeSources.length > 0
                ? incomeSources
                    .filter((source) => source.active && source.kind === "SALARY")
                    .reduce((sum, source) => sum + source.monthlyAmount, 0)
                : settings.salaryMonthly,
            emergencyFundMonths:
              householdSettings?.emergencyFundMonths ?? settings.emergencyFundMonths,
            safetyMargin: householdSettings?.safetyMargin ?? settings.safetyMargin,
          }
        : settings,
      incomeSources,
      dependents,
      fundAllocations,
      auditEvents: auditEventsRaw.map((event) => ({
        ...event,
        actorName: memberNames.get(event.actorId) ?? "Membre du foyer",
      })),
      accounts,
      transactions: transactions.map(withOwner),
      categories,
      charges,
      envelopes,
      lifeAreas,
      yearPlans,
      goals: goals.map(withOwner),
      projects: projects.map((project) => ({
        ...withOwner(project),
        milestones: milestones.filter(
          (milestone) => milestone.projectId === project.id
        ),
      })),
      assets,
      liabilities,
      positions,
      copyTrading,
      otherInvestments,
      businesses: businesses.map(withOwner),
      healthMetrics,
      skills,
      actions,
      snapshots,
      notes,
      couple: {
        id: context.coupleId,
        name: couple?.name ?? "Notre foyer",
        role: context.member.role,
        currentMemberId: context.member.id,
        permissions: Object.fromEntries(
          FEATURE_DEFINITIONS.map(({ id }) => [id, featureAccess(context, id)])
        ),
        members: members.map((member) => ({
          id: member.id,
          userId: member.userId,
          name: member.user.name,
          email: member.user.email,
          avatarUrl: member.user.avatarUrl,
          role: member.role,
          status: member.status,
          permissions: Object.fromEntries(
            member.permissions.map((permission) => [
              permission.feature,
              permission.access,
            ])
          ),
          itemPermissions: member.itemPermissions.map((permission) => ({
            resourceType: permission.resourceType,
            resourceId: permission.resourceId,
            access: permission.access,
          })),
        })),
        invitations: invitations.map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
        })),
      },
      today: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[state]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de chargement" },
      { status: accessErrorStatus(error) }
    );
  }
}
