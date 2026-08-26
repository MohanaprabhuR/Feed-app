"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  Check,
  CheckCheck,
  Download,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  SquarePen,
  X,
} from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { useNotifications } from "@/components/notifications-provider";
import { markConversationNotificationsRead } from "@/lib/notifications";
import { useMessaging } from "@/components/messaging-provider";
import { usePresence } from "@/components/presence-provider";
import { EmojiPickerButton } from "@/components/emoji-picker-button";
import { CurrentUserAvatar, UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/loader";
import { DownloadPngButton } from "@/components/download-png-button";
import { appToast } from "@/lib/app-toast";
import { fetchFollowing } from "@/lib/follows";
import { getErrorMessage } from "@/lib/errors";
import {
  fetchConversations,
  fetchMessages,
  fetchPeerLastReadAt,
  formatMessageDay,
  formatMessageTime,
  getMessageAttachment,
  getOrCreateDirectConversation,
  isMessageReadByPeer,
  isSameDay,
  markConversationRead,
  messagePreview,
  messageRowToMessage,
  sendMessage,
  subscribeToConversationMessages,
  subscribeToInboxMessages,
  subscribeToPeerReadReceipts,
  type DirectMessageRow,
} from "@/lib/messages";
import {
  CHAT_ATTACHMENT_ACCEPT,
  getAttachmentType,
  uploadPostAttachment,
  validatePostAttachment,
} from "@/lib/post-media";
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
  return <MessagingSurface mode="dock" />;
}

export function MessagingPagePanel() {
  return (
    <>
      <MessagingQueryRedirect />
      <MessagingSurface mode="page" />
    </>
  );
}

/** Redirect legacy `/messages?c=` links to `/messages/[id]`. */
function MessagingQueryRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== "/messages") return;
    const queryId = searchParams.get("c");
    if (queryId) {
      router.replace(`/messages/${queryId}`);
    }
  }, [pathname, router, searchParams]);

  return null;
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-2xs font-semibold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** WhatsApp-style ticks: single = sent, double blue = read by peer. */
function MessageReadTicks({ read }: { read: boolean }) {
  if (read) {
    return (
      <CheckCheck
        className="size-3.5 shrink-0 text-sky-400"
        aria-label="Read"
        strokeWidth={2.5}
      />
    );
  }
  return (
    <Check
      className="size-3.5 shrink-0 opacity-70"
      aria-label="Sent"
      strokeWidth={2.5}
    />
  );
}

function MessagingSurface({ mode }: { mode: "dock" | "page" }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMessagesRoute =
    pathname === "/messages" || pathname.startsWith("/messages/");
  // Both dock + page panels share the same Messaging context, so realtime
  // subscriptions must only run on the active surface.
  const shouldSubscribe =
    mode === "page" ? true : mode === "dock" && !isMessagesRoute;
  const { user, loading: userLoading } = useCurrentUser();
  const { isOnline } = usePresence();
  const { refreshUnreadCount: refreshNotifications } = useNotifications();
  const userId = user?.id;
  const {
    expanded,
    conversationId,
    pendingPeerUserId,
    openMessaging,
    clearPendingPeer,
    closeMessaging,
    setExpanded,
    openConversation,
    closeConversation,
  } = useMessaging();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
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
  const [threadNotFound, setThreadNotFound] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  // Fullscreen viewer for a tapped chat image.
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);
  const [threadRetry, setThreadRetry] = useState(0);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

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
      // Keep whatever is already shown; wiping to [] on a transient failure is
      // what makes the list intermittently flash "No conversations yet".
      setSetupError(getErrorMessage(err, "Could not load conversations."));
    } finally {
      setLoadingList(false);
    }
  }, [userId]);

  const clearUnread = useCallback((id: string) => {
    setConversationList((current) =>
      current.map((conv) =>
        conv.id === id && conv.unread > 0 ? { ...conv, unread: 0 } : conv,
      ),
    );
  }, []);

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return;
      clearUnread(id);
      const supabase = createClient();

      // Clear this chat's message notification from the nav bell badge — done
      // independently so a missing conversation read-policy can't block it.
      void markConversationNotificationsRead(supabase, id, userId)
        .then(() => refreshNotifications())
        .catch(() => {});

      try {
        await markConversationRead(supabase, id, userId);
      } catch (err) {
        setSetupError(
          getErrorMessage(
            err,
            "Unread state may not persist until messaging read policy is applied.",
          ),
        );
      }
    },
    [clearUnread, userId, refreshNotifications],
  );

  useEffect(() => {
    if (mode !== "page") return;

    const parts = pathname.split("/").filter(Boolean);
    const pathId = parts.length > 1 ? parts[1] : null;
    openMessaging(pathId);
  }, [mode, openMessaging, pathname]);

  useEffect(() => {
    if (mode !== "page") return;
    return () => {
      setComposeOpen(false);
      closeConversation();
      setExpanded(false);
    };
  }, [closeConversation, mode, setExpanded]);

  /* eslint-disable react-hooks/set-state-in-effect -- refresh inbox when panel opens or dock mounts */
  useEffect(() => {
    if (!userId) {
      // While the current user is still resolving, userId is transiently
      // undefined — do NOT tear down here. Collapsing the surface (closeMessaging)
      // would set expanded=false, and once the user resolves nothing re-opens it,
      // so loadConversations never runs and the list shows "No conversations yet".
      // Only reset on an actual logged-out state.
      if (userLoading) return;
      setConversationList([]);
      setThreadMessages({});
      setComposeOpen(false);
      setPeople([]);
      setDraft("");
      setQuery("");
      setSetupError(null);
      setThreadNotFound(false);
      setThreadError(null);
      closeMessaging();
      return;
    }
    if (mode === "dock" || expanded) {
      void loadConversations();
    }
  }, [expanded, userId, userLoading, loadConversations, mode, closeMessaging]);
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
        await loadConversations();
        if (cancelled) return;
        openConversation(id);
        if (mode === "page") {
          router.push(`/messages/${id}`);
        }
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
    mode,
    router,
  ]);

  useEffect(() => {
    if (!shouldSubscribe || !conversationId || !userId) return;

    let cancelled = false;

    async function loadThread() {
      setLoadingThread(true);
      setThreadNotFound(false);
      setThreadError(null);
      try {
        const supabase = createClient();
        const messages = await fetchMessages(supabase, conversationId!);
        if (cancelled) return;
        if (messages.length === 0) {
          const { count, error: countError } = await supabase
            .from("direct_messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conversationId!);
          if (countError) throw countError;
          if (count === 0) {
            // Empty thread is valid; only treat as missing when membership is gone.
            const { data: membership, error: membershipError } = await supabase
              .from("conversation_members")
              .select("conversation_id")
              .eq("conversation_id", conversationId!)
              .eq("user_id", userId!)
              .maybeSingle();
            if (membershipError) throw membershipError;
            if (!membership) {
              setThreadNotFound(true);
              return;
            }
          }
        }
        setThreadMessages((current) => ({
          ...current,
          [conversationId!]: messages,
        }));
        await markRead(conversationId!);
      } catch (err) {
        if (cancelled) return;
        setThreadError(getErrorMessage(err, "Could not load messages."));
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
        void markRead(conversationId);
      },
    );

    const poll = window.setInterval(() => {
      void (async () => {
        try {
          const latest = await fetchMessages(supabase, conversationId);
          let hasNewPeerMessage = false;
          setThreadMessages((current) => {
            const existing = current[conversationId] ?? [];
            if (
              existing.length === latest.length &&
              existing.every((msg, i) => msg.id === latest[i]?.id)
            ) {
              return current;
            }
            const existingIds = new Set(existing.map((msg) => msg.id));
            hasNewPeerMessage = latest.some(
              (msg) =>
                !existingIds.has(msg.id) &&
                msg.senderId !== userId &&
                msg.senderId !== "me",
            );
            return { ...current, [conversationId]: latest };
          });
          if (hasNewPeerMessage) {
            void markRead(conversationId);
          }
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
  }, [conversationId, userId, shouldSubscribe, markRead, threadRetry]);

  useEffect(() => {
    if (!shouldSubscribe || !userId) return;
    // Dock keeps listening while collapsed so the FAB unread badge stays live.
    if (mode === "page" && !expanded) return;

    const supabase = createClient();
    const unsubscribe = subscribeToInboxMessages(
      supabase,
      (row: DirectMessageRow) => {
        const message = messageRowToMessage(row);
        setConversationList((current) => {
          const existing = current.find(
            (conv) => conv.id === row.conversation_id,
          );
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

    const inboxPoll = window.setInterval(() => {
      void loadConversations();
    }, 20_000);

    return () => {
      unsubscribe();
      window.clearInterval(inboxPoll);
    };
  }, [
    expanded,
    userId,
    conversationId,
    loadConversations,
    shouldSubscribe,
    mode,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversationList.filter((conv) => {
      if (!q) return true;
      return (
        conv.user.name.toLowerCase().includes(q) ||
        conv.lastMessage.toLowerCase().includes(q)
      );
    });
  }, [conversationList, query]);

  const totalUnread = useMemo(
    () => conversationList.reduce((sum, conv) => sum + conv.unread, 0),
    [conversationList],
  );

  const conversation = conversationId
    ? conversationList.find((c) => c.id === conversationId)
    : undefined;
  const peerOnline = conversation ? isOnline(conversation.user.id) : false;
  const chatMessages = conversationId
    ? (threadMessages[conversationId] ?? [])
    : [];

  useEffect(() => {
    if (!shouldSubscribe || !conversationId || !conversation?.user.id) {
      return;
    }

    const peerId = conversation.user.id;
    let cancelled = false;
    const supabase = createClient();

    void fetchPeerLastReadAt(supabase, conversationId, peerId)
      .then((value) => {
        if (!cancelled) setPeerLastReadAt(value);
      })
      .catch(() => {
        if (!cancelled) setPeerLastReadAt(null);
      });

    const unsubscribe = subscribeToPeerReadReceipts(
      supabase,
      conversationId,
      peerId,
      (lastReadAt) => {
        setPeerLastReadAt((current) => {
          if (!current) return lastReadAt;
          return new Date(lastReadAt) > new Date(current) ? lastReadAt : current;
        });
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [shouldSubscribe, conversationId, conversation?.user.id]);

  useEffect(() => {
    if (!conversationId || !expanded) return;
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationId, expanded, chatMessages.length]);

  function appendSentMessage(saved: Message) {
    if (!conversationId) return;
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
  }

  async function handleSend() {
    if (!conversationId || !userId || sending) return;
    const content = draft.trim();
    const attachment = pendingAttachment;
    if (!content && !attachment) return;

    setSending(true);
    setDraft("");
    setPendingAttachment(null);

    let remainingAttachment = attachment;
    try {
      const supabase = createClient();
      // Send the staged image first (uploads on Send, not on pick), then text.
      if (attachment) {
        const { url } = await uploadPostAttachment(attachment.file);
        const savedImage = await sendMessage(
          supabase,
          conversationId,
          userId,
          url,
        );
        appendSentMessage(savedImage);
        URL.revokeObjectURL(attachment.previewUrl);
        remainingAttachment = null;
      }
      if (content) {
        const savedText = await sendMessage(
          supabase,
          conversationId,
          userId,
          content,
        );
        appendSentMessage(savedText);
      }
    } catch (err) {
      // Restore whatever didn't send so nothing is lost.
      setDraft(content);
      setPendingAttachment(remainingAttachment);
      appToast.error(
        "Message not sent",
        getErrorMessage(err, "Could not send your message."),
      );
    } finally {
      setSending(false);
    }
  }

  function handleEmojiSelect(emoji: string) {
    setDraft((current) => current + emoji);
    requestAnimationFrame(() => draftInputRef.current?.focus());
  }

  /** Stage an image in the composer — it's uploaded + sent on the Send button. */
  function handleAttach(file: File | undefined) {
    if (!file) return;
    const validationError = validatePostAttachment(file);
    if (validationError) {
      appToast.error("Can't attach file", validationError);
      return;
    }
    setPendingAttachment((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
    requestAnimationFrame(() => draftInputRef.current?.focus());
  }

  function clearPendingAttachment() {
    setPendingAttachment((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }

  function selectConversation(id: string) {
    setDraft("");
    clearPendingAttachment();
    setComposeOpen(false);
    clearUnread(id);
    openConversation(id);
    if (mode === "page") {
      router.push(`/messages/${id}`);
    }
  }

  async function openCompose() {
    if (!userId) {
      appToast.error("Sign in required", "Sign in to start a chat.");
      return;
    }
    openMessaging();
    setComposeOpen(true);
    closeConversation();
    if (mode === "page") {
      router.push("/messages");
    }
    try {
      const supabase = createClient();
      const following = await fetchFollowing(supabase, userId, {
        limit: 50,
      });
      setPeople(following);
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
      if (mode === "page") {
        router.push(`/messages/${id}`);
      }
    } catch (err) {
      appToast.error(
        "Could not start chat",
        getErrorMessage(err, "Messaging is unavailable."),
      );
    }
  }

  function closePanel() {
    setComposeOpen(false);
    closeConversation();
    if (mode === "page") {
      setExpanded(false);
      router.push("/feed");
      return;
    }
    setExpanded(false);
  }

  function closeThreadView() {
    setDraft("");
    clearPendingAttachment();
    closeConversation();
    if (mode === "page") {
      router.push("/messages");
    }
  }

  if (
    mode === "dock" &&
    hiddenOnRoutes.some((route) => pathname.startsWith(route))
  ) {
    return null;
  }

  if (mode === "dock" && isMessagesRoute) {
    return null;
  }

  if (!userId) {
    return null;
  }

  if (!expanded && mode !== "page") {
    return (
      <button
        type="button"
        onClick={() => openMessaging()}
        aria-label="Open messaging"
        className="fixed bottom-6 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-foreground text-background shadow-2xl transition-transform hover:scale-105"
      >
        <MessageCircle className="size-6" />
        {totalUnread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-2xs font-semibold text-white">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        ) : null}
      </button>
    );
  }

  const showListPane = mode === "page" || !conversation;
  const showChatPane =
    mode === "page" || Boolean(conversation) || Boolean(conversationId);

  const inboxPane = (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-background",
        mode === "page" &&
          "w-full border-r md:w-90 md:shrink-0 lg:w-95",
        mode === "page" && conversation && "hidden md:flex",
        mode === "dock" && "min-h-0 flex-1",
      )}
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        {mode === "dock" ? (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            onClick={closePanel}
          >
            <span className="relative shrink-0">
              <CurrentUserAvatar size="sm" />
            </span>
            <span className="truncate text-sm font-semibold">Messaging</span>
            <UnreadBadge count={totalUnread} />
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-base font-semibold">Messaging</span>
            <UnreadBadge count={totalUnread} />
          </div>
        )}
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
        {mode === "dock" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Minimize messaging"
            onClick={closePanel}
          >
            <ChevronDown />
          </Button>
        ) : null}
      </div>

      {composeOpen ? (
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
                You&apos;re not following anyone yet. Follow people to start a
                chat.
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
                    status={isOnline(person.id) ? "active" : "null"}
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
          <div className="px-3 pt-3 pb-2">
            <Input
              type="search"
              size="sm"
              placeholder="Search messages"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              prefix={<Search className="size-4 text-muted-foreground" />}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ConversationList
              items={filtered}
              loading={loadingList}
              activeId={conversationId}
              onSelect={selectConversation}
            />
          </div>
        </div>
      )}
    </div>
  );

  const chatPane = (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        mode === "page" && !conversation && !conversationId && "hidden md:flex",
        mode === "page" &&
          !conversation &&
          !conversationId &&
          "items-center justify-center bg-muted/20",
        mode === "dock" && !conversation && !conversationId && "hidden",
      )}
    >
      {conversation && threadError ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <MessageCircle className="size-10 text-muted-foreground/50" />
          <p className="text-base font-semibold">Could not load messages</p>
          <p className="max-w-xs text-sm text-muted-foreground">{threadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setThreadError(null);
              setThreadRetry((n) => n + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : conversation ? (
        <div className="flex min-h-0 flex-1 flex-col bg-[#efeae2] dark:bg-zinc-900">
          <div className="flex h-14 shrink-0 items-center gap-1 border-b border-black/5 bg-background px-1.5 shadow-sm">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Back to conversations"
              className={mode === "page" ? "md:hidden" : undefined}
              onClick={closeThreadView}
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
                {peerOnline ? "Active now" : `@${conversation.user.username}`}
              </p>
            </div>
            {mode === "dock" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconOnly
                aria-label="Minimize"
                onClick={closePanel}
              >
                <ChevronDown />
              </Button>
            ) : null}
          </div>

          <div
            className="relative flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--foreground) 8%, transparent) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          >
            {loadingThread && chatMessages.length === 0 && (
              <Loader variant="thread" className="px-1" />
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
              const showAvatar = !next || nextIsMe !== isMe;
              const prev = chatMessages[index - 1];
              const showDayDivider =
                !prev || !isSameDay(prev.createdAtRaw, msg.createdAtRaw);
              const attachment = getMessageAttachment(msg.content);

              return (
                <Fragment key={msg.id}>
                  {showDayDivider ? (
                    <div className="my-1.5 flex justify-center">
                      <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-2xs font-medium text-foreground/70">
                        {formatMessageDay(msg.createdAtRaw)}
                      </span>
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "flex items-end gap-1.5",
                      isMe ? "justify-end" : "justify-start",
                    )}
                  >
                  {!isMe && (
                    <span className="mb-0.5 flex size-7 shrink-0 items-end justify-center overflow-visible">
                      {showAvatar ? (
                        <UserAvatar
                          src={conversation.user.avatar}
                          name={conversation.user.name}
                          size="sm"
                          className="size-7!"
                        />
                      ) : null}
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[78%] text-sm leading-relaxed shadow-sm",
                      attachment && attachment.type !== "file"
                        ? "p-1"
                        : "px-3 py-2",
                      isMe
                        ? "rounded-2xl rounded-br-md bg-foreground text-background"
                        : "rounded-2xl rounded-bl-md bg-background text-foreground",
                    )}
                  >
                    {attachment ? (
                      attachment.type === "image" ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element -- user chat upload of unknown dimensions */}
                          <img
                            src={attachment.url}
                            alt="Attachment"
                            role="button"
                            tabIndex={0}
                            onClick={() => setLightboxUrl(attachment.url)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setLightboxUrl(attachment.url);
                              }
                            }}
                            className={cn(
                              "max-h-64 max-w-full cursor-zoom-in rounded-lg",
                              /\.svg(\?|#|$)/i.test(attachment.url)
                                ? "object-contain"
                                : "object-cover",
                            )}
                          />
                          <DownloadPngButton
                            src={attachment.url}
                            filename={attachment.name}
                            className="absolute bottom-1.5 right-1.5 size-8"
                          />
                        </div>
                      ) : attachment.type === "video" ? (
                        <video
                          src={attachment.url}
                          controls
                          className="max-h-64 max-w-full rounded-lg"
                        />
                      ) : (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-1.5 font-medium underline",
                            isMe ? "text-background" : "text-foreground",
                          )}
                        >
                          <Download className="size-4 shrink-0" />
                          <span className="min-w-0 truncate">
                            {attachment.name ?? "Download file"}
                          </span>
                        </a>
                      )
                    ) : (
                      <p className="whitespace-pre-wrap wrap-break-word">
                        {msg.content}
                      </p>
                    )}
                    <p
                      className={cn(
                        "mt-1 flex items-center justify-end gap-1 text-2xs leading-none",
                        attachment &&
                          attachment.type !== "file" &&
                          "px-1 pb-0.5",
                        isMe ? "text-background/60" : "text-muted-foreground",
                      )}
                    >
                      <span>{formatMessageTime(msg.createdAtRaw)}</span>
                      {isMe ? (
                        <MessageReadTicks
                          read={isMessageReadByPeer(
                            msg.createdAtRaw,
                            peerLastReadAt,
                          )}
                        />
                      ) : null}
                    </p>
                  </div>
                  {isMe && (
                    <span className="mb-0.5 flex size-7 shrink-0 items-end justify-center overflow-visible">
                      {showAvatar ? (
                        <CurrentUserAvatar size="sm" className="size-7!" />
                      ) : null}
                    </span>
                  )}
                  </div>
                </Fragment>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="shrink-0 border-t border-black/5 bg-background/95 px-2 py-2 backdrop-blur">
            {pendingAttachment ? (
              <div className="mb-2 flex items-center gap-2 rounded-lg border bg-muted/40 p-1.5">
                {getAttachmentType(pendingAttachment.file) === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview of the file about to be sent
                  <img
                    src={pendingAttachment.previewUrl}
                    alt="Attachment preview"
                    className="size-12 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-background">
                    <Paperclip className="size-5 text-muted-foreground" />
                  </div>
                )}
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {pendingAttachment.file.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  iconOnly
                  className="shrink-0"
                  aria-label="Remove attachment"
                  onClick={clearPendingAttachment}
                  disabled={sending}
                >
                  <X />
                </Button>
              </div>
            ) : null}
            <form
              className="flex items-end gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
            >
              <EmojiPickerButton
                onSelect={handleEmojiSelect}
                disabled={sending}
                side="top"
                align="start"
                buttonClassName="mb-0.5 shrink-0"
              />
              <input
                ref={attachInputRef}
                type="file"
                accept={CHAT_ATTACHMENT_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  handleAttach(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Input
                  ref={draftInputRef}
                  placeholder={
                    pendingAttachment ? "Add a caption…" : "Type a message"
                  }
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
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
                  aria-label="Attach file"
                  disabled={sending}
                  onClick={() => attachInputRef.current?.click()}
                >
                  <Paperclip />
                </Button>
              </div>
              <Button
                type="submit"
                size="sm"
                iconOnly
                aria-label="Send"
                disabled={(!draft.trim() && !pendingAttachment) || sending}
                loading={sending}
                className="mb-0.5 size-10 shrink-0 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : conversationId && threadNotFound ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <MessageCircle className="size-10 text-muted-foreground/50" />
          <p className="text-base font-semibold">Conversation not found</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            This chat may have been removed or you don&apos;t have access.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closeThreadView}
          >
            Back to messages
          </Button>
        </div>
      ) : conversationId && (loadingThread || loadingList) && !conversation ? (
        <div className="flex min-h-0 flex-1 flex-col p-3">
          <Loader variant="thread" />
        </div>
      ) : conversationId && !conversation ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <MessageCircle className="size-10 text-muted-foreground/50" />
          <p className="text-base font-semibold">Conversation unavailable</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Could not load this chat. Try again from your inbox.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closeThreadView}
          >
            Back to messages
          </Button>
        </div>
      ) : mode === "page" ? (
        <div className="flex flex-col items-center gap-2 px-6 text-center">
          <MessageCircle className="size-10 text-muted-foreground/50" />
          <p className="text-base font-semibold">Select a message</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Choose a conversation from the list, or start a new one.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => void openCompose()}
          >
            <SquarePen className="size-4" />
            New message
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className={cn(
        mode === "page"
          ? "flex h-[calc(100dvh-3.5rem)] w-full overflow-hidden border bg-background sm:h-[calc(100dvh-5.5rem)] sm:rounded-xl sm:shadow-sm"
          : "fixed inset-x-0 bottom-0 z-50 flex h-[min(78vh,640px)] flex-col border bg-background shadow-2xl md:inset-x-auto md:right-4 md:w-105 md:border-b-0 md:rounded-t-xl",
      )}
    >
      {mode === "page" ? (
        <div className="flex min-h-0 flex-1">
          {showListPane ? inboxPane : null}
          {showChatPane ? chatPane : null}
        </div>
      ) : (
        <>
          {showListPane ? inboxPane : null}
          {showChatPane ? chatPane : null}
        </>
      )}
      {lightboxUrl
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Image preview"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
              onClick={() => setLightboxUrl(null)}
            >
              <button
                type="button"
                aria-label="Close image"
                onClick={() => setLightboxUrl(null)}
                className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="size-5" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element -- chat image preview */}
              <img
                src={lightboxUrl}
                alt="Attachment preview"
                onClick={(e) => e.stopPropagation()}
                className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function ConversationList({
  items,
  loading,
  activeId,
  onSelect,
}: {
  items: Conversation[];
  loading?: boolean;
  activeId?: string | null;
  onSelect: (id: string) => void;
}) {
  const { isOnline } = usePresence();

  if (loading) {
    return <Loader variant="conversation" count={5} />;
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
      {items.map((conv) => {
        const active = activeId === conv.id;
        const hasUnread = conv.unread > 0;
        return (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv.id)}
            className={cn(
              "relative flex w-full items-start gap-3 px-3 py-3 text-left transition-colors",
              active ? "bg-muted/70" : "hover:bg-muted/40",
            )}
          >
            {active ? (
              <span className="absolute inset-y-0 left-0 w-0.5 bg-emerald-600" />
            ) : null}
            <UserAvatar
              src={conv.user.avatar}
              name={conv.user.name}
              size="sm"
              status={isOnline(conv.user.id) ? "active" : "null"}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "truncate text-sm",
                    hasUnread ? "font-semibold text-foreground" : "font-medium",
                  )}
                >
                  {conv.user.name}
                </p>
                <span
                  className={cn(
                    "shrink-0 text-xs",
                    hasUnread
                      ? "font-semibold text-emerald-600"
                      : "text-muted-foreground",
                  )}
                >
                  {conv.lastMessageAt}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <p
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    hasUnread
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {messagePreview(conv.lastMessage)}
                </p>
                <UnreadBadge count={conv.unread} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
