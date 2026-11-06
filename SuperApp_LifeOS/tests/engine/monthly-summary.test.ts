// tests/engine/monthly-summary.test.ts
// Tests pour monthlySummary et monthlySeries — résumé mensuel des revenus/dépenses.

import { describe, it, expect, beforeEach } from "vitest";
import { monthlySummary, monthlySeries } from "@/lib/lifeos/engine";
import { makeTx, resetIds } from "./helpers";

beforeEach(() => resetIds());

describe("monthlySummary", () => {
  it("renvoie un résumé vide quand il n'y a pas de transactions", () => {
    const s = monthlySummary([], 2027, 1);
    expect(s.key).toBe("2027-01");
    expect(s.income).toBe(0);
    expect(s.expenses).toBe(0);
    expect(s.fees).toBe(0);
    expect(s.invested).toBe(0);
    expect(s.donations).toBe(0);
    expect(s.netSavings).toBe(0);
    expect(s.transactionCount).toBe(0);
  });

  it("filtre par mois correctement", () => {
    const txJan = makeTx({ type: "INCOME", amount: 100000, date: "2027-01-15T00:00:00Z" });
    const txFeb = makeTx({ type: "INCOME", amount: 50000, date: "2027-02-01T00:00:00Z" });
    const s = monthlySummary([txJan, txFeb], 2027, 1);
    expect(s.income).toBe(100000);
    expect(s.transactionCount).toBe(1);
  });

  it("comptabilise les revenus (INCOME, DIVIDEND)", () => {
    const txs = [
      makeTx({ type: "INCOME", amount: 169933, date: "2027-01-05T00:00:00Z" }),
      makeTx({ type: "DIVIDEND", amount: 5000, date: "2027-01-20T00:00:00Z" }),
    ];
    const s = monthlySummary(txs, 2027, 1);
    expect(s.income).toBe(174933); // INCOME + DIVIDEND
  });

  it("comptabilise les dépenses (EXPENSE)", () => {
    const tx = makeTx({
      type: "EXPENSE",
      amount: 65000,
      category: "Factures",
      date: "2027-01-10T00:00:00Z",
    });
    const s = monthlySummary([tx], 2027, 1);
    expect(s.expenses).toBe(65000);
    expect(s.byCategory.get("Factures")).toBe(65000);
  });

  it("inclut les frais attaches a une depense dans le reel", () => {
    const tx = makeTx({
      type: "EXPENSE",
      amount: 10000,
      fee: 500,
      category: "Transport",
      date: "2027-01-10T00:00:00Z",
    });
    const s = monthlySummary([tx], 2027, 1);
    expect(s.expenses).toBe(10500);
    expect(s.fees).toBe(500);
    expect(s.byCategory.get("Transport")).toBe(10500);
  });

  it("comptabilise les dons dans les dépenses ET donations", () => {
    const tx = makeTx({
      type: "DONATION",
      amount: 5000,
      date: "2027-01-12T00:00:00Z",
    });
    const s = monthlySummary([tx], 2027, 1);
    expect(s.donations).toBe(5000);
    expect(s.expenses).toBe(5000);
    expect(s.byCategory.get("Dons / Solidarité")).toBe(5000);
  });

  // RÈGLE MÉTIER : un transfert ne crée PAS de dépense (seuls les frais comptent)
  describe("règle transfert ≠ dépense", () => {
    it("un transfert sans frais ne crée aucune dépense", () => {
      const tx = makeTx({
        type: "TRANSFER",
        amount: 50000,
        fee: 0,
        date: "2027-01-15T00:00:00Z",
      });
      const s = monthlySummary([tx], 2027, 1);
      expect(s.expenses).toBe(0);
      expect(s.fees).toBe(0);
    });

    it("seuls les frais de transfert comptent comme dépense", () => {
      const tx = makeTx({
        type: "TRANSFER",
        amount: 50000,
        fee: 500,
        date: "2027-01-15T00:00:00Z",
      });
      const s = monthlySummary([tx], 2027, 1);
      expect(s.expenses).toBe(500);
      expect(s.fees).toBe(500);
    });
  });

  // RÈGLE MÉTIER : un investissement ne crée pas de dépense de consommation
  describe("investissements", () => {
    it("l'investissement est comptabilisé séparément des dépenses de consommation", () => {
      const tx = makeTx({
        type: "INVESTMENT",
        amount: 100000,
        fee: 2000,
        date: "2027-01-20T00:00:00Z",
      });
      const s = monthlySummary([tx], 2027, 1);
      expect(s.invested).toBe(100000);
      // Seuls les frais sont une dépense réelle
      expect(s.expenses).toBe(2000);
      expect(s.fees).toBe(2000);
    });
  });

  it("calcule le netSavings = income - expenses", () => {
    const txs = [
      makeTx({ type: "INCOME", amount: 169933, date: "2027-01-05T00:00:00Z" }),
      makeTx({ type: "EXPENSE", amount: 65000, date: "2027-01-10T00:00:00Z" }),
      makeTx({ type: "EXPENSE", amount: 16000, date: "2027-01-15T00:00:00Z" }),
    ];
    const s = monthlySummary(txs, 2027, 1);
    expect(s.netSavings).toBe(169933 - 81000);
  });

  it("gère les frais sur WITHDRAWAL, DEPOSIT, ASSET_BUY, ASSET_SELL", () => {
    const txs = [
      makeTx({ type: "WITHDRAWAL", amount: 50000, fee: 300, date: "2027-01-10T00:00:00Z" }),
      makeTx({ type: "ASSET_BUY", amount: 200000, fee: 1000, date: "2027-01-12T00:00:00Z" }),
    ];
    const s = monthlySummary(txs, 2027, 1);
    expect(s.expenses).toBe(1300); // seulement les frais
    expect(s.invested).toBe(0); // pas un investissement au sens comptable
  });
});

describe("monthlySeries", () => {
  it("retourne N mois de données", () => {
    const today = new Date("2027-06-15");
    const series = monthlySeries([], 6, today);
    expect(series.length).toBe(6);
    expect(series[0].key).toBe("2027-01");
    expect(series[5].key).toBe("2027-06");
  });

  it("agrège les transactions par mois", () => {
    const txs = [
      makeTx({ type: "INCOME", amount: 170000, date: "2027-01-05T00:00:00Z" }),
      makeTx({ type: "EXPENSE", amount: 80000, date: "2027-01-10T00:00:00Z" }),
      makeTx({ type: "INCOME", amount: 200000, date: "2027-02-05T00:00:00Z" }),
    ];
    const today = new Date("2027-03-15");
    const series = monthlySeries(txs, 3, today);
    expect(series[0].income).toBe(170000);
    expect(series[0].expenses).toBe(80000);
    expect(series[0].savings).toBe(90000);
    expect(series[1].income).toBe(200000);
  });
});
