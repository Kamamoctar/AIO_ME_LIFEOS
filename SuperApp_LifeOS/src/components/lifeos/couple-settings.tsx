"use client";

import { useState } from "react";
import {
  HeartHandshake,
  LockKeyhole,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { SectionCard, Field } from "@/components/lifeos/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLifeOS } from "@/lib/lifeos/store";
import {
  FEATURE_DEFINITIONS,
  type AccessLevel,
} from "@/lib/lifeos/permissions";
import { useToast } from "@/hooks/use-toast";

const ACCESS_LABELS: Record<AccessLevel, string> = {
  NONE: "Masque",
  VIEW: "Lecture seule",
  EDIT: "Modification",
};

export function CoupleSettings() {
  const { state, refresh } = useLifeOS();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!state?.couple) return null;

  const couple = state.couple;
  const isAdmin = couple.role === "ADMIN";
  const managedMembers = couple.members.filter((member) => member.role === "MEMBER");
  const pendingInvitation = couple.invitations.find(
    (invitation) => invitation.status === "PENDING"
  );

  const runAction = async (
    action: string,
    data: Record<string, unknown>,
    successMessage: string
  ) => {
    setBusy(true);
    try {
      const response = await fetch("/api/couple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Operation impossible");
      await refresh();
      toast({ title: successMessage });
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Operation impossible",
        variant: "destructive",
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const sharedItems = [
    ...state.goals
      .filter((goal) => (goal.visibility ?? "SHARED") === "SHARED")
      .map((goal) => ({ type: "GOAL", id: goal.id, label: goal.title })),
    ...state.projects
      .filter((project) => (project.visibility ?? "SHARED") === "SHARED")
      .map((project) => ({ type: "PROJECT", id: project.id, label: project.name })),
    ...state.businesses
      .filter((business) => (business.visibility ?? "SHARED") === "SHARED")
      .map((business) => ({ type: "BUSINESS", id: business.id, label: business.name })),
  ];

  return (
    <SectionCard
      title="Notre foyer"
      description="Membres du foyer, partage par defaut et confidentialite personnelle"
      icon={<HeartHandshake className="size-4" />}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {couple.members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 rounded-xl border p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {(member.name ?? member.email).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {member.name ?? member.email}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {member.email}
              </p>
            </div>
            <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
              {member.role === "ADMIN" ? "Admin" : "Membre"}
            </Badge>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
        <LockKeyhole className="mt-0.5 size-4 shrink-0" />
        <p>
          Tout nouvel element est partage. Un element marque personnel reste
          visible uniquement par son proprietaire, y compris face a
          l&apos;administrateur.
        </p>
      </div>

      {!isAdmin && (
        <p className="mt-3 text-xs text-muted-foreground">
          L&apos;administrateur configure les rubriques partagees accessibles a ton
          profil. Tu gardes le controle complet de tes elements personnels.
        </p>
      )}

      {isAdmin && (
        <div className="mt-4 rounded-xl border p-4">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Inviter un membre du foyer</p>
              <p className="text-[11px] text-muted-foreground">
                L&apos;invitation sera reconnue lors de son inscription Clerk.
              </p>
            </div>
          </div>

          {pendingInvitation ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-3">
              <div>
                <p className="text-xs font-medium">{pendingInvitation.email}</p>
                <p className="text-[10px] text-muted-foreground">
                  Invitation en attente · partage le lien /sign-up
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  runAction(
                    "revokeInvitation",
                    { invitationId: pendingInvitation.id },
                    "Invitation revoquee"
                  )
                }
              >
                Revoquer
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
              <Field label="Prenom">
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Field label="Adresse e-mail">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="elle@exemple.com"
                />
              </Field>
              <Button
                disabled={busy || !email.trim()}
                onClick={async () => {
                  const invited = await runAction(
                    "invite",
                    { email, name },
                    "Invitation creee"
                  );
                  if (invited) {
                    setEmail("");
                    setName("");
                  }
                }}
              >
                Inviter
              </Button>
            </div>
          )}
        </div>
      )}

      {isAdmin && managedMembers.map((partner) => (
        <div key={partner.id} className="mt-4 space-y-4 rounded-xl border p-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <p className="text-sm font-medium">
                Droits de {partner.name ?? partner.email}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FEATURE_DEFINITIONS.map((feature) => {
                const access = partner.permissions[feature.id] ?? "EDIT";
                return (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <span className="text-xs font-medium">{feature.label}</span>
                    <Select
                      value={access}
                      disabled={busy}
                      onValueChange={(value) =>
                        runAction(
                          "updatePermission",
                          {
                            memberId: partner.id,
                            feature: feature.id,
                            access: value,
                          },
                          "Droits mis a jour"
                        )
                      }
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ACCESS_LABELS) as AccessLevel[]).map((level) => (
                          <SelectItem key={level} value={level}>
                            {ACCESS_LABELS[level]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>

          {sharedItems.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Exceptions par element</p>
                  <p className="text-[11px] text-muted-foreground">
                    Exemple : afficher le mariage ou autoriser la gestion de sa boutique.
                  </p>
                </div>
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {sharedItems.map((item) => {
                  const override = partner.itemPermissions.find(
                    (permission) =>
                      permission.resourceType === item.type &&
                      permission.resourceId === item.id
                  );
                  const featureAccess =
                    partner.permissions[
                      item.type === "GOAL"
                        ? "goals"
                        : item.type === "BUSINESS"
                          ? "investments"
                          : "projects"
                    ] ?? "EDIT";
                  const access = override?.access ?? featureAccess;
                  return (
                    <div
                      key={`${item.type}:${item.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.type === "GOAL"
                            ? "Objectif"
                            : item.type === "BUSINESS"
                              ? "Boutique / activite"
                              : "Projet"}
                        </p>
                      </div>
                      <Select
                        value={access}
                        disabled={busy}
                        onValueChange={(value) =>
                          runAction(
                            "updateItemPermission",
                            {
                              memberId: partner.id,
                              resourceType: item.type,
                              resourceId: item.id,
                              access: value,
                            },
                            "Acces a l'element mis a jour"
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ACCESS_LABELS) as AccessLevel[]).map((level) => (
                            <SelectItem key={level} value={level}>
                              {ACCESS_LABELS[level]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </SectionCard>
  );
}
