"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Award,
  Calendar,
  FileText,
  ImageIcon,
  Paperclip,
  Plus,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/current-user-provider";
import { UserAvatar } from "@/components/user-avatar";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";
import { appToast } from "@/lib/app-toast";
import { getErrorMessage } from "@/lib/errors";
import {
  getAttachmentType,
  uploadPostAttachment,
  validatePostAttachment,
  type PostAttachmentType,
} from "@/lib/post-media";
import { deletePost, updatePost } from "@/lib/posts";
import { createClient } from "@/lib/supabase/client";
import type { Post } from "@/lib/types";

type EditAttachment =
  | {
      source: "existing";
      type: PostAttachmentType;
      url: string;
      name?: string;
    }
  | {
      source: "new";
      type: PostAttachmentType;
      file: File;
      previewUrl?: string;
    };

type EditPostDialogProps = {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (post: Post) => void;
  onDeleted?: (postId: string) => void;
};

function existingAttachmentFromPost(post: Post): EditAttachment | null {
  if (post.image) {
    return { source: "existing", type: "image", url: post.image };
  }
  if (post.video) {
    return { source: "existing", type: "video", url: post.video };
  }
  if (post.file) {
    return {
      source: "existing",
      type: "file",
      url: post.file.url,
      name: post.file.name,
    };
  }
  return null;
}

export function EditPostDialog({
  post,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: EditPostDialogProps) {
  const { user } = useCurrentUser();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(post.content);
  const [attachment, setAttachment] = useState<EditAttachment | null>(() =>
    existingAttachmentFromPost(post),
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = Boolean(user?.id && user.id === post.author.id);
  const isArticle = post.type === "article";
  const hadExistingMedia = Boolean(post.image || post.video || post.file);

  useEffect(() => {
    return () => {
      if (attachment?.source === "new" && attachment.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    };
  }, [attachment]);

  function clearAttachment() {
    if (attachment?.source === "new" && attachment.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
    setAttachment(null);
  }

  function openPicker(kind: "image" | "video" | "file") {
    if (kind === "image") imageInputRef.current?.click();
    if (kind === "video") videoInputRef.current?.click();
    if (kind === "file") fileInputRef.current?.click();
  }

  function handleFileSelect(file: File | undefined) {
    if (!file) return;

    const validationError = validatePostAttachment(file);
    if (validationError) {
      toast.custom(() => (
        <Alert variant="error">
          <AlertContent>
            <AlertTitle>Invalid file</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </AlertContent>
        </Alert>
      ));
      return;
    }

    const attachmentType = getAttachmentType(file);
    if (!attachmentType) return;

    clearAttachment();
    setAttachment({
      source: "new",
      type: attachmentType,
      file,
      previewUrl:
        attachmentType === "image" || attachmentType === "video"
          ? URL.createObjectURL(file)
          : undefined,
    });
  }

  async function handleSave() {
    if (!user || !isOwner || saving) return;

    const trimmed = draft.trim();
    if (!trimmed && !attachment) {
      setError("Post must include text or an attachment.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      let media:
        | { image?: string; video?: string; file?: string }
        | null
        | undefined;

      if (attachment?.source === "new") {
        const uploaded = await uploadPostAttachment(attachment.file);
        media = {};
        if (uploaded.attachmentType === "image") media.image = uploaded.url;
        else if (uploaded.attachmentType === "video") media.video = uploaded.url;
        else media.file = uploaded.url;
      } else if (attachment?.source === "existing") {
        media = undefined;
      } else if (hadExistingMedia) {
        media = null;
      }

      const updated = await updatePost(
        supabase,
        post.id,
        user.id,
        trimmed,
        media,
      );
      onUpdated?.(updated);
      appToast.success(
        isArticle ? "Article updated" : "Post updated",
        "Your changes have been saved.",
      );
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not update post."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!user || !isOwner || deleting) return;

    const confirmed = window.confirm(
      "Delete this post? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const supabase = createClient();
      await deletePost(supabase, post.id, user.id);
      onDeleted?.(post.id);
      appToast.success(
        isArticle ? "Article deleted" : "Post deleted",
        "It has been removed from the feed.",
      );
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete post."));
    } finally {
      setDeleting(false);
    }
  }

  const busy = saving || deleting;
  const imagePreview =
    attachment?.source === "existing" && attachment.type === "image"
      ? attachment.url
      : attachment?.source === "new" && attachment.type === "image"
        ? attachment.previewUrl
        : undefined;
  const videoPreview =
    attachment?.source === "existing" && attachment.type === "video"
      ? attachment.url
      : attachment?.source === "new" && attachment.type === "video"
        ? attachment.previewUrl
        : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        className="max-h-[min(90vh,720px)] gap-0 overflow-hidden p-0 sm:max-w-[552px]"
      >
        <DialogHeader className="border-b px-4 py-3 pr-12">
          <DialogTitle>{isArticle ? "Edit article" : "Edit post"}</DialogTitle>
          <DialogDescription>
            Only you can edit this {isArticle ? "article" : "post"}.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.zip,.ppt,.pptx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/zip"
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        {!isOwner ? (
          <div className="p-4">
            <Alert variant="error" className="w-full max-w-none">
              <AlertContent>
                <AlertDescription>
                  You can only edit your own posts.
                </AlertDescription>
              </AlertContent>
            </Alert>
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3">
              {error && (
                <Alert variant="error" className="mb-3 w-full max-w-none">
                  <AlertContent>
                    <AlertDescription>{error}</AlertDescription>
                  </AlertContent>
                </Alert>
              )}

              <div className="mb-3 flex gap-3">
                <UserAvatar
                  src={post.author.avatar}
                  name={post.author.name}
                  size="sm"
                />
              <div className="mb-3 min-w-0 flex-1">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={busy}
                  size="md"
                  placeholder={
                    isArticle
                      ? "Update your article..."
                      : "What do you want to talk about?"
                  }
                  autoFocus
                />
              </div>
              </div>

              {attachment && (
                <Card className="relative mb-2 overflow-hidden">
                  {attachment.type === "image" && imagePreview && (
                    <div className="relative aspect-video max-h-72 w-full">
                      <Image
                        src={imagePreview}
                        alt="Post image preview"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  )}
                  {attachment.type === "video" && videoPreview && (
                    <video
                      src={videoPreview}
                      controls
                      className="max-h-72 w-full bg-black"
                    />
                  )}
                  {attachment.type === "file" && (
                    <Item size="sm" variant="muted">
                      <ItemMedia variant="icon">
                        <FileText className="text-violet-primary" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          {attachment.source === "existing"
                            ? (attachment.name ?? "Document")
                            : attachment.file.name}
                        </ItemTitle>
                        {attachment.source === "new" && (
                          <ItemDescription>
                            {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                          </ItemDescription>
                        )}
                      </ItemContent>
                    </Item>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    iconOnly
                    className="absolute right-2 top-2"
                    onClick={clearAttachment}
                    disabled={busy}
                    aria-label="Remove attachment"
                  >
                    <X />
                  </Button>
                </Card>
              )}
            </div>

            <div className="flex items-center justify-end gap-0.5 border-t px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconOnly
                disabled={busy}
                onClick={() => openPicker("image")}
                aria-label="Add photo"
              >
                <ImageIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconOnly
                disabled={busy}
                onClick={() => openPicker("video")}
                aria-label="Add video"
              >
                <Video />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconOnly
                disabled={busy}
                onClick={() =>
                  toast.custom(() => (
                    <Alert variant="information">
                      <AlertContent>
                        <AlertTitle>Events coming soon</AlertTitle>
                        <AlertDescription>
                          You can create events for your post.
                        </AlertDescription>
                      </AlertContent>
                    </Alert>
                  ))
                }
                aria-label="Create event"
              >
                <Calendar />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconOnly
                disabled={busy}
                onClick={() =>
                  toast.custom(() => (
                    <Alert variant="information">
                      <AlertContent>
                        <AlertTitle>Celebrate coming soon</AlertTitle>
                        <AlertDescription>
                          You can celebrate occasions for your post.
                        </AlertDescription>
                      </AlertContent>
                    </Alert>
                  ))
                }
                aria-label="Celebrate an occasion"
              >
                <Award />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    iconOnly
                    disabled={busy}
                    aria-label="More options"
                  >
                    <Plus />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => openPicker("file")}>
                    <Paperclip className="size-4" />
                    Add a document
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      toast.custom(() => (
                        <Alert variant="information">
                          <AlertContent>
                            <AlertTitle>Events coming soon</AlertTitle>
                            <AlertDescription>
                              You can create events for your post.
                            </AlertDescription>
                          </AlertContent>
                        </Alert>
                      ))
                    }
                  >
                    <Calendar className="size-4" />
                    Create an event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DialogFooter className="border-t px-4 py-3 sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                disabled={busy}
                loading={deleting}
                onClick={() => void handleDelete()}
              >
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={(!draft.trim() && !attachment) || deleting}
                  loading={saving}
                  onClick={() => void handleSave()}
                >
                  Save
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
