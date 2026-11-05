import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle, RefreshCw, Activity, Volume2 } from 'lucide-react';
import { sound } from '../core/sound.js';
import confetti from 'canvas-confetti';

export default function PanicModal({ isOpen, onClose, onResisted, currentStreak }) {
  const [step, setStep] = useState(1);
  const [breathPhase, setBreathPhase] = useState('Inspire'); // 'Inspire' (4s), 'Bloque' (4s), 'Expire' (4s)
  const [pushupCount, setPushupCount] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setPushupCount(0);
      return;
    }
    sound.playAlarm();
  }, [isOpen]);

  // Breathing timer cycle (4s inspire, 4s bloque, 4s expire)
  useEffect(() => {
    if (!isOpen || step !== 1) return;

    const phases = ['Inspire (4s)', 'Bloque (4s)', 'Expire (4s)'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % phases.length;
      setBreathPhase(phases[idx]);
      sound.playClick();
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handlePushupTap = () => {
    sound.playTasbih();
    if (pushupCount < 20) {
      const next = pushupCount + 1;
      setPushupCount(next);
      if (next === 20) {
        sound.playQuestComplete();
      }
    }
  };

  const handleSuccess = () => {
    sound.playLevelUp();
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00D9FF', '#FF2E4C', '#FFD700', '#00FF88']
    });
    onResisted();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(5, 7, 15, 0.96)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="system-window corner-cut" style={{
        maxWidth: 440,
        width: '100%',
        borderColor: 'var(--alert-red)',
        boxShadow: 'var(--glow-red)',
        padding: '20px',
        maxHeight: '92vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--alert-red)' }}>
            <ShieldAlert size={24} />
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 13, fontWeight: 900, letterSpacing: 1 }}>
              PROTOCOLE D’URGENCE : PURETÉ
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: s <= step ? 'var(--alert-red)' : 'rgba(255,255,255,0.1)',
                boxShadow: s <= step ? '0 0 8px var(--alert-red)' : 'none'
              }}
            />
          ))}
        </div>

        {/* STEP 1: BREATHING */}
        {step === 1 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 16, color: '#fff', marginBottom: 6 }}>
              ÉTAPE 1 : RESPIRATION GUIDÉE
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
              Arrête tout. Romps le signal de dopamine impulsive. Respire profondément.
            </p>

            <div style={{
              width: 140,
              height: 140,
              margin: '0 auto 24px',
              borderRadius: '50%',
              border: '2px solid var(--alert-red)',
              boxShadow: '0 0 30px rgba(255, 46, 76, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              background: 'radial-gradient(circle, rgba(255,46,76,0.15) 0%, transparent 70%)',
              transition: 'all 0.5s ease'
            }}>
              <Activity size={32} color="var(--alert-red)" style={{ marginBottom: 4 }} />
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {breathPhase}
              </div>
            </div>

            <button
              onClick={() => { sound.playClick(); setStep(2); }}
              className="btn-monarch btn-danger"
              style={{ width: '100%', padding: '12px' }}
            >
              PASSER À L’ÉTAPE 2 (POMPES) →
            </button>
          </div>
        )}

        {/* STEP 2: 20 PUSHUPS */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 16, color: '#fff', marginBottom: 6 }}>
              ÉTAPE 2 : FAIS 20 POMPES MAINTENANT
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Redirige le flux sanguin vers les muscles. Touche l'écran à chaque répétition.
            </p>

            <div
              onClick={handlePushupTap}
              style={{
                width: 140,
                height: 140,
                margin: '0 auto 20px',
                borderRadius: '50%',
                border: '3px solid var(--border-cyan)',
                boxShadow: 'var(--glow-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                cursor: 'pointer',
                background: 'rgba(0, 217, 255, 0.1)',
                userSelect: 'none'
              }}
            >
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 38, fontWeight: 900, color: '#fff' }}>
                {pushupCount}
              </div>
              <div style={{ fontSize: 11, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)' }}>
                SUR 20 (TOUCHE ICI)
              </div>
            </div>

            <button
              onClick={() => { sound.playClick(); setStep(3); }}
              disabled={pushupCount < 20}
              className="btn-monarch"
              style={{
                width: '100%',
                padding: '12px',
                opacity: pushupCount < 20 ? 0.4 : 1
              }}
            >
              {pushupCount < 20 ? `ENCORE ${20 - pushupCount} POMPES...` : 'ÉTAPE 3 (ISTIGHFAR) →'}
            </button>
          </div>
        )}

        {/* STEP 3: ISTIGHFAR */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 16, color: '#fff', marginBottom: 6 }}>
              ÉTAPE 3 : RÉCITE L’ISTIGHFAR
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              Purifie l'intention et sollicite la protection divine.
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--border-cyan-dim)',
              borderRadius: 10,
              padding: '16px',
              marginBottom: 20
            }}>
              <div style={{ fontSize: 28, color: 'var(--border-cyan)', fontWeight: 700, marginBottom: 8, direction: 'rtl' }}>
                أَسْتَغْفِرُ اللّٰهَ
              </div>
              <div style={{ fontSize: 14, color: '#fff', fontStyle: 'italic', marginBottom: 4 }}>
                « Astaghfirullah »
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                « Je demande pardon à Allah » (Répète 7 fois avec le cœur)
              </div>
            </div>

            <button
              onClick={() => { sound.playClick(); setStep(4); }}
              className="btn-monarch"
              style={{ width: '100%', padding: '12px' }}
            >
              ÉTAPE 4 (CHANGER DE LIEU) →
            </button>
          </div>
        )}

        {/* STEP 4: PHYSICAL BREAKOUT */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 16, color: '#fff', marginBottom: 6 }}>
              ÉTAPE 4 : QUITTE CETTE PIÈCE
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
              Lève-toi immédiatement. Sors de la chambre ou du bureau. Va boire un grand verre d'eau fraîche ou mouille ton visage.
            </p>

            <div style={{
              fontSize: 48,
              marginBottom: 24
            }}>
              🚶‍♂️💨💧
            </div>

            <button
              onClick={() => { sound.playClick(); setStep(5); }}
              className="btn-monarch"
              style={{ width: '100%', padding: '12px' }}
            >
              C’EST FAIT, ÉTAPE 5 →
            </button>
          </div>
        )}

        {/* STEP 5: VISION REMINDER */}
        {step === 5 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 16, color: '#fff', marginBottom: 6 }}>
              ÉTAPE 5 : TON IDENTITÉ DE MONARCH
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Ne sacrifie pas des années de grandeur pour 5 secondes d'illusion.
            </p>

            <div style={{
              background: 'rgba(123, 47, 255, 0.15)',
              border: '1px solid var(--monarch-purple)',
              borderRadius: 10,
              padding: '14px',
              textAlign: 'left',
              fontSize: 12,
              lineHeight: 1.6,
              color: '#fff',
              marginBottom: 20
            }}>
              <div>👑 <strong>Ton futur :</strong> 75kg de muscle sec, 733 333 FCFA/mois, 2-4 hectares, Coran mémorisé, 3 livres publiés.</div>
              <div style={{ marginTop: 6, color: 'var(--border-cyan)' }}>
                🔥 <strong>Streak actuel à préserver :</strong> Jour {currentStreak} de Pureté !
              </div>
            </div>

            <button
              onClick={() => { sound.playClick(); setStep(6); }}
              className="btn-monarch"
              style={{ width: '100%', padding: '12px' }}
            >
              VERDICT FINAL →
            </button>
          </div>
        )}

        {/* STEP 6: VERDICT */}
        {step === 6 && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: 18, color: 'var(--neon-green)', marginBottom: 8 }}>
              VICTOIRE SUR L’IMPULSION !
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Tu viens de prouver que ton esprit commande à ton corps. Le Système salue ta force.
            </p>

            <button
              onClick={handleSuccess}
              className="btn-monarch"
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, rgba(0,255,136,0.3), rgba(0,217,255,0.4))',
                borderColor: 'var(--neon-green)',
                color: '#fff',
                fontSize: 14,
                marginBottom: 10
              }}
            >
              ✅ J’AI RÉSISTÉ (+15 XP DISCIPLINE)
            </button>

            <button
              onClick={() => { setStep(1); setPushupCount(0); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 11,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <RefreshCw size={12} /> Encore une tentation ? Recommencer le protocole
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
