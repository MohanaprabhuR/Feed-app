"use client";

import { toast } from "sonner";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

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
