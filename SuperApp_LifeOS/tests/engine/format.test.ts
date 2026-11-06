// tests/engine/format.test.ts
// Tests pour les fonctions utilitaires de formatage.

import { describe, it, expect } from "vitest";
import {
  formatFCFA,
  formatCompactFCFA,
  formatPercent,
  formatDateFR,
  monthKey,
  daysBetween,
  monthsBetween,
} from "@/lib/lifeos/format";

describe("formatFCFA", () => {
  it("formate un montant positif avec espaces fines insécables", () => {
    const r = formatFCFA(1250000);
    // "\u202F" = narrow no-break space
    expect(r).toBe("1\u202F250\u202F000 FCFA");
  });

  it("formate un montant négatif avec signe moins typographique", () => {
    const r = formatFCFA(-50000);
    expect(r).toContain("50\u202F000 FCFA");
    expect(r.startsWith("−")).toBe(true); // U+2212 minus
  });

  it("formate 0 correctement", () => {
    expect(formatFCFA(0)).toBe("0 FCFA");
  });

  it("gère null, undefined, NaN", () => {
    expect(formatFCFA(null)).toBe("— FCFA");
    expect(formatFCFA(undefined)).toBe("— FCFA");
    expect(formatFCFA(NaN)).toBe("— FCFA");
  });
});

describe("formatCompactFCFA", () => {
  it("affiche en M pour les millions", () => {
    expect(formatCompactFCFA(5000000)).toBe("5 M");
    expect(formatCompactFCFA(2500000)).toBe("2.5 M");
  });

  it("affiche en k pour les milliers", () => {
    expect(formatCompactFCFA(65000)).toBe("65 k");
    expect(formatCompactFCFA(1500)).toBe("1.5 k");
  });

  it("affiche brut pour les petits montants", () => {
    expect(formatCompactFCFA(500)).toBe("500");
  });

  it("gère null/undefined/NaN", () => {
    expect(formatCompactFCFA(null)).toBe("—");
    expect(formatCompactFCFA(undefined)).toBe("—");
    expect(formatCompactFCFA(NaN)).toBe("—");
  });

  it("gère les négatifs", () => {
    expect(formatCompactFCFA(-2000000)).toBe("−2 M");
  });
});

describe("formatPercent", () => {
  it("formate un ratio en pourcentage", () => {
    expect(formatPercent(0.75)).toBe("75 %");
    expect(formatPercent(1)).toBe("100 %");
    expect(formatPercent(0.333, 1)).toBe("33.3 %");
  });

  it("gère null/undefined/NaN", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(undefined)).toBe("—");
    expect(formatPercent(NaN)).toBe("—");
  });
});

describe("formatDateFR", () => {
  it("formate une date ISO en format français court", () => {
    const r = formatDateFR("2027-03-15T12:00:00.000Z");
    expect(r).toContain("15");
    expect(r).toContain("Mar");
    expect(r).toContain("2027");
  });

  it("gère null/undefined/date invalide", () => {
    expect(formatDateFR(null)).toBe("—");
    expect(formatDateFR(undefined)).toBe("—");
    expect(formatDateFR("not-a-date")).toBe("—");
  });
});

describe("monthKey", () => {
  it("génère une clé yyyy-mm", () => {
    expect(monthKey(new Date("2027-01-15"))).toBe("2027-01");
    expect(monthKey(new Date("2027-12-01"))).toBe("2027-12");
  });
});

describe("daysBetween", () => {
  it("calcule le nombre de jours entre deux dates", () => {
    const a = new Date("2027-01-01");
    const b = new Date("2027-01-31");
    expect(daysBetween(a, b)).toBe(30);
  });

  it("retourne un nombre négatif si b < a", () => {
    const a = new Date("2027-03-15");
    const b = new Date("2027-03-10");
    expect(daysBetween(a, b)).toBe(-5);
  });
});

describe("monthsBetween", () => {
  it("calcule le nombre de mois entre deux dates", () => {
    const a = new Date("2027-01-15");
    const b = new Date("2027-06-15");
    expect(monthsBetween(a, b)).toBe(5);
  });

  it("retourne 0 si b est avant a", () => {
    const a = new Date("2027-06-15");
    const b = new Date("2027-03-15");
    expect(monthsBetween(a, b)).toBe(0);
  });

  it("ajuste si le jour de b est avant le jour de a", () => {
    const a = new Date("2027-01-20");
    const b = new Date("2027-03-15"); // le 15 < le 20
    expect(monthsBetween(a, b)).toBe(1); // 2 mois complets - 1 ajustement
  });

  it("gère les traversées d'année", () => {
    const a = new Date("2026-11-01");
    const b = new Date("2027-02-01");
    expect(monthsBetween(a, b)).toBe(3);
  });
});
