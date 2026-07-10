"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva("relative flex shrink-0 overflow-hidden ", {
  variants: {
    size: {
      xs: "size-4",
      sm: "size-5",
      md: "size-6",
      lg: "size-7",
      xl: "size-8",
      "2xl": "size-10",
      "3xl": "size-11.5",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

const radiusMap: Record<string, string> = {
  xs: "rounded-xs",
  sm: "rounded-sm",
  md: "rounded-sm",
  lg: "rounded-md",
  xl: "rounded-md",
  "2xl": "rounded-lg",
  "3xl": "rounded-xl",
};

const textSizeMap: Record<string, string> = {
  xs: "text-2xs font-medium text-accent-foreground leading-tight tracking-tight",
  sm: "text-sm font-medium text-accent-foreground leading-tight tracking-tight",
  md: "text-base font-medium text-accent-foreground leading-tight tracking-tight",
  lg: "text-base font-medium text-accent-foreground leading-tight tracking-tight",
  xl: "text-lg font-medium text-accent-foreground leading-tight tracking-tight",
  "2xl":
    "text-xl font-medium text-accent-foreground leading-tight tracking-tight",
  "3xl":
    "text-2xl font-medium text-accent-foreground leading-tight tracking-tight",
};

const iconSizeMap: Record<string, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 16,
  "2xl": 20,
  "3xl": 20,
};

type Status =
  | "active"
  | "away"
  | "sleep"
  | "pinned"
  | "checked"
  | "cancel"
  | "close"
  | "pin"
  | "null";

const statusIconMap: Record<Status, React.ReactNode> = {
  active: (
    <svg
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="8.5" cy="8" r="8" fill="var(--color-green-700)" />
    </svg>
  ),
  away: (
    <svg
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.5 16C12.9183 16 16.5 12.4183 16.5 8C16.5 3.58172 12.9183 0 8.5 0C4.08172 0 0.5 3.58172 0.5 8C0.5 12.4183 4.08172 16 8.5 16ZM8.5 13C11.2614 13 13.5 10.7614 13.5 8C13.5 5.23858 11.2614 3 8.5 3C5.73858 3 3.5 5.23858 3.5 8C3.5 10.7614 5.73858 13 8.5 13Z"
        fill="currentColor"
      />
    </svg>
  ),
  sleep: (
    <svg
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M16.4819 8.71993C16.4899 8.63114 16.3851 8.57883 16.3161 8.63536C15.2802 9.48479 13.9551 9.99457 12.5109 9.99457C9.19415 9.99457 6.50543 7.30585 6.50543 3.98914C6.50543 2.54495 7.01521 1.21982 7.86464 0.183882C7.92117 0.114945 7.86886 0.0101007 7.78008 0.0180934C3.69856 0.385505 0.5 3.8156 0.5 7.99276C0.5 12.415 4.08496 16 8.50724 16C12.6844 16 16.1145 12.8014 16.4819 8.71993Z"
        fill="currentColor"
      />
    </svg>
  ),
  close: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M1.10811 2.32035C0.773372 1.98562 0.773372 1.4429 1.10811 1.10817C1.44284 0.773433 1.98556 0.773433 2.32029 1.10817L5.99991 4.78779L9.67954 1.10817C10.0143 0.773433 10.557 0.773433 10.8917 1.10817C11.2265 1.4429 11.2265 1.98562 10.8917 2.32035L7.2121 5.99997L10.8917 9.6796C11.2265 10.0143 11.2265 10.557 10.8917 10.8918C10.557 11.2265 10.0143 11.2265 9.67954 10.8918L5.99991 7.21216L2.32029 10.8918C1.98556 11.2265 1.44284 11.2265 1.10811 10.8918C0.773372 10.557 0.773372 10.0143 1.10811 9.6796L4.78773 5.99997L1.10811 2.32035Z"
        fill="white"
      />
    </svg>
  ),
  checked: (
    <svg
      width="12"
      height="10"
      viewBox="0 0 12 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.323 0.338823C11.6882 0.639962 11.7402 1.18018 11.439 1.54543L4.84329 9.54543C4.67751 9.74651 4.42926 9.86124 4.16868 9.85721C3.90811 9.85318 3.66352 9.73082 3.50404 9.52471L0.547565 5.7038C0.257871 5.32941 0.326536 4.79106 0.700933 4.50136C1.07533 4.21167 1.61368 4.28033 1.90337 4.65473L4.20319 7.62698L10.1163 0.45491C10.4175 0.089657 10.9577 0.0376827 11.323 0.338823Z"
        fill="white"
      />
    </svg>
  ),
  pinned: (
    <svg
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M15.6265 5.75851L10.7414 0.873414C10.2097 0.341675 9.94381 0.0758058 9.66329 0.0189383C9.41797 -0.0307914 9.16294 0.0183228 8.95364 0.155604C5.68535 2.29929 7.19133 4.8215 2.15218 5.82933C0.322067 6.19535 -0.062262 6.95627 1.37562 8.39415L3.8794 10.898L1.66331 13.114C1.27278 13.5046 1.27278 14.1377 1.66331 14.5283L2.04011 14.9051C2.43064 15.2956 3.06379 15.2956 3.45432 14.9051L5.67043 12.689L8.10585 15.1244C9.54373 16.5623 10.3047 16.1779 10.6707 14.3478C11.6785 9.30867 14.2007 10.8146 16.3443 7.54629C16.4816 7.33699 16.5307 7.08196 16.481 6.83665C16.4241 6.55612 16.1583 6.29025 15.6265 5.75851Z"
        fill="currentColor"
      />
    </svg>
  ),
  pin: (
    <svg
      width="13"
      height="12"
      viewBox="0 0 13 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M11.6222 4.38893L8.11102 0.877766C7.72884 0.495579 7.53774 0.304485 7.33611 0.263612C7.15979 0.227869 6.97649 0.263169 6.82606 0.36184C4.47697 1.90261 5.55939 3.71545 1.9375 4.43983C0.622111 4.70291 0.345874 5.24982 1.37935 6.28329L3.17894 8.08294L1.72155 9.5403C1.36607 9.89577 1.36606 10.4721 1.72154 10.8276C2.07702 11.1831 2.65335 11.1831 3.00883 10.8276L4.46625 9.37022L6.2167 11.1207C7.25018 12.1541 7.79709 11.8779 8.06017 10.5625C8.78455 6.94061 10.5973 8.02299 12.1381 5.6739C12.2368 5.52346 12.2721 5.34016 12.2363 5.16384C12.1955 4.96221 12.0044 4.77112 11.6222 4.38893Z"
        fill="white"
      />
    </svg>
  ),
  null: null,
  cancel: undefined,
};

type Shape = "circle" | "square";

const AvatarSizeContext = React.createContext<{
  size: VariantProps<typeof avatarVariants>["size"];
  shape: Shape;
}>({
  size: "sm",
  shape: "circle",
});

interface AvatarProps
  extends
    React.ComponentProps<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  shape?: Shape;
  status?: Status;
}

function Avatar({
  size = "sm",
  shape = "circle",
  status = "null",
  className,
  children,
  ...props
}: AvatarProps) {
  const radiusClass =
    shape === "square" ? radiusMap[size ?? "sm"] : "rounded-full";
  const statusIcon = statusIconMap[status];

  return (
    <AvatarSizeContext.Provider value={{ size, shape }}>
      <div className="relative w-fit">
        <AvatarPrimitive.Root
          data-slot="avatar"
          className={cn(avatarVariants({ size }), radiusClass, className)}
          {...props}
        >
          {children}
        </AvatarPrimitive.Root>

        {status && status !== "null" && (
          <span
            className={cn(
              "absolute bottom-0 right-0 flex items-center justify-center rounded-full bg-background ring-2 ring-[var(--background)]",
              {
                "bg-[var(--color-green-600)]  p-[2px]": status === "checked",
                "bg-[var(--color-red-500)] p-[2px]": status === "close",
                "bg-[var(--color-cyan-500)] p-[1px] ": status === "pin",
                "text-[var(--color-green-700)] ": status === "active",
                "text-[var(--color-gray-600)] dark:text-[var(--color-gray-300)]":
                  status === "away" ||
                  status === "sleep" ||
                  status === "pinned",

                "size-[4px]": size === "xs",
                "size-[5px]": size === "sm",
                "size-[7px]": size === "md",
                "size-[8px]": size === "lg" || size === "xl",
                "size-[10px]": size === "2xl",
                "size-[12px]": size === "3xl",
              },
            )}
          >
            {statusIcon}
          </span>
        )}
      </div>
    </AvatarSizeContext.Provider>
  );
}

function AvatarImage(
  props: React.ComponentProps<typeof AvatarPrimitive.Image>,
) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square w-full h-full object-cover ",
        props.className,
      )}
      {...props}
    />
  );
}

type AvatarFallbackProps = React.ComponentProps<
  typeof AvatarPrimitive.Fallback
>;

function AvatarFallback({
  className,
  children,
  ...props
}: AvatarFallbackProps) {
  const { size, shape } = React.useContext(AvatarSizeContext);
  const radiusClass =
    shape === "square" ? radiusMap[size ?? "sm"] : "rounded-full";

  const isText = typeof children === "string" && children.trim().length > 0;
  const iconSize = iconSizeMap[size ?? "sm"];

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex items-center justify-center font-medium bg-secondary",
        avatarVariants({ size }),
        radiusClass,
        textSizeMap[size ?? "sm"],
        className,
      )}
      {...props}
    >
      {!isText ? (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10 8.75C12.0711 8.75 13.75 7.07107 13.75 5C13.75 2.92893 12.0711 1.25 10 1.25C7.92893 1.25 6.25 2.92893 6.25 5C6.25 7.07107 7.92893 8.75 10 8.75ZM9.49612 10C5.63227 10 2.5 13.1323 2.5 16.9961C2.5 17.6475 2.97096 18.2035 3.61352 18.3106L5.65497 18.6508C8.53181 19.1303 11.4682 19.1303 14.345 18.6508L16.3865 18.3106C17.029 18.2035 17.5 17.6475 17.5 16.9961C17.5 13.1323 14.3677 10 10.5039 10H9.49612Z"
            fill="var(--popover-foreground)"
          />
        </svg>
      ) : (
        children.trim().charAt(0).toUpperCase()
      )}
    </AvatarPrimitive.Fallback>
  );
}
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
  overlap?: boolean;
  size?: VariantProps<typeof avatarVariants>["size"];
  shape?: Shape;
  label?: boolean;
}

function AvatarGroup({
  children,
  className,
  max,
  overlap = true,
  size = "sm",
  shape = "circle",
  label = false,
  ...props
}: AvatarGroupProps) {
  const validChildren = React.Children.toArray(children).filter(Boolean);

  const displayedAvatars =
    typeof max === "number" ? validChildren.slice(0, max) : validChildren;

  const remainingCount =
    typeof max === "number" && validChildren.length > max
      ? validChildren.length - max
      : 0;

  const radiusClass =
    shape === "square"
      ? radiusMap[size ?? "sm"]
      : "rounded-full ring-2 ring-[var(--background)]";

  const AvatarList = (
    <>
      {displayedAvatars.map((child, index) => (
        <div
          key={index}
          style={{ zIndex: displayedAvatars.length - index }}
          className={cn(
            "relative",
            radiusClass,
            label && max === 3 && "ring-2 ring-[var(--background)]",
          )}
        >
          {child}
        </div>
      ))}
    </>
  );

  const RemainingCircle = (
    <div
      className={cn(
        "flex items-center justify-center bg-muted text-muted-foreground font-medium border-background ring-1 ring-[var(--background)] relative",
        radiusClass,
        avatarVariants({ size }),
        textSizeMap[size ?? "sm"],
      )}
    >
      {remainingCount}
    </div>
  );

  const LabelText = (
    <p
      className={cn(
        "text-muted-foreground mr-2 font-normal",
        textSizeMap[size ?? "sm"],
      )}
    >
      {remainingCount} member{remainingCount > 1 ? "s" : ""}
    </p>
  );

  return (
    <AvatarSizeContext.Provider value={{ size, shape }}>
      <div
        className={cn("flex items-center", overlap && "-space-x-1", className)}
        {...props}
      >
        {label && remainingCount > 0 && LabelText}
        {label ? AvatarList : null}
        {!label ? AvatarList : null}
        {!label && remainingCount > 0 && RemainingCircle}
      </div>
    </AvatarSizeContext.Provider>
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup };
