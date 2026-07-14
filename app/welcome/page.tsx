import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth-layout";

export default function WelcomePage() {
  return (
    <AuthLayout
      title="Welcome to Feed"
      subtitle="Your space to share posts, follow people, and stay in the conversation."
    >
      <div className="space-y-3">
        <Button
          className="h-11 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
          size="lg"
          asChild
        >
          <Link href="/register">Create Account</Link>
        </Button>
        <Button
          variant="outline"
          className="h-11 w-full rounded-xl"
          size="lg"
          asChild
        >
          <Link href="/login">Log In</Link>
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms & Privacy
        </Link>
      </p>
    </AuthLayout>
  );
}
