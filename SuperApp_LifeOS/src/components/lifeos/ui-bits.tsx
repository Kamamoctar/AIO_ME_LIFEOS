"use client";

// Life OS — Composants UI partagés
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFCFA, formatPercent } from "@/lib/lifeos/format";
import { PRIORITY_LABELS, GOAL_STATUS_LABELS } from "@/lib/lifeos/constants";
import type { GoalStatus, Priority } from "@/lib/lifeos/types";

// ---------------------------------------------------------------------------
// KPI
// ---------------------------------------------------------------------------

export function Kpi({
  label,
  value,
  hint,
  icon,
  tone = "default",
  explain,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "positive" | "negative" | "warning" | "accent";
  explain?: ReactNode;
  onClick?: () => void;
}) {
  const toneClasses: Record<string, string> = {
    default: "text-foreground",
    positive: "text-emerald-600 dark:text-emerald-400",
    negative: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
    accent: "text-primary",
  };
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-shadow",
        onClick && "cursor-pointer hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground leading-tight">
            {label}
          </p>
          {icon && <div className="text-muted-foreground shrink-0">{icon}</div>}
        </div>
        <p className={cn("mt-1.5 text-xl font-bold tabular-nums tracking-tight", toneClasses[tone])}>
          {value}
        </p>
        {(hint || explain) && (
          <div className="mt-1 flex items-center gap-1.5">
            {hint && (
              <p className="text-[11px] text-muted-foreground leading-tight">{hint}</p>
            )}
            {explain && <ExplainDialog title={label}>{explain}</ExplainDialog>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Carte de section
// ---------------------------------------------------------------------------

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {icon && <span className="text-primary shrink-0">{icon}</span>}
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold leading-tight">
                {title}
              </CardTitle>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 pt-0">{children}</CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// « Voir le calcul » — explicabilité
// ---------------------------------------------------------------------------

export function ExplainDialog({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center gap-1 rounded-full text-[11px] font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded px-1"
          aria-label={`Voir le calcul de ${title}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Calculator className="size-3" />
          Voir le calcul
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Calculator className="size-4 text-primary" />
            Calcul — {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Chaque chiffre est dérivé de tes données réelles. Aucune boîte noire.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 text-sm">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function ExplainLine({
  label,
  value,
  kind,
}: {
  label: string;
  value: string;
  kind?: "in" | "out" | "total";
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 rounded-md px-2.5 py-1.5",
        kind === "total" && "bg-primary/10 font-semibold",
        kind === "in" && "text-emerald-700 dark:text-emerald-400",
        kind === "out" && "text-red-700 dark:text-red-400"
      )}
    >
      <span className="text-xs text-muted-foreground">
        {kind === "in" ? "+ " : kind === "out" ? "− " : ""}
        {label}
      </span>
      <span className="tabular-nums text-sm">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, string> = {
    CRITIQUE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    HAUTE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    MOYENNE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    FAIBLE: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  };
  return (
    <Badge variant="secondary" className={cn("text-[10px] font-medium", map[priority])}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: GoalStatus }) {
  const map: Record<string, string> = {
    A_DEFINIR: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    A_PLANIFIER: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    PLANIFIE: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    EN_COURS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    EN_RETARD: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    BLOQUE: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    TERMINE: "bg-emerald-600 text-white",
    REPORTE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    ANNULE: "bg-neutral-200 text-neutral-500 line-through",
  };
  return (
    <Badge variant="secondary" className={cn("text-[10px] font-medium", map[status])}>
      {GOAL_STATUS_LABELS[status]}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Barre de progression avec label
// ---------------------------------------------------------------------------

export function ProgressStat({
  label,
  value,
  max,
  format,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  format?: (n: number) => string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const f = format ?? formatFCFA;
  const toneClass =
    tone === "warning"
      ? "bg-amber-500"
      : tone === "danger"
        ? "bg-red-500"
        : tone === "success"
          ? "bg-emerald-600"
          : "bg-primary";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground truncate">{label}</span>
        <span className="tabular-nums font-medium">
          {f(value)}
          {max > 0 && (
            <span className="text-muted-foreground"> / {f(max)}</span>
          )}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", toneClass)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variation (trend)
// ---------------------------------------------------------------------------

export function Trend({ delta, suffix = "" }: { delta: number; suffix?: string }) {
  if (!Number.isFinite(delta) || delta === 0)
    return <span className="text-[11px] text-muted-foreground">stable</span>;
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium",
        up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
      )}
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {suffix === "%" ? formatPercent(Math.abs(delta)) : formatFCFA(Math.abs(delta))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Champ montant FCFA
// ---------------------------------------------------------------------------

export function MoneyInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={value === null ? "" : value.toLocaleString("fr-FR").replace(/\u202F|\u00A0/g, " ")}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, "");
          onChange(raw === "" ? null : Number(raw));
        }}
        placeholder={placeholder ?? "0"}
        className="pr-14 tabular-nums"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
        FCFA
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// État vide
// ---------------------------------------------------------------------------

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 px-6 text-center">
      {icon && <div className="text-muted-foreground/60">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feuille mobile (bottom sheet)
// ---------------------------------------------------------------------------

export function MobileSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto safe-bottom">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-base">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-xs">{description}</SheetDescription>
          )}
        </SheetHeader>
        <div className="px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Formulaire — petits utilitaires
// ---------------------------------------------------------------------------

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

export function SaveButton({
  onSave,
  disabled,
  label = "Enregistrer",
}: {
  onSave: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button onClick={onSave} disabled={disabled} className="w-full sm:w-auto" size="sm">
      {label}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Alerte (item)
// ---------------------------------------------------------------------------

export function AlertCard({
  severity,
  title,
  detail,
  action,
}: {
  severity: "info" | "warning" | "danger" | "success";
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  const map = {
    info: "border-l-sky-500 bg-sky-50/60 dark:bg-sky-950/20",
    warning: "border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/20",
    danger: "border-l-red-500 bg-red-50/60 dark:bg-red-950/20",
    success: "border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20",
  };
  return (
    <div
      className={cn(
        "rounded-r-lg border border-l-4 p-3 text-sm transition-colors",
        map[severity]
      )}
      role="alert"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-[13px] leading-tight">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{detail}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
