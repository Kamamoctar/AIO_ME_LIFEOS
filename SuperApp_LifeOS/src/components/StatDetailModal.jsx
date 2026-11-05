import React from 'react';
import { X, Award, Info } from 'lucide-react';
import { sound } from '../core/sound.js';

export default function StatDetailModal({ stat, onClose }) {
  if (!stat) return null;

  const currentVal = Math.min(100, stat.base + Math.floor(stat.xp / 50));
  const xpInStat = stat.xp % 50;
  const xpNeeded = 50 - xpInStat;
  const progressPercent = Math.round((xpInStat / 50) * 100);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(5, 7, 15, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '16px'
    }}>
      <div className="system-window corner-cut" style={{
        maxWidth: 360,
        width: '100%',
        padding: '20px',
        animation: 'floatUp 0.25s ease-out'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>{stat.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 700, color: 'var(--border-cyan)' }}>
                {stat.code} — {stat.name.toUpperCase()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ATTRIBUT SYSTÈME</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid var(--border-cyan-dim)',
          borderRadius: 8,
          padding: '14px',
          textAlign: 'center',
          marginBottom: 16
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>NIVEAU ACTUEL</div>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 44, fontWeight: 900, color: '#fff' }}>
            {currentVal} <span style={{ fontSize: 16, color: 'var(--text-dim)' }}>/ 100</span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--border-cyan)', marginTop: 4 }}>
            Progression : +1 point dans {xpNeeded} XP
          </div>
          <div className="hud-bar-container" style={{ height: 6, maxWidth: 220, margin: '8px auto 0' }}>
            <div className="hud-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 18 }}>
          <Info size={14} color="var(--border-cyan)" style={{ display: 'inline', marginRight: 4 }} />
          {stat.description}
        </div>

        <button
          onClick={onClose}
          className="btn-monarch"
          style={{ width: '100%', padding: '10px' }}
        >
          FERMER
        </button>
      </div>
    </div>
  );
}
