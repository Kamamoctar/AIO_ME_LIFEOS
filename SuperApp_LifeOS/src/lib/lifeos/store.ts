"use client";

// Life OS — Store global (état + navigation + mutations)
import { create } from "zustand";
import type { LifeOSState } from "./types";
import type { ViewId } from "./constants";
import { installFetchInterceptor, getLocalState } from "./local-backend";

if (typeof window !== "undefined") {
  installFetchInterceptor();
}

interface MutateResult {
  ok?: boolean;
  error?: string;
  [key: string]: unknown;
}

interface LifeOSStore {
  state: LifeOSState | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
  view: ViewId;
  quickAddOpen: boolean;
  setView: (v: ViewId) => void;
  setQuickAddOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  mutate: (
    entity: string,
    action: "create" | "update" | "delete" | "custom",
    id?: string,
    data?: Record<string, unknown>
  ) => Promise<MutateResult | null>;
}

export const useLifeOS = create<LifeOSStore>((set, get) => ({
  state: null,
  loading: false,
  loaded: false,
  error: null,
  view: "today",
  quickAddOpen: false,
  setView: (v) => set({ view: v, quickAddOpen: false }),
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error(`Chargement impossible (${res.status})`);
      const data = (await res.json()) as LifeOSState;
      set({ state: data, loading: false, loaded: true });
    } catch (e) {
      const fallbackState = getLocalState();
      set({
        state: fallbackState,
        loading: false,
        loaded: true,
        error: null,
      });
    }
  },
  mutate: async (entity, action, id, data) => {
    try {
      const res = await fetch("/api/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, action, id, data }),
      });
      const json = (await res.json()) as MutateResult;
      if (!res.ok) {
        const message =
          (json.error as string) ?? `Erreur lors de l'opération ${entity}`;
        set({ error: message });
        setTimeout(() => set({ error: null }), 5000);
        return null;
      }
      // Rafraîchissement léger après mutation
      await get().refresh();
      return json;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur réseau";
      set({ error: message });
      setTimeout(() => set({ error: null }), 5000);
      return null;
    }
  },
}));
