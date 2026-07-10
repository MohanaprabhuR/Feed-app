"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import { Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currentUser, getConversationById, messages } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const conversation = getConversationById(id);
  const chatMessages = messages[id];

  if (!conversation || !chatMessages) notFound();

  return (
    <AppShell noPadding className="flex flex-col">
      <PageHeader
        title={conversation.user.name}
        backHref="/messages"
        action={
          <UserAvatar
            src={conversation.user.avatar}
            name={conversation.user.name}
            size="sm"
            userId={conversation.user.id}
          />
        }
      />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {chatMessages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div
              key={msg.id}
              className={cn("flex", isMe ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p>{msg.content}</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {msg.createdAt}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="sticky bottom-16 border-t bg-background p-4 md:bottom-0">
        <div className="flex gap-2">
          <Input placeholder="Type a message..." className="flex-1" />
          <Button size="sm" iconOnly>
            <Send />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
