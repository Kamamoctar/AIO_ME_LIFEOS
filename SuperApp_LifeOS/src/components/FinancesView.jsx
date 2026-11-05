import React, { useState } from 'react';
import { 
  TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, Plus, 
  Users, Shield, PieChart, Calendar, AlertCircle, Building2, 
  Smartphone, Banknote, PiggyBank, ArrowLeftRight, Trash2, 
  Settings, CheckCircle2, AlertTriangle, HelpCircle, Download, 
  Upload, Tag, Scale, Landmark, Calculator, Sparkles, ChevronRight,
  Clock, DollarSign, HeartHandshake, Eye, Edit3, X, Check, Target
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { 
  formatFCFA, 
  formatCompactFCFA, 
  computeAccountBalances, 
  computeCashStatus, 
  computeEmergencyFundStatus, 
  computeNetWorth, 
  computeNonSalaryCoverage,
  generateFinancialAlerts,
  analyzePurchaseDecision, 
  simulateCompoundInterest 
} from '../core/financeEngine.js';

export default function FinancesView({
  finances,
  onUpdateFinances,
  onAddXp,
  theme
}) {
  const [activeSubTab, setActiveSubTab] = useState('cockpit'); // 'cockpit', 'budget', 'accounts', 'patrimoine', 'investments', 'goals', 'decisions', 'settings'

  // Income / Salary edit modal
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [editSalaryInput, setEditSalaryInput] = useState(finances.monthlySalary || '');
  const [editTargetInput, setEditTargetInput] = useState(finances.targetIncome || '');

  // Transactions form state
  const [txLabel, setTxLabel] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txFee, setTxFee] = useState('');
  const [txAccount, setTxAccount] = useState(finances.settings?.defaultAccountId || (finances.accounts?.[0]?.id || ''));
  const [txType, setTxType] = useState('EXPENSE');
  const [txCategory, setTxCategory] = useState(finances.categories?.[0]?.id || 'cat_alim');
  const [txEnvelope, setTxEnvelope] = useState(finances.envelopes?.[0]?.id || '');
  const [txFilter, setTxFilter] = useState('ALL');

  // Transfer form state
  const [transferFrom, setTransferFrom] = useState(finances.accounts?.[0]?.id || '');
  const [transferTo, setTransferTo] = useState(finances.accounts?.[1]?.id || finances.accounts?.[0]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferFee, setTransferFee] = useState('');

  // New Account form state
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState('MOBILE_MONEY');
  const [newAccBalance, setNewAccBalance] = useState('');

  // New Asset / Liability form state
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState('LAND');
  const [newAssetValue, setNewAssetValue] = useState('');

  const [newLiabName, setNewLiabName] = useState('');
  const [newLiabAmount, setNewLiabAmount] = useState('');
  const [newLiabMonthly, setNewLiabMonthly] = useState('');

  // BRVM Form state
  const [newPosCompany, setNewPosCompany] = useState('');
  const [newPosTicker, setNewPosTicker] = useState('');
  const [newPosQty, setNewPosQty] = useState('');
  const [newPosBuyPrice, setNewPosBuyPrice] = useState('');
  const [newPosCurrentPrice, setNewPosCurrentPrice] = useState('');

  // Financial Goal Form state
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalCurrent, setNewGoalCurrent] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');

  // New Envelope / Charge form state
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvAllocated, setNewEnvAllocated] = useState('');
  const [newEnvGroup, setNewEnvGroup] = useState('OBLIGATOIRE');

  const [newChargeLabel, setNewChargeLabel] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState('');
  const [newChargeFreq, setNewChargeFreq] = useState('MONTHLY');
  const [newChargeDue, setNewChargeDue] = useState('');

  // Decision Simulator state
  const [decisionAmount, setDecisionAmount] = useState('');
  const [decisionType, setDecisionType] = useState('ACHAT');
  const [decisionResult, setDecisionResult] = useState(null);

  // Compound Simulator state
  const [simInitial, setSimInitial] = useState(100000);
  const [simMonthly, setSimMonthly] = useState(50000);
  const [simYears, setSimYears] = useState(5);
  const [simRate, setSimRate] = useState(10);

  // Settings form states
  const [newIncomeLabel, setNewIncomeLabel] = useState('');
  const [newIncomeKind, setNewIncomeKind] = useState('SALARY');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');

  const [newDepName, setNewDepName] = useState('');
  const [newDepRelation, setNewDepRelation] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatKind, setNewCatKind] = useState('EXPENSE');
  const [newCatEssential, setNewCatEssential] = useState(false);
  const [newCatBudget, setNewCatBudget] = useState('');

  const [clarifAnswer, setClarifAnswer] = useState(finances.clarification3m?.answer || '');

  // Derived financial computations
  const currentSalary = Number(finances.monthlySalary) || 0;
  const targetIncome = Number(finances.targetIncome) || 0;
  const incomePercent = targetIncome > 0 ? Math.min(100, Math.round((currentSalary / targetIncome) * 100)) : 0;
  const multiplierFactor = currentSalary > 0 && targetIncome > 0 ? (targetIncome / currentSalary).toFixed(1) : 'x3.6';

  const cashStatus = computeCashStatus(finances.accounts, finances.transactions, finances.settings?.safetyMargin || 0);
  const efStatus = computeEmergencyFundStatus(finances);
  const netWorthData = computeNetWorth(finances);
  const nonSalaryCoverage = computeNonSalaryCoverage(finances);
  const financialAlerts = generateFinancialAlerts(finances);

  const totalSpentEnvelopes = (finances.envelopes || []).reduce((sum, e) => sum + (e.spent || 0), 0);
  const totalAllocatedEnvelopes = (finances.envelopes || []).reduce((sum, e) => sum + (e.allocated || 0), 0);
  const resteAVivre = currentSalary > 0 ? (currentSalary - totalSpentEnvelopes) : cashStatus.availableCash;

  // Audit event logger helper
  const logAudit = (action, entity, label) => {
    const event = {
      id: 'aud_' + Date.now(),
      actorName: finances.couple?.members?.[0]?.name || 'Administrateur',
      action,
      entity,
      summary: JSON.stringify({ label, time: new Date().toISOString() }),
      createdAt: new Date().toISOString()
    };
    return [event, ...(finances.auditEvents || []).slice(0, 99)];
  };

  // --- ACTIONS ---

  // 0. Update Salary & Target Income
  const handleSaveSalary = () => {
    const sal = parseInt(editSalaryInput, 10) || 0;
    const tgt = parseInt(editTargetInput, 10) || 0;
    sound.playLevelUp();

    const updatedAudits = logAudit('a mis à jour', 'le salaire et la cible', `${formatFCFA(sal)} -> ${formatFCFA(tgt)}`);

    onUpdateFinances({
      ...finances,
      monthlySalary: sal,
      targetIncome: tgt,
      auditEvents: updatedAudits
    });

    onAddXp(5, 'DSC');
    setIsSalaryModalOpen(false);
  };

  // 1. Add Transaction
  const handleAddTransaction = () => {
    const amountNum = parseInt(txAmount, 10);
    const feeNum = parseInt(txFee, 10) || 0;
    if (!txLabel.trim() || isNaN(amountNum) || amountNum <= 0) return;

    sound.playClick();
    const targetAcc = txAccount || finances.accounts?.[0]?.id || 'acc_default';

    const newTx = {
      id: 'tx_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      label: txLabel.trim(),
      amount: amountNum,
      fee: feeNum,
      type: txType,
      accountId: targetAcc,
      categoryId: txCategory,
      envelopeId: txEnvelope || null,
      isShared: true
    };

    // Update envelope spent if it's an expense
    let updatedEnvelopes = finances.envelopes || [];
    if (txType === 'EXPENSE' && txEnvelope) {
      updatedEnvelopes = updatedEnvelopes.map(env => {
        if (env.id === txEnvelope) return { ...env, spent: (env.spent || 0) + amountNum };
        return env;
      });
    }

    const updatedAudits = logAudit('a enregistré', `l'opération « ${txLabel.trim()} »`, `${formatFCFA(amountNum)}`);

    onUpdateFinances({
      ...finances,
      envelopes: updatedEnvelopes,
      transactions: [newTx, ...(finances.transactions || [])],
      auditEvents: updatedAudits
    });

    onAddXp(2, 'DSC');
    setTxLabel('');
    setTxAmount('');
    setTxFee('');
  };

  // Delete Transaction
  const handleDeleteTransaction = (txId) => {
    sound.playClick();
    const updated = (finances.transactions || []).filter(t => t.id !== txId);
    onUpdateFinances({ ...finances, transactions: updated });
  };

  // 2. Transfer between Accounts (Zero False Expense)
  const handleTransfer = () => {
    const amountNum = parseInt(transferAmount, 10);
    const feeNum = parseInt(transferFee, 10) || 0;
    if (isNaN(amountNum) || amountNum <= 0 || !transferFrom || !transferTo || transferFrom === transferTo) return;

    sound.playLevelUp();
    const fromAcc = (finances.accounts || []).find(a => a.id === transferFrom);
    const toAcc = (finances.accounts || []).find(a => a.id === transferTo);

    const newTx = {
      id: 'tx_tf_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      label: `Virement : ${fromAcc?.name || 'Source'} → ${toAcc?.name || 'Destinataire'}`,
      amount: amountNum,
      fee: feeNum,
      type: 'TRANSFER',
      accountId: transferFrom,
      toAccountId: transferTo,
      isShared: true
    };

    const updatedAudits = logAudit('a effectué', `le virement de ${fromAcc?.name} vers ${toAcc?.name}`, `${formatFCFA(amountNum)} (frais: ${formatFCFA(feeNum)})`);

    onUpdateFinances({
      ...finances,
      transactions: [newTx, ...(finances.transactions || [])],
      auditEvents: updatedAudits
    });

    onAddXp(3, 'DSC');
    setTransferAmount('');
    setTransferFee('');
  };

  // 3. Add Account
  const handleAddAccount = () => {
    if (!newAccName.trim()) return;
    const initialNum = parseInt(newAccBalance, 10) || 0;
    sound.playClick();

    const newAcc = {
      id: 'acc_' + Date.now(),
      name: newAccName.trim(),
      type: newAccType,
      initialBalance: initialNum,
      institution: newAccName.trim(),
      archived: false
    };

    const updatedAudits = logAudit('a créé', `le compte « ${newAccName.trim()} »`, `Solde initial: ${formatFCFA(initialNum)}`);

    onUpdateFinances({
      ...finances,
      accounts: [...(finances.accounts || []), newAcc],
      auditEvents: updatedAudits
    });

    setNewAccName('');
    setNewAccBalance('');
  };

  // Delete Account
  const handleDeleteAccount = (accId) => {
    sound.playClick();
    const updated = (finances.accounts || []).filter(a => a.id !== accId);
    onUpdateFinances({ ...finances, accounts: updated });
  };

  // 4. Add Asset
  const handleAddAsset = () => {
    if (!newAssetName.trim() || !newAssetValue) return;
    sound.playClick();
    const val = parseInt(newAssetValue, 10) || 0;

    const newAst = {
      id: 'ast_' + Date.now(),
      name: newAssetName.trim(),
      type: newAssetType,
      value: val,
      notes: 'Ajouté au patrimoine'
    };

    const updatedAudits = logAudit('a ajouté', `l'actif « ${newAssetName.trim()} »`, `${formatFCFA(val)}`);

    onUpdateFinances({
      ...finances,
      assets: [...(finances.assets || []), newAst],
      auditEvents: updatedAudits
    });

    setNewAssetName('');
    setNewAssetValue('');
  };

  const handleDeleteAsset = (id) => {
    sound.playClick();
    const updated = (finances.assets || []).filter(a => a.id !== id);
    onUpdateFinances({ ...finances, assets: updated });
  };

  // 5. Add Liability / Debt
  const handleAddLiability = () => {
    if (!newLiabName.trim() || !newLiabAmount) return;
    sound.playClick();
    const amt = parseInt(newLiabAmount, 10) || 0;
    const mth = parseInt(newLiabMonthly, 10) || 0;

    const newLiab = {
      id: 'liab_' + Date.now(),
      name: newLiabName.trim(),
      amount: amt,
      monthlyPayment: mth,
      notes: 'Dette / Passif déclaré'
    };

    const updatedAudits = logAudit('a enregistré', `la dette « ${newLiabName.trim()} »`, `${formatFCFA(amt)}`);

    onUpdateFinances({
      ...finances,
      liabilities: [...(finances.liabilities || []), newLiab],
      auditEvents: updatedAudits
    });

    setNewLiabName('');
    setNewLiabAmount('');
    setNewLiabMonthly('');
  };

  const handleDeleteLiability = (id) => {
    sound.playClick();
    const updated = (finances.liabilities || []).filter(l => l.id !== id);
    onUpdateFinances({ ...finances, liabilities: updated });
  };

  // 6. Add BRVM Position
  const handleAddBrvmPosition = () => {
    if (!newPosTicker.trim() || !newPosQty || !newPosBuyPrice) return;
    sound.playClick();
    const qty = parseInt(newPosQty, 10) || 0;
    const buy = parseInt(newPosBuyPrice, 10) || 0;
    const cur = parseInt(newPosCurrentPrice, 10) || buy;

    const newPos = {
      id: 'pos_' + Date.now(),
      ticker: newPosTicker.trim().toUpperCase(),
      companyName: newPosCompany.trim() || newPosTicker.trim().toUpperCase(),
      quantity: qty,
      avgBuyPrice: buy,
      currentPrice: cur,
      active: true
    };

    const updatedAudits = logAudit('a acheté', `l'action BRVM ${newPosTicker.trim().toUpperCase()}`, `${qty} titres à ${formatFCFA(buy)}`);

    onUpdateFinances({
      ...finances,
      positions: [...(finances.positions || []), newPos],
      auditEvents: updatedAudits
    });

    setNewPosCompany('');
    setNewPosTicker('');
    setNewPosQty('');
    setNewPosBuyPrice('');
    setNewPosCurrentPrice('');
  };

  const handleDeletePosition = (id) => {
    sound.playClick();
    const updated = (finances.positions || []).filter(p => p.id !== id);
    onUpdateFinances({ ...finances, positions: updated });
  };

  // 7. Add Financial Goal
  const handleAddGoal = () => {
    if (!newGoalTitle.trim() || !newGoalTarget) return;
    sound.playClick();
    const tgt = parseInt(newGoalTarget, 10) || 0;
    const cur = parseInt(newGoalCurrent, 10) || 0;

    const newGoal = {
      id: 'goal_' + Date.now(),
      title: newGoalTitle.trim(),
      targetAmount: tgt,
      currentAmount: cur,
      targetDate: newGoalDate || '',
      status: 'IN_PROGRESS'
    };

    const updatedAudits = logAudit('a fixé', `l'objectif financier « ${newGoalTitle.trim()} »`, `${formatFCFA(tgt)}`);

    onUpdateFinances({
      ...finances,
      goals: [...(finances.goals || []), newGoal],
      auditEvents: updatedAudits
    });

    setNewGoalTitle('');
    setNewGoalTarget('');
    setNewGoalCurrent('');
    setNewGoalDate('');
  };

  const handleDeleteGoal = (id) => {
    sound.playClick();
    const updated = (finances.goals || []).filter(g => g.id !== id);
    onUpdateFinances({ ...finances, goals: updated });
  };

  // 8. Add Envelope & Charge
  const handleAddEnvelope = () => {
    if (!newEnvName.trim()) return;
    sound.playClick();
    const alloc = parseInt(newEnvAllocated, 10) || 0;

    const newEnv = {
      id: 'env_' + Date.now(),
      name: newEnvName.trim(),
      allocated: alloc,
      spent: 0,
      group: newEnvGroup
    };

    onUpdateFinances({
      ...finances,
      envelopes: [...(finances.envelopes || []), newEnv]
    });

    setNewEnvName('');
    setNewEnvAllocated('');
  };

  const handleDeleteEnvelope = (id) => {
    sound.playClick();
    const updated = (finances.envelopes || []).filter(e => e.id !== id);
    onUpdateFinances({ ...finances, envelopes: updated });
  };

  const handleAddCharge = () => {
    if (!newChargeLabel.trim() || !newChargeAmount) return;
    sound.playClick();
    const amt = parseInt(newChargeAmount, 10) || 0;

    const newCh = {
      id: 'ch_' + Date.now(),
      label: newChargeLabel.trim(),
      amount: amt,
      frequency: newChargeFreq,
      nextDueDate: newChargeDue || new Date().toISOString().split('T')[0],
      active: true
    };

    onUpdateFinances({
      ...finances,
      charges: [...(finances.charges || []), newCh]
    });

    setNewChargeLabel('');
    setNewChargeAmount('');
    setNewChargeDue('');
  };

  const handleDeleteCharge = (id) => {
    sound.playClick();
    const updated = (finances.charges || []).filter(c => c.id !== id);
    onUpdateFinances({ ...finances, charges: updated });
  };

  // 9. Monthly Snapshot (Closure)
  const handleSnapshotMonth = () => {
    sound.playLevelUp();
    const monthKey = new Date().toISOString().slice(0, 7);
    const snap = {
      id: 'snap_' + Date.now(),
      month: monthKey,
      date: new Date().toISOString(),
      netWorth: netWorthData.netWorth,
      totalCash: cashStatus.totalCash,
      salary: currentSalary,
      totalSpent: totalSpentEnvelopes
    };

    const updatedAudits = logAudit('a clôturé', `le mois comptable ${monthKey}`, `Patrimoine: ${formatFCFA(netWorthData.netWorth)}`);

    onUpdateFinances({
      ...finances,
      snapshots: [snap, ...(finances.snapshots || [])],
      auditEvents: updatedAudits
    });

    onAddXp(20, 'DSC');
    alert(`Mois ${monthKey} clôturé et archivé avec succès !`);
  };

  // 10. Purchase Decision Analysis
  const handleAnalyzeDecision = () => {
    sound.playClick();
    const result = analyzePurchaseDecision(finances, decisionAmount, decisionType);
    setDecisionResult(result);
  };

  // 11. Add Income Source (Settings)
  const handleAddIncomeSource = () => {
    if (!newIncomeLabel.trim() || !newIncomeAmount) return;
    sound.playClick();
    const amt = parseInt(newIncomeAmount, 10) || 0;

    const newSrc = {
      id: 'src_' + Date.now(),
      label: newIncomeLabel.trim(),
      kind: newIncomeKind,
      monthlyAmount: amt,
      active: true
    };

    const updatedAudits = logAudit('a ajouté', `la source de revenu « ${newIncomeLabel.trim()} »`, `${formatFCFA(amt)} / mois`);

    onUpdateFinances({
      ...finances,
      incomeSources: [...(finances.incomeSources || []), newSrc],
      auditEvents: updatedAudits
    });

    setNewIncomeLabel('');
    setNewIncomeAmount('');
  };

  const handleDeleteIncomeSource = (id) => {
    sound.playClick();
    const updated = (finances.incomeSources || []).filter(s => s.id !== id);
    onUpdateFinances({ ...finances, incomeSources: updated });
  };

  // 12. Add Dependent (Settings)
  const handleAddDependent = () => {
    if (!newDepName.trim()) return;
    sound.playClick();

    const newDep = {
      id: 'dep_' + Date.now(),
      name: newDepName.trim(),
      relationship: newDepRelation.trim() || 'Membre du foyer',
      active: true
    };

    const updatedAudits = logAudit('a ajouté', `la personne à charge « ${newDepName.trim()} »`, newDepRelation);

    onUpdateFinances({
      ...finances,
      dependents: [...(finances.dependents || []), newDep],
      auditEvents: updatedAudits
    });

    setNewDepName('');
    setNewDepRelation('');
  };

  const handleDeleteDependent = (id) => {
    sound.playClick();
    const updated = (finances.dependents || []).filter(d => d.id !== id);
    onUpdateFinances({ ...finances, dependents: updated });
  };

  // 13. Add Category (Settings)
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    sound.playClick();
    const budgetNum = parseInt(newCatBudget, 10) || 0;

    const newCat = {
      id: 'cat_' + Date.now(),
      name: newCatName.trim(),
      kind: newCatKind,
      essential: newCatEssential,
      budgetMonthly: budgetNum
    };

    const updatedAudits = logAudit('a créé', `la catégorie « ${newCatName.trim()} »`, `${newCatKind} - ${newCatEssential ? 'Essentielle' : 'Secondaire'}`);

    onUpdateFinances({
      ...finances,
      categories: [...(finances.categories || []), newCat],
      auditEvents: updatedAudits
    });

    setNewCatName('');
    setNewCatBudget('');
    setNewCatEssential(false);
  };

  const handleDeleteCategory = (id) => {
    sound.playClick();
    const updated = (finances.categories || []).filter(c => c.id !== id);
    onUpdateFinances({ ...finances, categories: updated });
  };

  // 14. Save Settings Updates
  const handleUpdateSettings = (updates) => {
    sound.playClick();
    const nextSettings = { ...(finances.settings || {}), ...updates };
    const updatedAudits = logAudit('a modifié', 'les réglages financiers', JSON.stringify(updates));

    onUpdateFinances({
      ...finances,
      settings: nextSettings,
      auditEvents: updatedAudits
    });
  };

  // 15. Save Clarification
  const handleSaveClarification = () => {
    if (!clarifAnswer.trim()) return;
    sound.playLevelUp();
    const nextClarif = {
      ...(finances.clarification3m || {}),
      answer: clarifAnswer.trim(),
      resolved: true
    };

    const updatedAudits = logAudit('a enregistré', 'la clarification structurante des 3 330 000 FCFA', clarifAnswer.trim());

    onUpdateFinances({
      ...finances,
      clarification3m: nextClarif,
      auditEvents: updatedAudits
    });
    alert('Clarification des 3 330 000 FCFA enregistrée !');
  };

  // Filtered transactions
  const filteredTransactions = (finances.transactions || []).filter(tx => {
    if (txFilter === 'ALL') return true;
    if (txFilter === 'EXPENSE') return tx.type === 'EXPENSE';
    if (txFilter === 'INCOME') return tx.type === 'INCOME' || tx.type === 'DIVIDEND';
    if (txFilter === 'TRANSFER') return tx.type === 'TRANSFER';
    return true;
  });

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '100%', boxSizing: 'border-box' }} className="animate-float">
      
      {/* 1. Global Multiplier Gauge & Salary Header */}
      <div className="neuro-card" style={{ borderColor: 'var(--gold)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} color="var(--gold)" />
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 11, fontWeight: 800, color: 'var(--gold)', letterSpacing: 0.5 }}>
              OBJECTIF MULTIPLICATEUR REVENU ({multiplierFactor})
            </span>
          </div>
          
          <button
            onClick={() => {
              setEditSalaryInput(finances.monthlySalary || '');
              setEditTargetInput(finances.targetIncome || '');
              setIsSalaryModalOpen(true);
            }}
            style={{
              background: 'rgba(255, 215, 0, 0.15)',
              border: '1px solid var(--gold)',
              color: 'var(--gold)',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer'
            }}
          >
            <Edit3 size={11} /> MODIFIER
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '8px 0 6px' }}>
          <div>
            <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>SALAIRE ACTUEL DÉCLARÉ</span>
            <div style={{ fontSize: 19, fontWeight: 900, fontFamily: 'var(--font-title)', color: currentSalary > 0 ? '#fff' : 'var(--text-dim)' }}>
              {currentSalary > 0 ? formatFCFA(currentSalary) : '0 FCFA (Non défini)'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>CIBLE MENSUELLE VISÉE</span>
            <div style={{ fontSize: 19, fontWeight: 900, fontFamily: 'var(--font-title)', color: targetIncome > 0 ? 'var(--gold)' : 'var(--text-dim)' }}>
              {targetIncome > 0 ? formatFCFA(targetIncome) : 'Non définie'}
            </div>
          </div>
        </div>

        <div className="hud-bar-container" style={{ height: 8 }}>
          <div className="hud-bar-fill gold" style={{ width: `${incomePercent}%` }} />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--text-muted)' }}>
          <span>Progression : {incomePercent}%</span>
          {targetIncome > currentSalary && (
            <span>Manque : {formatFCFA(targetIncome - currentSalary)}/mois</span>
          )}
        </div>
      </div>

      {/* Salary & Target Income Modal */}
      {isSalaryModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div className="neuro-card" style={{ width: '100%', maxWidth: 420, borderColor: 'var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wallet size={16} color="var(--gold)" />
                <span style={{ fontFamily: 'var(--font-title)', fontSize: 13, fontWeight: 800, color: 'var(--gold)' }}>
                  RÉGLAGE DE VOS REVENUS
                </span>
              </div>
              <button 
                onClick={() => setIsSalaryModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Définissez votre salaire net mensuel réel ainsi que votre objectif de revenu multiplicateur. Les calculs de reste à vivre et de fonds d'urgence s'ajusteront instantanément.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                  SALAIRE MENSUEL ACTUEL (FCFA) :
                </label>
                <input 
                  type="number"
                  placeholder="Ex : 250000"
                  value={editSalaryInput}
                  onChange={(e) => setEditSalaryInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-cyan-dim)',
                    borderRadius: 6,
                    color: '#fff',
                    padding: '8px 10px',
                    fontSize: 14,
                    fontFamily: 'var(--font-hud)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: 'var(--gold)', display: 'block', marginBottom: 4 }}>
                  CIBLE MENSUELLE VISÉE (FCFA) :
                </label>
                <input 
                  type="number"
                  placeholder="Ex : 1000000"
                  value={editTargetInput}
                  onChange={(e) => setEditTargetInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--gold)',
                    borderRadius: 6,
                    color: '#fff',
                    padding: '8px 10px',
                    fontSize: 14,
                    fontFamily: 'var(--font-hud)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setIsSalaryModalOpen(false)}
                style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSalary}
                className="btn-monarch"
                style={{ flex: 2, padding: '10px', fontSize: 11, background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.3))', borderColor: 'var(--gold)', color: '#fff' }}
              >
                Enregistrer les revenus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sub-Tabs Navigation (Complete Neuro-Ergonomic LifeOS Navigation) */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'cockpit', label: '📊 COCKPIT' },
          { id: 'budget', label: '💼 BUDGET & 120J' },
          { id: 'accounts', label: `💳 COMPTES (${finances.accounts?.length || 0})` },
          { id: 'patrimoine', label: '🏛️ PATRIMOINE' },
          { id: 'investments', label: '📈 BRVM & INTÉRÊTS' },
          { id: 'goals', label: `🎯 OBJECTIFS (${finances.goals?.length || 0})` },
          { id: 'decisions', label: '⚖️ DÉCISIONS' },
          { id: 'settings', label: '⚙️ PARAMÈTRES FOYER' },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => {
              sound.playClick();
              setActiveSubTab(st.id);
            }}
            style={{
              padding: '6px 11px',
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              borderRadius: 6,
              border: `1px solid ${activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`,
              background: activeSubTab === st.id ? 'rgba(0,217,255,0.2)' : 'rgba(0,0,0,0.4)',
              color: activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* ================= SUB-TAB 0: COCKPIT & ALERTES ================= */}
      {activeSubTab === 'cockpit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Trésorerie disponible & Reste à vivre */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div className="neuro-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>TRÉSORERIE DISPONIBLE</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-title)', color: cashStatus.availableCash > 0 ? 'var(--neon-green)' : 'var(--alert-red)' }}>
                {formatFCFA(cashStatus.availableCash)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Marge protégée : {formatCompactFCFA(finances.settings?.safetyMargin || 0)}</div>
            </div>

            <div className="neuro-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>RESTE À VIVRE MENSUEL</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-title)', color: resteAVivre >= 0 ? 'var(--border-cyan)' : 'var(--alert-red)' }}>
                {formatFCFA(resteAVivre)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Après enveloppes mensuelles</div>
            </div>
          </div>

          {/* Fonds d'urgence & Indépendance financière */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div className="neuro-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>FONDS D'URGENCE ({efStatus.months}M)</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-title)', color: efStatus.percent >= 100 ? 'var(--neon-green)' : 'var(--gold)' }}>
                {efStatus.percent}%
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatCompactFCFA(efStatus.available)} / {formatCompactFCFA(efStatus.target)}</div>
            </div>

            <div className="neuro-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>COUVERTURE HORS-SALAIRE</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-title)', color: nonSalaryCoverage.coverageRatio >= 100 ? 'var(--neon-green)' : 'var(--border-cyan)' }}>
                {nonSalaryCoverage.coverageRatio}%
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{formatCompactFCFA(nonSalaryCoverage.nonSalaryMonthly)}/mois générés</div>
            </div>
          </div>

          {/* Automated Financial Alerts */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <AlertCircle size={15} color="var(--border-cyan)" />
              <span className="system-window-title">ALERTES & SÉRÉNITÉ DU FOYER</span>
            </div>

            {financialAlerts.length === 0 ? (
              <div style={{ padding: '10px', background: 'rgba(0,255,136,0.06)', borderRadius: 6, border: '1px solid rgba(0,255,136,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} color="var(--neon-green)" />
                <span style={{ fontSize: 11, color: '#fff' }}>Aucune anomalie détectée. Trésorerie et charges sous contrôle parfait.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {financialAlerts.map(alt => (
                  <div 
                    key={alt.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: alt.level === 'alert' ? 'rgba(255,46,76,0.1)' : 'rgba(255,215,0,0.1)',
                      border: `1px solid ${alt.level === 'alert' ? 'var(--alert-red)' : 'var(--gold)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: alt.level === 'alert' ? 'var(--alert-red)' : 'var(--gold)' }}>
                      {alt.title}
                    </div>
                    <div style={{ fontSize: 10, color: '#fff' }}>{alt.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 1: BUDGET & 120 JOURS ================= */}
      {activeSubTab === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Quick Financial Overview Cards */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="neuro-card" style={{ flex: 1, padding: '12px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>RESTE À VIVRE LIBRE</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-title)', color: resteAVivre >= 0 ? 'var(--neon-green)' : 'var(--alert-red)' }}>
                {formatFCFA(resteAVivre)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Après enveloppes mensuelles</div>
            </div>

            <div className="neuro-card" style={{ flex: 1, padding: '12px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>FONDS D'URGENCE ({efStatus.months} MOIS)</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-title)', color: efStatus.percent >= 100 ? 'var(--neon-green)' : 'var(--gold)' }}>
                {efStatus.percent}% ({formatCompactFCFA(efStatus.available)}/{formatCompactFCFA(efStatus.target)})
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Cible : {formatFCFA(efStatus.target)}</div>
            </div>
          </div>

          {/* Envelopes list */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="system-window-title">ENVELOPPES DU BUDGET MENSUEL</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Total alloué: {formatFCFA(totalAllocatedEnvelopes)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(finances.envelopes || []).map(env => {
                const percent = Math.min(100, Math.round(((env.spent || 0) / (env.allocated || 1)) * 100));
                const isOver = (env.spent || 0) > (env.allocated || 0);
                return (
                  <div key={env.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-cyan-dim)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{env.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isOver ? 'var(--alert-red)' : 'var(--border-cyan)' }}>
                          {formatFCFA(env.spent || 0)} / {formatFCFA(env.allocated || 0)}
                        </span>
                        <button 
                          onClick={() => handleDeleteEnvelope(env.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="hud-bar-container" style={{ height: 6 }}>
                      <div className={`hud-bar-fill ${isOver ? 'red' : ''}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ajouter une enveloppe */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-cyan-dim)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input 
                type="text"
                placeholder="Nouvelle enveloppe (ex: Épargne projet)"
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              />
              <input 
                type="number"
                placeholder="Budget alloué FCFA"
                value={newEnvAllocated}
                onChange={(e) => setNewEnvAllocated(e.target.value)}
                style={{ flex: 1, minWidth: 100, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              />
              <button onClick={handleAddEnvelope} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Ajouter
              </button>
            </div>
          </div>

          {/* Charges Récurrentes & Échéancier 120 Jours */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="system-window-title">CHARGES RÉCURRENTES (ÉCHÉANCIER 120J)</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Charges prévues</span>
            </div>

            {finances.charges?.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                Aucune charge récurrente enregistrée. Ajoutez vos charges fixes (loyer, abonnements, etc.) ci-dessous.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(finances.charges || []).map(ch => (
                  <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-cyan-dim)' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{ch.label}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                        Échéance: {ch.nextDueDate || 'Mensuelle'} • {ch.frequency}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-hud)' }}>
                          {formatFCFA(ch.amount)}
                        </div>
                        <span style={{ fontSize: 8, padding: '2px 5px', borderRadius: 4, background: ch.active ? 'rgba(0,255,136,0.1)' : 'rgba(255,46,76,0.1)', color: ch.active ? 'var(--neon-green)' : 'var(--alert-red)' }}>
                          {ch.active ? 'ACTIF' : 'INACTIF'}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteCharge(ch.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ajouter une charge récurrente */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-cyan-dim)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input 
                type="text"
                placeholder="Libellé charge (ex: Loyer, Électricité)"
                value={newChargeLabel}
                onChange={(e) => setNewChargeLabel(e.target.value)}
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              />
              <input 
                type="number"
                placeholder="Montant FCFA"
                value={newChargeAmount}
                onChange={(e) => setNewChargeAmount(e.target.value)}
                style={{ flex: 1, minWidth: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              />
              <input 
                type="date"
                value={newChargeDue}
                onChange={(e) => setNewChargeDue(e.target.value)}
                style={{ width: 120, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              />
              <button onClick={handleAddCharge} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Ajouter Charge
              </button>
            </div>
          </div>

          {/* Clôture mensuelle snapshot */}
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="system-window-title" style={{ color: 'var(--gold)' }}>CLÔTURE COMPTABLE DU MOIS</span>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Figez un snapshot officiel de votre patrimoine et trésorerie pour historiser vos progrès.
                </p>
              </div>
              <button onClick={handleSnapshotMonth} className="btn-monarch" style={{ fontSize: 10, padding: '8px 12px', background: 'rgba(255,215,0,0.15)', borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                Figer le mois (+20 XP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: COMPTES & TRÉSORERIE ================= */}
      {activeSubTab === 'accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Trésorerie globale */}
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--border-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="system-window-title">TRÉSORERIE RÉELLEMENT DISPONIBLE</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Marge non mobilisable: {formatFCFA(finances.settings?.safetyMargin || 0)}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--border-cyan)' }}>
              {formatFCFA(cashStatus.availableCash)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Total liquide brut : <strong>{formatFCFA(cashStatus.totalCash)}</strong> (dont {formatFCFA(cashStatus.savingsCash)} en épargne protégée)
            </div>
          </div>

          {/* Liste des comptes réels */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="system-window-title">SOLDES RÉELS PAR COMPTE</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sources de vérité</span>
            </div>

            {finances.accounts?.length === 0 ? (
              <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, background: 'rgba(0,0,0,0.2)', borderRadius: 6, marginBottom: 10 }}>
                Aucun compte configuré. Ajoutez votre premier compte (ex: Wave, Portefeuille Cash, Banque) ci-dessous.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {(finances.accounts || []).map(acc => {
                  const bal = cashStatus.balances.get(acc.id)?.balance || 0;
                  return (
                    <div key={acc.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-cyan-dim)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{acc.type}</span>
                        <button 
                          onClick={() => handleDeleteAccount(acc.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '2px 0 4px' }}>{acc.name}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-hud)', color: bal >= 0 ? 'var(--border-cyan)' : 'var(--alert-red)' }}>
                        {formatFCFA(bal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Nouveau compte */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-cyan-dim)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--border-cyan)', marginBottom: 8 }}>+ AJOUTER UN NOUVEAU COMPTE</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Nom (ex: Wave, Ecobank, Espèces)" 
                  value={newAccName} 
                  onChange={(e) => setNewAccName(e.target.value)} 
                  style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
                />
                <select 
                  value={newAccType} 
                  onChange={(e) => setNewAccType(e.target.value)} 
                  style={{ flex: 1, minWidth: 110, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
                >
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK">Banque</option>
                  <option value="CASH">Espèces</option>
                  <option value="SAVINGS">Épargne</option>
                  <option value="BRVM">Compte Titres</option>
                  <option value="BUSINESS">Business</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Solde initial" 
                  value={newAccBalance} 
                  onChange={(e) => setNewAccBalance(e.target.value)} 
                  style={{ flex: 1, minWidth: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
                />
                <button onClick={handleAddAccount} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                  Créer Compte
                </button>
              </div>
            </div>
          </div>

          {/* Virement entre comptes (Zéro fausse dépense) */}
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--neon-green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <ArrowLeftRight size={16} color="var(--neon-green)" />
              <span className="system-window-title" style={{ color: 'var(--neon-green)' }}>VIREMENT INTER-COMPTES (SANS FAUSSE DÉPENSE)</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              Un transfert déplace l'argent d'un compte à un autre sans créer de fausse dépense. Seuls les frais éventuels sont comptabilisés.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <select 
                value={transferFrom} 
                onChange={(e) => setTransferFrom(e.target.value)} 
                style={{ flex: 1, minWidth: 120, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              >
                {(finances.accounts || []).map(a => <option key={a.id} value={a.id}>De : {a.name}</option>)}
              </select>
              <select 
                value={transferTo} 
                onChange={(e) => setTransferTo(e.target.value)} 
                style={{ flex: 1, minWidth: 120, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              >
                {(finances.accounts || []).map(a => <option key={a.id} value={a.id}>Vers : {a.name}</option>)}
              </select>
              <input 
                type="number" 
                placeholder="Montant FCFA" 
                value={transferAmount} 
                onChange={(e) => setTransferAmount(e.target.value)} 
                style={{ flex: 1, minWidth: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <input 
                type="number" 
                placeholder="Frais (ex: 100)" 
                value={transferFee} 
                onChange={(e) => setTransferFee(e.target.value)} 
                style={{ width: 80, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <button onClick={handleTransfer} className="btn-monarch" style={{ fontSize: 10, padding: '6px 14px' }}>
                Transférer
              </button>
            </div>
          </div>

          {/* Saisie rapide d'opération & Historique */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 8 }}>ENREGISTRER UNE TRANSACTION</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <input 
                type="text" 
                placeholder="Libellé de la dépense/revenu" 
                value={txLabel} 
                onChange={(e) => setTxLabel(e.target.value)} 
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <input 
                type="number" 
                placeholder="Montant" 
                value={txAmount} 
                onChange={(e) => setTxAmount(e.target.value)} 
                style={{ flex: 1, minWidth: 80, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <select 
                value={txType} 
                onChange={(e) => setTxType(e.target.value)} 
                style={{ width: 100, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              >
                <option value="EXPENSE">Dépense</option>
                <option value="INCOME">Revenu</option>
                <option value="DONATION">Don</option>
                <option value="INVESTMENT">Investissement</option>
              </select>
              <select 
                value={txAccount} 
                onChange={(e) => setTxAccount(e.target.value)} 
                style={{ flex: 1, minWidth: 100, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              >
                {(finances.accounts || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button onClick={handleAddTransaction} className="btn-monarch" style={{ fontSize: 10, padding: '6px 14px' }}>
                Enregistrer
              </button>
            </div>

            {/* Filtres de journal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>JOURNAL DES TRANSACTIONS</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'].map(f => (
                  <button
                    key={f}
                    onClick={() => setTxFilter(f)}
                    style={{
                      padding: '2px 6px',
                      fontSize: 9,
                      borderRadius: 4,
                      background: txFilter === f ? 'var(--border-cyan)' : 'rgba(0,0,0,0.3)',
                      color: txFilter === f ? '#000' : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {f === 'ALL' ? 'Toutes' : f === 'EXPENSE' ? 'Dépenses' : f === 'INCOME' ? 'Revenus' : 'Virements'}
                  </button>
                ))}
              </div>
            </div>

            {/* Historique des transactions */}
            {filteredTransactions.length === 0 ? (
              <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 10 }}>
                Aucune transaction dans cette vue.
              </div>
            ) : (
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredTransactions.slice(0, 30).map(tx => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: 6, fontSize: 11 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{tx.label}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{tx.date} • {tx.type}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontWeight: 800,
                        fontFamily: 'var(--font-hud)',
                        color: tx.type === 'INCOME' ? 'var(--neon-green)' : tx.type === 'TRANSFER' ? 'var(--border-cyan)' : 'var(--alert-red)'
                      }}>
                        {tx.type === 'INCOME' ? '+' : tx.type === 'TRANSFER' ? '⇄ ' : '−'}{formatFCFA(tx.amount)}
                      </span>
                      <button 
                        onClick={() => handleDeleteTransaction(tx.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: PATRIMOINE & DETTES ================= */}
      {activeSubTab === 'patrimoine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Net Worth Summary */}
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--gold)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>VALEUR NETTE DU PATRIMOINE</div>
            <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--font-title)', color: netWorthData.netWorth >= 0 ? 'var(--gold)' : 'var(--alert-red)', margin: '4px 0' }}>
              {formatFCFA(netWorthData.netWorth)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Actifs bruts : <strong>{formatFCFA(netWorthData.grossWorth)}</strong></span>
              <span>Dettes : <strong style={{ color: 'var(--alert-red)' }}>{formatFCFA(netWorthData.totalLiabilities)}</strong></span>
            </div>
          </div>

          {/* Actifs physiques & terrains */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="system-window-title">ACTIFS PHYSIQUES & IMMOBILIERS</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Total : {formatFCFA(netWorthData.totalAssets)}</span>
            </div>

            {finances.assets?.length === 0 ? (
              <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                Aucun actif physique enregistré pour l'instant.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {(finances.assets || []).map(ast => (
                  <div key={ast.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{ast.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{ast.type}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--border-cyan)' }}>{formatFCFA(ast.value)}</span>
                      <button onClick={() => handleDeleteAsset(ast.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire ajout actif */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--border-cyan-dim)' }}>
              <input 
                type="text" 
                placeholder="Nom (ex: Terrain Kpalimé, Moto)" 
                value={newAssetName} 
                onChange={(e) => setNewAssetName(e.target.value)} 
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <select 
                value={newAssetType} 
                onChange={(e) => setNewAssetType(e.target.value)} 
                style={{ width: 100, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              >
                <option value="LAND">Terrain</option>
                <option value="BUILDING">Immobilier</option>
                <option value="VEHICLE">Véhicule</option>
                <option value="EQUIPMENT">Matériel</option>
                <option value="OTHER">Autre</option>
              </select>
              <input 
                type="number" 
                placeholder="Valeur FCFA" 
                value={newAssetValue} 
                onChange={(e) => setNewAssetValue(e.target.value)} 
                style={{ flex: 1, minWidth: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <button onClick={handleAddAsset} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Ajouter Actif
              </button>
            </div>
          </div>

          {/* Dettes & Passifs */}
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--alert-red)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="system-window-title" style={{ color: 'var(--alert-red)' }}>DETTES & ENGAGEMENTS FINANCIERS</span>
              <span style={{ fontSize: 10, color: 'var(--alert-red)' }}>Total : {formatFCFA(netWorthData.totalLiabilities)}</span>
            </div>

            {finances.liabilities?.length === 0 ? (
              <div style={{ padding: '10px', textAlign: 'center', color: 'var(--neon-green)', fontSize: 11, background: 'rgba(0,255,136,0.05)', borderRadius: 6 }}>
                ✓ Aucune dette déclarée. Liberté financière totale !
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {(finances.liabilities || []).map(l => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{l.name}</div>
                      {l.monthlyPayment > 0 && (
                        <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Mensualité : {formatFCFA(l.monthlyPayment)}/mois</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--alert-red)' }}>{formatFCFA(l.amount)}</span>
                      <button onClick={() => handleDeleteLiability(l.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Formulaire ajout dette */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--border-cyan-dim)' }}>
              <input 
                type="text" 
                placeholder="Libellé dette (ex: Prêt équipement)" 
                value={newLiabName} 
                onChange={(e) => setNewLiabName(e.target.value)} 
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <input 
                type="number" 
                placeholder="Montant total" 
                value={newLiabAmount} 
                onChange={(e) => setNewLiabAmount(e.target.value)} 
                style={{ flex: 1, minWidth: 80, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <input 
                type="number" 
                placeholder="Mensualité" 
                value={newLiabMonthly} 
                onChange={(e) => setNewLiabMonthly(e.target.value)} 
                style={{ width: 80, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <button onClick={handleAddLiability} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Ajouter Dette
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 4: BRVM & INTÉRÊTS COMPOSÉS ================= */}
      {activeSubTab === 'investments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Portefeuille BRVM */}
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <span className="system-window-title" style={{ color: 'var(--gold)' }}>PORTEFEUILLE TITRES BOURSIERS (BRVM)</span>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Valeur totale : {formatFCFA(netWorthData.totalBrvm)}</div>
              </div>
            </div>

            {finances.positions?.length === 0 ? (
              <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                Aucune action enregistrée. Ajoutez vos positions BRVM (SNTS, SOLIBRA, ECOBANK...) ci-dessous.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {(finances.positions || []).map(pos => {
                  const val = (pos.quantity || 0) * (pos.currentPrice || pos.avgBuyPrice || 0);
                  const cost = (pos.quantity || 0) * (pos.avgBuyPrice || 0);
                  const pnl = val - cost;
                  const pnlPct = cost > 0 ? Math.round((pnl / cost) * 100) : 0;
                  return (
                    <div key={pos.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 6 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{pos.ticker} — {pos.companyName}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                          {pos.quantity} titres • PRU : {formatFCFA(pos.avgBuyPrice)} • Cours : {formatFCFA(pos.currentPrice)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{formatFCFA(val)}</div>
                          <div style={{ fontSize: 9, color: pnl >= 0 ? 'var(--neon-green)' : 'var(--alert-red)' }}>
                            {pnl >= 0 ? '+' : ''}{formatFCFA(pnl)} ({pnlPct}%)
                          </div>
                        </div>
                        <button onClick={() => handleDeletePosition(pos.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Formulaire ajout position BRVM */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--border-cyan-dim)' }}>
              <input 
                type="text" 
                placeholder="Ticker (ex: SNTS)" 
                value={newPosTicker} 
                onChange={(e) => setNewPosTicker(e.target.value)} 
                style={{ width: 80, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <input 
                type="text" 
                placeholder="Société" 
                value={newPosCompany} 
                onChange={(e) => setNewPosCompany(e.target.value)} 
                style={{ flex: 1, minWidth: 100, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <input 
                type="number" 
                placeholder="Qté" 
                value={newPosQty} 
                onChange={(e) => setNewPosQty(e.target.value)} 
                style={{ width: 60, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <input 
                type="number" 
                placeholder="PRU" 
                value={newPosBuyPrice} 
                onChange={(e) => setNewPosBuyPrice(e.target.value)} 
                style={{ width: 80, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <input 
                type="number" 
                placeholder="Cours actuel" 
                value={newPosCurrentPrice} 
                onChange={(e) => setNewPosCurrentPrice(e.target.value)} 
                style={{ width: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <button onClick={handleAddBrvmPosition} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Ajouter Titre
              </button>
            </div>
          </div>

          {/* Simulateur d'intérêts composés */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Calculator size={15} color="var(--border-cyan)" />
              <span className="system-window-title">SIMULATEUR D'INTÉRÊTS COMPOSÉS</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Capital initial :</span>
                <input 
                  type="number" 
                  value={simInitial} 
                  onChange={(e) => setSimInitial(Number(e.target.value))} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
                />
              </div>
              <div>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Versement mensuel :</span>
                <input 
                  type="number" 
                  value={simMonthly} 
                  onChange={(e) => setSimMonthly(Number(e.target.value))} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
                />
              </div>
              <div>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Durée (années) :</span>
                <input 
                  type="number" 
                  value={simYears} 
                  onChange={(e) => setSimYears(Number(e.target.value))} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
                />
              </div>
              <div>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Rendement annuel net (%) :</span>
                <input 
                  type="number" 
                  value={simRate} 
                  onChange={(e) => setSimRate(Number(e.target.value))} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
                />
              </div>
            </div>

            {(() => {
              const sim = simulateCompoundInterest({ initial: simInitial, monthly: simMonthly, years: simYears, ratePct: simRate, feesPct: 0 });
              return (
                <div style={{ background: 'rgba(0,217,255,0.06)', border: '1px solid var(--border-cyan)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>CAPITAL PROJETÉ DANS {simYears} ANS :</div>
                  <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--border-cyan)', margin: '4px 0' }}>
                    {formatFCFA(sim.finalValue)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Total versé : {formatFCFA(sim.totalContributed)} • Gains composés générés : <strong style={{ color: 'var(--neon-green)' }}>+{formatFCFA(sim.totalGains)}</strong>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 5: OBJECTIFS FINANCIERS ================= */}
      {activeSubTab === 'goals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="neuro-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="system-window-title">OBJECTIFS DE VIE & FINANCIERS</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Projets financés</span>
            </div>

            {finances.goals?.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                Aucun objectif défini. Ajoutez vos grands projets de vie (Achat terrain, Voyage, Véhicule) ci-dessous.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(finances.goals || []).map(g => {
                  const pct = g.targetAmount > 0 ? Math.min(100, Math.round(((g.currentAmount || 0) / g.targetAmount) * 100)) : 0;
                  return (
                    <div key={g.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-cyan-dim)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{g.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: pct >= 100 ? 'var(--neon-green)' : 'var(--gold)' }}>
                            {formatFCFA(g.currentAmount || 0)} / {formatFCFA(g.targetAmount)} ({pct}%)
                          </span>
                          <button onClick={() => handleDeleteGoal(g.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <div className="hud-bar-container" style={{ height: 6 }}>
                        <div className="hud-bar-fill gold" style={{ width: `${pct}%` }} />
                      </div>
                      {g.targetDate && (
                        <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>
                          Date cible : {g.targetDate}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Formulaire ajout objectif */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-cyan-dim)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input 
                type="text"
                placeholder="Titre de l'objectif (ex: Titre foncier terrain)"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              />
              <input 
                type="number"
                placeholder="Montant cible FCFA"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                style={{ flex: 1, minWidth: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              />
              <input 
                type="number"
                placeholder="Déjà épargné"
                value={newGoalCurrent}
                onChange={(e) => setNewGoalCurrent(e.target.value)}
                style={{ width: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              />
              <button onClick={handleAddGoal} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Créer Objectif
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 6: DÉCISIONS D'ACHAT ================= */}
      {activeSubTab === 'decisions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--border-cyan)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Scale size={16} color="var(--border-cyan)" />
              <span className="system-window-title">ANALYSEUR « PUIS-JE ME LE PERMETTRE ? »</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Évaluez l'impact neuro-financier d'un achat sur votre trésorerie réelle, votre fonds d'urgence et votre reste à vivre.
            </p>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <input 
                type="number" 
                placeholder="Montant envisagé en FCFA" 
                value={decisionAmount} 
                onChange={(e) => setDecisionAmount(e.target.value)} 
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '8px 10px', fontSize: 12 }} 
              />
              <select 
                value={decisionType} 
                onChange={(e) => setDecisionType(e.target.value)} 
                style={{ width: 120, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '8px 10px', fontSize: 12 }}
              >
                <option value="ACHAT">Achat Plaisir</option>
                <option value="INVESTISSEMENT">Investissement</option>
                <option value="CHARGE">Charge Fixe</option>
              </select>
              <button onClick={handleAnalyzeDecision} className="btn-monarch" style={{ fontSize: 11, padding: '8px 16px' }}>
                Analyser
              </button>
            </div>

            {decisionResult && (
              <div style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${decisionResult.badgeColor}`, borderRadius: 8, padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: decisionResult.badgeColor }}>
                    VERDICT : {decisionResult.verdict.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    Trésorerie restante : {formatFCFA(decisionResult.freeCashAfter)}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#fff', lineHeight: 1.4 }}>
                  {decisionResult.explanation}
                </div>
                {decisionResult.consequences?.length > 0 && (
                  <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: 10, color: 'var(--text-muted)' }}>
                    {decisionResult.consequences.map((c, idx) => <li key={idx}>{c}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 7: PARAMÈTRES FOYER & RÈGLES ================= */}
      {activeSubTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sources de revenus déclarées */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="system-window-title">SOURCES DE REVENUS DU FOYER</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Déclarées</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {(finances.incomeSources || []).map(src => (
                <div key={src.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{src.label}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{src.kind}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-green)' }}>{formatFCFA(src.monthlyAmount)}/mois</span>
                    <button onClick={() => handleDeleteIncomeSource(src.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--border-cyan-dim)' }}>
              <input 
                type="text" 
                placeholder="Source (ex: Freelance, Dividendes)" 
                value={newIncomeLabel} 
                onChange={(e) => setNewIncomeLabel(e.target.value)} 
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <select 
                value={newIncomeKind} 
                onChange={(e) => setNewIncomeKind(e.target.value)} 
                style={{ width: 100, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              >
                <option value="SALARY">Salaire</option>
                <option value="BUSINESS">Business</option>
                <option value="DIVIDEND">Dividendes</option>
                <option value="RENT">Loyer perçu</option>
                <option value="OTHER">Autre</option>
              </select>
              <input 
                type="number" 
                placeholder="Montant mensuel" 
                value={newIncomeAmount} 
                onChange={(e) => setNewIncomeAmount(e.target.value)} 
                style={{ flex: 1, minWidth: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <button onClick={handleAddIncomeSource} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Ajouter Source
              </button>
            </div>
          </div>

          {/* Réglages généraux du foyer */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 10 }}>RÉGLAGES & RÈGLES DE GESTION</span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                  OBJECTIF FONDS D'URGENCE (EN MOIS DE DÉPENSES ESSENTIELLES) :
                </label>
                <select 
                  value={finances.settings?.emergencyFundMonths || 3} 
                  onChange={(e) => handleUpdateSettings({ emergencyFundMonths: Number(e.target.value) })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }}
                >
                  {[1, 2, 3, 4, 5, 6, 9, 12].map(m => (
                    <option key={m} value={m}>{m} mois de sérénité</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                  MARGE DE SÉCURITÉ INVIOLABLE NON MOBILISABLE (FCFA) :
                </label>
                <input 
                  type="number"
                  value={finances.settings?.safetyMargin || 0}
                  onChange={(e) => handleUpdateSettings({ safetyMargin: Number(e.target.value) })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#fff' }}>Mode Analyse Financière Avancée</span>
                <input 
                  type="checkbox"
                  checked={finances.settings?.modeAnalyse || false}
                  onChange={(e) => handleUpdateSettings({ modeAnalyse: e.target.checked })}
                  style={{ width: 16, height: 16 }}
                />
              </div>
            </div>
          </div>

          {/* Clarification 2028 : 3 330 000 FCFA */}
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--gold)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <HelpCircle size={15} color="var(--gold)" />
              <span className="system-window-title" style={{ color: 'var(--gold)' }}>CLARIFICATION STRUCTURANTE (2028 : 3 330 000 FCFA)</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              {finances.clarification3m?.question || "Que représentent exactement les 3 330 000 FCFA à l'horizon 2028 ?"}
            </p>
            <textarea 
              rows={3} 
              value={clarifAnswer} 
              onChange={(e) => setClarifAnswer(e.target.value)} 
              placeholder="Ex : Capital d'amorçage pour l'acquisition de la parcelle, ou réserve stratégique..."
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '8px', fontSize: 11, boxSizing: 'border-box' }}
            />
            <button onClick={handleSaveClarification} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px', marginTop: 6 }}>
              Enregistrer la clarification
            </button>
          </div>

          {/* Journal d'audit */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 8 }}>JOURNAL D'AUDIT DU FOYER</span>
            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(finances.auditEvents || []).slice(0, 50).map(evt => (
                <div key={evt.id} style={{ fontSize: 10, color: 'var(--text-dim)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 3 }}>
                  <strong style={{ color: 'var(--border-cyan)' }}>{evt.actorName}</strong> {evt.action} {evt.entity} ({new Date(evt.createdAt).toLocaleDateString('fr-FR')})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
