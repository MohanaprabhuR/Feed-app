import { isHtmlContent, sanitizeRichText } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

/**
 * Renders a post's body. Rich posts are stored as HTML and sanitized before
 * injection; legacy plain-text posts render with preserved line breaks.
 */
export function RichContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  if (!content.trim()) return null;

  if (!isHtmlContent(content)) {
    return (
      <p className={cn("whitespace-pre-wrap wrap-break-word", className)}>
        {content}
      </p>
    );
  }

  return (
    <div
      className={cn("rich-content wrap-break-word", className)}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(content) }}
    />
  );
}
