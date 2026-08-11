import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, oklch(0.69 0.18 49 / 14%) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, oklch(0.54 0.22 293 / 10%) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, oklch(0.78 0.14 175 / 8%) 0%, transparent 60%)",
        }}
      />

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
          <p className="mt-1 text-xs text-text-secondary">Sign in to continue to the fleet dashboard</p>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-text-secondary">
              Email address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
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
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
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
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error ? <p className="text-xs text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 flex items-start gap-2 rounded-md border border-border bg-surface-2 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-[11px] leading-relaxed text-text-secondary">
            Demo mode — enter any email and password to explore the platform. No real
            account is required.
          </p>
        </div>
      </div>
    </div>
  );
}
