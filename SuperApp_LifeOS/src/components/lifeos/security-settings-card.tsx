"use client";

import { useEffect, useState } from "react";
import { Fingerprint, LockKeyhole } from "lucide-react";
import { SectionCard } from "@/components/lifeos/ui-bits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  checkBiometricAvailability,
  getAppLockSettings,
  requestImmediateLock,
  saveAppLockSettings,
  verifyLifeOSIdentity,
  type AppLockSettings,
} from "@/lib/native/app-lock";

export function SecuritySettingsCard() {
  const [settings, setSettings] = useState<AppLockSettings>(getAppLockSettings);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    void checkBiometricAvailability().then(setAvailable);
  }, []);

  const update = (next: AppLockSettings) => {
    setSettings(next);
    saveAppLockSettings(next);
  };

  const toggle = async (enabled: boolean) => {
    if (!enabled) {
      update({ ...settings, enabled: false });
      return;
    }
    try {
      await verifyLifeOSIdentity();
      update({ ...settings, enabled: true });
      toast({ title: "Verrou activé", description: "LifeOS demandera ta biométrie après une absence." });
    } catch (error) {
      toast({ title: "Activation impossible", description: error instanceof Error ? error.message : "Vérification annulée.", variant: "destructive" });
    }
  };

  const testBiometrics = async () => {
    setTesting(true);
    try {
      await verifyLifeOSIdentity();
      toast({ title: "Biométrie vérifiée", description: "Le déverrouillage fonctionne sur cet appareil." });
    } catch (error) {
      toast({
        title: "Test biométrique échoué",
        description: error instanceof Error ? error.message : "Vérification annulée.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <SectionCard title="Sécurité locale" description="Verrouillage de confort par la biométrie Android" icon={<Fingerprint className="size-4" />}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div><p className="text-sm font-medium">Verrou biométrique</p><p className="text-[11px] text-muted-foreground">{available === false ? "Non disponible sur cet appareil ou dans le navigateur" : "Empreinte ou biométrie configurée sur le téléphone"}</p></div>
          <Switch checked={settings.enabled} disabled={available !== true && !settings.enabled} onCheckedChange={toggle} />
        </div>
        <Button variant="outline" size="sm" disabled={available !== true || testing} onClick={() => void testBiometrics()}>
          <Fingerprint className="mr-1.5 size-4" /> {testing ? "Vérification…" : "Tester l’empreinte"}
        </Button>
        {settings.enabled && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-medium">Verrouiller après</p><p className="text-[11px] text-muted-foreground">Une mise en arrière-plan de l’application</p></div>
            <Select value={String(settings.timeoutMinutes)} onValueChange={(value) => update({ ...settings, timeoutMinutes: Number(value) })}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="0">Immédiatement</SelectItem><SelectItem value="1">1 minute</SelectItem><SelectItem value="2">2 minutes</SelectItem><SelectItem value="5">5 minutes</SelectItem><SelectItem value="15">15 minutes</SelectItem></SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={requestImmediateLock}><LockKeyhole className="mr-1.5 size-4" /> Verrouiller</Button>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">Ce verrou protège l’accès courant sur un appareil normal ; il ne remplace pas le verrou système et ne constitue pas une barrière absolue sur un appareil rooté.</p>
      </div>
    </SectionCard>
  );
}
