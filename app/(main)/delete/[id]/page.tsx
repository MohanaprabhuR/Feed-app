"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useCurrentUser } from "@/components/current-user-provider";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertContent, AlertDescription } from "@/components/ui/alert";
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
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { PageBlockSkeleton } from "@/components/skeletons";
import { appToast } from "@/lib/app-toast";
import { api, ApiClientError } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/errors";
import { richTextToPlain } from "@/lib/rich-text";
import type { Post } from "@/lib/types";

export default function DeletePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (userLoading) return;

      if (!user) {
        if (!cancelled) {
          setLoading(false);
          setForbidden(true);
        }
        return;
      }

      setLoading(true);
      try {
        const { post: data } = await api.posts.get(id);

        if (!cancelled) {
          if (data.author.id !== user.id) {
            setForbidden(true);
            return;
          }
          setPost(data);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiClientError && err.status === 404) {
            setMissing(true);
            return;
          }
          setError(getErrorMessage(err, "Could not load post."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id, user, userLoading]);

  async function handleDelete() {
    if (!user || !post || deleting) return;

    setDeleting(true);
    setError(null);

    try {
      await api.posts.delete(post.id);
      appToast.success("Post deleted", "Your post has been removed.");
      router.push("/feed");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete post."));
    } finally {
      setDeleting(false);
    }
  }

  if (userLoading || loading) {
    return (
      <AppShell noPadding>
        <PageHeader title="Delete Post" backHref="/feed" />
        <div className="p-8">
          <PageBlockSkeleton />
        </div>
      </AppShell>
    );
  }

  if (forbidden) {
    return (
      <AppShell noPadding>
        <PageHeader title="Delete Post" backHref="/feed" />
        <Empty className="border-0 py-16">
          <EmptyContent>
            <EmptyTitle>You can&apos;t delete this post</EmptyTitle>
            <EmptyDescription>
              Only the author can delete a post.
            </EmptyDescription>
            <Button size="sm" asChild>
              <Link href="/feed">Back to feed</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </AppShell>
    );
  }

  if (missing || !post) {
    return (
      <AppShell noPadding>
        <PageHeader title="Delete Post" backHref="/feed" />
        <Empty className="border-0 py-16">
          <EmptyContent>
            <EmptyTitle>Post not found</EmptyTitle>
            <EmptyDescription>
              This post may already have been deleted.
            </EmptyDescription>
            <Button size="sm" asChild>
              <Link href="/feed">Back to feed</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </AppShell>
    );
  }

  return (
    <AppShell noPadding>
      <PageHeader title="Delete Post" backHref="/feed" />
      <div className="flex flex-col items-center gap-6 p-8 text-center">
        {error && (
          <Alert variant="error" className="w-full max-w-md">
            <AlertContent>
              <AlertDescription>{error}</AlertDescription>
            </AlertContent>
          </Alert>
        )}
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
        <blockquote className="w-full max-w-md rounded-lg border bg-muted/50 p-4 text-left text-sm">
          {richTextToPlain(post.content)}
        </blockquote>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full max-w-xs"
              disabled={deleting}
              loading={deleting}
            >
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
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleting}
                onClick={() => void handleDelete()}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="outline" onClick={() => router.back()} disabled={deleting}>
          Cancel
        </Button>
      </div>
    </AppShell>
  );
}
