// tests/engine/account-balances.test.ts
// Tests pour computeAccountBalances — la base de toute la logique financière.

import { describe, it, expect, beforeEach } from "vitest";
import { computeAccountBalances } from "@/lib/lifeos/engine";
import { makeAccount, makeTx, resetIds } from "./helpers";

beforeEach(() => resetIds());

describe("computeAccountBalances", () => {
  it("renvoie le solde initial quand il n'y a aucune transaction", () => {
    const acc = makeAccount({ id: "a1", initialBalance: 50000 });
    const map = computeAccountBalances([acc], []);
    const b = map.get("a1")!;
    expect(b.balance).toBe(50000);
    expect(b.inflows).toBe(0);
    expect(b.outflows).toBe(0);
  });

  it("ajoute les revenus (INCOME) aux inflows", () => {
    const acc = makeAccount({ id: "a1", initialBalance: 100000 });
    const tx = makeTx({ accountId: "a1", type: "INCOME", amount: 169933 });
    const map = computeAccountBalances([acc], [tx]);
    const b = map.get("a1")!;
    expect(b.inflows).toBe(169933);
    expect(b.balance).toBe(100000 + 169933);
  });

  it("ajoute les dividendes (DIVIDEND) aux inflows", () => {
    const acc = makeAccount({ id: "a1", initialBalance: 0 });
    const tx = makeTx({ accountId: "a1", type: "DIVIDEND", amount: 5000 });
    const map = computeAccountBalances([acc], [tx]);
    expect(map.get("a1")!.inflows).toBe(5000);
  });

  it("soustrait les dépenses (EXPENSE) des outflows, y compris les frais", () => {
    const acc = makeAccount({ id: "a1", initialBalance: 100000 });
    const tx = makeTx({ accountId: "a1", type: "EXPENSE", amount: 25000, fee: 500 });
    const map = computeAccountBalances([acc], [tx]);
    const b = map.get("a1")!;
    expect(b.outflows).toBe(25500); // montant + frais
    expect(b.balance).toBe(100000 - 25500);
  });

  it("soustrait les dons (DONATION) des outflows", () => {
    const acc = makeAccount({ id: "a1", initialBalance: 50000 });
    const tx = makeTx({ accountId: "a1", type: "DONATION", amount: 5000 });
    const map = computeAccountBalances([acc], [tx]);
    expect(map.get("a1")!.outflows).toBe(5000);
    expect(map.get("a1")!.balance).toBe(45000);
  });

  it("soustrait les investissements (INVESTMENT) des outflows", () => {
    const acc = makeAccount({ id: "a1", initialBalance: 200000 });
    const tx = makeTx({ accountId: "a1", type: "INVESTMENT", amount: 100000, fee: 2000 });
    const map = computeAccountBalances([acc], [tx]);
    expect(map.get("a1")!.outflows).toBe(102000);
    expect(map.get("a1")!.balance).toBe(98000);
  });

  // -----------------------------------------------------------------------
  // RÈGLE MÉTIER CLÉ : un transfert ne crée ni revenu ni dépense
  // -----------------------------------------------------------------------
  describe("transferts", () => {
    it("déplace l'argent du compte source vers le compte destination sans changer le total", () => {
      const src = makeAccount({ id: "src", initialBalance: 100000 });
      const dst = makeAccount({ id: "dst", initialBalance: 0 });
      const tx = makeTx({
        accountId: "src",
        toAccountId: "dst",
        type: "TRANSFER",
        amount: 30000,
        fee: 0,
      });
      const map = computeAccountBalances([src, dst], [tx]);
      expect(map.get("src")!.balance).toBe(70000);
      expect(map.get("dst")!.balance).toBe(30000);
      // Le total global reste 100 000
      expect(map.get("src")!.balance + map.get("dst")!.balance).toBe(100000);
    });

    it("seuls les frais de transfert réduisent le total global", () => {
      const src = makeAccount({ id: "src", initialBalance: 100000 });
      const dst = makeAccount({ id: "dst", initialBalance: 0 });
      const tx = makeTx({
        accountId: "src",
        toAccountId: "dst",
        type: "TRANSFER",
        amount: 30000,
        fee: 500,
      });
      const map = computeAccountBalances([src, dst], [tx]);
      // source perd montant + frais
      expect(map.get("src")!.outflows).toBe(30500);
      expect(map.get("src")!.balance).toBe(69500);
      // destination reçoit uniquement le montant
      expect(map.get("dst")!.inflows).toBe(30000);
      expect(map.get("dst")!.balance).toBe(30000);
      // Total global diminué des seuls frais
      expect(map.get("src")!.balance + map.get("dst")!.balance).toBe(99500);
    });
  });

  // -----------------------------------------------------------------------
  // Ajustements (correction de solde)
  // -----------------------------------------------------------------------
  describe("ajustements", () => {
    it("ajustement positif → inflow", () => {
      const acc = makeAccount({ id: "a1", initialBalance: 10000 });
      const tx = makeTx({ accountId: "a1", type: "ADJUSTMENT", amount: 3000 });
      const map = computeAccountBalances([acc], [tx]);
      expect(map.get("a1")!.inflows).toBe(3000);
      expect(map.get("a1")!.balance).toBe(13000);
    });

    it("ajustement négatif → outflow", () => {
      const acc = makeAccount({ id: "a1", initialBalance: 10000 });
      const tx = makeTx({ accountId: "a1", type: "ADJUSTMENT", amount: -2000 });
      const map = computeAccountBalances([acc], [tx]);
      expect(map.get("a1")!.outflows).toBe(2000);
      expect(map.get("a1")!.balance).toBe(8000);
    });
  });

  // -----------------------------------------------------------------------
  // Transactions multiples
  // -----------------------------------------------------------------------
  it("gère correctement une série de transactions variées", () => {
    const acc = makeAccount({ id: "a1", initialBalance: 500000 });
    const txs = [
      makeTx({ accountId: "a1", type: "INCOME", amount: 169933 }),
      makeTx({ accountId: "a1", type: "EXPENSE", amount: 65000 }),
      makeTx({ accountId: "a1", type: "DONATION", amount: 5000 }),
      makeTx({ accountId: "a1", type: "INVESTMENT", amount: 50000, fee: 1000 }),
      makeTx({ accountId: "a1", type: "DEPOSIT", amount: 20000 }),
    ];
    const map = computeAccountBalances([acc], txs);
    const b = map.get("a1")!;
    // inflows: INCOME(169933) + DEPOSIT via inflowOf? → DEPOSIT is in inflowOf → yes
    expect(b.inflows).toBe(169933 + 20000);
    // outflows: EXPENSE(65000) + DONATION(5000) + INVESTMENT(50000+1000)
    expect(b.outflows).toBe(65000 + 5000 + 51000);
    expect(b.balance).toBe(500000 + 189933 - 121000);
  });

  it("ignore les transactions qui référencent un compte inconnu", () => {
    const acc = makeAccount({ id: "a1", initialBalance: 10000 });
    const tx = makeTx({ accountId: "unknown", type: "EXPENSE", amount: 5000 });
    const map = computeAccountBalances([acc], [tx]);
    expect(map.get("a1")!.balance).toBe(10000);
  });
});
