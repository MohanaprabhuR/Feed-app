"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatAuthError,
  getDefaultAvatar,
  isAlreadyRegisteredError,
  isEmailNotConfirmedError,
  isRateLimitError,
  normalizeUsername,
  validateSignUpInput,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

async function trySignIn(
  supabase: SupabaseClient,
  emails: string[],
  password: string,
) {
  for (const email of [...new Set(emails.filter(Boolean))]) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) return { ok: true as const };
    if (isEmailNotConfirmedError(error.message)) {
      return { ok: false as const, reason: "unconfirmed" as const };
    }
  }
  return { ok: false as const, reason: "invalid" as const };
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const input = {
      name: String(form.get("name") ?? ""),
      username: String(form.get("username") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    const validationError = validateSignUpInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    const username = normalizeUsername(input.username);
    const email = input.email.trim();
    setLoading(true);

    try {
      const supabase = createClient();

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("email, username")
        .or(`username.eq.${username},email.eq.${email}`)
        .maybeSingle();

      if (existingProfile) {
        const signIn = await trySignIn(
          supabase,
          [email, existingProfile.email],
          input.password,
        );

        if (signIn.ok) {
          toast.custom((t) => (
            <Alert variant="success">
              <AlertTitle>Welcome back!</AlertTitle>
              <AlertDescription>Welcome back to Feed App.</AlertDescription>
            </Alert>
          ));
          router.push("/feed");
          router.refresh();
          return;
        }

        if (signIn.reason === "unconfirmed") {
          setError(
            "Account exists but isn't confirmed. In Supabase → Authentication → Users, mark email as confirmed—or disable email confirmation under Providers → Email.",
          );
          return;
        }

        setError(
          "Username or email already in use. Sign in with your username and password.",
        );
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: input.password,
        options: {
          data: {
            name: input.name.trim(),
            username,
          },
        },
      });

      if (signUpError) {
        if (
          isAlreadyRegisteredError(signUpError.message) ||
          isRateLimitError(signUpError.message)
        ) {
          const signIn = await trySignIn(supabase, [email], input.password);

          if (signIn.ok) {
            toast.custom((t) => (
              <Alert variant="success">
                <AlertTitle>Welcome back!</AlertTitle>
                <AlertDescription>Welcome back to Feed App.</AlertDescription>
              </Alert>
            ));
            router.push("/feed");
            router.refresh();
            return;
          }

          if (signIn.reason === "unconfirmed") {
            setError(
              "Account exists but isn't confirmed. In Supabase → Authentication → Users, mark email as confirmed—or disable email confirmation under Providers → Email.",
            );
            return;
          }

          setError(formatAuthError(signUpError.message));
          return;
        }

        setError(formatAuthError(signUpError.message));
        return;
      }

      if (data.user) {
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            name: input.name.trim(),
            username,
            email,
            avatar: getDefaultAvatar(username),
          },
          { onConflict: "id" },
        );
      }

      if (data.session) {
        toast.custom((t) => (
          <Alert variant="success">
            <AlertTitle>Account created!</AlertTitle>
            <AlertDescription>Welcome to Feed App.</AlertDescription>
          </Alert>
        ));
        router.push("/feed");
        router.refresh();
        return;
      }

      const signIn = await trySignIn(supabase, [email], input.password);

      if (signIn.ok) {
        toast.custom((t) => (
          <Alert variant="success">
            <AlertTitle>Account created!</AlertTitle>
            <AlertDescription>Welcome to Feed App.</AlertDescription>
          </Alert>
        ));
        router.push("/feed");
        router.refresh();
        return;
      }

      if (signIn.reason === "unconfirmed") {
        setError(
          "Account created but email confirmation is still on. Disable it in Supabase → Authentication → Providers → Email, then sign in.",
        );
        return;
      }

      setError("Could not sign you in. Try signing in with your username.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Join the community today.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <p>{error}</p>
            {error.includes("Sign in") && (
              <Link
                href="/login"
                className="block font-medium underline underline-offset-2"
              >
                Go to sign in
              </Link>
            )}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Alex Morgan"
            autoComplete="name"
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            placeholder="alexmorgan"
            autoComplete="username"
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={6}
            required
            disabled={loading}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
