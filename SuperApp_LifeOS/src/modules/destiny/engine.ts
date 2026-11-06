import grid from "@/data/destiny-grid.json";

export const DESTINY_DOMAINS = [
  ["finance", "Finance"],
  ["voyages", "Voyages"],
  ["social", "Social / Famille"],
  ["decisions", "Décisions"],
  ["spirituel", "Spirituel"],
  ["sante", "Santé"],
  ["couple", "Couple"],
] as const;

export type DestinyDomain = (typeof DESTINY_DOMAINS)[number][0];

export interface DestinyTrace {
  source: string;
  message: string;
  priority: number;
  impacts: Record<string, number>;
}

export interface DestinyProfile {
  date: Date;
  moment: "Aube" | "Matin" | "Midi" | "Soir" | "Nuit";
  globalScore: number;
  verdict: string;
  domainScores: Record<DestinyDomain, number>;
  traces: DestinyTrace[];
  hardBlocks: string[];
  chanceStage: [number, number] | null;
}

type DayRule = { texte: string; impacts: Record<string, number> };
type DestinyGrid = typeof grid;

const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];

function normalize(value: string): string {
  return value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function momentAt(date: Date): DestinyProfile["moment"] {
  const hour = date.getHours();
  if (hour < 6) return "Aube";
  if (hour < 12) return "Matin";
  if (hour < 17) return "Midi";
  if (hour < 21) return "Soir";
  return "Nuit";
}

function ageAt(birthDate: string, date: Date): number | null {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T12:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > date) return null;
  let age = date.getFullYear() - birth.getFullYear();
  if (date.getMonth() < birth.getMonth() || (date.getMonth() === birth.getMonth() && date.getDate() < birth.getDate())) age -= 1;
  return Math.max(0, age);
}

function stageFor(age: number | null): [number, number] | null {
  if (age === null) return null;
  const match = (grid as DestinyGrid).profil.etapesChance.find(([start, end]) => age >= start && age <= end);
  return match ? [match[0], match[1]] : null;
}

function verdict(score: number) {
  if (score >= 80) return "Grand jour";
  if (score >= 60) return "Favorable";
  if (score >= 40) return "Variable — avancer avec discernement";
  return "Vigilance renforcée";
}

export function evaluateDestiny(date = new Date(), birthDate = ""): DestinyProfile {
  const traces: DestinyTrace[] = [];
  const hardBlocks: string[] = [];
  const day = DAYS[date.getDay()];
  const month = MONTHS[date.getMonth()];
  const moment = momentAt(date);
  const guide = grid.guideDuMois as Record<string, DayRule>;
  const rule = guide[String(date.getDate())] ?? guide["31"];

  if (rule) {
    const impacts = { ...rule.impacts };
    const momentKey = moment === "Aube" || moment === "Matin" ? "matin" : moment === "Soir" || moment === "Nuit" ? "soir" : "midi";
    if (impacts[momentKey]) impacts.global = (impacts.global ?? 0) + impacts[momentKey];
    traces.push({ source: `Guide des jours #${date.getDate()}`, message: rule.texte, priority: 4, impacts });
  }

  if (date.getDate() >= 20 && date.getDate() <= 29) {
    traces.push({ source: "Cycle heureux #20–29", message: "Période de déclenchement des choses heureuses", priority: 3, impacts: { global: 1 } });
  }

  if (grid.semaine.favorables.some((value) => normalize(value) === day)) {
    traces.push({ source: `Jour de semaine — ${day}`, message: "Jour favorable", priority: 3, impacts: { global: 2, finance: 1, decisions: 1 } });
  } else {
    const impacts = moment === "Aube" || moment === "Matin"
      ? { global: -2, finance: -1 }
      : moment === "Soir" || moment === "Nuit"
        ? { global: 1, finance: -1 }
        : { global: -1, finance: -1 };
    traces.push({ source: `Jour de semaine — ${day}`, message: grid.semaine.regleVariable, priority: 3, impacts });
  }

  if (grid.moisFavorables.some((value) => normalize(value) === month)) {
    traces.push({ source: `Mois — ${month}`, message: "Mois favorable", priority: 2, impacts: { global: 1, finance: 1, decisions: 1 } });
  } else {
    traces.push({ source: `Mois — ${month}`, message: "Mois variable", priority: 2, impacts: {} });
  }

  if ([5, 7, 11].includes(date.getMonth())) {
    traces.push({ source: "Alimentation — tothème", message: grid.alimentation.totheme, priority: 4, impacts: { sante: -1 } });
  }
  if ([0, 5, 6].includes(date.getDay())) {
    traces.push({ source: "Alimentation — fin de semaine", message: grid.alimentation.venSamDim, priority: 4, impacts: { sante: -1 } });
  }

  const age = ageAt(birthDate, date);
  const chanceStage = stageFor(age);
  if (chanceStage) {
    traces.push({ source: `Étape de chance ${chanceStage[0]}–${chanceStage[1]} ans`, message: "Étape de chance active", priority: 1, impacts: { global: 2, finance: 1, social: 1, spirituel: 1 } });
  }
  if (age !== null && age >= 27) {
    traces.push({ source: "Alerte d’âge — 27 ans", message: grid.profil.alertesAge["27"], priority: 1, impacts: { social: -1 } });
  }
  if (date.getDate() === 23) {
    traces.push({ source: "Croisement santé — jour 23 × ventre", message: "Soupe uniquement : vigilance renforcée pour le ventre", priority: 5, impacts: { sante: -1 } });
  }
  if (date.getDay() === 5 && date.getHours() === 16) {
    traces.push({ source: "Bloc rituel unifié — vendredi 16 h", message: "Prière du vendredi et créneau du sacrifice annuel", priority: 4, impacts: { spirituel: 2 } });
  }

  if (date.getDate() === 10) hardBlocks.push("Prêter", "Emprunter");
  if (date.getDate() === 5) hardBlocks.push("Voyager");
  if (date.getDate() === 25) hardBlocks.push("Sortie familiale");

  const summed: Record<string, number> = {};
  for (const trace of traces) {
    for (const [key, value] of Object.entries(trace.impacts)) summed[key] = (summed[key] ?? 0) + value;
  }
  const domainScores = Object.fromEntries(
    DESTINY_DOMAINS.map(([key]) => [key, Math.max(0, Math.min(100, 50 + (summed[key] ?? 0) * 12))])
  ) as Record<DestinyDomain, number>;
  const globalImpact = Object.values(summed).reduce((sum, value) => sum + value, 0);
  const globalScore = Math.max(0, Math.min(100, 50 + globalImpact * 8));

  return {
    date,
    moment,
    globalScore,
    verdict: verdict(globalScore),
    domainScores,
    traces: traces.sort((a, b) => b.priority - a.priority),
    hardBlocks,
    chanceStage,
  };
}

export function planDestinyDays(intent: string, birthDate: string, days = 45) {
  const normalized = normalize(intent);
  const domain: DestinyDomain = normalized.includes("invest") || normalized.includes("pret") || normalized.includes("emprunt")
    ? "finance"
    : normalized.includes("voyag")
      ? "voyages"
      : normalized.includes("visite") || normalized.includes("autorite")
        ? "social"
        : normalized.includes("reconcil") || normalized.includes("ceremon")
          ? "spirituel"
          : "decisions";
  const forbidden = normalized.includes("preter") ? "Prêter" : normalized.includes("emprunter") ? "Emprunter" : normalized.includes("voyager") ? "Voyager" : null;
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(10, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return evaluateDestiny(date, birthDate);
  }).sort((a, b) => {
    const aScore = forbidden && a.hardBlocks.includes(forbidden) ? -1000 : a.domainScores[domain];
    const bScore = forbidden && b.hardBlocks.includes(forbidden) ? -1000 : b.domainScores[domain];
    return bScore - aScore || b.globalScore - a.globalScore;
  });
}
