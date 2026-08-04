"use client";

import { Calendar, MapPin } from "lucide-react";
import type { PostEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const EVENT_DATE_LOCALE = "en-US";

const eventDateTimeOptions: Intl.DateTimeFormatOptions = {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

const eventTimeOptions: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

function formatEventWhen(startsAt: string, endsAt?: string) {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return startsAt;

  const startLabel = start.toLocaleString(
    EVENT_DATE_LOCALE,
    eventDateTimeOptions,
  );

  if (!endsAt) return startLabel;

  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return startLabel;

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${startLabel} – ${end.toLocaleTimeString(
      EVENT_DATE_LOCALE,
      eventTimeOptions,
    )}`;
  }

  return `${startLabel} – ${end.toLocaleString(
    EVENT_DATE_LOCALE,
    eventDateTimeOptions,
  )}`;
}

export function PostEventCard({
  event,
  className,
}: {
  event: PostEvent;
  className?: string;
}) {
  const eventDate = new Date(event.startsAt);
  const monthLabel = Number.isNaN(eventDate.getTime())
    ? "TBD"
    : eventDate.toLocaleString(EVENT_DATE_LOCALE, {
        month: "short",
      });
  const dayLabel = Number.isNaN(eventDate.getTime())
    ? "--"
    : String(eventDate.getDate());

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-card to-muted/20 shadow-sm",
        className,
      )}
    >
      <div className="flex gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border border-primary/15 bg-primary text-primary-foreground shadow-sm">
          <span className="text-2xs font-semibold uppercase tracking-wide leading-none">
            {monthLabel}
          </span>
          <span className="text-xl font-semibold leading-none">{dayLabel}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-serif text-lg font-medium leading-tight tracking-tight sm:text-xl">
            {event.title}
          </p>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <Calendar className="mt-0.5 size-3.5 shrink-0" />
            <span className="leading-relaxed">
              {formatEventWhen(event.startsAt, event.endsAt)}
            </span>
          </p>
          {event.location ? (
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="leading-relaxed">{event.location}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
