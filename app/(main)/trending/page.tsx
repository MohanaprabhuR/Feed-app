import Link from "next/link";
import { Hash, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { trendingTopics } from "@/lib/mock-data";

export default function TrendingPage() {
  return (
    <AppShell noPadding>
      <PageHeader title="Trending" backHref="/search" />
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="size-4" />
          Trending now
        </div>
        {trendingTopics.map((topic, index) => (
          <Link key={topic.id} href={`/search?q=${topic.tag}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                <span className="text-lg font-bold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="flex items-center gap-1 font-semibold">
                    <Hash className="size-4" />
                    {topic.tag}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {topic.posts.toLocaleString()} posts
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
