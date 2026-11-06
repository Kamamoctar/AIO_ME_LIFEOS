import {
  initialPlayer,
  initialStats,
  initialDailyQuests,
  initialWeeklyQuests,
  initialMonthlyBoss,
  initialBusinessProjects,
  initialWorkouts,
  initialHandstandLevels,
  initialBooks,
  initialTitles,
  initialRewards,
  initialDailyEntry,
  initialActiveProjects,
  initialIdeasVault,
  initialSaturnContract,
  initialFocusTrio,
  initialSpacedRecurrences,
  initialFinances,
  initialSpiritual,
  initialUserSettings,
  initialHealthMetrics,
  initialSkills,
  initialCalendarEvents,
  initialActions,
  initialLifeGoals
} from './seedData.js';

const STORAGE_KEY = 'aio_lifeos_data_v1';

export function xpRequiredForLevel(level) {
  if (level <= 10) return 50 * level;
  if (level <= 25) return 500 + (100 * (level - 10));
  if (level <= 50) return 2000 + (120 * (level - 25));
  if (level <= 75) return 5000 + (200 * (level - 50));
  if (level <= 90) return 10000 + (666 * (level - 75));
  return 20000 + (1000 * (level - 90));
}

export function calculateLevelAndRank(xpTotal) {
  let level = 1;
  while (level < 100 && xpTotal >= xpRequiredForLevel(level + 1)) {
    level++;
  }

  let rank = 'E';
  if (level >= 91) rank = 'S';
  else if (level >= 76) rank = 'A';
  else if (level >= 51) rank = 'B';
  else if (level >= 26) rank = 'C';
  else if (level >= 11) rank = 'D';
  else rank = 'E';

  const xpCurrentLevelFloor = level === 1 ? 0 : xpRequiredForLevel(level);
  const xpNextLevelTarget = xpRequiredForLevel(level + 1);

  return { level, rank, xpCurrentLevelFloor, xpNextLevelTarget };
}

export function loadStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultData();
    const data = JSON.parse(raw);
    const defaults = createDefaultData();

    // Migration / deep-merge safeguard for newly added LifeOS modules
    if (!data.finances || !data.finances.settings) {
      data.finances = {
        ...defaults.finances,
        ...(data.finances || {}),
        settings: { ...(defaults.finances.settings || {}), ...((data.finances && data.finances.settings) || {}) },
        couple: (data.finances && data.finances.couple) ? data.finances.couple : defaults.finances.couple,
        clarification3m: (data.finances && data.finances.clarification3m) ? data.finances.clarification3m : defaults.finances.clarification3m
      };
    }

    if (!data.userSettings) {
      data.userSettings = { ...defaults.userSettings };
    }

    if (!data.healthMetrics) data.healthMetrics = [];
    if (!data.skills) data.skills = [];
    if (!data.calendarEvents) data.calendarEvents = [];
    if (!data.actions) data.actions = [];
    if (!data.lifeGoals) data.lifeGoals = [];

    return checkDailyReset(data);
  } catch (err) {
    console.error('Failed to load storage, initializing defaults', err);
    return createDefaultData();
  }
}

export function saveStoredData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

export function createDefaultData() {
  const data = {
    player: { ...initialPlayer },
    stats: JSON.parse(JSON.stringify(initialStats)),
    dailyQuests: JSON.parse(JSON.stringify(initialDailyQuests)),
    weeklyQuests: JSON.parse(JSON.stringify(initialWeeklyQuests)),
    monthlyBoss: JSON.parse(JSON.stringify(initialMonthlyBoss)),
    businessProjects: JSON.parse(JSON.stringify(initialBusinessProjects)),
    workouts: JSON.parse(JSON.stringify(initialWorkouts)),
    handstandLevels: JSON.parse(JSON.stringify(initialHandstandLevels)),
    books: JSON.parse(JSON.stringify(initialBooks)),
    titles: JSON.parse(JSON.stringify(initialTitles)),
    rewards: JSON.parse(JSON.stringify(initialRewards)),
    dailyEntry: JSON.parse(JSON.stringify(initialDailyEntry)),
    activeProjects: JSON.parse(JSON.stringify(initialActiveProjects)),
    ideasVault: JSON.parse(JSON.stringify(initialIdeasVault)),
    saturnContract: JSON.parse(JSON.stringify(initialSaturnContract)),
    focusTrio: JSON.parse(JSON.stringify(initialFocusTrio)),
    spacedRecurrences: JSON.parse(JSON.stringify(initialSpacedRecurrences)),
    finances: JSON.parse(JSON.stringify(initialFinances)),
    spiritual: JSON.parse(JSON.stringify(initialSpiritual)),
    userSettings: JSON.parse(JSON.stringify(initialUserSettings)),
    healthMetrics: JSON.parse(JSON.stringify(initialHealthMetrics)),
    skills: JSON.parse(JSON.stringify(initialSkills)),
    calendarEvents: JSON.parse(JSON.stringify(initialCalendarEvents)),
    actions: JSON.parse(JSON.stringify(initialActions)),
    lifeGoals: JSON.parse(JSON.stringify(initialLifeGoals)),
    reviews: {
      weekly: [],
      monthly: []
    },
    thirtyDayChallenge: new Array(30).fill(false),
    history: []
  };
  saveStoredData(data);
  return data;
}

function checkDailyReset(data) {
  const today = new Date().toISOString().split('T')[0];
  if (!data.player.lastActiveDate) {
    data.player.lastActiveDate = today;
    return data;
  }

  if (data.player.lastActiveDate !== today) {
    // Check quests completion yesterday
    const completedCount = (data.dailyQuests || []).filter(q => q.completed).length;
    const totalCount = (data.dailyQuests || []).length;
    const is100Percent = completedCount === totalCount && totalCount > 0;

    if (is100Percent) {
      data.player.streakQuests = (data.player.streakQuests || 0) + 1;
    } else {
      data.player.streakQuests = 0;
    }

    // Reset daily quests
    data.dailyQuests = (data.dailyQuests || []).map(q => ({
      ...q,
      completed: false,
      subtasks: q.subtasks ? q.subtasks.map(st => ({ ...st, completed: false })) : []
    }));

    // Reset daily prayers
    if (data.spiritual && data.spiritual.prayersDone) {
      data.spiritual.prayersDone = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
    }

    // Reset daily entry rituals
    if (data.dailyEntry) {
      data.dailyEntry.priorityDone = false;
      if (data.dailyEntry.morningRitual) {
        data.dailyEntry.morningRitual = data.dailyEntry.morningRitual.map(r => ({ ...r, done: false }));
      }
      if (data.dailyEntry.eveningRitual) {
        data.dailyEntry.eveningRitual = data.dailyEntry.eveningRitual.map(r => ({ ...r, done: false }));
      }
    }

    data.player.lastActiveDate = today;
    saveStoredData(data);
  }
  return data;
}

