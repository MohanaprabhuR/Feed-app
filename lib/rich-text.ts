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

/**
 * True when a value is editor-produced HTML (vs. a legacy plain-text post).
 * TipTap always wraps content in a top-level block element, so we anchor on a
 * leading block tag. A loose "contains any <tag>" check would false-positive on
 * plain text like "I love <coding>" and skip escaping it.
 */
export function isHtmlContent(content: string): boolean {
  return /^\s*<(p|h[1-6]|ul|ol|blockquote|pre|div)[\s/>]/i.test(content);
}

/**
 * Convert a legacy plain-text value into safe HTML paragraphs, preserving line
 * breaks. Without this, feeding "a\nb" straight into TipTap collapses the
 * newline (HTML whitespace) and the break is lost when the post is re-saved.
 */
export function plainTextToHtml(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return "";
  const escaped = normalized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Normalize any stored value (HTML or legacy plain text) to editor HTML. */
export function toEditorHtml(value: string): string {
  if (!value) return "";
  return isHtmlContent(value) ? value : plainTextToHtml(value);
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
