"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { UserListItem } from "@/components/user-list-item";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  pageColumnClass,
  pageListClass,
  pageStackClass,
} from "@/lib/feed-layout";
import { posts, users } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase()),
  );

  const filteredPosts = posts.filter((p) =>
    p.content.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Search" backHref="/feed" />
      <div className={cn(pageColumnClass, pageStackClass)}>
        <Input
          type="search"
          size="lg"
          variant="outline"
          placeholder="Search users, posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          prefix={<Search className="size-4 text-muted-foreground" />}
        />

        <Tabs defaultValue="all">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1">
              Users
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex-1">
              Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-6">
            {!query ? (
              <Empty className="border bg-card py-14">
                <EmptyContent>
                  <EmptyTitle>Search Feed</EmptyTitle>
                  <EmptyDescription>
                    Find people and posts by name, username, or keywords.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="px-1 text-sm font-medium text-muted-foreground">
                    Users
                  </h3>
                  {filteredUsers.length > 0 ? (
                    <div className={cn(pageListClass, "px-4")}>
                      {filteredUsers.map((user) => (
                        <UserListItem key={user.id} user={user} />
                      ))}
                    </div>
                  ) : (
                    <p className="px-1 text-sm text-muted-foreground">
                      No users matched.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="px-1 text-sm font-medium text-muted-foreground">
                    Posts
                  </h3>
                  {filteredPosts.length > 0 ? (
                    <div className={pageStackClass}>
                      {filteredPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  ) : (
                    <p className="px-1 text-sm text-muted-foreground">
                      No posts matched.
                    </p>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            {filteredUsers.length > 0 ? (
              <div className={cn(pageListClass, "px-4")}>
                {filteredUsers.map((user) => (
                  <UserListItem key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <Empty className="border bg-card py-14">
                <EmptyContent>
                  <EmptyTitle>No users found</EmptyTitle>
                  <EmptyDescription>
                    Try a different name or username.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-4 space-y-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <Empty className="border bg-card py-14">
                <EmptyContent>
                  <EmptyTitle>No posts found</EmptyTitle>
                  <EmptyDescription>Try different keywords.</EmptyDescription>
                </EmptyContent>
              </Empty>
            )}
          </TabsContent>
        </Tabs>

        <Link
          href="/trending"
          className="block text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          View trending topics →
        </Link>
      </div>
    </AppShell>
  );
}
