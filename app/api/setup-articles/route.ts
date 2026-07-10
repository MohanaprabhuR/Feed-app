import { NextResponse } from "next/server";
import {
  ARTICLES_MIGRATION_SQL,
  articlesColumnsExist,
} from "@/lib/setup-articles";
import { resetSchemaModeCache } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const ready = await articlesColumnsExist(supabase);

  return NextResponse.json({
    ready,
    sql: ARTICLES_MIGRATION_SQL,
    instructions: ready
      ? "Article columns are ready."
      : "Copy the SQL into Supabase Dashboard → SQL Editor → Run.",
  });
}

export async function POST() {
  const supabase = await createClient();
  resetSchemaModeCache();
  const ready = await articlesColumnsExist(supabase);

  if (ready) {
    return NextResponse.json({
      ok: true,
      message: "Article columns already exist.",
    });
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        "Article columns are still missing. Run supabase/migrate-articles.sql in Supabase → SQL Editor.",
      sql: ARTICLES_MIGRATION_SQL,
    },
    { status: 409 }
  );
}
