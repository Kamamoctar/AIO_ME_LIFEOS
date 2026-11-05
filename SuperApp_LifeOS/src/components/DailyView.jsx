import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Star, Battery, Sun, Sunset, Moon, 
  ChevronDown, ChevronUp, Sparkles, BookOpen, Heart, Brain, 
  Clock, Play, Pause, RotateCcw, Plus, AlertOctagon, Flame, ArrowRight
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { GRILLE_DATA } from '../data/grilleData.js';
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
  onAddCapturedTask,
  onAddXp
}) {
  const [showRituels, setShowRituels] = useState(false);
  const [showBlocks, setShowBlocks] = useState(true);
  const [quickCaptureText, setQuickCaptureText] = useState('');

  // 2-Minute Anti-Procrastination Timer
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      sound.playLevelUp();
      confetti({ particleCount: 40, spread: 50 });
      alert('Bravo ! Les 2 minutes sont écoulées. Votre cerveau est maintenant engagé dans l’action !');
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const today = new Date();
  const dayOfMonth = today.getDate();
  const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const currentDayName = dayNames[today.getDay()];

  // Calcul du jour de l'Astre (personnalisé si date de naissance fournie)
  let destinyDayIndex = dayOfMonth;
  if (userSettings?.birthDate) {
    try {
      const bDate = new Date(userSettings.birthDate);
      const diffTime = Math.abs(today - bDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      destinyDayIndex = ((diffDays % 45) || 45);
    } catch {
      destinyDayIndex = dayOfMonth;
    }
  }

  const destinyDayInfo = GRILLE_DATA.guideDuMois[destinyDayIndex.toString()] || GRILLE_DATA.guideDuMois[dayOfMonth.toString()] || { texte: "Action réfléchie et persévérance.", impacts: {} };
  const isFavorableDay = GRILLE_DATA.semaine.favorables.includes(currentDayName);

  const handlePriorityToggle = () => {
    const nextDone = !dailyEntry.priorityDone;
    if (nextDone) {
      sound.playQuestComplete();
      onAddXp(15, 'DSC');
    } else {
      sound.playClick();
    }
    onUpdateDailyEntry({ ...dailyEntry, priorityDone: nextDone });
  };

  const handleBlockChange = (blockKey, field, value) => {
    onUpdateDailyEntry({
      ...dailyEntry,
      [blockKey]: { ...(dailyEntry[blockKey] || {}), [field]: value }
    });
  };

  const handleBlockToggle = (blockKey) => {
    const cur = dailyEntry[blockKey] || { task: '', done: false };
    const nextDone = !cur.done;
    if (nextDone) {
      sound.playQuestComplete();
      onAddXp(10, 'INT');
    } else {
      sound.playClick();
    }
    onUpdateDailyEntry({
      ...dailyEntry,
      [blockKey]: { ...cur, done: nextDone }
    });
  };

  const handleRitualCheck = (type, id) => {
    sound.playClick();
    const listKey = type === 'morning' ? 'morningRitual' : 'eveningRitual';
    const updated = (dailyEntry[listKey] || []).map(item => {
      if (item.id === id) {
        const nextState = !item.done;
        if (nextState) onAddXp(3, 'DSC');
        return { ...item, done: nextState };
      }
      return item;
    });
    onUpdateDailyEntry({ ...dailyEntry, [listKey]: updated });
  };

  const handleQuickCapture = (e) => {
    e.preventDefault();
    if (!quickCaptureText.trim()) return;
    sound.playQuestComplete();
    if (onAddCapturedTask) onAddCapturedTask(quickCaptureText.trim());
    setQuickCaptureText('');
    alert(`« ${quickCaptureText.trim()} » capturé dans votre système !`);
  };

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-float">
      
      {/* 1. Météo & Alignement du Jour (Mon Astre & Briefing) */}
      <div className="neuro-card" style={{ borderColor: isFavorableDay ? 'var(--neon-green-dim)' : 'var(--border-cyan-dim)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={15} color="var(--gold)" />
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 11, fontWeight: 800, color: 'var(--text-white)' }}>
              ALIGNEMENT • {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
            </span>
          </div>
          <span style={{
            fontSize: 9,
            padding: '2px 8px',
            borderRadius: 12,
            fontFamily: 'var(--font-hud)',
            fontWeight: 800,
            background: isFavorableDay ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: isFavorableDay ? 'var(--neon-green)' : 'var(--gold)'
          }}>
            {isFavorableDay ? 'JOUR FORT' : 'JOUR DE FOCUS'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.4 }}>
          <strong>Cycle Astre (Jour {destinyDayIndex}) :</strong> {destinyDayInfo.texte}
        </div>
        {userSettings?.morningBriefing && (
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
            Briefing matinal calé à {userSettings.morningBriefing} • Bilan du soir à {userSettings.eveningBriefing || '18:00'}
          </div>
        )}
      </div>

      {/* 2. Priorité Unique Absolue (Règle du 1er Domino) */}
      <div className="neuro-card" style={{
        borderColor: dailyEntry.priorityDone ? 'var(--neon-green)' : 'var(--border-cyan)',
        background: dailyEntry.priorityDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className="kpi-label" style={{ color: 'var(--border-cyan)' }}>LE PREMIER DOMINO (FOCUS DU JOUR)</span>
          <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>+15 XP DSC</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            onClick={handlePriorityToggle}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {dailyEntry.priorityDone ? (
              <CheckCircle2 size={24} color="var(--neon-green)" />
            ) : (
              <Circle size={24} color="var(--text-dim)" />
            )}
          </button>
          <input 
            type="text" 
            placeholder="Quelle est l'action qui rend tout le reste plus facile ?"
            value={dailyEntry.priority || ''}
            onChange={(e) => onUpdateDailyEntry({ ...dailyEntry, priority: e.target.value })}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border-subtle)',
              borderRadius: 0,
              padding: '6px 0',
              fontSize: 13,
              fontWeight: 700,
              color: dailyEntry.priorityDone ? 'var(--text-muted)' : 'var(--text-white)',
              textDecoration: dailyEntry.priorityDone ? 'line-through' : 'none'
            }}
          />
        </div>
      </div>

      {/* 3. Les 4 Blocs de Deep Work (Système MK) */}
      <div className="neuro-card">
        <div 
          onClick={() => setShowBlocks(!showBlocks)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Brain size={15} color="var(--monarch-purple)" />
            <span className="system-window-title" style={{ color: 'var(--monarch-purple)' }}>LES 4 BLOCS DE DEEP WORK (MK)</span>
          </div>
          {showBlocks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {showBlocks && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {['block1', 'block2', 'block3', 'block4'].map((blkKey, idx) => {
              const blk = dailyEntry[blkKey] || { task: '', done: false };
              return (
                <div key={blkKey} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-inset)', padding: '6px 10px', borderRadius: 8 }}>
                  <button 
                    onClick={() => handleBlockToggle(blkKey)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {blk.done ? <CheckCircle2 size={18} color="var(--neon-green)" /> : <Circle size={18} color="var(--text-dim)" />}
                  </button>
                  <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-hud)', color: 'var(--text-dim)', width: 44 }}>
                    BLOC {idx + 1}
                  </span>
                  <input 
                    type="text" 
                    placeholder={`Tâche clé du bloc ${idx + 1}`}
                    value={blk.task || ''}
                    onChange={(e) => handleBlockChange(blkKey, 'task', e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      fontSize: 12,
                      padding: '2px 0',
                      color: blk.done ? 'var(--text-dim)' : 'var(--text-main)',
                      textDecoration: blk.done ? 'line-through' : 'none'
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Quêtes Quotidiennes (Solo Leveling) */}
      <div className="neuro-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="system-window-title">QUÊTES DU JOUR</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-hud)', color: 'var(--border-cyan)', fontWeight: 700 }}>
            {(dailyQuests || []).filter(q => q.completed).length} / {(dailyQuests || []).length} COMPLÉTÉES
          </span>
        </div>

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
                borderRadius: 8,
                background: q.completed ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-inset)',
                border: `1px solid ${q.completed ? 'var(--neon-green-dim)' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                {q.completed ? <CheckCircle2 size={16} color="var(--neon-green)" /> : <Circle size={16} color="var(--text-dim)" />}
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: q.completed ? 'var(--text-dim)' : 'var(--text-main)',
                  textDecoration: q.completed ? 'line-through' : 'none',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {q.title}
                </span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-hud)', color: 'var(--border-cyan)', flexShrink: 0 }}>
                +{q.xp} XP
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Chrono 2 Minutes Anti-Procrastination & Capture Rapide */}
      <div className="neuro-card" style={{ borderColor: 'var(--monarch-purple-dim)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={15} color="var(--monarch-purple)" />
            <span className="system-window-title" style={{ color: 'var(--monarch-purple)' }}>CHRONO 2 MINUTES (DÉMARRAGE ÉCLAIR)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 900, fontFamily: 'var(--font-hud)', color: 'var(--monarch-purple)' }}>
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </span>
            <button 
              onClick={() => { sound.playClick(); setTimerRunning(!timerRunning); }}
              className="btn-neuro" 
              style={{ padding: '4px 8px', minHeight: 28, fontSize: 10 }}
            >
              {timerRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button 
              onClick={() => { sound.playClick(); setTimerRunning(false); setTimerSeconds(120); }}
              className="btn-neuro" 
              style={{ padding: '4px 6px', minHeight: 28, fontSize: 10 }}
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* Boîte de capture rapide universelle */}
        <form onSubmit={handleQuickCapture} style={{ display: 'flex', gap: 6 }}>
          <input 
            type="text" 
            placeholder="Idée ou tâche parasite à capturer immédiatement..."
            value={quickCaptureText}
            onChange={(e) => setQuickCaptureText(e.target.value)}
            style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
          />
          <button type="submit" className="btn-neuro btn-neuro-primary" style={{ padding: '6px 12px', minHeight: 32 }}>
            <Plus size={14} /> Capturer
          </button>
        </form>
      </div>

      {/* 6. Rituels Matin & Soir (Section dépliable) */}
      <div className="neuro-card">
        <div 
          onClick={() => setShowRituels(!showRituels)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <span className="system-window-title">RITUELS QUOTIDIENS (MATIN & SOIR)</span>
          {showRituels ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {showRituels && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sun size={12} /> MATIN (MK {userSettings?.morningMk || '05:45'})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(dailyEntry.morningRitual || []).map(r => (
                  <div key={r.id} onClick={() => handleRitualCheck('morning', r.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', padding: '4px 0' }}>
                    {r.done ? <CheckCircle2 size={14} color="var(--neon-green)" /> : <Circle size={14} color="var(--text-dim)" />}
                    <span style={{ textDecoration: r.done ? 'line-through' : 'none', color: r.done ? 'var(--text-dim)' : 'var(--text-main)' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--monarch-purple)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Moon size={12} /> SOIR (MK {userSettings?.eveningMk || '21:15'})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(dailyEntry.eveningRitual || []).map(r => (
                  <div key={r.id} onClick={() => handleRitualCheck('evening', r.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', padding: '4px 0' }}>
                    {r.done ? <CheckCircle2 size={14} color="var(--neon-green)" /> : <Circle size={14} color="var(--text-dim)" />}
                    <span style={{ textDecoration: r.done ? 'line-through' : 'none', color: r.done ? 'var(--text-dim)' : 'var(--text-main)' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
