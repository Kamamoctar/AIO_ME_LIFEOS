import React, { useState, useEffect } from 'react';
import { 
  Trophy, Gift, Book, Dumbbell, Shield, Download, Upload, 
  RotateCcw, Check, Sparkles, Clock, Play, Pause, AlertTriangle,
  User, Flame, Heart, Bell, Calendar, Edit2, Plus, Trash2, CheckCircle2
} from 'lucide-react';
import { sound } from '../core/sound.js';

export default function SystemView({
  player,
  setPlayer,
  userSettings,
  onUpdateUserSettings,
  titles = [],
  rewards = [],
  books = [],
  workouts = {},
  handstandLevels = [],
  saturnContract = {},
  onSaveSaturnContract,
  thirtyDayChallenge = [],
  onToggleThirtyDay,
  onToggleWorkoutSet,
  onToggleHandstandLevel,
  onClaimReward,
  onUpdateBookProgress,
  onAddBook,
  allData,
  finances,
  onUpdateFinances,
  onImportBackup,
  onAddXp,
  theme,
  onToggleTheme
}) {
  const [subTab, setSubTab] = useState('profile'); // 'profile', 'settings', 'saturn', 'workouts', 'bilans', 'titles', 'books', 'backup'
  const [selectedDay, setSelectedDay] = useState('lundi');

  // Codename edit
  const [isEditingCodename, setIsEditingCodename] = useState(false);
  const [codenameInput, setCodenameInput] = useState(player.codename || player.name || 'Hunter');

  // Weight edit
  const [weightInput, setWeightInput] = useState(player.weight || 65);

  // Settings form states
  const [birthDate, setBirthDate] = useState(userSettings?.birthDate || '1995-01-01');
  const [mondayPrayerTime, setMondayPrayerTime] = useState(userSettings?.mondayPrayerTime || '14:00');
  const [briefingMorning, setBriefingMorning] = useState(userSettings?.briefingMorningTime || '05:30');
  const [briefingEvening, setBriefingEvening] = useState(userSettings?.briefingEveningTime || '21:00');
  const [ritualMorning, setRitualMorning] = useState(userSettings?.mkRitualMorningTime || '06:00');
  const [ritualEvening, setRitualEvening] = useState(userSettings?.mkRitualEveningTime || '21:30');
  const [sacrificeAnchor, setSacrificeAnchor] = useState(userSettings?.sacrificeAnchorDate || '2026-12-31');
  const [notifsEnabled, setNotifsEnabled] = useState(userSettings?.notificationsEnabled ?? true);

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

  // Add Book state
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookPages, setNewBookPages] = useState(250);

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

  // Save Settings
  const handleSaveSettings = () => {
    sound.playLevelUp();
    if (onUpdateUserSettings) {
      onUpdateUserSettings({
        birthDate,
        mondayPrayerTime,
        briefingMorningTime: briefingMorning,
        briefingEveningTime: briefingEvening,
        mkRitualMorningTime: ritualMorning,
        mkRitualEveningTime: ritualEvening,
        sacrificeAnchorDate: sacrificeAnchor,
        notificationsEnabled: notifsEnabled
      });
    }
    alert('Paramètres personnels et spirituels enregistrés avec succès !');
  };

  // Codename Save
  const handleSaveCodename = () => {
    if (!codenameInput.trim()) return;
    sound.playClick();
    setPlayer(prev => ({ ...prev, codename: codenameInput.trim(), name: codenameInput.trim() }));
    setIsEditingCodename(false);
  };

  // Weight Save
  const handleSaveWeight = () => {
    const num = parseFloat(weightInput);
    if (isNaN(num) || num <= 0) return;
    sound.playLevelUp();
    const entry = { date: new Date().toISOString().split('T')[0], weight: num };
    setPlayer(prev => ({
      ...prev,
      weight: num,
      weightHistory: [entry, ...(prev.weightHistory || [])]
    }));
    alert(`Poids de ${num} kg enregistré dans l'historique !`);
  };

  // Declare Relapse (Pureté NoFap)
  const handleDeclareRelapse = () => {
    const confirmReset = window.confirm(
      "DÉCLARATION SOLENNELLE DE RECHUTE :\n\n" +
      "Admettre sa chute avec franchise et lucidité est la première étape de la victoire.\n" +
      "Votre streak actuel sera remis à zéro, mais vos points d'XP et votre niveau restent intacts.\n\n" +
      "Voulez-vous réinitialiser le compteur de pureté dès aujourd'hui ?"
    );
    if (!confirmReset) return;

    sound.playAlarm();
    setPlayer(prev => ({
      ...prev,
      streakNoFap: 0,
      relapseHistory: [
        { date: new Date().toISOString(), previousStreak: prev.streakNoFap },
        ...(prev.relapseHistory || [])
      ]
    }));
    alert("Compteur réinitialisé. Relève-toi, Chasseur. La chute n'est qu'une leçon d'humilité.");
  };

  // Export JSON
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

  // Import JSON
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

  // Save weekly review
  const handleSaveWeeklyReview = () => {
    sound.playLevelUp();
    onAddXp(30, 'DSC');
    setReviewSaved(true);
    setTimeout(() => setReviewSaved(false), 4000);
  };

  // Add Book
  const handleCreateBook = () => {
    if (!newBookTitle.trim()) return;
    sound.playClick();
    if (onAddBook) {
      onAddBook({
        id: 'book_' + Date.now(),
        title: newBookTitle.trim(),
        author: newBookAuthor.trim() || 'Auteur',
        totalPages: parseInt(newBookPages, 10) || 200,
        currentPage: 0,
        status: 'A_LIRE'
      });
    }
    setNewBookTitle('');
    setNewBookAuthor('');
    setShowAddBook(false);
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '100%', boxSizing: 'border-box' }} className="animate-float">
      
      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'profile', label: '👤 PROFIL' },
          { id: 'settings', label: '⚙️ PARAMÈTRES' },
          { id: 'saturn', label: '📜 PACTE SATURNE' },
          { id: 'workouts', label: '🏋️ THOR' },
          { id: 'bilans', label: '📊 BILANS & 30J' },
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
              padding: '6px 11px',
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              borderRadius: 6,
              border: `1px solid ${subTab === st.id ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`,
              background: subTab === st.id ? 'rgba(0,217,255,0.2)' : 'rgba(0,0,0,0.4)',
              color: subTab === st.id ? 'var(--border-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* ================= SUB TAB 0: PROFIL CHASSEUR & PURETÉ ================= */}
      {subTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Identity Card */}
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--monarch-purple)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} color="var(--border-cyan)" />
                {isEditingCodename ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input 
                      type="text" 
                      value={codenameInput}
                      onChange={(e) => setCodenameInput(e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan)', borderRadius: 4, color: '#fff', padding: '3px 6px', fontSize: 13 }}
                    />
                    <button onClick={handleSaveCodename} className="btn-monarch" style={{ fontSize: 9, padding: '3px 8px' }}>OK</button>
                  </div>
                ) : (
                  <span style={{ fontFamily: 'var(--font-title)', fontSize: 16, fontWeight: 900, color: '#fff' }}>
                    {player.codename || player.name || 'Hunter'}
                  </span>
                )}
                {!isEditingCodename && (
                  <button onClick={() => setIsEditingCodename(true)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
              <span className={`rank-badge rank-${player.rank || 'E'}`}>
                RANG {player.rank || 'E'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>NIVEAU</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--font-title)' }}>{player.level || 1}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>XP TOTAL</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--border-cyan)', fontFamily: 'var(--font-title)' }}>{player.xpTotal || 0}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>POIDS ACTUEL</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--neon-green)', fontFamily: 'var(--font-title)' }}>{player.weight || 65} kg</div>
              </div>
            </div>
          </div>

          {/* Pureté NoFap & Bouton Déclaration de Rechute */}
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--alert-red)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={16} color="var(--alert-red)" />
                <span className="system-window-title" style={{ color: 'var(--alert-red)' }}>DISCIPLINE DE PURETÉ (NOFAP)</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--neon-green)', fontFamily: 'var(--font-hud)' }}>
                STREAK : {player.streakNoFap || 0} JOURS
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              Record personnel : <strong>{player.recordNoFap || player.streakNoFap || 0} jours</strong>. La rétention séminale forge l'aura, la testostérone et la lucidité décisionnelle.
            </p>

            <button
              onClick={handleDeclareRelapse}
              style={{
                width: '100%',
                padding: '9px',
                background: 'rgba(255,46,76,0.12)',
                border: '1px solid var(--alert-red)',
                borderRadius: 6,
                color: 'var(--alert-red)',
                fontFamily: 'var(--font-hud)',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <AlertTriangle size={14} /> DÉCLARER UNE RECHUTE (RÉINITIALISER LE STREAK)
            </button>
          </div>

          {/* Enregistrement du poids corporel */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 6 }}>SUIVI DE LA MASSE CORPORELLE</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="number" 
                step="0.1" 
                placeholder="Poids en kg" 
                value={weightInput} 
                onChange={(e) => setWeightInput(e.target.value)} 
                style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 10px', fontSize: 13 }} 
              />
              <button onClick={handleSaveWeight} className="btn-monarch" style={{ fontSize: 11, padding: '6px 14px' }}>
                Enregistrer Poids
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB TAB 1: PARAMÈTRES PERSONNELS & SPIRITUELS ================= */}
      {subTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="neuro-card" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 12 }}>
              PARAMÈTRES DU MONARQUE (VIE, SPIRITUEL & MK)
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                  DATE DE NAISSANCE (CALCUL DE L'ASTRE ET DES 45 JOURS) :
                </label>
                <input 
                  type="date" 
                  value={birthDate} 
                  onChange={(e) => setBirthDate(e.target.value)} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12, boxSizing: 'border-box' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                  HEURE DE LA PRIÈRE SPÉCIALE DU LUNDI :
                </label>
                <input 
                  type="time" 
                  value={mondayPrayerTime} 
                  onChange={(e) => setMondayPrayerTime(e.target.value)} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12, boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 3 }}>
                    BRIEFING DU MATIN :
                  </label>
                  <input 
                    type="time" 
                    value={briefingMorning} 
                    onChange={(e) => setBriefingMorning(e.target.value)} 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11, boxSizing: 'border-box' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 3 }}>
                    BRIEFING DU SOIR :
                  </label>
                  <input 
                    type="time" 
                    value={briefingEvening} 
                    onChange={(e) => setBriefingEvening(e.target.value)} 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11, boxSizing: 'border-box' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 3 }}>
                    RITUEL MK MATIN :
                  </label>
                  <input 
                    type="time" 
                    value={ritualMorning} 
                    onChange={(e) => setRitualMorning(e.target.value)} 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11, boxSizing: 'border-box' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 3 }}>
                    RITUEL MK SOIR :
                  </label>
                  <input 
                    type="time" 
                    value={ritualEvening} 
                    onChange={(e) => setRitualEvening(e.target.value)} 
                    style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 11, boxSizing: 'border-box' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                  DATE D'ANCRAGE DU SACRIFICE ANNUEL :
                </label>
                <input 
                  type="date" 
                  value={sacrificeAnchor} 
                  onChange={(e) => setSacrificeAnchor(e.target.value)} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12, boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border-cyan-dim)' }}>
                <span style={{ fontSize: 11, color: '#fff' }}>Rappels et notifications</span>
                <input 
                  type="checkbox" 
                  checked={notifsEnabled} 
                  onChange={(e) => setNotifsEnabled(e.target.checked)} 
                  style={{ width: 16, height: 16 }} 
                />
              </div>

              <button
                onClick={handleSaveSettings}
                className="btn-monarch"
                style={{ width: '100%', padding: '10px', fontSize: 11, marginTop: 4 }}
              >
                ✓ ENREGISTRER TOUS LES PARAMÈTRES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB TAB 2: PACTE DE SATURNE ================= */}
      {subTab === 'saturn' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--monarch-purple)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={16} color="#c77dff" />
                <span style={{ fontFamily: 'var(--font-title)', fontSize: 12, fontWeight: 900, color: '#c77dff' }}>
                  CONTRAT DE SATURNE • LES 5 ENGAGEMENTS
                </span>
              </div>
              <span style={{ fontSize: 10, color: 'var(--neon-green)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                ✓ SCELLÉ
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Cinq promesses inaltérables gravées pour la décennie. À relire le premier de chaque mois.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                saturnContract.p1 || 'Ne jamais compromettre ma pureté et ma discipline spirituelle pour une gratification immédiate.',
                saturnContract.p2 || 'Travailler chaque jour avec rigueur sur les 3 projets stricts sans dispersion.',
                saturnContract.p3 || 'Protéger la transparence financière et la sérénité du foyer.',
                saturnContract.p4 || 'Conserver la maîtrise de ma parole : ne jamais médire, écouter deux fois plus que parler.',
                saturnContract.p5 || 'Forger sans relâche mon corps et mon esprit pour atteindre le Rang de Monarque.'
              ].map((clause, idx) => (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(123,47,255,0.3)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#fff', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--gold)' }}>Règle {idx + 1} :</strong> {clause}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 11, color: 'var(--gold)' }}>
              <strong>Question d'alignement mensuel :</strong> « Mes choix et mes actions ce mois-ci m’en rapprochent-ils ou m’en éloignent-ils ? »
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB TAB 3: CORPS DE THOR & CALISTHENICS ================= */}
      {subTab === 'workouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Day selection */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
            {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map(day => (
              <button
                key={day}
                onClick={() => { sound.playClick(); setSelectedDay(day); }}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  borderRadius: 4,
                  border: `1px solid ${selectedDay === day ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedDay === day ? 'rgba(0,255,136,0.15)' : 'rgba(0,0,0,0.3)',
                  color: selectedDay === day ? 'var(--neon-green)' : 'var(--text-dim)',
                  fontSize: 10,
                  fontFamily: 'var(--font-hud)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Current Routine */}
          {workouts[selectedDay] && (
            <div className="neuro-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--neon-green)', marginBottom: 8 }}>
                {workouts[selectedDay].focus}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {workouts[selectedDay].exercises.map((exo, exoIdx) => (
                  <div key={exoIdx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{exo.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{exo.reps}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {exo.sets.map((isDone, setIdx) => (
                        <button
                          key={setIdx}
                          onClick={() => onToggleWorkoutSet(selectedDay, exoIdx, setIdx)}
                          style={{
                            flex: 1,
                            padding: '5px',
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
          <div className="neuro-card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              {[30, 60, 90].map(s => (
                <button
                  key={s}
                  onClick={() => { setRestRunning(false); setRestTime(s); }}
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', color: 'var(--border-cyan)', borderRadius: 4, padding: '4px 6px', fontSize: 10, cursor: 'pointer' }}
                >
                  {s}s
                </button>
              ))}
              <button
                onClick={() => setRestRunning(!restRunning)}
                className="btn-monarch"
                style={{ padding: '6px 10px', fontSize: 11 }}
              >
                {restRunning ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>
          </div>

          {/* Handstand Progress */}
          <div className="neuro-card" style={{ padding: '12px' }}>
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
                  <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{hl.req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB TAB 4: BILANS & DÉFI 30 JOURS ================= */}
      {subTab === 'bilans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 30 Day Challenge */}
          <div className="neuro-card" style={{ padding: '14px' }}>
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
          <div className="neuro-card" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 8 }}>
              BILAN HEBDOMADAIRE DU DIMANCHE (MK)
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
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 11, padding: 6, outline: 'none', boxSizing: 'border-box' }}
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
                  style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 11, padding: 6, outline: 'none', boxSizing: 'border-box' }}
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

      {/* ================= SUB TAB 5: TITRES & SHOP ================= */}
      {subTab === 'titles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Shop */}
          <div className="neuro-card" style={{ padding: '12px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 8 }}>
              BOUTIQUE XP & RÉCOMPENSES DU GUERRIER
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(rewards || []).map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, padding: '8px 10px' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{r.name || r.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-hud)' }}>Coût : {r.costXp || r.cost} XP</div>
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
          <div className="neuro-card" style={{ padding: '12px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 8 }}>
              GALERIE DES TITRES DÉBLOCABLES
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(titles || []).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 4, background: t.unlocked ? 'rgba(0,255,136,0.1)' : 'rgba(0,0,0,0.3)', border: `1px solid ${t.unlocked ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)'}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.unlocked ? 'var(--neon-green)' : '#fff' }}>{t.title || t.name}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{t.desc || t.condition}</div>
                  </div>
                  {t.unlocked && <span style={{ fontSize: 9, color: 'var(--neon-green)', fontFamily: 'var(--font-hud)' }}>DÉBLOQUÉ</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB TAB 6: LIVRES & BIBLIOTHÈQUE ================= */}
      {subTab === 'books' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="system-window-title">BIBLIOTHÈQUE STRATÉGIQUE</span>
            <button
              onClick={() => setShowAddBook(!showAddBook)}
              style={{ background: 'none', border: 'none', color: 'var(--border-cyan)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={12} /> Nouveau Livre
            </button>
          </div>

          {showAddBook && (
            <div className="neuro-card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input 
                type="text" 
                placeholder="Titre du livre" 
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 4, color: '#fff', padding: '6px', fontSize: 11 }}
              />
              <input 
                type="text" 
                placeholder="Auteur" 
                value={newBookAuthor}
                onChange={(e) => setNewBookAuthor(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 4, color: '#fff', padding: '6px', fontSize: 11 }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <input 
                  type="number" 
                  placeholder="Pages totales" 
                  value={newBookPages}
                  onChange={(e) => setNewBookPages(e.target.value)}
                  style={{ width: 100, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 4, color: '#fff', padding: '6px', fontSize: 11 }}
                />
                <button onClick={handleCreateBook} className="btn-monarch" style={{ fontSize: 10, padding: '6px 12px' }}>
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {(books || []).map(b => (
            <div key={b.id} className="neuro-card" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{b.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{b.author}</div>
                </div>
                <span style={{ fontSize: 10, color: b.currentPage >= b.totalPages ? 'var(--neon-green)' : 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                  {b.currentPage >= b.totalPages ? '✓ TERMINÉ' : `${b.currentPage || 0}/${b.totalPages} p.`}
                </span>
              </div>
              <div className="hud-bar-container" style={{ height: 6 }}>
                <div className="hud-bar-fill" style={{ width: `${Math.min(100, ((b.currentPage || 0) / (b.totalPages || 1)) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= SUB TAB 7: SAUVEGARDE & RESTAURATION ================= */}
      {subTab === 'backup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="neuro-card" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 6 }}>
              SOUVERAINETÉ ET SAUVEGARDE DES DONNÉES
            </span>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Toutes vos données (XP, finances, projets, prières, contrats) sont stockées <strong>exclusivement en local sur cet appareil</strong>. Aucun serveur tiers n'y a accès.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleExport}
                className="btn-monarch"
                style={{ padding: '10px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Download size={16} /> EXPORTER LA SAUVEGARDE COMPLÈTE (JSON)
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

    </div>
  );
}
