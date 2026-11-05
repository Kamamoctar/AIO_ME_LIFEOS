import React from 'react';
import { Award, Zap, X } from 'lucide-react';
import { sound } from '../core/sound.js';

export default function LevelUpOverlay({ level, rank, onClose }) {
  if (!level) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(5, 7, 15, 0.94)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div className="system-window corner-cut" style={{
        maxWidth: 380,
        width: '100%',
        padding: '30px 20px',
        textAlign: 'center',
        borderColor: 'var(--border-cyan)',
        boxShadow: '0 0 50px rgba(0, 217, 255, 0.6), inset 0 0 30px rgba(0, 217, 255, 0.2)',
        animation: 'floatUp 0.4s ease-out'
      }}>
        <div style={{
          width: 70,
          height: 70,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0,217,255,0.3), rgba(123,47,255,0.5))',
          border: '2px solid var(--border-cyan)',
          boxShadow: 'var(--glow-cyan-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Zap size={36} color="var(--border-cyan)" />
        </div>

        <div style={{
          fontFamily: 'var(--font-title)',
          fontSize: 24,
          fontWeight: 900,
          color: 'var(--border-cyan)',
          letterSpacing: 2,
          textShadow: '0 0 15px rgba(0, 217, 255, 0.8)',
          marginBottom: 8
        }}>
          LEVEL UP !
        </div>

        <div style={{ fontSize: 14, color: '#fff', marginBottom: 16 }}>
          Félicitations, Joueur. Tu viens de franchir un nouveau palier de puissance.
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid var(--border-cyan-dim)',
          borderRadius: 8,
          padding: '12px',
          marginBottom: 24
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>
            NOUVEAU NIVEAU
          </div>
          <div style={{ fontFamily: 'var(--font-title)', fontSize: 36, fontWeight: 900, color: '#fff' }}>
            NIVEAU {level}
          </div>
          <div style={{ marginTop: 4 }}>
            <span className={`rank-badge rank-${rank}`}>
              RANG {rank}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="btn-monarch"
          style={{ width: '100%', padding: '12px', fontSize: 13 }}
        >
          REPRENDRE LE COMBAT ⚔️
        </button>
      </div>
    </div>
  );
}
