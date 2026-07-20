"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserListItem } from "@/components/user-list-item";
import { Alert, AlertContent, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UserListSkeleton } from "@/components/skeletons";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { getErrorMessage } from "@/lib/errors";
import { fetchLikers, getReactionMeta } from "@/lib/likes";
import { fetchPostById } from "@/lib/posts";
import { createClient } from "@/lib/supabase/client";
import type { ReactionType, User } from "@/lib/types";

type Liker = User & { reaction: ReactionType };

export default function LikesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingPost, setMissingPost] = useState(false);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const post = await fetchPostById(supabase, id);
      if (!post) {
        setMissingPost(true);
        setLikers([]);
        setError(null);
        return;
      }

      const data = await fetchLikers(supabase, id);
      setLikers(data);
      setMissingPost(false);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load likes."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <AppShell noPadding>
      <PageHeader title="Reactions" backHref="/feed" />
      <div className="divide-y px-4">
        {loading && <UserListSkeleton count={4} className="px-0" />}

        {error && (
          <Alert variant="error" className="my-4 w-full max-w-none">
            <AlertContent>
              <AlertDescription>{error}</AlertDescription>
            </AlertContent>
          </Alert>
        )}

        {!loading && missingPost && (
          <Empty className="py-12">
            <EmptyContent>
              <EmptyTitle>Post not found</EmptyTitle>
              <EmptyDescription>
                This post may have been deleted.
              </EmptyDescription>
              <Button asChild size="sm">
                <Link href="/feed">Back to feed</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}

        {!loading && !error && !missingPost && likers.length === 0 && (
          <Empty className="py-12">
            <EmptyContent>
              <EmptyTitle>No reactions yet</EmptyTitle>
              <EmptyDescription>
                Be the first to react to this post.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        )}

        {likers.map((user) => {
          const meta = getReactionMeta(user.reaction);
          return (
            <UserListItem
              key={user.id}
              user={user}
              subtitle={`${meta.emoji} ${meta.label} · @${user.username}`}
              action={
                <span
                  className={`flex size-9 items-center justify-center rounded-full text-lg ${meta.bg}`}
                  title={meta.label}
                >
                  {meta.emoji}
                </span>
              }
            />
          );
        })}
      </div>
    </AppShell>
  );
}
