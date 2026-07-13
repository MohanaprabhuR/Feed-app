import type { SupabaseClient } from "@supabase/supabase-js";

function isMissingSharesTableError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("post_shares") &&
    (lower.includes("schema cache") ||
      lower.includes("does not exist") ||
      lower.includes("could not find"))
  );
}

export async function sharePostWithUsers(
  supabase: SupabaseClient,
  postId: string,
  senderId: string,
  recipientIds: string[]
): Promise<{ sharedCount: number; sharesCount: number }> {
  const uniqueRecipients = [
    ...new Set(recipientIds.filter((id) => id && id !== senderId)),
  ];

  if (uniqueRecipients.length === 0) {
    throw new Error("Select at least one person to share with.");
  }

  const rows = uniqueRecipients.map((recipientId) => ({
    post_id: postId,
    sender_id: senderId,
    recipient_id: recipientId,
  }));

  const { error } = await supabase.from("post_shares").upsert(rows, {
    onConflict: "post_id,sender_id,recipient_id",
    ignoreDuplicates: true,
  });

  if (error) {
    if (isMissingSharesTableError(error.message)) {
      throw new Error(
        "Sharing needs database setup. Run supabase/migrate-follows-shares.sql in Supabase → SQL Editor."
      );
    }
    throw error;
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("shares_count")
    .eq("id", postId)
    .single();

  if (postError) throw postError;

  return {
    sharedCount: uniqueRecipients.length,
    sharesCount: post.shares_count ?? 0,
  };
}
