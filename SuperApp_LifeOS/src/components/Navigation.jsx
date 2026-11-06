import React from 'react';
import { Gauge, Wallet, Target, Moon, Activity, Plus } from 'lucide-react';
import { sound } from '../core/sound.js';

export default function Navigation({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  pendingQuestsCount,
  theme
}) {
  const tabs = [
    { id: 'today', label: 'Cockpit', icon: Gauge, badge: pendingQuestsCount },
    { id: 'finances', label: 'Finances', icon: Wallet },
    // Center Prism is rendered in between
    { id: 'projects', label: 'Projets', icon: Target },
    { id: 'spiritual', label: 'Astre', icon: Moon },
    { id: 'system', label: 'Vitalité', icon: Activity },
  ];

  return (
    <nav className="monarch-prism-dock" aria-label="Navigation principale">
      {/* Tab 1: Cockpit */}
      <button
        onClick={() => { sound.playClick(); setActiveTab(tabs[0].id); }}
        className={`dock-item-btn ${activeTab === tabs[0].id ? 'active' : ''}`}
      >
        <div className="dock-icon-wrapper" style={{ position: 'relative' }}>
          <Gauge size={20} />
          {pendingQuestsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -3,
              right: -5,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--accent-red)',
              boxShadow: '0 0 6px var(--accent-red)'
            }} />
          )}
        </div>
        <span className="dock-label">{tabs[0].label}</span>
      </button>

      {/* Tab 2: Finances */}
      <button
        onClick={() => { sound.playClick(); setActiveTab(tabs[1].id); }}
        className={`dock-item-btn ${activeTab === tabs[1].id ? 'active' : ''}`}
      >
        <div className="dock-icon-wrapper">
          <Wallet size={20} />
        </div>
        <span className="dock-label">{tabs[1].label}</span>
      </button>

      {/* CENTER: Floating Prism Quick-Add Button */}
      <button
        onClick={() => { sound.playLevelUp(); onOpenQuickAdd(); }}
        className="prism-center-btn"
        title="Ajout rapide instantané (Dépense, Virement, Idée, Santé...)"
        aria-label="Ajout rapide"
      >
        <Plus size={24} strokeWidth={2.8} />
      </button>

      {/* Tab 3: Projets */}
      <button
        onClick={() => { sound.playClick(); setActiveTab(tabs[2].id); }}
        className={`dock-item-btn ${activeTab === tabs[2].id ? 'active' : ''}`}
      >
        <div className="dock-icon-wrapper">
          <Target size={20} />
        </div>
        <span className="dock-label">{tabs[2].label}</span>
      </button>

      {/* Tab 4: Astre & Spiritualité */}
      <button
        onClick={() => { sound.playClick(); setActiveTab(tabs[3].id); }}
        className={`dock-item-btn ${activeTab === tabs[3].id ? 'active' : ''}`}
      >
        <div className="dock-icon-wrapper">
          <Moon size={20} />
        </div>
        <span className="dock-label">{tabs[3].label}</span>
      </button>

      {/* Tab 5: Vitalité & Système */}
      <button
        onClick={() => { sound.playClick(); setActiveTab(tabs[4].id); }}
        className={`dock-item-btn ${activeTab === tabs[4].id ? 'active' : ''}`}
      >
        <div className="dock-icon-wrapper">
          <Activity size={20} />
        </div>
        <span className="dock-label">{tabs[4].label}</span>
      </button>
    </nav>
  );
}
