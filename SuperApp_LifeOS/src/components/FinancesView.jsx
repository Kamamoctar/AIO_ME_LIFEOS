import React, { useState } from 'react';
import { 
  TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, Plus, 
  Users, Shield, PieChart, Calendar, AlertCircle, Building2, 
  Smartphone, Banknote, PiggyBank, ArrowLeftRight, Trash2, 
  Settings, CheckCircle2, AlertTriangle, HelpCircle, Download, 
  Upload, Tag, Scale, Landmark, Calculator, Sparkles, ChevronRight,
  Clock, DollarSign, HeartHandshake, Eye
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { 
  formatFCFA, 
  formatCompactFCFA, 
  computeAccountBalances, 
  computeCashStatus, 
  computeEmergencyFundStatus, 
  computeNetWorth, 
  analyzePurchaseDecision, 
  simulateCompoundInterest 
} from '../core/financeEngine.js';

export default function FinancesView({
  finances,
  onUpdateFinances,
  onAddXp,
  theme
}) {
  const [activeSubTab, setActiveSubTab] = useState('budget'); // 'budget', 'accounts', 'patrimoine', 'investments', 'decisions', 'settings'

  // Transactions form state
  const [txLabel, setTxLabel] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txFee, setTxFee] = useState('');
  const [txAccount, setTxAccount] = useState(finances.settings?.defaultAccountId || 'acc_wave');
  const [txType, setTxType] = useState('EXPENSE');
  const [txCategory, setTxCategory] = useState('cat_alim');
  const [txEnvelope, setTxEnvelope] = useState('env_vital');

  // Transfer form state
  const [transferFrom, setTransferFrom] = useState(finances.settings?.defaultAccountId || 'acc_wave');
  const [transferTo, setTransferTo] = useState('acc_savings');
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

  // BRVM Form state
  const [newPosCompany, setNewPosCompany] = useState('');
  const [newPosTicker, setNewPosTicker] = useState('');
  const [newPosQty, setNewPosQty] = useState('');
  const [newPosBuyPrice, setNewPosBuyPrice] = useState('');
  const [newPosCurrentPrice, setNewPosCurrentPrice] = useState('');

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
  const currentSalary = finances.monthlySalary || 203000;
  const targetIncome = finances.targetIncome || 733333;
  const incomePercent = Math.min(100, Math.round((currentSalary / targetIncome) * 100));

  const cashStatus = computeCashStatus(finances.accounts, finances.transactions, finances.settings?.safetyMargin || 0);
  const efStatus = computeEmergencyFundStatus(finances);
  const netWorthData = computeNetWorth(finances);

  const totalSpentEnvelopes = (finances.envelopes || []).reduce((sum, e) => sum + (e.spent || 0), 0);
  const totalAllocatedEnvelopes = (finances.envelopes || []).reduce((sum, e) => sum + (e.allocated || 0), 0);
  const resteAVivre = currentSalary - totalSpentEnvelopes;

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

  // 1. Add Transaction
  const handleAddTransaction = () => {
    const amountNum = parseInt(txAmount, 10);
    const feeNum = parseInt(txFee, 10) || 0;
    if (!txLabel.trim() || isNaN(amountNum) || amountNum <= 0) return;

    sound.playClick();
    const newTx = {
      id: 'tx_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      label: txLabel.trim(),
      amount: amountNum,
      fee: feeNum,
      type: txType,
      accountId: txAccount,
      categoryId: txCategory,
      envelopeId: txEnvelope,
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

  // 2. Transfer between Accounts (Zero False Expense)
  const handleTransfer = () => {
    const amountNum = parseInt(transferAmount, 10);
    const feeNum = parseInt(transferFee, 10) || 0;
    if (isNaN(amountNum) || amountNum <= 0 || transferFrom === transferTo) return;

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
    alert(`Virement de ${formatFCFA(amountNum)} enregistré sans fausse dépense !`);
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

  // 5. Add Liability
  const handleAddLiability = () => {
    if (!newLiabName.trim() || !newLiabAmount) return;
    sound.playClick();
    const val = parseInt(newLiabAmount, 10) || 0;

    const newLiab = {
      id: 'liab_' + Date.now(),
      name: newLiabName.trim(),
      amount: val,
      type: 'OTHER',
      notes: 'Passif enregistré'
    };

    const updatedAudits = logAudit('a ajouté', `le passif / dette « ${newLiabName.trim()} »`, `${formatFCFA(val)}`);

    onUpdateFinances({
      ...finances,
      liabilities: [...(finances.liabilities || []), newLiab],
      auditEvents: updatedAudits
    });

    setNewLiabName('');
    setNewLiabAmount('');
  };

  // 6. Add BRVM Position
  const handleAddPosition = () => {
    if (!newPosCompany.trim() || !newPosQty || !newPosBuyPrice) return;
    sound.playClick();
    const qty = parseInt(newPosQty, 10) || 0;
    const buyPrice = parseInt(newPosBuyPrice, 10) || 0;
    const curPrice = parseInt(newPosCurrentPrice, 10) || buyPrice;

    const newPos = {
      id: 'pos_' + Date.now(),
      company: newPosCompany.trim().toUpperCase(),
      ticker: newPosTicker.trim().toUpperCase() || newPosCompany.trim().slice(0, 4).toUpperCase(),
      quantity: qty,
      avgBuyPrice: buyPrice,
      feesPaid: Math.round(qty * buyPrice * 0.01),
      currentPrice: curPrice,
      dividends: 0,
      active: true,
      notes: 'Position BRVM'
    };

    const updatedAudits = logAudit('a ouvert', `la position BRVM « ${newPos.ticker} » (${qty} titres)`, `PRU: ${formatFCFA(buyPrice)}`);

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

  // 7. Run Decision Analysis
  const handleAnalyzeDecision = () => {
    const val = parseInt(decisionAmount, 10);
    if (!val || val <= 0) return;
    sound.playClick();
    const res = analyzePurchaseDecision(finances, val, decisionType);
    setDecisionResult(res);
  };

  // 8. Add Income Source (Settings)
  const handleAddIncomeSource = () => {
    if (!newIncomeLabel.trim() || !newIncomeAmount) return;
    sound.playClick();
    const val = parseInt(newIncomeAmount, 10) || 0;

    const newInc = {
      id: 'inc_' + Date.now(),
      label: newIncomeLabel.trim(),
      kind: newIncomeKind,
      monthlyAmount: val,
      active: true
    };

    const updatedAudits = logAudit('a déclaré', `la source de revenu « ${newIncomeLabel.trim()} »`, `${formatFCFA(val)}/mois`);

    onUpdateFinances({
      ...finances,
      incomeSources: [...(finances.incomeSources || []), newInc],
      auditEvents: updatedAudits
    });

    setNewIncomeLabel('');
    setNewIncomeAmount('');
  };

  // 9. Add Dependent (Settings)
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

  // 10. Add Category (Settings)
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    sound.playClick();
    const budgetNum = parseInt(newCatBudget, 10) || null;

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

  // 11. Save Settings Updates
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

  // 12. Save Clarification
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

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-float">
      
      {/* 1. Global Multiplier Gauge Header */}
      <div className="system-window corner-cut" style={{ padding: '14px', borderColor: 'var(--gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} color="var(--gold)" />
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 11, fontWeight: 800, color: 'var(--gold)' }}>
              OBJECTIF MULTIPLICATEUR REVENU (x3.6)
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#fff', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
            {incomePercent}% ATTEINT
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '8px 0 6px' }}>
          <div>
            <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>ACTUEL</span>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-title)', color: '#fff' }}>
              {formatFCFA(currentSalary)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>CIBLE MENSUELLE</span>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--gold)' }}>
              {formatFCFA(targetIncome)}
            </div>
          </div>
        </div>

        <div className="hud-bar-container" style={{ height: 8 }}>
          <div className="hud-bar-fill gold" style={{ width: `${incomePercent}%` }} />
        </div>
      </div>

      {/* 2. Sub-Tabs Navigation (Complete LifeOS Navigation) */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'budget', label: 'BUDGET & 120J' },
          { id: 'accounts', label: `COMPTES (${finances.accounts?.length || 0})` },
          { id: 'patrimoine', label: 'PATRIMOINE & DETTES' },
          { id: 'investments', label: 'INVESTISSEMENTS & BRVM' },
          { id: 'decisions', label: 'DÉCISIONS & SIMUS' },
          { id: 'settings', label: '⚙️ PARAMÈTRES FOYER' },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => {
              sound.playClick();
              setActiveSubTab(st.id);
            }}
            style={{
              padding: '6px 10px',
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              borderRadius: 6,
              border: `1px solid ${activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`,
              background: activeSubTab === st.id ? 'rgba(0,217,255,0.2)' : 'rgba(0,0,0,0.4)',
              color: activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* ================= SUB-TAB 1: BUDGET & 120 JOURS ================= */}
      {activeSubTab === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Quick Financial Overview Cards */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="system-window" style={{ flex: 1, padding: '12px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>RESTE À VIVRE LIBRE</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-title)', color: resteAVivre >= 0 ? 'var(--neon-green)' : 'var(--alert-red)' }}>
                {formatFCFA(resteAVivre)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Après enveloppes mensuelles</div>
            </div>

            <div className="system-window" style={{ flex: 1, padding: '12px' }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>FONDS D'URGENCE ({efStatus.months} MOIS)</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-title)', color: efStatus.percent >= 100 ? 'var(--neon-green)' : 'var(--gold)' }}>
                {efStatus.percent}% ({formatCompactFCFA(efStatus.available)}/{formatCompactFCFA(efStatus.target)})
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Cible : {formatFCFA(efStatus.target)}</div>
            </div>
          </div>

          {/* Envelopes list */}
          <div className="system-window" style={{ padding: '14px' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{env.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isOver ? 'var(--alert-red)' : 'var(--border-cyan)' }}>
                        {formatFCFA(env.spent || 0)} / {formatFCFA(env.allocated || 0)}
                      </span>
                    </div>
                    <div className="hud-bar-container" style={{ height: 6 }}>
                      <div className={`hud-bar-fill ${isOver ? 'red' : ''}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charges Récurrentes & Échéancier 120 Jours */}
          <div className="system-window" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="system-window-title">CHARGES RÉCURRENTES & PROVISIONS</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Échéances des 120 prochains jours</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(finances.charges || []).map(ch => (
                <div key={ch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-cyan-dim)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{ch.label}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                      Échéance: {ch.nextDueDate || 'Mensuelle'} • {ch.frequency}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-hud)' }}>
                      {formatFCFA(ch.amount)}
                    </div>
                    <span style={{ fontSize: 8, padding: '2px 5px', borderRadius: 4, background: ch.active ? 'rgba(0,255,136,0.1)' : 'rgba(255,46,76,0.1)', color: ch.active ? 'var(--neon-green)' : 'var(--alert-red)' }}>
                      {ch.active ? 'ACTIF' : 'INACTIF'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: COMPTES & TRÉSORERIE ================= */}
      {activeSubTab === 'accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Trésorerie globale */}
          <div className="system-window" style={{ padding: '14px', borderColor: 'var(--border-cyan)' }}>
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
          <div className="system-window" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="system-window-title">SOLDES RÉELS PAR COMPTE</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sources de vérité</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {(finances.accounts || []).map(acc => {
                const bal = cashStatus.balances.get(acc.id)?.balance || 0;
                return (
                  <div key={acc.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-cyan-dim)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{acc.type}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '2px 0 4px' }}>{acc.name}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-hud)', color: bal >= 0 ? 'var(--border-cyan)' : 'var(--alert-red)' }}>
                      {formatFCFA(bal)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nouveau compte */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-cyan-dim)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--border-cyan)', marginBottom: 8 }}>+ AJOUTER UN NOUVEAU COMPTE</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Nom (ex: Moov Money, Ecobank)" 
                  value={newAccName} 
                  onChange={(e) => setNewAccName(e.target.value)} 
                  style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }} 
                />
                <select 
                  value={newAccType} 
                  onChange={(e) => setNewAccType(e.target.value)} 
                  style={{ flex: 1, minWidth: 110, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }}
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
                  style={{ flex: 1, minWidth: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }} 
                />
                <button onClick={handleAddAccount} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                  Créer
                </button>
              </div>
            </div>
          </div>

          {/* Virement entre comptes (Zéro fausse dépense) */}
          <div className="system-window" style={{ padding: '14px', borderColor: 'var(--neon-green)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <ArrowLeftRight size={16} color="var(--neon-green)" />
              <span className="system-window-title" style={{ color: 'var(--neon-green)' }}>VIREMENT ENTRE COMPTES (SANS FAUSSE DÉPENSE)</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              Un transfert déplace l'argent d'un compte à un autre sans créer ni faux revenu ni fausse dépense. Seuls les frais éventuels sont comptabilisés.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <select 
                value={transferFrom} 
                onChange={(e) => setTransferFrom(e.target.value)} 
                style={{ flex: 1, minWidth: 120, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }}
              >
                {(finances.accounts || []).map(a => <option key={a.id} value={a.id}>De : {a.name}</option>)}
              </select>
              <select 
                value={transferTo} 
                onChange={(e) => setTransferTo(e.target.value)} 
                style={{ flex: 1, minWidth: 120, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }}
              >
                {(finances.accounts || []).map(a => <option key={a.id} value={a.id}>Vers : {a.name}</option>)}
              </select>
              <input 
                type="number" 
                placeholder="Montant FCFA" 
                value={transferAmount} 
                onChange={(e) => setTransferAmount(e.target.value)} 
                style={{ flex: 1, minWidth: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }} 
              />
              <input 
                type="number" 
                placeholder="Frais (ex: 100)" 
                value={transferFee} 
                onChange={(e) => setTransferFee(e.target.value)} 
                style={{ width: 80, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }} 
              />
              <button onClick={handleTransfer} className="btn-monarch" style={{ fontSize: 10, padding: '6px 14px' }}>
                Transférer
              </button>
            </div>
          </div>

          {/* Saisie rapide d'opération & Historique */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 8 }}>ENREGISTRER UNE TRANSACTION</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <input 
                type="text" 
                placeholder="Libellé de la dépense/revenu" 
                value={txLabel} 
                onChange={(e) => setTxLabel(e.target.value)} 
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }} 
              />
              <input 
                type="number" 
                placeholder="Montant" 
                value={txAmount} 
                onChange={(e) => setTxAmount(e.target.value)} 
                style={{ flex: 1, minWidth: 80, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }} 
              />
              <select 
                value={txType} 
                onChange={(e) => setTxType(e.target.value)} 
                style={{ width: 100, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }}
              >
                <option value="EXPENSE">Dépense</option>
                <option value="INCOME">Revenu</option>
                <option value="DONATION">Don</option>
                <option value="INVESTMENT">Investissement</option>
              </select>
              <select 
                value={txAccount} 
                onChange={(e) => setTxAccount(e.target.value)} 
                style={{ flex: 1, minWidth: 100, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }}
              >
                {(finances.accounts || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <button onClick={handleAddTransaction} className="btn-monarch" style={{ fontSize: 10, padding: '6px 14px' }}>
                Enregistrer
              </button>
            </div>

            {/* Historique des 30 dernières transactions */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 6 }}>JOURNAL DES DERNIÈRES TRANSACTIONS</div>
            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(finances.transactions || []).slice(0, 30).map(tx => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: 6, fontSize: 11 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{tx.label}</span>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{tx.date} • {tx.type}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-hud)', color: tx.type === 'INCOME' ? 'var(--neon-green)' : tx.type === 'TRANSFER' ? 'var(--border-cyan)' : 'var(--text-main)' }}>
                    {tx.type === 'INCOME' ? '+' : tx.type === 'TRANSFER' ? '↔' : '−'}{formatFCFA(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: PATRIMOINE & DETTES ================= */}
      {activeSubTab === 'patrimoine' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Valeur Nette KPI Header */}
          <div className="system-window corner-cut" style={{ padding: '16px', borderColor: 'var(--border-cyan)' }}>
            <span className="system-window-title">VALEUR NETTE DU PATRIMOINE DU FOYER</span>
            <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--font-title)', color: netWorthData.netWorth >= 0 ? 'var(--border-cyan)' : 'var(--alert-red)', margin: '6px 0' }}>
              {formatFCFA(netWorthData.netWorth)}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Actifs bruts : <strong>{formatFCFA(netWorthData.grossWorth)}</strong></span>
              <span>•</span>
              <span style={{ color: 'var(--alert-red)' }}>Dettes / Passifs : <strong>{formatFCFA(netWorthData.totalLiabilities)}</strong></span>
            </div>
          </div>

          {/* Actifs Physiques & Immobiliers */}
          <div className="system-window" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="system-window-title">ACTIFS DU PATRIMOINE ({formatFCFA(netWorthData.totalAssets)})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {(finances.assets || []).map(ast => (
                <div key={ast.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-cyan-dim)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{ast.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Type : {ast.type} • {ast.notes}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-hud)', color: 'var(--border-cyan)' }}>
                    {formatFCFA(ast.value)}
                  </div>
                </div>
              ))}
            </div>

            {/* Ajouter un actif */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Nom de l'actif (ex: Terrain Agoè, Moto)" 
                value={newAssetName} 
                onChange={(e) => setNewAssetName(e.target.value)} 
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }} 
              />
              <select 
                value={newAssetType} 
                onChange={(e) => setNewAssetType(e.target.value)} 
                style={{ flex: 1, minWidth: 100, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }}
              >
                <option value="LAND">Terrain</option>
                <option value="HOUSE">Maison</option>
                <option value="CAR">Voiture</option>
                <option value="MOTO">Moto</option>
                <option value="BUSINESS">Business</option>
                <option value="OTHER">Autre actif</option>
              </select>
              <input 
                type="number" 
                placeholder="Valeur FCFA" 
                value={newAssetValue} 
                onChange={(e) => setNewAssetValue(e.target.value)} 
                style={{ flex: 1, minWidth: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }} 
              />
              <button onClick={handleAddAsset} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Ajouter
              </button>
            </div>
          </div>

          {/* Passifs & Dettes */}
          <div className="system-window" style={{ padding: '14px', borderColor: 'var(--alert-red)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="system-window-title" style={{ color: 'var(--alert-red)' }}>PASSIFS & DETTES DU FOYER ({formatFCFA(netWorthData.totalLiabilities)})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {(finances.liabilities || []).length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Aucune dette enregistrée. Bravo !</p>
              ) : (
                (finances.liabilities || []).map(liab => (
                  <div key={liab.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,46,76,0.1)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--alert-red-dim)' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{liab.name}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{liab.notes}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-hud)', color: 'var(--alert-red)' }}>
                      −{formatFCFA(liab.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Ajouter une dette */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Libellé du passif (ex: Emprunt, avance)" 
                value={newLiabName} 
                onChange={(e) => setNewLiabName(e.target.value)} 
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--alert-red-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }} 
              />
              <input 
                type="number" 
                placeholder="Montant FCFA" 
                value={newLiabAmount} 
                onChange={(e) => setNewLiabAmount(e.target.value)} 
                style={{ flex: 1, minWidth: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--alert-red-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }} 
              />
              <button onClick={handleAddLiability} className="btn-monarch btn-danger" style={{ fontSize: 10, padding: '6px 12px' }}>
                Enregistrer dette
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 4: INVESTISSEMENTS & BRVM ================= */}
      {activeSubTab === 'investments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Portefeuille BRVM Header */}
          <div className="system-window" style={{ padding: '14px', borderColor: 'var(--gold)' }}>
            <span className="system-window-title" style={{ color: 'var(--gold)' }}>PORTEFEUILLE D'ACTIONS BRVM</span>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--gold)', margin: '4px 0' }}>
              {formatFCFA(netWorthData.totalBrvm)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Actions cotées à la BRVM (jamais mélangées aux simulations)
            </div>
          </div>

          {/* Lignes BRVM */}
          <div className="system-window" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {(finances.positions || []).map(pos => {
                const totalCost = (pos.quantity || 0) * (pos.avgBuyPrice || 0);
                const curVal = (pos.quantity || 0) * (pos.currentPrice || pos.avgBuyPrice || 0);
                const gain = curVal - totalCost;
                const gainPct = totalCost > 0 ? Math.round((gain / totalCost) * 100) : 0;

                return (
                  <div key={pos.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-cyan-dim)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-title)', color: '#fff' }}>{pos.company}</span>
                        <span style={{ fontSize: 10, color: 'var(--border-cyan)', marginLeft: 6, fontWeight: 700 }}>({pos.ticker})</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-hud)', color: gain >= 0 ? 'var(--neon-green)' : 'var(--alert-red)' }}>
                        {formatFCFA(curVal)} ({gain >= 0 ? '+' : ''}{gainPct}%)
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                      <span>{pos.quantity} titres • PRU: {formatFCFA(pos.avgBuyPrice)}</span>
                      <span>Cours: {formatFCFA(pos.currentPrice)} • Dividendes: {formatFCFA(pos.dividends || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ajouter un titre BRVM */}
            <div style={{ borderTop: '1px solid var(--border-cyan-dim)', paddingTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--border-cyan)', marginBottom: 6 }}>+ NOUVEAU TITRE / LIGNE BRVM</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Société (ex: SOGB)" 
                  value={newPosCompany} 
                  onChange={(e) => setNewPosCompany(e.target.value)} 
                  style={{ flex: 1, minWidth: 100, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
                />
                <input 
                  type="text" 
                  placeholder="Ticker" 
                  value={newPosTicker} 
                  onChange={(e) => setNewPosTicker(e.target.value)} 
                  style={{ width: 70, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
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
                <button onClick={handleAddPosition} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* Simulateur d'intérêts composés */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 6 }}>SIMULATEUR DE RENDEMENT COMPOSÉ</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 100 }}>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Apport initial</span>
                <input 
                  type="number" 
                  value={simInitial} 
                  onChange={(e) => setSimInitial(Number(e.target.value))} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '4px 6px', fontSize: 11 }} 
                />
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Versement mensuel</span>
                <input 
                  type="number" 
                  value={simMonthly} 
                  onChange={(e) => setSimMonthly(Number(e.target.value))} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '4px 6px', fontSize: 11 }} 
                />
              </div>
              <div style={{ width: 60 }}>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Années</span>
                <input 
                  type="number" 
                  value={simYears} 
                  onChange={(e) => setSimYears(Number(e.target.value))} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '4px 6px', fontSize: 11 }} 
                />
              </div>
              <div style={{ width: 60 }}>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>Taux %</span>
                <input 
                  type="number" 
                  value={simRate} 
                  onChange={(e) => setSimRate(Number(e.target.value))} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '4px 6px', fontSize: 11 }} 
                />
              </div>
            </div>

            {(() => {
              const res = simulateCompoundInterest({ initial: simInitial, monthly: simMonthly, years: simYears, ratePct: simRate, feesPct: 1 });
              return (
                <div style={{ background: 'rgba(0,217,255,0.06)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-cyan-dim)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Capital final estimé :</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)' }}>{formatFCFA(res.finalValue)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                    <span>Total versé : {formatFCFA(res.totalContributed)}</span>
                    <span style={{ color: 'var(--neon-green)' }}>Gains générés : +{formatFCFA(res.totalGains)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 5: DÉCISIONS & SIMUS ================= */}
      {activeSubTab === 'decisions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="system-window" style={{ padding: '16px', borderColor: 'var(--border-cyan)' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 4 }}>
              « PUIS-JE ME LE PERMETTRE ? » (ANALYSE D'IMPACT IMMÉDIAT)
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Ce moteur teste l'impact d'une dépense sur votre trésorerie libre, votre fonds d'urgence et le reste à vivre sans modifier vos données réelles.
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input 
                type="number" 
                placeholder="Montant du projet ou achat (FCFA)" 
                value={decisionAmount} 
                onChange={(e) => setDecisionAmount(e.target.value)} 
                style={{ flex: 2, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '8px 10px', fontSize: 13 }} 
              />
              <select 
                value={decisionType} 
                onChange={(e) => setDecisionType(e.target.value)} 
                style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '8px 10px', fontSize: 12 }}
              >
                <option value="ACHAT">Achat / Consommation</option>
                <option value="INVESTISSEMENT">Investissement</option>
              </select>
              <button onClick={handleAnalyzeDecision} className="btn-monarch" style={{ padding: '8px 14px' }}>
                Analyser
              </button>
            </div>

            {decisionResult && (
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: 8, border: `1px solid ${decisionResult.badgeColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>VERDICT DU SYSTÈME</span>
                  <span style={{ fontSize: 11, fontWeight: 900, padding: '3px 8px', borderRadius: 12, background: 'rgba(0,0,0,0.6)', color: decisionResult.badgeColor, border: `1px solid ${decisionResult.badgeColor}` }}>
                    {decisionResult.verdict.replace(/_/g, ' ')}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#fff', lineHeight: 1.5, margin: '6px 0 8px' }}>
                  {decisionResult.explanation}
                </p>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {decisionResult.consequences.map((c, i) => <div key={i}>• {c}</div>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 6: PARAMÈTRES FOYER (COMPLET DE LIFEOSAPK) ================= */}
      {activeSubTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Section 1: Notre Foyer */}
          <div className="system-window" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="system-window-title">NOTRE FOYER</span>
              <span className="rank-badge rank-B" style={{ fontSize: 9 }}>ADMINISTRATEUR</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              Espace transparent du foyer. Rôles et membres avec accès ou visibilité.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(finances.couple?.members || []).map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{m.name}</span>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{m.email} • {m.role}</div>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--neon-green)', fontWeight: 700 }}>ACTIF</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Revenus Mensuels Déclarés */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 6 }}>REVENUS MENSUELS DU FOYER</span>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              Sources attendues, distinctes des encaissements réels (salaire, business, etc.).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {(finances.incomeSources || []).map(inc => (
                <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{inc.label}</span>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Type : {inc.kind} • {inc.active ? 'Actif' : 'Inactif'}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--neon-green)', fontFamily: 'var(--font-hud)' }}>
                    {formatFCFA(inc.monthlyAmount)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Libellé (ex: Salaire, E-commerce)" 
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
                <option value="BUSINESS">Activité</option>
                <option value="OTHER">Autre</option>
              </select>
              <input 
                type="number" 
                placeholder="Montant FCFA" 
                value={newIncomeAmount} 
                onChange={(e) => setNewIncomeAmount(e.target.value)} 
                style={{ flex: 1, minWidth: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <button onClick={handleAddIncomeSource} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Ajouter
              </button>
            </div>
          </div>

          {/* Section 3: Personnes à charge */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 6 }}>PERSONNES À CHARGE</span>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              Membres du foyer sans accès à l'application mais pris en compte dans la transparence familiale.
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {(finances.dependents || []).map(dep => (
                <div key={dep.id} style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#fff' }}>
                  {dep.name} ({dep.relationship})
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Nom de la personne" 
                value={newDepName} 
                onChange={(e) => setNewDepName(e.target.value)} 
                style={{ flex: 2, minWidth: 140, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <input 
                type="text" 
                placeholder="Lien familial (ex: Enfant, Parent)" 
                value={newDepRelation} 
                onChange={(e) => setNewDepRelation(e.target.value)} 
                style={{ flex: 1, minWidth: 120, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <button onClick={handleAddDependent} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Ajouter
              </button>
            </div>
          </div>

          {/* Section 4: Réglages financiers */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 6 }}>RÉGLAGES FINANCIERS DU SYSTÈME</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fonds d'urgence (mois de dépenses essentielles) :</span>
                <select 
                  value={finances.settings?.emergencyFundMonths || 3} 
                  onChange={(e) => handleUpdateSettings({ emergencyFundMonths: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: 4, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }}
                >
                  <option value={1}>1 mois</option>
                  <option value={3}>3 mois (Recommandé)</option>
                  <option value={6}>6 mois</option>
                  <option value={9}>9 mois</option>
                  <option value={12}>12 mois</option>
                </select>
                <div style={{ fontSize: 10, color: 'var(--border-cyan)', marginTop: 2 }}>
                  Cible calculée : {formatFCFA(efStatus.target)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Marge de sécurité mensuelle non mobilisable :</span>
                <input 
                  type="number" 
                  value={finances.settings?.safetyMargin || 20000} 
                  onChange={(e) => handleUpdateSettings({ safetyMargin: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: 4, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }} 
                />
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Compte par défaut (pour saisie rapide) :</span>
                <select 
                  value={finances.settings?.defaultAccountId || 'acc_wave'} 
                  onChange={(e) => handleUpdateSettings({ defaultAccountId: e.target.value })}
                  style={{ width: '100%', marginTop: 4, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12 }}
                >
                  {(finances.accounts || []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mode d'utilisation :</span>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button 
                    onClick={() => handleUpdateSettings({ mode: 'simple' })}
                    style={{ flex: 1, padding: '6px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: `1px solid ${finances.settings?.mode === 'simple' ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`, background: finances.settings?.mode === 'simple' ? 'rgba(0,217,255,0.2)' : 'rgba(0,0,0,0.3)', color: '#fff' }}
                  >
                    Simple (Quotidien)
                  </button>
                  <button 
                    onClick={() => handleUpdateSettings({ mode: 'analyse' })}
                    style={{ flex: 1, padding: '6px', borderRadius: 6, fontSize: 11, fontWeight: 700, border: `1px solid ${finances.settings?.mode === 'analyse' ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`, background: finances.settings?.mode === 'analyse' ? 'rgba(0,217,255,0.2)' : 'rgba(0,0,0,0.3)', color: '#fff' }}
                  >
                    Analyse (Patrimoine & BRVM)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Catégories personnalisées */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 6 }}>CATÉGORIES PERSONNALISÉES</span>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              Gestion des catégories, budgets mensuels et caractère essentiel pour le fonds d'urgence.
            </p>
            <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {(finances.categories || []).map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 6, fontSize: 11 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{cat.name}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-dim)', marginLeft: 6 }}>({cat.kind})</span>
                    {cat.essential && <span style={{ fontSize: 8, background: 'var(--border-cyan)', color: '#000', padding: '1px 4px', borderRadius: 4, marginLeft: 4, fontWeight: 900 }}>ESSENTIELLE</span>}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {cat.budgetMonthly ? formatFCFA(cat.budgetMonthly) : '—'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Nom catégorie" 
                value={newCatName} 
                onChange={(e) => setNewCatName(e.target.value)} 
                style={{ flex: 2, minWidth: 120, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }} 
              />
              <select 
                value={newCatKind} 
                onChange={(e) => setNewCatKind(e.target.value)} 
                style={{ width: 90, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11 }}
              >
                <option value="EXPENSE">Dépense</option>
                <option value="INCOME">Revenu</option>
                <option value="DONATION">Don</option>
                <option value="INVESTMENT">Invest.</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                <input 
                  type="checkbox" 
                  checked={newCatEssential} 
                  onChange={(e) => setNewCatEssential(e.target.checked)} 
                />
                Essentielle
              </label>
              <button onClick={handleAddCategory} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Ajouter
              </button>
            </div>
          </div>

          {/* Section 6: Point à clarifier (3 330 000 FCFA de 2028) */}
          <div className="system-window" style={{ padding: '14px', borderColor: 'var(--monarch-purple)' }}>
            <span className="system-window-title" style={{ color: 'var(--monarch-purple)', display: 'block', marginBottom: 4 }}>
              POINT STRUCTURANT : 3 330 000 FCFA EN 2028
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              {finances.clarification3m?.question || 'Que représentent les 3 330 000 FCFA de 2028 ?'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text" 
                value={clarifAnswer} 
                onChange={(e) => setClarifAnswer(e.target.value)} 
                placeholder="Ex: Revenu annuel cible, Épargne patrimoniale" 
                style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--monarch-purple-dim)', borderRadius: 6, color: '#fff', padding: '6px 10px', fontSize: 12 }} 
              />
              <button onClick={handleSaveClarification} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                Enregistrer
              </button>
            </div>
          </div>

          {/* Section 7: Journal d'audit du foyer */}
          <div className="system-window" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="system-window-title">JOURNAL D'AUDIT DU FOYER</span>
              <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>100 dernières actions</span>
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(finances.auditEvents || []).map(aud => (
                <div key={aud.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: 6, fontSize: 10 }}>
                  <span style={{ color: 'var(--border-cyan)', fontWeight: 700 }}>{aud.actorName}</span>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>{aud.action}</span>{' '}
                  <span style={{ color: '#fff', fontWeight: 600 }}>{aud.entity}</span>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                    {new Date(aud.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
