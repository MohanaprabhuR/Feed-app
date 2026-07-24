"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { formatAuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        router.replace("/forgot-password");
        return;
      }

      setChecking(false);
    }

    void ensureSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(formatAuthError(updateError.message));
        return;
      }

      toast.custom(() => (
        <Alert variant="success">
          <AlertContent>
            <AlertTitle>Password updated</AlertTitle>
            <AlertDescription>
              Your password has been changed. Welcome back.
            </AlertDescription>
          </AlertContent>
        </Alert>
      ));

      router.replace("/feed");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <AuthLayout title="Set new password" subtitle="Checking your reset link…">
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a new password for your account."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            size="lg"
            variant="outline"
            placeholder="Enter new password"
            autoComplete="new-password"
            required
            disabled={loading}
            prefix={<Lock className="size-4 text-muted-foreground" />}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            size="lg"
            variant="outline"
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
            disabled={loading}
            prefix={<Lock className="size-4 text-muted-foreground" />}
          />
        </div>
        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
          size="lg"
          disabled={loading}
        >
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-2"
        >
          Back to Log In
        </Link>
      </p>
    </AuthLayout>
  );
}
