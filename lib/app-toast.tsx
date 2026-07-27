"use client";

import { toast } from "sonner";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { UserAvatar } from "@/components/user-avatar";

type ToastVariant = "success" | "error" | "information" | "warning";

function showAppToast(
  variant: ToastVariant,
  title: string,
  description?: string,
) {
  toast.custom(() => (
    <Alert variant={variant}>
      <AlertContent>
        <AlertTitle>{title}</AlertTitle>
        {description ? (
          <AlertDescription>{description}</AlertDescription>
        ) : null}
      </AlertContent>
    </Alert>
  ));
}

export const appToast = {
  success: (title: string, description?: string) =>
    showAppToast("success", title, description),
  error: (title: string, description?: string) =>
    showAppToast("error", title, description),
  info: (title: string, description?: string) =>
    showAppToast("information", title, description),
  warning: (title: string, description?: string) =>
    showAppToast("warning", title, description),
};

type NotificationToastOptions = {
  title: string;
  message: string;
  avatar?: string;
  onClick?: () => void;
};

/**
 * WhatsApp-style push toast for an incoming notification: actor avatar, name
 * as the title, and the message below. Tapping it runs `onClick` (navigate to
 * the target) and dismisses the toast.
 */
export function notificationToast({
  title,
  message,
  avatar,
  onClick,
}: NotificationToastOptions) {
  toast.custom(
    (id) => (
      <Alert
        onClick={() => {
          onClick?.();
          toast.dismiss(id);
        }}
        className="w-full cursor-pointer justify-start items-center transition-colors hover:bg-accent"
      >
        <UserAvatar src={avatar ?? ""} name={title} size="sm" />
        <AlertContent className="min-w-0 flex-1">
          <AlertTitle className="truncate">{title}</AlertTitle>
          <AlertDescription className="block truncate text-muted-foreground">
            {message}
          </AlertDescription>
        </AlertContent>
      </Alert>
    ),
    { duration: 5000, position: "top-right" },
  );
}
