// LifeOS — Moteur financier unifié (Offline-first, autonome)
// RÈGLES FONDAMENTALES DE LIFEOS :
// 1. Un transfert ne crée ni revenu ni dépense (seuls les frais éventuels sont une dépense).
// 2. Un investissement déplace du cash vers un actif : le patrimoine ne diminue pas.
// 3. Une provision ne crée pas de dépense réelle immédiate.
// 4. Une simulation ne modifie jamais les données réelles.

export function formatFCFA(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return '0 FCFA';
  }
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '−' : '';
  const abs = Math.abs(rounded);
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  return `${sign}${formatted} FCFA`;
}

export function formatCompactFCFA(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')} M`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)} k`;
  }
  return `${sign}${abs}`;
}

/** Calcule les soldes de chaque compte en fonction des transactions */
export function computeAccountBalances(accounts = [], transactions = []) {
  const map = new Map();
  for (const a of accounts) {
    map.set(a.id, {
      accountId: a.id,
      name: a.name,
      type: a.type,
      initial: a.initialBalance || 0,
      inflows: 0,
      outflows: 0,
      balance: a.initialBalance || 0
    });
  }

  for (const t of transactions) {
    const src = map.get(t.accountId);
    const amount = Number(t.amount) || 0;
    const fee = Number(t.fee) || 0;

    if (src) {
      if (['EXPENSE', 'DONATION', 'INVESTMENT', 'TRANSFER', 'WITHDRAWAL', 'ASSET_BUY'].includes(t.type)) {
        src.outflows += amount + fee;
      } else if (['INCOME', 'DIVIDEND', 'DEPOSIT', 'ASSET_SELL'].includes(t.type)) {
        src.inflows += amount;
      } else if (t.type === 'ADJUSTMENT') {
        if (amount >= 0) src.inflows += amount;
        else src.outflows += -amount;
      }
    }

    if (t.toAccountId) {
      const dst = map.get(t.toAccountId);
      if (dst && t.type === 'TRANSFER') {
        dst.inflows += amount;
      }
    }
  }

  for (const b of map.values()) {
    b.balance = b.initial + b.inflows - b.outflows;
  }
  return map;
}

/** Calcule la trésorerie totale et disponible (hors marge de sécurité) */
export function computeCashStatus(accounts = [], transactions = [], safetyMargin = 0) {
  const balances = computeAccountBalances(accounts, transactions);
  let totalCash = 0;
  let savingsCash = 0;

  for (const a of accounts) {
    if (a.archived) continue;
    const b = balances.get(a.id)?.balance || 0;
    if (a.type === 'SAVINGS') {
      savingsCash += b;
    }
    if (['CASH', 'MOBILE_MONEY', 'BANK', 'SAVINGS', 'BUSINESS'].includes(a.type)) {
      totalCash += b;
    }
  }

  const availableCash = Math.max(0, totalCash - (Number(safetyMargin) || 0));
  return { totalCash, savingsCash, availableCash, balances };
}

/** Calcule le statut du fonds d'urgence */
export function computeEmergencyFundStatus(finances) {
  const categories = finances.categories || [];
  const charges = finances.charges || [];
  const settings = finances.settings || { emergencyFundMonths: 3 };

  // Dépenses essentielles mensuelles = charges actives mensuelles + catégories marquées "essential"
  let essentialCharges = 0;
  for (const ch of charges) {
    if (ch.active && ch.frequency === 'MONTHLY') {
      essentialCharges += Number(ch.amount) || 0;
    }
  }

  let essentialCategories = 0;
  for (const cat of categories) {
    if (cat.essential && cat.budgetMonthly) {
      essentialCategories += Number(cat.budgetMonthly) || 0;
    }
  }

  const monthlyEssential = Math.max(50000, essentialCharges || essentialCategories || 75000);
  const target = monthlyEssential * (settings.emergencyFundMonths || 3);
  
  const cashStatus = computeCashStatus(finances.accounts, finances.transactions, settings.safetyMargin);
  const available = cashStatus.savingsCash || cashStatus.availableCash;
  const missing = Math.max(0, target - available);
  const percent = Math.min(100, Math.round((available / target) * 100));

  return { monthlyEssential, target, available, missing, percent, months: settings.emergencyFundMonths || 3 };
}

/** Calcule la valeur nette du patrimoine */
export function computeNetWorth(finances) {
  const accounts = finances.accounts || [];
  const transactions = finances.transactions || [];
  const assets = finances.assets || [];
  const liabilities = finances.liabilities || [];
  const positions = finances.positions || [];
  const copyTrading = finances.copyTrading || [];
  const otherInvestments = finances.otherInvestments || [];

  const { totalCash } = computeCashStatus(accounts, transactions, 0);

  // Valeur totale des actifs physiques
  const totalAssets = assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);

  // Valeur boursière BRVM
  const totalBrvm = positions
    .filter(p => p.active !== false)
    .reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.currentPrice) || Number(p.avgBuyPrice) || 0)), 0);

  // Autres investissements
  const totalCopyTrading = copyTrading.reduce((sum, c) => sum + (Number(c.currentValue) || 0), 0);
  const totalOther = otherInvestments.reduce((sum, o) => sum + (Number(o.currentValue) || 0), 0);

  // Dettes / Passifs
  const totalLiabilities = liabilities.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  const grossWorth = totalCash + totalAssets + totalBrvm + totalCopyTrading + totalOther;
  const netWorth = grossWorth - totalLiabilities;

  return {
    netWorth,
    grossWorth,
    totalCash,
    totalAssets,
    totalBrvm,
    totalInvestments: totalBrvm + totalCopyTrading + totalOther,
    totalLiabilities
  };
}

/** Analyseur « Puis-je me le permettre ? » */
export function analyzePurchaseDecision(finances, amount, type = 'ACHAT') {
  const val = Number(amount) || 0;
  if (val <= 0) return null;

  const ef = computeEmergencyFundStatus(finances);
  const cashStatus = computeCashStatus(finances.accounts, finances.transactions, finances.settings?.safetyMargin || 0);
  const freeCash = cashStatus.availableCash;

  // Calcul du reste à vivre moyen
  const monthlySalary = Number(finances.monthlySalary) || 203000;
  const totalSpentEnvelopes = (finances.envelopes || []).reduce((sum, e) => sum + (e.spent || 0), 0);
  const currentResteAVivre = monthlySalary - totalSpentEnvelopes;

  let verdict = 'FAISABLE';
  let badgeColor = 'var(--neon-green)';
  let explanation = '';
  const consequences = [];

  if (val > freeCash) {
    verdict = 'NON_COMPATIBLE';
    badgeColor = 'var(--alert-red)';
    explanation = `Trésorerie disponible insuffisante (${formatFCFA(freeCash)} disponible vs ${formatFCFA(val)} requis). Cette dépense mettrait le foyer à découvert ou empiéterait sur la marge de sécurité inviolable.`;
    consequences.push(`Déficit immédiat de trésorerie de ${formatFCFA(val - freeCash)}.`);
  } else if (val > (freeCash - ef.target) && ef.available < ef.target) {
    verdict = 'RISQUE';
    badgeColor = 'var(--alert-red)';
    explanation = `Bien que le solde total suffise, le fonds d'urgence n'est pas encore complet (${ef.percent}%). Ce décaissement réduirait encore votre sécurité en cas de coup dur.`;
    consequences.push(`Retarde la complétion du fonds d'urgence (${formatFCFA(ef.missing)} manquants).`);
  } else if (val > currentResteAVivre && type === 'ACHAT') {
    verdict = 'FAISABLE_SOUS_CONDITIONS';
    badgeColor = 'var(--gold)';
    explanation = `Faisable en étalant sur plusieurs mois ou en prélevant sur l'enveloppe Projets/Plaisir, car le montant dépasse le reste à vivre libre de ce mois (${formatFCFA(currentResteAVivre)}).`;
    consequences.push(`Reste à vivre mensuel temporairement réduit.`);
  } else {
    verdict = 'FAISABLE';
    badgeColor = 'var(--neon-green)';
    explanation = `Trésorerie et marge de sécurité saines. Le fonds d'urgence et les charges courantes restent protégés.`;
    consequences.push(`La trésorerie disponible restera confortable à ${formatFCFA(freeCash - val)}.`);
  }

  return {
    verdict,
    badgeColor,
    explanation,
    consequences,
    freeCashAfter: Math.max(0, freeCash - val),
    freeCashBefore: freeCash
  };
}

/** Simulateur d'intérêts composés */
export function simulateCompoundInterest({ initial = 0, monthly = 50000, years = 5, ratePct = 10, feesPct = 1 }) {
  const netRate = Math.max(0, (ratePct - feesPct) / 100);
  const monthlyRate = netRate / 12;
  const totalMonths = Math.max(1, years * 12);

  let current = initial;
  let totalContributed = initial;
  const yearlyBreakdown = [];

  for (let m = 1; m <= totalMonths; m++) {
    current = current * (1 + monthlyRate) + monthly;
    totalContributed += monthly;

    if (m % 12 === 0 || m === totalMonths) {
      yearlyBreakdown.push({
        year: Math.ceil(m / 12),
        totalContributed: Math.round(totalContributed),
        totalValue: Math.round(current),
        gains: Math.round(current - totalContributed)
      });
    }
  }

  return {
    finalValue: Math.round(current),
    totalContributed: Math.round(totalContributed),
    totalGains: Math.round(current - totalContributed),
    yearlyBreakdown
  };
}

