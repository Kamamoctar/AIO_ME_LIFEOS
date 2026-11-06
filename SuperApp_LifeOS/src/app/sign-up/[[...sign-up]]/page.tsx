export function generateStaticParams() {
  return [{ "sign-up": [] }];
}

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <div className="max-w-md rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Mode local actif</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          FinanceOS fonctionne en mode autonome sur ce terminal.
        </p>
      </div>
    </main>
  );
}
