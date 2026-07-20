import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <AppShell noPadding>
      <PageHeader title="About" backHref="/settings" />
      <div className="space-y-6 px-4 py-5 sm:px-5 sm:py-6">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-primary-foreground">
            F
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">FeedApp</h2>
            <p className="mt-1 text-base text-muted-foreground">Version 1.0.0</p>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 p-5 text-base leading-relaxed text-muted-foreground">
            <p>
              FeedApp is a modern social platform for sharing moments, connecting
              with friends, and discovering trending content.
            </p>
            <p>
              Built with Next.js, React, and shadcn/ui components for a polished,
              accessible experience.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
