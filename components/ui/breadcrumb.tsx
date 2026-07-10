"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
type BreadcrumbSize = "sm" | "md";
type SeparatorType = "chevron" | "slash";

const BreadcrumbContext = React.createContext<{ size: BreadcrumbSize }>({
  size: "sm",
});

const breadcrumbSizeMap: Record<BreadcrumbSize, string> = {
  sm: "text-base font-normal tracking-4",
  md: "text-lg font-normal tracking-4",
};

function Breadcrumb(props: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({
  size = "sm",
  className,
  ...props
}: React.ComponentProps<"ol"> & { size?: BreadcrumbSize }) {
  return (
    <BreadcrumbContext.Provider value={{ size }}>
      <ol
        data-slot="breadcrumb-list"
        className={cn(
          "text-muted-foreground flex flex-wrap items-center  break-words",
          breadcrumbSizeMap[size],
          className,
        )}
        {...props}
      />
    </BreadcrumbContext.Provider>
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center ", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({
  asChild,
  className,
  children,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean; prefix?: boolean }) {
  const Comp = asChild ? Slot : "a";
  const { size } = React.useContext(BreadcrumbContext);
  const svgSizeClass = size === "sm" ? "[&_svg]:size-4" : "[&_svg]:size-5";
  const paddingSizeClass =
    size === "sm" ? "px-2 py-1.5 font-normal" : "p-1.25 font-medium";

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        "transition-colors flex items-center gap-x-1 tracking-4 leading-tight rounded-lg hover:bg-accent hover:text-accent-foreground focus:bg-secondary outline-none  focus:text-accent-foreground focus-visible:bg-secondary focus-visible:ring-2 focus-visible:ring-ring active:bg-transparent active:text-foreground",
        svgSizeClass,
        paddingSizeClass,
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

function BreadcrumbPage({
  className,
  children,
  ...props
}: React.ComponentProps<"span"> & {
  prefix?: boolean;
}) {
  const { size } = React.useContext(BreadcrumbContext);
  const svgSizeClass = size === "sm" ? "[&_svg]:size-4" : "[&_svg]:size-5";
  const paddingSizeClass =
    size === "sm" ? "px-2 py-1.5 font-normal" : "p-1.25 font-medium";

  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn(
        "text-foreground leading-tight tracking-4  inline-flex items-center gap-x-1 px-2 py-1.5",
        svgSizeClass,
        paddingSizeClass,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("", className)}
      {...props}
    >
      {children ?? <ChevronRight className="size-4" />}
    </li>
  );
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex size-5 items-center justify-center mt-0.75 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 ",
        className,
      )}
      {...props}
    >
      <Ellipsis />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
