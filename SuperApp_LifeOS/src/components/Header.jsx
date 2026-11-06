import React from 'react';
import { Volume2, VolumeX, Shield, Sun, Moon, Flame, Zap, Sparkles, AlertOctagon } from 'lucide-react';
import { sound } from '../core/sound.js';
import { xpRequiredForLevel } from '../data/storage.js';

export default function Header({
  player,
  setPlayer,
  userSettings,
  onOpenPanic,
  theme,
  onToggleTheme
}) {
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

  // Astre element calculation from birthDate
  const today = new Date();
  const birthDateObj = new Date(userSettings?.birthDate || '1995-01-01');
  const diffDays = Math.floor((today - birthDateObj) / (1000 * 60 * 60 * 24));
  const cycleDay45 = Math.abs(diffDays % 45) + 1;

  let cycleElement = 'Feu';
  let elementColor = 'var(--accent-red)';
  if (cycleDay45 >= 12 && cycleDay45 <= 22) {
    cycleElement = 'Terre';
    elementColor = 'var(--accent-gold)';
  } else if (cycleDay45 >= 23 && cycleDay45 <= 33) {
    cycleElement = 'Air';
    elementColor = 'var(--accent-cyan)';
  } else if (cycleDay45 >= 34) {
    cycleElement = 'Eau';
    elementColor = '#60A5FA';
  }

  return (
    <header className="cyber-island-header">
      {/* 1. Left: Hunter Rank & Level */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span className={`hunter-rank-pill rank-${player.rank || 'E'}`}>
          {player.rank || 'E'}
        </span>
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 11, fontWeight: 800, color: '#fff' }}>
              LVL {player.level || 1}
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              ({percent}%)
            </span>
          </div>
          <div className="hud-bar-container" style={{ width: 48, height: 3, marginTop: 2 }}>
            <div className="hud-bar-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      {/* 2. Center: Astre Status & NoFap Streak */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
        <div className="astre-status-pill" title="Cycle de Destin 45 jours">
          <Sparkles size={10} color={elementColor} />
          <span style={{ fontSize: 10, color: elementColor }}>{cycleElement}</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>J{cycleDay45}</span>
        </div>

        <div className="streak-status-pill" title="Jours de pureté NoFap">
          <Flame size={11} color="var(--accent-emerald)" />
          <span style={{ fontSize: 10 }}>{player.streakNoFap || 0}j</span>
        </div>
      </div>

      {/* 3. Right: Controls (Sound, Theme, SOS Pureté) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {/* SOS Button */}
        <button
          onClick={onOpenPanic}
          style={{
            padding: '3px 7px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(255, 51, 102, 0.15)',
            border: '1px solid var(--accent-red)',
            color: 'var(--accent-red)',
            fontSize: 9,
            fontFamily: 'var(--font-hud)',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3
          }}
          title="SOS Urgence Pureté"
        >
          <AlertOctagon size={11} /> SOS
        </button>

        {/* Theme Switch */}
        <button
          onClick={onToggleTheme}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Changer de thème (Clair / Sombre)"
        >
          {isLight ? <Moon size={15} color="var(--accent-cyan)" /> : <Sun size={15} color="var(--accent-gold)" />}
        </button>

        {/* Audio Toggle */}
        <button
          onClick={toggleSound}
          style={{
            background: 'none',
            border: 'none',
            color: player.soundEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Activer/Désactiver le son"
        >
          {player.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      </div>
    </header>
  );
}
