const VIDEO_URL_PATTERN = /\.(mp4|webm|mov)(\?.*)?$/i;
const IMAGE_URL_PATTERN = /\.(jpe?g|png|gif|webp)(\?.*)?$/i;
const FILE_URL_PATTERN =
  /\.(pdf|doc|docx|txt|zip|ppt|pptx|xls|xlsx)(\?.*)?$/i;

export function isVideoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return VIDEO_URL_PATTERN.test(url);
}

export function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return IMAGE_URL_PATTERN.test(url);
}

export function isFileUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return FILE_URL_PATTERN.test(url);
}

function getFileNameFromUrl(url: string) {
  const segment = url.split("/").pop()?.split("?")[0] ?? "attachment";
  const parts = segment.split("-");
  const name = parts.length > 2 ? parts.slice(2).join("-") : segment;
  return decodeURIComponent(name);
}

export function splitPostMedia(image?: string | null, video?: string | null) {
  const mediaUrl = video ?? image ?? undefined;
  if (!mediaUrl) {
    return { image: undefined, video: undefined, file: undefined };
  }

  if (isVideoUrl(mediaUrl)) {
    return { image: undefined, video: mediaUrl, file: undefined };
  }

  if (isFileUrl(mediaUrl)) {
    return {
      image: undefined,
      video: undefined,
      file: { url: mediaUrl, name: getFileNameFromUrl(mediaUrl) },
    };
  }

  return { image: mediaUrl, video: undefined, file: undefined };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);
    if (message) return message;
  }

  return fallback;
}

export function formatStorageError(message: string): string {
  if (message.includes("SUPABASE_SERVICE_ROLE_KEY") || message.includes("service_role key")) {
    return message;
  }

  if (message.includes("Bucket not found")) {
    return "Storage bucket missing. Either paste your real service_role key into .env.local (Supabase → Settings → API), or run supabase/migrate-post-media.sql in the SQL Editor.";
  }

  if (message.includes("row-level security")) {
    return "Upload blocked by storage permissions. Add SUPABASE_SERVICE_ROLE_KEY to .env.local or run supabase/migrate-post-media.sql.";
  }

  return message;
}
