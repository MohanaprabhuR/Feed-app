import * as React from "react";
import { cn } from "@/lib/utils";

function Notification({
  className,
  action = false,
  longText = false,
  notificationPanel = false,
  modal = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  action?: boolean;
  longText?: boolean;
  modal?: boolean;
  notificationPanel?: boolean;

  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="notification"
      role="alert"
      className={cn(
        "relative shadow-2xl bg-white rounded-xl dark:bg-[var(--color-gray-900)]  flex w-full  flex-1 has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-2.5 gap-x-2.5 gap-y-0.5 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:shrink-0 [&>svg]:text-current",
        action && "pl-3 pr-1 py-1.5 items-center rounded-xl",
        longText &&
          "py-3 px-3.5  items-start [&>svg]:mt-0.75 [&>svg]:mb-0.75 [&>img]:mt-0.75 [&>img]:mb-0.75 rounded-2xl",
        !action && !longText && "py-[9.5px] px-3 flex-row items-center",
        notificationPanel && "items-start p-3 rounded-2xl gap-y-3",
        modal &&
          "flex-col items-center justify-center text-center py-4 px-3  gap-y-4.5 rounded-2xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function NotificationTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="notification-title"
      className={cn(
        "font-medium text-base tracking-4 leading-normal text-foreground w-full",
        className,
      )}
      {...props}
    />
  );
}

function NotificationDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="notification-description"
      className={cn(
        "text-secondary-foreground font-normal tracking-4 grid justify-items-start gap-1 text-base leading-normal",
        className,
      )}
      {...props}
    />
  );
}

function NotificationTimeStamp({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="notification-timestamp"
      className={cn(
        "text-muted-foreground font-normal pt-1.5 -tracking-1 grid justify-items-start gap-1 text-sm leading-normal",
        className,
      )}
      {...props}
    />
  );
}

function NotificationContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { children?: React.ReactNode }) {
  return (
    <div
      data-slot="notification-content"
      className={cn("w-full flex flex-col gap-y-0.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function NotificationWrapper({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { children?: React.ReactNode }) {
  return (
    <div
      data-slot="notification-wrapper"
      className={cn("flex flex-col gap-y-3 flex-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export {
  Notification,
  NotificationTitle,
  NotificationDescription,
  NotificationContent,
  NotificationTimeStamp,
  NotificationWrapper,
};
