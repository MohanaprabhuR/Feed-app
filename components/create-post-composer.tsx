"use client";

import { useRouter } from "next/navigation";
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
  Smile,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/current-user-provider";
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
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import {
  getAttachmentType,
  uploadPostAttachment,
  validatePostAttachment,
  type PostAttachmentType,
} from "@/lib/post-media";
import { createPost } from "@/lib/posts";
import type { Post } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { feedCardClass, feedCardSectionClass } from "@/lib/feed-layout";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

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
};

export function CreatePostComposer({ onPosted }: CreatePostComposerProps) {
  const router = useRouter();
  const { user, refresh } = useCurrentUser();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<ComposerAttachment | null>(null);
  const [loading, setLoading] = useState(false);

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
    setContent("");
    setOpen(false);
  }

  function handleFileSelect(file: File | undefined) {
    if (!file) return;

    const validationError = validatePostAttachment(file);
    if (validationError) {
      toast.custom((t) => (
        <Alert variant="error">
          <AlertTitle>Invalid file.</AlertTitle>
          <AlertDescription>You must select a valid file.</AlertDescription>
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
    if (!user || (!content.trim() && !attachment)) return;

    setLoading(true);

    try {
      const supabase = createClient();
      let image: string | undefined;
      let video: string | undefined;
      let file: string | undefined;

      if (attachment) {
        const uploaded = await uploadPostAttachment(attachment.file);
        if (uploaded.attachmentType === "image") image = uploaded.url;
        else if (uploaded.attachmentType === "video") video = uploaded.url;
        else file = uploaded.url;
      }

      const created = await createPost(supabase, user.id, content, {
        image,
        video,
        file,
      });
      await refresh();

      toast.custom((t) => (
        <Alert variant="success">
          <AlertTitle>Post published!</AlertTitle>
          <AlertDescription>You have published the post.</AlertDescription>
        </Alert>
      ));
      resetComposer();
      onPosted?.(created);
    } catch (error) {
      toast.custom((t) => (
        <Alert variant="error">
          <AlertTitle>Could not publish post.</AlertTitle>
          <AlertDescription>You could not publish the post.</AlertDescription>
        </Alert>
      ));
    } finally {
      setLoading(false);
    }
  }

  const canPost = Boolean(user && (content.trim() || attachment) && !loading);

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
                  router.push("/articles/new");
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
          className="max-h-[min(90vh,720px)] gap-0 overflow-hidden p-0 sm:max-w-[552px]"
        >
          <DialogTitle className="sr-only">Create a post</DialogTitle>

          <div className="flex items-start gap-3 px-4 pt-4 pr-12">
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

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-2">
            <Textarea
              autoFocus
              placeholder="What do you want to talk about?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[168px] resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              disabled={loading}
            />

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

            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              className="mb-2 self-start"
              onClick={() =>
                toast.custom((t) => (
                  <Alert variant="information">
                    <AlertTitle>Emoji picker coming soon</AlertTitle>
                    <AlertDescription>
                      You can add emojis to your post.
                    </AlertDescription>
                  </Alert>
                ))
              }
              aria-label="Add emoji"
            >
              <Smile />
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() =>
                toast.custom((t) => (
                  <Alert variant="information">
                    <AlertTitle>AI enhance coming soon</AlertTitle>
                    <AlertDescription>
                      You can enhance your post with AI.
                    </AlertDescription>
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
                onClick={() =>
                  toast.custom((t) => (
                    <Alert variant="information">
                      <AlertTitle>Events coming soon</AlertTitle>
                      <AlertDescription>
                        You can create events for your post.
                      </AlertDescription>
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
                onClick={() =>
                  toast.custom((t) => (
                    <Alert variant="information">
                      <AlertTitle>Celebrate coming soon</AlertTitle>
                      <AlertDescription>
                        You can celebrate occasions for your post.
                      </AlertDescription>
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
                      toast.custom((t) => (
                        <Alert variant="information">
                          <AlertTitle>Events coming soon</AlertTitle>
                          <AlertDescription>
                            You can create events for your post.
                          </AlertDescription>
                        </Alert>
                      ))
                    }
                  >
                    <Calendar className="size-4" />
                    Create an event
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/articles/new")}
                  >
                    <Newspaper className="size-4" />
                    Write article
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <DialogFooter className="border-t px-4 py-3 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() =>
                toast.custom((t) => (
                  <Alert variant="information">
                    <AlertTitle>Scheduling coming soon</AlertTitle>
                    <AlertDescription>
                      You can schedule your post.
                    </AlertDescription>
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
    </>
  );
}
