import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  BUCKET,
  buildPostMediaPath,
  getAttachmentType,
  validatePostAttachment,
} from "@/lib/post-media";

async function ensurePostMediaBucket() {
  const admin = getAdminClient();
  if (!admin) return null;

  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) throw listError;

  if (buckets?.some((bucket) => bucket.name === BUCKET)) {
    return admin;
  }

  const { error: createError } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 52_428_800,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw createError;
  }

  return admin;
}

async function uploadWithClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  file: File,
  filePath: string
) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  return supabase.storage.from(BUCKET).upload(filePath, fileBuffer, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to upload." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const validationError = validatePostAttachment(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const attachmentType = getAttachmentType(file);
    if (!attachmentType) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    const filePath = buildPostMediaPath(user.id, file);
    let uploadError: { message: string } | null = null;

    const userUpload = await uploadWithClient(supabase, user.id, file, filePath);
    if (!userUpload.error) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      return NextResponse.json({
        attachmentType,
        url: data.publicUrl,
        name: file.name,
      });
    }

    uploadError = userUpload.error;

    const bucketMissing =
      uploadError.message.includes("Bucket not found") ||
      uploadError.message.toLowerCase().includes("does not exist");

    if (bucketMissing) {
      const admin = await ensurePostMediaBucket();
      if (admin) {
        const adminUpload = await uploadWithClient(admin, user.id, file, filePath);
        if (!adminUpload.error) {
          const { data } = admin.storage.from(BUCKET).getPublicUrl(filePath);
          return NextResponse.json({
            attachmentType,
            url: data.publicUrl,
            name: file.name,
          });
        }
        uploadError = adminUpload.error;
      }
    }

    return NextResponse.json(
      {
        error:
          uploadError?.message ??
          "Upload failed. Add SUPABASE_SERVICE_ROLE_KEY to .env.local or run supabase/migrate-post-media.sql.",
      },
      { status: 500 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Upload failed. Add SUPABASE_SERVICE_ROLE_KEY to .env.local or run supabase/migrate-post-media.sql.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
