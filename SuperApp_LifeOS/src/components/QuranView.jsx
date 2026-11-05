import React, { useState } from 'react';
import { BookOpen, Check, Plus, RefreshCw, Sparkles, Moon } from 'lucide-react';
import { sound } from '../core/sound.js';
import confetti from 'canvas-confetti';

export default function QuranView({
  prayers,
  onTogglePrayer,
  tasbihCount,
  onIncrementTasbih,
  onResetTasbih,
  quranVerses,
  onAddVerse
}) {
  const [sourate, setSourate] = useState('');
  const [versets, setVersets] = useState('');

  const handleAddVerse = (e) => {
    e.preventDefault();
    if (!sourate || !versets) return;
    sound.playQuestComplete();
    confetti({ particleCount: 35, spread: 50 });
    onAddVerse({ sourate, versets, date: new Date().toISOString().split('T')[0], status: 'nouveau' });
    setSourate('');
    setVersets('');
  };

  const prayerList = [
    { id: 'fajr', label: 'Fajr (Aube)', time: '05h30' },
    { id: 'dhuhr', label: 'Dhuhr (Midi)', time: '13h00' },
    { id: 'asr', label: 'Asr (Après-midi)', time: '16h15' },
    { id: 'maghrib', label: 'Maghrib (Coucher)', time: '18h45' },
    { id: 'isha', label: 'Isha (Nuit)', time: '20h00' }
  ];

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-float">
      
      {/* 5 Daily Prayers Tracker */}
      <div className="system-window corner-cut" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Moon size={18} color="var(--border-cyan)" />
            <span className="system-window-title">LES 5 PRIÈRES QUOTIDIENNES</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
            +1 XP SPI / PRIÈRE
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {prayerList.map(p => {
            const isDone = prayers[p.id];
            return (
              <button
                key={p.id}
                onClick={() => {
                  sound.playClick();
                  onTogglePrayer(p.id);
                  if (!isDone) sound.playQuestComplete();
                }}
                style={{
                  background: isDone ? 'rgba(0,255,136,0.15)' : 'rgba(0,0,0,0.4)',
                  border: isDone ? '1px solid var(--neon-green)' : '1px solid var(--border-cyan-dim)',
                  borderRadius: 8,
                  padding: '8px 2px',
                  color: isDone ? 'var(--neon-green)' : 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: isDone ? '1px solid var(--neon-green)' : '1px solid var(--text-dim)',
                  background: isDone ? 'var(--neon-green)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isDone && <Check size={14} color="#000" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-hud)' }}>
                  {p.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Digital Tasbih / Dhikr */}
      <div className="system-window" style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="system-window-title">TASBIH & DHIKR DIGITAL</span>
          <button
            onClick={() => { sound.playClick(); onResetTasbih(); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex' }}
            title="Réinitialiser"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div
          onClick={() => {
            sound.playTasbih();
            onIncrementTasbih();
          }}
          style={{
            width: 140,
            height: 140,
            margin: '0 auto 12px',
            borderRadius: '50%',
            border: '2px solid var(--border-cyan)',
            boxShadow: 'var(--glow-cyan)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(0,217,255,0.15) 0%, rgba(0,0,0,0.6) 80%)',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 38, fontWeight: 900, color: '#fff' }}>
            {tasbihCount}
          </div>
          <div style={{ fontSize: 10, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)' }}>
            TOUCHE ICI ({tasbihCount % 33}/33)
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          SubhanAllah (33) • Alhamdulillah (33) • Allahu Akbar (34)
        </div>
      </div>

      {/* Quran Memorization Tracker */}
      <div className="system-window" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="system-window-title">MÉMORISATION DU CORAN</span>
          <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
            OBJECTIF 15-20 JUZ'
          </span>
        </div>

        <form onSubmit={handleAddVerse} style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Sourate (ex: Al-Mulk)"
            value={sourate}
            onChange={(e) => setSourate(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--border-cyan-dim)',
              color: '#fff',
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: 11
            }}
          />
          <input
            type="text"
            placeholder="Versets (ex: 1-5)"
            value={versets}
            onChange={(e) => setVersets(e.target.value)}
            style={{
              width: 100,
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--border-cyan-dim)',
              color: '#fff',
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: 11
            }}
          />
          <button type="submit" className="btn-monarch" style={{ padding: '6px 10px' }}>
            <Plus size={14} />
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {quranVerses.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', padding: '10px 0' }}>
              Aucun verset enregistré pour le moment. Enregistre tes 5 premiers versets !
            </div>
          ) : (
            quranVerses.map((v, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-cyan-dim)',
                  borderRadius: 6,
                  fontSize: 11
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, color: '#fff' }}>Sourate {v.sourate}</span>
                  <span style={{ color: 'var(--border-cyan)', marginLeft: 6 }}>v. {v.versets}</span>
                </div>
                <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>{v.date}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
