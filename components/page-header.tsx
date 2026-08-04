import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  backHref?: string;
  action?: ReactNode;
  className?: string;
};

/**
 * The per-page title + back button were removed from the layout — navigation
 * is handled by the top nav, so the secondary header bar is redundant. Kept as
 * a no-op so existing <PageHeader /> callers keep compiling; to bring it back,
 * restore the previous markup here (git history) rather than editing each page.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- props kept for call-site compatibility; header intentionally renders nothing
export function PageHeader(_props: PageHeaderProps) {
  return null;
}
