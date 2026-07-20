"use client";

import Link from "next/link";
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
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { uploadPostAttachment } from "@/lib/post-media";
import { createArticle } from "@/lib/posts";
import { createClient } from "@/lib/supabase/client";
import { feedCardClass, feedCardSectionClass } from "@/lib/feed-layout";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription, AlertContent } from "./ui/alert";

export function ArticleEditor() {
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
      const supabase = createClient();
      let coverImage: string | undefined;

      if (coverFile) {
        const uploaded = await uploadPostAttachment(coverFile);
        if (uploaded.attachmentType !== "image") {
          throw new Error("Cover must be an image.");
        }
        coverImage = uploaded.url;
      }

      const article = await createArticle(supabase, user.id, {
        title,
        content,
        coverImage,
      });

      toast.custom(() => (
        <Alert variant="success">
          <AlertContent>
            <AlertTitle>Article published!</AlertTitle>
            <AlertDescription>You have published the article.</AlertDescription>
          </AlertContent>
        </Alert>
      ));
      router.push(`/articles/${article.id}`);
      router.refresh();
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
    user && title.trim() && content.trim() && !loading,
  );

  return (
    <Card
      padding="none"
      className={cn(feedCardClass, "mx-auto max-w-3xl border-0 shadow-none")}
    >
      <CardContent className={cn(feedCardSectionClass, "space-y-6 pb-10")}>
        <Item size="sm" className="p-0">
          <CurrentUserAvatar size="sm" />
          <ItemContent>
            <ItemTitle>{user?.name ?? "Your profile"}</ItemTitle>
            <ItemDescription>Writing an article</ItemDescription>
          </ItemContent>
        </Item>

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
          <Label htmlFor="article-title">Title</Label>
          <Input
            id="article-title"
            size="lg"
            placeholder="Article title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

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
          <Label htmlFor="article-body">Body</Label>
          <Textarea
            id="article-body"
            size="lg"
            placeholder="Write your article..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
          />
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" asChild disabled={loading}>
            <Link href="/feed">Cancel</Link>
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
