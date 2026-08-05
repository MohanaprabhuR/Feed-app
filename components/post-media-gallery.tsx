"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

function isStorageUrl(url: string) {
  return url.includes("/storage/v1/object/public/");
}

/** Full-screen image viewer (opened from a slide or the fullscreen button). */
function Lightbox({
  images,
  index,
  onClose,
  onIndex,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onIndex: (next: number) => void;
}) {
  const total = images.length;
  const go = (dir: number) => onIndex((index + dir + total) % total);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onIndex((index + 1) % total);
      if (event.key === "ArrowLeft") onIndex((index - 1 + total) % total);
    }
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [index, total, onClose, onIndex]);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-3 backdrop-blur-[2px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/60"
      >
        <X className="size-5" />
      </button>

      {total > 1 ? (
        <button
          type="button"
          aria-label="Previous image"
          onClick={(event) => {
            event.stopPropagation();
            go(-1);
          }}
          className="absolute left-2 z-20 flex size-10 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/60 sm:left-4"
        >
          <ChevronLeft className="size-6" />
        </button>
      ) : null}

      <div
        className="relative flex max-h-[min(94vh,960px)] w-full max-w-[min(94vw,760px)] items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- full-screen viewer of a user upload with unknown dimensions */}
        <img
          src={images[index]}
          alt={`Image ${index + 1} of ${total}`}
          className="max-h-[min(94vh,960px)] w-full rounded-xl object-contain shadow-2xl"
        />

        {total > 1 ? (
          <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-white tabular-nums">
            {index + 1} / {total}
          </div>
        ) : null}
      </div>

      {total > 1 ? (
        <button
          type="button"
          aria-label="Next image"
          onClick={(event) => {
            event.stopPropagation();
            go(1);
          }}
          className="absolute right-2 z-20 flex size-10 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/60 sm:right-4"
        >
          <ChevronRight className="size-6" />
        </button>
      ) : null}
    </div>
  );
}

const CARD_WIDTH = 80; // % of the viewport per card (leaves peek on each side)

/** LinkedIn-style card carousel: a centered card with peeking neighbors, arrows,
 * an optional per-card caption, dots, and a fullscreen button. */
function Carousel({
  images,
  captions,
  onFullscreen,
}: {
  images: string[];
  captions?: string[];
  onFullscreen: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const touchStartX = useRef<number | null>(null);
  const clamp = (value: number) => Math.min(total - 1, Math.max(0, value));
  const go = (dir: number) => setIndex((current) => clamp(current + dir));
  const peek = (100 - CARD_WIDTH) / 2;

  return (
    <div className="select-none">
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${peek - index * CARD_WIDTH}%)` }}
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (touchStartX.current == null) return;
              const dx =
                (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
              touchStartX.current = null;
            }}
          >
            {images.map((src, i) => {
              const caption = captions?.[i]?.trim();
              const active = i === index;
              return (
                <div
                  key={i}
                  className="box-border shrink-0 px-1"
                  style={{ width: `${CARD_WIDTH}%` }}
                >
                  <button
                    type="button"
                    aria-label={`Open image ${i + 1}`}
                    onClick={() => (active ? onFullscreen(i) : setIndex(i))}
                    className="block w-full text-left"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-neutral-900">
                      <Image
                        src={src}
                        alt={`Image ${i + 1} of ${total}`}
                        fill
                        unoptimized={isStorageUrl(src)}
                        sizes="(max-width: 768px) 80vw, 480px"
                        className={cn(
                          "object-cover transition-opacity duration-200",
                          active ? "opacity-100" : "opacity-55",
                        )}
                      />
                    </div>
                    {caption ? (
                      <p
                        className={cn(
                          "mt-2 line-clamp-2 text-sm font-semibold transition-opacity",
                          active
                            ? "text-foreground"
                            : "text-muted-foreground opacity-70",
                        )}
                      >
                        {caption}
                      </p>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {index > 0 ? (
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => go(-1)}
            className="absolute left-1 top-[42%] z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-border transition-colors hover:bg-background"
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : null}
        {index < total - 1 ? (
          <button
            type="button"
            aria-label="Next image"
            onClick={() => go(1)}
            className="absolute right-1 top-[42%] z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-border transition-colors hover:bg-background"
          >
            <ChevronRight className="size-5" />
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-4 bg-foreground" : "w-1.5 bg-foreground/30",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="View fullscreen"
          onClick={() => onFullscreen(index)}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** LinkedIn document-carousel: dark header (title + page count), full-width
 * paged viewer, and a footer with a seekable scrubber + fullscreen. */
function DocumentCarousel({
  images,
  title,
  onFullscreen,
}: {
  images: string[];
  title?: string;
  onFullscreen: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const touchStartX = useRef<number | null>(null);
  const clamp = (value: number) => Math.min(total - 1, Math.max(0, value));
  const go = (dir: number) => setIndex((current) => clamp(current + dir));
  const progress = total > 1 ? (index / (total - 1)) * 100 : 0;

  return (
    <div className="select-none overflow-hidden rounded-lg border bg-neutral-100 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3 bg-neutral-700 px-4 py-2.5 text-white">
        <p className="truncate text-sm font-semibold">{title || "Document"}</p>
        <span className="shrink-0 text-sm tabular-nums text-white/90">
          {total} pages
        </span>
      </div>

      <div className="relative aspect-[3/4] overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            if (touchStartX.current == null) return;
            const dx =
              (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
            touchStartX.current = null;
          }}
        >
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Open page ${i + 1}`}
              onClick={() => onFullscreen(i)}
              className="relative h-full w-full shrink-0"
            >
              <Image
                src={src}
                alt={`Page ${i + 1} of ${total}`}
                fill
                unoptimized={isStorageUrl(src)}
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-contain"
              />
            </button>
          ))}
        </div>

        {index > 0 ? (
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-800/85 text-white transition-colors hover:bg-neutral-800"
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : null}
        {index < total - 1 ? (
          <button
            type="button"
            aria-label="Next page"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-800/85 text-white transition-colors hover:bg-neutral-800"
          >
            <ChevronRight className="size-5" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-3 bg-neutral-700 px-4 py-2.5 text-white">
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {index + 1} / {total}
        </span>
        <div
          role="slider"
          aria-label="Page position"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") go(-1);
            if (event.key === "ArrowRight") go(1);
          }}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const ratio = (event.clientX - rect.left) / rect.width;
            setIndex(clamp(Math.round(ratio * (total - 1))));
          }}
          className="relative h-1 flex-1 cursor-pointer rounded-full bg-white/30"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white"
            style={{ width: `${progress}%` }}
          />
          <span
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
            style={{ left: `${progress}%` }}
          />
        </div>
        <button
          type="button"
          aria-label="View fullscreen"
          onClick={() => onFullscreen(index)}
          className="shrink-0 text-white/90 transition-colors hover:text-white"
        >
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Tile({
  src,
  onClick,
  extra,
}: {
  src: string;
  onClick: () => void;
  extra?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative size-full overflow-hidden bg-muted"
    >
      <Image
        src={src}
        alt="Post image"
        fill
        unoptimized={isStorageUrl(src)}
        sizes="(max-width: 768px) 100vw, 600px"
        className="object-cover transition-transform duration-200 group-hover:scale-105"
      />
      {extra ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-3xl font-semibold text-white">
          +{extra}
        </span>
      ) : null}
    </button>
  );
}

/**
 * Post images. `layout="grid"` (default) shows the LinkedIn-style collage;
 * `layout="slider"` shows an inline carousel. Both open a fullscreen viewer.
 */
export function PostMediaGallery({
  images,
  captions,
  title,
  layout = "grid",
}: {
  images: string[];
  captions?: string[];
  title?: string;
  layout?: "grid" | "slider" | "document";
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const count = images.length;
  if (count === 0) return null;

  const open = (index: number) => setLightbox(index);

  return (
    <>
      {layout === "document" && count > 1 ? (
        <DocumentCarousel images={images} title={title} onFullscreen={open} />
      ) : count === 1 ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Tile src={images[0]} onClick={() => open(0)} />
        </div>
      ) : layout === "slider" ? (
        <Carousel images={images} captions={captions} onFullscreen={open} />
      ) : count === 2 ? (
        <div className="grid aspect-[16/10] grid-cols-2 gap-0.5 overflow-hidden rounded-lg">
          {images.map((src, index) => (
            <Tile key={index} src={src} onClick={() => open(index)} />
          ))}
        </div>
      ) : (
        // Collage: large lead image + a stacked right column (max 4), with a
        // "+N" overlay on the last tile when there are more images.
        <div className="grid aspect-[4/5] grid-cols-2 gap-0.5 overflow-hidden rounded-lg sm:aspect-square">
          <Tile src={images[0]} onClick={() => open(0)} />
          <div
            className="grid gap-0.5"
            style={{
              gridTemplateRows: `repeat(${Math.min(count - 1, 4)}, minmax(0, 1fr))`,
            }}
          >
            {images.slice(1, 5).map((src, offset) => {
              const index = offset + 1;
              const isLastTile = offset === Math.min(count - 1, 4) - 1;
              const extra = count - 5;
              return (
                <Tile
                  key={index}
                  src={src}
                  onClick={() => open(index)}
                  extra={isLastTile && extra > 0 ? extra : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

      {lightbox !== null
        ? createPortal(
            <Lightbox
              images={images}
              index={lightbox}
              onClose={() => setLightbox(null)}
              onIndex={setLightbox}
            />,
            document.body,
          )
        : null}
    </>
  );
}
