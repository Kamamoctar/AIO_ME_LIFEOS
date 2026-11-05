import React from 'react';
import { Calendar, Target, Wallet, Moon, Settings } from 'lucide-react';
import { sound } from '../core/sound.js';

export default function Navigation({ activeTab, setActiveTab, pendingQuestsCount, theme }) {
  const tabs = [
    { id: 'daily', label: 'Aujourd’hui', icon: Calendar, badge: pendingQuestsCount },
    { id: 'projects', label: 'Projets', icon: Target },
    { id: 'finances', label: 'Finances', icon: Wallet },
    { id: 'spiritual', label: 'Spiritualité', icon: Moon },
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
      maxWidth: 500,
      background: isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(11, 15, 25, 0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
      boxShadow: isLight ? '0 -2px 16px rgba(0, 0, 0, 0.05)' : '0 -4px 24px rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingTop: '6px',
      paddingLeft: '4px',
      paddingRight: '4px',
      /* Large thumb clearance guaranteeing tabs sit well above Android system keys */
      paddingBottom: 'calc(10px + max(env(safe-area-inset-bottom, 54px), 54px))',
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
              maxWidth: '20%',
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--border-cyan)' : 'var(--text-dim)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '6px 0',
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
                top: 2,
                right: '18%',
                background: 'var(--alert-red)',
                color: '#fff',
                borderRadius: '50%',
                width: 15,
                height: 15,
                fontSize: 8,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
              }}>
                {tab.badge}
              </span>
            )}
            
            <div style={{
              width: 32,
              height: 24,
              borderRadius: 12,
              background: isActive ? (isLight ? 'rgba(2, 132, 199, 0.1)' : 'rgba(56, 189, 248, 0.12)') : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}>
              <Icon 
                size={18} 
                color={isActive ? 'var(--border-cyan)' : 'var(--text-dim)'} 
              />
            </div>

            <span style={{
              fontSize: 9,
              fontFamily: 'var(--font-hud)',
              letterSpacing: 0.2,
              fontWeight: isActive ? 800 : 600,
              color: isActive ? 'var(--border-cyan)' : 'var(--text-dim)',
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
