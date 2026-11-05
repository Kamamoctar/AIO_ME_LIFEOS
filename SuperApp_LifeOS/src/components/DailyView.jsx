import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Star, Battery, Sun, Sunset, Moon, 
  ChevronDown, ChevronUp, Sparkles, BookOpen, Heart, Brain, PenTool 
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { GRILLE_DATA } from '../data/grilleData.js';

export default function DailyView({
  dailyQuests,
  onToggleQuest,
  onToggleSubtask,
  dailyEntry,
  onUpdateDailyEntry,
  focusTrio,
  onValidateHabit,
  onAddXp
}) {
  const [expandedQuestId, setExpandedQuestId] = useState(null);
  const [showJournal, setShowJournal] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);

  const today = new Date();
  const dayOfMonth = today.getDate();
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const currentDayName = dayNames[today.getDay()];

  // Destiny Grid lookup
  const destinyDayInfo = GRILLE_DATA.guideDuMois[dayOfMonth.toString()] || { texte: "Journée normale", impacts: {} };
  const isFavorableDay = GRILLE_DATA.semaine.favorables.includes(currentDayName);

  const toggleExpand = (id) => {
    sound.playClick();
    setExpandedQuestId(prev => prev === id ? null : id);
  };

  const handlePriorityToggle = () => {
    const nextDone = !dailyEntry.priorityDone;
    if (nextDone) {
      sound.playQuestComplete();
      onAddXp(10, 'DSC');
    } else {
      sound.playClick();
    }
    onUpdateDailyEntry({ ...dailyEntry, priorityDone: nextDone });
  };

  const handleRitualCheck = (type, id) => {
    sound.playClick();
    const listKey = type === 'morning' ? 'morningRitual' : 'eveningRitual';
    const updated = (dailyEntry[listKey] || []).map(item => {
      if (item.id === id) {
        const nextState = !item.done;
        if (nextState) onAddXp(2, 'DSC');
        return { ...item, done: nextState };
      }
      return item;
    });
    onUpdateDailyEntry({ ...dailyEntry, [listKey]: updated });
  };

  const handleEnergyChange = (e) => {
    const val = parseInt(e.target.value, 10);
    onUpdateDailyEntry({ ...dailyEntry, energy: val });
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-float">
      
      {/* 1. Destiny Verdict Banner (Mon Astre) */}
      <div className="system-window" style={{
        padding: '12px 14px',
        borderColor: isFavorableDay ? 'var(--neon-green)' : 'var(--border-cyan)',
        background: 'rgba(10, 14, 26, 0.85)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color="var(--gold)" />
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 11, fontWeight: 700, color: '#fff' }}>
              ALIGNEMENT DU JOUR • {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </span>
          </div>
          <span style={{
            fontSize: 9,
            padding: '2px 8px',
            borderRadius: 12,
            fontFamily: 'var(--font-hud)',
            fontWeight: 700,
            background: isFavorableDay ? 'rgba(0,255,136,0.15)' : 'rgba(255,215,0,0.15)',
            color: isFavorableDay ? 'var(--neon-green)' : 'var(--gold)',
            border: `1px solid ${isFavorableDay ? 'var(--neon-green-dim)' : 'var(--gold-dim)'}`
          }}>
            {isFavorableDay ? 'JOUR FORT' : 'JOUR VARIABLE'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-main)', marginTop: 4 }}>
          <strong>Jour {dayOfMonth} :</strong> {destinyDayInfo.texte}
        </div>
      </div>

      {/* 2. Priorité Absolue du Jour (Système MK) */}
      <div className="system-window corner-cut" style={{
        padding: '14px',
        borderColor: dailyEntry.priorityDone ? 'var(--neon-green)' : 'var(--gold)',
        boxShadow: dailyEntry.priorityDone ? '0 0 15px rgba(0,255,136,0.3)' : '0 0 15px rgba(255,215,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Star size={16} color="var(--gold)" fill="var(--gold)" />
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 11, fontWeight: 900, color: 'var(--gold)', letterSpacing: 0.5 }}>
              PRIORITÉ UNIQUE DU JOUR (SYSTÈME MK)
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
            +10 XP DSC
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handlePriorityToggle}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
          >
            {dailyEntry.priorityDone ? (
              <CheckCircle2 size={24} color="var(--neon-green)" />
            ) : (
              <Circle size={24} color="var(--gold)" />
            )}
          </button>
          <input
            type="text"
            value={dailyEntry.priority || ''}
            onChange={(e) => onUpdateDailyEntry({ ...dailyEntry, priority: e.target.value })}
            placeholder="Quelle est ton unique priorité absolue aujourd'hui ?"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px dashed var(--border-cyan-dim)',
              color: dailyEntry.priorityDone ? 'var(--text-muted)' : '#fff',
              fontSize: 14,
              fontWeight: 600,
              padding: '4px 0',
              textDecoration: dailyEntry.priorityDone ? 'line-through' : 'none',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* 3. Jauge d'Énergie Quotidienne & 4 Blocs de Temps (MK) */}
      <div className="system-window" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-title)', color: 'var(--border-cyan)' }}>
            <Battery size={16} />
            <span>JAUGE D'ÉNERGIE : {dailyEntry.energy || 7} / 10</span>
          </div>
          <button
            onClick={() => setShowBlocks(!showBlocks)}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {showBlocks ? 'Masquer 4 Blocs' : 'Voir les 4 Blocs'}
            {showBlocks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={dailyEntry.energy || 7}
          onChange={handleEnergyChange}
          style={{ width: '100%', accentColor: 'var(--border-cyan)' }}
        />

        {showBlocks && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border-cyan-dim)', paddingTop: 10 }}>
            {['morning', 'lunchTransit', 'afternoon', 'evening'].map(blockKey => {
              const labels = {
                morning: '🌅 Matin (05h30 - 08h00)',
                lunchTransit: '🚗 Midi / Trajet (12h00 - 14h00)',
                afternoon: '☀️ Après-midi (14h00 - 18h00)',
                evening: '🌙 Soir (20h00 - 23h00)'
              };
              return (
                <div key={blockKey} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-hud)', color: 'var(--text-muted)' }}>
                    {labels[blockKey]}
                  </span>
                  <input
                    type="text"
                    value={dailyEntry.blocks ? dailyEntry.blocks[blockKey] || '' : ''}
                    onChange={(e) => {
                      const nextBlocks = { ...(dailyEntry.blocks || {}), [blockKey]: e.target.value };
                      onUpdateDailyEntry({ ...dailyEntry, blocks: nextBlocks });
                    }}
                    placeholder="Focus du bloc..."
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-cyan-dim)',
                      borderRadius: 4,
                      color: '#fff',
                      fontSize: 12,
                      padding: '4px 8px',
                      outline: 'none'
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Trio de Focus d'Habitudes (Zone d'Évolution) */}
      <div className="system-window" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>🎯</span>
            <span className="system-window-title">TRIO DE FOCUS D'HABITUDES (MAX 3)</span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>Évolution</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(focusTrio || []).map((habit, idx) => (
            <div key={habit.code || idx} style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border-cyan-dim)',
              borderRadius: 8,
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{habit.title}</span>
                <span style={{ fontSize: 9, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)' }}>
                  +{habit.xp} XP
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                <button
                  onClick={() => onValidateHabit(idx, 'DONE')}
                  style={{
                    flex: 1,
                    background: habit.status === 'DONE' ? 'var(--neon-green)' : 'rgba(0,255,136,0.1)',
                    border: '1px solid var(--neon-green)',
                    color: habit.status === 'DONE' ? '#000' : 'var(--neon-green)',
                    borderRadius: 4,
                    padding: '4px',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🟢 Complet
                </button>
                <button
                  onClick={() => onValidateHabit(idx, 'STEP')}
                  style={{
                    flex: 1,
                    background: habit.status === 'STEP' ? 'var(--gold)' : 'rgba(255,215,0,0.1)',
                    border: '1px solid var(--gold)',
                    color: habit.status === 'STEP' ? '#000' : 'var(--gold)',
                    borderRadius: 4,
                    padding: '4px',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🟡 Petit Pas
                </button>
                <button
                  onClick={() => onValidateHabit(idx, 'SKIPPED')}
                  style={{
                    flex: 1,
                    background: habit.status === 'SKIPPED' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: habit.status === 'SKIPPED' ? '#fff' : 'var(--text-dim)',
                    borderRadius: 4,
                    padding: '4px',
                    fontSize: 10,
                    cursor: 'pointer'
                  }}
                >
                  ⚪ Sauté
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Quêtes Quotidiennes (Solo Leveling) */}
      <div className="system-window" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>📋</span>
            <span className="system-window-title">QUÊTES QUOTIDIENNES DU JOUEUR</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>
            {dailyQuests.filter(q => q.completed).length} / {dailyQuests.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dailyQuests.map(quest => {
            const isExpanded = expandedQuestId === quest.id;
            return (
              <div
                key={quest.id}
                style={{
                  background: quest.completed ? 'rgba(0, 255, 136, 0.05)' : 'rgba(0,0,0,0.4)',
                  border: `1px solid ${quest.completed ? 'var(--neon-green-dim)' : 'var(--border-cyan-dim)'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <button
                      onClick={() => onToggleQuest(quest.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                    >
                      {quest.completed ? (
                        <CheckCircle2 size={20} color="var(--neon-green)" />
                      ) : (
                        <Circle size={20} color="var(--border-cyan)" />
                      )}
                    </button>
                    <div>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: quest.completed ? 'var(--text-muted)' : '#fff',
                        textDecoration: quest.completed ? 'line-through' : 'none'
                      }}>
                        {quest.emoji} {quest.title}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>
                        {quest.timeSlot} • +{quest.xp} XP {quest.stat}
                      </div>
                    </div>
                  </div>

                  {quest.subtasks && quest.subtasks.length > 0 && (
                    <button
                      onClick={() => toggleExpand(quest.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>

                {isExpanded && quest.subtasks && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {quest.subtasks.map(st => (
                      <div
                        key={st.id}
                        onClick={() => onToggleSubtask(quest.id, st.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: st.completed ? 'var(--text-muted)' : 'var(--text-main)' }}
                      >
                        {st.completed ? <CheckCircle2 size={14} color="var(--neon-green)" /> : <Circle size={14} color="var(--text-dim)" />}
                        <span style={{ textDecoration: st.completed ? 'line-through' : 'none' }}>{st.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Rituels Matin & Soir + Journal Introspectif unifié (MK) */}
      <div className="system-window" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PenTool size={16} color="var(--border-cyan)" />
            <span className="system-window-title">RITUELS & JOURNAL DU SOIR</span>
          </div>
          <button
            onClick={() => setShowJournal(!showJournal)}
            style={{ background: 'none', border: 'none', color: 'var(--border-cyan)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-hud)', fontWeight: 700 }}
          >
            {showJournal ? 'RÉDUIRE' : 'OUVRIR JOURNAL'}
          </button>
        </div>

        {/* Morning Ritual */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sun size={14} /> Rituel Matinal
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {(dailyEntry.morningRitual || []).map(r => (
              <div
                key={r.id}
                onClick={() => handleRitualCheck('morning', r.id)}
                style={{
                  background: r.done ? 'rgba(0,255,136,0.1)' : 'rgba(0,0,0,0.4)',
                  border: `1px solid ${r.done ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  color: r.done ? 'var(--neon-green)' : 'var(--text-main)'
                }}
              >
                {r.done ? <CheckCircle2 size={12} color="var(--neon-green)" /> : <Circle size={12} color="var(--text-dim)" />}
                <span>{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evening Ritual */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--monarch-purple)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Moon size={14} /> Rituel du Soir
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {(dailyEntry.eveningRitual || []).map(r => (
              <div
                key={r.id}
                onClick={() => handleRitualCheck('evening', r.id)}
                style={{
                  background: r.done ? 'rgba(123,47,255,0.2)' : 'rgba(0,0,0,0.4)',
                  border: `1px solid ${r.done ? 'var(--monarch-purple)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  color: r.done ? '#c77dff' : 'var(--text-main)'
                }}
              >
                {r.done ? <CheckCircle2 size={12} color="#c77dff" /> : <Circle size={12} color="var(--text-dim)" />}
                <span>{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evening Introspection Journal */}
        {showJournal && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-cyan-dim)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--border-cyan)', marginBottom: 3 }}>
                <Brain size={13} /> Journal Tête (Leçons & clarté intellectuelle)
              </div>
              <textarea
                value={dailyEntry.journal ? dailyEntry.journal.head || '' : ''}
                onChange={(e) => {
                  const nextJournal = { ...(dailyEntry.journal || {}), head: e.target.value };
                  onUpdateDailyEntry({ ...dailyEntry, journal: nextJournal });
                }}
                placeholder="Qu'ai-je appris aujourd'hui ? Quelles erreurs éviter ?"
                rows={2}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 12, padding: 8, outline: 'none' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 3 }}>
                <Heart size={13} /> Journal Cœur (Gratitudes & liens du foyer)
              </div>
              <textarea
                value={dailyEntry.journal ? dailyEntry.journal.heart || '' : ''}
                onChange={(e) => {
                  const nextJournal = { ...(dailyEntry.journal || {}), heart: e.target.value };
                  onUpdateDailyEntry({ ...dailyEntry, journal: nextJournal });
                }}
                placeholder="Mes gratitudes envers Allah et les miens..."
                rows={2}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--gold-dim)', borderRadius: 6, color: '#fff', fontSize: 12, padding: 8, outline: 'none' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--alert-red)', marginBottom: 3 }}>
                <Sunset size={13} /> Vider le Mental (Anti-rumination)
              </div>
              <textarea
                value={dailyEntry.journal ? dailyEntry.journal.mindDump || '' : ''}
                onChange={(e) => {
                  const nextJournal = { ...(dailyEntry.journal || {}), mindDump: e.target.value };
                  onUpdateDailyEntry({ ...dailyEntry, journal: nextJournal });
                }}
                placeholder="Dépose ici toutes les tensions et pensées parasites pour dormir en paix."
                rows={2}
                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--alert-red-dim)', borderRadius: 6, color: '#fff', fontSize: 12, padding: 8, outline: 'none' }}
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

