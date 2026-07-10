"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  FileText,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { ProfileTrigger } from "@/components/profile-trigger";
import { UserAvatar } from "@/components/user-avatar";
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
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";

type PostCardProps = {
  post: Post;
  showActions?: boolean;
};

export function PostCard({ post, showActions = true }: PostCardProps) {
  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
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
                <Link href={`/edit/${post.id}`}>Edit post</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.success("Post saved to bookmarks")}
              >
                <Bookmark className="size-4" />
                Save post
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" asChild>
                <Link href={`/report/${post.id}`}>Report post</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        <p className="text-sm leading-relaxed">{post.content}</p>
        {post.video ? (
          <video
            src={post.video}
            controls
            playsInline
            className="aspect-video w-full rounded-lg bg-black"
          />
        ) : post.file ? (
          <Item asChild variant="outline" size="sm">
            <a href={post.file.url} target="_blank" rel="noopener noreferrer">
              <ItemMedia variant="icon">
                <FileText className="text-violet-primary" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{post.file.name}</ItemTitle>
                <ItemDescription>Download attachment</ItemDescription>
              </ItemContent>
            </a>
          </Item>
        ) : post.image ? (
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <Image
              src={post.image}
              alt="Post image"
              fill
              unoptimized={post.image.includes("/storage/v1/object/public/")}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t px-4 py-2">
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
            onClick={() => toast.success("Link copied to clipboard")}
          >
            <Share2 className="size-4" />
            {post.shares}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          className={cn(post.isSaved && "text-primary")}
          onClick={() => toast.success("Post saved")}
        >
          <Bookmark className={cn("size-4", post.isSaved && "fill-current")} />
        </Button>
      </CardFooter>
    </Card>
  );
}
