"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { createPortal } from "react-dom";

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

/** Inline LinkedIn-style slider: one image at a time with arrows, a seekable
 * progress bar + page counter, swipe, and a fullscreen button. */
function Carousel({
  images,
  onFullscreen,
}: {
  images: string[];
  onFullscreen: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const touchStartX = useRef<number | null>(null);
  const clamp = (value: number) => Math.min(total - 1, Math.max(0, value));
  const go = (dir: number) => setIndex((current) => clamp(current + dir));
  const progress = total > 1 ? (index / (total - 1)) * 100 : 0;

  return (
    <div className="group relative aspect-square w-full select-none overflow-hidden rounded-lg bg-neutral-900">
      <div
        className="flex h-full w-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current == null) return;
          const dx = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
      >
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Open image ${i + 1}`}
            onClick={() => onFullscreen(index)}
            className="relative h-full w-full shrink-0"
          >
            <Image
              src={src}
              alt={`Image ${i + 1} of ${total}`}
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
          aria-label="Previous image"
          onClick={() => go(-1)}
          className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
        >
          <ChevronLeft className="size-5" />
        </button>
      ) : null}
      {index < total - 1 ? (
        <button
          type="button"
          aria-label="Next image"
          onClick={() => go(1)}
          className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
        >
          <ChevronRight className="size-5" />
        </button>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-white">
        <span className="shrink-0 text-xs font-semibold tabular-nums">
          {index + 1} / {total}
        </span>
        <div
          role="slider"
          aria-label="Image position"
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
          className="shrink-0 rounded-full p-1 text-white/90 transition-colors hover:text-white"
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
  layout = "grid",
}: {
  images: string[];
  layout?: "grid" | "slider";
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const count = images.length;
  if (count === 0) return null;

  const open = (index: number) => setLightbox(index);

  return (
    <>
      {count === 1 ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Tile src={images[0]} onClick={() => open(0)} />
        </div>
      ) : layout === "slider" ? (
        <Carousel images={images} onFullscreen={open} />
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
