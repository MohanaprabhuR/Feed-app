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
import { MentionTextarea } from "@/components/mention-text-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";

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
  const [titleDraft, setTitleDraft] = useState(post.title ?? "");
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
    if (!open) return;
    setDraft(post.content);
    setTitleDraft(post.title ?? "");
    setAttachment(existingAttachmentFromPost(post));
    setError(null);
  }, [open, post]);

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

    if (isArticle && !file.type.startsWith("image/")) {
      toast.custom(() => (
        <Alert variant="error">
          <AlertContent>
            <AlertTitle>Cover must be an image.</AlertTitle>
            <AlertDescription>
              Choose a JPEG, PNG, GIF, or WebP file for the cover.
            </AlertDescription>
          </AlertContent>
        </Alert>
      ));
      return;
    }

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
    const trimmedTitle = titleDraft.trim();

    if (isArticle) {
      if (!trimmedTitle) {
        setError("Article title is required.");
        return;
      }
      if (!trimmed) {
        setError("Article body is required.");
        return;
      }
    } else if (!trimmed && !attachment) {
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
        isArticle ? { title: trimmedTitle } : undefined,
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
        className={cn(
          "max-h-[min(90vh,720px)] gap-0 overflow-hidden p-0",
          isArticle ? "sm:max-w-3xl" : "sm:max-w-[552px]",
        )}
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

              {isArticle ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5">
                      <UserAvatar
                        src={post.author.avatar}
                        name={post.author.name}
                        size="sm"
                      />
                      <span className="font-medium">{post.author.name}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-article-title">Title</Label>
                    <Input
                      id="edit-article-title"
                      size="lg"
                      placeholder="Article title"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      disabled={busy}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Cover image (optional)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => openPicker("image")}
                      >
                        <ImageIcon className="size-4" />
                        {attachment?.type === "image" ? "Change cover" : "Add cover"}
                      </Button>
                    </div>
                    {attachment?.type === "image" && imagePreview ? (
                      <div className="relative overflow-hidden rounded-xl border">
                        <div className="relative aspect-2/1 w-full">
                          <Image
                            src={imagePreview}
                            alt="Article cover preview"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          iconOnly
                          className="absolute right-3 top-3 rounded-full"
                          onClick={clearAttachment}
                          disabled={busy}
                          aria-label="Remove cover"
                        >
                          <X />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-article-body">Body</Label>
                    <MentionTextarea
                      id="edit-article-body"
                      value={draft}
                      onValueChange={setDraft}
                      disabled={busy}
                      size="lg"
                      placeholder="Write your article..."
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-3 flex gap-3">
                  <UserAvatar
                    src={post.author.avatar}
                    name={post.author.name}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <MentionTextarea
                      value={draft}
                      onValueChange={setDraft}
                      disabled={busy}
                      size="md"
                      placeholder="What do you want to talk about?"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {attachment && !isArticle && (
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

            {!isArticle && (
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
            )}

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
                  disabled={
                    deleting ||
                    (isArticle
                      ? !titleDraft.trim() || !draft.trim()
                      : !draft.trim() && !attachment)
                  }
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
