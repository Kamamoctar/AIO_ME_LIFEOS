"use client";

import React, { useEffect, useState } from "react";

export function LifeOSAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ClerkComp, setClerkComp] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      void Promise.all([
        import("@clerk/nextjs"),
        import("@clerk/ui/themes"),
      ]).then(([{ ClerkProvider }, { shadcn }]) => {
        setClerkComp(() => function Provider({ children }: { children: React.ReactNode }) {
          return <ClerkProvider appearance={{ theme: shadcn }} dynamic>{children}</ClerkProvider>;
        });
      });
    }
  }, []);

  if (ClerkComp) {
    return <ClerkComp>{children}</ClerkComp>;
  }

  return <>{children}</>;
}
