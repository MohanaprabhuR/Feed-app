"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/components/current-user-provider";
import { CurrentUserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "@/components/rich-text-editor";
import { isRichTextEmpty } from "@/lib/rich-text";
import { uploadPostAttachment } from "@/lib/post-media";
import { api } from "@/lib/api-client";
import { feedCardClass, feedCardSectionClass } from "@/lib/feed-layout";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription, AlertContent } from "./ui/alert";

type ArticleEditorProps = {
  onPublished?: (post?: Post) => void;
  onCancel?: () => void;
};

export function ArticleEditor({ onPublished, onCancel }: ArticleEditorProps = {}) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function clearCover() {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
  }

  function handleCoverSelect(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.custom(() => (
        <Alert variant="error">
          <AlertContent>
            <AlertTitle>Cover must be an image.</AlertTitle>
            <AlertDescription>
              You must select an image for the cover.
            </AlertDescription>
          </AlertContent>
        </Alert>
      ));
      return;
    }
    clearCover();
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handlePublish() {
    if (!user) {
      toast.custom(() => (
        <Alert variant="error">
          <AlertContent>
            <AlertTitle>Sign in to publish an article.</AlertTitle>
            <AlertDescription>
              You must be signed in to publish an article.
            </AlertDescription>
          </AlertContent>
        </Alert>
      ));
      return;
    }

    setLoading(true);

    try {
      let coverImage: string | undefined;

      if (coverFile) {
        const uploaded = await uploadPostAttachment(coverFile);
        if (uploaded.attachmentType !== "image") {
          throw new Error("Cover must be an image.");
        }
        coverImage = uploaded.url;
      }

      const { post: article } = await api.posts.createArticle({
        title: title.trim(),
        content: isRichTextEmpty(content) ? "" : content,
        coverImage,
      });

      toast.custom(() => (
        <Alert variant="success">
          <AlertContent>
            <AlertTitle>Article published!</AlertTitle>
            <AlertDescription>
              {`${user.name?.trim() || user.username || "You"} published the article.`}
            </AlertDescription>
          </AlertContent>
        </Alert>
      ));
      if (onPublished) {
        onPublished(article);
      } else {
        router.push("/feed");
        router.refresh();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.custom(() => (
        <Alert variant="error">
          <AlertContent>
            <AlertTitle>Could not publish article.</AlertTitle>
            <AlertDescription>
              You could not publish the article.
            </AlertDescription>
          </AlertContent>
        </Alert>
      ));
    } finally {
      setLoading(false);
    }
  }

  const canPublish = Boolean(
    user && title.trim() && !isRichTextEmpty(content) && !loading,
  );

  return (
    <Card
      padding="none"
      className={cn(feedCardClass, "mx-auto max-w-3xl border-0 shadow-none")}
    >
      <CardContent className={cn(feedCardSectionClass, "space-y-6 pb-10")}>
        <div className="flex items-center gap-2.5">
          <CurrentUserAvatar size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium leading-tight">
              {user?.name ?? "Your profile"}
            </p>
            <p className="text-xs text-muted-foreground">Author</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="article-title" className="text-muted-foreground">
            Title
          </Label>
          <Input
            id="article-title"
            size="lg"
            placeholder="Article title"
            className="h-auto border-0 bg-transparent px-0 font-serif text-2xl font-semibold shadow-none focus-visible:ring-0"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            handleCoverSelect(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Cover image (optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => coverInputRef.current?.click()}
              disabled={loading}
            >
              <ImageIcon className="size-4" />
              Add cover
            </Button>
          </div>

          {coverPreview && (
            <div className="relative overflow-hidden rounded-xl border">
              <div className="relative aspect-2/1 w-full">
                <Image
                  src={coverPreview}
                  alt="Cover preview"
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
                onClick={clearCover}
                disabled={loading}
                aria-label="Remove cover"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Body</Label>
          <RichTextEditor
            value={content}
            onValueChange={setContent}
            disabled={loading}
            placeholder="Write your article…"
            editorClassName="min-h-80"
          />
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => {
              if (onCancel) {
                onCancel();
                return;
              }
              router.push("/feed");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!canPublish}
            loading={loading}
          >
            Publish
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
