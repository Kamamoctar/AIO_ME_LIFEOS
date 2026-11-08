"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  RefreshCcw,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  runLifeOSDiagnostics,
  type DiagnosticItem,
  type LifeOSDiagnosticReport,
} from "@/lib/lifeos/diagnostics";
import { useLifeOS } from "@/lib/lifeos/store";

const STATUS_LABEL = {
  ok: "Opérationnel",
  warning: "À vérifier",
  error: "Erreur",
  info: "Information",
} as const;

function StatusIcon({ status }: Pick<DiagnosticItem, "status">) {
  if (status === "ok") return <CheckCircle2 className="size-5 text-emerald-500" />;
  if (status === "warning") return <AlertTriangle className="size-5 text-amber-500" />;
  if (status === "error") return <XCircle className="size-5 text-destructive" />;
  return <Info className="size-5 text-sky-500" />;
}

export function DiagnosticsView() {
  const setView = useLifeOS((store) => store.setView);
  const [report, setReport] = useState<LifeOSDiagnosticReport | null>(null);
  const [running, setRunning] = useState(true);

  const run = useCallback(async () => {
    setRunning(true);
    try {
      setReport(await runLifeOSDiagnostics());
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void runLifeOSDiagnostics()
      .then((result) => {
        if (active) setReport(result);
      })
      .finally(() => {
        if (active) setRunning(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lifeos-diagnostic-${report.generatedAt.slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const healthy = report?.items.filter((item) => item.status === "ok").length ?? 0;
  const attention = report?.items.filter((item) => item.status === "warning" || item.status === "error").length ?? 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Diagnostic</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold"><Stethoscope className="size-6" /> Santé de LifeOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Contrôle local du stockage, des sauvegardes, du mode hors ligne et des rappels.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadReport} disabled={!report}><Download className="mr-1.5 size-4" /> Rapport</Button>
          <Button onClick={() => void run()} disabled={running}><RefreshCcw className={`mr-1.5 size-4 ${running ? "animate-spin" : ""}`} /> Relancer</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><ShieldCheck className="size-5 text-emerald-500" /><p className="mt-2 text-2xl font-black">{healthy}</p><p className="text-xs text-muted-foreground">contrôles opérationnels</p></CardContent></Card>
        <Card><CardContent className="pt-5"><AlertTriangle className="size-5 text-amber-500" /><p className="mt-2 text-2xl font-black">{attention}</p><p className="text-xs text-muted-foreground">points à vérifier</p></CardContent></Card>
        <Card className="col-span-2 sm:col-span-1"><CardContent className="pt-5"><Info className="size-5 text-primary" /><p className="mt-2 text-2xl font-black">v{report?.appVersion ?? "…"}</p><p className="text-xs text-muted-foreground">{report?.platform ?? "analyse en cours"}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Résultats</CardTitle></CardHeader>
        <CardContent className="space-y-2" aria-live="polite" aria-busy={running}>
          {!report ? <p className="py-8 text-center text-sm text-muted-foreground">Analyse locale en cours…</p> : report.items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border p-3">
              <StatusIcon status={item.status} />
              <div className="min-w-0 flex-1"><p className="font-medium">{item.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p></div>
              <Badge variant="outline" className="shrink-0 text-[9px]">{STATUS_LABEL[item.status]}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold">Protège tes données</p><p className="mt-1 text-xs text-muted-foreground">Crée une sauvegarde après chaque changement important.</p></div>
          <Button variant="outline" onClick={() => setView("settings")}>Ouvrir les sauvegardes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
