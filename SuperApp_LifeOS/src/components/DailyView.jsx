import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Star, Battery, Sun, Sunset, Moon, 
  ChevronDown, ChevronUp, Sparkles, BookOpen, Heart, Brain, 
  Clock, Play, Pause, RotateCcw, Plus, AlertOctagon, Flame, ArrowRight,
  Gauge, Wallet, TrendingDown, PiggyBank, TrendingUp, AlertTriangle, 
  Landmark, Scale, Edit3, X, Check, Target, Shield, CalendarClock
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { 
  formatFCFA, 
  formatCompactFCFA, 
  computeFinancialCapacity, 
  computeEmergencyFundStatus,
  computeCashStatus,
  computeNetWorth,
  generateFinancialAlerts 
} from '../core/financeEngine.js';
import confetti from 'canvas-confetti';

export default function DailyView({
  dailyQuests,
  onToggleQuest,
  onToggleSubtask,
  dailyEntry,
  onUpdateDailyEntry,
  focusTrio,
  onValidateHabit,
  userSettings,
  finances,
  onUpdateFinances,
  actions = [],
  onToggleAction,
  onAddAction,
  goals = [],
  projects = [],
  onAddCapturedTask,
  onAddXp,
  theme
}) {
  const [subSection, setSubSection] = useState('focus'); // 'focus', 'cockpit', 'actions'
  const [showRituels, setShowRituels] = useState(false);
  const [newActionInput, setNewActionInput] = useState('');

  // 2-Minute Anti-Procrastination Timer
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  // Income / Salary edit modal
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [editSalaryInput, setEditSalaryInput] = useState(finances?.monthlySalary || '');
  const [editTargetInput, setEditTargetInput] = useState(finances?.targetIncome || '');

  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      sound.playLevelUp();
      confetti({ particleCount: 40, spread: 50 });
      alert('Bravo ! Les 2 minutes sont écoulées. Votre cerveau est engagé dans l’action !');
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Derived financial capacity
  const currentSalary = Number(finances?.monthlySalary) || 0;
  const targetIncome = Number(finances?.targetIncome) || 0;
  const incomePercent = targetIncome > 0 ? Math.min(100, Math.round((currentSalary / targetIncome) * 100)) : 0;
  const multiplierFactor = currentSalary > 0 && targetIncome > 0 ? (targetIncome / currentSalary).toFixed(1) : 'x3.6';

  const capacity = computeFinancialCapacity(finances || {});
  const efStatus = computeEmergencyFundStatus(finances || {});
  const cashStatus = computeCashStatus(finances?.accounts || [], finances?.transactions || [], finances?.settings?.safetyMargin || 0);
  const netWorthData = computeNetWorth(finances || {});
  const alerts = generateFinancialAlerts(finances || {});

  // Upcoming 60-day deadlines (from Goals, Projects, Charges)
  const today = new Date();
  const upcomingDeadlines = React.useMemo(() => {
    const list = [];
    for (const g of (goals || [])) {
      if (!g.targetDate || g.status === 'TERMINE') continue;
      const d = new Date(g.targetDate);
      const days = Math.round((d.getTime() - today.getTime()) / 86400000);
      if (days >= 0 && days <= 60) list.push({ title: g.title, date: g.targetDate, days, kind: 'Objectif', amount: g.budget });
    }
    for (const p of (projects || [])) {
      if (!p.targetDate || p.archived) continue;
      const d = new Date(p.targetDate);
      const days = Math.round((d.getTime() - today.getTime()) / 86400000);
      if (days >= 0 && days <= 60) list.push({ title: p.title || p.name, date: p.targetDate, days, kind: 'Projet', amount: p.budget });
    }
    for (const c of (finances?.charges || [])) {
      if (!c.active || !c.nextDueDate) continue;
      const d = new Date(c.nextDueDate);
      const days = Math.round((d.getTime() - today.getTime()) / 86400000);
      if (days >= 0 && days <= 60) list.push({ title: c.label, date: c.nextDueDate, days, kind: 'Charge', amount: c.amount });
    }
    return list.sort((a, b) => a.days - b.days).slice(0, 5);
  }, [goals, projects, finances?.charges, today]);

  // Save Salary
  const handleSaveSalary = () => {
    const sal = parseInt(editSalaryInput, 10) || 0;
    const tgt = parseInt(editTargetInput, 10) || 0;
    sound.playLevelUp();
    onUpdateFinances({
      ...finances,
      monthlySalary: sal,
      targetIncome: tgt
    });
    onAddXp(5, 'DSC');
    setIsSalaryModalOpen(false);
  };

  // Toggle Deep Work Block
  const handleToggleBlock = (blockKey) => {
    sound.playClick();
    const cur = dailyEntry[blockKey] || { task: '', done: false };
    const nextDone = !cur.done;
    if (nextDone) {
      sound.playQuestComplete();
      onAddXp(10, 'INT');
    }
    onUpdateDailyEntry({
      ...dailyEntry,
      [blockKey]: { ...cur, done: nextDone }
    });
  };

  // Add Action
  const handleCreateAction = () => {
    if (!newActionInput.trim()) return;
    sound.playClick();
    if (onAddAction) {
      onAddAction({
        id: 'act_' + Date.now(),
        title: newActionInput.trim(),
        done: false,
        priority: 'HAUTE',
        dueDate: new Date().toISOString().split('T')[0]
      });
    }
    setNewActionInput('');
  };

  return (
    <div style={{ padding: '0 12px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      
      {/* 1. Global Multiplier Hero Card (Direct Editable Salary) */}
      <div className="omni-card gold-edge">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={16} color="var(--accent-gold)" />
            <span className="omni-card-title" style={{ color: 'var(--accent-gold)' }}>
              OBJECTIF MULTIPLICATEUR REVENU ({multiplierFactor})
            </span>
          </div>
          <button
            onClick={() => {
              setEditSalaryInput(finances?.monthlySalary || '');
              setEditTargetInput(finances?.targetIncome || '');
              setIsSalaryModalOpen(true);
            }}
            style={{
              background: 'var(--accent-gold-dim)',
              border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              cursor: 'pointer'
            }}
          >
            <Edit3 size={11} /> MODIFIER
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', margin: '6px 0' }}>
          <div>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>SALAIRE NET ACTUEL</span>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', color: currentSalary > 0 ? '#fff' : 'var(--text-muted)' }}>
              {currentSalary > 0 ? formatFCFA(currentSalary) : '0 FCFA (Non défini)'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>CIBLE MENSUELLE VISÉE</span>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', color: targetIncome > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
              {targetIncome > 0 ? formatFCFA(targetIncome) : 'Non définie'}
            </div>
          </div>
        </div>

        <div className="hud-bar-container" style={{ height: 6 }}>
          <div className="hud-bar-fill gold" style={{ width: `${incomePercent}%` }} />
        </div>
      </div>

      {/* Salary Modal */}
      {isSalaryModalOpen && (
        <div className="omni-modal-overlay" onClick={() => setIsSalaryModalOpen(false)}>
          <div className="omni-modal-sheet" onClick={(e) => e.stopPropagation()} style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="omni-card-title" style={{ color: 'var(--accent-gold)' }}>DÉFINIR VOS REVENUS RÉELS</span>
              <button onClick={() => setIsSalaryModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>SALAIRE NET MENSUEL (FCFA) :</label>
                <input
                  type="number"
                  placeholder="Ex : 250000"
                  value={editSalaryInput}
                  onChange={(e) => setEditSalaryInput(e.target.value)}
                  className="input-futuristic"
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: 10, color: 'var(--accent-gold)', display: 'block', marginBottom: 3 }}>CIBLE MENSUELLE VISÉE (FCFA) :</label>
                <input
                  type="number"
                  placeholder="Ex : 1000000"
                  value={editTargetInput}
                  onChange={(e) => setEditTargetInput(e.target.value)}
                  className="input-futuristic"
                />
              </div>
            </div>
            <button onClick={handleSaveSalary} className="btn-action gold" style={{ width: '100%', padding: '10px' }}>
              ✓ Enregistrer les revenus
            </button>
          </div>
        </div>
      )}

      {/* 2. Sub-Navigation Capsules */}
      <div className="subtabs-capsule-bar">
        {[
          { id: 'focus', label: '⚡ FOCUS DU JOUR', icon: Flame },
          { id: 'cockpit', label: '📊 COCKPIT VITAL', icon: Gauge },
          { id: 'actions', label: `✓ ACTIONS DU JOUR (${actions.filter(a => !a.done).length})`, icon: CheckCircle2 }
        ].map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => { sound.playClick(); setSubSection(s.id); }}
              className={`subtab-pill ${subSection === s.id ? 'active' : ''}`}
            >
              <Icon size={12} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ================= SUB-SECTION 1: FOCUS DU JOUR (MK + SOLO LEVELING) ================= */}
      {subSection === 'focus' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Priority Domino MK */}
          <div className="omni-card cyan-edge">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={16} color="var(--accent-cyan)" />
                <span className="omni-card-title">DOMINO UNIQUE DU JOUR (SYSTÈME MK)</span>
              </div>
              {dailyEntry?.priorityDone && (
                <span style={{ fontSize: 10, color: 'var(--accent-emerald)', fontFamily: 'var(--font-hud)', fontWeight: 800 }}>
                  ✓ ACCOMPLI (+25 XP)
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              La seule tâche qui, une fois terminée, rendra toutes les autres plus faciles ou inutiles.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => {
                  const nextDone = !dailyEntry?.priorityDone;
                  if (nextDone) { sound.playLevelUp(); onAddXp(25, 'DSC'); }
                  onUpdateDailyEntry({ ...dailyEntry, priorityDone: nextDone });
                }}
                style={{
                  background: dailyEntry?.priorityDone ? 'var(--accent-emerald)' : 'rgba(0,0,0,0.4)',
                  border: `1px solid ${dailyEntry?.priorityDone ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                  color: dailyEntry?.priorityDone ? '#000' : 'var(--text-muted)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                {dailyEntry?.priorityDone ? <Check size={14} strokeWidth={3} /> : <Circle size={14} />}
              </button>
              <input
                type="text"
                placeholder="Définir le Domino prioritaire..."
                value={dailyEntry?.priority || ''}
                onChange={(e) => onUpdateDailyEntry({ ...dailyEntry, priority: e.target.value })}
                className="input-futuristic"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: dailyEntry?.priorityDone ? 'line-through' : 'none',
                  color: dailyEntry?.priorityDone ? 'var(--text-muted)' : '#fff'
                }}
              />
            </div>
          </div>

          {/* 4 Deep Work Blocks & Anti-Procrastination Timer */}
          <div className="omni-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="omni-card-title">4 BLOCS DE DEEP WORK (MK)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="var(--accent-cyan)" />
                <span style={{ fontSize: 10, fontFamily: 'var(--font-hud)', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                  CHRONO 2 MIN : {timerSeconds}s
                </span>
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', padding: 2 }}
                >
                  {timerRunning ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button
                  onClick={() => { setTimerRunning(false); setTimerSeconds(120); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['block1', 'block2', 'block3', 'block4'].map((bKey, idx) => {
                const blk = dailyEntry?.[bKey] || { task: '', done: false };
                return (
                  <div key={bKey} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-inset)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                    <button
                      onClick={() => handleToggleBlock(bKey)}
                      style={{ background: 'none', border: 'none', color: blk.done ? 'var(--accent-emerald)' : 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      {blk.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </button>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-hud)', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                      BLOC {idx + 1} :
                    </span>
                    <input
                      type="text"
                      placeholder={`Mission du Bloc ${idx + 1}...`}
                      value={blk.task || ''}
                      onChange={(e) => onUpdateDailyEntry({ ...dailyEntry, [bKey]: { ...blk, task: e.target.value } })}
                      style={{ flex: 1, background: 'none', border: 'none', color: blk.done ? 'var(--text-muted)' : '#fff', fontSize: 12, outline: 'none', textDecoration: blk.done ? 'line-through' : 'none' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Hunter Quests Solo Leveling */}
          <div className="omni-card purple-edge">
            <span className="omni-card-title" style={{ color: 'var(--accent-purple)', marginBottom: 8 }}>
              QUÊTES QUOTIDIENNES DU CHASSEUR
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(dailyQuests || []).map(q => (
                <div
                  key={q.id}
                  onClick={() => onToggleQuest(q.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: q.completed ? 'var(--accent-emerald-dim)' : 'var(--bg-inset)',
                    border: `1px solid ${q.completed ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {q.completed ? <CheckCircle2 size={16} color="var(--accent-emerald)" /> : <Circle size={16} color="var(--text-muted)" />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: q.completed ? 'var(--text-muted)' : '#fff', textDecoration: q.completed ? 'line-through' : 'none' }}>
                      {q.title}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-hud)', fontWeight: 800, color: q.completed ? 'var(--accent-emerald)' : 'var(--accent-gold)' }}>
                    +{q.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Trio d'habitudes (Évolution) */}
          <div className="omni-card">
            <span className="omni-card-title" style={{ marginBottom: 6 }}>FOCUS TRIO (3 HABITUDES CLÉS)</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(focusTrio || [
                { id: 'ft_1', title: 'Lecture 20m', status: 'TODO', xp: 5 },
                { id: 'ft_2', title: 'Sport / Thor', status: 'TODO', xp: 10 },
                { id: 'ft_3', title: 'Zikr / Médit.', status: 'TODO', xp: 5 }
              ]).map((h, idx) => {
                const isDone = h.status === 'DONE';
                return (
                  <button
                    key={h.id || idx}
                    onClick={() => onValidateHabit(idx, isDone ? 'TODO' : 'DONE')}
                    style={{
                      background: isDone ? 'var(--accent-emerald-dim)' : 'var(--bg-inset)',
                      border: `1px solid ${isDone ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: isDone ? 'var(--accent-emerald)' : '#fff' }}>
                      {h.title}
                    </span>
                    <span style={{ fontSize: 9, color: isDone ? 'var(--accent-emerald)' : 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>
                      {isDone ? '✓ FAIT' : `+${h.xp || 5} XP`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-SECTION 2: COCKPIT VITAL (LIFEOSAPK ENGINE) ================= */}
      {subSection === 'cockpit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 4 Essential Capacity KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div className="omni-card">
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>REVENUS ATTENDUS / MOIS</span>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#fff', margin: '2px 0' }}>
                {formatFCFA(capacity.expectedMonthlyIncome)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Salaire {formatCompactFCFA(capacity.salary)}</div>
            </div>

            <div className="omni-card red-edge">
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>DÉPENSES ESSENTIELLES</span>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--accent-red)', margin: '2px 0' }}>
                {formatFCFA(capacity.essentialExpenses)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Charges fixes + alimentation</div>
            </div>

            <div className="omni-card cyan-edge">
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>CAPACITÉ D'ÉPARGNE / MOIS</span>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--accent-cyan)', margin: '2px 0' }}>
                {formatFCFA(capacity.savingsCapacity)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Après essentiels et provisions</div>
            </div>

            <div className="omni-card emerald-edge">
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>CAPACITÉ D'INVESTISSEMENT</span>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--accent-emerald)', margin: '2px 0' }}>
                {formatFCFA(capacity.investmentCapacity)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Sans compromettre la sécurité</div>
            </div>
          </div>

          {/* Liquid Cash vs Net Worth */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div className="omni-card">
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>LIQUIDITÉS DISPONIBLES</span>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-display)', color: cashStatus.availableCash > 0 ? 'var(--accent-cyan)' : 'var(--accent-red)' }}>
                {formatFCFA(cashStatus.availableCash)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Marge protégée : {formatCompactFCFA(finances?.settings?.safetyMargin || 0)}</div>
            </div>

            <div className="omni-card gold-edge">
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>PATRIMOINE NET</span>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--accent-gold)' }}>
                {formatFCFA(netWorthData.netWorth)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Actifs − Passifs</div>
            </div>
          </div>

          {/* Automated Financial Alerts */}
          <div className="omni-card">
            <span className="omni-card-title" style={{ marginBottom: 8 }}>ALERTES DE TRÉSORERIE DU FOYER</span>
            {alerts.length === 0 ? (
              <div style={{ padding: '8px', background: 'rgba(16,185,129,0.06)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent-emerald)' }}>
                <CheckCircle2 size={14} /> Trésorerie et charges sous contrôle parfait.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {alerts.map(alt => (
                  <div key={alt.id} style={{ padding: '8px 10px', borderRadius: 6, background: alt.level === 'alert' ? 'var(--accent-red-dim)' : 'var(--accent-gold-dim)', border: `1px solid ${alt.level === 'alert' ? 'var(--accent-red)' : 'var(--accent-gold)'}` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: alt.level === 'alert' ? 'var(--accent-red)' : 'var(--accent-gold)' }}>{alt.title}</div>
                    <div style={{ fontSize: 10, color: '#fff' }}>{alt.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming 60-day deadlines */}
          <div className="omni-card">
            <span className="omni-card-title" style={{ marginBottom: 8 }}>ÉCHÉANCES DES 60 PROCHAINS JOURS</span>
            {upcomingDeadlines.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
                Aucune échéance critique d'ici 60 jours.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {upcomingDeadlines.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-inset)', padding: '6px 10px', borderRadius: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{it.title}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{it.kind} • Dans {it.days} jours ({it.date})</div>
                    </div>
                    {it.amount && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-hud)' }}>
                        {formatFCFA(it.amount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-SECTION 3: ACTIONS DU JOUR ================= */}
      {subSection === 'actions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="omni-card">
            <span className="omni-card-title" style={{ marginBottom: 8 }}>ACTIONS ET TÂCHES OUVERTES</span>
            
            {/* Quick add action input */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Nouvelle tâche à accomplir..."
                value={newActionInput}
                onChange={(e) => setNewActionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAction()}
                className="input-futuristic"
              />
              <button onClick={handleCreateAction} className="btn-action" style={{ padding: '6px 12px' }}>
                Ajouter
              </button>
            </div>

            {actions.length === 0 ? (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>
                Aucune action en attente. Votre esprit est libre !
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {actions.map(act => (
                  <div
                    key={act.id}
                    onClick={() => onToggleAction && onToggleAction(act.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: act.done ? 'var(--accent-emerald-dim)' : 'var(--bg-inset)',
                      border: `1px solid ${act.done ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {act.done ? <CheckCircle2 size={16} color="var(--accent-emerald)" /> : <Circle size={16} color="var(--text-muted)" />}
                      <span style={{ fontSize: 12, fontWeight: 700, color: act.done ? 'var(--text-muted)' : '#fff', textDecoration: act.done ? 'line-through' : 'none' }}>
                        {act.title}
                      </span>
                    </div>
                    {act.priority && (
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-hud)', fontWeight: 800, color: act.priority === 'CRITIQUE' ? 'var(--accent-red)' : 'var(--accent-cyan)' }}>
                        {act.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
