import { notFound } from "next/navigation";
import { use } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UserListItem } from "@/components/user-list-item";
import { getPostById, users } from "@/lib/mock-data";

export default function LikesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const post = getPostById(id);

  if (!post) notFound();

  return (
    <AppShell noPadding>
      <PageHeader title="Likes" backHref="/feed" />
      <div className="divide-y px-4">
        {users.slice(1).map((user) => (
          <UserListItem key={user.id} user={user} />
        ))}
      </div>
    </AppShell>
  );
}
