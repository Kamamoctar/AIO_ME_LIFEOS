"use client";

import { useRef, useState } from "react";
import { FileKey2, Share2, Upload } from "lucide-react";
import { SectionCard } from "@/components/lifeos/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { createLifeOSBackup, LIFEOS_LAST_BACKUP_KEY, parseLifeOSBackup, type ParsedLifeOSBackup } from "@/lib/lifeos/backup";
import { decryptLifeOSBackup, encryptLifeOSBackup } from "@/lib/lifeos/encrypted-backup";
import { useLifeOS } from "@/lib/lifeos/store";
import { useUnifiedModules } from "@/lib/modules/store";

const MAX_ENCRYPTED_BACKUP_BYTES = 25 * 1024 * 1024;

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function SecureTransferCard() {
  const moduleState = useUnifiedModules((store) => store.data);
  const replaceModuleState = useUnifiedModules((store) => store.replaceData);
  const fileInput = useRef<HTMLInputElement>(null);
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [exportConfirmation, setExportConfirmation] = useState("");
  const [importPassphrase, setImportPassphrase] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pendingImport, setPendingImport] = useState<{ name: string; parsed: ParsedLifeOSBackup } | null>(null);
  const [working, setWorking] = useState(false);
  const { toast } = useToast();

  const exportEncrypted = async () => {
    if (exportPassphrase.length < 10 || exportPassphrase !== exportConfirmation) {
      toast({ title: "Phrase secrète invalide", description: "Utilise au moins 10 caractères et confirme exactement la même phrase.", variant: "destructive" });
      return;
    }
    setWorking(true);
    try {
      const response = await fetch("/api/export");
      const finance = await response.json();
      if (!response.ok) throw new Error("Export impossible");
      const backup = await createLifeOSBackup(finance, moduleState);
      const encrypted = await encryptLifeOSBackup(JSON.stringify(backup), exportPassphrase);
      const file = new File(
        [JSON.stringify(encrypted)],
        `lifeos-transfert-${new Date().toISOString().slice(0, 10)}.lifeos`,
        { type: "application/vnd.lifeos.encrypted+json" }
      );
      const shareData = { files: [file], title: "Transfert LifeOS chiffré" };
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        downloadFile(file);
      }
      window.localStorage.setItem(LIFEOS_LAST_BACKUP_KEY, backup.exportedAt);
      setExportPassphrase("");
      setExportConfirmation("");
      toast({ title: "Transfert chiffré créé", description: "Envoie le fichier séparément de sa phrase secrète." });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({ title: "Transfert impossible", description: error instanceof Error ? error.message : "Le fichier n’a pas pu être créé.", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  const prepareImport = async () => {
    if (!importFile || !importPassphrase) return;
    if (importFile.size > MAX_ENCRYPTED_BACKUP_BYTES) {
      toast({ title: "Fichier refusé", description: "Le transfert dépasse 25 Mo.", variant: "destructive" });
      return;
    }
    setWorking(true);
    try {
      const plaintext = await decryptLifeOSBackup(await importFile.text(), importPassphrase);
      const parsed = await parseLifeOSBackup(plaintext);
      setPendingImport({ name: importFile.name, parsed });
    } catch (error) {
      toast({ title: "Ouverture impossible", description: error instanceof Error ? error.message : "Fichier invalide.", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingImport.parsed.finance),
    });
    const result = await response.json();
    if (!response.ok) {
      toast({ title: "Restauration impossible", description: result.error ?? "Import refusé.", variant: "destructive" });
      return;
    }
    if (pendingImport.parsed.modules) replaceModuleState(pendingImport.parsed.modules);
    setPendingImport(null);
    setImportFile(null);
    setImportPassphrase("");
    toast({ title: "Transfert restauré", description: "Les données de cet appareil ont été remplacées." });
    await useLifeOS.getState().refresh();
  };

  return (
    <>
      <SectionCard title="Transfert inter-appareils chiffré" description="Synchronisation manuelle, privée et sans serveur" icon={<FileKey2 className="size-4" />}>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border p-3">
            <div><p className="text-sm font-semibold">Créer un transfert</p><p className="text-[11px] text-muted-foreground">AES-256-GCM ; le contenu n’est lisible qu’avec ta phrase secrète.</p></div>
            <div><Label htmlFor="transfer-export-pass">Phrase secrète</Label><Input id="transfer-export-pass" type="password" autoComplete="new-password" value={exportPassphrase} onChange={(event) => setExportPassphrase(event.target.value)} placeholder="10 caractères minimum" className="mt-1" /></div>
            <div><Label htmlFor="transfer-export-confirm">Confirmation</Label><Input id="transfer-export-confirm" type="password" autoComplete="new-password" value={exportConfirmation} onChange={(event) => setExportConfirmation(event.target.value)} className="mt-1" /></div>
            <Button className="w-full" disabled={working} onClick={exportEncrypted}><Share2 className="mr-1.5 size-4" /> Créer et partager</Button>
          </div>
          <div className="space-y-3 rounded-xl border p-3">
            <div><p className="text-sm font-semibold">Recevoir un transfert</p><p className="text-[11px] text-muted-foreground">La restauration demande une confirmation avant tout remplacement.</p></div>
            <input ref={fileInput} type="file" accept=".lifeos,application/json" className="hidden" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} />
            <Button variant="outline" className="w-full" onClick={() => fileInput.current?.click()}><Upload className="mr-1.5 size-4" /> {importFile?.name ?? "Choisir un fichier .lifeos"}</Button>
            <div><Label htmlFor="transfer-import-pass">Phrase secrète</Label><Input id="transfer-import-pass" type="password" autoComplete="current-password" value={importPassphrase} onChange={(event) => setImportPassphrase(event.target.value)} className="mt-1" /></div>
            <Button className="w-full" disabled={working || !importFile || !importPassphrase} onClick={prepareImport}>Déchiffrer et vérifier</Button>
          </div>
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">Vie privée : la phrase secrète n’est ni enregistrée ni envoyée. Partage-la par un canal différent du fichier. En mode couple, seules les données déjà visibles par le compte courant sont exportées.</p>
      </SectionCard>
      <AlertDialog open={pendingImport !== null} onOpenChange={(open) => { if (!open) setPendingImport(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remplacer les données de cet appareil ?</AlertDialogTitle><AlertDialogDescription>Le fichier « {pendingImport?.name} » est authentique et déchiffré. Son contenu remplacera les données LifeOS actuelles.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => void confirmImport()}>Restaurer ce transfert</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
