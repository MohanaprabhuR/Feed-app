"use client";

import { useState, type MouseEvent } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appToast } from "@/lib/app-toast";
import { downloadImageAsPng, pngFileName } from "@/lib/download-png";
import { fileNameFromUrl } from "@/lib/messages";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

export function DownloadPngButton({
  src,
  filename,
  className,
}: {
  src: string;
  filename?: string;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const name = pngFileName(filename ?? fileNameFromUrl(src));

  async function handleDownload(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      await downloadImageAsPng(src, name);
    } catch (error) {
      appToast.error(
        "Could not download PNG",
        getErrorMessage(error, "Please try again."),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      iconOnly
      disabled={pending}
      aria-label="Download PNG"
      title="Download PNG"
      className={cn("bg-black/45 text-white hover:bg-black/60 hover:text-white", className)}
      onClick={(event) => void handleDownload(event)}
    >
      <Download />
    </Button>
  );
}
