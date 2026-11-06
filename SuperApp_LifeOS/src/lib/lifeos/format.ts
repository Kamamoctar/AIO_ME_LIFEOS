// Life OS — Formatage FCFA (entiers, sans décimales inutiles)
import { MONTHS_FR, MONTHS_FR_SHORT } from "./constants";

export function formatFCFA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "— FCFA";
  }
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "−" : "";
  const abs = Math.abs(rounded);
  const formatted = abs
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F"); // espace fine insécable
  return `${sign}${formatted} FCFA`;
}

export function formatCompactFCFA(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount))
    return "—";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return `${sign}${trimNum(m)} M`;
  }
  if (abs >= 1000) {
    const k = abs / 1000;
    return `${sign}${trimNum(k)} k`;
  }
  return `${sign}${abs}`;
}

function trimNum(n: number): string {
  return n.toFixed(n < 10 && n % 1 !== 0 ? 1 : 0).replace(/\.0$/, "");
}

export function formatPercent(ratio: number | null | undefined, digits = 0): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return "—";
  return `${(ratio * 100).toFixed(digits)} %`;
}

export function formatDateFR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS_FR_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateLongFR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMonthFR(year: number, month: number): string {
  return `${MONTHS_FR[month - 1]} ${year}`;
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function monthsBetween(a: Date, b: Date): number {
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m -= 1;
  return Math.max(0, m);
}

export function toInputDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayInputDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
