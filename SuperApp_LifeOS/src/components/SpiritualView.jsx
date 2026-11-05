import React, { useState, useEffect } from 'react';
import { 
  Moon, Sun, Clock, CheckCircle2, Circle, Flame, 
  RotateCcw, BookOpen, Sparkles, ChevronRight, Volume2 
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { calculatePrayerTimes, formatTime, getNextPrayerCountdown } from '../core/prayers.js';
import { ZIKR_DATA } from '../data/zikrData.js';
import { GRILLE_DATA } from '../data/grilleData.js';

export default function SpiritualView({
  spiritual,
  onUpdateSpiritual,
  onAddXp
}) {
  const [activeSubTab, setActiveSubTab] = useState('tasbih'); // 'tasbih', 'prieres', 'cures', 'coran', 'destin'
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [selectedZikrId, setSelectedZikrId] = useState(spiritual.activeZikrId || 'ya_rachid');

  // Load and refresh prayer times
  useEffect(() => {
    const pt = calculatePrayerTimes(new Date(), spiritual.latitude || 6.1375, spiritual.longitude || 1.2123, spiritual.prayerMethod || 'MWL');
    setPrayerTimes(pt);
    if (pt && pt.timeForNext) {
      setCountdown(getNextPrayerCountdown(pt.timeForNext));
    }

    const timer = setInterval(() => {
      const nowPt = calculatePrayerTimes(new Date(), spiritual.latitude || 6.1375, spiritual.longitude || 1.2123, spiritual.prayerMethod || 'MWL');
      if (nowPt && nowPt.timeForNext) {
        setCountdown(getNextPrayerCountdown(nowPt.timeForNext));
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [spiritual.latitude, spiritual.longitude, spiritual.prayerMethod]);

  const zikrsList = ZIKR_DATA.zikrs || [];
  const activeZikr = zikrsList.find(z => z.id === selectedZikrId) || zikrsList[0];

  const handleTasbihTap = () => {
    sound.playTasbih();
    const nextCount = (spiritual.tasbihCount || 0) + 1;
    onUpdateSpiritual({ ...spiritual, tasbihCount: nextCount });

    // Milestone bonus every 33 taps
    if (nextCount % 33 === 0) {
      sound.playQuestComplete();
      onAddXp(1, 'SPI');
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
    onAddXp(Math.floor(amount / 33), 'SPI');
  };

  const handleTogglePrayer = (prayerName) => {
    sound.playClick();
    const current = spiritual.prayersDone || {};
    const nextState = !current[prayerName];
    if (nextState) {
      sound.playQuestComplete();
      onAddXp(3, 'SPI');
    }
    onUpdateSpiritual({
      ...spiritual,
      prayersDone: { ...current, [prayerName]: nextState }
    });
  };

  const handleIncrementQuran = (type, amount) => {
    sound.playClick();
    const curQuran = spiritual.quran || { juz: 1, pages: 12, verses: 75 };
    const updated = { ...curQuran, [type]: curQuran[type] + amount };
    onUpdateSpiritual({ ...spiritual, quran: updated });
    onAddXp(amount, 'SPI');
  };

  const handleAdvanceCure = () => {
    sound.playLevelUp();
    const curCure = spiritual.cureYaAziz || { currentDay: 1, completedDays: [] };
    const nextDay = Math.min(40, curCure.currentDay + 1);
    onUpdateSpiritual({
      ...spiritual,
      cureYaAziz: {
        ...curCure,
        currentDay: nextDay,
        completedDays: [...curCure.completedDays, curCure.currentDay]
      }
    });
    onAddXp(15, 'SPI');
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-float">
      
      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'tasbih', label: '📿 TASBIH DIGITAL' },
          { id: 'prieres', label: '🕌 5 PRIÈRES (HORAIRES)' },
          { id: 'cures', label: '⏳ CURE 40J' },
          { id: 'coran', label: '📖 CORAN' },
          { id: 'destin', label: '✨ 45 JOURS (GRILLE)' },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => {
              sound.playClick();
              setActiveSubTab(st.id);
            }}
            style={{
              padding: '6px 10px',
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              borderRadius: 6,
              border: `1px solid ${activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`,
              background: activeSubTab === st.id ? 'rgba(0,217,255,0.2)' : 'rgba(0,0,0,0.4)',
              color: activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* --- SUB TAB 1: LE GRAND TASBIH DIGITAL INTERACTIF --- */}
      {activeSubTab === 'tasbih' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Active Zikr Banner */}
          <div className="system-window" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>PROTOCOLE ACTIF</div>
            <div style={{ fontFamily: 'Amiri, serif', fontSize: 26, color: 'var(--gold)', margin: '4px 0' }}>
              {activeZikr.arabe}
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{activeZikr.nom} ({activeZikr.formule})</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>« {activeZikr.sens} »</div>
            {activeZikr.instruction && (
              <div style={{ fontSize: 10, color: 'var(--border-cyan)', marginTop: 4 }}>
                {activeZikr.instruction}
              </div>
            )}
          </div>

          {/* Huge Touch Counter Button */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
            <button
              onClick={handleTasbihTap}
              style={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,217,255,0.2) 0%, rgba(7,10,18,0.9) 70%)',
                border: '3px solid var(--border-cyan)',
                boxShadow: '0 0 35px rgba(0,217,255,0.4), inset 0 0 25px rgba(0,217,255,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                userSelect: 'none'
              }}
            >
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 44, fontWeight: 900, color: '#fff' }}>
                {spiritual.tasbihCount || 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)', letterSpacing: 2, marginTop: 4 }}>
                TOUCHER • TAP
              </div>
              {activeZikr.quantite && (
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                  Objectif: {activeZikr.quantite}
                </div>
              )}
            </button>
          </div>

          {/* Controls: Reset and Bulk + */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button
              onClick={() => handleAddTasbihBulk(10)}
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', color: '#fff', borderRadius: 6, padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}
            >
              +10
            </button>
            <button
              onClick={() => handleAddTasbihBulk(33)}
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              +33
            </button>
            <button
              onClick={() => handleAddTasbihBulk(100)}
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan)', color: 'var(--border-cyan)', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              +100
            </button>
            <button
              onClick={handleResetTasbih}
              style={{ background: 'rgba(255,46,76,0.1)', border: '1px solid var(--alert-red-dim)', color: 'var(--alert-red)', borderRadius: 6, padding: '6px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <RotateCcw size={12} /> Zéro
            </button>
          </div>

          {/* Quick Select of Other Zikrs */}
          <div className="system-window" style={{ padding: '10px 12px' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-hud)', color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
              BIBLIOTHÈQUE DE PROTOCOLES SACRÉS (MISBAHA) :
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {zikrsList.map(z => (
                <button
                  key={z.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedZikrId(z.id);
                    onUpdateSpiritual({ ...spiritual, activeZikrId: z.id });
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: 10,
                    borderRadius: 4,
                    border: `1px solid ${selectedZikrId === z.id ? 'var(--gold)' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedZikrId === z.id ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.3)',
                    color: selectedZikrId === z.id ? 'var(--gold)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {z.nom}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUB TAB 2: LES 5 PRIÈRES & COMPTE À REBOURS HORS-LIGNE --- */}
      {activeSubTab === 'prieres' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Next prayer widget */}
          <div className="system-window corner-cut" style={{ padding: '14px', borderColor: 'var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                  PROCHAINE PRIÈRE ({spiritual.cityName || 'Lomé'})
                </span>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginTop: 2 }}>
                  {prayerTimes?.next || 'Fajr'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>DANS</span>
                <div style={{ fontSize: 16, fontFamily: 'var(--font-title)', color: 'var(--border-cyan)' }}>
                  {countdown || '--'}
                </div>
              </div>
            </div>
          </div>

          {/* 5 Prayers Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { name: 'fajr', label: 'Fajr (Aube)', time: prayerTimes?.fajr },
              { name: 'sunrise', label: 'Chourouq (Lever du soleil)', time: prayerTimes?.sunrise, noCheck: true },
              { name: 'dhuhr', label: 'Dhuhr (Midi)', time: prayerTimes?.dhuhr },
              { name: 'asr', label: 'Asr (Après-midi)', time: prayerTimes?.asr },
              { name: 'maghrib', label: 'Maghrib (Coucher)', time: prayerTimes?.maghrib },
              { name: 'isha', label: 'Isha (Nuit)', time: prayerTimes?.isha },
            ].map(p => {
              const isDone = spiritual.prayersDone && spiritual.prayersDone[p.name];
              return (
                <div
                  key={p.name}
                  className="system-window"
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isDone ? 'rgba(0,255,136,0.06)' : 'rgba(0,0,0,0.4)',
                    borderColor: isDone ? 'var(--neon-green-dim)' : 'var(--border-cyan-dim)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)' }}>
                      {formatTime(p.time)}
                    </div>
                  </div>

                  {!p.noCheck && (
                    <button
                      onClick={() => handleTogglePrayer(p.name)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <span style={{ fontSize: 10, color: isDone ? 'var(--neon-green)' : 'var(--text-dim)' }}>
                        {isDone ? 'ACCOMPLIE (+3 XP)' : 'À VALIDER'}
                      </span>
                      {isDone ? <CheckCircle2 size={20} color="var(--neon-green)" /> : <Circle size={20} color="var(--text-dim)" />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- SUB TAB 3: CURES SPIRITUELLES DE 40 JOURS --- */}
      {activeSubTab === 'cures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="system-window" style={{ padding: '14px', borderColor: 'var(--gold)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                  PROTOCOLE DE CURE 40 JOURS
                </span>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Cure Ya-Aziz (40 fois après Fajr)</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>« Celui qui récite Ya Aziz 40 fois/jour pendant 40 jours n'aura jamais besoin des autres. »</div>
              </div>
            </div>

            <div style={{ margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#fff', marginBottom: 4 }}>
                <span>Progression de la cure :</span>
                <strong>Jour {spiritual.cureYaAziz?.currentDay || 1} / 40</strong>
              </div>
              <div className="hud-bar-container" style={{ height: 8 }}>
                <div className="hud-bar-fill gold" style={{ width: `${((spiritual.cureYaAziz?.currentDay || 1) / 40) * 100}%` }} />
              </div>
            </div>

            <button
              onClick={handleAdvanceCure}
              className="btn-monarch"
              style={{ width: '100%', padding: '8px', fontSize: 11, background: 'rgba(255,215,0,0.15)', borderColor: 'var(--gold)', color: 'var(--gold)' }}
            >
              ✓ VALIDER LE JOUR {spiritual.cureYaAziz?.currentDay || 1} (+15 XP)
            </button>
          </div>
        </div>
      )}

      {/* --- SUB TAB 4: TRACKER CORAN --- */}
      {activeSubTab === 'coran' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="system-window" style={{ padding: '14px' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-title)', color: 'var(--border-cyan)', display: 'block', marginBottom: 10 }}>
              AVANCEMENT MÉMORISATION DU SAINT CORAN
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-title)' }}>
                  {spiritual.quran?.juz || 1}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>JUZ' COMPLETS</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--font-title)' }}>
                  {spiritual.quran?.pages || 12}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>PAGES LUES/MÉMO</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--neon-green)', fontFamily: 'var(--font-title)' }}>
                  {spiritual.quran?.verses || 75}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>VERSETS GRAVÉS</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleIncrementQuran('verses', 5)}
                className="btn-monarch"
                style={{ flex: 1, padding: '8px', fontSize: 11 }}
              >
                +5 Versets (+5 XP)
              </button>
              <button
                onClick={() => handleIncrementQuran('pages', 1)}
                className="btn-monarch"
                style={{ flex: 1, padding: '8px', fontSize: 11 }}
              >
                +1 Page (+10 XP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB TAB 5: GRILLE DES 45 JOURS (MON ASTRE) --- */}
      {activeSubTab === 'destin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Les recommandations solennelles de la Grille de Destin et calendrier spirituel.
          </div>

          <div className="system-window" style={{ padding: '12px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', display: 'block', marginBottom: 4 }}>
              JEÛNES ET AUMÔNES STRATÉGIQUES DU MOIS
            </span>
            <div style={{ fontSize: 11, color: '#fff' }}>
              • <strong>Jours de Jeûne :</strong> 17 et 27 de chaque mois (+ lundis et jeudis)<br />
              • <strong>Jours d'Aumône :</strong> 18 et 28 de chaque mois<br />
              • <strong>Veillées de Prière :</strong> 7, 16 et 26 du mois
            </div>
          </div>

          <div className="system-window" style={{ padding: '12px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--border-cyan)', display: 'block', marginBottom: 4 }}>
              PRIÈRES HEBDOMADAIRES SPÉCIALES
            </span>
            <div style={{ fontSize: 11, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(GRILLE_DATA.spirituel?.prieresHebdomadaires || []).map((p, idx) => (
                <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 3 }}>
                  <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{p.jour} :</strong> {p.texte}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

