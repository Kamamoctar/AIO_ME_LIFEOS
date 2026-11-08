"use client";

import { useEffect, useState } from "react";
import { Brain, CircleDollarSign, ListTodo, MoonStar, Target } from "lucide-react";
import { MobileSheet } from "@/components/lifeos/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { todayInputDate } from "@/lib/lifeos/format";
import { useLifeOS } from "@/lib/lifeos/store";
import { useUnifiedModules } from "@/lib/modules/store";

export const LIFEOS_CAPTURE_EVENT = "lifeos:open-capture";

type CaptureKind = "action" | "finance" | "idea" | "intention" | "priority";

const CAPTURE_KINDS: Array<{
  id: CaptureKind;
  label: string;
  description: string;
  icon: typeof ListTodo;
}> = [
  { id: "action", label: "Action", description: "Une prochaine étape datée", icon: ListTodo },
  { id: "finance", label: "Opération", description: "Dépense, revenu ou transfert", icon: CircleDollarSign },
  { id: "idea", label: "Idée", description: "À laisser mûrir dans MK", icon: Brain },
  { id: "intention", label: "Intention", description: "Privée, liée à Misbaha", icon: MoonStar },
  { id: "priority", label: "Priorité", description: "La chose essentielle du jour", icon: Target },
];

export function UniversalCaptureSheet() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CaptureKind | null>(null);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [dueDate, setDueDate] = useState(todayInputDate());
  const mutate = useLifeOS((store) => store.mutate);
  const setQuickAddOpen = useLifeOS((store) => store.setQuickAddOpen);
  const modules = useUnifiedModules();
  const { toast } = useToast();

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(LIFEOS_CAPTURE_EVENT, show);
    return () => window.removeEventListener(LIFEOS_CAPTURE_EVENT, show);
  }, []);

  const reset = () => {
    setKind(null);
    setTitle("");
    setDetail("");
    setDueDate(todayInputDate());
  };

  const selectKind = (next: CaptureKind) => {
    if (next === "finance") {
      setOpen(false);
      setQuickAddOpen(true);
      reset();
      return;
    }
    setKind(next);
  };

  const save = async () => {
    if (!kind || !title.trim()) return;
    if (kind === "action") {
      const ok = await mutate("action", "create", undefined, {
        title: title.trim(),
        dueDate,
        priority: "MOYENNE",
      });
      if (!ok) return;
    } else if (kind === "idea") {
      modules.addIdea(title, detail || "Capture rapide");
    } else if (kind === "intention") {
      modules.addIntention("ya_rachid", title);
    } else if (kind === "priority") {
      modules.setPriority(title);
    }
    toast({ title: "Capture enregistrée", description: "LifeOS l’a rangée au bon endroit." });
    setOpen(false);
    reset();
  };

  return (
    <MobileSheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
      title={kind ? CAPTURE_KINDS.find((item) => item.id === kind)?.label ?? "Capture" : "Capture universelle"}
      description="Note maintenant, organise sans changer d’écran."
    >
      {!kind ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {CAPTURE_KINDS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectKind(item.id)}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:bg-accent"
              >
                <Icon className="size-5 shrink-0 text-primary" />
                <span><strong className="block text-sm">{item.label}</strong><span className="text-[11px] text-muted-foreground">{item.description}</span></span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="capture-title">
              {kind === "priority" ? "Priorité du jour" : kind === "intention" ? "Intention" : "Titre"}
            </Label>
            {kind === "intention" ? (
              <Textarea id="capture-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Mon intention…" className="mt-1.5" />
            ) : (
              <Input id="capture-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Écrire ici…" className="mt-1.5" />
            )}
          </div>
          {kind === "action" && (
            <div><Label htmlFor="capture-date">Échéance</Label><Input id="capture-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-1.5" /></div>
          )}
          {kind === "idea" && (
            <div><Label htmlFor="capture-detail">Pourquoi cette idée t’attire ?</Label><Textarea id="capture-detail" value={detail} onChange={(event) => setDetail(event.target.value)} className="mt-1.5" /></div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setKind(null)}>Retour</Button>
            <Button className="flex-1" disabled={!title.trim()} onClick={save}>Enregistrer</Button>
          </div>
        </div>
      )}
    </MobileSheet>
  );
}
