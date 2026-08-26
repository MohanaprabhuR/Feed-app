"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { searchFollowingForMentions } from "@/lib/follows";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/user-avatar";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

type MentionListHandle = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

type MentionListProps = {
  items: User[];
  command: (attrs: { id: string; label: string }) => void;
};

const MentionList = forwardRef<MentionListHandle, MentionListProps>(
  function MentionList({ items, command }, ref) {
    const [index, setIndex] = useState(0);

    useEffect(() => setIndex(0), [items]);

    const select = (i: number) => {
      const item = items[i];
      // Insert the @username handle (no spaces, unambiguous) rather than the
      // display name, which could contain spaces and break the mention.
      if (item) command({ id: item.username, label: item.username });
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (items.length === 0) return false;
        if (event.key === "ArrowUp") {
          setIndex((index + items.length - 1) % items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setIndex((index + 1) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          select(index);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) return null;

    return (
      <div className="w-64 overflow-hidden rounded-lg border bg-popover py-1 text-popover-foreground shadow-md">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              select(i);
            }}
            onMouseEnter={() => setIndex(i)}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-1.5 text-left",
              i === index && "bg-accent",
            )}
          >
            <UserAvatar src={item.avatar} name={item.name} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {item.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                @{item.username}
              </span>
            </span>
          </button>
        ))}
      </div>
    );
  },
);

/** A Mention extension that suggests the current user's followed accounts. */
export function createMentionExtension(userId: string) {
  const suggestion: Omit<SuggestionOptions, "editor"> = {
    char: "@",
    items: async ({ query }) => {
      try {
        const supabase = createClient();
        return await searchFollowingForMentions(supabase, userId, query, {
          limit: 8,
        });
      } catch {
        return [];
      }
    },
    render: () => {
      let component: ReactRenderer<MentionListHandle, MentionListProps> | null =
        null;
      let el: HTMLDivElement | null = null;

      const place = (rect: (() => DOMRect | null) | null | undefined) => {
        if (!el || !rect) return;
        const r = rect();
        if (!r) return;
        el.style.left = `${r.left}px`;
        el.style.top = `${r.bottom + 6}px`;
      };

      const destroy = () => {
        el?.remove();
        el = null;
        component?.destroy();
        component = null;
      };

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
            props: { items: props.items as User[], command: props.command },
            editor: props.editor,
          });
          el = document.createElement("div");
          el.style.position = "fixed";
          el.style.zIndex = "9999";
          document.body.appendChild(el);
          el.appendChild(component.element);
          place(props.clientRect);
        },
        onUpdate: (props) => {
          if (!component) return;
          component.updateProps({
            items: props.items as User[],
            command: props.command,
          });
          place(props.clientRect);
        },
        onKeyDown: (props) => {
          // Escape dismisses the popup (the suggestion plugin has no built-in
          // close, so tear it down here).
          if (props.event.key === "Escape") {
            destroy();
            return true;
          }
          return component?.ref?.onKeyDown({ event: props.event }) ?? false;
        },
        onExit: destroy,
      };
    },
  };

  return Mention.configure({
    HTMLAttributes: { class: "mention" },
    suggestion,
  });
}
