"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Award,
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  Globe,
  ImageIcon,
  Newspaper,
  Paperclip,
  Plus,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/current-user-provider";
import {
  EmojiPickerButton,
  insertEmojiAtCaret,
} from "@/components/emoji-picker-button";
import { CurrentUserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Separator } from "@/components/ui/separator";
import { MentionTextarea } from "@/components/mention-text-field";
import { CELEBRATION_OCCASIONS } from "@/lib/celebrations";
import { getErrorMessage } from "@/lib/errors";
import {
  getAttachmentType,
  uploadPostAttachment,
  validatePostAttachment,
  type PostAttachmentType,
} from "@/lib/post-media";
import { api } from "@/lib/api-client";
import type {
  CelebrationOccasion,
  Post,
  PostCelebration,
  PostEvent,
} from "@/lib/types";
import { feedCardClass, feedCardSectionClass } from "@/lib/feed-layout";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription, AlertContent } from "./ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PostEventCard } from "@/components/post-event-card";
import { PostCelebrationCard } from "@/components/post-celebration-card";
import { DateTimePickerPopover } from "@/components/datetime-picker-popover";
import { ArticleEditorDialog } from "@/components/article-editor-dialog";

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

type CelebrationDraft = {
  occasion: CelebrationOccasion;
  message: string;
};

const feedActions = [
  {
    label: "Video",
    icon: Video,
    iconClass: "text-green-600",
    kind: "video" as const,
  },
  {
    label: "Photo",
    icon: ImageIcon,
    iconClass: "text-blue-600",
    kind: "image" as const,
  },
  {
    label: "Write article",
    icon: Newspaper,
    iconClass: "text-amber-700",
    kind: "article" as const,
  },
];

type ComposerAttachment = {
  file: File;
  previewUrl?: string;
  type: PostAttachmentType;
};

type CreatePostComposerProps = {
  onPosted?: (post?: Post) => void;
  initialArticleOpen?: boolean;
  onArticleClose?: () => void;
};

export function CreatePostComposer({
  onPosted,
  initialArticleOpen = false,
  onArticleClose,
}: CreatePostComposerProps) {
  const { user, refresh } = useCurrentUser();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const isArticleDialogOpen = articleOpen || initialArticleOpen;
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<ComposerAttachment | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventDraft, setEventDraft] = useState<EventDraft>({
    title: "",
    startsAt: defaultEventStart(),
    endsAt: "",
    location: "",
  });
  const [showCelebrationForm, setShowCelebrationForm] = useState(false);
  const [celebrationDraft, setCelebrationDraft] = useState<CelebrationDraft>({
    occasion: CELEBRATION_OCCASIONS[0].value,
    message: "",
  });

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    const { value, caret } = insertEmojiAtCaret(
      content,
      emoji,
      el?.selectionStart,
      el?.selectionEnd,
    );
    setContent(value);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }

  function openEventForm() {
    openModal();
    setShowEventForm(true);
    setShowCelebrationForm(false);
    setEventDraft((current) => ({
      ...current,
      startsAt: current.startsAt || defaultEventStart(),
    }));
  }

  function openCelebrationForm() {
    openModal();
    setShowCelebrationForm(true);
    setShowEventForm(false);
  }

  function openArticleEditor() {
    setArticleOpen(true);
  }

  function handleArticleOpenChange(nextOpen: boolean) {
    setArticleOpen(nextOpen);
    if (!nextOpen) onArticleClose?.();
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

  function clearCelebration() {
    setShowCelebrationForm(false);
    setCelebrationDraft({
      occasion: CELEBRATION_OCCASIONS[0].value,
      message: "",
    });
  }

  function buildCelebrationPayload(): PostCelebration | undefined {
    if (!showCelebrationForm) return undefined;
    const message = celebrationDraft.message.trim();
    return {
      occasion: celebrationDraft.occasion,
      ...(message ? { message } : {}),
    };
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

  useEffect(() => {
    return () => {
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    };
  }, [attachment?.previewUrl]);

  function clearAttachment() {
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
    setAttachment(null);
  }

  function resetComposer() {
    clearAttachment();
    clearEvent();
    clearCelebration();
    setContent("");
    setOpen(false);
  }

  function handleFileSelect(file: File | undefined) {
    if (!file) return;

    const validationError = validatePostAttachment(file);
    if (validationError) {
      toast.custom(() => (
        <Alert variant="error">
          <AlertContent>
            <AlertTitle>Invalid file.</AlertTitle>
            <AlertDescription>You must select a valid file.</AlertDescription>
          </AlertContent>
        </Alert>
      ));
      return;
    }

    const attachmentType = getAttachmentType(file);
    if (!attachmentType) return;

    clearAttachment();
    setAttachment({
      file,
      type: attachmentType,
      previewUrl:
        attachmentType === "image" || attachmentType === "video"
          ? URL.createObjectURL(file)
          : undefined,
    });
    setOpen(true);
  }

  function openModal() {
    if (!user) return;
    setOpen(true);
  }

  function openPicker(kind: "image" | "video" | "file") {
    openModal();
    requestAnimationFrame(() => {
      if (kind === "image") imageInputRef.current?.click();
      if (kind === "video") videoInputRef.current?.click();
      if (kind === "file") fileInputRef.current?.click();
    });
  }

  async function handlePost() {
    if (!user) return;

    if (
      showEventForm &&
      eventDraft.endsAt &&
      new Date(eventDraft.endsAt) <= new Date(eventDraft.startsAt)
    ) {
      toast.custom(() => (
        <Alert variant="error">
          <AlertContent>
            <AlertTitle>Invalid event time</AlertTitle>
            <AlertDescription>
              End time must be after the start time.
            </AlertDescription>
          </AlertContent>
        </Alert>
      ));
      return;
    }

    const event = buildEventPayload();
    if (showEventForm && !event) {
      toast.custom(() => (
        <Alert variant="error">
          <AlertContent>
            <AlertTitle>Event details required</AlertTitle>
            <AlertDescription>
              Add an event title and start date/time.
            </AlertDescription>
          </AlertContent>
        </Alert>
      ));
      return;
    }

    const celebration = buildCelebrationPayload();

    if (!content.trim() && !attachment && !event && !celebration) return;

    setLoading(true);

    try {
      let image: string | undefined;
      let video: string | undefined;
      let file: string | undefined;

      if (attachment) {
        const uploaded = await uploadPostAttachment(attachment.file);
        if (uploaded.attachmentType === "image") image = uploaded.url;
        else if (uploaded.attachmentType === "video") video = uploaded.url;
        else file = uploaded.url;
      }

      const { post: created } = await api.posts.create({
        content,
        media: { image, video, file },
        event,
        celebration,
      });
      await refresh();

      const publisherName = user.name?.trim() || user.username || "You";

      toast.custom(() => (
        <Alert variant="success">
          <AlertContent>
            <AlertTitle>
              {event
                ? "Event published!"
                : celebration
                  ? "Celebration published!"
                  : "Post published!"}
            </AlertTitle>
            <AlertDescription>
              {event
                ? `${publisherName} published an event.`
                : celebration
                  ? `${publisherName} published a celebration.`
                  : `${publisherName} published the post.`}
            </AlertDescription>
          </AlertContent>
        </Alert>
      ));
      resetComposer();
      onPosted?.(created);
    } catch (error) {
      toast.custom(() => (
        <Alert variant="error">
          <AlertContent>
            <AlertTitle>Could not publish</AlertTitle>
            <AlertDescription>
              {getErrorMessage(error, "Please try again.")}
            </AlertDescription>
          </AlertContent>
        </Alert>
      ));
    } finally {
      setLoading(false);
    }
  }

  const canPost = Boolean(
    user &&
    !loading &&
    (content.trim() ||
      attachment ||
      (showEventForm && eventDraft.title.trim() && eventDraft.startsAt) ||
      showCelebrationForm),
  );

  return (
    <>
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

      <Card padding="none" className={feedCardClass}>
        <CardContent className={feedCardSectionClass}>
          <div className="flex items-center gap-2">
            <CurrentUserAvatar size="sm" />
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 justify-start rounded-full px-4 text-muted-foreground"
              onClick={openModal}
              disabled={!user}
            >
              Start a post
            </Button>
          </div>

          <Separator className="my-3" />

          <div className="flex items-center justify-between">
            {feedActions.map(({ label, icon: Icon, iconClass, kind }) => (
              <Button
                key={label}
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  if (kind === "image" || kind === "video") {
                    openPicker(kind);
                    return;
                  }
                  openArticleEditor();
                }}
              >
                <Icon className={cn("size-5", iconClass)} />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !loading) resetComposer();
          else setOpen(nextOpen);
        }}
      >
        <DialogContent
          size="lg"
          className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[552px]"
        >
          <DialogTitle className="sr-only">Create a post</DialogTitle>

          <div className="flex shrink-0 items-start gap-3 px-4 pt-4 pr-12">
            <CurrentUserAvatar size="sm" />
            <div className="min-w-0 flex-1 space-y-1">
              <Button
                variant="ghost"
                className="h-auto px-0 py-0 font-semibold"
              >
                {user?.name ?? "Your profile"}
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>
              <Badge variant="outline" size="md">
                <Globe className="size-3" />
                Post to Anyone
                <ChevronDown className="size-3" />
              </Badge>
            </div>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-2"
            data-scroll-lock-scrollable=""
          >
            <MentionTextarea
              ref={textareaRef}
              autoFocus
              variant="outline"
              size="md"
              placeholder={
                showEventForm
                  ? "What is this event about?"
                  : "What do you want to talk about?"
              }
              value={content}
              onValueChange={setContent}
              disabled={loading}
            />

            {showEventForm && (
              <Card className="mb-3 overflow-hidden border shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">Event details</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      onClick={clearEvent}
                      disabled={loading}
                      aria-label="Remove event"
                    >
                      <X />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="event-title">Event name</Label>
                    <Input
                      id="event-title"
                      placeholder="Add a title"
                      value={eventDraft.title}
                      onChange={(e) =>
                        setEventDraft((d) => ({ ...d, title: e.target.value }))
                      }
                      disabled={loading}
                      autoComplete="off"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="event-start">Start</Label>
                      <DateTimePickerPopover
                        id="event-start"
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
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="event-end">End (optional)</Label>
                      <DateTimePickerPopover
                        id="event-end"
                        value={eventDraft.endsAt}
                        onChange={(next) =>
                          setEventDraft((d) => ({
                            ...d,
                            endsAt: next,
                          }))
                        }
                        disabled={loading}
                        placeholder="Select end"
                        minValue={eventDraft.startsAt}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="event-location">Location (optional)</Label>
                    <Input
                      id="event-location"
                      placeholder="Add a venue or online link"
                      value={eventDraft.location}
                      onChange={(e) =>
                        setEventDraft((d) => ({
                          ...d,
                          location: e.target.value,
                        }))
                      }
                      disabled={loading}
                      autoComplete="off"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {showEventForm && eventDraft.title.trim() && eventDraft.startsAt ? (
              <PostEventCard
                event={{
                  title: eventDraft.title.trim(),
                  startsAt: new Date(eventDraft.startsAt).toISOString(),
                  ...(eventDraft.endsAt
                    ? {
                        endsAt: new Date(eventDraft.endsAt).toISOString(),
                      }
                    : {}),
                  ...(eventDraft.location.trim()
                    ? { location: eventDraft.location.trim() }
                    : {}),
                }}
              />
            ) : null}

            {showCelebrationForm && (
              <Card className="mb-3 overflow-hidden border shadow-sm">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">Celebrate an occasion</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      onClick={clearCelebration}
                      disabled={loading}
                      aria-label="Remove celebration"
                    >
                      <X />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="celebration-occasion">Occasion</Label>
                    <Select
                      value={celebrationDraft.occasion}
                      onValueChange={(value) =>
                        setCelebrationDraft((d) => ({
                          ...d,
                          occasion: value as CelebrationOccasion,
                        }))
                      }
                      disabled={loading}
                    >
                      <SelectTrigger id="celebration-occasion">
                        <SelectValue placeholder="Choose an occasion" />
                      </SelectTrigger>
                      <SelectContent>
                        {CELEBRATION_OCCASIONS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.emoji} {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="celebration-message">
                      Message (optional)
                    </Label>
                    <Textarea
                      id="celebration-message"
                      placeholder="Say a few words about it..."
                      value={celebrationDraft.message}
                      onChange={(e) =>
                        setCelebrationDraft((d) => ({
                          ...d,
                          message: e.target.value,
                        }))
                      }
                      disabled={loading}
                      size="sm"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {showCelebrationForm ? (
              <PostCelebrationCard
                celebration={{
                  occasion: celebrationDraft.occasion,
                  ...(celebrationDraft.message.trim()
                    ? { message: celebrationDraft.message.trim() }
                    : {}),
                }}
              />
            ) : null}

            {attachment && (
              <Card className="relative mb-2 overflow-hidden">
                {attachment.type === "image" && attachment.previewUrl && (
                  <div className="relative aspect-video max-h-72 w-full">
                    <Image
                      src={attachment.previewUrl}
                      alt="Selected image preview"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                )}
                {attachment.type === "video" && attachment.previewUrl && (
                  <video
                    src={attachment.previewUrl}
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
                      <ItemTitle>{attachment.file.name}</ItemTitle>
                      <ItemDescription>
                        {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                      </ItemDescription>
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
                  disabled={loading}
                  aria-label="Remove attachment"
                >
                  <X />
                </Button>
              </Card>
            )}

            <EmojiPickerButton
              disabled={loading}
              buttonClassName="my-2 self-start"
              side="top"
              align="start"
              onSelect={insertEmoji}
            />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
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
                onClick={openCelebrationForm}
                aria-label="Celebrate an occasion"
                aria-pressed={showCelebrationForm}
                className={cn(
                  showCelebrationForm && "bg-accent text-foreground",
                )}
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
                    Create an event
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openArticleEditor}>
                    <Newspaper className="size-4" />
                    Write article
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-4 py-3 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() =>
                toast.custom(() => (
                  <Alert variant="information">
                    <AlertContent>
                      <AlertTitle>Scheduling coming soon</AlertTitle>
                      <AlertDescription>
                        You can schedule your post.
                      </AlertDescription>
                    </AlertContent>
                  </Alert>
                ))
              }
              aria-label="Schedule post"
            >
              <Clock />
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handlePost}
              disabled={!canPost}
              loading={loading}
            >
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ArticleEditorDialog
        open={isArticleDialogOpen}
        onOpenChange={handleArticleOpenChange}
        onPublished={(post) => onPosted?.(post)}
      />
    </>
  );
}
