import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Gift, Book, Dumbbell, Shield, Download, Upload, 
  RotateCcw, Check, Sparkles, Clock, Play, Pause, AlertTriangle,
  User, Flame, Heart, Bell, Calendar as CalendarIcon, Edit2, Plus, 
  Trash2, CheckCircle2, HeartPulse, Scale as ScaleIcon, Moon, Footprints,
  GraduationCap, Award, BookOpen, Languages, Wrench, ChevronLeft, ChevronRight,
  AlertOctagon, CheckSquare, Square, DollarSign, ArrowRight
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { formatFCFA } from '../core/financeEngine.js';

const SKILL_CATEGORIES = [
  { id: 'FORMATION', label: 'Formations', icon: BookOpen },
  { id: 'CERTIFICATION', label: 'Certifications', icon: Award },
  { id: 'LANGUE', label: 'Langues', icon: Languages },
  { id: 'TECHNIQUE', label: 'Compétences Techniques', icon: Wrench },
];

export default function SystemView({
  player,
  setPlayer,
  userSettings,
  onUpdateUserSettings,
  healthMetrics = [],
  onAddHealthMetric,
  onDeleteHealthMetric,
  skills = [],
  onAddSkill,
  onUpdateSkill,
  onDeleteSkill,
  calendarEvents = [],
  onAddCalendarEvent,
  onToggleCalendarEvent,
  onDeleteCalendarEvent,
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
  finances = {},
  onUpdateFinances,
  onImportBackup,
  onAddXp,
  theme,
  onToggleTheme
}) {
  const [subTab, setSubTab] = useState('health'); // 'health', 'thor', 'skills', 'calendar', 'saturn', 'bilans', 'shop', 'books', 'settings'
  const [selectedDay, setSelectedDay] = useState('lundi');

  // HEALTH FORM STATE (Point du jour)
  const [healthWeight, setHealthWeight] = useState('');
  const [healthSportMin, setHealthSportMin] = useState('30');
  const [healthSleepH, setHealthSleepH] = useState('7.5');
  const [healthNotes, setHealthNotes] = useState('');

  // SKILL FORM MODAL STATE
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editSkillId, setEditSkillId] = useState(null);
  const [skillName, setSkillName] = useState('');
  const [skillCategory, setSkillCategory] = useState('FORMATION');
  const [skillLevel, setSkillLevel] = useState(0);
  const [skillTargetLevel, setSkillTargetLevel] = useState(100);
  const [skillTargetDate, setSkillTargetDate] = useState('');
  const [skillNotes, setSkillNotes] = useState('');

  // CALENDAR STATE
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  const [showCalendarTaskModal, setShowCalendarTaskModal] = useState(false);
  const [calendarTaskTitle, setCalendarTaskTitle] = useState('');
  const [calendarTaskDate, setCalendarTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarTaskPriority, setCalendarTaskPriority] = useState('HAUTE');

  // WORKOUT REST TIMER
  const [restTime, setRestTime] = useState(60);
  const [restRunning, setRestRunning] = useState(false);

  // HANDSTAND STOPWATCH
  const [hsTimer, setHsTimer] = useState(0);
  const [hsRunning, setHsRunning] = useState(false);

  // SETTINGS FORM STATE
  const [codenameInput, setCodenameInput] = useState(player.codename || player.name || 'Hunter');
  const [birthDate, setBirthDate] = useState(userSettings?.birthDate || '1995-01-01');
  const [mondayPrayerTime, setMondayPrayerTime] = useState(userSettings?.mondayPrayerTime || '14:00');
  const [briefingMorning, setBriefingMorning] = useState(userSettings?.briefingMorningTime || '05:30');
  const [briefingEvening, setBriefingEvening] = useState(userSettings?.briefingEveningTime || '21:00');
  const [ritualMorning, setRitualMorning] = useState(userSettings?.mkRitualMorningTime || '06:00');
  const [ritualEvening, setRitualEvening] = useState(userSettings?.mkRitualEveningTime || '21:30');

  // WEEKLY REVIEW STATE
  const [weeklyPercent, setWeeklyPercent] = useState(80);
  const [weeklyDistractions, setWeeklyDistractions] = useState('');
  const [weeklyAdjustments, setWeeklyAdjustments] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);

  // ADD BOOK MODAL STATE
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookPages, setNewBookPages] = useState(250);

  // Tick Rest Timer
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

  // Tick Handstand Timer
  useEffect(() => {
    let interval = null;
    if (hsRunning) {
      interval = setInterval(() => setHsTimer(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [hsRunning]);

  // Health KPIs calculations (last 30 days)
  const healthStats = useMemo(() => {
    const list = [...(healthMetrics || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const last30 = list.slice(0, 30);
    const sportsCount = last30.filter(m => (m.sportMinutes || 0) > 0 || m.sportDone).length;
    const avgSleep = last30.length > 0 
      ? (last30.reduce((acc, m) => acc + (parseFloat(m.sleepHours) || 0), 0) / last30.length).toFixed(1) 
      : '0.0';
    const latestWeight = list.find(m => m.weight)?.weight || player.weight || 65;
    const healthPoints = last30.filter(m => (m.sportMinutes || 0) > 0 || m.sleepHours || m.weight).length;
    return { sportsCount, avgSleep, latestWeight, healthPoints, last30 };
  }, [healthMetrics, player.weight]);

  // Health Submit Handler
  const handleSaveHealthPoint = () => {
    sound.playQuestComplete();
    const metric = {
      id: 'hm_' + Date.now(),
      date: new Date().toISOString(),
      weight: healthWeight ? parseFloat(healthWeight) : null,
      sportDone: parseInt(healthSportMin, 10) > 0,
      sportMinutes: healthSportMin ? parseInt(healthSportMin, 10) : 0,
      sleepHours: healthSleepH ? parseFloat(healthSleepH) : null,
      notes: healthNotes.trim() || null
    };

    if (onAddHealthMetric) onAddHealthMetric(metric);
    if (healthWeight && setPlayer) {
      setPlayer(prev => ({
        ...prev,
        weight: parseFloat(healthWeight),
        weightHistory: [{ date: new Date().toISOString().split('T')[0], weight: parseFloat(healthWeight) }, ...(prev.weightHistory || [])]
      }));
    }

    onAddXp(15, 'STR');
    setHealthWeight('');
    setHealthNotes('');
    alert('Point santé du jour enregistré !');
  };

  // Skill Modal Open Handler
  const handleOpenSkillModal = (skill = null) => {
    sound.playClick();
    if (skill) {
      setEditSkillId(skill.id);
      setSkillName(skill.name || '');
      setSkillCategory(skill.category || 'FORMATION');
      setSkillLevel(skill.level || 0);
      setSkillTargetLevel(skill.targetLevel || 100);
      setSkillTargetDate(skill.targetDate || '');
      setSkillNotes(skill.notes || '');
    } else {
      setEditSkillId(null);
      setSkillName('');
      setSkillCategory('FORMATION');
      setSkillLevel(0);
      setSkillTargetLevel(100);
      setSkillTargetDate('');
      setSkillNotes('');
    }
    setShowSkillModal(true);
  };

  // Skill Save Handler
  const handleSaveSkill = () => {
    if (!skillName.trim()) return;
    sound.playQuestComplete();
    const payload = {
      id: editSkillId || 'skill_' + Date.now(),
      name: skillName.trim(),
      category: skillCategory,
      level: parseInt(skillLevel, 10) || 0,
      targetLevel: parseInt(skillTargetLevel, 10) || 100,
      targetDate: skillTargetDate,
      notes: skillNotes.trim()
    };

    if (editSkillId && onUpdateSkill) {
      onUpdateSkill(payload);
    } else if (onAddSkill) {
      onAddSkill(payload);
      onAddXp(20, 'INT');
    }
    setShowSkillModal(false);
  };

  // Calendar pressure & events computation
  const calendarData = useMemo(() => {
    const today = new Date();
    const targetMonth = new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1);
    const y = targetMonth.getFullYear();
    const m = targetMonth.getMonth();
    const inMonth = (dStr) => {
      if (!dStr) return false;
      const d = new Date(dStr);
      return d.getFullYear() === y && d.getMonth() === m;
    };

    let monthlyChargesTotal = 0;
    const events = [];

    // Recurring charges
    (finances.charges || []).forEach(c => {
      if (c.active !== false && inMonth(c.nextDueDate || c.dueDate)) {
        monthlyChargesTotal += (c.amount || 0);
        events.push({
          id: 'c_' + c.id,
          title: c.label || c.name,
          date: c.nextDueDate || c.dueDate,
          amount: c.amount,
          type: 'CHARGE'
        });
      }
    });

    // Calendar user tasks
    (calendarEvents || []).forEach(ev => {
      if (inMonth(ev.date || ev.dueDate)) {
        events.push({
          id: ev.id,
          title: ev.title,
          date: ev.date || ev.dueDate,
          priority: ev.priority || 'MOYENNE',
          completed: ev.completed,
          type: 'TASK'
        });
      }
    });

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { targetMonth, monthlyChargesTotal, events };
  }, [calendarMonthOffset, finances.charges, calendarEvents]);

  // Calendar task add handler
  const handleAddCalendarTask = () => {
    if (!calendarTaskTitle.trim()) return;
    sound.playClick();
    if (onAddCalendarEvent) {
      onAddCalendarEvent({
        id: 'calev_' + Date.now(),
        title: calendarTaskTitle.trim(),
        date: calendarTaskDate,
        priority: calendarTaskPriority,
        completed: false
      });
      onAddXp(10, 'DSC');
    }
    setCalendarTaskTitle('');
    setShowCalendarTaskModal(false);
  };

  // Settings Save Handler
  const handleSaveSettings = () => {
    sound.playLevelUp();
    if (codenameInput.trim() && setPlayer) {
      setPlayer(prev => ({ ...prev, codename: codenameInput.trim(), name: codenameInput.trim() }));
    }
    if (onUpdateUserSettings) {
      onUpdateUserSettings({
        birthDate,
        mondayPrayerTime,
        briefingMorningTime: briefingMorning,
        briefingEveningTime: briefingEvening,
        mkRitualMorningTime: ritualMorning,
        mkRitualEveningTime: ritualEvening
      });
    }
    alert('Paramètres personnels enregistrés avec succès !');
  };

  // Declare Relapse (Pureté NoFap)
  const handleDeclareRelapse = () => {
    const confirmReset = window.confirm(
      "DÉCLARATION SOLENNELLE DE RECHUTE :\n\n" +
      "Admettre sa chute avec franchise et lucidité est la première étape de la victoire.\n" +
      "Votre streak de pureté sera réinitialisé à zéro, mais vos points d'XP et votre niveau restent intacts.\n\n" +
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

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '100%', boxSizing: 'border-box' }} className="animate-float">
      
      {/* Sub Tabs Navigation Capsules */}
      <div className="pill-tabs-bar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'health', label: '❤️ SANTÉ & FORME' },
          { id: 'thor', label: '🏋️ THOR WORKOUT' },
          { id: 'skills', label: `🎓 COMPÉTENCES (${(skills || []).length})` },
          { id: 'calendar', label: '📅 ÉCHÉANCIER' },
          { id: 'saturn', label: '📜 PACTE SATURNE' },
          { id: 'bilans', label: '📊 BILANS & 30J' },
          { id: 'shop', label: '🏆 TITRES & SHOP' },
          { id: 'books', label: '📚 LIVRES' },
          { id: 'settings', label: '⚙️ PARAMÈTRES' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { sound.playClick(); setSubTab(tab.id); }}
            className={`pill-tab ${subTab === tab.id ? 'active' : ''}`}
            style={{
              padding: '6px 12px',
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              borderRadius: 20,
              border: `1px solid ${subTab === tab.id ? 'var(--border-cyan)' : 'rgba(255,255,255,0.08)'}`,
              background: subTab === tab.id ? 'rgba(0, 217, 255, 0.16)' : 'rgba(255,255,255,0.03)',
              color: subTab === tab.id ? 'var(--border-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================
          1. SANTÉ & FORME (LIFEOS HEALTH)
         ======================================================== */}
      {subTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* KPIs Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <div className="kpi-pod">
              <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Dumbbell size={12} color="var(--neon-green)" /> SÉANCES SPORT (30J)
              </div>
              <div className="kpi-value" style={{ color: healthStats.sportsCount >= 12 ? 'var(--neon-green)' : 'var(--neon-gold)' }}>
                {healthStats.sportsCount} <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>/ 12</span>
              </div>
            </div>

            <div className="kpi-pod">
              <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Moon size={12} color="var(--neon-cyan)" /> SOMMEIL MOYEN
              </div>
              <div className="kpi-value" style={{ color: parseFloat(healthStats.avgSleep) >= 7 ? 'var(--neon-cyan)' : 'var(--accent-red)' }}>
                {healthStats.avgSleep} <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>h</span>
              </div>
            </div>

            <div className="kpi-pod">
              <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ScaleIcon size={12} color="var(--neon-gold)" /> DERNIER POIDS
              </div>
              <div className="kpi-value" style={{ color: 'var(--text-main)' }}>
                {healthStats.latestWeight} <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>kg</span>
              </div>
            </div>

            <div className="kpi-pod">
              <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Footprints size={12} color="var(--electric-blue)" /> POINTS SANTÉ (30J)
              </div>
              <div className="kpi-value" style={{ color: 'var(--electric-blue)' }}>
                {healthStats.healthPoints} <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>jours</span>
              </div>
            </div>
          </div>

          {/* Point Santé du Jour */}
          <div className="omni-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-green)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <HeartPulse size={16} /> POINT SANTÉ DU JOUR (SAISIE INSTANTANÉE)
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>POIDS (KG)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="ex: 65.5"
                  value={healthWeight}
                  onChange={(e) => setHealthWeight(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>SPORT (MIN)</label>
                <input
                  type="number"
                  value={healthSportMin}
                  onChange={(e) => setHealthSportMin(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>SOMMEIL (H)</label>
                <input
                  type="number"
                  step="0.5"
                  value={healthSleepH}
                  onChange={(e) => setHealthSleepH(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Notes de santé, sensations énergétiques..."
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={handleSaveHealthPoint}
              className="haptic-btn"
              style={{
                width: '100%',
                padding: '8px 0',
                background: 'linear-gradient(135deg, var(--neon-green), #10b981)',
                color: '#000',
                fontWeight: 800,
                fontSize: 11,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Enregistrer le Point Santé (+15 XP STR)
            </button>
          </div>

          {/* Recent 30 Days Log */}
          <div className="omni-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>
              Historique des 30 Derniers Jours
            </div>
            {healthStats.last30.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 11, color: 'var(--text-muted)' }}>
                Aucune donnée enregistrée récemment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                {healthStats.last30.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.05)',
                      fontSize: 11
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {entry.date ? entry.date.split('T')[0] : 'Aujourd’hui'}
                      </span>
                      {entry.notes && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{entry.notes}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {entry.weight && <span style={{ color: 'var(--neon-gold)' }}>{entry.weight} kg</span>}
                      {entry.sportMinutes > 0 && <span style={{ color: 'var(--neon-green)' }}>{entry.sportMinutes} min</span>}
                      {entry.sleepHours && <span style={{ color: 'var(--neon-cyan)' }}>{entry.sleepHours} h</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          2. THOR WORKOUT (CORPS DE THOR CALISTHENICS)
         ======================================================== */}
      {subTab === 'thor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Rest Timer Widget */}
          <div className="omni-card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Minuteur de Repos Haptique</div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-hud)', color: 'var(--neon-cyan)' }}>
                {restTime}s
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[60, 90, 120].map(sec => (
                <button
                  key={sec}
                  onClick={() => { sound.playClick(); setRestTime(sec); setRestRunning(true); }}
                  className="haptic-btn"
                  style={{
                    padding: '6px 10px',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 6,
                    background: 'rgba(0, 217, 255, 0.1)',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    color: 'var(--neon-cyan)',
                    cursor: 'pointer'
                  }}
                >
                  {sec}s
                </button>
              ))}
              <button
                onClick={() => setRestRunning(!restRunning)}
                className="haptic-btn"
                style={{
                  padding: '6px 10px',
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 6,
                  background: restRunning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                  border: `1px solid ${restRunning ? 'var(--accent-red)' : 'var(--neon-green)'}`,
                  color: restRunning ? 'var(--accent-red)' : 'var(--neon-green)',
                  cursor: 'pointer'
                }}
              >
                {restRunning ? <Pause size={12} /> : <Play size={12} />}
              </button>
            </div>
          </div>

          {/* Days Pill Selector */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map(d => (
              <button
                key={d}
                onClick={() => { sound.playClick(); setSelectedDay(d); }}
                style={{
                  padding: '5px 11px',
                  fontSize: 10,
                  fontFamily: 'var(--font-hud)',
                  fontWeight: 700,
                  borderRadius: 14,
                  border: `1px solid ${selectedDay === d ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.06)'}`,
                  background: selectedDay === d ? 'rgba(0,217,255,0.15)' : 'rgba(0,0,0,0.2)',
                  color: selectedDay === d ? 'var(--neon-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Current Day Routine */}
          {workouts[selectedDay] && (
            <div className="omni-card" style={{ padding: '14px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', marginBottom: 2 }}>
                {workouts[selectedDay].focus}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                {workouts[selectedDay].description || 'Régularité et exécution stricte sans tricher.'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(workouts[selectedDay].exercises || []).map((exo, exoIdx) => (
                  <div
                    key={exoIdx}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>{exo.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600 }}>{exo.reps}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {(exo.done || []).map((done, setIdx) => (
                        <button
                          key={setIdx}
                          onClick={() => onToggleWorkoutSet && onToggleWorkoutSet(selectedDay, exoIdx, setIdx)}
                          className="haptic-btn"
                          style={{
                            flex: 1,
                            padding: '6px 0',
                            borderRadius: 6,
                            background: done ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0,0,0,0.3)',
                            border: `1px solid ${done ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)'}`,
                            color: done ? 'var(--neon-green)' : 'var(--text-muted)',
                            fontSize: 10,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Série {setIdx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Handstand Mastery 5 Levels */}
          <div className="omni-card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-purple)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} /> PROGRESSION HANDSTAND (5 NIVEAUX)
              </div>
              <div style={{ fontSize: 11, fontFamily: 'var(--font-hud)', color: 'var(--neon-purple)', fontWeight: 800 }}>
                Chrono : {hsTimer}s
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <button
                onClick={() => setHsRunning(!hsRunning)}
                className="haptic-btn"
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  background: hsRunning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                  border: `1px solid ${hsRunning ? 'var(--accent-red)' : 'var(--neon-purple)'}`,
                  color: hsRunning ? 'var(--accent-red)' : 'var(--neon-purple)',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {hsRunning ? 'Stop Chrono' : 'Lancer Chrono Équilibre'}
              </button>
              <button
                onClick={() => { setHsRunning(false); setHsTimer(0); }}
                style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(handstandLevels || []).map(lvl => (
                <div
                  key={lvl.level}
                  onClick={() => onToggleHandstandLevel && onToggleHandstandLevel(lvl.level)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: lvl.completed ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${lvl.completed ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.04)'}`,
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={15} color={lvl.completed ? 'var(--neon-purple)' : 'var(--text-dim)'} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)' }}>
                      Niv {lvl.level} — {lvl.title}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{lvl.req}</div>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--neon-purple)', fontWeight: 800 }}>+25 XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          3. COMPÉTENCES (LIFEOS SKILLS)
         ======================================================== */}
      {subTab === 'skills' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="omni-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>ARBRE DE COMPÉTENCES</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Formations, Certifications, Langues & Techniques</div>
            </div>
            <button
              onClick={() => handleOpenSkillModal()}
              className="haptic-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'linear-gradient(135deg, var(--neon-cyan), var(--electric-blue))',
                color: '#000',
                fontWeight: 800,
                fontSize: 11,
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Compétence
            </button>
          </div>

          {(skills || []).length === 0 ? (
            <div className="omni-card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <GraduationCap size={36} style={{ margin: '0 auto 10px auto', opacity: 0.3 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Aucune compétence suivie</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Ajoutez des formations, certifications ou langues pour mesurer votre montée en puissance.</div>
            </div>
          ) : (
            SKILL_CATEGORIES.map(cat => {
              const list = (skills || []).filter(s => s.category === cat.id);
              if (list.length === 0) return null;
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="omni-card" style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--neon-cyan)', marginBottom: 10 }}>
                    <Icon size={15} /> {cat.label.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {list.map(s => (
                      <div key={s.id} style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)' }}>{s.name}</span>
                            {s.notes && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.notes}</div>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--neon-cyan)' }}>
                              {s.level} / {s.targetLevel}
                            </span>
                            <button
                              onClick={() => handleOpenSkillModal(s)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                            >
                              <Edit2 size={13} />
                            </button>
                            {onDeleteSkill && (
                              <button
                                onClick={() => onDeleteSkill(s.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: 2 }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="progress-bar-hud" style={{ height: 5, borderRadius: 2 }}>
                          <div
                            className="progress-fill-hud"
                            style={{
                              width: `${Math.min(100, Math.round(((s.level || 0) / (s.targetLevel || 100)) * 100))}%`,
                              background: 'linear-gradient(90deg, var(--neon-cyan), var(--electric-blue))'
                            }}
                          />
                        </div>

                        {s.targetDate && (
                          <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>
                            Objectif cible : {s.targetDate}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================
          4. ÉCHÉANCIER & CALENDRIER (LIFEOS CALENDAR)
         ======================================================== */}
      {subTab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Calendar Month Navigation Header */}
          <div className="omni-card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setCalendarMonthOffset(prev => prev - 1)}
                className="haptic-btn"
                style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer' }}
              >
                <ChevronLeft size={20} />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-main)' }}>
                  {calendarData.targetMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                  Pression Financière : <span style={{ color: 'var(--neon-gold)', fontWeight: 800 }}>{formatFCFA(calendarData.monthlyChargesTotal)}</span>
                </div>
              </div>
              <button
                onClick={() => setCalendarMonthOffset(prev => prev + 1)}
                className="haptic-btn"
                style={{ background: 'none', border: 'none', color: 'var(--neon-cyan)', cursor: 'pointer' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Quick Task Add Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowCalendarTaskModal(true)}
              className="haptic-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 8,
                background: 'rgba(0, 217, 255, 0.12)',
                border: '1px solid rgba(0, 217, 255, 0.3)',
                color: 'var(--neon-cyan)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Ajouter une Échéance / Tâche
            </button>
          </div>

          {/* Events List */}
          {calendarData.events.length === 0 ? (
            <div className="omni-card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <CalendarIcon size={36} style={{ margin: '0 auto 10px auto', opacity: 0.3 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Aucune charge ni échéance ce mois-ci</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Toutes vos obligations sont sous contrôle.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {calendarData.events.map(ev => {
                const isTask = ev.type === 'TASK';
                return (
                  <div
                    key={ev.id}
                    className="omni-card"
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: `3px solid ${isTask ? 'var(--neon-cyan)' : 'var(--neon-gold)'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isTask ? (
                        <button
                          onClick={() => onToggleCalendarEvent && onToggleCalendarEvent(ev.id)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: ev.completed ? 'var(--neon-green)' : 'var(--text-dim)' }}
                        >
                          {ev.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                      ) : (
                        <DollarSign size={16} color="var(--neon-gold)" />
                      )}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: ev.completed ? 'var(--text-dim)' : 'var(--text-main)', textDecoration: ev.completed ? 'line-through' : 'none' }}>
                          {ev.title}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                          {ev.date} • {isTask ? `Priorité ${ev.priority}` : 'Charge récurrente'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {ev.amount && (
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-gold)' }}>
                          {formatFCFA(ev.amount)}
                        </span>
                      )}
                      {isTask && onDeleteCalendarEvent && (
                        <button
                          onClick={() => onDeleteCalendarEvent(ev.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: 2 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          5. PACTE DE SATURNE (ÉVOLUTION)
         ======================================================== */}
      {subTab === 'saturn' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="omni-card" style={{ padding: '14px', borderLeft: '3px solid var(--neon-gold)' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--neon-gold)', letterSpacing: 0.5, marginBottom: 4 }}>
              LE PACTE SOLENNEL DE SATURNE
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Cinq piliers de discipline irrévocables scellés pour la décennie. L'abandon d'un seul pilier affaiblit l'édifice entier.
            </p>
          </div>

          {[
            { title: 'Pilier I : Pureté Spirituelle & Intégrité', desc: 'Préservation absolue du regard et de l’énergie vitale. Respect scrupuleux des 5 prières quotidiennes.' },
            { title: 'Pilier II : Sanctuaire Familial & Foyer', desc: 'Présence, écoute et protection inconditionnelle de son épouse et des siens. Zéro colère au foyer.' },
            { title: 'Pilier III : Forge Corporelle & Vitalité', desc: 'Entraînement régulier, alimentation saine et respect du repos reconstructeur sans compromis.' },
            { title: 'Pilier IV : Maîtrise Financière & Patrimoine', desc: 'Règle stricte des comptes sans dépense fictive, épargne de sécurité inviolable et investissement avisé.' },
            { title: 'Pilier V : Clarté Mentale & Concentration', desc: '4 Blocs Deep Work par jour, zéro dispersion cognitive, 3 projets actifs maximum.' }
          ].map((pilier, idx) => (
            <div key={idx} className="omni-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-gold)', marginBottom: 2 }}>
                {pilier.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {pilier.desc}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          6. BILANS & DÉFI 30 JOURS (MK & ÉVOLUTION)
         ======================================================== */}
      {subTab === 'bilans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Défi de constance 30j */}
          <div className="omni-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-cyan)', marginBottom: 4 }}>
              DÉFI DE DISCIPLINE DE FER (30 JOURS)
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
              Cochez chaque journée où vous avez exécuté vos quêtes et respecté vos standards.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
              {(thirtyDayChallenge || new Array(30).fill(false)).map((done, idx) => (
                <button
                  key={idx}
                  onClick={() => onToggleThirtyDay && onToggleThirtyDay(idx)}
                  className="haptic-btn"
                  style={{
                    padding: '8px 0',
                    borderRadius: 6,
                    background: done ? 'rgba(0, 217, 255, 0.25)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${done ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.06)'}`,
                    color: done ? 'var(--neon-cyan)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-hud)',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  J{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Bilan hebdomadaire */}
          <div className="omni-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-gold)', marginBottom: 8 }}>
              BILAN HEBDOMADAIRE DU DIMANCHE SOIR
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>
                  SCORE DE DISCIPLINE DE LA SEMAINE : {weeklyPercent}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weeklyPercent}
                  onChange={(e) => setWeeklyPercent(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--neon-gold)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>
                  DISTRACTIONS & FRICTIONS IDENTIFIÉES
                </label>
                <textarea
                  rows={2}
                  placeholder="Qu'est-ce qui a ralenti l'exécution cette semaine ?"
                  value={weeklyDistractions}
                  onChange={(e) => setWeeklyDistractions(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>
                  AJUSTEMENTS CONCRETS POUR LA SEMAINE PROCHAINE
                </label>
                <textarea
                  rows={2}
                  placeholder="Actions correctrices immédiates..."
                  value={weeklyAdjustments}
                  onChange={(e) => setWeeklyAdjustments(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              <button
                onClick={() => {
                  sound.playLevelUp();
                  onAddXp(30, 'DSC');
                  setReviewSaved(true);
                  setTimeout(() => setReviewSaved(false), 3000);
                }}
                className="haptic-btn"
                style={{
                  padding: '8px 0',
                  background: 'linear-gradient(135deg, var(--neon-gold), #f59e0b)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: 11,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: 4
                }}
              >
                {reviewSaved ? '✓ Bilan Clôturé (+30 XP DSC)' : 'Valider le Bilan Hebdomadaire'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. TITRES DE CHASSEUR & BOUTIQUE XP (SOLO LEVELING)
         ======================================================== */}
      {subTab === 'shop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Solde XP actuel */}
          <div className="omni-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>XP Disponible pour la Boutique</div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-hud)', color: 'var(--neon-gold)' }}>
                {player.xpTotal} XP
              </div>
            </div>
            <Trophy size={28} color="var(--neon-gold)" />
          </div>

          {/* Titres de Chasseur */}
          <div className="omni-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-purple)', marginBottom: 8 }}>
              TITRES DE CHASSEUR DÉBLOQUÉS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(titles || []).map(t => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: t.unlocked ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${t.unlocked ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255,255,255,0.05)'}`
                  }}
                >
                  <Award size={16} color={t.unlocked ? 'var(--neon-purple)' : 'var(--text-dim)'} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: t.unlocked ? 'var(--text-main)' : 'var(--text-dim)' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Boutique Récompenses Méritées */}
          <div className="omni-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-green)', marginBottom: 8 }}>
              RÉCOMPENSES MÉRITÉES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(rewards || []).map(rew => (
                <div
                  key={rew.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)' }}>{rew.name || rew.title}</div>
                    <div style={{ fontSize: 9, color: 'var(--neon-gold)', fontWeight: 800 }}>Coût : {rew.costXp || rew.cost} XP</div>
                  </div>
                  <button
                    onClick={() => onClaimReward && onClaimReward(rew.id)}
                    className="haptic-btn"
                    style={{
                      padding: '5px 10px',
                      borderRadius: 6,
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      color: 'var(--neon-green)',
                      fontSize: 10,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Réclamer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          8. LIVRES (BIBLIOTHÈQUE STRATÉGIQUE)
         ======================================================== */}
      {subTab === 'books' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="omni-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>BIBLIOTHÈQUE STRATÉGIQUE</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Livres de transformation, lectures actives</div>
            </div>
            <button
              onClick={() => setShowAddBook(true)}
              className="haptic-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'linear-gradient(135deg, var(--neon-cyan), var(--electric-blue))',
                color: '#000',
                fontWeight: 800,
                fontSize: 11,
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Nouveau Livre
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(books || []).map(b => (
              <div key={b.id} className="omni-card" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>{b.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.author}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: b.status === 'TERMINE' ? 'var(--neon-green)' : 'var(--neon-cyan)' }}>
                    {b.currentPage || 0} / {b.totalPages} p.
                  </span>
                </div>

                <div className="progress-bar-hud" style={{ height: 4, borderRadius: 2, margin: '8px 0' }}>
                  <div
                    className="progress-fill-hud"
                    style={{
                      width: `${Math.min(100, Math.round(((b.currentPage || 0) / (b.totalPages || 1)) * 100))}%`,
                      background: 'linear-gradient(90deg, var(--neon-cyan), var(--electric-blue))'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          9. PARAMÈTRES & IDENTITÉ (100% HORS-LIGNE)
         ======================================================== */}
      {subTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Nom de code & profil */}
          <div className="omni-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-cyan)', marginBottom: 8 }}>
              IDENTITÉ DU CHASSEUR
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Nom de code (ex: Sung Jin-woo, Hunter, etc.)"
                value={codenameInput}
                onChange={(e) => setCodenameInput(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>DATE DE NAISSANCE (ASTRE)</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>PRIÈRE DU LUNDI</label>
                <input
                  type="time"
                  value={mondayPrayerTime}
                  onChange={(e) => setMondayPrayerTime(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="haptic-btn"
              style={{
                width: '100%',
                padding: '8px 0',
                background: 'linear-gradient(135deg, var(--neon-cyan), var(--electric-blue))',
                color: '#000',
                fontWeight: 800,
                fontSize: 11,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Enregistrer les Paramètres
            </button>
          </div>

          {/* Déclaration de rechute NoFap */}
          <div className="omni-card" style={{ padding: '14px', borderLeft: '3px solid var(--accent-red)' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-red)', marginBottom: 4 }}>
              DÉCLARATION SOLENNELLE DE RECHUTE (NOFAP)
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>
              Streak actuel : <strong style={{ color: 'var(--text-main)' }}>{player.streakNoFap} jours</strong> (Record : {player.recordNoFap} j). Si vous avez trébuché, réinitialisez solennellement votre compteur.
            </p>
            <button
              onClick={handleDeclareRelapse}
              className="haptic-btn"
              style={{
                padding: '6px 12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                fontWeight: 700,
                fontSize: 10,
                borderRadius: 6,
                cursor: 'pointer'
              }}
            >
              Déclarer une Rechute
            </button>
          </div>

          {/* Sauvegarde & Restauration Locale */}
          <div className="omni-card" style={{ padding: '14px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>
              SAUVEGARDE & RESTAURATION (100% HORS-LIGNE)
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
              Vos données restent 100% privées sur votre appareil. Exportez régulièrement un fichier JSON pour sécuriser votre progression.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleExport}
                className="haptic-btn"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '8px 0',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--neon-cyan)',
                  border: '1px solid rgba(0,217,255,0.3)',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                <Download size={14} /> Exporter JSON
              </button>

              <label
                className="haptic-btn"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  padding: '8px 0',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--neon-green)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                <Upload size={14} /> Importer JSON
                <input type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL CRÉATION / MODIFICATION DE COMPÉTENCE
         ======================================================== */}
      {showSkillModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 9999
        }}>
          <div className="omni-card" style={{ width: '100%', maxWidth: 400, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--neon-cyan)', marginBottom: 12 }}>
              {editSkillId ? 'Modifier la Compétence' : 'Nouvelle Compétence'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Nom (ex: Anglais des affaires, React Native, BRVM...)"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
              />

              <select
                value={skillCategory}
                onChange={(e) => setSkillCategory(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11 }}
              >
                {SKILL_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>NIVEAU ACTUEL (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>CIBLE (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={skillTargetLevel}
                    onChange={(e) => setSkillTargetLevel(e.target.value)}
                    style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>ÉCHÉANCE CIBLE</label>
                <input
                  type="date"
                  value={skillTargetDate}
                  onChange={(e) => setSkillTargetDate(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => setShowSkillModal(false)}
                  style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveSkill}
                  style={{ flex: 1, padding: '8px 0', background: 'linear-gradient(135deg, var(--neon-cyan), var(--electric-blue))', color: '#000', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL AJOUT TÂCHE CALENDRIER
         ======================================================== */}
      {showCalendarTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 9999
        }}>
          <div className="omni-card" style={{ width: '100%', maxWidth: 380, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--neon-cyan)', marginBottom: 12 }}>
              Nouvelle Échéance / Tâche Calendrier
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Libellé de la tâche ou de l'échéance..."
                value={calendarTaskTitle}
                onChange={(e) => setCalendarTaskTitle(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>DATE</label>
                  <input
                    type="date"
                    value={calendarTaskDate}
                    onChange={(e) => setCalendarTaskDate(e.target.value)}
                    style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>PRIORITÉ</label>
                  <select
                    value={calendarTaskPriority}
                    onChange={(e) => setCalendarTaskPriority(e.target.value)}
                    style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11 }}
                  >
                    <option value="CRITIQUE">CRITIQUE</option>
                    <option value="HAUTE">HAUTE</option>
                    <option value="MOYENNE">MOYENNE</option>
                    <option value="FAIBLE">FAIBLE</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => setShowCalendarTaskModal(false)}
                  style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddCalendarTask}
                  style={{ flex: 1, padding: '8px 0', background: 'linear-gradient(135deg, var(--neon-cyan), var(--electric-blue))', color: '#000', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL AJOUT LIVRE
         ======================================================== */}
      {showAddBook && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 9999
        }}>
          <div className="omni-card" style={{ width: '100%', maxWidth: 360, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--neon-cyan)', marginBottom: 12 }}>
              Ajouter un Nouveau Livre
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="text"
                placeholder="Titre du livre..."
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
              />

              <input
                type="text"
                placeholder="Auteur..."
                value={newBookAuthor}
                onChange={(e) => setNewBookAuthor(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
              />

              <div>
                <label style={{ fontSize: 9, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>TOTAL DE PAGES</label>
                <input
                  type="number"
                  value={newBookPages}
                  onChange={(e) => setNewBookPages(e.target.value)}
                  style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => setShowAddBook(false)}
                  style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
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
                      onAddXp(10, 'INT');
                    }
                    setNewBookTitle('');
                    setNewBookAuthor('');
                    setShowAddBook(false);
                  }}
                  style={{ flex: 1, padding: '8px 0', background: 'linear-gradient(135deg, var(--neon-cyan), var(--electric-blue))', color: '#000', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
