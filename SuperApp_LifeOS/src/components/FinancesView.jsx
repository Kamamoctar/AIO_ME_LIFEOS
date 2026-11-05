import React, { useState } from 'react';
import { 
  TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, Plus, 
  Users, Shield, PieChart, Calendar, AlertCircle 
} from 'lucide-react';
import { sound } from '../core/sound.js';

export default function FinancesView({
  finances,
  onUpdateFinances,
  onAddXp
}) {
  const [activeSubTab, setActiveSubTab] = useState('enveloppes'); // 'enveloppes', '120jours', 'transactions'
  const [txLabel, setTxLabel] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txEnvelope, setTxEnvelope] = useState('env_vital');
  const [txIsShared, setTxIsShared] = useState(true);

  const currentSalary = finances.monthlySalary || 203000;
  const targetIncome = finances.targetIncome || 733333;
  const incomePercent = Math.min(100, Math.round((currentSalary / targetIncome) * 100));

  const totalAllocated = (finances.envelopes || []).reduce((sum, e) => sum + (e.allocated || 0), 0);
  const totalSpent = (finances.envelopes || []).reduce((sum, e) => sum + (e.spent || 0), 0);
  const resteAVivre = currentSalary - totalSpent;

  const handleAddTransaction = () => {
    const amountNum = parseInt(txAmount, 10);
    if (!txLabel.trim() || isNaN(amountNum) || amountNum <= 0) return;

    sound.playClick();
    const newTx = {
      id: 'tx_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      label: txLabel.trim(),
      amount: amountNum,
      type: 'EXPENSE',
      envelopeId: txEnvelope,
      isShared: txIsShared
    };

    // Update envelope spent
    const updatedEnvelopes = (finances.envelopes || []).map(env => {
      if (env.id === txEnvelope) {
        return { ...env, spent: (env.spent || 0) + amountNum };
      }
      return env;
    });

    onUpdateFinances({
      ...finances,
      envelopes: updatedEnvelopes,
      transactions: [newTx, ...(finances.transactions || [])]
    });

    setTxLabel('');
    setTxAmount('');
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-float">
      
      {/* 1. Target Income Gauge (Solo Leveling / FinanceOS) */}
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
              {currentSalary.toLocaleString()} FCFA
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>CIBLE MENSUELLE</span>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--gold)' }}>
              {targetIncome.toLocaleString()} FCFA
            </div>
          </div>
        </div>

        <div className="hud-bar-container" style={{ height: 8 }}>
          <div className="hud-bar-fill gold" style={{ width: `${incomePercent}%` }} />
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { id: 'enveloppes', label: 'BUDGET ENVELOPPES' },
          { id: '120jours', label: 'TRÉSORERIE 120 JOURS' },
          { id: 'transactions', label: `TRANSACTIONS (${(finances.transactions || []).length})` },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => {
              sound.playClick();
              setActiveSubTab(st.id);
            }}
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              borderRadius: 6,
              border: `1px solid ${activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`,
              background: activeSubTab === st.id ? 'rgba(0,217,255,0.2)' : 'rgba(0,0,0,0.4)',
              color: activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* --- SUB TAB 1: ENVELOPPES BUDGÉTAIRES DU FOYER --- */}
      {activeSubTab === 'enveloppes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Quick Reste à Vivre Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div className="system-window" style={{ padding: '10px 12px' }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>TOTAL DÉPENSÉ</span>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--alert-red)', fontFamily: 'var(--font-title)' }}>
                {totalSpent.toLocaleString()} F
              </div>
            </div>
            <div className="system-window" style={{ padding: '10px 12px' }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>RESTE À VIVRE DISPONIBLE</span>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--neon-green)', fontFamily: 'var(--font-title)' }}>
                {resteAVivre.toLocaleString()} F
              </div>
            </div>
          </div>

          {/* Envelopes List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(finances.envelopes || []).map(env => {
              const envPercent = Math.min(100, Math.round(((env.spent || 0) / (env.allocated || 1)) * 100));
              return (
                <div key={env.id} className="system-window" style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{env.name}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-title)', color: envPercent > 90 ? 'var(--alert-red)' : 'var(--border-cyan)' }}>
                      {(env.spent || 0).toLocaleString()} / {env.allocated.toLocaleString()} F
                    </span>
                  </div>
                  <div className="hud-bar-container" style={{ height: 5 }}>
                    <div
                      className="hud-bar-fill"
                      style={{
                        width: `${envPercent}%`,
                        background: envPercent > 90 ? 'var(--alert-red)' : 'var(--border-cyan)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Expense Form with Foyer toggle */}
          <div className="system-window" style={{ padding: '12px' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-title)', color: 'var(--border-cyan)', display: 'block', marginBottom: 8 }}>
              SAISIR UNE DÉPENSE
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                value={txLabel}
                onChange={(e) => setTxLabel(e.target.value)}
                placeholder="Intitulé de la dépense (ex: Épicerie, Aliments volaille...)"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '6px 8px', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="Montant FCFA..."
                  style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '6px 8px', outline: 'none' }}
                />
                <select
                  value={txEnvelope}
                  onChange={(e) => setTxEnvelope(e.target.value)}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 10, padding: '0 6px', outline: 'none' }}
                >
                  {(finances.envelopes || []).map(env => (
                    <option key={env.id} value={env.id}>{env.name}</option>
                  ))}
                </select>
              </div>

              {/* Mode Foyer toggle (partagé ou personnel) */}
              <div
                onClick={() => setTxIsShared(!txIsShared)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 11, color: txIsShared ? 'var(--neon-green)' : 'var(--text-muted)' }}
              >
                <Users size={16} color={txIsShared ? 'var(--neon-green)' : 'var(--text-dim)'} />
                <span>{txIsShared ? 'Dépense commune du Foyer (Partagée)' : 'Dépense Personnelle / Privée'}</span>
              </div>

              <button
                onClick={handleAddTransaction}
                className="btn-monarch"
                style={{ padding: '8px', fontSize: 11, marginTop: 4 }}
              >
                + ENREGISTRER LA DÉPENSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB TAB 2: PROJECTION TRÉSORERIE 120 JOURS --- */}
      {activeSubTab === '120jours' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Projection dynamique de trésorerie sur les 4 prochains mois (M+1 à M+4) sans double comptage.
          </div>

          {[
            { month: 'Novembre 2026 (M)', income: 203000, fixedCharges: 120000, projectInvest: 40000, projectedSolde: 43000 },
            { month: 'Décembre 2026 (M+1)', income: 250000, fixedCharges: 125000, projectInvest: 50000, projectedSolde: 75000 },
            { month: 'Janvier 2027 (M+2)', income: 320000, fixedCharges: 120000, projectInvest: 60000, projectedSolde: 140000 },
            { month: 'Février 2027 (M+3)', income: 450000, fixedCharges: 130000, projectInvest: 80000, projectedSolde: 240000 },
          ].map((m, idx) => (
            <div key={idx} className="system-window" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{m.month}</span>
                <span style={{ fontSize: 12, fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--neon-green)' }}>
                  +{m.projectedSolde.toLocaleString()} F
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)' }}>
                <span>Entrées : {m.income.toLocaleString()} F</span>
                <span>Charges : {m.fixedCharges.toLocaleString()} F</span>
                <span>Investissement : {m.projectInvest.toLocaleString()} F</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SUB TAB 3: HISTORIQUE DES TRANSACTIONS --- */}
      {activeSubTab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(finances.transactions || []).map(tx => (
            <div key={tx.id} className="system-window" style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{tx.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span>{tx.date}</span>
                  {tx.isShared && <span style={{ color: 'var(--neon-green)' }}>• Foyer partagé</span>}
                </div>
              </div>
              <span style={{
                fontSize: 13,
                fontWeight: 900,
                fontFamily: 'var(--font-title)',
                color: tx.type === 'INCOME' ? 'var(--neon-green)' : 'var(--alert-red)'
              }}>
                {tx.type === 'INCOME' ? '+' : '-'}{tx.amount.toLocaleString()} F
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

