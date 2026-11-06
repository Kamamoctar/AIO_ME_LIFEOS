// Life OS — Simulations (calculs purs, AUCUNE modification des données réelles)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  ApiAccessError,
  accessErrorStatus,
  featureAccess,
  filterVisibleRecords,
  getLifeOSAccessContext,
  visibleRecordWhere,
} from "@/lib/lifeos/access";
import { canView } from "@/lib/lifeos/permissions";
import {
  analyzeDecision,
  compoundProjection,
  requiredMonthly,
} from "@/lib/lifeos/engine";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      kind: string;
      data?: Record<string, unknown>;
    };
    const { kind, data = {} } = body;
    const context = await getLifeOSAccessContext();
    if (!canView(featureAccess(context, "simulations"))) {
      throw new ApiAccessError("Acces aux simulations non autorise", 403);
    }
    const user = context.user;
    const visibleWhere = visibleRecordWhere(context);

    const n = (k: string, d = 0) => {
      const v = data[k];
      const x = typeof v === "string" ? Number(v.replace(/[\s,]/g, "")) : Number(v);
      return Number.isFinite(x) ? x : d;
    };

    switch (kind) {
      // -------------------------------------------------------------------
      case "decision": {
        // « Puis-je me le permettre ? »
        const [settings, householdSettings, incomeSources, fundAllocations, accounts, transactions, categories, charges, goals, projects, positions, assets, liabilities, copy, other, businesses, snapshots] =
          await Promise.all([
            db.setting.findUnique({ where: { userId: user.id } }),
            db.householdSetting.findUnique({ where: { coupleId: context.coupleId } }),
            db.incomeSource.findMany({ where: { coupleId: context.coupleId } }),
            db.fundAllocation.findMany({ where: { coupleId: context.coupleId } }),
            db.account.findMany({ where: visibleWhere }),
            db.transaction.findMany({ where: visibleWhere }),
            db.category.findMany({ where: visibleWhere }),
            db.recurringCharge.findMany({ where: visibleWhere }),
            db.goal.findMany({ where: visibleWhere }),
            db.project.findMany({ where: visibleWhere }),
            db.investmentPosition.findMany({ where: visibleWhere }),
            db.asset.findMany({ where: visibleWhere }),
            db.liability.findMany({ where: visibleWhere }),
            db.copyTradingAccount.findMany({ where: visibleWhere }),
            db.otherInvestment.findMany({ where: visibleWhere }),
            db.business.findMany({ where: visibleWhere }),
            db.monthlySnapshot.findMany({ where: visibleWhere }),
          ]);
        const state = {
          user: { id: user.id, email: user.email, name: user.name },
          settings: {
            ...settings!,
            emergencyFundMonths:
              householdSettings?.emergencyFundMonths ?? settings!.emergencyFundMonths,
            safetyMargin: householdSettings?.safetyMargin ?? settings!.safetyMargin,
          },
          incomeSources,
          dependents: [],
          fundAllocations,
          accounts: filterVisibleRecords(context, "accounts", accounts),
          transactions: filterVisibleRecords(context, "finances", transactions),
          categories: filterVisibleRecords(context, "finances", categories),
          charges: filterVisibleRecords(context, "finances", charges),
          envelopes: [],
          lifeAreas: [],
          yearPlans: [],
          goals: filterVisibleRecords(context, "goals", goals, "GOAL"),
          projects: filterVisibleRecords(context, "projects", projects, "PROJECT"),
          assets: filterVisibleRecords(context, "patrimoine", assets),
          liabilities: filterVisibleRecords(context, "patrimoine", liabilities),
          positions: filterVisibleRecords(context, "investments", positions),
          copyTrading: filterVisibleRecords(context, "investments", copy),
          otherInvestments: filterVisibleRecords(context, "investments", other),
          businesses: filterVisibleRecords(context, "investments", businesses, "BUSINESS"),
          healthMetrics: [],
          skills: [],
          actions: [],
          snapshots: filterVisibleRecords(context, "finances", snapshots),
          notes: [],
          today: new Date().toISOString(),
        };
        const analysis = analyzeDecision(
          state as never,
          {
            amount: n("amount"),
            type: data.type === "INVESTISSEMENT" ? "INVESTISSEMENT" : "ACHAT",
            date: String(data.date ?? new Date().toISOString()),
            months: Math.max(1, n("months", 12)),
          },
          new Date()
        );
        return NextResponse.json({ analysis });
      }

      // -------------------------------------------------------------------
      case "compound": {
        const result = compoundProjection(
          n("initial"),
          n("monthly"),
          n("annualRate"),
          Math.max(1, n("years", 5)),
          n("feesRate")
        );
        return NextResponse.json({ result });
      }

      // -------------------------------------------------------------------
      case "requiredMonthly": {
        const result = requiredMonthly(
          n("target"),
          n("initial"),
          n("annualRate"),
          Math.max(0.5, n("years", 5))
        );
        return NextResponse.json({ result });
      }

      // -------------------------------------------------------------------
      case "brvmCalc": {
        // Calculateur de rendement BRVM
        const quantity = n("quantity");
        const buyPrice = n("buyPrice");
        const sellPrice = n("sellPrice", n("currentPrice"));
        const buyFees = n("buyFees");
        const sellFees = n("sellFees");
        const dividends = n("dividends");
        const yearsHeld = Math.max(0, n("years", 1));
        const cost = quantity * buyPrice + buyFees;
        const proceeds = quantity * sellPrice - sellFees;
        const grossGain = proceeds - quantity * buyPrice;
        const netGain = proceeds - cost + dividends;
        return NextResponse.json({
          result: {
            cost: Math.round(cost),
            proceeds: Math.round(proceeds),
            grossGain: Math.round(grossGain),
            fees: Math.round(buyFees + sellFees),
            netGain: Math.round(netGain),
            capitalGain: Math.round(proceeds - cost),
            priceReturn: cost > 0 ? (proceeds - cost) / cost : 0,
            dividendReturn: cost > 0 ? dividends / cost : 0,
            totalReturn: cost > 0 ? netGain / cost : 0,
            annualized: cost > 0 && yearsHeld > 0 ? Math.pow(1 + netGain / cost, 1 / yearsHeld) - 1 : 0,
            dividends: Math.round(dividends),
          },
        });
      }

      // -------------------------------------------------------------------
      case "incomeChange": {
        // Simulateur de changement de revenu
        const [settings, accounts, transactions, categories, charges] = await Promise.all([
          db.setting.findUnique({ where: { userId: user.id } }),
          db.account.findMany({ where: visibleWhere }),
          db.transaction.findMany({ where: visibleWhere }),
          db.category.findMany({ where: visibleWhere }),
          db.recurringCharge.findMany({ where: visibleWhere }),
        ]);
        const newSalary = n("newSalary");
        const state = {
          user: { id: user.id, email: user.email, name: user.name },
          settings: { ...settings!, salaryMonthly: newSalary },
          accounts: filterVisibleRecords(context, "accounts", accounts),
          transactions: filterVisibleRecords(context, "finances", transactions),
          categories: filterVisibleRecords(context, "finances", categories),
          charges: filterVisibleRecords(context, "finances", charges),
          envelopes: [],
          lifeAreas: [],
          yearPlans: [],
          goals: [],
          projects: [],
          assets: [],
          liabilities: [],
          positions: [],
          copyTrading: [],
          otherInvestments: [],
          businesses: [],
          healthMetrics: [],
          skills: [],
          actions: [],
          snapshots: [],
          notes: [],
          today: new Date().toISOString(),
        };
        const { computeCapacity } = await import("@/lib/lifeos/engine");
        const cap = computeCapacity(state as never, new Date());
        return NextResponse.json({
          result: {
            newSalary,
            oldSalary: settings?.salaryMonthly ?? 0,
            newSavingsCapacity: cap.savingsCapacity,
            newInvestmentCapacity: cap.investmentCapacity,
            annualDelta: (newSalary - (settings?.salaryMonthly ?? 0)) * 12,
          },
        });
      }

      default:
        return NextResponse.json({ error: `Simulation inconnue : ${kind}` }, { status: 400 });
    }
  } catch (e) {
    console.error("[simulate]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de simulation" },
      { status: accessErrorStatus(e) }
    );
  }
}
