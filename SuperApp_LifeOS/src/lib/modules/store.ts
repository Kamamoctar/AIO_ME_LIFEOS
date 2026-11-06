"use client";

import { create } from "zustand";
import { initialPlayer } from "@/data/monarch-seed";
import type {
  AppSettings,
  CureDay,
  MainPrayerName,
} from "@/modules/spiritual/types";

const STORAGE_KEY = "lifeos_unified_modules_v1";

export interface ModuleDailyEntry {
  date: string;
  priority: string;
  energy: number;
  blocks: boolean[];
  morningRituals: boolean[];
  eveningRituals: boolean[];
  journalHead: string;
  journalHeart: string;
  mindDump: string;
  evolutionDone: string[];
  questDone: string[];
  prayersDone: MainPrayerName[];
}

export interface MkIdea {
  id: string;
  title: string;
  excitement: string;
  createdAt: string;
  unlockDate: string;
  status: "LOCKED" | "AVAILABLE" | "LAUNCHED" | "KEPT";
}

export interface MkProject {
  id: string;
  name: string;
  progress: number;
  nextStep: string;
  state: "ACTIVE" | "COMPLETED" | "ABANDONED";
  createdAt: string;
}

export interface SpiritualIntention {
  id: string;
  zikrId: string;
  text: string;
  createdAt: string;
  status: "en-cours" | "confiee" | "temoignage";
}

export interface UnifiedModulesState {
  version: 1;
  daily: Record<string, ModuleDailyEntry>;
  evolution: {
    activeActionCodes: string[];
    xp: number;
    xpByDomain: Record<string, number>;
  };
  mk: {
    ideas: MkIdea[];
    projects: MkProject[];
    saturnCommitments: string[];
  };
  destiny: {
    birthDate: string;
    customRules: string[];
  };
  monarch: {
    codename: string;
    xpTotal: number;
    xpSpent: number;
    streakQuests: number;
    streakNoFap: number;
    recordNoFap: number;
    statXp: Record<string, number>;
    panicWins: number;
  };
  spiritual: {
    settings: AppSettings;
    lifetimeCounts: Record<string, number>;
    dailyCounts: Record<string, Record<string, number>>;
    intentions: SpiritualIntention[];
    cureDays: CureDay[];
  };
}

const DEFAULT_SPIRITUAL_SETTINGS: AppSettings = {
  id: "main",
  coordinates: {
    latitude: 6.1319,
    longitude: 1.2228,
    label: "Lomé",
    source: "default",
  },
  prayerMethod: "MWL",
  offsets: { fajr: 0, maghrib: 0, isha: 0 },
  breakPolicy: "dissocier-jour-manque",
  notificationLevel: "local",
  notificationsEnabled: false,
  soundEnabled: true,
  hapticsEnabled: true,
  tickVolume: 0.35,
  metronomeEnabled: false,
  briefingTime: "05:45",
  prayerSelections: {},
  appearance: "day",
  onboardingDone: true,
};

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDailyEntry(date = localDateKey()): ModuleDailyEntry {
  return {
    date,
    priority: "",
    energy: 5,
    blocks: [false, false, false, false],
    morningRituals: [false, false, false, false],
    eveningRituals: [false, false, false, false],
    journalHead: "",
    journalHeart: "",
    mindDump: "",
    evolutionDone: [],
    questDone: [],
    prayersDone: [],
  };
}

export function createDefaultModulesState(): UnifiedModulesState {
  return {
    version: 1,
    daily: {},
    evolution: { activeActionCodes: [], xp: 0, xpByDomain: {} },
    mk: { ideas: [], projects: [], saturnCommitments: Array(5).fill("") },
    destiny: { birthDate: "", customRules: [] },
    monarch: {
      codename: initialPlayer.codename,
      xpTotal: 0,
      xpSpent: 0,
      streakQuests: 0,
      streakNoFap: 0,
      recordNoFap: 0,
      statXp: {},
      panicWins: 0,
    },
    spiritual: {
      settings: DEFAULT_SPIRITUAL_SETTINGS,
      lifetimeCounts: {},
      dailyCounts: {},
      intentions: [],
      cureDays: [],
    },
  };
}

function mergeStoredState(value: Partial<UnifiedModulesState>): UnifiedModulesState {
  const base = createDefaultModulesState();
  return {
    ...base,
    ...value,
    daily: value.daily ?? base.daily,
    evolution: { ...base.evolution, ...value.evolution },
    mk: { ...base.mk, ...value.mk },
    destiny: { ...base.destiny, ...value.destiny },
    monarch: { ...base.monarch, ...value.monarch },
    spiritual: {
      ...base.spiritual,
      ...value.spiritual,
      settings: {
        ...base.spiritual.settings,
        ...value.spiritual?.settings,
        coordinates: {
          ...base.spiritual.settings.coordinates,
          ...value.spiritual?.settings?.coordinates,
        },
        offsets: {
          ...base.spiritual.settings.offsets,
          ...value.spiritual?.settings?.offsets,
        },
      },
    },
  };
}

function persist(data: UnifiedModulesState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function updateToday(
  data: UnifiedModulesState,
  update: (entry: ModuleDailyEntry) => ModuleDailyEntry
): UnifiedModulesState {
  const key = localDateKey();
  const current = data.daily[key] ?? createDailyEntry(key);
  return { ...data, daily: { ...data.daily, [key]: update(current) } };
}

type OperationResult = { ok: true } | { ok: false; message: string };

interface UnifiedModulesStore {
  data: UnifiedModulesState;
  hydrated: boolean;
  hydrate: () => void;
  replaceData: (data: UnifiedModulesState) => void;
  resetData: () => void;
  setPriority: (priority: string) => void;
  setEnergy: (energy: number) => void;
  toggleBlock: (index: number) => void;
  toggleRitual: (period: "morning" | "evening", index: number) => void;
  setJournal: (field: "journalHead" | "journalHeart" | "mindDump", value: string) => void;
  toggleEvolutionAction: (code: string) => OperationResult;
  toggleEvolutionComplete: (code: string, xp: number, domain: string) => void;
  addIdea: (title: string, excitement: string) => void;
  deleteIdea: (id: string) => void;
  launchIdea: (id: string) => OperationResult;
  addMkProject: (name: string) => OperationResult;
  updateMkProject: (id: string, patch: Partial<MkProject>) => void;
  setBirthDate: (birthDate: string) => void;
  toggleQuest: (id: string, xp: number, stat: string) => void;
  resistTemptation: () => void;
  declareRelapse: () => void;
  incrementZikr: (zikrId: string, amount?: number) => void;
  resetTodayZikr: (zikrId: string) => void;
  togglePrayer: (prayer: MainPrayerName) => void;
  addIntention: (zikrId: string, text: string) => void;
  updateSpiritualSettings: (patch: Partial<AppSettings>) => void;
}

export const useUnifiedModules = create<UnifiedModulesStore>((set, get) => {
  const commit = (update: (data: UnifiedModulesState) => UnifiedModulesState) => {
    const next = update(get().data);
    persist(next);
    set({ data: next });
  };

  return {
    data: createDefaultModulesState(),
    hydrated: false,
    hydrate: () => {
      if (typeof window === "undefined" || get().hydrated) return;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const data = raw
          ? mergeStoredState(JSON.parse(raw) as Partial<UnifiedModulesState>)
          : createDefaultModulesState();
        set({ data, hydrated: true });
      } catch {
        set({ data: createDefaultModulesState(), hydrated: true });
      }
    },
    replaceData: (data) => {
      const merged = mergeStoredState(data);
      persist(merged);
      set({ data: merged, hydrated: true });
    },
    resetData: () => {
      const data = createDefaultModulesState();
      persist(data);
      set({ data, hydrated: true });
    },
    setPriority: (priority) => commit((data) => updateToday(data, (entry) => ({ ...entry, priority }))),
    setEnergy: (energy) =>
      commit((data) => updateToday(data, (entry) => ({ ...entry, energy: Math.max(1, Math.min(10, energy)) }))),
    toggleBlock: (index) =>
      commit((data) => updateToday(data, (entry) => ({
        ...entry,
        blocks: entry.blocks.map((value, position) => (position === index ? !value : value)),
      }))),
    toggleRitual: (period, index) =>
      commit((data) => updateToday(data, (entry) => {
        const field = period === "morning" ? "morningRituals" : "eveningRituals";
        return {
          ...entry,
          [field]: entry[field].map((value, position) => (position === index ? !value : value)),
        };
      })),
    setJournal: (field, value) =>
      commit((data) => updateToday(data, (entry) => ({ ...entry, [field]: value }))),
    toggleEvolutionAction: (code) => {
      const active = get().data.evolution.activeActionCodes;
      if (!active.includes(code) && active.length >= 3) {
        return { ok: false, message: "Le trio de focus est déjà complet." };
      }
      commit((data) => ({
        ...data,
        evolution: {
          ...data.evolution,
          activeActionCodes: active.includes(code)
            ? active.filter((item) => item !== code)
            : [...active, code],
        },
      }));
      return { ok: true };
    },
    toggleEvolutionComplete: (code, xp, domain) =>
      commit((data) => {
        const today = data.daily[localDateKey()] ?? createDailyEntry();
        const completed = today.evolutionDone.includes(code);
        const delta = completed ? -xp : xp;
        const next = updateToday(data, (entry) => ({
          ...entry,
          evolutionDone: completed
            ? entry.evolutionDone.filter((item) => item !== code)
            : [...entry.evolutionDone, code],
        }));
        return {
          ...next,
          evolution: {
            ...next.evolution,
            xp: Math.max(0, next.evolution.xp + delta),
            xpByDomain: {
              ...next.evolution.xpByDomain,
              [domain]: Math.max(0, (next.evolution.xpByDomain[domain] ?? 0) + delta),
            },
          },
        };
      }),
    addIdea: (title, excitement) => commit((data) => {
      const now = new Date();
      const unlock = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const idea: MkIdea = {
        id: `idea_${Date.now()}`,
        title: title.trim(),
        excitement: excitement.trim(),
        createdAt: now.toISOString(),
        unlockDate: localDateKey(unlock),
        status: "LOCKED",
      };
      return { ...data, mk: { ...data.mk, ideas: [idea, ...data.mk.ideas] } };
    }),
    deleteIdea: (id) => commit((data) => ({
      ...data,
      mk: { ...data.mk, ideas: data.mk.ideas.filter((idea) => idea.id !== id) },
    })),
    launchIdea: (id) => {
      const data = get().data;
      const idea = data.mk.ideas.find((item) => item.id === id);
      if (!idea) return { ok: false, message: "Idée introuvable." };
      if (idea.unlockDate > localDateKey()) return { ok: false, message: `Idée verrouillée jusqu’au ${idea.unlockDate}.` };
      if (data.mk.projects.filter((project) => project.state === "ACTIVE").length >= 3) {
        return { ok: false, message: "Trois projets sont déjà actifs." };
      }
      commit((current) => ({
        ...current,
        mk: {
          ...current.mk,
          ideas: current.mk.ideas.map((item) => item.id === id ? { ...item, status: "LAUNCHED" } : item),
          projects: [{
            id: `project_${Date.now()}`,
            name: idea.title,
            progress: 0,
            nextStep: "",
            state: "ACTIVE",
            createdAt: new Date().toISOString(),
          }, ...current.mk.projects],
        },
      }));
      return { ok: true };
    },
    addMkProject: (name) => {
      if (get().data.mk.projects.filter((project) => project.state === "ACTIVE").length >= 3) {
        return { ok: false, message: "La limite protectrice de trois projets est atteinte." };
      }
      commit((data) => ({
        ...data,
        mk: {
          ...data.mk,
          projects: [{
            id: `project_${Date.now()}`,
            name: name.trim(),
            progress: 0,
            nextStep: "",
            state: "ACTIVE",
            createdAt: new Date().toISOString(),
          }, ...data.mk.projects],
        },
      }));
      return { ok: true };
    },
    updateMkProject: (id, patch) => commit((data) => ({
      ...data,
      mk: {
        ...data.mk,
        projects: data.mk.projects.map((project) => project.id === id ? { ...project, ...patch } : project),
      },
    })),
    setBirthDate: (birthDate) => commit((data) => ({ ...data, destiny: { ...data.destiny, birthDate } })),
    toggleQuest: (id, xp, stat) => commit((data) => {
      const today = data.daily[localDateKey()] ?? createDailyEntry();
      const completed = today.questDone.includes(id);
      const delta = completed ? -xp : xp;
      const next = updateToday(data, (entry) => ({
        ...entry,
        questDone: completed ? entry.questDone.filter((item) => item !== id) : [...entry.questDone, id],
      }));
      return {
        ...next,
        monarch: {
          ...next.monarch,
          xpTotal: Math.max(0, next.monarch.xpTotal + delta),
          statXp: { ...next.monarch.statXp, [stat]: Math.max(0, (next.monarch.statXp[stat] ?? 0) + delta) },
        },
      };
    }),
    resistTemptation: () => commit((data) => ({
      ...data,
      monarch: {
        ...data.monarch,
        xpTotal: data.monarch.xpTotal + 15,
        streakNoFap: data.monarch.streakNoFap + 1,
        recordNoFap: Math.max(data.monarch.recordNoFap, data.monarch.streakNoFap + 1),
        panicWins: data.monarch.panicWins + 1,
        statXp: { ...data.monarch.statXp, DSC: (data.monarch.statXp.DSC ?? 0) + 15 },
      },
    })),
    declareRelapse: () => commit((data) => ({
      ...data,
      monarch: { ...data.monarch, xpTotal: Math.max(0, data.monarch.xpTotal - 50), streakNoFap: 0 },
    })),
    incrementZikr: (zikrId, amount = 1) => commit((data) => {
      const key = localDateKey();
      const today = data.spiritual.dailyCounts[key] ?? {};
      return {
        ...data,
        spiritual: {
          ...data.spiritual,
          lifetimeCounts: {
            ...data.spiritual.lifetimeCounts,
            [zikrId]: (data.spiritual.lifetimeCounts[zikrId] ?? 0) + amount,
          },
          dailyCounts: {
            ...data.spiritual.dailyCounts,
            [key]: { ...today, [zikrId]: (today[zikrId] ?? 0) + amount },
          },
        },
      };
    }),
    resetTodayZikr: (zikrId) => commit((data) => {
      const key = localDateKey();
      const current = data.spiritual.dailyCounts[key] ?? {};
      const removed = current[zikrId] ?? 0;
      return {
        ...data,
        spiritual: {
          ...data.spiritual,
          lifetimeCounts: {
            ...data.spiritual.lifetimeCounts,
            [zikrId]: Math.max(0, (data.spiritual.lifetimeCounts[zikrId] ?? 0) - removed),
          },
          dailyCounts: { ...data.spiritual.dailyCounts, [key]: { ...current, [zikrId]: 0 } },
        },
      };
    }),
    togglePrayer: (prayer) => commit((data) => updateToday(data, (entry) => ({
      ...entry,
      prayersDone: entry.prayersDone.includes(prayer)
        ? entry.prayersDone.filter((item) => item !== prayer)
        : [...entry.prayersDone, prayer],
    }))),
    addIntention: (zikrId, text) => commit((data) => ({
      ...data,
      spiritual: {
        ...data.spiritual,
        intentions: [{
          id: `intention_${Date.now()}`,
          zikrId,
          text: text.trim(),
          createdAt: new Date().toISOString(),
          status: "en-cours",
        }, ...data.spiritual.intentions],
      },
    })),
    updateSpiritualSettings: (patch) => commit((data) => ({
      ...data,
      spiritual: { ...data.spiritual, settings: { ...data.spiritual.settings, ...patch } },
    })),
  };
});

export function getTodayEntry(data: UnifiedModulesState): ModuleDailyEntry {
  return data.daily[localDateKey()] ?? createDailyEntry();
}

export function downloadModulesBackup(data: UnifiedModulesState) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `lifeos-modules-${localDateKey()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
