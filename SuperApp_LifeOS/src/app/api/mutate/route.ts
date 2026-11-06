// Life OS — Mutations génériques (CRUD multi-entités)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  bool,
  dateOrNull,
  floatOrNull,
  intOrNull,
  num,
  str,
  withUser,
} from "@/lib/lifeos/api-helpers";
import {
  ApiAccessError,
  assertFeatureEdit,
  resolveWritableOwnerId,
  visibleRecordWhere,
} from "@/lib/lifeos/access";
import { normalizeVisibility } from "@/lib/lifeos/permissions";

interface Body {
  entity: string;
  action: "create" | "update" | "delete" | "custom";
  id?: string;
  data?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const { entity, action, id } = body;
  const data = (body.data ?? {}) as Record<string, unknown>;

  const auditedEntities = new Set([
    "account",
    "transaction",
    "category",
    "charge",
    "provisionCharge",
    "envelope",
    "settings",
    "incomeSource",
    "dependent",
    "fundAllocation",
    "closeMonth",
  ]);

  return withUser(async (actorUserId, context) => {
    assertFeatureEdit(context, entity);
    let userId = actorUserId;

    if (id && entity !== "milestone" && action !== "create") {
      userId = await resolveWritableOwnerId(context, entity, id);
    }

    switch (entity) {
      // -------------------------------------------------------------------
      case "account": {
        if (action === "create") {
          return db.account.create({
            data: {
              userId,
              name: str(data.name) ?? "Nouveau compte",
              type: str(data.type) ?? "BANK",
              currency: "XOF",
              initialBalance: intOrNull(data.initialBalance) ?? 0,
              institution: str(data.institution),
              archived: bool(data.archived),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.name !== undefined) patch.name = str(data.name);
          if (data.type !== undefined) patch.type = str(data.type);
          if (data.initialBalance !== undefined)
            patch.initialBalance = intOrNull(data.initialBalance) ?? 0;
          if (data.institution !== undefined) patch.institution = str(data.institution);
          if (data.archived !== undefined) patch.archived = bool(data.archived);
          return db.account.update({ where: { id }, data: patch });
        }
        if (action === "delete") {
          const txCount = await db.transaction.count({ where: { accountId: id } });
          if (txCount > 0)
            return db.account.update({ where: { id }, data: { archived: true } });
          return db.account.delete({ where: { id } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "transaction": {
        if (action === "create") {
          const type = str(data.type) ?? "EXPENSE";
          const accountId = str(data.accountId);
          if (!accountId) throw new Error("Compte requis");
          const account = await db.account.findFirst({
            where: { id: accountId, ...visibleRecordWhere(context) },
          });
          if (!account || account.archived) {
            throw new ApiAccessError("Compte du foyer introuvable", 404);
          }
          const amount = Math.abs(num(data.amount));
          if (amount <= 0) throw new Error("Montant invalide");
          const categoryId = str(data.categoryId);
          let categoryName: string | null = str(data.category);
          if (categoryId) {
            const cat = await db.category.findFirst({
              where: { id: categoryId, ...visibleRecordWhere(context) },
            });
            if (!cat) throw new ApiAccessError("Catégorie introuvable", 404);
            categoryName = cat.name;
          }
          const toAccountId =
            type === "TRANSFER" || type === "INVESTMENT" || type === "WITHDRAWAL" || type === "DEPOSIT"
              ? str(data.toAccountId)
              : null;
          if (toAccountId) {
            const destination = await db.account.findFirst({
              where: { id: toAccountId, ...visibleRecordWhere(context) },
            });
            if (!destination || destination.archived) {
              throw new ApiAccessError("Compte destinataire introuvable", 404);
            }
          }
          const projectId = str(data.projectId);
          const goalId = str(data.goalId);
          if (projectId && goalId) {
            throw new ApiAccessError(
              "Une dépense ne peut être liée qu'à une seule cible",
              400
            );
          }
          if (projectId) {
            await resolveWritableOwnerId(context, "project", projectId);
          }
          if (goalId) {
            await resolveWritableOwnerId(context, "goal", goalId);
          }
          return db.transaction.create({
            data: {
              userId,
              accountId,
              toAccountId,
              type,
              amount,
              fee: intOrNull(data.fee) ?? 0,
              date: dateOrNull(data.date) ?? new Date(),
              categoryId,
              category: categoryName,
              subCategory: str(data.subCategory),
              description: str(data.description),
              projectId,
              goalId,
              positionId: str(data.positionId),
              recurring: bool(data.recurring),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.amount !== undefined) patch.amount = Math.abs(num(data.amount));
          if (data.fee !== undefined) patch.fee = intOrNull(data.fee) ?? 0;
          if (data.date !== undefined) patch.date = dateOrNull(data.date) ?? new Date();
          if (data.type !== undefined) patch.type = str(data.type);
          if (data.accountId !== undefined) patch.accountId = str(data.accountId);
          if (data.toAccountId !== undefined) patch.toAccountId = str(data.toAccountId);
          if (data.categoryId !== undefined) patch.categoryId = str(data.categoryId);
          if (data.category !== undefined) patch.category = str(data.category);
          if (data.subCategory !== undefined) patch.subCategory = str(data.subCategory);
          if (data.description !== undefined) patch.description = str(data.description);
          if (data.projectId !== undefined) patch.projectId = str(data.projectId);
          if (data.goalId !== undefined) patch.goalId = str(data.goalId);
          if (data.recurring !== undefined) patch.recurring = bool(data.recurring);
          return db.transaction.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.transaction.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "category": {
        if (action === "create") {
          return db.category.create({
            data: {
              userId,
              name: str(data.name) ?? "Nouvelle catégorie",
              kind: str(data.kind) ?? "EXPENSE",
              essential: bool(data.essential),
              budgetMonthly: intOrNull(data.budgetMonthly),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.name !== undefined) patch.name = str(data.name);
          if (data.kind !== undefined) patch.kind = str(data.kind);
          if (data.essential !== undefined) patch.essential = bool(data.essential);
          if (data.budgetMonthly !== undefined) patch.budgetMonthly = intOrNull(data.budgetMonthly);
          return db.category.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.category.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "charge": {
        if (action === "create") {
          return db.recurringCharge.create({
            data: {
              userId,
              label: str(data.label) ?? "Nouvelle charge",
              amount: intOrNull(data.amount) ?? 0,
              frequency: str(data.frequency) ?? "MONTHLY",
              nextDueDate: dateOrNull(data.nextDueDate),
              categoryId: str(data.categoryId),
              accountId: str(data.accountId),
              active: bool(data.active, true),
              provision: bool(data.provision),
              provisioned: intOrNull(data.provisioned) ?? 0,
              notes: str(data.notes),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.label !== undefined) patch.label = str(data.label);
          if (data.amount !== undefined) patch.amount = intOrNull(data.amount) ?? 0;
          if (data.frequency !== undefined) patch.frequency = str(data.frequency);
          if (data.nextDueDate !== undefined) patch.nextDueDate = dateOrNull(data.nextDueDate);
          if (data.categoryId !== undefined) patch.categoryId = str(data.categoryId);
          if (data.accountId !== undefined) patch.accountId = str(data.accountId);
          if (data.active !== undefined) patch.active = bool(data.active, true);
          if (data.provision !== undefined) patch.provision = bool(data.provision);
          if (data.provisioned !== undefined) patch.provisioned = intOrNull(data.provisioned) ?? 0;
          if (data.notes !== undefined) patch.notes = str(data.notes);
          return db.recurringCharge.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.recurringCharge.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "envelope": {
        if (action === "create") {
          const categoryId = str(data.categoryId);
          if (categoryId) {
            const category = await db.category.findFirst({
              where: { id: categoryId, ...visibleRecordWhere(context) },
            });
            if (!category || !["EXPENSE", "DONATION"].includes(category.kind)) {
              throw new ApiAccessError("Catégorie de dépense introuvable", 404);
            }
          }
          const count = await db.envelope.count({ where: { userId } });
          return db.envelope.create({
            data: {
              userId,
              name: str(data.name) ?? "Nouvelle enveloppe",
              group: str(data.group) ?? "OBLIGATOIRE",
              budget: intOrNull(data.budget) ?? 0,
              reserved: intOrNull(data.reserved) ?? 0,
              order: count,
              categoryId,
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.name !== undefined) patch.name = str(data.name);
          if (data.group !== undefined) patch.group = str(data.group);
          if (data.budget !== undefined) patch.budget = intOrNull(data.budget) ?? 0;
          if (data.reserved !== undefined) patch.reserved = intOrNull(data.reserved) ?? 0;
          if (data.order !== undefined) patch.order = intOrNull(data.order) ?? 0;
          if (data.categoryId !== undefined) {
            const categoryId = str(data.categoryId);
            if (categoryId) {
              const category = await db.category.findFirst({
                where: { id: categoryId, ...visibleRecordWhere(context) },
              });
              if (!category || !["EXPENSE", "DONATION"].includes(category.kind)) {
                throw new ApiAccessError("Catégorie de dépense introuvable", 404);
              }
            }
            patch.categoryId = categoryId;
          }
          return db.envelope.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.envelope.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "goal": {
        if (action === "create") {
          return db.goal.create({
            data: {
              userId,
              title: str(data.title) ?? "Nouvel objectif",
              description: str(data.description),
              area: str(data.area),
              category: str(data.category),
              year: intOrNull(data.year),
              priority: str(data.priority) ?? "MOYENNE",
              status: str(data.status) ?? "A_PLANIFIER",
              startDate: dateOrNull(data.startDate),
              targetDate: dateOrNull(data.targetDate),
              targetValue: floatOrNull(data.targetValue),
              currentValue: floatOrNull(data.currentValue) ?? 0,
              unit: str(data.unit),
              budget: intOrNull(data.budget),
              funded: intOrNull(data.funded) ?? 0,
              committed: intOrNull(data.committed) ?? 0,
              notes: str(data.notes),
              isSuggested: bool(data.isSuggested),
              suggestedState: str(data.suggestedState),
              visibility: normalizeVisibility(data.visibility),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          for (const f of ["title", "description", "area", "category", "priority", "status", "unit", "notes", "suggestedState"]) {
            if (data[f] !== undefined) patch[f] = str(data[f]);
          }
          if (data.year !== undefined) patch.year = intOrNull(data.year);
          if (data.startDate !== undefined) patch.startDate = dateOrNull(data.startDate);
          if (data.targetDate !== undefined) patch.targetDate = dateOrNull(data.targetDate);
          if (data.targetValue !== undefined) patch.targetValue = floatOrNull(data.targetValue);
          if (data.currentValue !== undefined) patch.currentValue = floatOrNull(data.currentValue) ?? 0;
          if (data.budget !== undefined) patch.budget = intOrNull(data.budget);
          if (data.funded !== undefined) patch.funded = intOrNull(data.funded) ?? 0;
          if (data.committed !== undefined) patch.committed = intOrNull(data.committed) ?? 0;
          if (data.visibility !== undefined)
            patch.visibility = normalizeVisibility(data.visibility);
          return db.goal.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.goal.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "project": {
        if (action === "create") {
          return db.project.create({
            data: {
              userId,
              name: str(data.name) ?? "Nouveau projet",
              description: str(data.description),
              budget: intOrNull(data.budget),
              targetDate: dateOrNull(data.targetDate),
              priority: str(data.priority) ?? "MOYENNE",
              status: str(data.status) ?? "PLANIFIE",
              physicalProgress: intOrNull(data.physicalProgress) ?? 0,
              icon: str(data.icon),
              notes: str(data.notes),
              visibility: normalizeVisibility(data.visibility),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          for (const f of ["name", "description", "priority", "status", "icon", "notes"]) {
            if (data[f] !== undefined) patch[f] = str(data[f]);
          }
          if (data.budget !== undefined) patch.budget = intOrNull(data.budget);
          if (data.targetDate !== undefined) patch.targetDate = dateOrNull(data.targetDate);
          if (data.physicalProgress !== undefined)
            patch.physicalProgress = Math.min(100, Math.max(0, intOrNull(data.physicalProgress) ?? 0));
          if (data.archived !== undefined) patch.archived = bool(data.archived);
          if (data.visibility !== undefined)
            patch.visibility = normalizeVisibility(data.visibility);
          return db.project.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          await db.milestone.deleteMany({ where: { projectId: id } });
          await db.transaction.updateMany({
            where: { projectId: id, userId },
            data: { projectId: null },
          });
          return db.project.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "milestone": {
        if (action === "create") {
          const projectId = str(data.projectId);
          if (!projectId) throw new Error("Projet requis");
          await resolveWritableOwnerId(context, "project", projectId);
          const count = await db.milestone.count({ where: { projectId } });
          return db.milestone.create({
            data: {
              projectId,
              title: str(data.title) ?? "Nouveau jalon",
              targetDate: dateOrNull(data.targetDate),
              amount: intOrNull(data.amount),
              order: intOrNull(data.order) ?? count,
            },
          });
        }
        if (action === "update") {
          const milestone = await db.milestone.findUnique({ where: { id } });
          if (!milestone) throw new Error("Jalon introuvable");
          await resolveWritableOwnerId(context, "project", milestone.projectId);
          const patch: Record<string, unknown> = {};
          if (data.title !== undefined) patch.title = str(data.title);
          if (data.targetDate !== undefined) patch.targetDate = dateOrNull(data.targetDate);
          if (data.amount !== undefined) patch.amount = intOrNull(data.amount);
          if (data.done !== undefined) patch.done = bool(data.done);
          if (data.order !== undefined) patch.order = intOrNull(data.order) ?? 0;
          return db.milestone.updateMany({ where: { id }, data: patch });
        }
        if (action === "delete") {
          const milestone = await db.milestone.findUnique({ where: { id } });
          if (!milestone) throw new Error("Jalon introuvable");
          await resolveWritableOwnerId(context, "project", milestone.projectId);
          return db.milestone.deleteMany({ where: { id } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "yearPlan": {
        if (action === "create" || action === "update") {
          const year = intOrNull(data.year);
          if (!year) throw new Error("Année requise");
          const values = {
            vision: str(data.vision),
            targetIncome: intOrNull(data.targetIncome),
            targetNetWorth: intOrNull(data.targetNetWorth),
            targetSavings: intOrNull(data.targetSavings),
            targetInvestment: intOrNull(data.targetInvestment),
            majorProjects: str(data.majorProjects),
            skillsFocus: str(data.skillsFocus),
            healthFocus: str(data.healthFocus),
            familyFocus: str(data.familyFocus),
            realEstateFocus: str(data.realEstateFocus),
            notes: str(data.notes),
          };
          const existing = await db.yearPlan.findFirst({ where: { userId, year } });
          if (existing) {
            const patch: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(values)) {
              if (data[k] !== undefined) patch[k] = v;
            }
            return db.yearPlan.update({ where: { id: existing.id }, data: patch });
          }
          return db.yearPlan.create({ data: { userId, year, ...values } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "asset": {
        if (action === "create") {
          return db.asset.create({
            data: {
              userId,
              name: str(data.name) ?? "Nouvel actif",
              type: str(data.type) ?? "OTHER",
              value: intOrNull(data.value) ?? 0,
              notes: str(data.notes),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.name !== undefined) patch.name = str(data.name);
          if (data.type !== undefined) patch.type = str(data.type);
          if (data.value !== undefined) patch.value = intOrNull(data.value) ?? 0;
          if (data.notes !== undefined) patch.notes = str(data.notes);
          return db.asset.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.asset.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "liability": {
        if (action === "create") {
          return db.liability.create({
            data: {
              userId,
              name: str(data.name) ?? "Nouvelle dette",
              amount: intOrNull(data.amount) ?? 0,
              type: str(data.type) ?? "DEBT",
              notes: str(data.notes),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.name !== undefined) patch.name = str(data.name);
          if (data.amount !== undefined) patch.amount = intOrNull(data.amount) ?? 0;
          if (data.type !== undefined) patch.type = str(data.type);
          if (data.notes !== undefined) patch.notes = str(data.notes);
          return db.liability.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.liability.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "position": {
        if (action === "create") {
          return db.investmentPosition.create({
            data: {
              userId,
              company: str(data.company) ?? "Société",
              ticker: str(data.ticker),
              quantity: floatOrNull(data.quantity) ?? 0,
              avgBuyPrice: floatOrNull(data.avgBuyPrice) ?? 0,
              feesPaid: intOrNull(data.feesPaid) ?? 0,
              currentPrice: floatOrNull(data.currentPrice) ?? 0,
              dividends: intOrNull(data.dividends) ?? 0,
              buyDate: dateOrNull(data.buyDate),
              active: bool(data.active, true),
              notes: str(data.notes),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.company !== undefined) patch.company = str(data.company);
          if (data.ticker !== undefined) patch.ticker = str(data.ticker);
          if (data.quantity !== undefined) patch.quantity = floatOrNull(data.quantity) ?? 0;
          if (data.avgBuyPrice !== undefined) patch.avgBuyPrice = floatOrNull(data.avgBuyPrice) ?? 0;
          if (data.feesPaid !== undefined) patch.feesPaid = intOrNull(data.feesPaid) ?? 0;
          if (data.currentPrice !== undefined) patch.currentPrice = floatOrNull(data.currentPrice) ?? 0;
          if (data.dividends !== undefined) patch.dividends = intOrNull(data.dividends) ?? 0;
          if (data.active !== undefined) patch.active = bool(data.active, true);
          if (data.notes !== undefined) patch.notes = str(data.notes);
          return db.investmentPosition.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.investmentPosition.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "copyTrading": {
        if (action === "create") {
          return db.copyTradingAccount.create({
            data: {
              userId,
              name: str(data.name) ?? "Compte copy trading",
              platform: str(data.platform),
              capitalDeposited: intOrNull(data.capitalDeposited) ?? 0,
              withdrawn: intOrNull(data.withdrawn) ?? 0,
              currentValue: intOrNull(data.currentValue) ?? 0,
              fees: intOrNull(data.fees) ?? 0,
              notes: str(data.notes),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.name !== undefined) patch.name = str(data.name);
          if (data.platform !== undefined) patch.platform = str(data.platform);
          for (const f of ["capitalDeposited", "withdrawn", "currentValue", "fees"]) {
            if (data[f] !== undefined) patch[f] = intOrNull(data[f]) ?? 0;
          }
          if (data.notes !== undefined) patch.notes = str(data.notes);
          return db.copyTradingAccount.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.copyTradingAccount.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "otherInvestment": {
        if (action === "create") {
          return db.otherInvestment.create({
            data: {
              userId,
              name: str(data.name) ?? "Investissement",
              type: str(data.type) ?? "OTHER",
              initialCapital: intOrNull(data.initialCapital) ?? 0,
              contributions: intOrNull(data.contributions) ?? 0,
              withdrawals: intOrNull(data.withdrawals) ?? 0,
              income: intOrNull(data.income) ?? 0,
              expenses: intOrNull(data.expenses) ?? 0,
              currentValue: intOrNull(data.currentValue) ?? 0,
              risk: str(data.risk) ?? "MOYEN",
              notes: str(data.notes),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.name !== undefined) patch.name = str(data.name);
          if (data.type !== undefined) patch.type = str(data.type);
          if (data.risk !== undefined) patch.risk = str(data.risk);
          if (data.notes !== undefined) patch.notes = str(data.notes);
          for (const f of ["initialCapital", "contributions", "withdrawals", "income", "expenses", "currentValue"]) {
            if (data[f] !== undefined) patch[f] = intOrNull(data[f]) ?? 0;
          }
          return db.otherInvestment.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.otherInvestment.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "business": {
        if (action === "create") {
          return db.business.create({
            data: {
              userId,
              name: str(data.name) ?? "Activité",
              capitalInvested: intOrNull(data.capitalInvested) ?? 0,
              revenue: intOrNull(data.revenue) ?? 0,
              charges: intOrNull(data.charges) ?? 0,
              launchDate: dateOrNull(data.launchDate),
              status: str(data.status) ?? "PLANIFIE",
              notes: str(data.notes),
              visibility: normalizeVisibility(data.visibility),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.name !== undefined) patch.name = str(data.name);
          if (data.status !== undefined) patch.status = str(data.status);
          if (data.notes !== undefined) patch.notes = str(data.notes);
          if (data.launchDate !== undefined) patch.launchDate = dateOrNull(data.launchDate);
          for (const f of ["capitalInvested", "revenue", "charges"]) {
            if (data[f] !== undefined) patch[f] = intOrNull(data[f]) ?? 0;
          }
          if (data.visibility !== undefined)
            patch.visibility = normalizeVisibility(data.visibility);
          return db.business.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.business.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "healthMetric": {
        if (action === "create") {
          return db.healthMetric.create({
            data: {
              userId,
              date: dateOrNull(data.date) ?? new Date(),
              weight: floatOrNull(data.weight),
              sportDone: bool(data.sportDone),
              sportMinutes: intOrNull(data.sportMinutes),
              sleepHours: floatOrNull(data.sleepHours),
              notes: str(data.notes),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.date !== undefined) patch.date = dateOrNull(data.date) ?? new Date();
          if (data.weight !== undefined) patch.weight = floatOrNull(data.weight);
          if (data.sportDone !== undefined) patch.sportDone = bool(data.sportDone);
          if (data.sportMinutes !== undefined) patch.sportMinutes = intOrNull(data.sportMinutes);
          if (data.sleepHours !== undefined) patch.sleepHours = floatOrNull(data.sleepHours);
          if (data.notes !== undefined) patch.notes = str(data.notes);
          return db.healthMetric.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.healthMetric.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "skill": {
        if (action === "create") {
          return db.skill.create({
            data: {
              userId,
              name: str(data.name) ?? "Compétence",
              category: str(data.category),
              level: Math.min(100, Math.max(0, intOrNull(data.level) ?? 0)),
              targetLevel: Math.min(100, Math.max(0, intOrNull(data.targetLevel) ?? 100)),
              targetDate: dateOrNull(data.targetDate),
              notes: str(data.notes),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.name !== undefined) patch.name = str(data.name);
          if (data.category !== undefined) patch.category = str(data.category);
          if (data.level !== undefined) patch.level = Math.min(100, Math.max(0, intOrNull(data.level) ?? 0));
          if (data.targetLevel !== undefined) patch.targetLevel = Math.min(100, Math.max(0, intOrNull(data.targetLevel) ?? 100));
          if (data.targetDate !== undefined) patch.targetDate = dateOrNull(data.targetDate);
          if (data.notes !== undefined) patch.notes = str(data.notes);
          return db.skill.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.skill.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "action": {
        if (action === "create") {
          return db.actionItem.create({
            data: {
              userId,
              title: str(data.title) ?? "Action",
              dueDate: dateOrNull(data.dueDate),
              goalId: str(data.goalId),
              projectId: str(data.projectId),
              priority: str(data.priority) ?? "MOYENNE",
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.title !== undefined) patch.title = str(data.title);
          if (data.done !== undefined) patch.done = bool(data.done);
          if (data.dueDate !== undefined) patch.dueDate = dateOrNull(data.dueDate);
          if (data.priority !== undefined) patch.priority = str(data.priority);
          return db.actionItem.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.actionItem.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "note": {
        if (action === "create") {
          return db.note.create({
            data: {
              userId,
              scope: str(data.scope) ?? "GENERAL",
              title: str(data.title) ?? "Note",
              content: str(data.content),
            },
          });
        }
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.title !== undefined) patch.title = str(data.title);
          if (data.content !== undefined) patch.content = str(data.content);
          if (data.resolved !== undefined) patch.resolved = bool(data.resolved);
          return db.note.updateMany({ where: { id, userId }, data: patch });
        }
        if (action === "delete") {
          return db.note.deleteMany({ where: { id, userId } });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "settings": {
        if (action === "update") {
          const personalPatch: Record<string, unknown> = {};
          const householdPatch: Record<string, unknown> = {};
          if (data.emergencyFundMonths !== undefined)
            householdPatch.emergencyFundMonths = Math.max(
              1,
              intOrNull(data.emergencyFundMonths) ?? 3
            );
          if (data.safetyMargin !== undefined)
            householdPatch.safetyMargin = Math.max(
              0,
              intOrNull(data.safetyMargin) ?? 0
            );
          if (data.mode !== undefined)
            personalPatch.mode = str(data.mode) === "analyse" ? "analyse" : "simple";
          if (data.defaultAccountId !== undefined)
            personalPatch.defaultAccountId = str(data.defaultAccountId);

          return db.$transaction(async (tx) => {
            if (Object.keys(householdPatch).length) {
              await tx.householdSetting.update({
                where: { coupleId: context.coupleId },
                data: householdPatch,
              });
            }
            if (data.salaryMonthly !== undefined) {
              const amount = Math.max(0, intOrNull(data.salaryMonthly) ?? 0);
              const existing = await tx.incomeSource.findFirst({
                where: {
                  coupleId: context.coupleId,
                  kind: "SALARY",
                  createdById: actorUserId,
                },
                orderBy: { createdAt: "asc" },
              });
              if (existing) {
                await tx.incomeSource.update({
                  where: { id: existing.id },
                  data: { monthlyAmount: amount, active: amount > 0 },
                });
              } else if (amount > 0) {
                await tx.incomeSource.create({
                  data: {
                    coupleId: context.coupleId,
                    createdById: actorUserId,
                    label: "Salaire principal",
                    kind: "SALARY",
                    monthlyAmount: amount,
                  },
                });
              }
            }
            if (Object.keys(personalPatch).length) {
              await tx.setting.update({
                where: { userId: actorUserId },
                data: personalPatch,
              });
            }
            return tx.householdSetting.findUnique({
              where: { coupleId: context.coupleId },
            });
          });
        }
        break;
      }

      // -------------------------------------------------------------------
      case "incomeSource": {
        if (action === "create") {
          const monthlyAmount = Math.max(0, intOrNull(data.monthlyAmount) ?? 0);
          return db.incomeSource.create({
            data: {
              coupleId: context.coupleId,
              createdById: actorUserId,
              label: str(data.label) ?? "Revenu du foyer",
              kind: ["SALARY", "BUSINESS", "OTHER"].includes(str(data.kind) ?? "")
                ? (str(data.kind) as string)
                : "OTHER",
              monthlyAmount,
              active: bool(data.active, true),
              notes: str(data.notes),
            },
          });
        }
        const source = id
          ? await db.incomeSource.findFirst({
              where: { id, coupleId: context.coupleId },
            })
          : null;
        if (!source) throw new ApiAccessError("Source de revenu introuvable", 404);
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.label !== undefined) patch.label = str(data.label);
          if (data.kind !== undefined) patch.kind = str(data.kind);
          if (data.monthlyAmount !== undefined)
            patch.monthlyAmount = Math.max(0, intOrNull(data.monthlyAmount) ?? 0);
          if (data.active !== undefined) patch.active = bool(data.active, true);
          if (data.notes !== undefined) patch.notes = str(data.notes);
          return db.incomeSource.update({ where: { id: source.id }, data: patch });
        }
        if (action === "delete") {
          return db.incomeSource.delete({ where: { id: source.id } });
        }
        break;
      }

      case "dependent": {
        if (action === "create") {
          return db.dependent.create({
            data: {
              coupleId: context.coupleId,
              name: str(data.name) ?? "Personne a charge",
              relationship: str(data.relationship),
              birthDate: dateOrNull(data.birthDate),
              active: bool(data.active, true),
              notes: str(data.notes),
            },
          });
        }
        const dependent = id
          ? await db.dependent.findFirst({
              where: { id, coupleId: context.coupleId },
            })
          : null;
        if (!dependent) throw new ApiAccessError("Personne a charge introuvable", 404);
        if (action === "update") {
          const patch: Record<string, unknown> = {};
          if (data.name !== undefined) patch.name = str(data.name);
          if (data.relationship !== undefined)
            patch.relationship = str(data.relationship);
          if (data.birthDate !== undefined) patch.birthDate = dateOrNull(data.birthDate);
          if (data.active !== undefined) patch.active = bool(data.active, true);
          if (data.notes !== undefined) patch.notes = str(data.notes);
          return db.dependent.update({ where: { id: dependent.id }, data: patch });
        }
        if (action === "delete") {
          return db.dependent.delete({ where: { id: dependent.id } });
        }
        break;
      }

      case "fundAllocation": {
        if (action === "create") {
          const accountId = str(data.accountId);
          const projectId = str(data.projectId);
          const goalId = str(data.goalId);
          const amount = Math.max(0, intOrNull(data.amount) ?? 0);
          if (
            !accountId ||
            amount <= 0 ||
            (!projectId && !goalId) ||
            Boolean(projectId && goalId)
          ) {
            throw new ApiAccessError("Compte, cible et montant positif requis", 400);
          }
          if (projectId) {
            await resolveWritableOwnerId(context, "project", projectId);
            const project = await db.project.findUnique({ where: { id: projectId } });
            if (project?.budget) {
              const alreadyReserved = await db.fundAllocation.aggregate({
                where: { projectId, status: "ACTIVE" },
                _sum: { amount: true },
              });
              const remaining = Math.max(
                0,
                project.budget - (alreadyReserved._sum.amount ?? 0)
              );
              if (amount > remaining) {
                throw new ApiAccessError(
                  `Le projet ne requiert plus que ${remaining} FCFA`,
                  409
                );
              }
            }
          }
          if (goalId) {
            await resolveWritableOwnerId(context, "goal", goalId);
            const goal = await db.goal.findUnique({ where: { id: goalId } });
            if (goal?.budget) {
              const alreadyReserved = await db.fundAllocation.aggregate({
                where: { goalId, status: "ACTIVE" },
                _sum: { amount: true },
              });
              const existingFunding =
                alreadyReserved._sum.amount === null
                  ? goal.funded
                  : alreadyReserved._sum.amount;
              const remaining = Math.max(0, goal.budget - existingFunding);
              if (amount > remaining) {
                throw new ApiAccessError(
                  `L'objectif ne requiert plus que ${remaining} FCFA`,
                  409
                );
              }
            }
          }
          const account = await db.account.findFirst({
            where: {
              id: accountId,
              userId: { in: context.memberUserIds },
              OR: [{ userId: actorUserId }, { visibility: "SHARED" }],
            },
          });
          if (!account || account.archived) {
            throw new ApiAccessError("Compte du foyer introuvable", 404);
          }
          const [accounts, transactions, activeAllocations] = await Promise.all([
            db.account.findMany({
              where: { userId: { in: context.memberUserIds } },
            }),
            db.transaction.findMany({
              where: { userId: { in: context.memberUserIds } },
            }),
            db.fundAllocation.findMany({
              where: { coupleId: context.coupleId, accountId, status: "ACTIVE" },
            }),
          ]);
          const { computeAvailableCash } = await import("@/lib/lifeos/engine");
          const available =
            computeAvailableCash({
              accounts,
              transactions,
              fundAllocations: activeAllocations,
            } as never).accounts.find((line) => line.accountId === accountId)
              ?.available ?? 0;
          if (amount > available) {
            throw new ApiAccessError(
              `Fonds insuffisants : ${Math.max(0, available)} FCFA disponibles`,
              409
            );
          }
          return db.fundAllocation.create({
            data: {
              coupleId: context.coupleId,
              createdById: actorUserId,
              accountId,
              projectId,
              goalId,
              amount,
              note: str(data.note),
            },
          });
        }
        const allocation = id
          ? await db.fundAllocation.findFirst({
              where: { id, coupleId: context.coupleId },
            })
          : null;
        if (!allocation) throw new ApiAccessError("Affectation introuvable", 404);
        if (allocation.projectId) {
          await resolveWritableOwnerId(context, "project", allocation.projectId);
        }
        if (allocation.goalId) {
          await resolveWritableOwnerId(context, "goal", allocation.goalId);
        }
        if (action === "delete" || action === "update") {
          return db.fundAllocation.update({
            where: { id: allocation.id },
            data: { status: "RELEASED", releasedAt: new Date() },
          });
        }
        break;
      }

      // -------------------------------------------------------------------
      // Actions personnalisées
      // -------------------------------------------------------------------
      case "goalSuggestion": {
        // Accepter / modifier / refuser / reporter un objectif suggéré
        const state = str(data.state); // ACCEPTED | REFUSED | POSTPONED
        const goalId = id;
        if (!goalId || !state) throw new Error("Paramètres manquants");
        if (state === "ACCEPTED") {
          return db.goal.updateMany({
            where: { id: goalId, userId },
            data: { suggestedState: "ACCEPTED", status: "A_PLANIFIER", isSuggested: true },
          });
        }
        if (state === "REFUSED") {
          return db.goal.updateMany({
            where: { id: goalId, userId },
            data: { suggestedState: "REFUSED", status: "ANNULE" },
          });
        }
        if (state === "POSTPONED") {
          const goal = await db.goal.findFirst({ where: { id: goalId, userId } });
          if (goal) {
            return db.goal.updateMany({
              where: { id: goalId, userId },
              data: { suggestedState: "POSTPONED", year: (goal.year ?? 2027) + 1, status: "REPORTE" },
            });
          }
        }
        break;
      }

      case "provisionCharge": {
        // Provisionner un montant sur une charge (argent réservé, PAS de dépense réelle)
        const amount = num(data.amount);
        const charge = await db.recurringCharge.findFirst({ where: { id, userId } });
        if (!charge) throw new Error("Charge introuvable");
        return db.recurringCharge.update({
          where: { id },
          data: { provisioned: Math.max(0, charge.provisioned + Math.round(amount)) },
        });
      }

      case "closeMonth": {
        // Clôture mensuelle commune : toutes les données partagées du foyer.
        const { monthlySummary, computeAccountBalances, computeNetWorth } =
          await import("@/lib/lifeos/engine");
        const year = intOrNull(data.year);
        const month = intOrNull(data.month);
        const realBalance = intOrNull(data.realBalance);
        if (!year || !month) throw new Error("Année et mois requis");
        const householdWhere = visibleRecordWhere(context);
        const [
          txs,
          accounts,
          categories,
          charges,
          goals,
          projects,
          positions,
          assets,
          liabilities,
          copy,
          other,
          businesses,
          settings,
          incomeSources,
          fundAllocations,
        ] = await Promise.all([
          db.transaction.findMany({ where: householdWhere }),
          db.account.findMany({ where: householdWhere }),
          db.category.findMany({ where: householdWhere }),
          db.recurringCharge.findMany({ where: householdWhere }),
          db.goal.findMany({ where: householdWhere }),
          db.project.findMany({ where: householdWhere }),
          db.investmentPosition.findMany({ where: householdWhere }),
          db.asset.findMany({ where: householdWhere }),
          db.liability.findMany({ where: householdWhere }),
          db.copyTradingAccount.findMany({ where: householdWhere }),
          db.otherInvestment.findMany({ where: householdWhere }),
          db.business.findMany({ where: householdWhere }),
          db.setting.findUnique({ where: { userId: actorUserId } }),
          db.incomeSource.findMany({ where: { coupleId: context.coupleId } }),
          db.fundAllocation.findMany({ where: { coupleId: context.coupleId } }),
        ]);
        const all = {
          settings: settings!,
          incomeSources,
          dependents: [],
          fundAllocations,
          auditEvents: [],
          accounts,
          transactions: txs,
          categories,
          charges,
          envelopes: [],
          lifeAreas: [],
          yearPlans: [],
          goals,
          projects,
          assets,
          liabilities,
          positions,
          copyTrading: copy,
          otherInvestments: other,
          businesses,
          healthMetrics: [],
          skills: [],
          actions: [],
          snapshots: [],
          notes: [],
          user: { id: actorUserId, email: "", name: null },
          today: new Date().toISOString(),
        };
        const s = monthlySummary(txs as never, year, month);
        const balances = computeAccountBalances(accounts as never, txs as never);
        const nw = computeNetWorth(all as never);
        const brvmValue = Math.round(
          all.positions.filter((p) => p.active).reduce((sum, p) => sum + p.quantity * p.currentPrice, 0)
        );
        const computedBalance = accounts.filter((a) => !a.archived).reduce((sum, a) => sum + (balances.get(a.id)?.balance ?? 0), 0);
        const existing = await db.monthlySnapshot.findFirst({
          where: { coupleId: context.coupleId, year, month },
        });
        const values = {
          income: s.income,
          expenses: s.expenses,
          savings: s.netSavings,
          investments: s.invested,
          netWorth: nw.netWorth,
          brvmValue,
          computedBalance,
          realBalance,
          closed: true,
          notes: str(data.notes),
        };
        if (existing) {
          return db.monthlySnapshot.update({ where: { id: existing.id }, data: values });
        }
        return db.monthlySnapshot.create({
          data: {
            userId: actorUserId,
            coupleId: context.coupleId,
            year,
            month,
            ...values,
          },
        });
      }

      default:
        throw new Error(`Entité inconnue : ${entity}`);
    }
    throw new Error(`Action non supportée : ${entity}/${action}`);
  }, auditedEntities.has(entity)
    ? { entity, action, targetId: id, data }
    : undefined);
}
