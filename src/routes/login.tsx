import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth";
import { AppIcon } from "@/components/icons/AppIcon";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Demo mode: any non-empty email + password is accepted — there is no
    // real credential check. This app is a sales/demo tool, not a
    // production system with real user accounts.
    if (!email.trim() || !password.trim()) {
      setError("Enter any email and password to continue.");
      return;
    }

    setSubmitting(true);
    login(email.trim(), password);
    router.navigate({ to: "/" });
  }

  return (
    <div className="bg-page relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />

      <div className="glass-card relative w-full max-w-sm p-8">
        <div className="flex flex-col items-center text-center">
          <img
            src={`${import.meta.env.BASE_URL}wayam-logo.svg`}
            alt="Wayam AI"
            className="h-12 w-auto object-contain"
          />
          <h1 className="font-display mt-4 text-lg font-bold tracking-tight text-foreground">
            TCO Intelligence Platform
          </h1>
          <p className="mt-1 text-xs text-text-secondary">
            Sign in to continue to the fleet dashboard
          </p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-text-secondary">
              Email address
            </Label>
            <div className="relative">
              <AppIcon
                name="mail"
                size="md"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-text-secondary">
              Password
            </Label>
            <div className="relative">
              <AppIcon
                name="lock"
                size="md"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pl-9 pr-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <AppIcon name="hide" size="md" />
                ) : (
                  <AppIcon name="show" size="md" />
                )}
              </button>
            </div>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 flex items-start gap-2 rounded-md border border-border bg-surface-2 p-3">
          <AppIcon name="warrantyActive" size="md" className="mt-0.5 shrink-0 text-primary" />
          <p className="text-mini leading-relaxed text-text-secondary">
            Demo mode — enter any email and password to explore the platform. No real account is
            required.
          </p>
        </div>
      </div>
    </div>
  );
}
