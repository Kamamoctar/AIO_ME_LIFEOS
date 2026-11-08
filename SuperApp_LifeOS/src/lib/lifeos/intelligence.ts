import { initialDailyQuests } from "@/data/monarch-seed";
import { EVOLUTION_ACTIONS } from "@/data/evolution-actions";
import type { ViewId } from "@/lib/lifeos/constants";
import type { LifeOSState } from "@/lib/lifeos/types";
import {
  getTodayEntry,
  localDateKey,
  type UnifiedModulesState,
} from "@/lib/modules/store";
import { computeMoneyAllocation } from "@/lib/lifeos/money-plan";

export interface LifeOSRecommendation {
  id: string;
  score: number;
  title: string;
  reason: string;
  view: ViewId;
  category: "focus" | "deadline" | "habit" | "spiritual" | "finance";
}

export interface WeeklyLifeReview {
  startDate: string;
  endDate: string;
  questRate: number;
  prayerRate: number;
  ritualRate: number;
  evolutionDone: number;
  xpEarned: number;
  averageEnergy: number | null;
  prompts: string[];
}

export function buildDailyRecommendations(
  state: LifeOSState,
  modules: UnifiedModulesState,
  now = new Date(state.today)
): LifeOSRecommendation[] {
  const recommendations: LifeOSRecommendation[] = [];
  const today = getTodayEntry(modules);

  if (!today.priority.trim()) {
    recommendations.push({ id: "set-priority", score: 100, title: "Définis ta priorité unique", reason: "Une journée sans priorité disperse les efforts.", view: "mk", category: "focus" });
  }

  const overdue = state.actions.filter((action) => !action.done && action.dueDate && new Date(action.dueDate) < now);
  if (overdue.length) {
    recommendations.push({ id: "overdue", score: 96, title: `Traite ${overdue.length} action${overdue.length > 1 ? "s" : ""} en retard`, reason: overdue[0]?.title ?? "Des échéances nécessitent ton attention.", view: "calendar", category: "deadline" });
  }

  const prayersRemaining = Math.max(0, 5 - today.prayersDone.length);
  if (prayersRemaining) {
    recommendations.push({ id: "prayers", score: 80 + prayersRemaining, title: `${prayersRemaining} prière${prayersRemaining > 1 ? "s" : ""} à valider`, reason: "Protège les rendez-vous spirituels de la journée.", view: "spiritual", category: "spiritual" });
  }

  const activeEvolution = modules.evolution.activeActionCodes
    .filter((code) => !today.evolutionDone.includes(code))
    .map((code) => EVOLUTION_ACTIONS.find((action) => action.code === code))
    .filter(Boolean);
  if (activeEvolution.length) {
    recommendations.push({ id: "evolution", score: 78, title: activeEvolution[0]?.action ?? "Avance sur ton focus Évolution", reason: `${activeEvolution.length} action${activeEvolution.length > 1 ? "s" : ""} du trio reste${activeEvolution.length > 1 ? "nt" : ""} à accomplir.`, view: "evolution", category: "habit" });
  }

  const questsRemaining = Math.max(0, initialDailyQuests.length - today.questDone.length);
  if (questsRemaining) {
    recommendations.push({ id: "quests", score: 72, title: `Poursuis tes quêtes · ${questsRemaining} restante${questsRemaining > 1 ? "s" : ""}`, reason: `Série actuelle : ${modules.monarch.streakQuests} jour${modules.monarch.streakQuests > 1 ? "s" : ""}.`, view: "monarch", category: "habit" });
  }

  const goalsWithoutAction = state.goals.filter((goal) =>
    !goal.isSuggested &&
    !["TERMINE", "ANNULE", "REPORTE"].includes(goal.status) &&
    !state.actions.some((action) => !action.done && action.goalId === goal.id)
  );
  if (goalsWithoutAction.length) {
    recommendations.push({ id: "goal-action", score: 68, title: "Ajoute une prochaine action à un objectif", reason: `« ${goalsWithoutAction[0]?.title} » n’a aucune action ouverte.`, view: "goals", category: "focus" });
  }

  const month = now.getMonth();
  const year = now.getFullYear();
  const monthlyTransactions = state.transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });
  if (!monthlyTransactions.length) {
    recommendations.push({ id: "finance-log", score: 55, title: "Mets tes finances à jour", reason: "Aucune opération n’est enregistrée pour le mois courant.", view: "finances", category: "finance" });
  }

  if (modules.finance.moneyPlan.enabled) {
    const allocation = computeMoneyAllocation(state, modules.finance.moneyPlan, now);
    if (allocation.totalPercentage !== 100) {
      recommendations.push({ id: "money-plan-total", score: 90, title: "Corrige la répartition des six poches", reason: `Les cibles totalisent ${allocation.totalPercentage}% au lieu de 100%.`, view: "finances", category: "finance" });
    } else if (allocation.unclassified > 0) {
      recommendations.push({ id: "money-plan-unclassified", score: 70, title: "Classe tes dépenses dans les six poches", reason: `${allocation.unclassified.toLocaleString("fr-FR")} FCFA restent non classés ce mois.`, view: "finances", category: "finance" });
    }
  }

  return recommendations.toSorted((a, b) => b.score - a.score).slice(0, 6);
}

export function buildWeeklyLifeReview(
  modules: UnifiedModulesState,
  end = new Date()
): WeeklyLifeReview {
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12);
  const startDay = new Date(endDay);
  startDay.setDate(startDay.getDate() - 6);
  const entries = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDay);
    date.setDate(date.getDate() + index);
    return modules.daily[localDateKey(date)];
  }).filter(Boolean);

  const questDone = entries.reduce((sum, entry) => sum + entry.questDone.length, 0);
  const prayersDone = entries.reduce((sum, entry) => sum + entry.prayersDone.length, 0);
  const ritualsDone = entries.reduce(
    (sum, entry) => sum + entry.morningRituals.filter(Boolean).length + entry.eveningRituals.filter(Boolean).length,
    0
  );
  const evolutionDone = entries.reduce((sum, entry) => sum + entry.evolutionDone.length, 0);
  const averageEnergy = entries.length
    ? entries.reduce((sum, entry) => sum + entry.energy, 0) / entries.length
    : null;
  const startKey = localDateKey(startDay);
  const endKey = localDateKey(endDay);
  const xpEarned = modules.events
    .filter((event) => event.date >= startKey && event.date <= endKey)
    .reduce((sum, event) => sum + event.xp, 0);
  const questRate = Math.round((questDone / (7 * initialDailyQuests.length)) * 100);
  const prayerRate = Math.round((prayersDone / 35) * 100);
  const ritualRate = Math.round((ritualsDone / 56) * 100);
  const prompts = [
    "Quelle victoire mérite d’être répétée la semaine prochaine ?",
    questRate < 60 ? "Quelle friction t’empêche de terminer tes quêtes ?" : "Quelle quête a produit le plus de valeur réelle ?",
    averageEnergy !== null && averageEnergy < 5 ? "Qu’est-ce qui peut protéger ton énergie dès demain ?" : "Quel engagement unique donnera le plus d’élan à la prochaine semaine ?",
  ];

  return {
    startDate: startKey,
    endDate: endKey,
    questRate,
    prayerRate,
    ritualRate,
    evolutionDone,
    xpEarned,
    averageEnergy,
    prompts,
  };
}
