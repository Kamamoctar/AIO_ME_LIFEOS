import React from "react";

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SignIn() {
  return null;
}

export function SignUp() {
  return null;
}

export function UserButton() {
  return null;
}

export function useUser() {
  return { isLoaded: true, isSignedIn: false, user: null };
}

export function useAuth() {
  return { isLoaded: true, isSignedIn: false, userId: null };
}

export function useClerk() {
  return { signOut: () => {} };
}

export async function auth() {
  return { userId: null };
}

export async function currentUser() {
  return null;
}

export function clerkMiddleware() {
  return () => {};
}

export const shadcn = {};
