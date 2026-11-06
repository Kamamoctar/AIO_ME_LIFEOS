// tests/engine/net-worth-brvm.test.ts
// Tests pour computeNetWorth, computeBrvmStats et projectFunding.

import { describe, it, expect, beforeEach } from "vitest";
import { computeNetWorth, computeBrvmStats, projectFunding } from "@/lib/lifeos/engine";
import {
  makeAccount,
  makeTx,
  makePosition,
  makeAsset,
  makeLiability,
  makeCopyTrading,
  makeOtherInvestment,
  makeBusiness,
  makeProject,
  makeState,
  resetIds,
} from "./helpers";

beforeEach(() => resetIds());

// ---------------------------------------------------------------------------
// computeNetWorth
// ---------------------------------------------------------------------------

describe("computeNetWorth", () => {
  it("calcule le cash à partir des comptes non archivés", () => {
    const state = makeState({
      accounts: [
        makeAccount({ id: "bank", type: "BANK", initialBalance: 500000 }),
        makeAccount({ id: "cash", type: "CASH", initialBalance: 50000 }),
        makeAccount({ id: "mm", type: "MOBILE_MONEY", initialBalance: 30000 }),
      ],
      transactions: [],
    });
    const nw = computeNetWorth(state);
    expect(nw.cash).toBe(580000);
  });

  it("exclut les comptes archivés du cash", () => {
    const state = makeState({
      accounts: [
        makeAccount({ id: "a", type: "BANK", initialBalance: 100000 }),
        makeAccount({ id: "b", type: "BANK", initialBalance: 200000, archived: true }),
      ],
      transactions: [],
    });
    const nw = computeNetWorth(state);
    expect(nw.cash).toBe(100000);
  });

  it("sépare les comptes BRVM du cash", () => {
    const state = makeState({
      accounts: [
        makeAccount({ id: "bank", type: "BANK", initialBalance: 100000 }),
        makeAccount({ id: "brvm", type: "BRVM", initialBalance: 50000 }),
      ],
      transactions: [],
    });
    const nw = computeNetWorth(state);
    expect(nw.cash).toBe(100000);
    // brvm = wallet BRVM + positions BRVM
    expect(nw.brvm).toBe(50000); // pas de positions
  });

  it("inclut les positions BRVM actives dans la valeur brvm", () => {
    const state = makeState({
      accounts: [],
      transactions: [],
      positions: [
        makePosition({ quantity: 10, currentPrice: 15000, active: true }),
        makePosition({ quantity: 5, currentPrice: 20000, active: true }),
        makePosition({ quantity: 100, currentPrice: 5000, active: false }), // inactive → ignorée
      ],
    });
    const nw = computeNetWorth(state);
    expect(nw.brvm).toBe(10 * 15000 + 5 * 20000); // 250000
  });

  it("inclut les actifs manuels, copy trading, autres investissements, business", () => {
    const state = makeState({
      accounts: [],
      transactions: [],
      assets: [makeAsset({ value: 5000000 })],
      liabilities: [makeLiability({ amount: 1000000 })],
      copyTrading: [makeCopyTrading({ currentValue: 200000 })],
      otherInvestments: [makeOtherInvestment({ currentValue: 300000 })],
      businesses: [makeBusiness({ capitalInvested: 1000000 })],
    });
    const nw = computeNetWorth(state);
    expect(nw.manualAssets).toBe(5000000);
    expect(nw.copyTrading).toBe(200000);
    expect(nw.otherInvestments).toBe(300000);
    expect(nw.businesses).toBe(1000000);
    expect(nw.liabilities).toBe(1000000);
    expect(nw.totalAssets).toBe(5000000 + 200000 + 300000 + 1000000);
    expect(nw.netWorth).toBe(nw.totalAssets - 1000000);
  });

  // RÈGLE MÉTIER : un investissement ne diminue pas le patrimoine
  it("netWorth = totalAssets - liabilities", () => {
    const state = makeState({
      accounts: [makeAccount({ id: "bank", type: "BANK", initialBalance: 1000000 })],
      transactions: [],
      assets: [makeAsset({ value: 2000000 })],
      liabilities: [makeLiability({ amount: 500000 })],
    });
    const nw = computeNetWorth(state);
    expect(nw.netWorth).toBe(nw.totalAssets - nw.liabilities);
  });
});

// ---------------------------------------------------------------------------
// computeBrvmStats
// ---------------------------------------------------------------------------

describe("computeBrvmStats", () => {
  it("calcule les stats pour un portefeuille BRVM simple", () => {
    const positions = [
      makePosition({
        company: "SONATEL",
        quantity: 10,
        avgBuyPrice: 14000,
        feesPaid: 2000,
        currentPrice: 15500,
        dividends: 3000,
        active: true,
      }),
    ];
    const stats = computeBrvmStats(positions);
    // cost = 10 × 14000 + 2000 = 142000
    expect(stats.totalCost).toBe(142000);
    // value = 10 × 15500 = 155000
    expect(stats.totalValue).toBe(155000);
    expect(stats.unrealizedGain).toBe(13000);
    expect(stats.totalDividends).toBe(3000);
    // performance = 13000 / 142000
    expect(stats.performance).toBeCloseTo(13000 / 142000, 4);
    // dividendYield = 3000 / 142000
    expect(stats.dividendYield).toBeCloseTo(3000 / 142000, 4);
    // totalPerformance = (155000 + 3000 - 142000) / 142000
    expect(stats.totalPerformance).toBeCloseTo(16000 / 142000, 4);
  });

  it("exclut les positions inactives ou à quantité 0", () => {
    const positions = [
      makePosition({ quantity: 10, currentPrice: 10000, active: true }),
      makePosition({ quantity: 0, currentPrice: 10000, active: true }), // qty 0
      makePosition({ quantity: 5, currentPrice: 10000, active: false }), // inactive
    ];
    const stats = computeBrvmStats(positions);
    expect(stats.lines).toHaveLength(1);
  });

  it("retourne des zéros propres pour un portefeuille vide", () => {
    const stats = computeBrvmStats([]);
    expect(stats.totalCost).toBe(0);
    expect(stats.totalValue).toBe(0);
    expect(stats.performance).toBe(0);
    expect(stats.totalPerformance).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// projectFunding
// ---------------------------------------------------------------------------

describe("projectFunding", () => {
  it("calcule le financement d'un projet à partir des transactions rattachées", () => {
    const project = makeProject({ id: "p1", budget: 500000 });
    const txs = [
      makeTx({ projectId: "p1", type: "PROJECT", amount: 100000 }),
      makeTx({ projectId: "p1", type: "DEPOSIT", amount: 50000 }),
      makeTx({ projectId: "p1", type: "EXPENSE", amount: 30000 }),
      makeTx({ projectId: "p2", type: "PROJECT", amount: 200000 }), // autre projet
    ];
    const f = projectFunding(project, txs);
    expect(f.funded).toBe(150000); // PROJECT + DEPOSIT
    expect(f.spent).toBe(30000);
    expect(f.available).toBe(120000); // 150k - 30k
    expect(f.remainingToFund).toBe(350000); // 500k - 150k
    expect(f.financialProgress).toBeCloseTo(0.3, 2);
    expect(f.spentProgress).toBeCloseTo(0.06, 2);
  });

  it("retourne 0 pour un projet sans budget", () => {
    const project = makeProject({ id: "p1", budget: null });
    const f = projectFunding(project, []);
    expect(f.remainingToFund).toBe(0);
    expect(f.financialProgress).toBe(0);
  });

  it("financialProgress plafonnée à 1", () => {
    const project = makeProject({ id: "p1", budget: 100000 });
    const txs = [
      makeTx({ projectId: "p1", type: "PROJECT", amount: 200000 }), // sur-financé
    ];
    const f = projectFunding(project, txs);
    expect(f.financialProgress).toBe(1);
    expect(f.remainingToFund).toBe(0);
  });
});
