"use client";

import { useSyncExternalStore } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  LIFEOS_DASHBOARD_EVENT,
  LIFEOS_DASHBOARD_PREFERENCES_KEY,
  DEFAULT_DASHBOARD_PREFERENCES,
  readDashboardPreferences,
  writeDashboardPreferences,
  type DashboardBlock,
  type DashboardPreferences,
} from "@/lib/lifeos/dashboard-preferences";

const LABELS: Array<{ id: DashboardBlock; label: string }> = [
  { id: "priority", label: "Priorité unique" },
  { id: "evolution", label: "Focus Évolution" },
  { id: "rhythm", label: "Quêtes et rituels" },
  { id: "spiritual", label: "Présence spirituelle" },
];

export function useDashboardPreferences(): DashboardPreferences {
  const snapshot = useSyncExternalStore(
    (callback) => {
      window.addEventListener(LIFEOS_DASHBOARD_EVENT, callback);
      return () => window.removeEventListener(LIFEOS_DASHBOARD_EVENT, callback);
    },
    () => window.localStorage.getItem(LIFEOS_DASHBOARD_PREFERENCES_KEY) ?? "{}",
    () => "{}"
  );
  try {
    return { ...DEFAULT_DASHBOARD_PREFERENCES, ...(JSON.parse(snapshot) as Partial<DashboardPreferences>) };
  } catch {
    return readDashboardPreferences();
  }
}

export function DashboardCustomizer() {
  const preferences = useDashboardPreferences();
  const toggle = (id: DashboardBlock, checked: boolean) => {
    writeDashboardPreferences({ ...preferences, [id]: checked });
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><SlidersHorizontal className="mr-1.5 size-3.5" /> Personnaliser</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Personnaliser Ma journée</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {LABELS.map((item) => (
            <label key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              {item.label}
              <Switch checked={preferences[item.id]} onCheckedChange={(checked) => toggle(item.id, checked)} />
            </label>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
