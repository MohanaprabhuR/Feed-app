"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatAuthError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertContent,
} from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const email = String(
      new FormData(e.currentTarget).get("email") ?? "",
    ).trim();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        },
      );

      if (resetError) {
        setError(formatAuthError(resetError.message));
        return;
      }

      setSent(true);

      toast.custom(() => (
        <Alert variant="success">
          <AlertContent>
            <AlertTitle>Password reset email sent</AlertTitle>
            <AlertDescription>
              Check your inbox for a reset link.
            </AlertDescription>
          </AlertContent>
        </Alert>
      ));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {sent ? (
        <p className="text-center text-sm text-muted-foreground">
          Check your inbox for a password reset link.
        </p>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              size="lg"
              variant="outline"
              placeholder="Enter email"
              autoComplete="email"
              required
              disabled={loading}
              prefix={<Mail className="size-4 text-muted-foreground" />}
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
            size="lg"
            disabled={loading}
          >
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
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
