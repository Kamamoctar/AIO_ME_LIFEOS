// Life OS — Import / restauration de sauvegarde JSON
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ApiAccessError,
  accessErrorStatus,
  getLifeOSAccessContext,
  visibleRecordWhere,
} from "@/lib/lifeos/access";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Record<string, unknown>;
    if (payload.app !== "Life OS") {
      return NextResponse.json({ error: "Fichier de sauvegarde Life OS invalide" }, { status: 400 });
    }

    const context = await getLifeOSAccessContext();
    if (!context.isAdmin) {
      throw new ApiAccessError("Import reserve a l'administrateur", 403);
    }
    const user = context.user;
    const visibleWhere = visibleRecordWhere(context);
    const projectsToReplace = await db.project.findMany({
      where: visibleWhere,
      select: { id: true },
    });

    // Nettoyage (ordre : dépendances d'abord)
    await db.$transaction([
      db.auditEvent.deleteMany({ where: { coupleId: context.coupleId } }),
      db.fundAllocation.deleteMany({ where: { coupleId: context.coupleId } }),
      db.incomeSource.deleteMany({ where: { coupleId: context.coupleId } }),
      db.dependent.deleteMany({ where: { coupleId: context.coupleId } }),
      db.transaction.deleteMany({ where: visibleWhere }),
      db.recurringCharge.deleteMany({ where: visibleWhere }),
      db.milestone.deleteMany({
        where: { projectId: { in: projectsToReplace.map(({ id }) => id) } },
      }),
      db.project.deleteMany({ where: visibleWhere }),
      db.goal.deleteMany({ where: visibleWhere }),
      db.envelope.deleteMany({ where: visibleWhere }),
      db.category.deleteMany({ where: visibleWhere }),
      db.asset.deleteMany({ where: visibleWhere }),
      db.liability.deleteMany({ where: visibleWhere }),
      db.investmentPosition.deleteMany({ where: visibleWhere }),
      db.copyTradingAccount.deleteMany({ where: visibleWhere }),
      db.otherInvestment.deleteMany({ where: visibleWhere }),
      db.business.deleteMany({ where: visibleWhere }),
      db.healthMetric.deleteMany({ where: visibleWhere }),
      db.skill.deleteMany({ where: visibleWhere }),
      db.actionItem.deleteMany({ where: visibleWhere }),
      db.monthlySnapshot.deleteMany({
        where: { OR: [{ coupleId: context.coupleId }, visibleWhere] },
      }),
      db.note.deleteMany({ where: visibleWhere }),
      db.yearPlan.deleteMany({ where: visibleWhere }),
      db.lifeArea.deleteMany({ where: visibleWhere }),
      db.account.deleteMany({ where: visibleWhere }),
      db.setting.deleteMany({ where: { userId: user.id } }),
    ]);

    // Réinjection (id conservés pour préserver les relations)
    const s = payload.settings as Record<string, unknown> | null;
    if (s) {
      delete s.id;
      await db.setting.create({ data: { ...(s as any), userId: user.id } });
    }

    const hs = payload.householdSettings as Record<string, unknown> | null;
    if (hs) {
      await db.householdSetting.update({
        where: { coupleId: context.coupleId },
        data: {
          currency: typeof hs.currency === "string" ? hs.currency : "XOF",
          emergencyFundMonths: Number(hs.emergencyFundMonths) || 3,
          safetyMargin: Math.max(0, Number(hs.safetyMargin) || 0),
        },
      });
    }

    const incomeSources =
      (payload.incomeSources as Record<string, unknown>[]) ?? [];
    for (const source of incomeSources) {
      const { id, coupleId, createdById, ...rest } = source as {
        id: string;
        coupleId?: unknown;
        createdById?: unknown;
      } & Record<string, unknown>;
      await db.incomeSource.create({
        data: {
          ...(rest as any),
          id,
          coupleId: context.coupleId,
          createdById: user.id,
        },
      });
    }

    const dependents = (payload.dependents as Record<string, unknown>[]) ?? [];
    for (const dependent of dependents) {
      const { id, coupleId, ...rest } = dependent as {
        id: string;
        coupleId?: unknown;
      } & Record<string, unknown>;
      await db.dependent.create({
        data: { ...(rest as any), id, coupleId: context.coupleId },
      });
    }

    const accounts = (payload.accounts as Record<string, unknown>[]) ?? [];
    for (const a of accounts) {
      const { id, ...rest } = a as { id: string } & Record<string, unknown>;
      await db.account.create({ data: { ...(rest as any), id, userId: user.id } });
    }

    const categories = (payload.categories as Record<string, unknown>[]) ?? [];
    for (const c of categories) {
      const { id, ...rest } = c as { id: string } & Record<string, unknown>;
      await db.category.create({ data: { ...(rest as any), id, userId: user.id } });
    }

    const transactions = (payload.transactions as Record<string, unknown>[]) ?? [];
    for (const t of transactions) {
      const { id, ...rest } = t as { id: string } & Record<string, unknown>;
      await db.transaction.create({ data: { ...(rest as any), id, userId: user.id } });
    }

    const charges = (payload.charges as Record<string, unknown>[]) ?? [];
    for (const c of charges) {
      const { id, ...rest } = c as { id: string } & Record<string, unknown>;
      await db.recurringCharge.create({ data: { ...(rest as any), id, userId: user.id } });
    }

    const envelopes = (payload.envelopes as Record<string, unknown>[]) ?? [];
    for (const e of envelopes) {
      const { id, ...rest } = e as { id: string } & Record<string, unknown>;
      await db.envelope.create({ data: { ...(rest as any), id, userId: user.id } });
    }

    const lifeAreas = (payload.lifeAreas as Record<string, unknown>[]) ?? [];
    for (const l of lifeAreas) {
      const { id, ...rest } = l as { id: string } & Record<string, unknown>;
      await db.lifeArea.create({ data: { ...(rest as any), id, userId: user.id } });
    }

    const yearPlans = (payload.yearPlans as Record<string, unknown>[]) ?? [];
    for (const y of yearPlans) {
      const { id, ...rest } = y as { id: string } & Record<string, unknown>;
      await db.yearPlan.create({ data: { ...(rest as any), id, userId: user.id } });
    }

    const goals = (payload.goals as Record<string, unknown>[]) ?? [];
    for (const g of goals) {
      const { id, ...rest } = g as { id: string } & Record<string, unknown>;
      await db.goal.create({ data: { ...(rest as any), id, userId: user.id } });
    }

    const projects = (payload.projects as Record<string, unknown>[]) ?? [];
    for (const p of projects) {
      const { id, milestones, ...rest } = p as { id: string; milestones?: unknown } & Record<
        string,
        unknown
      >;
      await db.project.create({ data: { ...(rest as any), id, userId: user.id } });
    }

    const milestones = (payload.milestones as Record<string, unknown>[]) ?? [];
    for (const m of milestones) {
      const { id, ...rest } = m as { id: string } & Record<string, unknown>;
      await db.milestone.create({ data: { ...(rest as any), id } });
    }

    const allocations =
      (payload.fundAllocations as Record<string, unknown>[]) ?? [];
    for (const allocation of allocations) {
      const { id, coupleId, createdById, ...rest } = allocation as {
        id: string;
        coupleId?: unknown;
        createdById?: unknown;
      } & Record<string, unknown>;
      await db.fundAllocation.create({
        data: {
          ...(rest as any),
          id,
          coupleId: context.coupleId,
          createdById: user.id,
        },
      });
    }

    const auditEvents = (payload.auditEvents as Record<string, unknown>[]) ?? [];
    for (const event of auditEvents) {
      const { id, coupleId, actorId, ...rest } = event as {
        id: string;
        coupleId?: unknown;
        actorId?: unknown;
      } & Record<string, unknown>;
      await db.auditEvent.create({
        data: {
          ...(rest as any),
          id,
          coupleId: context.coupleId,
          actorId: user.id,
        },
      });
    }

    const simpleEntities: [string, Record<string, unknown>[]][] = [
      ["asset", (payload.assets as Record<string, unknown>[]) ?? []],
      ["liability", (payload.liabilities as Record<string, unknown>[]) ?? []],
      ["investmentPosition", (payload.positions as Record<string, unknown>[]) ?? []],
      ["copyTradingAccount", (payload.copyTrading as Record<string, unknown>[]) ?? []],
      ["otherInvestment", (payload.otherInvestments as Record<string, unknown>[]) ?? []],
      ["business", (payload.businesses as Record<string, unknown>[]) ?? []],
      ["healthMetric", (payload.healthMetrics as Record<string, unknown>[]) ?? []],
      ["skill", (payload.skills as Record<string, unknown>[]) ?? []],
      ["actionItem", (payload.actions as Record<string, unknown>[]) ?? []],
      ["monthlySnapshot", (payload.snapshots as Record<string, unknown>[]) ?? []],
      ["note", (payload.notes as Record<string, unknown>[]) ?? []],
    ];
    for (const [model, rows] of simpleEntities) {
      const prismaModel = (db as any)[model];
      for (const row of rows) {
        const { id, ...rest } = row as { id: string } & Record<string, unknown>;
        await prismaModel.create({
          data: {
            ...rest,
            id,
            userId: user.id,
            ...(model === "monthlySnapshot"
              ? { coupleId: context.coupleId }
              : {}),
          },
        });
      }
    }

    return NextResponse.json({ ok: true, imported: true });
  } catch (e) {
    console.error("[import]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur d'import" },
      { status: accessErrorStatus(e) || 500 }
    );
  }
}
