import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth-layout";

export default function WelcomePage() {
  return (
    <AuthLayout
      title="Welcome to FeedApp"
      subtitle="Your social space to share moments and connect with others."
    >
      <div className="space-y-3">
        <Button className="w-full" size="lg" asChild>
          <Link href="/register">Create account</Link>
        </Button>
        <Button variant="outline" className="w-full" size="lg" asChild>
          <Link href="/login">Sign in</Link>
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
