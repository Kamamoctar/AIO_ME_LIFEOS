"use client";

import { useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/lifeos/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LIFEOS_LAST_BACKUP_KEY } from "@/lib/lifeos/backup";
import { LIFEOS_DASHBOARD_PREFERENCES_KEY } from "@/lib/lifeos/dashboard-preferences";
import { LEGACY_FINANCE_STORAGE_KEY, LEGACY_MODULES_STORAGE_KEY } from "@/lib/lifeos/kernel-storage";
import { resetOfflineLifeOSState } from "@/lib/lifeos/local-backend";
import { useLifeOS } from "@/lib/lifeos/store";
import { useUnifiedModules } from "@/lib/modules/store";
import { DEFAULT_APP_LOCK_SETTINGS, saveAppLockSettings } from "@/lib/native/app-lock";

export function DataDeletionCard() {
  const [confirmation, setConfirmation] = useState("");
  const [open, setOpen] = useState(false);

  const erase = async () => {
    await import("@/lib/native/reminders")
      .then(({ disableLifeOSReminders }) => disableLifeOSReminders())
      .catch(() => undefined);
    window.localStorage.removeItem(LEGACY_FINANCE_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_MODULES_STORAGE_KEY);
    window.localStorage.removeItem(LIFEOS_LAST_BACKUP_KEY);
    window.localStorage.removeItem(LIFEOS_DASHBOARD_PREFERENCES_KEY);
    window.localStorage.removeItem("lifeos_reminder_schedule_v1");
    saveAppLockSettings(DEFAULT_APP_LOCK_SETTINGS);
    resetOfflineLifeOSState();
    useUnifiedModules.getState().resetData();
    setOpen(false);
    setConfirmation("");
    await useLifeOS.getState().refresh();
  };

  return (
    <SectionCard title="Effacement contrôlé" description="Suppression locale des données personnelles et remise à zéro" icon={<ShieldAlert className="size-4 text-destructive" />}>
      <div className="rounded-xl border border-destructive/40 p-3">
        <p className="text-sm font-medium">Supprimer les données LifeOS de cet appareil</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Crée d’abord une sauvegarde si nécessaire. Les réglages, journaux, finances, intentions et progressions seront réinitialisés.</p>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild><Button variant="destructive" size="sm" className="mt-3"><Trash2 className="mr-1.5 size-4" /> Préparer l’effacement</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Effacer toutes les données locales ?</AlertDialogTitle><AlertDialogDescription>Cette opération est irréversible sans sauvegarde. Écris SUPPRIMER pour confirmer.</AlertDialogDescription></AlertDialogHeader>
            <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="SUPPRIMER" aria-label="Confirmation d’effacement" />
            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction disabled={confirmation !== "SUPPRIMER"} onClick={() => void erase()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Effacer définitivement</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SectionCard>
  );
}
