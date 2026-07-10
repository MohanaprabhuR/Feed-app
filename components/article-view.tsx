"use client";

import Link from "next/link";
import Image from "next/image";
import { Newspaper } from "lucide-react";
import { getReadTimeMinutes } from "@/lib/articles";
import { ProfileTrigger } from "@/components/profile-trigger";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import type { Post } from "@/lib/types";
import { feedCardClass, feedCardSectionClass } from "@/lib/feed-layout";
import { cn } from "@/lib/utils";

type ArticleViewProps = {
  article: Post;
};

export function ArticleView({ article }: ArticleViewProps) {
  const readTime = getReadTimeMinutes(article.content);

  return (
    <Card padding="none" className={cn(feedCardClass, "mx-auto max-w-3xl border-0 shadow-none")}>
      <CardContent className={cn(feedCardSectionClass, "py-6")}>
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
              @{article.author.username} · {article.createdAt} · {readTime} min
              read
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
          <div className="relative mt-6 aspect-[2/1] overflow-hidden rounded-xl bg-muted">
            <Image
              src={article.image}
              alt={article.title ?? "Article cover"}
              fill
              unoptimized={article.image.includes("/storage/v1/object/public/")}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        <div className="mt-8 space-y-4">
          {article.content.split("\n").map((paragraph, index) =>
            paragraph.trim() ? (
              <p key={index} className="text-base leading-8 text-foreground">
                {paragraph}
              </p>
            ) : (
              <div key={index} className="h-4" />
            )
          )}
        </div>

        <Separator className="my-10" />

        <Button variant="ghost" asChild>
          <Link href="/feed">← Back to feed</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
