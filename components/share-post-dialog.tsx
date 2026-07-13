"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Link2, Search } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { UserListItem } from "@/components/user-list-item";
import { Alert, AlertContent, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { appToast } from "@/lib/app-toast";
import { getErrorMessage } from "@/lib/errors";
import { fetchFollowing } from "@/lib/follows";
import { fetchSuggestedProfiles, searchProfiles } from "@/lib/profile";
import { sharePostWithUsers } from "@/lib/shares";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

type SharePostDialogProps = {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sharePath?: string;
  onShared?: (sharesCount: number) => void;
};

export function SharePostDialog({
  postId,
  open,
  onOpenChange,
  sharePath,
  onShared,
}: SharePostDialogProps) {
  const { user } = useCurrentUser();
  const [people, setPeople] = useState<User[]>([]);
  const [listMode, setListMode] = useState<"following" | "suggested">(
    "following",
  );
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPeople = useCallback(
    async (search: string) => {
      if (!user) {
        setPeople([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        if (search.trim()) {
          const results = await searchProfiles(supabase, search, {
            excludeUserId: user.id,
            limit: 30,
          });
          setPeople(results);
          setListMode("following");
          return;
        }

        const following = await fetchFollowing(supabase, user.id, {
          limit: 40,
        });

        if (following.length > 0) {
          setPeople(following);
          setListMode("following");
          return;
        }

        const suggested = await fetchSuggestedProfiles(supabase, {
          excludeUserId: user.id,
          limit: 20,
        });
        setPeople(suggested);
        setListMode("suggested");
      } catch (err) {
        setError(getErrorMessage(err, "Could not load people."));
        setPeople([]);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIds(new Set());
    void loadPeople("");
  }, [open, loadPeople]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      void loadPeople(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open, loadPeople]);

  function toggleUser(userId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleCopyLink() {
    const path = sharePath ?? `/feed`;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`
        : path;

    try {
      await navigator.clipboard?.writeText(url);
      appToast.success("Link copied", "Post link copied to clipboard.");
    } catch {
      appToast.error("Could not copy link");
    }
  }

  async function handleShare() {
    if (!user) {
      appToast.error("Sign in required", "Sign in to share this post.");
      return;
    }
    if (selectedIds.size === 0 || sharing) return;

    setSharing(true);
    try {
      const supabase = createClient();
      const result = await sharePostWithUsers(supabase, postId, user.id, [
        ...selectedIds,
      ]);
      onShared?.(result.sharesCount);
      appToast.success(
        "Post shared",
        `Shared with ${result.sharedCount} ${result.sharedCount === 1 ? "person" : "people"}.`,
      );
      onOpenChange(false);
    } catch (err) {
      appToast.error(
        "Could not share post",
        getErrorMessage(err, "Please try again."),
      );
    } finally {
      setSharing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="md"
        className="flex max-h-[min(90vh,640px)] flex-col gap-4 overflow-hidden p-0"
      >
        <DialogHeader className="px-6 pt-5">
          <DialogTitle>Share post</DialogTitle>
          <DialogDescription>
            Choose people you follow to share this post with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people..."
              className="pl-9"
              autoComplete="off"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {query.trim()
              ? "Search results"
              : listMode === "following"
                ? "Following"
                : "Suggested people"}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {loading && (
            <div className="space-y-3 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <Alert variant="error" className="my-2 w-full max-w-none">
              <AlertContent>
                <AlertDescription>{error}</AlertDescription>
              </AlertContent>
            </Alert>
          )}

          {!loading && !error && people.length === 0 && (
            <Empty className="py-10">
              <EmptyContent>
                <EmptyTitle>No people found</EmptyTitle>
                <EmptyDescription>
                  Follow someone first, or search by name/username.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          )}

          <div className="divide-y">
            {people.map((person) => {
              const selected = selectedIds.has(person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  className={cn(
                    "w-full text-left transition-colors hover:bg-muted/50",
                    selected && "bg-muted/40",
                  )}
                  onClick={() => toggleUser(person.id)}
                >
                  <UserListItem
                    user={person}
                    action={
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleUser(person.id)}
                        aria-label={`Select ${person.name}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                  />
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t px-6 py-4 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleCopyLink()}
          >
            <Link2 className="size-4" />
            Copy link
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selectedIds.size === 0 || sharing}
              loading={sharing}
              onClick={() => void handleShare()}
            >
              <Check className="size-4" />
              Share
              {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
