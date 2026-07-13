"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { CurrentUserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getPostById } from "@/lib/mock-data";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertContent,
} from "@/components/ui/alert";

export default function EditPostPage({
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
      <PageHeader
        title="Edit Post"
        backHref="/feed"
        action={
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => router.push(`/delete/${id}`)}
            >
              Delete
            </Button>
            <Button
              size="sm"
              onClick={() => {
                toast.custom((t) => (
                  <Alert variant="success">
                    <AlertContent>
                      <AlertTitle>Post updated</AlertTitle>
                      <AlertDescription>
                        Your post has been updated.
                      </AlertDescription>
                    </AlertContent>
                  </Alert>
                ));
                router.push("/feed");
              }}
            >
              Save
            </Button>
          </div>
        }
      />
      <div className="space-y-4 p-4">
        <div className="flex gap-3">
          <CurrentUserAvatar />
          <Textarea
            defaultValue={post.content}
            className="min-h-32 resize-none border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
    </AppShell>
  );
}
