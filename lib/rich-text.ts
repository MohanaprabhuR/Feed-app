import DOMPurify from "isomorphic-dompurify";

// Tags/attributes the post editor can produce (TipTap StarterKit + links).
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "blockquote",
  "code",
  "pre",
  "a",
  "span",
];
const ALLOWED_ATTR = ["href", "target", "rel"];

/** Sanitize stored post HTML before it is ever rendered (defends against XSS). */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
  });
}

/** True when a string contains HTML markup (vs. a legacy plain-text post). */
export function isHtmlContent(content: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(content);
}

/** Strip a rich-text post down to plain text (for search, previews, counts). */
export function richTextToPlain(content: string): string {
  if (!content) return "";
  if (!isHtmlContent(content)) return content;
  return content
    .replace(/<\/(p|div|li|h[1-3]|blockquote|pre)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** True when a rich-text value has no visible text (e.g. an empty "<p></p>"). */
export function isRichTextEmpty(content: string): boolean {
  return richTextToPlain(content).trim().length === 0;
}
