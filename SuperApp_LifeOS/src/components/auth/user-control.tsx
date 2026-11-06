"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import { useLifeOS } from "@/lib/lifeos/store";

export function AuthUserControl({ compact = false }: { compact?: boolean }) {
  const state = useLifeOS((store) => store.state);
  const [UserBtn, setUserBtn] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      void import("@clerk/nextjs").then(({ UserButton }) => {
        setUserBtn(() => UserButton);
      });
    }
  }, []);

  if (UserBtn) {
    return <UserBtn />;
  }

  const isAdmin = state?.couple?.role === "ADMIN";
  return (
    <div
      className="flex items-center gap-2"
      title="Mode local sans authentification Clerk"
    >
      <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        {isAdmin ? (
          <ShieldCheck className="size-4" />
        ) : (
          <UserRound className="size-4" />
        )}
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">
            {state?.user.name ?? "Profil local"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {isAdmin ? "Administrateur" : "Membre"}
          </p>
        </div>
      )}
    </div>
  );
}
