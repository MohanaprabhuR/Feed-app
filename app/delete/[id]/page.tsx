"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getPostById } from "@/lib/mock-data";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function DeletePostPage({
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
      <PageHeader title="Delete Post" backHref={`/edit/${id}`} />
      <div className="flex flex-col items-center gap-6 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <Trash2 className="size-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Delete this post?</h2>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. Your post will be permanently removed
            from your profile and the feed.
          </p>
        </div>
        <blockquote className="w-full rounded-lg border bg-muted/50 p-4 text-left text-sm">
          {post.content}
        </blockquote>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full max-w-xs">
              Delete post
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your post.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast.custom((t) => (
                    <Alert variant="success">
                      <AlertTitle>Post deleted</AlertTitle>
                      <AlertDescription>
                        Your post has been deleted.
                      </AlertDescription>
                    </Alert>
                  ));
                  router.push("/feed");
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </AppShell>
  );
}
