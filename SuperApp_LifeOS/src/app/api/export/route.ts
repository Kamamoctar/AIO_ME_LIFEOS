// Sauvegarde de toutes les donnees accessibles a l'administrateur.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ApiAccessError,
  accessErrorStatus,
  getLifeOSAccessContext,
  visibleRecordWhere,
} from "@/lib/lifeos/access";

export async function GET() {
  try {
    const context = await getLifeOSAccessContext();
    if (!context.isAdmin) {
      throw new ApiAccessError("Export reserve a l'administrateur", 403);
    }
    const where = visibleRecordWhere(context);

    const dump = await db.$transaction([
      db.setting.findUnique({ where: { userId: context.user.id } }),
      db.householdSetting.findUnique({ where: { coupleId: context.coupleId } }),
      db.incomeSource.findMany({ where: { coupleId: context.coupleId } }),
      db.dependent.findMany({ where: { coupleId: context.coupleId } }),
      db.fundAllocation.findMany({ where: { coupleId: context.coupleId } }),
      db.auditEvent.findMany({ where: { coupleId: context.coupleId } }),
      db.account.findMany({ where }),
      db.transaction.findMany({ where }),
      db.category.findMany({ where }),
      db.recurringCharge.findMany({ where }),
      db.envelope.findMany({ where }),
      db.lifeArea.findMany({ where }),
      db.yearPlan.findMany({ where }),
      db.goal.findMany({ where }),
      db.project.findMany({ where }),
      db.asset.findMany({ where }),
      db.liability.findMany({ where }),
      db.investmentPosition.findMany({ where }),
      db.copyTradingAccount.findMany({ where }),
      db.otherInvestment.findMany({ where }),
      db.business.findMany({ where }),
      db.healthMetric.findMany({ where }),
      db.skill.findMany({ where }),
      db.actionItem.findMany({ where }),
      db.monthlySnapshot.findMany({ where }),
      db.note.findMany({ where }),
    ]);

    const [
      settings,
      householdSettings,
      incomeSources,
      dependents,
      fundAllocations,
      auditEvents,
      accounts,
      transactions,
      categories,
      charges,
      envelopes,
      lifeAreas,
      yearPlans,
      goals,
      projects,
      assets,
      liabilities,
      positions,
      copyTrading,
      otherInvestments,
      businesses,
      healthMetrics,
      skills,
      actions,
      snapshots,
      notes,
    ] = dump;
    const milestones = projects.length
      ? await db.milestone.findMany({
          where: { projectId: { in: projects.map(({ id }) => id) } },
        })
      : [];

    const exportData = {
      app: "Life OS",
      version: 3,
      exportedAt: new Date().toISOString(),
      currency: "XOF",
      sharing: "SHARED_BY_DEFAULT",
      settings,
      householdSettings,
      incomeSources,
      dependents,
      fundAllocations,
      auditEvents,
      accounts,
      transactions,
      categories,
      charges,
      envelopes,
      lifeAreas,
      yearPlans,
      goals,
      projects,
      milestones,
      assets,
      liabilities,
      positions,
      copyTrading,
      otherInvestments,
      businesses,
      healthMetrics,
      skills,
      actions,
      snapshots,
      notes,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="lifeos-export-${new Date()
          .toISOString()
          .slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("[export]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur d'export" },
      { status: accessErrorStatus(error) }
    );
  }
}
