"use client";

import Image from "next/image";
import { Newspaper } from "lucide-react";
import { getReadTimeMinutes } from "@/lib/articles";
import { ProfileTrigger } from "@/components/profile-trigger";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import type { Post } from "@/lib/types";
import { RichContent } from "@/components/rich-content";

type ArticleViewDialogProps = {
  article: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ArticleViewDialog({
  article,
  open,
  onOpenChange,
}: ArticleViewDialogProps) {
  const readTime = getReadTimeMinutes(article.content);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        className="max-h-[min(92vh,820px)] gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogTitle className="sr-only">
          {article.title || "Untitled article"}
        </DialogTitle>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <Item size="sm" className="mb-6 p-0">
            <UserAvatar
              src={article.author.avatar}
              name={article.author.name}
              userId={article.author.id}
              size="sm"
            />
            <ItemContent>
              <ItemTitle>
                <ProfileTrigger
                  userId={article.author.id}
                  className="hover:underline"
                >
                  {article.author.name}
                </ProfileTrigger>
              </ItemTitle>
              <ItemDescription>
                @{article.author.username} · {article.createdAt} ·{" "}
                {readTime} min read
              </ItemDescription>
            </ItemContent>
          </Item>

          <Badge variant="outline" theme="amber" size="md" className="mb-3">
            <Newspaper className="size-3.5" />
            Article
          </Badge>

          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            {article.title || "Untitled article"}
          </h1>

          {article.image && (
            <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl bg-muted">
              <Image
                src={article.image}
                alt={article.title ?? "Article cover"}
                fill
                unoptimized={article.image.includes(
                  "/storage/v1/object/public/",
                )}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent" />
            </div>
          )}

          <RichContent
            content={article.content}
            className="mt-8 text-base leading-8 text-foreground sm:text-[17px]"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
