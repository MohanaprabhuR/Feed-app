"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { Heart, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { comments, getPostById } from "@/lib/mock-data";

export default function CommentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const post = getPostById(id);

  if (!post) notFound();

  return (
    <AppShell noPadding className="flex flex-col">
      <PageHeader title="Comments" backHref="/feed" />
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-3">
            <div className="flex gap-3">
              <UserAvatar
                src={comment.author.avatar}
                name={comment.author.name}
                size="sm"
                userId={comment.author.id}
              />
              <div className="flex-1 rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">{comment.author.name}</p>
                <p className="mt-1 text-sm">{comment.content}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{comment.createdAt}</span>
                  <button type="button" className="hover:text-foreground">
                    Reply
                  </button>
                  <button type="button" className="flex items-center gap-1 hover:text-foreground">
                    <Heart className="size-3" />
                    {comment.likes}
                  </button>
                </div>
              </div>
            </div>
            {comment.replies?.map((reply) => (
              <div key={reply.id} className="ml-10 flex gap-3">
                <UserAvatar
                  src={reply.author.avatar}
                  name={reply.author.name}
                  size="sm"
                  userId={reply.author.id}
                />
                <div className="flex-1 rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">{reply.author.name}</p>
                  <p className="mt-1 text-sm">{reply.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {reply.createdAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="sticky bottom-16 border-t bg-background p-4 md:bottom-0">
        <div className="flex gap-2">
          <Input placeholder="Write a comment..." className="flex-1" />
          <Button size="sm" iconOnly>
            <Send />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
