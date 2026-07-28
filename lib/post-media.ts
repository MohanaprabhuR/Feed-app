import type { SupabaseClient } from "@supabase/supabase-js";
import { formatStorageError, getErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export const BUCKET = "post-media";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/zip",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export type PostAttachmentType = "image" | "video" | "file";

export function getAttachmentType(file: File): PostAttachmentType | null {
  if (IMAGE_TYPES.has(file.type)) return "image";
  if (VIDEO_TYPES.has(file.type)) return "video";
  if (FILE_TYPES.has(file.type)) return "file";
  return null;
}

export function validatePostAttachment(file: File): string | null {
  const attachmentType = getAttachmentType(file);
  if (!attachmentType) {
    return "Unsupported file type. Use images, videos, or documents (PDF, DOC, TXT, ZIP).";
  }

  const maxBytes =
    attachmentType === "image"
      ? MAX_IMAGE_BYTES
      : attachmentType === "video"
        ? MAX_VIDEO_BYTES
        : MAX_FILE_BYTES;

  if (file.size > maxBytes) {
    const limitMb = maxBytes / (1024 * 1024);
    return `File is too large. Max size is ${limitMb}MB.`;
  }

  return null;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildPostMediaPath(userId: string, file: File) {
  const safeName = sanitizeFileName(file.name);
  return `${userId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
}

/** Upload attachment — tries browser storage first, then server API. */
export async function uploadPostAttachment(file: File) {
  const validationError = validatePostAttachment(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      return await uploadPostAttachmentDirect(supabase, user.id, file);
    } catch (error) {
      const message = getErrorMessage(error, "");
      const shouldTryApi =
        message.includes("Bucket not found") ||
        message.includes("row-level security") ||
        message.includes("not authorized") ||
        message.includes("does not exist");

      if (!shouldTryApi) throw error;
    }
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/posts/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; attachmentType?: PostAttachmentType; url?: string; name?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      formatStorageError(payload?.error ?? "Could not upload attachment.")
    );
  }

  if (!payload?.attachmentType || !payload.url) {
    throw new Error("Upload succeeded but returned an invalid response.");
  }

  return {
    attachmentType: payload.attachmentType,
    url: payload.url,
    name: payload.name ?? file.name,
  };
}

/** Direct client upload — requires storage bucket + RLS policies in Supabase. */
export async function uploadPostAttachmentDirect(
  supabase: SupabaseClient,
  userId: string,
  file: File
) {
  const validationError = validatePostAttachment(file);
  if (validationError) throw new Error(validationError);

  const attachmentType = getAttachmentType(file);
  if (!attachmentType) throw new Error("Unsupported file type.");

  const filePath = buildPostMediaPath(userId, file);

  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });

  if (error) {
    throw new Error(formatStorageError(error.message));
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return {
    attachmentType,
    url: data.publicUrl,
    name: file.name,
  };
}

// Backward-compatible aliases
export type PostMediaType = PostAttachmentType;
export const getMediaType = getAttachmentType;
export const validatePostMedia = validatePostAttachment;
export const uploadPostMedia = uploadPostAttachment;
