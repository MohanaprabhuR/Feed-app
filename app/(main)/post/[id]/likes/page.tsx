"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserListItem } from "@/components/user-list-item";
import { Alert, AlertContent, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserListSkeleton } from "@/components/skeletons";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { getErrorMessage } from "@/lib/errors";
import { fetchLikers, getReactionMeta, REACTIONS } from "@/lib/likes";
import { fetchPostById } from "@/lib/posts";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ReactionType, User } from "@/lib/types";

type Liker = User & { reaction: ReactionType };

const ALL_TAB = "all";

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
  const [tab, setTab] = useState<string>(ALL_TAB);

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
      setError(getErrorMessage(err, "Could not load reactions."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Reaction types actually present, in canonical REACTIONS order, each with
  // its count — this drives the LinkedIn-style filter tabs.
  const reactionTabs = useMemo(() => {
    const counts = new Map<ReactionType, number>();
    for (const liker of likers) {
      counts.set(liker.reaction, (counts.get(liker.reaction) ?? 0) + 1);
    }
    return REACTIONS.filter((reaction) => counts.has(reaction.type)).map(
      (reaction) => ({ ...reaction, count: counts.get(reaction.type) ?? 0 }),
    );
  }, [likers]);

  const filtered = useMemo(() => {
    if (tab === ALL_TAB) return likers;
    return likers.filter((liker) => liker.reaction === tab);
  }, [likers, tab]);

  const hasReactions = likers.length > 0;

  return (
    <AppShell noPadding>
      <PageHeader title="Reactions" backHref="/feed" />

      {!loading && !error && !missingPost && hasReactions && (
        <Tabs
          value={tab}
          onValueChange={setTab}
          variant="underline"
          className="border-b"
        >
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none bg-transparent px-3">
            <TabsTrigger value={ALL_TAB} className="gap-1.5 px-3">
              All
              <span className="tabular-nums text-muted-foreground">
                {likers.length}
              </span>
            </TabsTrigger>
            {reactionTabs.map((reaction) => (
              <TabsTrigger
                key={reaction.type}
                value={reaction.type}
                className="gap-1.5 px-3"
                aria-label={`${reaction.label} ${reaction.count}`}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-xs leading-none",
                    reaction.bg,
                  )}
                  aria-hidden
                >
                  {reaction.emoji}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {reaction.count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

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

        {!loading && !error && !missingPost && !hasReactions && (
          <Empty className="py-12">
            <EmptyContent>
              <EmptyTitle>No reactions yet</EmptyTitle>
              <EmptyDescription>
                Be the first to react to this post.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        )}

        {filtered.map((user) => {
          const meta = getReactionMeta(user.reaction);
          return (
            <UserListItem
              key={user.id}
              user={user}
              subtitle={user.bio?.trim() || `@${user.username}`}
              action={
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-lg",
                    meta.bg,
                  )}
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
