"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserListItem } from "@/components/user-list-item";
import { UserListSkeleton } from "@/components/skeletons";
import { Alert, AlertContent, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import { fetchLikers, getReactionMeta, REACTIONS } from "@/lib/likes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { ReactionType, User } from "@/lib/types";

type Liker = User & { reaction: ReactionType };

const ALL_TAB = "all";

type ReactionsDialogProps = {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReactionsDialog({
  postId,
  open,
  onOpenChange,
}: ReactionsDialogProps) {
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>(ALL_TAB);

  // Fetch reactors only when the dialog opens; reset tab each time.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect -- reset state on open */
    setLoading(true);
    setError(null);
    setTab(ALL_TAB);
    /* eslint-enable react-hooks/set-state-in-effect */

    void (async () => {
      try {
        const supabase = createClient();
        const data = await fetchLikers(supabase, postId);
        if (!cancelled) setLikers(data);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Could not load reactions."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, postId]);

  // Reaction types present, in canonical order, each with its count.
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="md"
        className="flex h-[min(72vh,420px)] max-h-[min(80vh,480px)] flex-col gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="shrink-0 border-b px-4 py-3 pr-12">
          <DialogTitle>Reactions</DialogTitle>
        </DialogHeader>

        {/* Fixed tab-row height so loading → loaded doesn't jump */}
        <div className="flex h-11 shrink-0 items-center border-b">
          {loading ? (
            <div className="flex w-full items-center gap-2 px-3">
              <Skeleton className="h-7 w-14 rounded-md" />
              <Skeleton className="h-7 w-12 rounded-md" />
              <Skeleton className="h-7 w-12 rounded-md" />
            </div>
          ) : !error && hasReactions ? (
            <Tabs
              value={tab}
              onValueChange={setTab}
              variant="underline"
              className="w-full"
            >
              <TabsList className="h-11 w-full justify-start gap-1 overflow-x-auto rounded-none bg-transparent px-3">
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
          ) : null}
        </div>

        <div className="min-h-0 flex-1 divide-y overflow-y-auto px-4">
          {loading && <UserListSkeleton count={3} className="px-0" />}

          {error && (
            <Alert variant="error" className="my-4 w-full max-w-none">
              <AlertContent>
                <AlertDescription>{error}</AlertDescription>
              </AlertContent>
            </Alert>
          )}

          {!loading && !error && !hasReactions && (
            <p className="px-1 py-10 text-center text-sm text-muted-foreground">
              No reactions yet. Be the first to react.
            </p>
          )}

          {!loading &&
            !error &&
            filtered.map((user) => {
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
      </DialogContent>
    </Dialog>
  );
}
