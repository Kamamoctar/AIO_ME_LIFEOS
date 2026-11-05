import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Clock, Zap, Plus, Minus, Trophy, AlertCircle } from 'lucide-react';
import { sound } from '../core/sound.js';
import confetti from 'canvas-confetti';

export default function QuestsView({
  dailyQuests,
  weeklyQuests,
  monthlyBoss,
  onToggleDailyQuest,
  onToggleDailySubtask,
  onToggleWeeklyQuest,
  onUpdateBossTarget,
  onDefeatBoss
}) {
  const [activeSubTab, setActiveSubTab] = useState('daily'); // 'daily', 'weekly', 'boss'
  const [expandedQuestId, setExpandedQuestId] = useState(null);

  const triggerCelebration = () => {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00D9FF', '#7B2FFF', '#00FF88']
    });
  };

  const timeBlocks = [
    { id: 'matin', title: '🌅 MATIN (06h00 – 07h00) — L’Heure Sacrée' },
    { id: 'trajet', title: '🚗 TRAJET (07h00 – 07h40) — Trajet Intelligent' },
    { id: 'journee', title: '☀️ TOUTE LA JOURNÉE — Présence & Pureté' },
    { id: 'soir', title: '🌙 SOIR (21h40 – 23h00) — Le Donjon Nocturne' },
  ];

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
          onClick={() => { sound.playClick(); setActiveSubTab('daily'); }}
          style={{
            flex: 1,
            padding: '8px 4px',
            background: activeSubTab === 'daily' ? 'linear-gradient(135deg, rgba(0,217,255,0.25), rgba(123,47,255,0.3))' : 'none',
            border: activeSubTab === 'daily' ? '1px solid var(--border-cyan)' : 'none',
            borderRadius: 6,
            color: activeSubTab === 'daily' ? '#fff' : 'var(--text-dim)',
            fontFamily: 'var(--font-hud)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🔄 QUOTIDIENNES ({dailyQuests.filter(q => q.completed).length}/{dailyQuests.length})
        </button>

        <button
          onClick={() => { sound.playClick(); setActiveSubTab('weekly'); }}
          style={{
            flex: 1,
            padding: '8px 4px',
            background: activeSubTab === 'weekly' ? 'linear-gradient(135deg, rgba(0,217,255,0.25), rgba(123,47,255,0.3))' : 'none',
            border: activeSubTab === 'weekly' ? '1px solid var(--border-cyan)' : 'none',
            borderRadius: 6,
            color: activeSubTab === 'weekly' ? '#fff' : 'var(--text-dim)',
            fontFamily: 'var(--font-hud)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          📅 HEBDO ({weeklyQuests.filter(q => q.completed).length}/{weeklyQuests.length})
        </button>

        <button
          onClick={() => { sound.playClick(); setActiveSubTab('boss'); }}
          style={{
            flex: 1,
            padding: '8px 4px',
            background: activeSubTab === 'boss' ? 'linear-gradient(135deg, rgba(123,47,255,0.35), rgba(255,46,76,0.3))' : 'none',
            border: activeSubTab === 'boss' ? '1px solid var(--monarch-purple)' : 'none',
            borderRadius: 6,
            color: activeSubTab === 'boss' ? '#fff' : 'var(--text-dim)',
            fontFamily: 'var(--font-hud)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🏰 BOSS DU MOIS
        </button>
      </div>

      {/* DAILY QUESTS CONTENT */}
      {activeSubTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} color="var(--border-cyan)" />
            <span>Chaque quête complétée = XP. Quête non faite à minuit = -5 XP de pénalité.</span>
          </div>

          {timeBlocks.map(block => {
            const questsInBlock = dailyQuests.filter(q => q.bloc === block.id);
            if (questsInBlock.length === 0) return null;

            return (
              <div key={block.id} className="system-window" style={{ padding: '12px' }}>
                <div style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-title)',
                  color: 'var(--border-cyan)',
                  letterSpacing: 0.5,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  {block.title}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {questsInBlock.map(quest => {
                    const isExpanded = expandedQuestId === quest.id;

                    return (
                      <div
                        key={quest.id}
                        style={{
                          background: quest.completed ? 'rgba(0, 255, 136, 0.06)' : 'rgba(0,0,0,0.35)',
                          border: quest.completed ? '1px solid var(--neon-green)' : '1px solid var(--border-cyan-dim)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div
                            onClick={() => {
                              onToggleDailyQuest(quest.id);
                              if (!quest.completed) triggerCelebration();
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }}
                          >
                            {/* Checkbox */}
                            <div style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              border: quest.completed ? '1px solid var(--neon-green)' : '1px solid var(--border-cyan)',
                              background: quest.completed ? 'var(--neon-green)' : 'rgba(0,0,0,0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: quest.completed ? '0 0 10px var(--neon-green)' : 'none',
                              transition: 'all 0.2s'
                            }}>
                              {quest.completed && <Check size={16} color="#000" strokeWidth={3} />}
                            </div>

                            <div>
                              <div style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: quest.completed ? 'var(--neon-green)' : '#fff',
                                textDecoration: quest.completed ? 'line-through' : 'none'
                              }}>
                                {quest.emoji} {quest.title}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 2 }}>
                                <span style={{ color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                                  +{quest.xp} XP ({quest.stat})
                                </span>
                                <span>{quest.timeSlot}</span>
                              </div>
                            </div>
                          </div>

                          {/* Subtasks collapse button */}
                          {quest.subtasks && quest.subtasks.length > 0 && (
                            <button
                              onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--border-cyan)',
                                padding: 6,
                                cursor: 'pointer',
                                display: 'flex'
                              }}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          )}
                        </div>

                        {/* Expandable Subtasks */}
                        {isExpanded && quest.subtasks && (
                          <div style={{
                            marginTop: 10,
                            paddingTop: 8,
                            borderTop: '1px solid rgba(0, 217, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            paddingLeft: 34
                          }}>
                            {quest.subtasks.map(st => (
                              <div
                                key={st.id}
                                onClick={() => onToggleDailySubtask(quest.id, st.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  cursor: 'pointer',
                                  fontSize: 12,
                                  color: st.completed ? 'var(--neon-green)' : 'var(--text-muted)'
                                }}
                              >
                                <div style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 4,
                                  border: st.completed ? '1px solid var(--neon-green)' : '1px solid var(--text-dim)',
                                  background: st.completed ? 'var(--neon-green)' : 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {st.completed && <Check size={12} color="#000" strokeWidth={3} />}
                                </div>
                                <span style={{ textDecoration: st.completed ? 'line-through' : 'none' }}>
                                  {st.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WEEKLY QUESTS CONTENT */}
      {activeSubTab === 'weekly' && (
        <div className="system-window" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="system-window-title">QUÊTES HEBDOMADAIRES</span>
            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>
              Reset chaque lundi 00h00
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weeklyQuests.map(quest => (
              <div
                key={quest.id}
                onClick={() => {
                  onToggleWeeklyQuest(quest.id);
                  if (!quest.completed) triggerCelebration();
                }}
                style={{
                  background: quest.completed ? 'rgba(0, 255, 136, 0.06)' : 'rgba(0,0,0,0.35)',
                  border: quest.completed ? '1px solid var(--neon-green)' : '1px solid var(--border-cyan-dim)',
                  borderRadius: 8,
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: quest.completed ? '1px solid var(--neon-green)' : '1px solid var(--border-cyan)',
                  background: quest.completed ? 'var(--neon-green)' : 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: quest.completed ? '0 0 10px var(--neon-green)' : 'none'
                }}>
                  {quest.completed && <Check size={16} color="#000" strokeWidth={3} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: quest.completed ? 'var(--neon-green)' : '#fff',
                    textDecoration: quest.completed ? 'line-through' : 'none'
                  }}>
                    {quest.emoji} {quest.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)', fontWeight: 700, marginTop: 2 }}>
                    +{quest.xp} XP ({quest.stat})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MONTHLY BOSS DONJON CONTENT */}
      {activeSubTab === 'boss' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Boss Banner */}
          <div className="system-window corner-cut" style={{
            padding: '16px',
            borderColor: 'var(--monarch-purple)',
            background: 'linear-gradient(135deg, rgba(123,47,255,0.2), rgba(10,14,26,0.9))'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 900, color: '#c77dff' }}>
                🏰 BOSS DU MOIS 1 : {monthlyBoss.name}
              </div>
              <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                +{monthlyBoss.rewardXp} XP & TITRE
              </span>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              {monthlyBoss.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-hud)', marginBottom: 4 }}>
              <span style={{ color: 'var(--gold)' }}>TITRE RÉCOMPENSE : « {monthlyBoss.rewardTitle} »</span>
              <span style={{ color: 'var(--alert-red)' }}>Échec &lt;50% : -{monthlyBoss.penaltyXp} XP</span>
            </div>
          </div>

          {/* Targets List */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ marginBottom: 12, display: 'block' }}>
              LES 9 OBJECTIFS DU DONJON
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {monthlyBoss.targets.map(target => {
                const isFinished = target.current >= target.max;

                return (
                  <div
                    key={target.id}
                    style={{
                      background: isFinished ? 'rgba(0,255,136,0.08)' : 'rgba(0,0,0,0.4)',
                      border: isFinished ? '1px solid var(--neon-green)' : '1px solid var(--border-cyan-dim)',
                      borderRadius: 8,
                      padding: '10px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: isFinished ? 'var(--neon-green)' : '#fff' }}>
                        {target.label}
                      </span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-hud)', fontWeight: 700, color: isFinished ? 'var(--neon-green)' : 'var(--border-cyan)' }}>
                        {target.current} / {target.max} {target.unit}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="hud-bar-container" style={{ flex: 1, height: 6 }}>
                        <div
                          className={`hud-bar-fill ${isFinished ? 'green' : 'gold'}`}
                          style={{ width: `${Math.min(100, (target.current / target.max) * 100)}%` }}
                        />
                      </div>

                      {/* Counter Controls */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => onUpdateBossTarget(target.id, -1)}
                          disabled={target.current <= 0}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 4,
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid var(--border-cyan-dim)',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          onClick={() => {
                            onUpdateBossTarget(target.id, 1);
                            if (target.current + 1 >= target.max) triggerCelebration();
                          }}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 4,
                            background: 'rgba(0, 217, 255, 0.2)',
                            border: '1px solid var(--border-cyan)',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
