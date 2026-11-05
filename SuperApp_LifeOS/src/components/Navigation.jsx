import React from 'react';
import { Shield, Calendar, Target, Moon, Wallet, Settings } from 'lucide-react';
import { sound } from '../core/sound.js';

export default function Navigation({ activeTab, setActiveTab, pendingQuestsCount }) {
  const tabs = [
    { id: 'dashboard', label: 'Statut', icon: Shield },
    { id: 'daily', label: 'Quotidien', icon: Calendar, badge: pendingQuestsCount },
    { id: 'projects', label: 'Projets', icon: Target },
    { id: 'spiritual', label: 'Spirituel', icon: Moon },
    { id: 'finances', label: 'Finances', icon: Wallet },
    { id: 'system', label: 'Système', icon: Settings },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      background: 'rgba(7, 10, 18, 0.96)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border-cyan-dim)',
      boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(0, 217, 255, 0.15)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 2px 10px',
      zIndex: 100
    }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              sound.playClick();
              setActiveTab(tab.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--border-cyan)' : 'var(--text-dim)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              letterSpacing: 0.5,
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              position: 'relative',
              padding: '4px 6px',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.badge > 0 && (
              <span style={{
                position: 'absolute',
                top: 0,
                right: 8,
                background: 'var(--alert-red)',
                color: '#fff',
                borderRadius: '50%',
                width: 15,
                height: 15,
                fontSize: 9,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--glow-red)'
              }}>
                {tab.badge}
              </span>
            )}
            <Icon size={20} color={isActive ? 'var(--border-cyan)' : 'var(--text-dim)'} style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(0,217,255,0.6))' : 'none' }} />
            <span>{tab.label.toUpperCase()}</span>
          </button>
        );
      })}
    </nav>
  );
}
