import type { SupabaseClient } from "@supabase/supabase-js";
import { formatRelativeTime } from "@/lib/posts";
import { profileToUser, type ProfileRow } from "@/lib/profile";
import type { Conversation, Message } from "@/lib/types";

function isMissingMessagingSchemaError(message: string) {
  const lower = message.toLowerCase();
  return (
    (lower.includes("conversations") ||
      lower.includes("conversation_members") ||
      lower.includes("direct_messages") ||
      lower.includes("get_or_create_direct_conversation")) &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find") ||
      lower.includes("function") ||
      lower.includes("relation"))
  );
}

export function missingMessagingSetupError() {
  return new Error(
    "Messaging needs database setup. Run supabase/migrate-messages.sql in Supabase → SQL Editor.",
  );
}

type MemberRow = {
  conversation_id: string;
  user_id: string;
  profiles: ProfileRow | ProfileRow[] | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function asProfile(value: ProfileRow | ProfileRow[] | null): ProfileRow | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function messageRowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: formatRelativeTime(row.created_at),
    createdAtRaw: row.created_at,
  };
}

/** Time-of-day label for a message bubble, e.g. "9:41 AM". */
export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Day divider label: "Today", "Yesterday", or "Jul 27, 2026". */
export function formatMessageDay(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round(
    (startOfDay(now) - startOfDay(date)) / 86_400_000,
  );
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** True when two ISO timestamps fall on the same calendar day. */
export function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export type DirectMessageRow = MessageRow;

export type MessageAttachment = {
  type: "image" | "video" | "file";
  url: string;
  name?: string;
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
// Our uploads are stored as `<userId>/<timestamp>-<uuid>-<originalName>`, so the
// original filename can be recovered by stripping that prefix off the last path
// segment.
const UPLOAD_PREFIX =
  /^\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;

/** Original filename recovered from an uploaded media URL, if available. */
export function fileNameFromUrl(url: string): string | undefined {
  try {
    const last = decodeURIComponent(
      new URL(url).pathname.split("/").pop() ?? "",
    );
    if (!last) return undefined;
    return last.replace(UPLOAD_PREFIX, "") || last;
  } catch {
    return undefined;
  }
}

/**
 * Chat attachments are sent as a bare media URL in the message body (the
 * direct_messages table only stores text). Detect one so bubbles can render
 * the image/video/file inline; anything else stays plain text.
 */
export function getMessageAttachment(content: string): MessageAttachment | null {
  const trimmed = content.trim();
  if (!/^https?:\/\/\S+$/.test(trimmed)) return null;
  const name = fileNameFromUrl(trimmed);
  if (IMAGE_EXT.test(trimmed)) return { type: "image", url: trimmed, name };
  if (VIDEO_EXT.test(trimmed)) return { type: "video", url: trimmed, name };
  // Only treat our own uploaded files as file attachments — leave arbitrary
  // links the user types as plain text.
  if (trimmed.includes("/post-media/"))
    return { type: "file", url: trimmed, name };
  return null;
}

/** Short label for a message in the conversation list (hides raw media URLs). */
export function messagePreview(content: string): string {
  const attachment = getMessageAttachment(content);
  if (!attachment) return content;
  if (attachment.type === "image") return "📷 Photo";
  if (attachment.type === "video") return "🎬 Video";
  return "📎 Attachment";
}

export async function fetchConversations(
  supabase: SupabaseClient,
  userId: string,
): Promise<Conversation[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);

  if (membershipError) {
    if (isMissingMessagingSchemaError(membershipError.message)) {
      throw missingMessagingSetupError();
    }
    throw membershipError;
  }

  const conversationIds = (memberships ?? []).map(
    (row) => row.conversation_id as string,
  );
  if (conversationIds.length === 0) return [];

  const lastReadByConversation = new Map<string, string>();
  for (const row of memberships ?? []) {
    lastReadByConversation.set(
      row.conversation_id as string,
      (row.last_read_at as string) ?? new Date(0).toISOString(),
    );
  }

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id, updated_at")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  if (conversationsError) {
    if (isMissingMessagingSchemaError(conversationsError.message)) {
      throw missingMessagingSetupError();
    }
    throw conversationsError;
  }

  const { data: members, error: membersError } = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id, profiles(*)")
    .in("conversation_id", conversationIds)
    .neq("user_id", userId);

  if (membersError) {
    if (isMissingMessagingSchemaError(membersError.message)) {
      throw missingMessagingSetupError();
    }
    throw membersError;
  }

  const otherByConversation = new Map<string, ProfileRow>();
  for (const row of (members ?? []) as MemberRow[]) {
    const profile = asProfile(row.profiles);
    if (profile) otherByConversation.set(row.conversation_id, profile);
  }

  const { data: recentMessages, error: messagesError } = await supabase
    .from("direct_messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (messagesError) {
    if (isMissingMessagingSchemaError(messagesError.message)) {
      throw missingMessagingSetupError();
    }
    throw messagesError;
  }

  const lastByConversation = new Map<string, MessageRow>();
  for (const row of (recentMessages ?? []) as MessageRow[]) {
    if (!lastByConversation.has(row.conversation_id)) {
      lastByConversation.set(row.conversation_id, row);
    }
  }

  const unreadByConversation = new Map<string, number>();
  await Promise.all(
    conversationIds.map(async (convId) => {
      const lastReadAt =
        lastReadByConversation.get(convId) ?? new Date(0).toISOString();
      const { count, error: countError } = await supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", convId)
        .neq("sender_id", userId)
        .gt("created_at", lastReadAt);

      if (countError) {
        if (isMissingMessagingSchemaError(countError.message)) {
          throw missingMessagingSetupError();
        }
        throw countError;
      }
      if (count && count > 0) {
        unreadByConversation.set(convId, count);
      }
    }),
  );

  // Fill in last message for threads missing from the bulk fetch (row cap).
  await Promise.all(
    conversationIds
      .filter((convId) => !lastByConversation.has(convId))
      .map(async (convId) => {
        const { data, error: lastError } = await supabase
          .from("direct_messages")
          .select("id, conversation_id, sender_id, content, created_at")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastError) {
          if (isMissingMessagingSchemaError(lastError.message)) {
            throw missingMessagingSetupError();
          }
          throw lastError;
        }
        if (data) {
          lastByConversation.set(convId, data as MessageRow);
        }
      }),
  );

  return ((conversations ?? []) as { id: string; updated_at: string }[])
    .map((conv) => {
      const other = otherByConversation.get(conv.id);
      if (!other) return null;
      const last = lastByConversation.get(conv.id);
      return {
        id: conv.id,
        user: profileToUser(other),
        lastMessage: last?.content ?? "No messages yet",
        lastMessageAt: last
          ? formatRelativeTime(last.created_at)
          : formatRelativeTime(conv.updated_at),
        unread: unreadByConversation.get(conv.id) ?? 0,
      } satisfies Conversation;
    })
    .filter((conv): conv is Conversation => Boolean(conv));
}

/** Mark a conversation as read for the current user. */
export async function markConversationRead(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .select("conversation_id");

  if (error) {
    if (isMissingMessagingSchemaError(error.message)) {
      throw missingMessagingSetupError();
    }
    throw error;
  }

  if (!data?.length) {
    throw new Error(
      "Could not mark conversation as read. Run supabase/migrate-message-read.sql in Supabase → SQL Editor.",
    );
  }
}

export async function fetchMessages(
  supabase: SupabaseClient,
  conversationId: string,
  options?: { limit?: number },
): Promise<Message[]> {
  // Fetch newest-first then reverse so PostgREST's default row cap cannot
  // drop recent messages in long threads.
  const limit = options?.limit ?? 200;
  const { data, error } = await supabase
    .from("direct_messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingMessagingSchemaError(error.message)) {
      throw missingMessagingSetupError();
    }
    throw error;
  }

  return ((data ?? []) as MessageRow[])
    .slice()
    .reverse()
    .map(messageRowToMessage);
}

export async function sendMessage(
  supabase: SupabaseClient,
  conversationId: string,
  senderId: string,
  content: string,
): Promise<Message> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: trimmed,
    })
    .select("id, conversation_id, sender_id, content, created_at")
    .single();

  if (error) {
    if (isMissingMessagingSchemaError(error.message)) {
      throw missingMessagingSetupError();
    }
    throw error;
  }

  return messageRowToMessage(data as MessageRow);
}

export async function getOrCreateDirectConversation(
  supabase: SupabaseClient,
  otherUserId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    "get_or_create_direct_conversation",
    { other_user_id: otherUserId },
  );

  if (error) {
    if (isMissingMessagingSchemaError(error.message)) {
      throw missingMessagingSetupError();
    }
    throw error;
  }

  return data as string;
}

/** Live INSERT events for a conversation thread (own + peer messages). */
export function subscribeToConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  onMessage: (message: Message, row: MessageRow) => void,
) {
  // Use a unique channel name per subscription call to avoid cases where
  // the Supabase client reuses an already-subscribed realtime channel.
  const channelName = `direct-messages:${conversationId}:${Date.now()}:${Math.random()
    .toString(16)
    .slice(2)}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const row = payload.new as MessageRow;
        if (!row?.id || !row.content) return;
        onMessage(messageRowToMessage(row), row);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Inbox updates when any visible DM is inserted. */
export function subscribeToInboxMessages(
  supabase: SupabaseClient,
  onInsert: (row: MessageRow) => void,
) {
  // Use a unique channel name per subscription call to avoid cases where
  // the Supabase client reuses an already-subscribed realtime channel.
  const channelName = `direct-messages-inbox:${Date.now()}:${Math.random()
    .toString(16)
    .slice(2)}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
      },
      (payload) => {
        const row = payload.new as MessageRow;
        if (!row?.id || !row.conversation_id) return;
        onInsert(row);
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
