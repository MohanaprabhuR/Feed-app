"use client";

import { Calendar, MapPin } from "lucide-react";
import type { PostEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatEventWhen(startsAt: string, endsAt?: string) {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return startsAt;

  const startLabel = start.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  if (!endsAt) return startLabel;

  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return startLabel;

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${startLabel} – ${end.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  return `${startLabel} – ${end.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function PostEventCard({
  event,
  className,
}: {
  event: PostEvent;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        className,
      )}
    >
      <div className="flex gap-3 p-4">
        <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-[10px] font-semibold uppercase leading-none">
            {new Date(event.startsAt).toLocaleString(undefined, {
              month: "short",
            })}
          </span>
          <span className="text-xl font-semibold leading-none">
            {new Date(event.startsAt).getDate()}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-serif text-lg font-medium leading-tight tracking-tight">
            {event.title}
          </p>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <Calendar className="mt-0.5 size-3.5 shrink-0" />
            <span>{formatEventWhen(event.startsAt, event.endsAt)}</span>
          </p>
          {event.location ? (
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span>{event.location}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
