"use client";

// Life OS — Compétences : formations, certifications, langues, progression
import { useState } from "react";
import { useLifeOS } from "@/lib/lifeos/store";
import { SectionCard, EmptyState, Field, ProgressStat, MobileSheet, SaveButton } from "@/components/lifeos/ui-bits";
import { formatDateFR, toInputDate } from "@/lib/lifeos/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Plus, Trash2, Pencil, Award, BookOpen, Languages, Wrench } from "lucide-react";

const CATEGORIES = [
  { id: "FORMATION", label: "Formation", icon: BookOpen },
  { id: "CERTIFICATION", label: "Certification", icon: Award },
  { id: "LANGUE", label: "Langue", icon: Languages },
  { id: "TECHNIQUE", label: "Technique", icon: Wrench },
];

export function SkillsView() {
  const { state, mutate } = useLifeOS();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("FORMATION");
  const [level, setLevel] = useState<number | null>(0);
  const [targetLevel, setTargetLevel] = useState<number | null>(100);
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");

  if (!state) return null;

  const openForm = (id?: string) => {
    const s = id ? state.skills.find((x) => x.id === id) : null;
    setEditId(id ?? null);
    setName(s?.name ?? "");
    setCategory(s?.category ?? "FORMATION");
    setLevel(s?.level ?? 0);
    setTargetLevel(s?.targetLevel ?? 100);
    setTargetDate(toInputDate(s?.targetDate));
    setNotes(s?.notes ?? "");
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            Compétences
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Formations, certifications, langues — niveaux et progression
          </p>
        </div>
        <Button size="sm" onClick={() => openForm()}>
          <Plus className="size-4 mr-1" /> Compétence
        </Button>
      </div>

      {state.skills.length === 0 ? (
        <EmptyState
          title="Aucune compétence suivie"
          description="Ajoute formations, certifications ou langues pour suivre ta montée en compétences."
        />
      ) : (
        CATEGORIES.map((cat) => {
          const list = state.skills.filter((s) => (s.category ?? "FORMATION") === cat.id);
          if (list.length === 0) return null;
          const Icon = cat.icon;
          return (
            <SectionCard key={cat.id} title={cat.label} icon={<Icon className="size-4" />}>
              <div className="space-y-3">
                {list.map((s) => (
                  <div key={s.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold">{s.name}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {s.level}/{s.targetLevel}
                        </span>
                        <button className="text-muted-foreground hover:text-foreground" aria-label={`Modifier ${s.name}`} onClick={() => openForm(s.id)}>
                          <Pencil className="size-3.5" />
                        </button>
                        <button className="text-muted-foreground hover:text-destructive" aria-label={`Supprimer ${s.name}`} onClick={() => mutate("skill", "delete", s.id)}>
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <ProgressStat label="Niveau" value={s.level} max={s.targetLevel} format={(n) => `${Math.round(n)}`} tone="success" />
                    {s.targetDate && (
                      <p className="text-[11px] text-muted-foreground">Objectif : {formatDateFR(s.targetDate)}</p>
                    )}
                    {s.notes && <p className="text-[11px] text-muted-foreground italic">{s.notes}</p>}
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        })
      )}

      <MobileSheet open={open} onOpenChange={setOpen} title={editId ? "Modifier" : "Nouvelle compétence"}>
        <div className="space-y-3">
          <Field label="Nom">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Anglais professionnel" />
          </Field>
          <Field label="Catégorie">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Niveau actuel (0-100)">
              <Input type="number" value={level ?? 0} onChange={(e) => setLevel(Number(e.target.value))} />
            </Field>
            <Field label="Niveau cible (0-100)">
              <Input type="number" value={targetLevel ?? 100} onChange={(e) => setTargetLevel(Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Date cible">
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </Field>
          <Field label="Notes">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
          <SaveButton
            onSave={async () => {
              if (!name.trim()) return;
              const data = {
                name,
                category,
                level: level ?? 0,
                targetLevel: targetLevel ?? 100,
                targetDate: targetDate || null,
                notes: notes || null,
              };
              if (editId) await mutate("skill", "update", editId, data);
              else await mutate("skill", "create", undefined, data);
              setOpen(false);
            }}
          />
        </div>
      </MobileSheet>
    </div>
  );
}
