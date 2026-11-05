import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Navigation from './components/Navigation.jsx';
import DashboardView from './components/DashboardView.jsx';
import DailyView from './components/DailyView.jsx';
import ProjectsView from './components/ProjectsView.jsx';
import SpiritualView from './components/SpiritualView.jsx';
import FinancesView from './components/FinancesView.jsx';
import SystemView from './components/SystemView.jsx';
import PanicModal from './components/PanicModal.jsx';
import LevelUpOverlay from './components/LevelUpOverlay.jsx';
import StatDetailModal from './components/StatDetailModal.jsx';

import {
  loadStoredData,
  saveStoredData,
  calculateLevelAndRank
} from './data/storage.js';
import { sound } from './core/sound.js';
import './core/theme.css';

export default function App() {
  const [data, setData] = useState(() => loadStoredData());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPanicOpen, setIsPanicOpen] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [selectedStatCode, setSelectedStatCode] = useState(null);

  // Auto-save whenever data changes
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  // Global Add XP
  const addExperience = (amount, statCode = null) => {
    setData(prev => {
      const nextXpTotal = Math.max(0, prev.player.xpTotal + amount);
      const calc = calculateLevelAndRank(nextXpTotal);

      if (calc.level > prev.player.level) {
        sound.playLevelUp();
        setLevelUpInfo({ level: calc.level, rank: calc.rank });
      }

      const nextStats = { ...prev.stats };
      if (statCode && nextStats[statCode]) {
        nextStats[statCode] = {
          ...nextStats[statCode],
          xp: Math.max(0, nextStats[statCode].xp + amount)
        };
      }

      return {
        ...prev,
        player: {
          ...prev.player,
          xpTotal: nextXpTotal,
          level: calc.level,
          rank: calc.rank
        },
        stats: nextStats
      };
    });
  };

  // Quests Toggles
  const handleToggleDailyQuest = (questId) => {
    setData(prev => {
      const target = prev.dailyQuests.find(q => q.id === questId);
      if (!target) return prev;
      const isNowCompleted = !target.completed;
      if (isNowCompleted) sound.playQuestComplete();
      else sound.playClick();

      const xpDelta = isNowCompleted ? target.xp : -target.xp;
      const nextXpTotal = Math.max(0, prev.player.xpTotal + xpDelta);
      const calc = calculateLevelAndRank(nextXpTotal);

      if (isNowCompleted && calc.level > prev.player.level) {
        sound.playLevelUp();
        setLevelUpInfo({ level: calc.level, rank: calc.rank });
      }

      const nextQuests = prev.dailyQuests.map(q => {
        if (q.id === questId) {
          return {
            ...q,
            completed: isNowCompleted,
            subtasks: q.subtasks ? q.subtasks.map(st => ({ ...st, completed: isNowCompleted })) : []
          };
        }
        return q;
      });

      return {
        ...prev,
        player: { ...prev.player, xpTotal: nextXpTotal, level: calc.level, rank: calc.rank },
        dailyQuests: nextQuests
      };
    });
  };

  const handleToggleSubtask = (questId, subtaskId) => {
    sound.playClick();
    setData(prev => ({
      ...prev,
      dailyQuests: prev.dailyQuests.map(q => {
        if (q.id === questId && q.subtasks) {
          return {
            ...q,
            subtasks: q.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
          };
        }
        return q;
      })
    }));
  };

  // Daily Entry (MK)
  const handleUpdateDailyEntry = (updatedEntry) => {
    setData(prev => ({ ...prev, dailyEntry: updatedEntry }));
  };

  // Focus Trio (Évolution)
  const handleValidateHabit = (idx, status) => {
    setData(prev => {
      const nextTrio = [...(prev.focusTrio || [])];
      if (nextTrio[idx]) {
        nextTrio[idx] = { ...nextTrio[idx], status };
        if (status === 'DONE') {
          sound.playQuestComplete();
          addExperience(nextTrio[idx].xp || 1, 'DSC');
        } else {
          sound.playClick();
        }
      }
      return { ...prev, focusTrio: nextTrio };
    });
  };

  // Projects (MK)
  const handleSaveProject = (updatedProject) => {
    setData(prev => ({
      ...prev,
      activeProjects: prev.activeProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    }));
  };

  const handleAddProject = (newProject) => {
    setData(prev => ({
      ...prev,
      activeProjects: [...prev.activeProjects, newProject]
    }));
  };

  const handleDeleteProject = (projectId) => {
    setData(prev => ({
      ...prev,
      activeProjects: prev.activeProjects.filter(p => p.id !== projectId)
    }));
  };

  // Business Dungeons
  const handleToggleBusinessStep = (dungeonId, stepId) => {
    setData(prev => ({
      ...prev,
      businessProjects: prev.businessProjects.map(b => {
        if (b.id === dungeonId) {
          return {
            ...b,
            steps: b.steps.map(s => {
              if (s.id === stepId) {
                const nextDone = !s.completed;
                if (nextDone) {
                  sound.playQuestComplete();
                  addExperience(10, 'WLT');
                }
                return { ...s, completed: nextDone };
              }
              return s;
            })
          };
        }
        return b;
      })
    }));
  };

  // Ideas Vault (MK)
  const handleAddIdea = (idea) => {
    setData(prev => ({
      ...prev,
      ideasVault: [idea, ...(prev.ideasVault || [])]
    }));
  };

  const handleDeleteIdea = (ideaId) => {
    sound.playClick();
    setData(prev => ({
      ...prev,
      ideasVault: prev.ideasVault.filter(i => i.id !== ideaId)
    }));
  };

  // Spaced Recurrences (Évolution)
  const handleCompleteRecurrence = (recId) => {
    setData(prev => ({
      ...prev,
      spacedRecurrences: (prev.spacedRecurrences || []).map(r => {
        if (r.id === recId) {
          const nextDate = new Date();
          nextDate.setMonth(nextDate.getMonth() + (r.intervalMonths || 2));
          return {
            ...r,
            lastDone: new Date().toISOString().split('T')[0],
            nextDue: nextDate.toISOString().split('T')[0]
          };
        }
        return r;
      })
    }));
  };

  // Spiritual & Finances
  const handleUpdateSpiritual = (updatedSpiritual) => {
    setData(prev => ({ ...prev, spiritual: updatedSpiritual }));
  };

  const handleUpdateFinances = (updatedFinances) => {
    setData(prev => ({ ...prev, finances: updatedFinances }));
  };

  // 30 Day Challenge
  const handleToggleThirtyDay = (dayIndex) => {
    sound.playClick();
    setData(prev => {
      const nextArr = [...(prev.thirtyDayChallenge || new Array(30).fill(false))];
      nextArr[dayIndex] = !nextArr[dayIndex];
      if (nextArr[dayIndex]) addExperience(5, 'DSC');
      return { ...prev, thirtyDayChallenge: nextArr };
    });
  };

  // Workouts
  const handleToggleWorkoutSet = (day, exoIdx, setIdx) => {
    sound.playClick();
    setData(prev => {
      const curWorkouts = { ...prev.workouts };
      const currentDone = curWorkouts[day].exercises[exoIdx].done[setIdx];
      curWorkouts[day].exercises[exoIdx].done[setIdx] = !currentDone;
      if (!currentDone) addExperience(2, 'STR');
      return { ...prev, workouts: curWorkouts };
    });
  };

  const handleToggleHandstandLevel = (levelNum) => {
    sound.playQuestComplete();
    setData(prev => ({
      ...prev,
      handstandLevels: prev.handstandLevels.map(h => h.level === levelNum ? { ...h, completed: !h.completed } : h)
    }));
    addExperience(25, 'STR');
  };

  // Claim Reward
  const handleClaimReward = (rewardId) => {
    const reward = data.rewards.find(r => r.id === rewardId);
    if (!reward) return;
    if (data.player.xpTotal < reward.cost) {
      sound.playAlarm();
      alert(`XP insuffisant ! Tu as besoin de ${reward.cost} XP (actuel : ${data.player.xpTotal} XP).`);
      return;
    }
    sound.playLevelUp();
    setData(prev => ({
      ...prev,
      player: {
        ...prev.player,
        xpTotal: prev.player.xpTotal - reward.cost,
        xpSpent: (prev.player.xpSpent || 0) + reward.cost
      }
    }));
    alert(`🎉 Récompense « ${reward.title} » accordée ! Savoure ton repos mérité.`);
  };

  // Pureté SOS Resisted
  const handleResistedUrge = () => {
    sound.playLevelUp();
    setData(prev => ({
      ...prev,
      player: {
        ...prev.player,
        streakNoFap: prev.player.streakNoFap + 1,
        recordNoFap: Math.max(prev.player.recordNoFap, prev.player.streakNoFap + 1),
        xpTotal: prev.player.xpTotal + 15
      }
    }));
  };

  // Backup Import
  const handleImportBackup = (importedData) => {
    if (importedData && importedData.player) {
      setData(importedData);
      saveStoredData(importedData);
    }
  };

  const pendingQuestsCount = (data.dailyQuests || []).filter(q => !q.completed).length;

  return (
    <div className="app-container">
      {/* Universal Header */}
      <Header
        player={data.player}
        setPlayer={(updater) => setData(prev => ({ ...prev, player: typeof updater === 'function' ? updater(prev.player) : updater }))}
        onOpenPanic={() => setIsPanicOpen(true)}
      />

      {/* Main Screen Views */}
      <main style={{ flex: 1, minHeight: 'calc(100vh - 140px)' }}>
        {activeTab === 'dashboard' && (
          <DashboardView
            player={data.player}
            stats={data.stats}
            dailyQuests={data.dailyQuests}
            monthlyBoss={data.monthlyBoss}
            lastPenaltyNotice={data.lastPenaltyNotice}
            setActiveTab={setActiveTab}
            onSelectStat={(code) => setSelectedStatCode(code)}
            onOpenPanic={() => setIsPanicOpen(true)}
          />
        )}

        {activeTab === 'daily' && (
          <DailyView
            dailyQuests={data.dailyQuests}
            onToggleQuest={handleToggleDailyQuest}
            onToggleSubtask={handleToggleSubtask}
            dailyEntry={data.dailyEntry}
            onUpdateDailyEntry={handleUpdateDailyEntry}
            focusTrio={data.focusTrio}
            onValidateHabit={handleValidateHabit}
            onAddXp={addExperience}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            activeProjects={data.activeProjects}
            onSaveProject={handleSaveProject}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            businessProjects={data.businessProjects}
            onToggleBusinessStep={handleToggleBusinessStep}
            ideasVault={data.ideasVault}
            onAddIdea={handleAddIdea}
            onDeleteIdea={handleDeleteIdea}
            spacedRecurrences={data.spacedRecurrences}
            onCompleteRecurrence={handleCompleteRecurrence}
            focusTrio={data.focusTrio}
            onSetFocusTrio={(trio) => setData(prev => ({ ...prev, focusTrio: trio }))}
            onAddXp={addExperience}
          />
        )}

        {activeTab === 'spiritual' && (
          <SpiritualView
            spiritual={data.spiritual}
            onUpdateSpiritual={handleUpdateSpiritual}
            onAddXp={addExperience}
          />
        )}

        {activeTab === 'finances' && (
          <FinancesView
            finances={data.finances}
            onUpdateFinances={handleUpdateFinances}
            onAddXp={addExperience}
          />
        )}

        {activeTab === 'system' && (
          <SystemView
            player={data.player}
            setPlayer={(updater) => setData(prev => ({ ...prev, player: typeof updater === 'function' ? updater(prev.player) : updater }))}
            titles={data.titles}
            rewards={data.rewards}
            books={data.books}
            workouts={data.workouts}
            handstandLevels={data.handstandLevels}
            saturnContract={data.saturnContract}
            thirtyDayChallenge={data.thirtyDayChallenge}
            onToggleThirtyDay={handleToggleThirtyDay}
            onToggleWorkoutSet={handleToggleWorkoutSet}
            onToggleHandstandLevel={handleToggleHandstandLevel}
            onClaimReward={handleClaimReward}
            allData={data}
            onImportBackup={handleImportBackup}
            onAddXp={addExperience}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingQuestsCount={pendingQuestsCount}
      />

      {/* Emergency Pureté SOS Modal */}
      <PanicModal
        isOpen={isPanicOpen}
        onClose={() => setIsPanicOpen(false)}
        onResisted={handleResistedUrge}
        currentStreak={data.player.streakNoFap}
      />

      {/* Level Up Banner Overlay */}
      {levelUpInfo && (
        <LevelUpOverlay
          level={levelUpInfo.level}
          rank={levelUpInfo.rank}
          onClose={() => setLevelUpInfo(null)}
        />
      )}

      {/* Stat Detail Modal */}
      {selectedStatCode && (
        <StatDetailModal
          stat={data.stats[selectedStatCode]}
          onClose={() => setSelectedStatCode(null)}
        />
      )}
    </div>
  );
}

