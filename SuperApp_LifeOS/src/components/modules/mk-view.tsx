"use client";

import { useState } from "react";
import { getTodayEntry, localDateKey, useUnifiedModules } from "@/lib/modules/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Brain, CalendarCheck, CheckCircle2, Lightbulb, LockKeyhole, Plus, Target, Trash2 } from "lucide-react";

const BLOCKS = ["06–09 · Création", "09–13 · Travail profond", "14–18 · Exécution", "19–22 · Vie & bilan"];
const MORNING = ["Eau", "Silence", "Mouvement", "Priorité"];
const EVENING = ["Ranger", "Relire", "Gratitude", "Préparer demain"];

export function MkView() {
  const store = useUnifiedModules();
  const { data } = store;
  const today = getTodayEntry(data);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaReason, setIdeaReason] = useState("");
  const [projectName, setProjectName] = useState("");
  const [notice, setNotice] = useState("");
  const activeProjects = data.mk.projects.filter((project) => project.state === "ACTIVE");

  const captureIdea = () => {
    if (!ideaTitle.trim()) return;
    store.addIdea(ideaTitle, ideaReason);
    setIdeaTitle("");
    setIdeaReason("");
    setNotice("Idée mise en boîte jusqu’au premier du mois suivant.");
  };

  const createProject = () => {
    if (!projectName.trim()) return;
    const result = store.addMkProject(projectName);
    setNotice(result.ok ? "Projet ajouté." : result.message);
    if (result.ok) setProjectName("");
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Système MK</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold"><Target className="size-6" /> Une priorité, quatre blocs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Le système d’exécution quotidien, de maturation des idées et de limitation des projets.</p>
      </header>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-4">
          <TabsTrigger value="today">Aujourd’hui</TabsTrigger>
          <TabsTrigger value="ideas">Idées</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
          <TabsTrigger value="review">Bilan</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Priorité unique</CardTitle></CardHeader>
            <CardContent>
              <Input value={today.priority} onChange={(event) => store.setPriority(event.target.value)} placeholder="La seule chose qui compte aujourd’hui" className="text-base font-medium" />
              <div className="mt-4 flex items-center gap-4">
                <label htmlFor="energy" className="whitespace-nowrap text-sm font-medium">Énergie {today.energy}/10</label>
                <input id="energy" type="range" min="1" max="10" value={today.energy} onChange={(event) => store.setEnergy(Number(event.target.value))} className="w-full accent-primary" />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Les quatre blocs</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {BLOCKS.map((label, index) => (
                  <label key={label} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
                    <Checkbox checked={today.blocks[index]} onCheckedChange={() => store.toggleBlock(index)} />
                    <span className={today.blocks[index] ? "text-sm line-through opacity-60" : "text-sm font-medium"}>{label}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Rituels d’ancrage</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {([["Matin", MORNING, "morning"], ["Soir", EVENING, "evening"]] as const).map(([title, labels, period]) => (
                  <div key={period}>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{title}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {labels.map((label, index) => {
                        const checked = period === "morning" ? today.morningRituals[index] : today.eveningRituals[index];
                        return <button key={label} onClick={() => store.toggleRitual(period, index)} className={`rounded-lg border px-3 py-2 text-left text-xs ${checked ? "border-primary bg-primary/10 font-semibold text-primary" : "bg-card"}`}>{checked ? "✓ " : ""}{label}</button>;
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ideas" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="size-4" /> Capturer sans se disperser</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input value={ideaTitle} onChange={(event) => setIdeaTitle(event.target.value)} placeholder="Nouvelle idée" />
              <Input value={ideaReason} onChange={(event) => setIdeaReason(event.target.value)} placeholder="Pourquoi elle m’enthousiasme" />
              <Button onClick={captureIdea}><Plus className="mr-1 size-4" /> Mettre en boîte</Button>
            </CardContent>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            {data.mk.ideas.map((idea) => {
              const unlocked = idea.unlockDate <= localDateKey();
              return (
                <Card key={idea.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-2"><h2 className="font-semibold">{idea.title}</h2><button onClick={() => store.deleteIdea(idea.id)} className="text-muted-foreground"><Trash2 className="size-4" /></button></div>
                    {idea.excitement && <p className="mt-2 text-sm text-muted-foreground">{idea.excitement}</p>}
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <Badge variant={unlocked ? "secondary" : "outline"}>{unlocked ? <CheckCircle2 className="mr-1 size-3" /> : <LockKeyhole className="mr-1 size-3" />}{unlocked ? "Prête pour le tri" : idea.unlockDate}</Badge>
                      <Button size="sm" disabled={!unlocked || idea.status === "LAUNCHED"} onClick={() => { const result = store.launchIdea(idea.id); setNotice(result.ok ? "Idée transformée en projet." : result.message); }}>Lancer</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {data.mk.ideas.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground md:col-span-2">Aucune idée en attente.</div>}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card className={activeProjects.length >= 3 ? "border-destructive/50" : ""}>
            <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center">
              <div className="flex-1"><p className="font-semibold">{activeProjects.length}/3 emplacements actifs</p><p className="text-xs text-muted-foreground">Un projet doit sortir avant d’en lancer un quatrième.</p></div>
              <Input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Nouveau projet" className="sm:max-w-xs" />
              <Button onClick={createProject} disabled={activeProjects.length >= 3}><Plus className="mr-1 size-4" /> Ajouter</Button>
            </CardContent>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            {activeProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader className="pb-3"><CardTitle className="text-base">{project.name}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><div className="mb-1 flex justify-between text-xs"><span>Avancement</span><span>{project.progress}%</span></div><Progress value={project.progress} /></div>
                  <input type="range" min="0" max="100" step="5" value={project.progress} onChange={(event) => store.updateMkProject(project.id, { progress: Number(event.target.value) })} className="w-full accent-primary" />
                  <Input value={project.nextStep} onChange={(event) => store.updateMkProject(project.id, { nextStep: event.target.value })} placeholder="Prochaine étape concrète" />
                  <Button variant="outline" size="sm" onClick={() => store.updateMkProject(project.id, { state: "COMPLETED", progress: 100 })}><CheckCircle2 className="mr-1 size-4" /> Terminer</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {([ ["journalHead", "Tête", "Ce que je dois clarifier"], ["journalHeart", "Cœur", "Ce que je ressens"], ["mindDump", "Décharge mentale", "Tout ce qui encombre mon esprit"] ] as const).map(([field, title, placeholder]) => (
              <Card key={field}>
                <CardHeader className="pb-3"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
                <CardContent><Textarea value={today[field]} onChange={(event) => store.setJournal(field, event.target.value)} placeholder={placeholder} rows={6} /></CardContent>
              </Card>
            ))}
          </div>
          <Card><CardContent className="flex items-center gap-4 pt-5"><CalendarCheck className="size-8 text-primary" /><div><p className="font-semibold">Bilan du jour</p><p className="text-sm text-muted-foreground">{today.blocks.filter(Boolean).length}/4 blocs · {today.morningRituals.filter(Boolean).length + today.eveningRituals.filter(Boolean).length}/8 rituels · énergie {today.energy}/10.</p></div></CardContent></Card>
        </TabsContent>
      </Tabs>

      {notice && <p className="text-sm text-muted-foreground" role="status">{notice}</p>}
    </div>
  );
}
