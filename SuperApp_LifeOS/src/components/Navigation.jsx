import React from 'react';
import { Shield, Calendar, Target, Moon, Wallet, Settings } from 'lucide-react';
import { sound } from '../core/sound.js';

export default function Navigation({ activeTab, setActiveTab, pendingQuestsCount, theme }) {
  const tabs = [
    { id: 'dashboard', label: 'Statut', icon: Shield },
    { id: 'daily', label: 'Jour', icon: Calendar, badge: pendingQuestsCount },
    { id: 'projects', label: 'Projets', icon: Target },
    { id: 'spiritual', label: 'Zikr', icon: Moon },
    { id: 'finances', label: 'Finance', icon: Wallet },
    { id: 'system', label: 'Système', icon: Settings },
  ];

  const isLight = theme === 'light';

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      margin: '0 auto',
      width: '100%',
      maxWidth: 480,
      background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(7, 10, 18, 0.98)',
      backdropFilter: 'blur(16px)',
      borderTop: `1px solid ${isLight ? 'rgba(2, 132, 199, 0.25)' : 'var(--border-cyan-dim)'}`,
      boxShadow: isLight ? '0 -4px 20px rgba(0, 0, 0, 0.08)' : '0 -4px 20px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(0, 217, 255, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingTop: '8px',
      paddingLeft: '2px',
      paddingRight: '2px',
      /* Large bottom clearance (56px minimum + 16px) guaranteeing tabs sit safely above Android system buttons / gesture bar */
      paddingBottom: 'calc(16px + max(env(safe-area-inset-bottom, 56px), 56px))',
      zIndex: 100,
      boxSizing: 'border-box',
      overflowX: 'hidden'
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
              flex: '1 1 0',
              minWidth: 0,
              maxWidth: '16.666%',
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--border-cyan)' : 'var(--text-dim)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '4px 0',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          >
            {tab.badge > 0 && (
              <span style={{
                position: 'absolute',
                top: 0,
                right: '15%',
                background: 'var(--alert-red)',
                color: '#fff',
                borderRadius: '50%',
                width: 14,
                height: 14,
                fontSize: 8,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--glow-red)'
              }}>
                {tab.badge}
              </span>
            )}
            <Icon 
              size={18} 
              color={isActive ? 'var(--border-cyan)' : 'var(--text-dim)'} 
              style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(0,217,255,0.6))' : 'none' }} 
            />
            <span style={{
              fontSize: 8.5,
              fontFamily: 'var(--font-hud)',
              letterSpacing: 0.1,
              fontWeight: isActive ? 800 : 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
              display: 'block',
              textAlign: 'center'
            }}>
              {tab.label.toUpperCase()}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
