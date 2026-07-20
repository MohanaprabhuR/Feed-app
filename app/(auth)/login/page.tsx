"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Lock, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatAuthError,
  getSafeRedirectPath,
  normalizeUsername,
  validateLoginInput,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertTitle, AlertDescription, AlertContent } from "@/components/ui/alert";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeRedirectPath(searchParams.get("next"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const username = normalizeUsername(String(form.get("username") ?? ""));
    const password = String(form.get("password") ?? "");

    const validationError = validateLoginInput(username, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, name, username")
        .eq("username", username)
        .maybeSingle();

      if (profileError || !profile?.email) {
        setError("Invalid username or password.");
        return;
      }

      const displayName = profile.name?.trim() || profile.username || username;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (signInError) {
        setError(formatAuthError(signInError.message));
        return;
      }

      toast.custom(() => (
        <Alert variant="success">
          <AlertContent>
            <AlertTitle>Welcome back!</AlertTitle>
            <AlertDescription>{`Welcome back, ${displayName}.`}</AlertDescription>
          </AlertContent>
        </Alert>
      ));
      router.push(next);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Log In"
      subtitle="Enter your details to access your account."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            size="lg"
            variant="outline"
            placeholder="Enter username"
            autoComplete="username"
            required
            disabled={loading}
            prefix={<UserRound className="size-4 text-muted-foreground" />}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            size="lg"
            variant="outline"
            placeholder="Enter password"
            autoComplete="current-password"
            required
            disabled={loading}
            prefix={<Lock className="size-4 text-muted-foreground" />}
          />
        </div>
        <Button
          type="submit"
          className="mt-1 h-11 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
          size="lg"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Log In"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Not registered yet?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-2"
        >
          Create Account
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Log In" subtitle="Loading…">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </AuthLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
