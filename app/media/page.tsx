import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { posts } from "@/lib/mock-data";

export default function MediaGalleryPage() {
  const mediaPosts = posts.filter((p) => p.image);

  return (
    <AppShell noPadding>
      <PageHeader title="Media Gallery" backHref="/feed" />
      <div className="grid grid-cols-3 gap-1 p-1">
        {mediaPosts.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.id}/comments`}
            className="relative aspect-square overflow-hidden bg-muted"
          >
            {post.image && (
              <Image
                src={post.image}
                alt="Media"
                fill
                className="object-cover transition-transform hover:scale-105"
                sizes="33vw"
              />
            )}
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
