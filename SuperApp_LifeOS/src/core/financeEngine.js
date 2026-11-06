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

export function formatDateFR(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/** Calcule les soldes de chaque compte en fonction des transactions */
export function computeAccountBalances(accounts = [], transactions = []) {
  const map = new Map();
  for (const a of accounts) {
    map.set(a.id, {
      accountId: a.id,
      name: a.name,
      type: a.type,
      initial: Number(a.initialBalance) || 0,
      inflows: 0,
      outflows: 0,
      balance: Number(a.initialBalance) || 0
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

  const monthlyEssential = Math.max(0, essentialCharges || essentialCategories || 0);
  const target = monthlyEssential * (settings.emergencyFundMonths || 3);
  
  const cashStatus = computeCashStatus(finances.accounts, finances.transactions, settings.safetyMargin);
  const available = cashStatus.savingsCash || cashStatus.availableCash;
  const missing = Math.max(0, target - available);
  const percent = target > 0 ? Math.min(100, Math.round((available / target) * 100)) : 100;

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

/** Synthèse mensuelle réelle (Revenus, Dépenses réelles, Investissements, Épargne nette) */
export function computeMonthlyRealSummary(transactions = [], currentYearMonth) {
  const targetKey = currentYearMonth || new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  let income = 0;
  let expenses = 0;
  let fees = 0;
  let invested = 0;
  let donations = 0;

  for (const t of transactions) {
    if (!t.date || !t.date.startsWith(targetKey)) continue;
    const amount = Number(t.amount) || 0;
    const fee = Number(t.fee) || 0;

    if (t.type === 'INCOME' || t.type === 'DIVIDEND') {
      income += amount;
    } else if (t.type === 'EXPENSE') {
      expenses += amount + fee;
      fees += fee;
    } else if (t.type === 'DONATION') {
      donations += amount;
      expenses += amount + fee;
      fees += fee;
    } else if (t.type === 'INVESTMENT') {
      invested += amount;
      if (fee > 0) { expenses += fee; fees += fee; }
    } else if (t.type === 'TRANSFER') {
      if (fee > 0) { expenses += fee; fees += fee; }
    }
  }

  const netSavings = income - expenses - invested;
  return { income, expenses, fees, invested, donations, netSavings, key: targetKey };
}

/** Taux de couverture hors-salaire (indépendance financière) */
export function computeNonSalaryCoverage(finances) {
  const sources = finances.incomeSources || [];
  const nonSalaryMonthly = sources
    .filter(s => s.active && s.kind !== 'SALARY')
    .reduce((sum, s) => sum + (Number(s.monthlyAmount) || 0), 0);

  const ef = computeEmergencyFundStatus(finances);
  const essential = ef.monthlyEssential || 1;
  const coverageRatio = Math.min(100, Math.round((nonSalaryMonthly / essential) * 100));

  return { nonSalaryMonthly, essential, coverageRatio };
}

/** Génération automatique d'alertes financières pour le Cockpit */
export function generateFinancialAlerts(finances) {
  const alerts = [];
  const cashStatus = computeCashStatus(finances.accounts, finances.transactions, finances.settings?.safetyMargin || 0);
  const ef = computeEmergencyFundStatus(finances);
  const safetyMargin = Number(finances.settings?.safetyMargin) || 0;

  // Alerte 1 : Trésorerie libre
  if (cashStatus.availableCash <= 0 && cashStatus.totalCash > 0) {
    alerts.push({
      id: 'alt_margin',
      type: 'WARNING',
      title: 'Marge de sécurité entamée',
      message: `Votre trésorerie totale (${formatFCFA(cashStatus.totalCash)}) est inférieure ou égale à votre marge non mobilisable (${formatFCFA(safetyMargin)}).`,
      level: 'alert'
    });
  } else if (cashStatus.totalCash <= 0) {
    alerts.push({
      id: 'alt_nocash',
      type: 'DANGER',
      title: 'Trésorerie vide',
      message: 'Aucune liquidité disponible sur les comptes du foyer. Veuillez renflouer ou enregistrer vos soldes réels.',
      level: 'alert'
    });
  }

  // Alerte 2 : Fonds d'urgence incomplet
  if (ef.target > 0 && ef.percent < 50) {
    alerts.push({
      id: 'alt_ef_low',
      type: 'WARNING',
      title: `Fonds d'urgence critique (${ef.percent}%)`,
      message: `Votre réserve de sécurité est inférieure à la moitié de l'objectif (${formatFCFA(ef.missing)} manquants pour ${ef.months} mois de sérénité).`,
      level: 'warning'
    });
  }

  // Alerte 3 : Charges à échéance sous 10 jours
  const today = new Date();
  for (const ch of (finances.charges || [])) {
    if (!ch.active || !ch.nextDueDate) continue;
    const dueDate = new Date(ch.nextDueDate);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (diffDays >= 0 && diffDays <= 10) {
      alerts.push({
        id: 'alt_charge_' + ch.id,
        type: 'INFO',
        title: `Échéance proche : ${ch.label}`,
        message: `${formatFCFA(ch.amount)} prévu(s) dans ${diffDays === 0 ? "aujourd'hui" : diffDays + ' jours'} (${ch.nextDueDate}).`,
        level: 'info'
      });
    }
  }

  return alerts;
}

/** Analyseur « Puis-je me le permettre ? » */
export function analyzePurchaseDecision(finances, amount, type = 'ACHAT') {
  const val = Number(amount) || 0;
  if (val <= 0) return null;

  const ef = computeEmergencyFundStatus(finances);
  const cashStatus = computeCashStatus(finances.accounts, finances.transactions, finances.settings?.safetyMargin || 0);
  const freeCash = cashStatus.availableCash;

  const monthlySalary = Number(finances.monthlySalary) || 0;
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
  } else if (val > (freeCash - ef.target) && ef.available < ef.target && ef.target > 0) {
    verdict = 'RISQUE';
    badgeColor = 'var(--alert-red)';
    explanation = `Bien que le solde total suffise, le fonds d'urgence n'est pas encore complet (${ef.percent}%). Ce décaissement réduirait encore votre sécurité en cas de coup dur.`;
    consequences.push(`Retarde la complétion du fonds d'urgence (${formatFCFA(ef.missing)} manquants).`);
  } else if (monthlySalary > 0 && val > currentResteAVivre && type === 'ACHAT') {
    verdict = 'FAISABLE_SOUS_CONDITIONS';
    badgeColor = 'var(--gold)';
    explanation = `Faisable en étalant sur plusieurs mois ou en prélevant sur une enveloppe Projets/Plaisir, car le montant dépasse le reste à vivre libre de ce mois (${formatFCFA(currentResteAVivre)}).`;
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

/** Calcule la capacité financière détaillée du foyer (Revenus, Essentiels, Épargne, Investissement) */
export function computeFinancialCapacity(finances, today = new Date()) {
  const salary = Number(finances.monthlySalary) || 0;
  const sources = finances.incomeSources || [];
  const otherRecurringIncome = sources
    .filter(s => s.active && s.kind !== 'SALARY')
    .reduce((sum, s) => sum + (Number(s.monthlyAmount) || 0), 0);
  const expectedMonthlyIncome = salary + otherRecurringIncome;

  const ef = computeEmergencyFundStatus(finances);
  const essentialExpenses = ef.monthlyEssential || 0;

  // Dépenses non obligatoires budgétées
  const nonObligatoryEnvelopes = (finances.envelopes || [])
    .filter(e => e.group !== 'OBLIGATOIRE')
    .reduce((sum, e) => sum + (Number(e.allocated) || 0), 0);

  const savingsCapacity = Math.max(0, expectedMonthlyIncome - essentialExpenses - nonObligatoryEnvelopes);
  const emergencyFundContribution = ef.percent < 100 ? Math.min(savingsCapacity * 0.4, ef.missing) : 0;
  const projectAllocation = Math.max(0, (savingsCapacity - emergencyFundContribution) * 0.5);
  const investmentCapacity = Math.max(0, savingsCapacity - emergencyFundContribution - projectAllocation);

  return {
    salary,
    otherRecurringIncome,
    expectedMonthlyIncome,
    essentialExpenses,
    savingsCapacity,
    emergencyFundContribution,
    projectAllocation,
    investmentCapacity
  };
}

/** Projection de solde de fin de mois */
export function projectEndOfMonth(finances, today = new Date()) {
  const cashStatus = computeCashStatus(finances.accounts, finances.transactions, finances.settings?.safetyMargin || 0);
  const currentCash = cashStatus.totalCash;

  const currentYearMonth = today.toISOString().slice(0, 7);
  const summary = computeMonthlyRealSummary(finances.transactions || [], currentYearMonth);

  // Charges restant à payer d'ici la fin du mois
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  const daysLeft = lastDayOfMonth - currentDay;

  let remainingCharges = 0;
  for (const ch of (finances.charges || [])) {
    if (!ch.active || !ch.nextDueDate) continue;
    const dueDate = new Date(ch.nextDueDate);
    if (dueDate.getFullYear() === today.getFullYear() && dueDate.getMonth() === today.getMonth() && dueDate.getDate() >= currentDay) {
      remainingCharges += Number(ch.amount) || 0;
    }
  }

  const projectedEndingCash = Math.max(0, currentCash - remainingCharges);
  return {
    currentCash,
    projectedEndingCash,
    remainingCharges,
    daysLeft,
    currentIncomeMonth: summary.income,
    currentExpensesMonth: summary.expenses
  };
}

/** Ventilation des dépenses du mois par catégorie */
export function computeExpenseBreakdown(transactions = [], yearMonth) {
  const targetKey = yearMonth || new Date().toISOString().slice(0, 7);
  const map = new Map();

  for (const t of transactions) {
    if (!t.date || !t.date.startsWith(targetKey) || t.type !== 'EXPENSE') continue;
    const cat = t.categoryId || 'cat_autre';
    const amount = Number(t.amount) || 0;
    map.set(cat, (map.get(cat) || 0) + amount);
  }

  const result = [];
  for (const [categoryId, total] of map.entries()) {
    result.push({ categoryId, total });
  }
  return result.sort((a, b) => b.total - a.total);
}

