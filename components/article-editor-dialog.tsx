"use client";

import { ArticleEditor } from "@/components/article-editor";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Post } from "@/lib/types";

type ArticleEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublished?: (post?: Post) => void;
};

export function ArticleEditorDialog({
  open,
  onOpenChange,
  onPublished,
}: ArticleEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        className="flex max-h-[min(92vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">Write article</DialogTitle>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          data-scroll-lock-scrollable=""
        >
          <ArticleEditor
            onPublished={(post) => {
              onPublished?.(post);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
