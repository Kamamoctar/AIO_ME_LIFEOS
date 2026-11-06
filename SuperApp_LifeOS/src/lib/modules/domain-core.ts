export type LifeEventSource =
  | "evolution"
  | "mk"
  | "destiny"
  | "monarch"
  | "spiritual";

export interface LifeEvent {
  id: string;
  date: string;
  createdAt: string;
  source: LifeEventSource;
  type: "completion" | "project" | "review" | "milestone";
  title: string;
  xp: number;
}

export interface EvolutionSchedule {
  lastCompletedAt: string;
  nextDueDate: string;
}

function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export function nextEvolutionDueDate(frequency: string, from = new Date()): Date {
  const normalized = frequency.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const next = new Date(from);

  if (normalized.includes("quotid") || normalized.includes("chaque jour") || normalized.includes("/jour") || normalized.includes("chaque matin") || normalized.includes("chaque soir")) {
    next.setDate(next.getDate() + 1);
  } else if (normalized.includes("quinz") || normalized.includes("2 sem")) {
    next.setDate(next.getDate() + 14);
  } else if (normalized.includes("hebdo") || normalized.includes("semaine")) {
    next.setDate(next.getDate() + 7);
  } else if (normalized.includes("semestr") || normalized.includes("6 mois")) {
    return addMonthsClamped(next, 6);
  } else if (normalized.includes("trimestr") || normalized.includes("3 mois")) {
    return addMonthsClamped(next, 3);
  } else if (normalized.includes("bimestr") || normalized.includes("2 mois")) {
    return addMonthsClamped(next, 2);
  } else if (normalized.includes("mens") || normalized.includes("mois")) {
    return addMonthsClamped(next, 1);
  } else if (normalized.includes("annuel") || normalized.includes("/an")) {
    return addMonthsClamped(next, 12);
  } else {
    next.setDate(next.getDate() + 7);
  }

  return next;
}

export function monarchStatForDomain(domain: string): string {
  const normalized = domain.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/spirit|relig|foi/.test(normalized)) return "SPI";
  if (/finance|argent|patrimoine|business|carriere/.test(normalized)) return "WLT";
  if (/relation|communication|famille|social/.test(normalized)) return "CHA";
  if (/connaissance|competence|intellect|apprentissage/.test(normalized)) return "INT";
  if (/sante|forme|sport|corps|bien-etre/.test(normalized)) return "VIT";
  return "DSC";
}

export function appendLifeEvent(events: LifeEvent[], event: LifeEvent): LifeEvent[] {
  return [event, ...events].slice(0, 500);
}
