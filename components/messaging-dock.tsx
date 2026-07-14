"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  MoreHorizontal,
  Paperclip,
  Search,
  Send,
  Settings2,
  Smile,
  SquarePen,
} from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useMessaging } from "@/components/messaging-provider";
import { CurrentUserAvatar, UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ConversationListSkeleton,
  MessageThreadSkeleton,
} from "@/components/skeletons";
import { appToast } from "@/lib/app-toast";
import { getErrorMessage } from "@/lib/errors";
import {
  fetchConversations,
  fetchMessages,
  getOrCreateDirectConversation,
  messageRowToMessage,
  sendMessage,
  subscribeToConversationMessages,
  subscribeToInboxMessages,
  type DirectMessageRow,
} from "@/lib/messages";
import { fetchSuggestedProfiles } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, Message, User } from "@/lib/types";
import { cn } from "@/lib/utils";

const hiddenOnRoutes = [
  "/splash",
  "/welcome",
  "/login",
  "/register",
  "/forgot-password",
  "/logout",
];

export function MessagingDock() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useCurrentUser();
  const userId = user?.id;
  const {
    expanded,
    conversationId,
    pendingPeerUserId,
    openMessaging,
    clearPendingPeer,
    setExpanded,
    openConversation,
    closeConversation,
  } = useMessaging();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState("focused");
  const [conversationList, setConversationList] = useState<Conversation[]>([]);
  const [threadMessages, setThreadMessages] = useState<
    Record<string, Message[]>
  >({});
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [people, setPeople] = useState<User[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!userId) {
      setConversationList([]);
      return;
    }

    setLoadingList(true);
    try {
      const supabase = createClient();
      const data = await fetchConversations(supabase, userId);
      setConversationList(data);
      setSetupError(null);
    } catch (err) {
      setConversationList([]);
      setSetupError(getErrorMessage(err, "Could not load conversations."));
    } finally {
      setLoadingList(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!pathname.startsWith("/messages")) return;

    const parts = pathname.split("/").filter(Boolean);
    const id = parts.length > 1 ? parts[1] : null;
    openMessaging(id);
    router.replace("/feed");
  }, [pathname, openMessaging, router]);

  /* eslint-disable react-hooks/set-state-in-effect -- refresh inbox/thread when dock opens */
  useEffect(() => {
    if (!expanded || !userId) return;
    void loadConversations();
  }, [expanded, userId, loadConversations]);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!expanded || !userId || !pendingPeerUserId) return;

    let cancelled = false;

    async function openPeerChat() {
      try {
        const supabase = createClient();
        const id = await getOrCreateDirectConversation(
          supabase,
          pendingPeerUserId!,
        );
        if (cancelled) return;
        clearPendingPeer();
        openConversation(id);
        await loadConversations();
      } catch (err) {
        if (cancelled) return;
        clearPendingPeer();
        appToast.error(
          "Could not open chat",
          getErrorMessage(err, "Messaging is unavailable."),
        );
      }
    }

    void openPeerChat();
    return () => {
      cancelled = true;
    };
  }, [
    expanded,
    userId,
    pendingPeerUserId,
    clearPendingPeer,
    openConversation,
    loadConversations,
  ]);

  useEffect(() => {
    if (!conversationId || !userId) return;

    let cancelled = false;

    async function loadThread() {
      setLoadingThread(true);
      try {
        const supabase = createClient();
        const messages = await fetchMessages(supabase, conversationId!);
        if (cancelled) return;
        setThreadMessages((current) => ({
          ...current,
          [conversationId!]: messages,
        }));
      } catch (err) {
        if (cancelled) return;
        appToast.error(
          "Could not load messages",
          getErrorMessage(err, "Try again."),
        );
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    }

    void loadThread();

    const supabase = createClient();
    const unsubscribe = subscribeToConversationMessages(
      supabase,
      conversationId,
      (message) => {
        setThreadMessages((current) => {
          const existing = current[conversationId] ?? [];
          if (existing.some((item) => item.id === message.id)) {
            return current;
          }
          return {
            ...current,
            [conversationId]: [...existing, message],
          };
        });
        setConversationList((current) => {
          const next = current.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  lastMessage: message.content,
                  lastMessageAt: message.createdAt,
                  unread: 0,
                }
              : conv,
          );
          const active = next.find((conv) => conv.id === conversationId);
          if (!active) return next;
          return [active, ...next.filter((conv) => conv.id !== conversationId)];
        });
      },
    );

    const poll = window.setInterval(() => {
      void (async () => {
        try {
          const latest = await fetchMessages(supabase, conversationId);
          setThreadMessages((current) => {
            const existing = current[conversationId] ?? [];
            if (
              existing.length === latest.length &&
              existing.every((msg, i) => msg.id === latest[i]?.id)
            ) {
              return current;
            }
            return { ...current, [conversationId]: latest };
          });
        } catch {
          // Keep chat usable if polling fails (realtime may still work).
        }
      })();
    }, 4000);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearInterval(poll);
    };
  }, [conversationId, userId]);

  useEffect(() => {
    if (!expanded || !userId) return;

    const supabase = createClient();
    const unsubscribe = subscribeToInboxMessages(
      supabase,
      (row: DirectMessageRow) => {
        const message = messageRowToMessage(row);
        setConversationList((current) => {
          const existing = current.find((conv) => conv.id === row.conversation_id);
          if (!existing) {
            void loadConversations();
            return current;
          }
          const updated = {
            ...existing,
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
            unread:
              row.sender_id === userId || row.conversation_id === conversationId
                ? 0
                : existing.unread + 1,
          };
          return [
            updated,
            ...current.filter((conv) => conv.id !== row.conversation_id),
          ];
        });
      },
    );

    return () => {
      unsubscribe();
    };
  }, [expanded, userId, conversationId, loadConversations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = conversationList.filter((conv) => {
      if (!q) return true;
      return (
        conv.user.name.toLowerCase().includes(q) ||
        conv.lastMessage.toLowerCase().includes(q)
      );
    });
    if (tab === "other") {
      return list.filter((conv) => conv.unread === 0);
    }
    return list;
  }, [conversationList, query, tab]);

  const conversation = conversationId
    ? conversationList.find((c) => c.id === conversationId)
    : undefined;
  const chatMessages = conversationId
    ? (threadMessages[conversationId] ?? [])
    : [];

  useEffect(() => {
    if (!conversationId || !expanded) return;
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationId, expanded, chatMessages.length]);

  async function handleSend() {
    if (!conversationId || !userId || sending) return;
    const content = draft.trim();
    if (!content) return;

    setSending(true);
    setDraft("");

    try {
      const supabase = createClient();
      const saved = await sendMessage(
        supabase,
        conversationId,
        userId,
        content,
      );
      setThreadMessages((current) => ({
        ...current,
        [conversationId]: [...(current[conversationId] ?? []), saved],
      }));
      setConversationList((current) =>
        current.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                lastMessage: saved.content,
                lastMessageAt: saved.createdAt,
                unread: 0,
              }
            : conv,
        ),
      );
    } catch (err) {
      setDraft(content);
      appToast.error(
        "Message not sent",
        getErrorMessage(err, "Could not save your message."),
      );
    } finally {
      setSending(false);
    }
  }

  function selectConversation(id: string) {
    setDraft("");
    setComposeOpen(false);
    openConversation(id);
  }

  async function openCompose() {
    if (!userId) {
      appToast.error("Sign in required", "Sign in to start a chat.");
      return;
    }
    openMessaging();
    setComposeOpen(true);
    closeConversation();
    try {
      const supabase = createClient();
      const suggested = await fetchSuggestedProfiles(supabase, {
        excludeUserId: userId,
        limit: 12,
      });
      setPeople(suggested);
    } catch {
      setPeople([]);
    }
  }

  async function startChatWith(peer: User) {
    if (!userId) return;
    try {
      const supabase = createClient();
      const id = await getOrCreateDirectConversation(supabase, peer.id);
      setComposeOpen(false);
      await loadConversations();
      openConversation(id);
    } catch (err) {
      appToast.error(
        "Could not start chat",
        getErrorMessage(err, "Messaging is unavailable."),
      );
    }
  }

  if (hiddenOnRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-50 flex flex-col border bg-background shadow-2xl",
        "bottom-14 md:bottom-0 md:inset-x-auto md:right-4 md:border-b-0",
        conversation && expanded ? "md:w-[420px]" : "md:w-[360px]",
        expanded ? "h-[min(78vh,640px)] md:rounded-t-xl" : "h-12 md:rounded-t-xl",
      )}
    >
      {/* List / dock chrome — hide when in WhatsApp-style chat */}
      {!(conversation && expanded) && (
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => {
            if (expanded) {
              setExpanded(false);
              closeConversation();
            } else {
              openMessaging();
            }
          }}
        >
          <span className="relative shrink-0">
            <CurrentUserAvatar size="sm" />
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
          </span>
          <span className="truncate text-sm font-semibold">Messaging</span>
        </button>
        <Button type="button" variant="ghost" size="sm" iconOnly aria-label="More">
          <MoreHorizontal />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Compose"
          onClick={() => void openCompose()}
        >
          <SquarePen />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={expanded ? "Minimize messaging" : "Expand messaging"}
          onClick={() => {
            if (expanded) {
              setExpanded(false);
              closeConversation();
            } else {
              openMessaging();
            }
          }}
        >
          {expanded ? <ChevronDown /> : <ChevronUp />}
        </Button>
      </div>
      )}

      {expanded && (
        <>
          {conversation ? (
            <div className="flex min-h-0 flex-1 flex-col bg-[#efeae2] dark:bg-zinc-900">
              {/* WhatsApp-style chat header */}
              <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/5 bg-background px-1.5 shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label="Back to conversations"
                  onClick={closeConversation}
                >
                  <ChevronLeft />
                </Button>
                <UserAvatar
                  src={conversation.user.avatar}
                  name={conversation.user.name}
                  size="sm"
                  userId={conversation.user.id}
                />
                <div className="min-w-0 flex-1 px-1">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {conversation.user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    tap for contact info
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label="More"
                >
                  <MoreHorizontal />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label="Minimize"
                  onClick={() => {
                    setExpanded(false);
                    closeConversation();
                  }}
                >
                  <ChevronDown />
                </Button>
              </div>

              {/* Chat wallpaper + bubbles */}
              <div
                className="relative flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--foreground) 8%, transparent) 1px, transparent 0)",
                  backgroundSize: "18px 18px",
                }}
              >
                {loadingThread && chatMessages.length === 0 && (
                  <MessageThreadSkeleton className="px-1" />
                )}
                {chatMessages.map((msg, index) => {
                  const isMe =
                    msg.senderId === "me" ||
                    Boolean(user?.id && msg.senderId === user.id);
                  const next = chatMessages[index + 1];
                  const nextIsMe =
                    next &&
                    (next.senderId === "me" ||
                      Boolean(user?.id && next.senderId === user.id));
                  // WhatsApp: avatar only on the last bubble in a consecutive streak
                  const showAvatar = !next || nextIsMe !== isMe;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex items-end gap-1.5",
                        isMe ? "justify-end" : "justify-start",
                      )}
                    >
                      {!isMe && (
                        <span className="mb-0.5 flex size-7 shrink-0 items-end justify-center">
                          {showAvatar ? (
                            <UserAvatar
                              src={conversation.user.avatar}
                              name={conversation.user.name}
                              size="sm"
                              className="!size-7"
                            />
                          ) : null}
                        </span>
                      )}
                      <div
                        className={cn(
                          "max-w-[78%] px-3 py-2 text-sm leading-relaxed shadow-sm",
                          isMe
                            ? "rounded-2xl rounded-br-md bg-foreground text-background"
                            : "rounded-2xl rounded-bl-md bg-background text-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap wrap-break-word">
                          {msg.content}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-right text-[11px] leading-none",
                            isMe
                              ? "text-background/60"
                              : "text-muted-foreground",
                          )}
                        >
                          {msg.createdAt}
                        </p>
                      </div>
                      {isMe && (
                        <span className="mb-0.5 flex size-7 shrink-0 items-end justify-center">
                          {showAvatar ? (
                            <CurrentUserAvatar
                              size="sm"
                              className="!size-7"
                            />
                          ) : null}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* WhatsApp-style composer */}
              <div className="shrink-0 border-t border-black/5 bg-background/95 px-2 py-2 backdrop-blur">
                <form
                  className="flex items-end gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSend();
                  }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    iconOnly
                    className="mb-0.5 shrink-0 text-muted-foreground"
                    aria-label="Emoji"
                  >
                    <Smile />
                  </Button>
                  <div className="flex min-h-10 flex-1 items-center gap-1 rounded-full border bg-muted/40 px-1.5">
                    <Input
                      placeholder="Type a message"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                      size="sm"
                      autoComplete="off"
                      disabled={sending}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      className="shrink-0 text-muted-foreground"
                      aria-label="Attach"
                    >
                      <Paperclip />
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    iconOnly
                    aria-label="Send"
                    disabled={!draft.trim() || sending}
                    loading={sending}
                    className="mb-0.5 size-10 shrink-0 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
                  >
                    <Send className="size-4" />
                  </Button>
                </form>
              </div>
            </div>
          ) : conversationId ? (
            <div className="flex min-h-0 flex-1 flex-col p-3">
              <MessageThreadSkeleton />
            </div>
          ) : composeOpen ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setComposeOpen(false)}
                >
                  Cancel
                </Button>
                <p className="text-sm font-semibold">New message</p>
              </div>
              <div className="min-h-0 flex-1 divide-y overflow-y-auto">
                {people.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No people to message yet.
                  </p>
                ) : (
                  people.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => void startChatWith(person)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted/50"
                    >
                      <UserAvatar
                        src={person.avatar}
                        name={person.name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {person.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          @{person.username}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {setupError && (
                <p className="border-b px-3 py-2 text-xs text-destructive">
                  {setupError}
                </p>
              )}
              <div className="flex items-center gap-2 px-3 pt-3">
                <Input
                  type="search"
                  size="sm"
                  placeholder="Search messages"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  prefix={<Search className="size-4 text-muted-foreground" />}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label="Filter messages"
                >
                  <Settings2 />
                </Button>
              </div>

              <Tabs
                value={tab}
                onValueChange={setTab}
                variant="underline"
                className="mt-2 flex min-h-0 flex-1 flex-col gap-0"
              >
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-3">
                  <TabsTrigger value="focused" className="px-3">
                    Focused
                  </TabsTrigger>
                  <TabsTrigger value="other" className="px-3">
                    Other
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="focused"
                  className="mt-0 min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
                >
                  <ConversationList
                    items={filtered}
                    loading={loadingList}
                    onSelect={selectConversation}
                  />
                </TabsContent>
                <TabsContent
                  value="other"
                  className="mt-0 min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
                >
                  <ConversationList
                    items={filtered}
                    loading={loadingList}
                    onSelect={selectConversation}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ConversationList({
  items,
  loading,
  onSelect,
}: {
  items: Conversation[];
  loading?: boolean;
  onSelect: (id: string) => void;
}) {
  if (loading) {
    return <ConversationListSkeleton count={5} />;
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        No conversations yet. Tap compose to start one.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {items.map((conv) => (
        <button
          key={conv.id}
          type="button"
          onClick={() => onSelect(conv.id)}
          className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50"
        >
          <span className="relative shrink-0">
            <UserAvatar
              src={conv.user.avatar}
              name={conv.user.name}
              size="sm"
            />
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold">{conv.user.name}</p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {conv.lastMessageAt}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <p className="truncate text-sm text-muted-foreground">
                {conv.lastMessage}
              </p>
              {conv.unread > 0 && (
                <Badge className="ml-auto shrink-0">{conv.unread}</Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
