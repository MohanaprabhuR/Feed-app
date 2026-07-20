"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { useCurrentUser } from "@/components/current-user-provider";
import { MentionSuggestions } from "@/components/mention-suggestions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMentionSuggestions } from "@/hooks/use-mention-suggestions";
import {
  getActiveMention,
  insertMentionAtCaret,
} from "@/lib/mentions";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

type MentionTextFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  excludeUserId?: string;
  className?: string;
};

type MentionInputProps = MentionTextFieldProps &
  Omit<ComponentProps<typeof Input>, "value" | "onChange">;

type MentionTextareaProps = MentionTextFieldProps &
  Omit<ComponentProps<typeof Textarea>, "value" | "onChange">;

function useMentionField({
  value,
  onValueChange,
  excludeUserId,
}: MentionTextFieldProps) {
  const { user } = useCurrentUser();
  const [caret, setCaret] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMention = getActiveMention(value, caret);
  const { users, loading } = useMentionSuggestions(
    activeMention?.query ?? "",
    excludeUserId ?? user?.id,
    activeMention !== null,
  );
  const isOpen =
    activeMention !== null && (loading || users.length > 0);
  const clampedActiveIndex =
    users.length === 0 ? 0 : Math.min(activeIndex, users.length - 1);

  const updateCaret = useCallback(
    (element: HTMLInputElement | HTMLTextAreaElement | null) => {
      if (!element) return;
      setCaret(element.selectionStart ?? value.length);
    },
    [value.length],
  );

  const handleChange = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      onValueChange(event.target.value);
      setCaret(event.target.selectionStart ?? event.target.value.length);
      setActiveIndex(0);
    },
    [onValueChange],
  );

  const selectMention = useCallback(
    (
      selected: User,
      element: HTMLInputElement | HTMLTextAreaElement | null,
    ) => {
      const { value: nextValue, caret: nextCaret } = insertMentionAtCaret(
        value,
        caret,
        selected.username,
      );
      onValueChange(nextValue);
      setCaret(nextCaret);
      setActiveIndex(0);
      requestAnimationFrame(() => {
        element?.focus();
        element?.setSelectionRange(nextCaret, nextCaret);
      });
    },
    [caret, onValueChange, value],
  );

  const handleKeyDown = useCallback(
    (
      event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
      element: HTMLInputElement | HTMLTextAreaElement | null,
    ) => {
      if (!isOpen || users.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, users.length - 1));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
        return;
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const selected = users[clampedActiveIndex];
        if (selected) selectMention(selected, element);
      }
    },
    [clampedActiveIndex, isOpen, selectMention, users],
  );

  return {
    activeIndex: clampedActiveIndex,
    activeMention,
    handleChange,
    handleKeyDown,
    isOpen,
    loading,
    selectMention,
    updateCaret,
    users,
  };
}

export const MentionInput = forwardRef<HTMLInputElement, MentionInputProps>(
  function MentionInput(
    {
      value,
      onValueChange,
      excludeUserId,
      className,
      onKeyDown,
      onClick,
      onSelect,
      onKeyUp,
      ...props
    },
    forwardedRef,
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const anchorRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(
      forwardedRef,
      () => inputRef.current as HTMLInputElement,
    );

    const {
      activeIndex,
      handleChange,
      handleKeyDown,
      isOpen,
      loading,
      selectMention,
      updateCaret,
      users,
    } = useMentionField({ value, onValueChange, excludeUserId });

    return (
      <>
        <div ref={anchorRef} className={cn("relative min-w-0 flex-1", className)}>
          <Input
            {...props}
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onClick={(event) => {
              updateCaret(event.currentTarget);
              onClick?.(event);
            }}
            onSelect={(event) => {
              updateCaret(event.currentTarget);
              onSelect?.(event);
            }}
            onKeyUp={(event) => {
              updateCaret(event.currentTarget);
              onKeyUp?.(event);
            }}
            onKeyDown={(event) => {
              handleKeyDown(event, event.currentTarget);
              onKeyDown?.(event);
            }}
          />
        </div>
        <MentionSuggestions
          anchorRef={anchorRef}
          open={isOpen}
          users={users}
          loading={loading}
          activeIndex={activeIndex}
          onSelect={(selected) => selectMention(selected, inputRef.current)}
        />
      </>
    );
  },
);

export const MentionTextarea = forwardRef<
  HTMLTextAreaElement,
  MentionTextareaProps
>(function MentionTextarea(
  {
    value,
    onValueChange,
    excludeUserId,
    className,
    onKeyDown,
    onClick,
    onSelect,
    onKeyUp,
    ...props
  },
  forwardedRef,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(
    forwardedRef,
    () => textareaRef.current as HTMLTextAreaElement,
  );

  const {
    activeIndex,
    handleChange,
    handleKeyDown,
    isOpen,
    loading,
    selectMention,
    updateCaret,
    users,
  } = useMentionField({ value, onValueChange, excludeUserId });

  return (
    <>
      <div ref={anchorRef} className={cn("relative", className)}>
        <Textarea
          {...props}
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onClick={(event) => {
            updateCaret(event.currentTarget);
            onClick?.(event);
          }}
          onSelect={(event) => {
            updateCaret(event.currentTarget);
            onSelect?.(event);
          }}
          onKeyUp={(event) => {
            updateCaret(event.currentTarget);
            onKeyUp?.(event);
          }}
          onKeyDown={(event) => {
            handleKeyDown(event, event.currentTarget);
            onKeyDown?.(event);
          }}
        />
      </div>
      <MentionSuggestions
        anchorRef={anchorRef}
        open={isOpen}
        users={users}
        loading={loading}
        activeIndex={activeIndex}
        onSelect={(selected) => selectMention(selected, textareaRef.current)}
      />
    </>
  );
});
