"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Newspaper,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { getArticleExcerpt, getReadTimeMinutes } from "@/lib/articles";
import { ProfileTrigger } from "@/components/profile-trigger";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { Post } from "@/lib/types";
import {
  feedCardClass,
  feedCardContentClass,
  feedCardFooterClass,
  feedCardHeaderClass,
} from "@/lib/feed-layout";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

type ArticleCardProps = {
  post: Post;
  showActions?: boolean;
};

export function ArticleCard({ post, showActions = true }: ArticleCardProps) {
  const readTime = getReadTimeMinutes(post.content);
  const excerpt = getArticleExcerpt(post.content);

  return (
    <Card padding="none" className={feedCardClass}>
      <CardHeader className={feedCardHeaderClass}>
        <UserAvatar
          src={post.author.avatar}
          name={post.author.name}
          userId={post.author.id}
        />
        <div className="min-w-0 flex-1">
          <ProfileTrigger
            userId={post.author.id}
            className="font-semibold hover:underline"
          >
            {post.author.name}
          </ProfileTrigger>
          <p className="text-sm text-muted-foreground">
            @{post.author.username} · {post.createdAt}
          </p>
        </div>
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" iconOnly>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/articles/${post.id}`}>View article</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toast.custom((t) => (
                    <Alert variant="success">
                      <AlertTitle>Article saved to bookmarks</AlertTitle>
                      <AlertDescription>
                        You have saved the article to your bookmarks.
                      </AlertDescription>
                    </Alert>
                  ))
                }
              >
                <Bookmark className="size-4" />
                Save article
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" asChild>
                <Link href={`/report/${post.id}`}>Report</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className={feedCardContentClass}>
        <Link href={`/articles/${post.id}`} className="group block space-y-3">
          {post.image && (
            <div className="relative aspect-[2/1] overflow-hidden rounded-lg bg-muted">
              <Image
                src={post.image}
                alt={post.title ?? "Article cover"}
                fill
                unoptimized={post.image.includes("/storage/v1/object/public/")}
                className="object-cover transition-transform group-hover:scale-[1.01]"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          )}

          <div className="space-y-2">
            <Badge variant="outline" theme="amber" size="md">
              <Newspaper className="size-3.5" />
              Article · {readTime} min read
            </Badge>
            <h3 className="text-lg font-bold leading-snug group-hover:underline">
              {post.title || "Untitled article"}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {excerpt}
            </p>
          </div>
        </Link>
      </CardContent>

      <CardFooter className={cn(feedCardFooterClass, "border-t")}>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(post.isLiked && "text-destructive")}
            asChild
          >
            <Link href={`/post/${post.id}/likes`}>
              <Heart className={cn("size-4", post.isLiked && "fill-current")} />
              {post.likes}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/post/${post.id}/comments`}>
              <MessageCircle className="size-4" />
              {post.comments}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              toast.custom((t) => (
                <Alert variant="success">
                  <AlertTitle>Link copied to clipboard</AlertTitle>
                  <AlertDescription>
                    You have copied the link to the article to your clipboard.
                  </AlertDescription>
                </Alert>
              ))
            }
          >
            <Share2 className="size-4" />
            {post.shares}
          </Button>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/articles/${post.id}`}>Read more</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
