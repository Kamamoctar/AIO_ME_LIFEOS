import React, { useState, useEffect } from 'react';
import { DollarSign, Dumbbell, Check, Play, Pause, RotateCcw, ChevronDown, ChevronUp, AlertTriangle, TrendingUp } from 'lucide-react';
import { sound } from '../core/sound.js';

export default function BusinessWorkoutView({
  player,
  businessProjects,
  workouts,
  handstandLevels,
  budget,
  onToggleProjectStep,
  onToggleWorkoutSet,
  onToggleHandstandLevel,
  onUpdateWeight
}) {
  const [activeTab, setActiveTab] = useState('business'); // 'business' or 'workout'
  const [expandedProjectId, setExpandedProjectId] = useState('biz_kdp');
  const [selectedDay, setSelectedDay] = useState('lundi');

  // Rest Timer for workouts
  const [restTime, setRestTime] = useState(60);
  const [restRunning, setRestRunning] = useState(false);

  // Handstand Stopwatch
  const [hsTimer, setHsTimer] = useState(0);
  const [hsRunning, setHsRunning] = useState(false);

  // Weight input
  const [newWeight, setNewWeight] = useState(player.weight);

  // Rest timer tick
  useEffect(() => {
    let interval = null;
    if (restRunning && restTime > 0) {
      interval = setInterval(() => setRestTime(prev => prev - 1), 1000);
    } else if (restTime === 0 && restRunning) {
      setRestRunning(false);
      sound.playQuestComplete();
    }
    return () => clearInterval(interval);
  }, [restRunning, restTime]);

  // Handstand stopwatch tick
  useEffect(() => {
    let interval = null;
    if (hsRunning) {
      interval = setInterval(() => setHsTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [hsRunning]);

  const incomePercent = Math.min(100, Math.round((player.currentIncome / player.targetIncome) * 100));

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-float">
      
      {/* Sub Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(0,0,0,0.5)',
        border: '1px solid var(--border-cyan-dim)',
        borderRadius: 8,
        padding: 3
      }}>
        <button
          onClick={() => { sound.playClick(); setActiveTab('business'); }}
          style={{
            flex: 1,
            padding: '8px',
            background: activeTab === 'business' ? 'linear-gradient(135deg, rgba(0,217,255,0.25), rgba(123,47,255,0.3))' : 'none',
            border: activeTab === 'business' ? '1px solid var(--border-cyan)' : 'none',
            borderRadius: 6,
            color: activeTab === 'business' ? '#fff' : 'var(--text-dim)',
            fontFamily: 'var(--font-hud)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          💰 INDÉPENDANCE FINANCIÈRE
        </button>

        <button
          onClick={() => { sound.playClick(); setActiveTab('workout'); }}
          style={{
            flex: 1,
            padding: '8px',
            background: activeTab === 'workout' ? 'linear-gradient(135deg, rgba(0,255,136,0.25), rgba(0,217,255,0.3))' : 'none',
            border: activeTab === 'workout' ? '1px solid var(--neon-green)' : 'none',
            borderRadius: 6,
            color: activeTab === 'workout' ? '#fff' : 'var(--text-dim)',
            fontFamily: 'var(--font-hud)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🏋️ CORPS DE THOR (SPORT)
        </button>
      </div>

      {/* ==================== BUSINESS TAB ==================== */}
      {activeTab === 'business' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Income Header */}
          <div className="system-window corner-cut" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="system-window-title">OBJECTIF D’INDÉPENDANCE</span>
              <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                {incomePercent}% ATTEINT
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>REVENU ACTUEL</div>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-title)', fontWeight: 900, color: '#fff' }}>
                  {player.currentIncome.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>CIBLE SHADOW MONARCH</div>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-title)', fontWeight: 900, color: 'var(--gold)' }}>
                  {player.targetIncome.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
            </div>

            <div className="hud-bar-container" style={{ height: 8, marginBottom: 8 }}>
              <div className="hud-bar-fill gold" style={{ width: `${incomePercent}%` }} />
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>
              Reste à générer : {(player.targetIncome - player.currentIncome).toLocaleString('fr-FR')} FCFA / mois
            </div>
          </div>

          {/* 5 Revenue Dungeons */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ marginBottom: 12, display: 'block' }}>
              LES 5 DONJONS DE REVENUS
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {businessProjects.map(proj => {
                const isExpanded = expandedProjectId === proj.id;
                const completedSteps = proj.steps.filter(s => s.completed).length;
                const totalSteps = proj.steps.length;
                const progress = Math.round((completedSteps / totalSteps) * 100);

                return (
                  <div
                    key={proj.id}
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-cyan-dim)',
                      borderRadius: 8,
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                          {proj.name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 2, fontFamily: 'var(--font-hud)' }}>
                          Potentiel : {proj.potential}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)' }}>
                          {completedSteps}/{totalSteps} ({progress}%)
                        </span>
                        {isExpanded ? <ChevronUp size={16} color="var(--border-cyan)" /> : <ChevronDown size={16} color="var(--border-cyan)" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(0, 217, 255, 0.1)' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0', lineHeight: 1.4 }}>
                          {proj.description}
                        </p>
                        {proj.warning && (
                          <div style={{ fontSize: 10, color: 'var(--alert-red)', fontWeight: 700, marginBottom: 8 }}>
                            {proj.warning}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {proj.steps.map(step => (
                            <div
                              key={step.id}
                              onClick={() => onToggleProjectStep(proj.id, step.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                cursor: 'pointer',
                                fontSize: 11,
                                color: step.completed ? 'var(--neon-green)' : 'var(--text-main)'
                              }}
                            >
                              <div style={{
                                width: 16,
                                height: 16,
                                borderRadius: 4,
                                border: step.completed ? '1px solid var(--neon-green)' : '1px solid var(--border-cyan)',
                                background: step.completed ? 'var(--neon-green)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {step.completed && <Check size={12} color="#000" strokeWidth={3} />}
                              </div>
                              <span style={{ textDecoration: step.completed ? 'line-through' : 'none' }}>
                                {step.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Budget Mensuel */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ marginBottom: 10, display: 'block' }}>
              BUDGET MENSUEL CALIBRÉ (203 000 FCFA)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {budget.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 6,
                    fontSize: 11
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{item.category}</span>
                  <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: 'var(--border-cyan)' }}>
                    {item.amount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== WORKOUT TAB ==================== */}
      {activeTab === 'workout' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Day Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {['lundi', 'mardi', 'jeudi', 'samedi'].map(day => (
              <button
                key={day}
                onClick={() => { sound.playClick(); setSelectedDay(day); }}
                style={{
                  padding: '8px 4px',
                  background: selectedDay === day ? 'var(--border-cyan)' : 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-cyan)',
                  borderRadius: 6,
                  color: selectedDay === day ? '#000' : 'var(--border-cyan)',
                  fontFamily: 'var(--font-hud)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Selected Workout Card */}
          <div className="system-window" style={{ padding: '14px' }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 13, color: 'var(--neon-green)', marginBottom: 12 }}>
              {workouts[selectedDay].name}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workouts[selectedDay].exercises.map((exo, exoIdx) => (
                <div
                  key={exoIdx}
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border-cyan-dim)',
                    borderRadius: 8,
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{exo.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)' }}>
                      {exo.sets} séries × {exo.reps}
                    </span>
                  </div>

                  {/* Series Checkboxes */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {exo.done.map((done, setIdx) => (
                      <button
                        key={setIdx}
                        onClick={() => onToggleWorkoutSet(selectedDay, exoIdx, setIdx)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: 4,
                          background: done ? 'var(--neon-green)' : 'rgba(255,255,255,0.06)',
                          border: done ? '1px solid var(--neon-green)' : '1px solid var(--border-cyan-dim)',
                          color: done ? '#000' : '#fff',
                          fontFamily: 'var(--font-hud)',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4
                        }}
                      >
                        {done ? <Check size={12} strokeWidth={3} /> : `S${setIdx + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Built-in Rest Timer */}
          <div className="system-window" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>
                CHRONO DE REPOS
              </div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 22, fontWeight: 900, color: 'var(--border-cyan)' }}>
                {restTime}s
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {[60, 90, 120].map(s => (
                <button
                  key={s}
                  onClick={() => { sound.playClick(); setRestTime(s); setRestRunning(false); }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border-cyan-dim)',
                    color: '#fff',
                    fontSize: 10,
                    cursor: 'pointer'
                  }}
                >
                  {s}s
                </button>
              ))}
              <button
                onClick={() => { sound.playClick(); setRestRunning(!restRunning); }}
                className="btn-monarch"
                style={{ padding: '6px 12px' }}
              >
                {restRunning ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>
          </div>

          {/* Handstand Module */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ marginBottom: 10, display: 'block' }}>
              MODULE HANDSTAND (5 NIVEAUX)
            </span>

            {/* Stopwatch */}
            <div style={{
              background: 'rgba(0,0,0,0.5)',
              borderRadius: 8,
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12
            }}>
              <div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>CHRONO MAINTIEN</div>
                <div style={{ fontFamily: 'var(--font-title)', fontSize: 20, color: '#fff' }}>
                  {hsTimer} SECONDES
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { sound.playClick(); setHsRunning(!hsRunning); }}
                  className="btn-monarch"
                  style={{ padding: '6px 12px' }}
                >
                  {hsRunning ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={() => { sound.playClick(); setHsRunning(false); setHsTimer(0); }}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border-cyan-dim)',
                    color: '#fff',
                    borderRadius: 4,
                    padding: '6px 8px',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {handstandLevels.map(hl => (
                <div
                  key={hl.level}
                  onClick={() => onToggleHandstandLevel(hl.level)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: hl.completed ? 'rgba(0,255,136,0.1)' : 'rgba(0,0,0,0.3)',
                    border: hl.completed ? '1px solid var(--neon-green)' : '1px solid var(--border-cyan-dim)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 11
                  }}
                >
                  <span style={{ color: hl.completed ? 'var(--neon-green)' : '#fff', fontWeight: 600 }}>
                    {hl.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{hl.target}</span>
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: hl.completed ? 'var(--neon-green)' : 'none',
                      border: hl.completed ? '1px solid var(--neon-green)' : '1px solid var(--text-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {hl.completed && <Check size={12} color="#000" strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weight Tracker */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ marginBottom: 8, display: 'block' }}>
              SUIVI DU POIDS (OBJECTIF 75 KG SEC)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Poids actuel enregistré :</div>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-title)', color: '#fff' }}>
                  {player.weight} kg <span style={{ fontSize: 11, color: 'var(--border-cyan)' }}>→ 75.0 kg (+10 kg)</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(parseFloat(e.target.value))}
                  style={{
                    width: 70,
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid var(--border-cyan-dim)',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '6px 8px',
                    fontFamily: 'var(--font-hud)',
                    fontSize: 14
                  }}
                />
                <button
                  onClick={() => {
                    sound.playQuestComplete();
                    onUpdateWeight(newWeight);
                  }}
                  className="btn-monarch"
                  style={{ padding: '6px 10px', fontSize: 11 }}
                >
                  Sauver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
