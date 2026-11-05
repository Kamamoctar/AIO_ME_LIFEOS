import React from 'react';
import { Volume2, VolumeX, Shield, Award, Download } from 'lucide-react';
import { sound } from '../core/sound.js';
import { xpRequiredForLevel } from '../data/storage.js';

export default function Header({ player, setPlayer, onOpenPanic }) {
  const currentFloor = player.level === 1 ? 0 : xpRequiredForLevel(player.level);
  const nextTarget = xpRequiredForLevel(player.level + 1);
  const xpInLevel = Math.max(0, player.xpTotal - currentFloor);
  const xpNeeded = Math.max(1, nextTarget - currentFloor);
  const percent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setPlayer(prev => ({ ...prev, soundEnabled: sound.enabled }));
    if (sound.enabled) sound.playClick();
  };

  return (
    <header className="system-window" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(0,217,255,0.2), rgba(123,47,255,0.4))',
            border: '1px solid var(--border-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-cyan)'
          }}>
            <Shield size={22} color="var(--border-cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-title)', fontSize: 13, fontWeight: 900, letterSpacing: 0.5, color: '#fff' }}>
                {player.codename.toUpperCase()}
              </span>
              <span className={`rank-badge rank-${player.rank}`}>
                RANG {player.rank}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>
              NIVEAU {player.level} • {player.xpTotal} XP TOTAL
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            onClick={onOpenPanic}
            className="btn-monarch btn-danger"
            style={{ padding: '6px 10px', fontSize: 11, borderRadius: 6 }}
            title="Protocole d'urgence"
          >
            🆘 URGENCE
          </button>
          <button 
            onClick={toggleSound}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--border-cyan-dim)',
              color: sound.enabled ? 'var(--border-cyan)' : 'var(--text-dim)',
              padding: 7,
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex'
            }}
            title={sound.enabled ? 'Son activé' : 'Son coupé'}
          >
            {sound.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Level XP Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-hud)', marginBottom: 3 }}>
          <span style={{ color: 'var(--border-cyan)' }}>PROGRESSION NIVEAU {player.level}</span>
          <span style={{ color: 'var(--text-muted)' }}>{xpInLevel} / {xpNeeded} XP ({percent}%)</span>
        </div>
        <div className="hud-bar-container" style={{ height: 6 }}>
          <div className="hud-bar-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </header>
  );
}
