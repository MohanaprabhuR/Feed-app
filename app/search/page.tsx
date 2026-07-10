"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { UserListItem } from "@/components/user-list-item";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { posts, users } from "@/lib/mock-data";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPosts = posts.filter((p) =>
    p.content.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell noPadding>
      <PageHeader title="Search" backHref="/feed" />
      <div className="space-y-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users, posts..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

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
            {query && (
              <>
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Users
                  </h3>
                  {filteredUsers.map((user) => (
                    <UserListItem key={user.id} user={user} />
                  ))}
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    Posts
                  </h3>
                  <div className="space-y-4">
                    {filteredPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              </>
            )}
            {!query && (
              <p className="py-8 text-center text-muted-foreground">
                Search for users and posts
              </p>
            )}
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            {filteredUsers.map((user) => (
              <UserListItem key={user.id} user={user} />
            ))}
          </TabsContent>
          <TabsContent value="posts" className="mt-4 space-y-4">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </TabsContent>
        </Tabs>

        <Link
          href="/trending"
          className="block text-center text-sm text-primary hover:underline"
        >
          View trending topics →
        </Link>
      </div>
    </AppShell>
  );
}
