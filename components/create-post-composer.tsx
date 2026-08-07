"use client";

import { useEffect, useRef, useState } from "react";
import { isRichTextEmpty } from "@/lib/rich-text";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/rich-text-editor";
import Image from "next/image";
import {
  Award,
  Calendar,
  Files,
  GalleryHorizontalEnd,
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
import { EmojiPickerButton } from "@/components/emoji-picker-button";
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
import { CELEBRATION_OCCASIONS, getCelebrationMeta } from "@/lib/celebrations";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PostEventCard } from "@/components/post-event-card";
import { PostCelebrationCard } from "@/components/post-celebration-card";
import { DateTimePickerPopover } from "@/components/datetime-picker-popover";
import { ArticleEditorDialog } from "@/components/article-editor-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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

function ComposerIconButton({
  label,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={label}
          className={className}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

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
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [open, setOpen] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const isArticleDialogOpen = articleOpen || initialArticleOpen;
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<ComposerAttachment | null>(null);
  const [images, setImages] = useState<
    { file: File; previewUrl: string; caption: string }[]
  >([]);
  const [imageLayout, setImageLayout] = useState<
    "grid" | "slider" | "document"
  >("grid");
  const [docTitle, setDocTitle] = useState("");
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
    editorRef.current?.insertText(emoji);
  }

  function openEventForm() {
    openModal();
    setShowEventForm(true);
    setEventDraft((current) => ({
      ...current,
      startsAt: current.startsAt || defaultEventStart(),
    }));
  }

  function openCelebrationForm() {
    openModal();
    setShowCelebrationForm(true);
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

  function clearImages() {
    setImageLayout("grid");
    setDocTitle("");
    setImages((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
  }

  function removeImage(index: number) {
    setImages((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((_, i) => i !== index);
    });
  }

  function handleImagesSelect(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const picked: { file: File; previewUrl: string; caption: string }[] = [];
    for (const file of Array.from(fileList)) {
      if (getAttachmentType(file) !== "image") continue;
      const validationError = validatePostAttachment(file);
      if (validationError) {
        toast.custom(() => (
          <Alert variant="error">
            <AlertContent>
              <AlertTitle>Invalid image.</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </AlertContent>
          </Alert>
        ));
        continue;
      }
      picked.push({ file, previewUrl: URL.createObjectURL(file), caption: "" });
    }
    if (picked.length === 0) return;
    // Picking images replaces any single video/file attachment.
    clearAttachment();
    setImages((current) => [...current, ...picked]);
    setOpen(true);
  }

  function setImageCaption(index: number, caption: string) {
    setImages((current) =>
      current.map((item, i) => (i === index ? { ...item, caption } : item)),
    );
  }

  function resetComposer() {
    clearAttachment();
    clearImages();
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

    // A post holds one media kind — a video/file replaces any staged photos.
    clearImages();
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
    if (kind === "image") setImageLayout("grid");
    openModal();
    requestAnimationFrame(() => {
      if (kind === "image") imageInputRef.current?.click();
      if (kind === "video") videoInputRef.current?.click();
      if (kind === "file") fileInputRef.current?.click();
    });
  }

  /** Add images that display as a swipeable card slider. */
  function openSliderPicker() {
    setImageLayout("slider");
    openModal();
    requestAnimationFrame(() => imageInputRef.current?.click());
  }

  /** Add images that display as a paged document carousel with a header title. */
  function openDocumentPicker() {
    setImageLayout("document");
    openModal();
    requestAnimationFrame(() => imageInputRef.current?.click());
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

    // Empty editors serialize to "<p></p>"; store nothing rather than markup.
    const bodyHtml = isRichTextEmpty(content) ? "" : content;

    if (
      !bodyHtml &&
      !attachment &&
      images.length === 0 &&
      !event &&
      !celebration
    )
      return;

    setLoading(true);

    try {
      let image: string | undefined;
      let video: string | undefined;
      let file: string | undefined;
      let imageUrls: string[] | undefined;

      if (images.length > 0) {
        const uploaded = await Promise.all(
          images.map((item) => uploadPostAttachment(item.file)),
        );
        imageUrls = uploaded.map((result) => result.url);
      } else if (attachment) {
        const uploaded = await uploadPostAttachment(attachment.file);
        if (uploaded.attachmentType === "image") image = uploaded.url;
        else if (uploaded.attachmentType === "video") video = uploaded.url;
        else file = uploaded.url;
      }

      const multiImage = (imageUrls?.length ?? 0) > 1;
      const { post: created } = await api.posts.create({
        content: bodyHtml,
        media: { image, video, file },
        images: imageUrls,
        imageCaptions:
          imageLayout === "slider" && images.length > 0
            ? images.map((item) => item.caption)
            : undefined,
        mediaLayout: multiImage ? imageLayout : "grid",
        title:
          imageLayout === "document" && docTitle.trim()
            ? docTitle.trim()
            : undefined,
        event,
        celebration,
      });
      // Profile counters are nice-to-have; don't fail a successful publish.
      void refresh().catch(() => {});

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
    (!isRichTextEmpty(content) ||
      images.length > 0 ||
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
        multiple
        className="hidden"
        onChange={(e) => {
          handleImagesSelect(e.target.files);
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
            <Avatar size="2xl">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
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
          className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-138"
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
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pt-4 pb-2"
            data-scroll-lock-scrollable=""
          >
            <RichTextEditor
              ref={editorRef}
              autoFocus
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
              <Card padding="none" className="overflow-hidden border shadow-sm">
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
              <Card
                padding="none"
                className="overflow-hidden border bg-gradient-to-br from-amber-50/60 to-rose-50/60 shadow-sm dark:from-amber-950/20 dark:to-rose-950/20"
              >
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-lg shadow-sm">
                      {getCelebrationMeta(celebrationDraft.occasion).emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight">
                        Celebrate an occasion
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pick what you&apos;re celebrating.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      className="-mr-1 -mt-1 shrink-0"
                      onClick={clearCelebration}
                      disabled={loading}
                      aria-label="Remove celebration"
                    >
                      <X />
                    </Button>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Occasion"
                    className="flex flex-wrap gap-2"
                  >
                    {CELEBRATION_OCCASIONS.map((item) => {
                      const selected = celebrationDraft.occasion === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={loading}
                          onClick={() =>
                            setCelebrationDraft((d) => ({
                              ...d,
                              occasion: item.value,
                            }))
                          }
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                            selected
                              ? "border-primary bg-primary/10 font-medium text-foreground"
                              : "border-border bg-background/60 text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <span aria-hidden>{item.emoji}</span>
                          {item.label}
                        </button>
                      );
                    })}
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
                      className="bg-background/70"
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

            {images.length > 0 && imageLayout === "document" && (
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Document title (shown on the header)"
                disabled={loading}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}

            {images.length > 0 &&
              (imageLayout === "slider" ? (
                // Slider mode: each image gets an optional caption.
                <div className="space-y-2">
                  {images.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-lg border p-2"
                    >
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={item.previewUrl}
                          alt={`Selected image ${index + 1}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <input
                        type="text"
                        value={item.caption}
                        onChange={(e) => setImageCaption(index, e.target.value)}
                        placeholder={`Caption ${index + 1} (optional)`}
                        disabled={loading}
                        className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={() => removeImage(index)}
                        disabled={loading}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    "grid gap-1",
                    images.length === 1
                      ? "grid-cols-1"
                      : "grid-cols-2 sm:grid-cols-3",
                  )}
                >
                  {images.map((item, index) => (
                    <div
                      key={index}
                      className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                    >
                      <Image
                        src={item.previewUrl}
                        alt={`Selected image ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        iconOnly
                        className="absolute right-1 top-1 size-7"
                        onClick={() => removeImage(index)}
                        disabled={loading}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                </div>
              ))}

            {attachment && (
              <Card className="relative overflow-hidden">
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
              <ComposerIconButton
                label="Image"
                onClick={() => openPicker("image")}
              >
                <ImageIcon />
              </ComposerIconButton>
              <ComposerIconButton
                label="Slider"
                onClick={openSliderPicker}
                aria-pressed={imageLayout === "slider"}
                className={cn(
                  imageLayout === "slider" && "bg-accent text-foreground",
                )}
              >
                <GalleryHorizontalEnd />
              </ComposerIconButton>
              <ComposerIconButton
                label="Document slider"
                onClick={openDocumentPicker}
                aria-pressed={imageLayout === "document"}
                className={cn(
                  imageLayout === "document" && "bg-accent text-foreground",
                )}
              >
                <Files />
              </ComposerIconButton>
              <ComposerIconButton
                label="Video"
                onClick={() => openPicker("video")}
              >
                <Video />
              </ComposerIconButton>
              <ComposerIconButton
                label="Event"
                onClick={openEventForm}
                aria-pressed={showEventForm}
                className={cn(showEventForm && "bg-accent text-foreground")}
              >
                <Calendar />
              </ComposerIconButton>
              <ComposerIconButton
                label="Celebrate"
                onClick={openCelebrationForm}
                aria-pressed={showCelebrationForm}
                className={cn(
                  showCelebrationForm && "bg-accent text-foreground",
                )}
              >
                <Award />
              </ComposerIconButton>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6}>
                    More
                  </TooltipContent>
                </Tooltip>
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
