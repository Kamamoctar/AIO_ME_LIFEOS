"use client";

// Life OS — Paramètres : réglages, catégories, export/import, clarification
import { useRef, useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import { SectionCard, Field, MoneyInput, SaveButton, EmptyState, ExplainDialog, ExplainLine } from "@/components/lifeos/ui-bits";
import { computeEmergencyFund } from "@/lib/lifeos/engine";
import { formatFCFA } from "@/lib/lifeos/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Download, Upload, Trash2, Plus, Tags, HelpCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CoupleSettings } from "@/components/lifeos/couple-settings";
import { useUnifiedModules } from "@/lib/modules/store";
import { createLifeOSBackup, LIFEOS_LAST_BACKUP_KEY, parseLifeOSBackup } from "@/lib/lifeos/backup";
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
import { LIFEOS_ONBOARDING_EVENT } from "@/components/lifeos/onboarding";
import { SecuritySettingsCard } from "@/components/lifeos/security-settings-card";
import { SecureTransferCard } from "@/components/lifeos/secure-transfer-card";
import { DataDeletionCard } from "@/components/lifeos/data-deletion-card";

const MAX_BACKUP_BYTES = 20 * 1024 * 1024;

const AUDIT_ENTITY_LABELS: Record<string, string> = {
  account: "compte",
  transaction: "operation",
  category: "categorie",
  charge: "charge",
  provisionCharge: "provision",
  envelope: "enveloppe",
  settings: "reglages financiers",
  incomeSource: "source de revenu",
  dependent: "personne a charge",
  fundAllocation: "reservation de fonds",
  closeMonth: "cloture mensuelle",
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  create: "a cree",
  update: "a modifie",
  delete: "a supprime ou libere",
  custom: "a execute",
};

export function SettingsView() {
  const { state, mutate } = useLifeOS();
  const { toast } = useToast();
  const moduleState = useUnifiedModules((store) => store.data);
  const replaceModuleState = useUnifiedModules((store) => store.replaceData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [efMonths, setEfMonths] = useState<number | null>(null);
  const [margin, setMargin] = useState<number | null>(null);
  const [defaultAccount, setDefaultAccount] = useState<string>("");
  const [incomeLabel, setIncomeLabel] = useState("");
  const [incomeKind, setIncomeKind] = useState("SALARY");
  const [incomeAmount, setIncomeAmount] = useState<number | null>(null);
  const [dependentName, setDependentName] = useState("");
  const [dependentRelationship, setDependentRelationship] = useState("");
  // catégorie
  const [catName, setCatName] = useState("");
  const [catKind, setCatKind] = useState("EXPENSE");
  const [catEssential, setCatEssential] = useState(false);
  // notes de clarification
  const [answer3m, setAnswer3m] = useState("");
  const [pendingImport, setPendingImport] = useState<{
    fileName: string;
    parsed: Awaited<ReturnType<typeof parseLifeOSBackup>>;
  } | null>(null);

  if (!state) return null;

  const settings = state.settings;
  const ef = computeEmergencyFund(state, new Date(state.today));

  const doExport = async () => {
    try {
      const res = await fetch("/api/export");
      const finance = await res.json();
      if (!res.ok) throw new Error("Export financier impossible");
      const backup = await createLifeOSBackup(finance, moduleState);
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lifeos-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      window.localStorage.setItem(LIFEOS_LAST_BACKUP_KEY, backup.exportedAt);
      toast({
        title: "Export téléchargé",
        description: "Sauvegarde JSON complète de tes données.",
      });
    } catch {
      toast({
        title: "Export impossible",
        description: "La sauvegarde n’a pas pu être créée.",
        variant: "destructive",
      });
    }
  };

  const prepareImport = async (file: File) => {
    if (file.size > MAX_BACKUP_BYTES) {
      toast({
        title: "Import refusé",
        description: "La sauvegarde dépasse la limite de 20 Mo.",
        variant: "destructive",
      });
      return;
    }
    const text = await file.text();
    let parsed: Awaited<ReturnType<typeof parseLifeOSBackup>>;
    try {
      parsed = await parseLifeOSBackup(text);
    } catch (error) {
      toast({
        title: "Import échoué",
        description: error instanceof Error ? error.message : "Le fichier JSON est invalide.",
        variant: "destructive",
      });
      return;
    }
    setPendingImport({ fileName: file.name, parsed });
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    const { parsed } = pendingImport;
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.finance),
    });
    const json = await res.json();
    if (res.ok) {
      if (parsed.modules) replaceModuleState(parsed.modules);
      setPendingImport(null);
      toast({ title: "Import réussi", description: "Tes données ont été restaurées." });
      await useLifeOS.getState().refresh();
    } else {
      toast({ title: "Import échoué", description: json.error, variant: "destructive" });
    }
  };

  const clarifNote = state.notes.find((n) => n.scope === "CLARIFICATION" && !n.resolved);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="size-5 text-primary" />
          Paramètres
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Salaire, fonds d&apos;urgence, mode, catégories, sauvegarde
        </p>
      </div>

      <CoupleSettings />

      <SecuritySettingsCard />

      {state.couple?.role === "ADMIN" && <SecureTransferCard />}

      <SectionCard
        title="Revenus mensuels du foyer"
        description="Sources attendues, distinctes des encaissements reels"
        icon={<Plus className="size-4" />}
      >
        <div className="space-y-2 mb-4">
          {state.incomeSources.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucune source configuree. Ajoute le salaire ou tout autre revenu regulier.
            </p>
          ) : (
            state.incomeSources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{source.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {source.kind === "SALARY"
                      ? "Salaire"
                      : source.kind === "BUSINESS"
                        ? "Activite"
                        : "Autre revenu"}{" "}
                    · {source.active ? "actif" : "inactif"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <b className="text-sm tabular-nums">{formatFCFA(source.monthlyAmount)}</b>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Supprimer la source de revenu"
                    onClick={() => mutate("incomeSource", "delete", source.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_150px_180px_auto] sm:items-end">
          <Field label="Libelle">
            <Input
              value={incomeLabel}
              onChange={(event) => setIncomeLabel(event.target.value)}
              placeholder="Ex : Salaire principal"
            />
          </Field>
          <Field label="Type">
            <Select value={incomeKind} onValueChange={setIncomeKind}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SALARY">Salaire</SelectItem>
                <SelectItem value="BUSINESS">Activite</SelectItem>
                <SelectItem value="OTHER">Autre</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Montant mensuel">
            <MoneyInput value={incomeAmount} onChange={setIncomeAmount} />
          </Field>
          <Button
            size="sm"
            disabled={!incomeLabel.trim() || !incomeAmount}
            onClick={async () => {
              const result = await mutate("incomeSource", "create", undefined, {
                label: incomeLabel,
                kind: incomeKind,
                monthlyAmount: incomeAmount,
              });
              if (!result) return;
              setIncomeLabel("");
              setIncomeAmount(null);
            }}
          >
            <Plus className="size-4 mr-1" /> Ajouter
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Personnes a charge"
        description="Membres du foyer sans acces a l'application mais pris en compte dans la transparence familiale"
        icon={<Plus className="size-4" />}
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {state.dependents.map((dependent) => (
            <Badge key={dependent.id} variant="outline" className="gap-1.5 py-1">
              {dependent.name}
              {dependent.relationship ? ` · ${dependent.relationship}` : ""}
              <button
                aria-label="Supprimer la personne a charge"
                onClick={() => mutate("dependent", "delete", dependent.id)}
              >
                <Trash2 className="size-3" />
              </button>
            </Badge>
          ))}
          {state.dependents.length === 0 && (
            <p className="text-xs text-muted-foreground">Aucune personne a charge renseignee.</p>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Nom">
            <Input value={dependentName} onChange={(e) => setDependentName(e.target.value)} />
          </Field>
          <Field label="Lien familial">
            <Input
              value={dependentRelationship}
              onChange={(e) => setDependentRelationship(e.target.value)}
              placeholder="Ex : Enfant, parent"
            />
          </Field>
          <Button
            size="sm"
            disabled={!dependentName.trim()}
            onClick={async () => {
              const result = await mutate("dependent", "create", undefined, {
                name: dependentName,
                relationship: dependentRelationship || null,
              });
              if (!result) return;
              setDependentName("");
              setDependentRelationship("");
            }}
          >
            <Plus className="size-4 mr-1" /> Ajouter
          </Button>
        </div>
      </SectionCard>

      <SectionCard
        title="Journal du foyer"
        description="Les 100 derniers changements financiers reussis, avec leur auteur"
        icon={<CheckCircle2 className="size-4" />}
      >
        {state.auditEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Le journal se remplira lors de la prochaine modification financiere.
          </p>
        ) : (
          <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {state.auditEvents.map((event) => {
              let detail = "";
              try {
                const summary = event.summary
                  ? (JSON.parse(event.summary) as Record<string, unknown>)
                  : {};
                if (typeof summary.amount === "number") {
                  detail = ` · ${formatFCFA(summary.amount)}`;
                } else if (typeof summary.label === "string") {
                  detail = ` · ${summary.label}`;
                } else if (typeof summary.name === "string") {
                  detail = ` · ${summary.name}`;
                }
              } catch {
                detail = "";
              }
              return (
                <div
                  key={event.id}
                  className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <p className="text-xs">
                    <b>{event.actorName}</b>{" "}
                    {AUDIT_ACTION_LABELS[event.action] ?? event.action}{" "}
                    {AUDIT_ENTITY_LABELS[event.entity] ?? event.entity}
                    {detail}
                  </p>
                  <time className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Réglages financiers */}
      <SectionCard title="Réglages financiers" description="Toutes les valeurs sont modifiables" icon={<Settings className="size-4" />}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Fonds d'urgence (mois de dépenses essentielles)">
            <Select
              value={String(efMonths ?? settings.emergencyFundMonths)}
              onValueChange={(v) => setEfMonths(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mois</SelectItem>
                <SelectItem value="3">3 mois</SelectItem>
                <SelectItem value="6">6 mois</SelectItem>
                <SelectItem value="9">9 mois</SelectItem>
                <SelectItem value="12">12 mois</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Marge de sécurité mensuelle (non mobilisable)">
            <MoneyInput value={margin ?? settings.safetyMargin} onChange={setMargin} />
          </Field>
          <Field label="Compte par défaut (saisie rapide)">
            <Select value={defaultAccount || settings.defaultAccountId || ""} onValueChange={setDefaultAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Premier compte" />
              </SelectTrigger>
              <SelectContent>
                {state.accounts.filter((a) => !a.archived).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-3">
          <SaveButton
            onSave={async () => {
              await mutate("settings", "update", undefined, {
                emergencyFundMonths: efMonths ?? settings.emergencyFundMonths,
                safetyMargin: margin ?? settings.safetyMargin,
                defaultAccountId: defaultAccount || settings.defaultAccountId,
              });
              toast({ title: "Réglages enregistrés" });
            }}
          />
        </div>
        <div className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          Fonds d&apos;urgence cible : <b className="text-foreground">{formatFCFA(ef.target)}</b> = dépenses essentielles ({formatFCFA(ef.essentialMonthly)}) × {settings.emergencyFundMonths} mois · disponible : {formatFCFA(ef.available)}
        </div>
      </SectionCard>

      {/* Mode simple / analyse */}
      <SectionCard
        title="Mode d'utilisation"
        description="Simple : quotidien (argent, budget, priorités). Analyse : patrimoine, projections, simulations."
        icon={<Settings className="size-4" />}
      >
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-[13px] font-medium">Mode Analyse</p>
            <p className="text-[11px] text-muted-foreground">
              Actuellement : {settings.mode === "analyse" ? "Analyse" : "Simple"}
            </p>
          </div>
          <Switch
            checked={settings.mode === "analyse"}
            onCheckedChange={(checked) =>
              mutate("settings", "update", undefined, { mode: checked ? "analyse" : "simple" })
            }
          />
        </div>
      </SectionCard>

      {/* Catégories */}
      <SectionCard
        title="Catégories"
        description="Personnalisables — budget mensuel et caractère essentiel"
        icon={<Tags className="size-4" />}
      >
        <div className="grid sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end mb-4">
          <Field label="Nouvelle catégorie">
            <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Ex : Éducation" />
          </Field>
          <Field label="Type">
            <Select value={catKind} onValueChange={setCatKind}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE">Dépense</SelectItem>
                <SelectItem value="INCOME">Revenu</SelectItem>
                <SelectItem value="DONATION">Don</SelectItem>
                <SelectItem value="INVESTMENT">Investissement</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center gap-2 pb-2">
            <Switch checked={catEssential} onCheckedChange={setCatEssential} id="cat-essential" />
            <label htmlFor="cat-essential" className="text-xs text-muted-foreground">Essentielle</label>
          </div>
          <Button
            size="sm"
            className="mb-0.5"
            onClick={async () => {
              if (!catName.trim()) return;
              await mutate("category", "create", undefined, {
                name: catName,
                kind: catKind,
                essential: catEssential,
              });
              setCatName("");
              setCatEssential(false);
            }}
          >
            <Plus className="size-4 mr-1" /> Ajouter
          </Button>
        </div>
        <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {state.categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[13px] font-medium truncate">{c.name}</span>
                <Badge variant="outline" className="text-[9px] shrink-0">
                  {c.kind === "INCOME" ? "revenu" : c.kind === "DONATION" ? "don" : c.kind === "INVESTMENT" ? "invest." : "dépense"}
                </Badge>
                {c.essential && <Badge className="text-[9px] px-1.5 shrink-0 bg-primary">essentielle</Badge>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.budgetMonthly !== null && (
                  <span className="text-[11px] text-muted-foreground tabular-nums">{formatFCFA(c.budgetMonthly)}/mois</span>
                )}
                <button
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Supprimer ${c.name}`}
                  onClick={() => mutate("category", "delete", c.id)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* Clarification des 3,33 M */}
      {clarifNote && (
        <SectionCard
          title="Point à clarifier"
          description="Question structurante pour tes règles financières"
          icon={<HelpCircle className="size-4" />}
        >
          <p className="text-[13px] font-medium">{clarifNote.title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{clarifNote.content}</p>
          <div className="mt-3 space-y-2">
            <Select value={answer3m} onValueChange={setAnswer3m}>
              <SelectTrigger>
                <SelectValue placeholder="Que représentent les 3 330 000 FCFA de 2028 ?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REVENU_ANNUEL">Un revenu annuel</SelectItem>
                <SelectItem value="EPARGNE">Une épargne</SelectItem>
                <SelectItem value="PATRIMOINE">Un patrimoine</SelectItem>
                <SelectItem value="CAPITAL_INVESTI">Un capital investi</SelectItem>
                <SelectItem value="AUTRE">Autre chose</SelectItem>
              </SelectContent>
            </Select>
            {answer3m && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await mutate("note", "update", clarifNote.id, {
                    content: `${clarifNote.content}\n\n→ Réponse : ${answer3m}`,
                    resolved: true,
                  });
                  await mutate("note", "create", undefined, {
                    scope: "GENERAL",
                    title: "3 330 000 FCFA en 2028 = " + answer3m.replaceAll("_", " ").toLowerCase(),
                    content: "Clarification enregistrée. Le système peut maintenant utiliser cette valeur dans les projections (à configurer dans la Vision 2028).",
                  });
                  setAnswer3m("");
                  toast({ title: "Clarification enregistrée" });
                }}
              >
                <CheckCircle2 className="size-4 mr-1" /> Enregistrer cette clarification
              </Button>
            )}
          </div>
        </SectionCard>
      )}

      {/* Sauvegarde */}
      {state.couple?.role === "ADMIN" && <SectionCard
        title="Sauvegarde & restauration"
        description="Finances, évolution, MK, Astre, Royaume et Misbaha dans un seul fichier"
        icon={<Download className="size-4" />}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={doExport}>
            <Download className="size-4 mr-1.5" /> Exporter mes données
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4 mr-1.5" /> Importer une sauvegarde
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void prepareImport(f);
              e.target.value = "";
            }}
          />
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Les nouveaux exports sont protégés par une empreinte SHA-256. Les anciennes sauvegardes FinanceOS restent acceptées.
        </p>
      </SectionCard>}

      {state.couple?.role === "ADMIN" && <DataDeletionCard />}

      {/* À propos */}
      <SectionCard title="À propos de Life OS" icon={<HelpCircle className="size-4" />}>
        <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <li>• Devise : FCFA (XOF), montants entiers.</li>
          <li>• Les transactions sont la source de vérité : aucun total n&apos;est saisi manuellement s&apos;il peut être calculé.</li>
          <li>• Un transfert ne crée ni revenu ni dépense (seuls les frais comptent).</li>
          <li>• Un investissement déplace du cash vers un actif : le patrimoine reste intact.</li>
          <li>• Provisions, prévisions, projections et simulations ne touchent jamais les soldes réels.</li>
          <li>• Le portefeuille BRVM réel n&apos;est jamais mélangé aux simulations.</li>
          <li>• Chaque KPI important propose « Voir le calcul ».</li>
          <li>• Les six systèmes partagent désormais une vue Aujourd&apos;hui et une sauvegarde commune.</li>
        </ul>
        <Button className="mt-4" variant="outline" onClick={() => window.dispatchEvent(new Event(LIFEOS_ONBOARDING_EVENT))}>
          <HelpCircle className="mr-1.5 size-4" /> Revoir la visite guidée
        </Button>
      </SectionCard>

      <AlertDialog open={pendingImport !== null} onOpenChange={(open) => { if (!open) setPendingImport(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remplacer les données actuelles ?</AlertDialogTitle>
            <AlertDialogDescription>
              La sauvegarde « {pendingImport?.fileName} » a été validée. Son import remplacera les données LifeOS présentes sur cet appareil. Cette action ne peut être annulée qu’avec une autre sauvegarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmImport()}>Restaurer la sauvegarde</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
