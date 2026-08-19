import type { SupabaseClient } from "@supabase/supabase-js";
import { formatStorageError, getErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";

export const BUCKET = "post-media";

export type PostAttachmentType = "image" | "video" | "file";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/svg+xml",
  "image/bmp",
  "image/x-ms-bmp",
  "image/vnd.microsoft.icon",
  "image/x-icon",
  "image/tiff",
  "image/apng",
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/ogg",
]);

const FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/rtf",
  "application/json",
]);

const EXTENSION_ATTACHMENT_TYPES: Record<string, PostAttachmentType> = {
  jpg: "image",
  jpeg: "image",
  jfif: "image",
  png: "image",
  gif: "image",
  webp: "image",
  heic: "image",
  heif: "image",
  avif: "image",
  svg: "image",
  bmp: "image",
  ico: "image",
  tif: "image",
  tiff: "image",
  apng: "image",
  mp4: "video",
  webm: "video",
  mov: "video",
  m4v: "video",
  avi: "video",
  ogv: "video",
  pdf: "file",
  doc: "file",
  docx: "file",
  txt: "file",
  csv: "file",
  md: "file",
  zip: "file",
  ppt: "file",
  pptx: "file",
  xls: "file",
  xlsx: "file",
  rtf: "file",
  json: "file",
};

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jfif: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  tif: "image/tiff",
  tiff: "image/tiff",
  apng: "image/apng",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/mp4",
  avi: "video/x-msvideo",
  ogv: "video/ogg",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  zip: "application/zip",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  rtf: "application/rtf",
  json: "application/json",
};

function getFileExtension(name: string) {
  const base = name.split(/[/\\]/).pop() ?? name;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

function isGenericMimeType(mime: string) {
  return !mime || mime === "application/octet-stream" || mime === "binary/octet-stream";
}

export function resolveAttachmentContentType(file: File) {
  const mime = file.type.trim().toLowerCase();
  if (!isGenericMimeType(mime)) return mime;

  const extension = getFileExtension(file.name);
  return EXTENSION_CONTENT_TYPES[extension] ?? "application/octet-stream";
}

export function getAttachmentType(file: File): PostAttachmentType | null {
  const mime = file.type.trim().toLowerCase();

  if (!isGenericMimeType(mime)) {
    if (IMAGE_TYPES.has(mime) || mime.startsWith("image/")) return "image";
    if (VIDEO_TYPES.has(mime) || mime.startsWith("video/")) return "video";
    if (FILE_TYPES.has(mime)) return "file";
  }

  const extension = getFileExtension(file.name);
  return EXTENSION_ATTACHMENT_TYPES[extension] ?? null;
}

/** File picker accept list for chat — any image format plus video/docs. */
export const CHAT_ATTACHMENT_ACCEPT =
  "image/*,.svg,.png,.avif,.jpg,.jpeg,.jfif,.gif,.webp,.bmp,.ico,.tif,.tiff,.heic,.heif,.apng,video/*,.pdf,.doc,.docx,.txt,.csv,.zip,.ppt,.pptx,.xls,.xlsx";

export function validatePostAttachment(file: File): string | null {
  const attachmentType = getAttachmentType(file);
  if (!attachmentType) {
    return "Unsupported file type. Use images, videos, or documents (PDF, DOC, DOCX, TXT, CSV, ZIP, and common Office files).";
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
    contentType: resolveAttachmentContentType(file),
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
