import React from 'react';
import { Volume2, VolumeX, Shield, Sun, Moon } from 'lucide-react';
import { sound } from '../core/sound.js';
import { xpRequiredForLevel } from '../data/storage.js';

export default function Header({ player, setPlayer, onOpenPanic, theme, onToggleTheme }) {
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

  const isLight = theme === 'light';

  return (
    <header className="system-window" style={{
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      padding: '10px 12px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: 480
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 34,
            height: 34,
            minWidth: 34,
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(0,217,255,0.2), rgba(123,47,255,0.4))',
            border: '1px solid var(--border-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-cyan)'
          }}>
            <Shield size={18} color="var(--border-cyan)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                fontFamily: 'var(--font-title)',
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 0.5,
                color: 'var(--text-white)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {player.codename.toUpperCase()}
              </span>
              <span className={`rank-badge rank-${player.rank}`} style={{ fontSize: 9, padding: '2px 5px' }}>
                RANG {player.rank}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>
              NIV. {player.level} • {player.xpTotal} XP
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Mode Sombre / Mode Clair Toggle */}
          <button 
            onClick={onToggleTheme}
            style={{
              background: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(0,0,0,0.5)',
              border: `1px solid ${isLight ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`,
              color: 'var(--border-cyan)',
              padding: 6,
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isLight ? 'Activer Mode Sombre' : 'Activer Mode Clair'}
          >
            {isLight ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Sound Toggle */}
          <button 
            onClick={toggleSound}
            style={{
              background: isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(0,0,0,0.5)',
              border: `1px solid ${isLight ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`,
              color: sound.enabled ? 'var(--border-cyan)' : 'var(--text-dim)',
              padding: 6,
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={sound.enabled ? 'Son activé' : 'Son coupé'}
          >
            {sound.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* SOS Urgence Pureté */}
          <button 
            onClick={onOpenPanic}
            className="btn-monarch btn-danger"
            style={{ padding: '5px 8px', fontSize: 10, borderRadius: 6, whiteSpace: 'nowrap' }}
            title="Protocole d'urgence"
          >
            🆘 SOS
          </button>
        </div>
      </div>

      {/* Level XP Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-hud)', marginBottom: 2 }}>
          <span style={{ color: 'var(--text-dim)' }}>PROGRESSION NIVEAU</span>
          <span style={{ color: 'var(--border-cyan)', fontWeight: 700 }}>{percent}% ({xpInLevel}/{xpNeeded} XP)</span>
        </div>
        <div className="hud-bar-container" style={{ height: 5 }}>
          <div className="hud-bar-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </header>
  );
}
