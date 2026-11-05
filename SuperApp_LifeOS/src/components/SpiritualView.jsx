import React, { useState, useEffect } from 'react';
import { 
  Moon, Sun, Clock, CheckCircle2, Circle, Flame, 
  RotateCcw, BookOpen, Sparkles, ChevronRight, Volume2,
  Compass, MapPin, Calendar, Heart, Shield, Award, Plus, Trash2, Edit2
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { calculatePrayerTimes, formatTime, getNextPrayerCountdown } from '../core/prayers.js';
import { ZIKR_DATA } from '../data/zikrData.js';
import { GRILLE_DATA } from '../data/grilleData.js';

const CITY_PRESETS = [
  { name: 'Lomé, Togo', lat: 6.1375, lng: 1.2123 },
  { name: 'Cotonou, Bénin', lat: 6.3654, lng: 2.4183 },
  { name: 'Abidjan, Côte d’Ivoire', lat: 5.3600, lng: -4.0083 },
  { name: 'Ouagadougou, Burkina', lat: 12.3714, lng: -1.5197 },
  { name: 'Dakar, Sénégal', lat: 14.7167, lng: -17.4677 },
  { name: 'Bamako, Mali', lat: 12.6392, lng: -8.0029 },
  { name: 'Niamey, Niger', lat: 13.5116, lng: 2.1254 },
  { name: 'Douala, Cameroun', lat: 4.0511, lng: 9.7679 },
  { name: 'Paris, France', lat: 48.8566, lng: 2.3522 }
];

export default function SpiritualView({
  spiritual,
  onUpdateSpiritual,
  userSettings,
  onUpdateUserSettings,
  onAddXp,
  theme
}) {
  const [activeSubTab, setActiveSubTab] = useState('tasbih'); // 'tasbih', 'prieres', 'cures', 'coran', 'destin'
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [selectedZikrId, setSelectedZikrId] = useState(spiritual.activeZikrId || 'ya_rachid');

  // New Custom Zikr form state
  const [showNewZikr, setShowNewZikr] = useState(false);
  const [customNom, setCustomNom] = useState('');
  const [customFormule, setCustomFormule] = useState('');
  const [customTarget, setCustomTarget] = useState(100);

  // Edit Birthdate state
  const [birthInput, setBirthInput] = useState(userSettings?.birthDate || '1995-01-01');

  // Load and refresh prayer times
  useEffect(() => {
    const lat = spiritual.latitude || 6.1375;
    const lng = spiritual.longitude || 1.2123;
    const method = spiritual.prayerMethod || 'MWL';

    const pt = calculatePrayerTimes(new Date(), lat, lng, method);
    setPrayerTimes(pt);
    if (pt && pt.timeForNext) {
      setCountdown(getNextPrayerCountdown(pt.timeForNext));
    }

    const timer = setInterval(() => {
      const nowPt = calculatePrayerTimes(new Date(), lat, lng, method);
      if (nowPt && nowPt.timeForNext) {
        setCountdown(getNextPrayerCountdown(nowPt.timeForNext));
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [spiritual.latitude, spiritual.longitude, spiritual.prayerMethod]);

  const allZikrs = [...(ZIKR_DATA.zikrs || []), ...(spiritual.customZikrs || [])];
  const activeZikr = allZikrs.find(z => z.id === selectedZikrId) || allZikrs[0] || {
    id: 'default',
    nom: 'Astaghfirullah',
    arabe: 'أَسْتَغْفِرُ اللَّهَ',
    formule: '100 fois',
    sens: 'Je demande pardon à Dieu'
  };

  // Astre calculation based on user birthdate
  const today = new Date();
  const currentDayOfMonth = today.getDate();
  const dayGuide = GRILLE_DATA.guideDuMois?.[String(currentDayOfMonth)] || {
    texte: "Journée de concentration et de constance spirituelle.",
    impacts: {}
  };

  const birthDateObj = new Date(userSettings?.birthDate || '1995-01-01');
  const diffDays = Math.floor((today - birthDateObj) / (1000 * 60 * 60 * 24));
  const cycleDay45 = Math.abs(diffDays % 45) + 1;

  let cycleElement = 'Feu';
  let elementDesc = 'Dynamisme, action, initiatives courageuses et conquête.';
  if (cycleDay45 >= 12 && cycleDay45 <= 22) {
    cycleElement = 'Terre';
    elementDesc = 'Enracinement, stabilité financière, consolidation et patience.';
  } else if (cycleDay45 >= 23 && cycleDay45 <= 33) {
    cycleElement = 'Air';
    elementDesc = 'Communication, clarté d’esprit, étude et conciliation.';
  } else if (cycleDay45 >= 34) {
    cycleElement = 'Eau';
    elementDesc = 'Intuition, réceptivité, aumônes, recueillement profond.';
  }

  // Tasbih actions
  const handleTasbihTap = () => {
    sound.playTasbih();
    const nextCount = (spiritual.tasbihCount || 0) + 1;
    onUpdateSpiritual({ ...spiritual, tasbihCount: nextCount });

    // Milestone bonus every 33 taps
    if (nextCount % 33 === 0) {
      sound.playQuestComplete();
      onAddXp(2, 'SPI');
    }
  };

  const handleResetTasbih = () => {
    sound.playClick();
    onUpdateSpiritual({ ...spiritual, tasbihCount: 0 });
  };

  const handleAddTasbihBulk = (amount) => {
    sound.playClick();
    const nextCount = (spiritual.tasbihCount || 0) + amount;
    onUpdateSpiritual({ ...spiritual, tasbihCount: nextCount });
    onAddXp(Math.max(1, Math.floor(amount / 33)), 'SPI');
  };

  const handleAddCustomZikr = () => {
    if (!customNom.trim()) return;
    sound.playLevelUp();

    const newZ = {
      id: 'cz_' + Date.now(),
      nom: customNom.trim(),
      arabe: 'ذكر مخصص',
      formule: `${customTarget}x`,
      quantite: customTarget,
      sens: customFormule.trim() || 'Protocole spirituel personnalisé'
    };

    const updated = [...(spiritual.customZikrs || []), newZ];
    onUpdateSpiritual({
      ...spiritual,
      customZikrs: updated,
      activeZikrId: newZ.id
    });
    setSelectedZikrId(newZ.id);
    setCustomNom('');
    setCustomFormule('');
    setShowNewZikr(false);
  };

  // Prayer actions
  const handleTogglePrayer = (prayerName) => {
    sound.playClick();
    const current = spiritual.prayersDone || {};
    const nextState = !current[prayerName];
    if (nextState) {
      sound.playQuestComplete();
      onAddXp(5, 'SPI');
    }
    onUpdateSpiritual({
      ...spiritual,
      prayersDone: { ...current, [prayerName]: nextState }
    });
  };

  const handleSelectCity = (preset) => {
    sound.playClick();
    onUpdateSpiritual({
      ...spiritual,
      cityName: preset.name,
      latitude: preset.lat,
      longitude: preset.lng
    });
  };

  // Quran actions
  const handleIncrementQuran = (type, amount) => {
    sound.playClick();
    const curQuran = spiritual.quran || { juz: 1, pages: 12, verses: 75 };
    const updated = { ...curQuran, [type]: Math.max(0, (curQuran[type] || 0) + amount) };
    onUpdateSpiritual({ ...spiritual, quran: updated });
    onAddXp(amount, 'SPI');
  };

  // Cure actions
  const handleAdvanceCure = () => {
    sound.playLevelUp();
    const curCure = spiritual.cureYaAziz || { currentDay: 1, completedDays: [] };
    const nextDay = Math.min(40, (curCure.currentDay || 1) + 1);
    const completed = [...(curCure.completedDays || []), curCure.currentDay];
    onUpdateSpiritual({
      ...spiritual,
      cureYaAziz: {
        ...curCure,
        currentDay: nextDay,
        completedDays: Array.from(new Set(completed))
      }
    });
    onAddXp(15, 'SPI');
  };

  // Save birthdate
  const handleSaveBirthdate = () => {
    sound.playLevelUp();
    if (onUpdateUserSettings) {
      onUpdateUserSettings({ birthDate: birthInput });
    }
    alert('Date de naissance enregistrée pour le calcul de votre Astre !');
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '100%', boxSizing: 'border-box' }} className="animate-float">
      
      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'tasbih', label: '📿 TASBIH' },
          { id: 'prieres', label: '🕌 5 PRIÈRES' },
          { id: 'cures', label: '⏳ CURE 40J' },
          { id: 'coran', label: '📖 CORAN' },
          { id: 'destin', label: '✨ MON ASTRE (45J)' },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => {
              sound.playClick();
              setActiveSubTab(st.id);
            }}
            style={{
              padding: '6px 11px',
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              borderRadius: 6,
              border: `1px solid ${activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`,
              background: activeSubTab === st.id ? 'rgba(0,217,255,0.2)' : 'rgba(0,0,0,0.4)',
              color: activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* ================= SUB TAB 1: LE GRAND TASBIH DIGITAL INTERACTIF ================= */}
      {activeSubTab === 'tasbih' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Active Zikr Banner */}
          <div className="neuro-card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)', letterSpacing: 1 }}>PROTOCOLE SACRÉ ACTIF</div>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, color: 'var(--gold)', margin: '4px 0' }}>
              {activeZikr.arabe}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{activeZikr.nom} ({activeZikr.formule})</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2 }}>« {activeZikr.sens} »</div>
            {activeZikr.instruction && (
              <div style={{ fontSize: 10, color: 'var(--border-cyan)', marginTop: 4 }}>
                {activeZikr.instruction}
              </div>
            )}
          </div>

          {/* Huge Touch Counter Button */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
            <button
              onClick={handleTasbihTap}
              style={{
                width: 210,
                height: 210,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,217,255,0.2) 0%, rgba(7,10,18,0.95) 70%)',
                border: '3px solid var(--border-cyan)',
                boxShadow: '0 0 35px rgba(0,217,255,0.35), inset 0 0 25px rgba(0,217,255,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.08s ease',
                userSelect: 'none'
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
              onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 48, fontWeight: 900, color: '#fff' }}>
                {spiritual.tasbihCount || 0}
              </div>
              <div style={{ fontSize: 10, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)', letterSpacing: 2, marginTop: 4 }}>
                TOUCHER • TAP
              </div>
              {activeZikr.quantite && (
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                  Objectif: {activeZikr.quantite}
                </div>
              )}
            </button>
          </div>

          {/* Controls: Reset and Bulk + */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button
              onClick={() => handleAddTasbihBulk(10)}
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', color: '#fff', borderRadius: 6, padding: '7px 14px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
            >
              +10
            </button>
            <button
              onClick={() => handleAddTasbihBulk(33)}
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 6, padding: '7px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              +33
            </button>
            <button
              onClick={() => handleAddTasbihBulk(100)}
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan)', color: 'var(--border-cyan)', borderRadius: 6, padding: '7px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              +100
            </button>
            <button
              onClick={handleResetTasbih}
              style={{ background: 'rgba(255,46,76,0.1)', border: '1px solid var(--alert-red-dim)', color: 'var(--alert-red)', borderRadius: 6, padding: '7px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={12} /> Zéro
            </button>
          </div>

          {/* Protocol selector */}
          <div className="neuro-card" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-hud)', color: 'var(--text-dim)' }}>
                BIBLIOTHÈQUE DE PROTOCOLES SACRÉS (MISBAHA) :
              </span>
              <button
                onClick={() => setShowNewZikr(!showNewZikr)}
                style={{ background: 'none', border: 'none', color: 'var(--border-cyan)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={11} /> Ajouter Zikr
              </button>
            </div>

            {/* Custom zikr form */}
            {showNewZikr && (
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 6, marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid var(--border-cyan-dim)' }}>
                <input 
                  type="text" 
                  placeholder="Nom du zikr (ex: La ilaha illa Allah)" 
                  value={customNom}
                  onChange={(e) => setCustomNom(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', borderRadius: 4, color: '#fff', padding: '5px 8px', fontSize: 11 }}
                />
                <input 
                  type="text" 
                  placeholder="Signification ou intention" 
                  value={customFormule}
                  onChange={(e) => setCustomFormule(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', borderRadius: 4, color: '#fff', padding: '5px 8px', fontSize: 11 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <input 
                    type="number" 
                    placeholder="Cible (ex: 100)" 
                    value={customTarget}
                    onChange={(e) => setCustomTarget(Number(e.target.value))}
                    style={{ width: 90, background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', borderRadius: 4, color: '#fff', padding: '5px 8px', fontSize: 11 }}
                  />
                  <button onClick={handleAddCustomZikr} className="btn-monarch" style={{ fontSize: 10, padding: '5px 12px' }}>
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allZikrs.map(z => (
                <button
                  key={z.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedZikrId(z.id);
                    onUpdateSpiritual({ ...spiritual, activeZikrId: z.id });
                  }}
                  style={{
                    padding: '5px 9px',
                    fontSize: 10,
                    borderRadius: 5,
                    border: `1px solid ${selectedZikrId === z.id ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedZikrId === z.id ? 'rgba(255,215,0,0.18)' : 'rgba(0,0,0,0.35)',
                    color: selectedZikrId === z.id ? 'var(--gold)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: selectedZikrId === z.id ? 700 : 500
                  }}
                >
                  {z.nom}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB TAB 2: 5 PRIÈRES & HORAIRES ASTRONOMIQUES ================= */}
      {activeSubTab === 'prieres' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Prochaine prière countdown */}
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>PROCHAINE PRIÈRE</span>
                <div style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--gold)', textTransform: 'uppercase' }}>
                  {prayerTimes?.nextPrayerName || 'En attente...'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>DANS</span>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-hud)', color: '#fff' }}>
                  {countdown || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Sélection rapide de ville */}
          <div className="neuro-card" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <MapPin size={14} color="var(--border-cyan)" />
              <span style={{ fontSize: 10, fontFamily: 'var(--font-hud)', color: 'var(--border-cyan)' }}>
                LOCALISATION ({spiritual.cityName || 'Lomé, Togo'}) :
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {CITY_PRESETS.map(city => (
                <button
                  key={city.name}
                  onClick={() => handleSelectCity(city)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 10,
                    borderRadius: 4,
                    border: `1px solid ${spiritual.cityName === city.name ? 'var(--border-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    background: spiritual.cityName === city.name ? 'rgba(0,217,255,0.15)' : 'rgba(0,0,0,0.3)',
                    color: spiritual.cityName === city.name ? 'var(--border-cyan)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {city.name.split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Les 5 prières */}
          <div className="neuro-card" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 10 }}>LES 5 PRIÈRES DU JOUR</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'fajr', label: 'Fajr (Aube)', time: prayerTimes?.fajr },
                { id: 'dhuhr', label: 'Dhuhr (Midi)', time: prayerTimes?.dhuhr },
                { id: 'asr', label: 'Asr (Après-midi)', time: prayerTimes?.asr },
                { id: 'maghrib', label: 'Maghrib (Coucher)', time: prayerTimes?.maghrib },
                { id: 'isha', label: 'Isha (Nuit)', time: prayerTimes?.isha },
              ].map(p => {
                const isDone = spiritual.prayersDone?.[p.id];
                return (
                  <div
                    key={p.id}
                    onClick={() => handleTogglePrayer(p.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isDone ? 'rgba(0,255,136,0.08)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${isDone ? 'var(--neon-green)' : 'var(--border-cyan-dim)'}`,
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isDone ? <CheckCircle2 size={18} color="var(--neon-green)" /> : <Circle size={18} color="var(--text-dim)" />}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isDone ? '#fff' : 'var(--text-main)' }}>{p.label}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Horaire astronomique : {p.time ? formatTime(p.time) : '—'}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, padding: '3px 7px', borderRadius: 4, background: isDone ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)', color: isDone ? 'var(--neon-green)' : 'var(--text-dim)' }}>
                      {isDone ? 'ACCOMPLIE (+5 XP)' : 'À FAIRE'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB TAB 3: CURE 40 JOURS (YA AZIZ) ================= */}
      {activeSubTab === 'cures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span className="system-window-title" style={{ color: 'var(--gold)' }}>CURE SOLENNELLE DES 40 JOURS</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--font-hud)' }}>
                JOUR {spiritual.cureYaAziz?.currentDay || 1} / 40
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Invocation ininterrompue de « Yâ Azîz » (Le Tout-Puissant) pour acquérir l'autorité spirituelle, la clarté et l'invulnérabilité morale.
            </p>

            {/* 40 Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6, marginBottom: 14 }}>
              {Array.from({ length: 40 }).map((_, idx) => {
                const dayNum = idx + 1;
                const isCompleted = (spiritual.cureYaAziz?.completedDays || []).includes(dayNum);
                const isCurrent = (spiritual.cureYaAziz?.currentDay || 1) === dayNum;
                return (
                  <div
                    key={dayNum}
                    style={{
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      fontFamily: 'var(--font-hud)',
                      background: isCompleted ? 'rgba(0,255,136,0.2)' : isCurrent ? 'rgba(255,215,0,0.25)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${isCompleted ? 'var(--neon-green)' : isCurrent ? 'var(--gold)' : 'rgba(255,255,255,0.08)'}`,
                      color: isCompleted ? 'var(--neon-green)' : isCurrent ? 'var(--gold)' : 'var(--text-dim)'
                    }}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAdvanceCure}
              className="btn-monarch"
              style={{ width: '100%', padding: '10px', fontSize: 11, background: 'rgba(255,215,0,0.18)', borderColor: 'var(--gold)', color: 'var(--gold)' }}
            >
              ✓ VALIDER LE JOUR {spiritual.cureYaAziz?.currentDay || 1} (+15 XP)
            </button>
          </div>
        </div>
      )}

      {/* ================= SUB TAB 4: TRACKER CORAN ================= */}
      {activeSubTab === 'coran' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="neuro-card" style={{ padding: '14px' }}>
            <span className="system-window-title" style={{ display: 'block', marginBottom: 12 }}>
              AVANCEMENT DU SAINT CORAN
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-title)' }}>
                  {spiritual.quran?.juz || 1}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>JUZ' COMPLETS</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--font-title)' }}>
                  {spiritual.quran?.pages || 12}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>PAGES LUES/MÉMO</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--neon-green)', fontFamily: 'var(--font-title)' }}>
                  {spiritual.quran?.verses || 75}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>VERSETS GRAVÉS</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleIncrementQuran('verses', 5)}
                className="btn-monarch"
                style={{ flex: 1, padding: '9px', fontSize: 11 }}
              >
                +5 Versets (+5 XP)
              </button>
              <button
                onClick={() => handleIncrementQuran('pages', 1)}
                className="btn-monarch"
                style={{ flex: 1, padding: '9px', fontSize: 11 }}
              >
                +1 Page (+10 XP)
              </button>
              <button
                onClick={() => handleIncrementQuran('juz', 1)}
                className="btn-monarch"
                style={{ flex: 1, padding: '9px', fontSize: 11, borderColor: 'var(--gold)', color: 'var(--gold)' }}
              >
                +1 Juz' (+50 XP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB TAB 5: GRILLE DES 45 JOURS & MON ASTRE ================= */}
      {activeSubTab === 'destin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Astre alignment card */}
          <div className="neuro-card" style={{ padding: '14px', borderColor: 'var(--border-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="var(--border-cyan)" />
                <span className="system-window-title">CYCLE DE DESTIN (JOUR {cycleDay45} / 45)</span>
              </div>
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,217,255,0.15)', color: 'var(--border-cyan)', fontWeight: 800 }}>
                ÉLÉMENT : {cycleElement.toUpperCase()}
              </span>
            </div>

            <p style={{ fontSize: 11, color: '#fff', margin: '6px 0 10px' }}>
              {elementDesc}
            </p>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 6, border: '1px solid var(--border-cyan-dim)' }}>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>
                RECOMMANDATION DU {currentDayOfMonth} DU MOIS :
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', marginTop: 2 }}>
                « {dayGuide.texte} »
              </div>
            </div>
          </div>

          {/* Date de naissance pour calcul de l'astre */}
          <div className="neuro-card" style={{ padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-hud)', color: 'var(--text-dim)' }}>
                DATE DE NAISSANCE (ANCRE DU CYCLE) :
              </span>
              <button onClick={handleSaveBirthdate} className="btn-monarch" style={{ fontSize: 9, padding: '3px 8px' }}>
                Enregistrer
              </button>
            </div>
            <input 
              type="date"
              value={birthInput}
              onChange={(e) => setBirthInput(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', padding: '6px 8px', fontSize: 12, boxSizing: 'border-box' }}
            />
          </div>

          {/* Jeûnes et Aumônes */}
          <div className="neuro-card" style={{ padding: '12px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', display: 'block', marginBottom: 6 }}>
              JEÛNES ET AUMÔNES STRATÉGIQUES DU MOIS
            </span>
            <div style={{ fontSize: 11, color: '#fff', lineHeight: 1.6 }}>
              • <strong>Jours de Jeûne :</strong> 17 et 27 de chaque mois (+ lundis et jeudis)<br />
              • <strong>Jours d'Aumône :</strong> 18 et 28 de chaque mois<br />
              • <strong>Veillées de Prière :</strong> 7, 16 et 26 du mois
            </div>
          </div>

          {/* Prières hebdomadaires spéciales */}
          <div className="neuro-card" style={{ padding: '12px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--border-cyan)', display: 'block', marginBottom: 8 }}>
              PRIÈRES HEBDOMADAIRES SPÉCIALES
            </span>
            <div style={{ fontSize: 11, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(GRILLE_DATA.spirituel?.prieresHebdomadaires || []).map((p, idx) => (
                <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 4 }}>
                  <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{p.jour} :</strong> {p.texte}
                </div>
              ))}
            </div>
          </div>

          {/* Nutrition & Hygiène sacrée */}
          <div className="neuro-card" style={{ padding: '12px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--neon-green)', display: 'block', marginBottom: 6 }}>
              HYGIÈNE ALIMENTAIRE & APAISEMENT
            </span>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              • <strong>Règles permanentes :</strong> Moins d'huile, moins de sucre, moins de graisses animales.<br />
              • <strong>Apaisement & Clarté :</strong> Soupe de poisson, fromage et légumes légers.<br />
              • <strong>Vigilance :</strong> Surveillance du ventre et repos des yeux.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
