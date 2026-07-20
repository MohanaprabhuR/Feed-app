"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Smile } from "lucide-react";
import { useTheme } from "next-themes";
import { Theme } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const EmojiPicker = dynamic(
  () => import("emoji-picker-react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[350px] w-[350px] items-center justify-center text-sm text-muted-foreground">
        Loading emojis…
      </div>
    ),
  },
);

/** Insert emoji at caret (or append). Returns next value + caret index. */
export function insertEmojiAtCaret(
  value: string,
  emoji: string,
  start: number | null | undefined,
  end: number | null | undefined = start,
): { value: string; caret: number } {
  const from = typeof start === "number" ? start : value.length;
  const to = typeof end === "number" ? end : from;
  const next = value.slice(0, from) + emoji + value.slice(to);
  return { value: next, caret: from + emoji.length };
}

type EmojiPickerButtonProps = {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Keep picker open after picking. Default false — closes after one emoji. */
  stayOpenOnSelect?: boolean;
};

export function EmojiPickerButton({
  onSelect,
  disabled,
  className,
  buttonClassName,
  side = "top",
  align = "start",
  stayOpenOnSelect = false,
}: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const pickerTheme = resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          disabled={disabled}
          className={cn("text-muted-foreground", buttonClassName)}
          aria-label="Add emoji"
        >
          <Smile className={cn("size-4", className)} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={8}
        // Override default popover `overflow-auto flex` so the picker's own body can scroll.
        className="z-80 block w-auto overflow-visible border-0 bg-transparent p-0 shadow-none"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {open ? (
          <div
            // Allow scroll inside Dialog / RemoveScroll lock.
            data-scroll-lock-scrollable=""
            className="emoji-picker-shell overflow-hidden rounded-xl shadow-lg"
            onWheel={(e) => e.stopPropagation()}
          >
            <EmojiPicker
              theme={pickerTheme}
              lazyLoadEmojis
              searchPlaceHolder="Search"
              previewConfig={{ showPreview: false }}
              width={350}
              height={400}
              onEmojiClick={(emojiData) => {
                onSelect(emojiData.emoji);
                if (!stayOpenOnSelect) setOpen(false);
              }}
            />
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
