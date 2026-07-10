"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPostById } from "@/lib/mock-data";

export default function ReportPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const post = getPostById(id);
  const router = useRouter();

  if (!post) notFound();

  return (
    <AppShell noPadding>
      <PageHeader title="Report Post" backHref="/feed" />
      <div className="space-y-6 p-4">
        <p className="text-sm text-muted-foreground">
          Help us understand what&apos;s wrong with this post by @{post.author.username}.
        </p>

        <div className="space-y-2">
          <Label>Reason</Label>
          <Select defaultValue="spam">
            <SelectTrigger>
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spam">Spam</SelectItem>
              <SelectItem value="harassment">Harassment</SelectItem>
              <SelectItem value="misinformation">Misinformation</SelectItem>
              <SelectItem value="inappropriate">Inappropriate content</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="details">Additional details</Label>
          <Textarea
            id="details"
            placeholder="Describe the issue..."
            className="min-h-24"
          />
        </div>

        <Button
          className="w-full"
          variant="destructive"
          onClick={() => {
            toast.success("Report submitted. Thank you.");
            router.push("/feed");
          }}
        >
          Submit report
        </Button>
      </div>
    </AppShell>
  );
}
