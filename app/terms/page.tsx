import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TermsPage() {
  return (
    <AppShell noPadding>
      <PageHeader title="Legal" backHref="/settings" />
      <Tabs defaultValue="terms" className="px-4 py-5 sm:px-5 sm:py-6">
        <TabsList className="w-full">
          <TabsTrigger value="terms" className="flex-1">
            Terms
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex-1">
            Privacy
          </TabsTrigger>
        </TabsList>
        <TabsContent value="terms" className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
          <h3 className="text-lg font-semibold text-foreground">Terms of Service</h3>
          <p>
            By using FeedApp, you agree to these terms. You must be at least 13
            years old to use this service. You are responsible for the content
            you post and must not violate any laws or others&apos; rights.
          </p>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            our community guidelines. Content may be removed at our discretion.
          </p>
        </TabsContent>
        <TabsContent value="privacy" className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
          <h3 className="text-lg font-semibold text-foreground">Privacy Policy</h3>
          <p>
            We collect information you provide directly, such as your profile
            details and posts. We use this data to operate and improve the
            service.
          </p>
          <p>
            We do not sell your personal information. You can control your
            privacy settings in the app and request deletion of your account
            data at any time.
          </p>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
