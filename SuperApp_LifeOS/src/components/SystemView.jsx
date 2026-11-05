import React, { useState, useEffect } from 'react';
import { 
  Trophy, Gift, Book, Dumbbell, Shield, Download, Upload, 
  RotateCcw, Check, Sparkles, Clock, Play, Pause, AlertTriangle 
} from 'lucide-react';
import { sound } from '../core/sound.js';
import confetti from 'canvas-confetti';

export default function SystemView({
  player,
  setPlayer,
  titles,
  rewards,
  books,
  workouts,
  handstandLevels,
  saturnContract,
  onSaveSaturnContract,
  thirtyDayChallenge,
  onToggleThirtyDay,
  onToggleWorkoutSet,
  onToggleHandstandLevel,
  onClaimReward,
  onUpdateBookProgress,
  onUpdateWeight,
  allData,
  finances,
  onUpdateFinances,
  onImportBackup,
  onAddXp
}) {
  const [subTab, setSubTab] = useState('saturn'); // 'saturn', 'workouts', 'bilans', 'titles', 'books', 'backup'
  const [selectedDay, setSelectedDay] = useState('lundi');

  // Rest Timer
  const [restTime, setRestTime] = useState(60);
  const [restRunning, setRestRunning] = useState(false);

  // Handstand Stopwatch
  const [hsTimer, setHsTimer] = useState(0);
  const [hsRunning, setHsRunning] = useState(false);

  // Weekly review form state
  const [weeklyPercent, setWeeklyPercent] = useState(70);
  const [weeklyDistractions, setWeeklyDistractions] = useState('');
  const [weeklyAdjustments, setWeeklyAdjustments] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);

  // Weight
  const [weightInput, setWeightInput] = useState(player.weight || 65);

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

  // Handstand timer tick
  useEffect(() => {
    let interval = null;
    if (hsRunning) {
      interval = setInterval(() => setHsTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [hsRunning]);

  const handleExport = () => {
    sound.playQuestComplete();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `LifeOS_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        onImportBackup(parsed);
        sound.playLevelUp();
        alert('Sauvegarde restaurée avec succès !');
      } catch (err) {
        alert('Erreur lors de la lecture du fichier de sauvegarde JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveWeeklyReview = () => {
    sound.playLevelUp();
    onAddXp(30, 'DSC');
    setReviewSaved(true);
    setTimeout(() => setReviewSaved(false), 4000);
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-float">
      
      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'saturn', label: '📜 PACTE SATURNE' },
          { id: 'foyer', label: '⚙️ PARAMÈTRES FOYER' },
          { id: 'workouts', label: '🏋️ CORPS DE THOR' },
          { id: 'bilans', label: '📊 BILANS & DÉFI 30J' },
          { id: 'titles', label: '🏆 TITRES & SHOP' },
          { id: 'books', label: '📚 LIVRES' },
          { id: 'backup', label: '💾 SAUVEGARDE' },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => {
              sound.playClick();
              setSubTab(st.id);
            }}
            style={{
              padding: '6px 10px',
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              borderRadius: 6,
              border: `1px solid ${subTab === st.id ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`,
              background: subTab === st.id ? 'rgba(0,217,255,0.2)' : 'rgba(0,0,0,0.4)',
              color: subTab === st.id ? 'var(--border-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* --- SUB TAB 1: LE CONTRAT DE SATURNE (Système MK) --- */}
      {subTab === 'saturn' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="system-window corner-cut" style={{ padding: '14px', borderColor: 'var(--monarch-purple)', boxShadow: 'var(--glow-purple)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={16} color="#c77dff" />
                <span style={{ fontFamily: 'var(--font-title)', fontSize: 12, fontWeight: 900, color: '#c77dff' }}>
                  CONTRAT DE SATURNE • LES 5 ENGAGEMENTS DÉCENNAUX
                </span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--neon-green)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                ✓ SIGNÉ ET SCELLÉ
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Cinq promesses inaltérables gravées pour la décennie. À relire le premier de chaque mois.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(saturnContract.engagements || []).map((eng, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(123,47,255,0.3)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#fff', lineHeight: 1.4 }}>
                  {eng}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11, color: 'var(--gold)' }}>
              <strong>Question d'alignement mensuel :</strong> « Mes choix et mes actions ce mois-ci m’en rapprochent-ils ou m’en éloignent-ils ? »
            </div>
          </div>
        </div>
      )}

      {/* --- SUB TAB 2: CORPS DE THOR & CALISTHENICS --- */}
      {subTab === 'workouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Day selection */}
          <div style={{ display: 'flex', gap: 4 }}>
            {['lundi', 'mardi', 'jeudi', 'samedi'].map(day => (
              <button
                key={day}
                onClick={() => { sound.playClick(); setSelectedDay(day); }}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: 4,
                  border: `1px solid ${selectedDay === day ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedDay === day ? 'rgba(0,255,136,0.15)' : 'rgba(0,0,0,0.3)',
                  color: selectedDay === day ? 'var(--neon-green)' : 'var(--text-dim)',
                  fontSize: 10,
                  fontFamily: 'var(--font-hud)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Current Routine */}
          {workouts[selectedDay] && (
            <div className="system-window" style={{ padding: '14px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--neon-green)', marginBottom: 8 }}>
                {workouts[selectedDay].name}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {workouts[selectedDay].exercises.map((exo, exoIdx) => (
                  <div key={exoIdx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{exo.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{exo.sets} séries × {exo.reps}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {exo.done.map((isDone, setIdx) => (
                        <button
                          key={setIdx}
                          onClick={() => onToggleWorkoutSet(selectedDay, exoIdx, setIdx)}
                          style={{
                            flex: 1,
                            padding: '4px',
                            borderRadius: 4,
                            border: `1px solid ${isDone ? 'var(--neon-green)' : 'rgba(255,255,255,0.2)'}`,
                            background: isDone ? 'var(--neon-green)' : 'none',
                            color: isDone ? '#000' : '#fff',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          S{setIdx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Rest Timer */}
          <div className="system-window" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="var(--border-cyan)" />
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>MINUTEUR DE REPOS</div>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-title)', color: '#fff' }}>
                  {restTime} SECONDES
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setRestRunning(!restRunning)}
                className="btn-monarch"
                style={{ padding: '6px 10px', fontSize: 11 }}
              >
                {restRunning ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                onClick={() => { setRestRunning(false); setRestTime(60); }}
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', color: '#fff', borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Handstand Progress & Weight */}
          <div className="system-window" style={{ padding: '12px' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-title)', color: 'var(--gold)', display: 'block', marginBottom: 8 }}>
              PROGRESSION HANDSTAND (ÉQUILIBRE SUR LES MAINS)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(handstandLevels || []).map(hl => (
                <div
                  key={hl.level}
                  onClick={() => onToggleHandstandLevel(hl.level)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: 4,
                    background: hl.completed ? 'rgba(0,255,136,0.1)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${hl.completed ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)'}`,
                    cursor: 'pointer',
                    fontSize: 11
                  }}
                >
                  <span style={{ color: hl.completed ? 'var(--neon-green)' : '#fff' }}>{hl.title}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{hl.target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUB TAB 3: BILANS PÉRIODIQUES & DÉFI 30 JOURS (MK) --- */}
      {subTab === 'bilans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 30 Day Challenge */}
          <div className="system-window" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="system-window-title">DÉFI DE CONSTANCE (OBJECTIF 21/30)</span>
              <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                {(thirtyDayChallenge || []).filter(Boolean).length} / 30 JOURS
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, margin: '10px 0' }}>
              {(thirtyDayChallenge || new Array(30).fill(false)).map((isDone, idx) => (
                <button
                  key={idx}
                  onClick={() => onToggleThirtyDay(idx)}
                  style={{
                    padding: '8px 0',
                    borderRadius: 4,
                    border: `1px solid ${isDone ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)'}`,
                    background: isDone ? 'var(--neon-green)' : 'rgba(0,0,0,0.4)',
                    color: isDone ? '#000' : 'var(--text-dim)',
                    fontFamily: 'var(--font-hud)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  J{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Review Form */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 8 }}>
              BILAN HEBDOMADAIRE DU DIMANCHE (SYSTÈME MK)
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  <span>Priorités accomplies cette semaine :</span>
                  <span>{weeklyPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weeklyPercent}
                  onChange={(e) => setWeeklyPercent(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: 'var(--border-cyan)' }}
                />
              </div>

              <div>
                <span style={{ fontSize: 10, color: 'var(--alert-red)', fontFamily: 'var(--font-hud)' }}>
                  CE QUI M’A DISPERSÉ OU FREINÉ :
                </span>
                <textarea
                  value={weeklyDistractions}
                  onChange={(e) => setWeeklyDistractions(e.target.value)}
                  placeholder="Quels déclencheurs ou distractions ont volé mon temps ?"
                  rows={2}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 11, padding: 6, outline: 'none' }}
                />
              </div>

              <div>
                <span style={{ fontSize: 10, color: 'var(--neon-green)', fontFamily: 'var(--font-hud)' }}>
                  AJUSTEMENT FERME POUR LA SEMAINE PROCHAINE :
                </span>
                <textarea
                  value={weeklyAdjustments}
                  onChange={(e) => setWeeklyAdjustments(e.target.value)}
                  placeholder="La seule règle que j'applique pour corriger le tir..."
                  rows={2}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 11, padding: 6, outline: 'none' }}
                />
              </div>

              <button
                onClick={handleSaveWeeklyReview}
                className="btn-monarch"
                style={{ padding: '8px', fontSize: 11, marginTop: 4 }}
              >
                {reviewSaved ? '✓ BILAN ENREGISTRÉ (+30 XP)' : 'ENREGISTRER LE BILAN HEBDOMADAIRE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB TAB 4: TITRES & BOUTIQUE XP --- */}
      {subTab === 'titles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Shop */}
          <div className="system-window" style={{ padding: '12px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 8 }}>
              BOUTIQUE XP & RÉCOMPENSES RÉELLES
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rewards.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, padding: '8px 10px' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{r.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-hud)' }}>Coût : {r.cost} XP</div>
                  </div>
                  <button
                    onClick={() => onClaimReward(r.id)}
                    className="btn-monarch"
                    style={{ padding: '4px 8px', fontSize: 10 }}
                  >
                    Réclamer
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Titles */}
          <div className="system-window" style={{ padding: '12px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 8 }}>
              GALERIE DES 10 TITRES DÉBLOCABLES
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {titles.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 4, background: t.unlocked ? 'rgba(0,255,136,0.1)' : 'rgba(0,0,0,0.3)', border: `1px solid ${t.unlocked ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)'}` }}>
                  <span style={{ fontSize: 16 }}>{t.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.unlocked ? 'var(--neon-green)' : '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{t.condition}</div>
                  </div>
                  {t.unlocked && <span style={{ fontSize: 9, color: 'var(--neon-green)', fontFamily: 'var(--font-hud)' }}>DÉBLOQUÉ</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUB TAB 5: BIBLIOTHÈQUE DE LIVRES --- */}
      {subTab === 'books' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {books.map(b => (
            <div key={b.id} className="system-window" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{b.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{b.author} • {b.category}</div>
                </div>
                <span style={{ fontSize: 10, color: b.completed ? 'var(--neon-green)' : 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                  {b.completed ? '✓ TERMINÉ' : `${b.pagesRead}/${b.totalPages} p.`}
                </span>
              </div>
              {b.notes && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>
                  « {b.notes} »
                </p>
              )}
              <div className="hud-bar-container" style={{ height: 6 }}>
                <div className="hud-bar-fill" style={{ width: `${(b.pagesRead / b.totalPages) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SUB TAB 6: SAUVEGARDE & CONFIDENTIALITÉ --- */}
      {subTab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 6 }}>
              SOUVERAINETÉ ET CONFIDENTIALITÉ DES DONNÉES
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Toutes vos données (XP, stats, prières, finances, contrats) sont stockées <strong>exclusivement sur cet appareil</strong>. Aucun serveur tiers n'y a accès.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleExport}
                className="btn-monarch"
                style={{ padding: '10px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Download size={16} /> EXPORTER LA SAUVEGARDE (JSON)
              </button>

              <label style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--border-cyan-dim)',
                borderRadius: 8,
                padding: '10px',
                textAlign: 'center',
                color: 'var(--border-cyan)',
                fontFamily: 'var(--font-hud)',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}>
                <Upload size={16} /> RESTAURER DEPUIS UN FICHIER JSON
                <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB TAB 7: PARAMÈTRES FOYER & FINANCEOS --- */}
      {subTab === 'foyer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Notre foyer */}
          <div className="system-window" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="system-window-title">NOTRE FOYER • FINANCEOS</span>
              <span className="rank-badge rank-B" style={{ fontSize: 9 }}>ADMINISTRATEUR</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              Espace transparent du foyer. Rôles et membres avec accès ou visibilité.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {((finances?.couple?.members) || [{ name: 'Administrateur du foyer', email: 'admin@foyer.local', role: 'ADMIN' }]).map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{m.name}</span>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{m.email} • {m.role}</div>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--neon-green)', fontWeight: 700 }}>ACTIF</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenus déclarés */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 6 }}>REVENUS MENSUELS DU FOYER</span>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              Sources attendues, distinctes des encaissements réels (salaire, business, etc.).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(finances?.incomeSources || []).map(inc => (
                <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{inc.label}</span>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Type : {inc.kind} • {inc.active ? 'Actif' : 'Inactif'}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-green)', fontFamily: 'var(--font-hud)' }}>
                    {inc.monthlyAmount?.toLocaleString()} FCFA
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Personnes à charge */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 6 }}>PERSONNES À CHARGE</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(finances?.dependents || []).map(dep => (
                <div key={dep.id} style={{ background: 'rgba(0,217,255,0.1)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#fff' }}>
                  {dep.name} ({dep.relationship})
                </div>
              ))}
            </div>
          </div>

          {/* Réglages fonds d'urgence & marge */}
          <div className="system-window" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 6 }}>RÉGLAGES DU FONDS D'URGENCE & SÉCURITÉ</span>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>• <strong>Fonds d'urgence :</strong> {finances?.settings?.emergencyFundMonths || 3} mois de dépenses essentielles.</div>
              <div>• <strong>Marge de sécurité :</strong> {finances?.settings?.safetyMargin?.toLocaleString() || '20 000'} FCFA non mobilisables.</div>
              <div>• <strong>Mode système :</strong> {finances?.settings?.mode?.toUpperCase() || 'ANALYSE'}.</div>
            </div>
          </div>

          {/* Point structurant 3.33M */}
          <div className="system-window" style={{ padding: '14px', borderColor: 'var(--monarch-purple)' }}>
            <span className="system-window-title" style={{ color: 'var(--monarch-purple)', display: 'block', marginBottom: 4 }}>
              CLARIFICATION DES 3 330 000 FCFA DE 2028
            </span>
            <div style={{ fontSize: 12, color: '#fff', marginTop: 4 }}>
              Réponse enregistrée : <em>« {finances?.clarification3m?.answer || 'Revenu annuel / Épargne cible'} »</em>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
