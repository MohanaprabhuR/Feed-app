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
import { PostEventCard } from "@/components/post-event-card";
import { DateTimePickerPopover } from "@/components/datetime-picker-popover";
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
import type { Post, PostEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultEventStart() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return toDatetimeLocalValue(d);
}

type EventDraft = {
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
};

function eventDraftFromPost(post: Post): EventDraft {
  if (!post.event) {
    return {
      title: "",
      startsAt: defaultEventStart(),
      endsAt: "",
      location: "",
    };
  }
  return {
    title: post.event.title,
    startsAt: toDatetimeLocalValue(new Date(post.event.startsAt)),
    endsAt: post.event.endsAt
      ? toDatetimeLocalValue(new Date(post.event.endsAt))
      : "",
    location: post.event.location ?? "",
  };
}

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
  const [showEventForm, setShowEventForm] = useState(Boolean(post.event));
  const [eventDraft, setEventDraft] = useState<EventDraft>(() =>
    eventDraftFromPost(post),
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = Boolean(user?.id && user.id === post.author.id);
  const isArticle = post.type === "article";
  const hadExistingMedia = Boolean(post.image || post.video || post.file);

  function resetForm() {
    setDraft(post.content);
    setTitleDraft(post.title ?? "");
    setAttachment(existingAttachmentFromPost(post));
    setShowEventForm(Boolean(post.event));
    setEventDraft(eventDraftFromPost(post));
    setError(null);
  }

  function openEventForm() {
    setShowEventForm(true);
    setEventDraft((current) => ({
      ...current,
      startsAt: current.startsAt || defaultEventStart(),
    }));
  }

  function clearEvent() {
    setShowEventForm(false);
    setEventDraft({
      title: "",
      startsAt: defaultEventStart(),
      endsAt: "",
      location: "",
    });
  }

  function buildEventPayload(): PostEvent | undefined {
    if (!showEventForm) return undefined;
    const title = eventDraft.title.trim();
    if (!title || !eventDraft.startsAt) return undefined;

    const startsAt = new Date(eventDraft.startsAt).toISOString();
    const endsAt = eventDraft.endsAt
      ? new Date(eventDraft.endsAt).toISOString()
      : undefined;
    const location = eventDraft.location.trim() || undefined;

    return {
      title,
      startsAt,
      ...(endsAt ? { endsAt } : {}),
      ...(location ? { location } : {}),
    };
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

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
    } else {
      if (
        showEventForm &&
        eventDraft.endsAt &&
        new Date(eventDraft.endsAt) <= new Date(eventDraft.startsAt)
      ) {
        setError("Event end time must be after the start time.");
        return;
      }
      if (showEventForm && (!eventDraft.title.trim() || !eventDraft.startsAt)) {
        setError("Add an event title and start date/time.");
        return;
      }
      if (!trimmed && !attachment && !showEventForm) {
        setError("Post must include text or an attachment.");
        return;
      }
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

      const eventForSave = showEventForm
        ? buildEventPayload()
        : post.event
          ? null
          : undefined;

      const updated = await updatePost(
        supabase,
        post.id,
        user.id,
        trimmed,
        media,
        isArticle ? { title: trimmedTitle } : { event: eventForSave },
      );
      onUpdated?.(updated);
      appToast.success(
        isArticle ? "Article updated" : "Post updated",
        "Your changes have been saved.",
      );
      handleOpenChange(false);
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
      handleOpenChange(false);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        size="lg"
        className={cn(
          "flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0",
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

              {showEventForm && !isArticle && (
                <Card className="mb-3 overflow-hidden border shadow-sm">
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">Event details</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={clearEvent}
                        disabled={busy}
                        aria-label="Remove event"
                      >
                        <X />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-event-title">Event name</Label>
                      <Input
                        id="edit-event-title"
                        placeholder="Add a title"
                        value={eventDraft.title}
                        onChange={(e) =>
                          setEventDraft((d) => ({
                            ...d,
                            title: e.target.value,
                          }))
                        }
                        disabled={busy}
                        autoComplete="off"
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-event-start">Start</Label>
                        <DateTimePickerPopover
                          id="edit-event-start"
                          value={eventDraft.startsAt}
                          onChange={(next) =>
                            setEventDraft((d) => ({
                              ...d,
                              startsAt: next,
                              // Drop a now-stale end so start > end can't linger.
                              endsAt:
                                d.endsAt && new Date(d.endsAt) <= new Date(next)
                                  ? ""
                                  : d.endsAt,
                            }))
                          }
                          disabled={busy}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="edit-event-end">End (optional)</Label>
                        <DateTimePickerPopover
                          id="edit-event-end"
                          value={eventDraft.endsAt}
                          onChange={(next) =>
                            setEventDraft((d) => ({ ...d, endsAt: next }))
                          }
                          disabled={busy}
                          placeholder="Select end"
                          minValue={eventDraft.startsAt}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-event-location">
                        Location (optional)
                      </Label>
                      <Input
                        id="edit-event-location"
                        placeholder="Add a venue or online link"
                        value={eventDraft.location}
                        onChange={(e) =>
                          setEventDraft((d) => ({
                            ...d,
                            location: e.target.value,
                          }))
                        }
                        disabled={busy}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </Card>
              )}

              {showEventForm &&
              !isArticle &&
              eventDraft.title.trim() &&
              eventDraft.startsAt ? (
                <PostEventCard
                  event={{
                    title: eventDraft.title.trim(),
                    startsAt: new Date(eventDraft.startsAt).toISOString(),
                    ...(eventDraft.endsAt
                      ? { endsAt: new Date(eventDraft.endsAt).toISOString() }
                      : {}),
                    ...(eventDraft.location.trim()
                      ? { location: eventDraft.location.trim() }
                      : {}),
                  }}
                  className="mb-3"
                />
              ) : null}

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
            <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
                disabled={busy}
                onClick={() =>
                  toast.custom(() => (
                    <Alert variant="information">
                      <AlertContent>
                        <AlertTitle>AI enhance coming soon</AlertTitle>
                        <AlertDescription>
                          You can enhance your post with AI.
                        </AlertDescription>
                      </AlertContent>
                    </Alert>
                  ))
                }
              >
                ✨ Enhance post
              </Button>

              <div className="ml-auto flex items-center gap-0.5">
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
                onClick={openEventForm}
                aria-label="Create event"
                aria-pressed={showEventForm}
                className={cn(showEventForm && "bg-accent text-foreground")}
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
                  <DropdownMenuItem onClick={openEventForm}>
                    <Calendar className="size-4" />
                    {showEventForm ? "Edit event" : "Create an event"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
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
                  onClick={() => handleOpenChange(false)}
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
