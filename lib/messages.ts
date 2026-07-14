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
  };
}

export type DirectMessageRow = MessageRow;

export async function fetchConversations(
  supabase: SupabaseClient,
  userId: string,
): Promise<Conversation[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("conversation_members")
    .select("conversation_id")
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
        unread: 0,
      } satisfies Conversation;
    })
    .filter((conv): conv is Conversation => Boolean(conv));
}

export async function fetchMessages(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingMessagingSchemaError(error.message)) {
      throw missingMessagingSetupError();
    }
    throw error;
  }

  return ((data ?? []) as MessageRow[]).map(messageRowToMessage);
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
  const channel = supabase
    .channel(`direct-messages:${conversationId}`)
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
  const channel = supabase
    .channel("direct-messages-inbox")
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
