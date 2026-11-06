import React, { useState } from 'react';
import { 
  X, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Lightbulb, 
  HeartPulse, GraduationCap, CheckCircle2, Plus, Sparkles 
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { formatFCFA } from '../core/financeEngine.js';

export default function QuickAddModal({
  isOpen,
  onClose,
  finances,
  onUpdateFinances,
  onAddIdea,
  onAddHealthMetric,
  onAddSkill,
  onAddAction,
  onAddXp
}) {
  const [activeType, setActiveType] = useState('EXPENSE'); // 'EXPENSE', 'INCOME', 'TRANSFER', 'IDEA', 'HEALTH', 'ACTION'

  // Form states - Finance
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [accountId, setAccountId] = useState(finances?.accounts?.[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(finances?.accounts?.[1]?.id || finances?.accounts?.[0]?.id || '');
  const [transferFee, setTransferFee] = useState('');
  const [categoryId, setCategoryId] = useState(finances?.categories?.[0]?.id || 'cat_alim');

  // Form states - Idea
  const [ideaText, setIdeaText] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('Business');

  // Form states - Health
  const [weight, setWeight] = useState('');
  const [sportMinutes, setSportMinutes] = useState('30');
  const [sleepHours, setSleepHours] = useState('7.5');
  const [healthNotes, setHealthNotes] = useState('');

  // Form states - Action / Task
  const [actionTitle, setActionTitle] = useState('');
  const [actionPriority, setActionPriority] = useState('HAUTE');

  if (!isOpen) return null;

  const handleSave = () => {
    sound.playClick();

    if (activeType === 'EXPENSE' || activeType === 'INCOME') {
      const amt = parseInt(amount, 10);
      if (isNaN(amt) || amt <= 0 || !label.trim()) return;

      const targetAcc = accountId || finances?.accounts?.[0]?.id || 'acc_default';
      const newTx = {
        id: 'tx_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        label: label.trim(),
        amount: amt,
        fee: 0,
        type: activeType,
        accountId: targetAcc,
        categoryId: categoryId,
        isShared: true
      };

      onUpdateFinances({
        ...finances,
        transactions: [newTx, ...(finances.transactions || [])]
      });
      onAddXp(2, 'DSC');
    } 
    else if (activeType === 'TRANSFER') {
      const amt = parseInt(amount, 10);
      const fee = parseInt(transferFee, 10) || 0;
      if (isNaN(amt) || amt <= 0 || !accountId || !toAccountId || accountId === toAccountId) return;

      const fromAcc = (finances.accounts || []).find(a => a.id === accountId);
      const toAcc = (finances.accounts || []).find(a => a.id === toAccountId);

      const newTx = {
        id: 'tx_tf_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        label: `Virement : ${fromAcc?.name || 'Source'} → ${toAcc?.name || 'Destinataire'}`,
        amount: amt,
        fee: fee,
        type: 'TRANSFER',
        accountId: accountId,
        toAccountId: toAccountId,
        isShared: true
      };

      onUpdateFinances({
        ...finances,
        transactions: [newTx, ...(finances.transactions || [])]
      });
      onAddXp(3, 'DSC');
    }
    else if (activeType === 'IDEA') {
      if (!ideaText.trim()) return;
      onAddIdea({
        id: 'idea_' + Date.now(),
        title: ideaText.trim(),
        category: ideaCategory,
        dateAdded: new Date().toISOString().split('T')[0],
        quarantineDaysLeft: 30,
        status: 'EN_QUARANTAINE'
      });
      onAddXp(5, 'INT');
    }
    else if (activeType === 'HEALTH') {
      const w = parseFloat(weight);
      const s = parseInt(sportMinutes, 10) || 0;
      const sl = parseFloat(sleepHours) || 0;

      onAddHealthMetric({
        id: 'hm_' + Date.now(),
        date: new Date().toISOString(),
        weight: !isNaN(w) && w > 0 ? w : null,
        sportDone: s > 0,
        sportMinutes: s,
        sleepHours: sl,
        notes: healthNotes.trim() || null
      });
      onAddXp(10, 'VIT');
    }
    else if (activeType === 'ACTION') {
      if (!actionTitle.trim()) return;
      onAddAction({
        id: 'act_' + Date.now(),
        title: actionTitle.trim(),
        done: false,
        priority: actionPriority,
        dueDate: new Date().toISOString().split('T')[0]
      });
      onAddXp(5, 'DSC');
    }

    sound.playLevelUp();
    onClose();
  };

  return (
    <div className="omni-modal-overlay" onClick={onClose}>
      <div className="omni-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color="var(--accent-cyan)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: 0.5 }}>
              CAPTURE INSTANTANÉE (QUICK-ADD)
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Type Selector Pills */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 16px 8px', overflowX: 'auto' }}>
          {[
            { id: 'EXPENSE', label: 'Dépense', icon: ArrowDownCircle, color: 'var(--accent-red)' },
            { id: 'INCOME', label: 'Revenu', icon: ArrowUpCircle, color: 'var(--accent-emerald)' },
            { id: 'TRANSFER', label: 'Virement', icon: ArrowLeftRight, color: 'var(--accent-cyan)' },
            { id: 'IDEA', label: 'Idée (30j)', icon: Lightbulb, color: 'var(--accent-gold)' },
            { id: 'HEALTH', label: 'Point Santé', icon: HeartPulse, color: '#F43F5E' },
            { id: 'ACTION', label: 'Action', icon: CheckCircle2, color: 'var(--accent-purple)' },
          ].map(t => {
            const Icon = t.icon;
            const active = activeType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { sound.playClick(); setActiveType(t.id); }}
                style={{
                  padding: '6px 11px',
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${active ? t.color : 'var(--border-subtle)'}`,
                  background: active ? `${t.color}22` : 'rgba(0,0,0,0.3)',
                  color: active ? t.color : 'var(--text-muted)',
                  fontFamily: 'var(--font-hud)',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Form Content */}
        <div style={{ padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          {/* EXPENSE / INCOME */}
          {(activeType === 'EXPENSE' || activeType === 'INCOME') && (
            <>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>MONTANT EN FCFA :</label>
                <input
                  type="number"
                  placeholder="Ex : 15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-futuristic"
                  style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-hud)' }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>LIBELLÉ / RAISON :</label>
                <input
                  type="text"
                  placeholder="Ex : Courses du foyer, Plein carburant..."
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="input-futuristic"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>COMPTE :</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="input-futuristic"
                  >
                    {(finances?.accounts || []).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>CATÉGORIE :</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="input-futuristic"
                  >
                    {(finances?.categories || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* TRANSFER */}
          {activeType === 'TRANSFER' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>DEPUIS :</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="input-futuristic"
                  >
                    {(finances?.accounts || []).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>VERS :</label>
                  <select
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="input-futuristic"
                  >
                    {(finances?.accounts || []).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>MONTANT VIREMENT :</label>
                  <input
                    type="number"
                    placeholder="Montant FCFA"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-futuristic"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>FRAIS (ZÉRO FAUSSE DÉPENSE) :</label>
                  <input
                    type="number"
                    placeholder="Ex: 100"
                    value={transferFee}
                    onChange={(e) => setTransferFee(e.target.value)}
                    className="input-futuristic"
                  />
                </div>
              </div>
            </>
          )}

          {/* IDEA */}
          {activeType === 'IDEA' && (
            <>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>DESCRIPTION DE L'IDÉE :</label>
                <textarea
                  rows={3}
                  placeholder="Notez votre intuition ou idée sans agir immédiatement..."
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  className="input-futuristic"
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>DOMAINE :</label>
                <select
                  value={ideaCategory}
                  onChange={(e) => setIdeaCategory(e.target.value)}
                  className="input-futuristic"
                >
                  <option value="Business">Business & Projets</option>
                  <option value="Finance">Finances & Investissement</option>
                  <option value="Personnel">Développement & Esprit</option>
                  <option value="Foyer">Foyer & Famille</option>
                </select>
              </div>
            </>
          )}

          {/* HEALTH */}
          {activeType === 'HEALTH' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div>
                <label style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>POIDS (KG) :</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex : 68.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="input-futuristic"
                />
              </div>
              <div>
                <label style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>SPORT (MIN) :</label>
                <input
                  type="number"
                  value={sportMinutes}
                  onChange={(e) => setSportMinutes(e.target.value)}
                  className="input-futuristic"
                />
              </div>
              <div>
                <label style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>SOMMEIL (H) :</label>
                <input
                  type="number"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className="input-futuristic"
                />
              </div>
            </div>
          )}

          {/* ACTION */}
          {activeType === 'ACTION' && (
            <>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>INTITULÉ DE L'ACTION :</label>
                <input
                  type="text"
                  placeholder="Ex : Signer le contrat, vérifier relevé..."
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  className="input-futuristic"
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>PRIORITÉ :</label>
                <select
                  value={actionPriority}
                  onChange={(e) => setActionPriority(e.target.value)}
                  className="input-futuristic"
                >
                  <option value="CRITIQUE">Critique (Aujourd'hui)</option>
                  <option value="HAUTE">Haute</option>
                  <option value="MOYENNE">Moyenne</option>
                  <option value="FAIBLE">Faible</option>
                </select>
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSave}
            className="btn-action"
            style={{ width: '100%', padding: '12px', fontSize: 12, marginTop: 6 }}
          >
            ✓ ENREGISTRER L'OPÉRATION
          </button>
        </div>
      </div>
    </div>
  );
}

