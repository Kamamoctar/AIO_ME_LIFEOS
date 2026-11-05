import React from 'react';
import { Volume2, VolumeX, Shield, Sun, Moon, Flame, Zap } from 'lucide-react';
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
    <header style={{
      background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(13, 17, 29, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
      padding: '10px 14px 8px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: 500,
      margin: '0 auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        {/* Hunter Identity & Level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32,
            height: 32,
            minWidth: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(139, 92, 246, 0.35))',
            border: '1px solid var(--border-cyan-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={16} color="var(--border-cyan)" />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: 'var(--font-title)',
                fontSize: 12,
                fontWeight: 900,
                color: 'var(--text-white)',
                letterSpacing: 0.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {player.codename.toUpperCase()}
              </span>
              <span className={`rank-badge rank-${player.rank}`}>
                RANG {player.rank}
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)', fontWeight: 600 }}>
              NIVEAU {player.level} • {player.xpTotal} XP
            </div>
          </div>
        </div>

        {/* Streaks & Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Streak NoFap Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            padding: '3px 8px',
            borderRadius: 12,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--alert-red-dim)',
            fontSize: 10,
            fontFamily: 'var(--font-hud)',
            fontWeight: 800,
            color: 'var(--alert-red)'
          }} title="Streak Pureté">
            <Flame size={12} />
            <span>{player.streakNoFap}j</span>
          </div>

          {/* Theme Switch */}
          <button 
            onClick={onToggleTheme}
            style={{
              background: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.1)'}`,
              color: 'var(--text-main)',
              width: 28,
              height: 28,
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isLight ? 'Activer Mode Sombre' : 'Activer Mode Clair'}
          >
            {isLight ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {/* Sound Toggle */}
          <button 
            onClick={toggleSound}
            style={{
              background: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.1)'}`,
              color: sound.enabled ? 'var(--border-cyan)' : 'var(--text-dim)',
              width: 28,
              height: 28,
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={sound.enabled ? 'Son activé' : 'Son coupé'}
          >
            {sound.enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* SOS Urgence */}
          <button 
            onClick={onOpenPanic}
            className="btn-monarch btn-danger"
            style={{ padding: '4px 7px', fontSize: 10, borderRadius: 6, minHeight: 28 }}
            title="Protocole d'urgence Pureté"
          >
            🆘
          </button>
        </div>
      </div>

      {/* Level XP Progress Bar */}
      <div style={{ marginTop: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-hud)', marginBottom: 2 }}>
          <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>PROGRESSION NIVEAU</span>
          <span style={{ color: 'var(--border-cyan)', fontWeight: 700 }}>{percent}% ({xpInLevel}/{xpNeeded} XP)</span>
        </div>
        <div className="hud-bar-container">
          <div className="hud-bar-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </header>
  );
}
