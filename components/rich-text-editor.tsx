"use client";

import { forwardRef, useEffect, useImperativeHandle } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Unlink,
} from "lucide-react";
import { createMentionExtension } from "@/components/rich-text-mention";
import { toEditorHtml } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

// The Link mark is inclusive when autolink is on, which makes typing (or a
// space) after a link extend the link. Force it non-inclusive so a link ends
// where you stop, while keeping autolink for pasted/typed URLs.
const NonInclusiveLink = Link.extend({
  inclusive() {
    return false;
  },
});

export interface RichTextEditorHandle {
  /** Insert plain text (e.g. an emoji) at the current caret. */
  insertText: (text: string) => void;
  focus: () => void;
  clear: () => void;
}

interface RichTextEditorProps {
  value: string;
  onValueChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  /** Extra classes for the editable area (e.g. a taller min-height). */
  editorClassName?: string;
  /** When set, enables @mentions of this user's followed accounts. */
  mentionUserId?: string;
}

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(function RichTextEditor(
  {
    value,
    onValueChange,
    placeholder,
    disabled,
    autoFocus,
    className,
    editorClassName,
    mentionUserId,
  },
  ref,
) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false, // replaced by the non-inclusive Link below
      }),
      NonInclusiveLink.configure({
        openOnClick: false, // don't navigate while editing
        autolink: true, // typed/pasted URLs auto-link
        defaultProtocol: "https",
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Write something…",
      }),
      ...(mentionUserId ? [createMentionExtension(mentionUserId)] : []),
    ],
    content: toEditorHtml(value),
    editable: !disabled,
    autofocus: autoFocus ? "end" : false,
    // Required in Next.js: skip the immediate render so SSR and the first
    // client render agree (avoids a hydration mismatch).
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "rich-content min-h-[7rem] w-full px-3 py-2 outline-none",
          editorClassName,
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onValueChange(editor.getHTML());
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      insertText: (text: string) =>
        editor?.chain().focus().insertContent(text).run(),
      focus: () => editor?.chain().focus().run(),
      clear: () => editor?.commands.clearContent(true),
    }),
    [editor],
  );

  // Sync external resets (publishing clears the draft) without disrupting typing:
  // during normal input the value already equals the editor's HTML, so this no-ops.
  useEffect(() => {
    if (!editor) return;
    const html = toEditorHtml(value);
    if (html !== editor.getHTML()) {
      editor.commands.setContent(html, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-transparent shadow-xs transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      {editor ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
});

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      strike: editor.isActive("strike"),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      quote: editor.isActive("blockquote"),
      link: editor.isActive("link"),
    }),
  });

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt("Link URL", previous ?? "https://");
    if (input === null) return; // cancelled
    const url = input.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!url) {
      chain.unsetLink().run(); // empty = remove link
      return;
    }
    chain.setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-input px-1.5 py-1">
      <ToolbarButton
        label="Bold"
        active={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <ToolbarButton
        label="Bullet list"
        active={state.bullet}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={state.ordered}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={state.quote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
      <ToolbarButton label="Add link" active={state.link} onClick={setLink}>
        <Link2 className="size-4" />
      </ToolbarButton>
      {state.link ? (
        <ToolbarButton
          label="Remove link"
          active={false}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink className="size-4" />
        </ToolbarButton>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      // Keep focus in the editor so the command applies to the selection.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  );
}
