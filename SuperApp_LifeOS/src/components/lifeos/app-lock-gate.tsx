"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Fingerprint, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAppLockSettings,
  LIFEOS_LOCK_NOW_EVENT,
  LIFEOS_SECURITY_EVENT,
  verifyLifeOSIdentity,
} from "@/lib/native/app-lock";

function shouldStartLocked(): boolean {
  return typeof window !== "undefined" && Capacitor.isNativePlatform() && getAppLockSettings().enabled;
}

export function AppLockGate() {
  const [locked, setLocked] = useState(shouldStartLocked);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let hiddenAt = 0;
    const refresh = () => {
      const settings = getAppLockSettings();
      if (!settings.enabled || !Capacitor.isNativePlatform()) setLocked(false);
    };
    const lockNow = () => setLocked(true);
    const visibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      const settings = getAppLockSettings();
      if (!settings.enabled || !Capacitor.isNativePlatform()) return;
      const elapsedMinutes = (Date.now() - hiddenAt) / 60_000;
      if (hiddenAt > 0 && elapsedMinutes >= settings.timeoutMinutes) setLocked(true);
    };
    window.addEventListener(LIFEOS_SECURITY_EVENT, refresh);
    window.addEventListener(LIFEOS_LOCK_NOW_EVENT, lockNow);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener(LIFEOS_SECURITY_EVENT, refresh);
      window.removeEventListener(LIFEOS_LOCK_NOW_EVENT, lockNow);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  if (!locked) return null;

  const unlock = async () => {
    setChecking(true);
    setMessage("");
    try {
      await verifyLifeOSIdentity();
      setLocked(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Déverrouillage annulé.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-5 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <LockKeyhole className="size-10" />
        </div>
        <div><h1 className="text-2xl font-bold">LifeOS est verrouillé</h1><p className="mt-2 text-sm text-muted-foreground">Tes données restent sur cet appareil. Confirme ton identité pour continuer.</p></div>
        {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
        <Button size="lg" className="w-full" disabled={checking} onClick={unlock}>
          <Fingerprint className="mr-2 size-5" /> {checking ? "Vérification…" : "Déverrouiller"}
        </Button>
      </div>
    </div>
  );
}
