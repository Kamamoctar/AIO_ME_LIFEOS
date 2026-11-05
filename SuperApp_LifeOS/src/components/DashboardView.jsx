import React, { useState } from 'react';
import { Flame, Zap, Award, Target, ArrowRight, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { quotes } from '../data/seedData.js';
import { sound } from '../core/sound.js';

export default function DashboardView({
  player,
  stats,
  dailyQuests,
  monthlyBoss,
  lastPenaltyNotice,
  setActiveTab,
  onSelectStat,
  onOpenPanic
}) {
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * quotes.length));

  const completedQuests = dailyQuests.filter(q => q.completed).length;
  const totalQuests = dailyQuests.length;
  const dailyPercent = Math.round((completedQuests / totalQuests) * 100);

  const bossCompletedTargets = monthlyBoss.targets.filter(t => t.current >= t.max).length;
  const bossTotalTargets = monthlyBoss.targets.length;
  const bossPercent = Math.round((bossCompletedTargets / bossTotalTargets) * 100);

  const rotateQuote = () => {
    sound.playClick();
    setQuoteIndex(prev => (prev + 1) % quotes.length);
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-float">
      
      {/* Penalty Warning Banner if missed quests yesterday */}
      {lastPenaltyNotice && (
        <div className="system-window" style={{ borderColor: 'var(--alert-red)', background: 'rgba(255, 46, 76, 0.15)', padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--alert-red)', fontWeight: 700 }}>
            <AlertTriangle size={18} />
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 11 }}>ALERTE DU SYSTÈME : PÉNALITÉ APPLIQUÉE</span>
          </div>
          <div style={{ fontSize: 12, marginTop: 4, color: '#ffb3ba' }}>
            {lastPenaltyNotice.missed} quêtes manquées hier. Pénalité de -{lastPenaltyNotice.penalty} XP enregistrée. Le Système exige l'action !
          </div>
        </div>
      )}

      {/* Main Status Window */}
      <div className="system-window corner-cut" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span className="system-window-title">FICHE DE STATUT DU JOUEUR</span>
          </div>
          <span className={`rank-badge rank-${player.rank}`}>RANG {player.rank}</span>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{
            flex: 1,
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border-cyan-dim)',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 46, 76, 0.2)',
              border: '1px solid var(--alert-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Flame size={20} color="var(--alert-red)" />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>STREAK PURETÉ</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-title)', color: '#fff' }}>
                JOUR {player.streakNoFap}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>Record: {player.recordNoFap}j</div>
            </div>
          </div>

          <div style={{
            flex: 1,
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border-cyan-dim)',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(0, 217, 255, 0.2)',
              border: '1px solid var(--border-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={20} color="var(--border-cyan)" />
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>STREAK QUÊTES</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'var(--font-title)', color: '#fff' }}>
                {player.streakQuests} JOURS
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>100% quotidien</div>
            </div>
          </div>
        </div>

        {/* Daily Quests Quick Overview */}
        <div style={{
          background: 'rgba(0, 217, 255, 0.05)',
          border: '1px solid var(--border-cyan-dim)',
          borderRadius: 8,
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-hud)', color: 'var(--border-cyan)' }}>
              QUÊTES DU JOUR ({completedQuests}/{totalQuests})
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
              {dailyPercent === 100 ? '✨ Journée Parfaite Réussie !' : `${totalQuests - completedQuests} quêtes restantes`}
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('quests');
            }}
            className="btn-monarch"
            style={{ padding: '6px 12px', fontSize: 11 }}
          >
            OUVRIR <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 7 Stats Grid */}
      <div className="system-window" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="system-window-title">ATTRIBUTS & STATS (0 - 100)</span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>+1 pt / 50 XP</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {Object.entries(stats).map(([code, s]) => {
            const currentVal = Math.min(100, s.base + Math.floor(s.xp / 50));
            const xpInStat = s.xp % 50;
            const progress = (xpInStat / 50) * 100;

            return (
              <div
                key={code}
                onClick={() => onSelectStat(code)}
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--border-cyan-dim)',
                  borderRadius: 8,
                  padding: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
                    <span>{s.emoji}</span>
                    <span style={{ fontFamily: 'var(--font-title)', color: 'var(--border-cyan)', fontSize: 11 }}>{code}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-title)', fontSize: 14, fontWeight: 900, color: '#fff' }}>
                    {currentVal}
                  </span>
                </div>

                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.name}
                </div>

                <div className="hud-bar-container" style={{ height: 5 }}>
                  <div className="hud-bar-fill" style={{ width: `${currentVal}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donjon Mensuel Boss Widget */}
      <div 
        className="system-window" 
        style={{ padding: '14px', cursor: 'pointer', borderColor: 'var(--monarch-purple)', boxShadow: 'var(--glow-purple)' }}
        onClick={() => {
          sound.playClick();
          setActiveTab('quests');
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16 }}>🏰</span>
            <span style={{ fontFamily: 'var(--font-title)', fontSize: 11, fontWeight: 700, color: '#c77dff' }}>
              BOSS DU MOIS : {monthlyBoss.name}
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
            +{monthlyBoss.rewardXp} XP
          </span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          Progression du Donjon : {bossCompletedTargets} / {bossTotalTargets} objectifs vaincus ({bossPercent}%)
        </div>

        <div className="hud-bar-container" style={{ height: 8 }}>
          <div className="hud-bar-fill gold" style={{ width: `${bossPercent}%` }} />
        </div>
      </div>

      {/* Quote Widget */}
      <div className="system-window" style={{ padding: '12px 14px', background: 'rgba(10, 14, 26, 0.9)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-hud)', color: 'var(--text-dim)', letterSpacing: 1 }}>
            CITATION DU SYSTÈME
          </span>
          <button
            onClick={rotateQuote}
            style={{ background: 'none', border: 'none', color: 'var(--border-cyan)', cursor: 'pointer', display: 'flex' }}
            title="Changer de citation"
          >
            <RefreshCw size={13} />
          </button>
        </div>
        <p style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--text-main)', lineHeight: 1.4 }}>
          « {quotes[quoteIndex]} »
        </p>
      </div>

    </div>
  );
}
