export const LIFEOS_DASHBOARD_PREFERENCES_KEY = "lifeos_dashboard_preferences_v1";
export const LIFEOS_DASHBOARD_EVENT = "lifeos:dashboard-preferences";

export type DashboardBlock = "priority" | "evolution" | "rhythm" | "spiritual";
export type DashboardPreferences = Record<DashboardBlock, boolean>;

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  priority: true,
  evolution: true,
  rhythm: true,
  spiritual: true,
};

export function readDashboardPreferences(): DashboardPreferences {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_PREFERENCES;
  try {
    const value = JSON.parse(window.localStorage.getItem(LIFEOS_DASHBOARD_PREFERENCES_KEY) ?? "{}") as Partial<DashboardPreferences>;
    return { ...DEFAULT_DASHBOARD_PREFERENCES, ...value };
  } catch {
    return DEFAULT_DASHBOARD_PREFERENCES;
  }
}

export function writeDashboardPreferences(value: DashboardPreferences): void {
  window.localStorage.setItem(LIFEOS_DASHBOARD_PREFERENCES_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(LIFEOS_DASHBOARD_EVENT));
}
