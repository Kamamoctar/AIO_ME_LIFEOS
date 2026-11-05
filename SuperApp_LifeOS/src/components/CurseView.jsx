import React, { useState, useEffect } from 'react';
import { Shield, Flame, AlertOctagon, Play, Pause, RotateCcw, Plus, CheckCircle, MessageSquare } from 'lucide-react';
import { sound } from '../core/sound.js';
import confetti from 'canvas-confetti';

export default function CurseView({
  player,
  onOpenPanic,
  onDeclareRelapse,
  onAddCapturedTask,
  onToggleParoleOr
}) {
  // Procrastination 2-minute timer
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  // Quick idea capture input
  const [capturedIdea, setCapturedIdea] = useState('');

  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      sound.playLevelUp();
      confetti({ particleCount: 50, spread: 60 });
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const handleCaptureSubmit = (e) => {
    e.preventDefault();
    if (!capturedIdea.trim()) return;
    sound.playQuestComplete();
    onAddCapturedTask(capturedIdea.trim());
    setCapturedIdea('');
  };

  const milestones = [
    { days: 7, title: "L'Initié" },
    { days: 14, title: 'Le Résistant' },
    { days: 30, title: 'Le Pur' },
    { days: 60, title: 'Le Discipliné' },
    { days: 90, title: 'Le Monarque de Soi' },
  ];

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-float">
      
      {/* 🔴 MALÉDICTION #1 : PURETÉ NOFAP */}
      <div className="system-window corner-cut" style={{
        borderColor: 'var(--alert-red)',
        boxShadow: 'var(--glow-red)',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--alert-red)' }}>
            <Flame size={18} />
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 12, fontWeight: 900 }}>
              MALÉDICTION #1 : PURETÉ (OBJECTIF 90J)
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>
            RECORD : {player.recordNoFap} JOURS
          </span>
        </div>

        {/* Big Counter */}
        <div style={{
          textAlign: 'center',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid var(--border-cyan-dim)',
          borderRadius: 12,
          padding: '20px 10px',
          marginBottom: 16
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)', letterSpacing: 1 }}>
            COMPTEUR DE PURETÉ
          </div>
          <div style={{
            fontFamily: 'var(--font-title)',
            fontSize: 48,
            fontWeight: 900,
            color: '#fff',
            textShadow: '0 0 20px rgba(0, 217, 255, 0.6)'
          }}>
            JOUR {player.streakNoFap}
          </div>
          <div style={{ fontSize: 11, color: 'var(--border-cyan)', marginTop: 2 }}>
            Progression : {Math.min(100, Math.round((player.streakNoFap / 90) * 100))}% de l'objectif final
          </div>

          <div className="hud-bar-container" style={{ height: 8, maxWidth: 260, margin: '12px auto 0' }}>
            <div className="hud-bar-fill" style={{ width: `${Math.min(100, (player.streakNoFap / 90) * 100)}%` }} />
          </div>
        </div>

        {/* Big Emergency Panic Button */}
        <button
          onClick={onOpenPanic}
          className="btn-monarch btn-danger"
          style={{ width: '100%', padding: '14px', fontSize: 14, marginBottom: 16 }}
        >
          🚨 🆘 BOUTON D'URGENCE TENTATION
        </button>

        {/* Milestones */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-hud)', color: 'var(--border-cyan)', marginBottom: 8 }}>
            PALIERS DE TRANSFORMATION :
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, textAlign: 'center' }}>
            {milestones.map(m => {
              const reached = player.streakNoFap >= m.days;
              return (
                <div
                  key={m.days}
                  style={{
                    background: reached ? 'rgba(0,255,136,0.15)' : 'rgba(0,0,0,0.4)',
                    border: reached ? '1px solid var(--neon-green)' : '1px solid var(--border-cyan-dim)',
                    borderRadius: 6,
                    padding: '6px 2px'
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: reached ? 'var(--neon-green)' : '#fff' }}>
                    {m.days}j
                  </div>
                  <div style={{ fontSize: 8, color: reached ? '#fff' : 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Declare Relapse */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onDeclareRelapse}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: 10,
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Déclarer une rechute (-50 XP DSC & réveil immédiat)
          </button>
        </div>
      </div>

      {/* 🟠 MALÉDICTION #2 : PROCRASTINATION */}
      <div className="system-window" style={{ padding: '16px', borderColor: 'var(--border-cyan)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', marginBottom: 10 }}>
          <AlertOctagon size={18} />
          <span style={{ fontFamily: 'var(--font-title)', fontSize: 12, fontWeight: 700 }}>
            MALÉDICTION #2 : PROCRASTINATION & INACTION
          </span>
        </div>

        <p style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--border-cyan)', marginBottom: 14 }}>
          « Un Monarch n'attend pas. Il agit. Si cela prend moins de 2 minutes, fais-le MAINTENANT. »
        </p>

        {/* 2-Minute Timer Box */}
        <div style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid var(--border-cyan-dim)',
          borderRadius: 8,
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>
              ⚡ RÈGLE DES 2 MINUTES CHRONO
            </div>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: 24, fontWeight: 900, color: '#fff' }}>
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => {
                sound.playClick();
                setTimerRunning(!timerRunning);
              }}
              className="btn-monarch"
              style={{ padding: '8px 12px' }}
            >
              {timerRunning ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setTimerRunning(false);
                setTimerSeconds(120);
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--border-cyan-dim)',
                color: '#fff',
                borderRadius: 6,
                padding: '8px',
                cursor: 'pointer',
                display: 'flex'
              }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Boîte de capture rapide pour opérationnaliser les idées */}
        <div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-hud)', color: 'var(--border-cyan)', marginBottom: 6 }}>
            💡 BOÎTE DE CAPTURE (OPÉRATIONNALISER UNE IDÉE EN QUÊTE) :
          </div>
          <form onSubmit={handleCaptureSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={capturedIdea}
              onChange={(e) => setCapturedIdea(e.target.value)}
              placeholder="Ex: Écrire les 2 premiers paragraphes de la Fable 1..."
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--border-cyan-dim)',
                borderRadius: 6,
                padding: '8px 12px',
                color: '#fff',
                fontSize: 12,
                outline: 'none'
              }}
            />
            <button type="submit" className="btn-monarch" style={{ padding: '8px 12px', flexShrink: 0 }}>
              <Plus size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* 🟡 MALÉDICTION #3 : PAROLE D'OR */}
      <div className="system-window" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--border-cyan)' }}>
            <MessageSquare size={18} />
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 12, fontWeight: 700 }}>
              MALÉDICTION #3 : PROTOCOLE PAROLE D’OR
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
            STREAK : {player.streakParoleOr}J
          </span>
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid var(--border-cyan-dim)',
          borderRadius: 8,
          padding: '12px',
          marginBottom: 12
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
            Règle Absolue : Écouter 70 % • Parler 30 %
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Avant toute prise de parole, valide ce triple filtre :<br/>
            1. <strong>Est-ce utile ?</strong><br/>
            2. <strong>Est-ce nécessaire ?</strong><br/>
            3. <strong>Est-ce bienveillant ?</strong>
          </div>
        </div>

        <button
          onClick={onToggleParoleOr}
          className="btn-monarch"
          style={{ width: '100%', padding: '10px' }}
        >
          <CheckCircle size={16} /> VALIDER LE PROTOCOLE AUJOURD’HUI (+3 XP CHA)
        </button>
      </div>

    </div>
  );
}
