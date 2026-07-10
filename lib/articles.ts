import type { Post } from "@/lib/types";

export function getArticleExcerpt(content: string, maxLength = 180) {
  const plain = content.replace(/\s+/g, " ").trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trimEnd()}…`;
}

export function getReadTimeMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function isArticle(post: Pick<Post, "type">) {
  return post.type === "article";
}
