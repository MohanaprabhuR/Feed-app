import * as React from "react";
import { cn } from "@/lib/utils";

function Toast({
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  action = false,
  longText = false,
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
        "relative shadow-2xl text-background bg-accent-foreground px-4 py-2.5  rounded-xl  items-center flex w-full  flex-1 has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-2.5 gap-x-2.5 gap-y-0.5 [&>svg]:size-4 [&>svg]:text-current",
        longText && "px-4 py-[11px] ",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function ToastTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="notification-title"
      className={cn(
        "font-medium text-base tracking-4 leading-6 text-background w-full",
        className
      )}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="notification-description"
      className={cn(
        "text-secondary-foreground font-normal tracking-4 grid justify-items-start gap-1 text-base leading-6",
        className
      )}
      {...props}
    />
  );
}

function ToastContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { children?: React.ReactNode }) {
  return (
    <div
      data-slot="notification-content"
      className={cn("w-full", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Toast, ToastTitle, ToastDescription, ToastContent };
