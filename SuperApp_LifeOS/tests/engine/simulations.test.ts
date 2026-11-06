// tests/engine/simulations.test.ts
// Tests pour compoundProjection et requiredMonthly.

import { describe, it, expect, beforeEach } from "vitest";
import { compoundProjection, requiredMonthly } from "@/lib/lifeos/engine";
import { resetIds } from "./helpers";

beforeEach(() => resetIds());

// ---------------------------------------------------------------------------
// compoundProjection
// ---------------------------------------------------------------------------

describe("compoundProjection", () => {
  it("sans contribution mensuelle ni rendement → valeur finale = initial", () => {
    const r = compoundProjection(100000, 0, 0, 5);
    expect(r.finalValue).toBe(100000);
    expect(r.gains).toBe(0);
    expect(r.contributions).toBe(100000);
    expect(r.yearly).toHaveLength(5);
  });

  it("avec contribution mensuelle sans rendement → somme linéaire", () => {
    const r = compoundProjection(0, 10000, 0, 1);
    // 12 mois × 10000 = 120000
    expect(r.finalValue).toBe(120000);
    expect(r.contributions).toBe(120000);
    expect(r.gains).toBe(0);
  });

  it("intérêts composés sur 1 an avec un capital initial seul", () => {
    const r = compoundProjection(1000000, 0, 0.12, 1);
    // (1 + 0.01)^12 ≈ 1.12682 → ~1 126 825
    expect(r.finalValue).toBeGreaterThan(1120000);
    expect(r.finalValue).toBeLessThan(1130000);
    expect(r.gains).toBe(r.finalValue - r.contributions);
  });

  it("intérêts composés sur 10 ans avec contribution mensuelle", () => {
    const r = compoundProjection(500000, 50000, 0.08, 10);
    // Après 10 ans d'intérêts composés, le résultat doit être significativement > contributions
    expect(r.finalValue).toBeGreaterThan(r.contributions);
    expect(r.gains).toBeGreaterThan(0);
    expect(r.yearly).toHaveLength(10);
    // Chaque année la valeur doit croître
    for (let i = 1; i < r.yearly.length; i++) {
      expect(r.yearly[i].value).toBeGreaterThan(r.yearly[i - 1].value);
    }
  });

  it("les frais annuels réduisent le rendement effectif", () => {
    const withoutFees = compoundProjection(1000000, 0, 0.10, 5);
    const withFees = compoundProjection(1000000, 0, 0.10, 5, 0.02); // 2% frais
    expect(withFees.finalValue).toBeLessThan(withoutFees.finalValue);
    // Le rendement net est 8% au lieu de 10%
    const netRate8 = compoundProjection(1000000, 0, 0.08, 5);
    expect(withFees.finalValue).toBe(netRate8.finalValue);
  });

  it("la structure yearly est croissante et bien accumulée", () => {
    const r = compoundProjection(100000, 20000, 0.06, 3);
    expect(r.yearly).toHaveLength(3);
    // contributions cumulées : 100k + 20k*12 = 340k, + 20k*24 = 580k, + 20k*36 = 820k
    expect(r.yearly[0].contributed).toBe(100000 + 20000 * 12);
    expect(r.yearly[1].contributed).toBe(100000 + 20000 * 24);
    expect(r.yearly[2].contributed).toBe(100000 + 20000 * 36);
    expect(r.contributions).toBe(100000 + 20000 * 36);
  });
});

// ---------------------------------------------------------------------------
// requiredMonthly
// ---------------------------------------------------------------------------

describe("requiredMonthly", () => {
  it("sans rendement → mensualité = (target - initial) / mois", () => {
    const m = requiredMonthly(1200000, 0, 0, 1);
    // 1200000 / 12 = 100000
    expect(m).toBe(100000);
  });

  it("avec capital initial suffisant → mensualité = 0", () => {
    const m = requiredMonthly(500000, 1000000, 0.05, 5);
    expect(m).toBe(0);
  });

  it("0 années → mensualité = max(0, target - initial)", () => {
    const m = requiredMonthly(500000, 200000, 0.10, 0);
    expect(m).toBe(300000);
  });

  it("avec rendement, la mensualité est réduite grâce aux intérêts composés", () => {
    const withoutRate = requiredMonthly(10000000, 0, 0, 10);
    const withRate = requiredMonthly(10000000, 0, 0.08, 10);
    expect(withRate).toBeLessThan(withoutRate);
  });

  it("vérifie la cohérence : compoundProjection avec la mensualité doit atteindre la cible", () => {
    const target = 5000000;
    const initial = 200000;
    const rate = 0.07;
    const years = 8;
    const monthly = requiredMonthly(target, initial, rate, years);
    // On vérifie avec compoundProjection
    const result = compoundProjection(initial, monthly, rate, years);
    // Le résultat doit être >= target (car requiredMonthly arrondit au supérieur)
    expect(result.finalValue).toBeGreaterThanOrEqual(target);
    // Mais pas trop au-dessus (tolérance d'un mois de contribution)
    expect(result.finalValue).toBeLessThan(target + monthly * 2);
  });
});
