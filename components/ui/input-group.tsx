"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const inputGroupVariants = cva(
  "group/input-group relative  flex w-full items-center rounded-md outline outline-1  -outline-offset-1 outline-transparent transition-[color,box-shadow] has-[>[data-align=inline-start]]:[&>input]:pl-2 has-[>[data-align=inline-end]]:[&>input]:pr-2 has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",
  {
    variants: {
      variant: {
        default:
          "has-[>textarea]:h-auto bg-secondary hover:bg-accent has-[[data-slot=input-group-control]:active]:bg-transparent has-[[data-slot=input-group-control]:active]:outline-primary/50 has-[[data-slot=input-group-control]:active]:shadow-lg has-[[data-slot=input-group-control]:focus]:outline has-[[data-slot=input-group-control]:focus]:outline-primary/50 has-[[data-slot=input-group-control]:focus]:shadow-lg has-[[data-slot=input-group-control]:focus]:bg-white has-[[data-slot=input-group-control]:focus-visible]:outline-primary/50 has-[[data-slot=input-group-control]:focus]:text-accent-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]:focus-visible]:ring-offset-0 has-[[data-slot=input-group-control]:focus-visible]:bg-transparent has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:outline-destructive",
        outline:
          "outline-input bg-transparent text-secondary-foreground hover:outline-primary/25 has-[[data-slot=input-group-control]:active]:outline-primary/50 has-[[data-slot=input-group-control]:active]:bg-transparent has-[[data-slot=input-group-control]:active]:shadow-lg focus-outline has-[[data-slot=input-group-control]:focus]:outline-primary/50 has-[[data-slot=input-group-control]:focus]:text-accent-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]:focus-visible]:ring-offset-0 has-[[data-slot=input-group-control]:focus-visible]:outline-primary/50 has-[[data-slot=input-group-control]:focus-visible]:bg-transparent",
        ghost:
          "outline-transparent bg-transparent text-secondary-foreground    focus-outline has-[[data-slot=input-group-control]:focus]:outline-primary/50 has-[[data-slot=input-group-control]:focus]:text-accent-foreground has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]:focus-visible]:ring-offset-0 has-[[data-slot=input-group-control]:focus-visible]:outline-primary/50 has-[[data-slot=input-group-control]:focus-visible]:bg-transparent",
      },
      size: {
        sm: "rounded-lg",
        md: "rounded-lg",
        lg: "rounded-xl",
        xl: "rounded-xl ",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

type VariantType = "default" | "outline";
type StatusType = "default" | "success" | "warning" | "error";

const statusMap: Record<VariantType, Record<StatusType, string>> = {
  default: {
    default: "",
    success:
      "bg-success text-accent-foreground hover:bg-success active:bg-success focus:outline-success-border focus:bg-success",
    warning:
      "bg-warning text-accent-foreground hover:bg-warning active:bg-warning focus:outline-warning-border focus:bg-warning",
    error:
      "bg-error text-accent-foreground hover:bg-error active:bg-error focus:outline-error-border focus:bg-error",
  },
  outline: {
    default: "",
    success:
      "outline-success-border hover:outline-success-border active:outline-success-border focus:outline-success-border disabled:border-transparent",
    warning:
      "outline-warning-border hover:outline-warning-border active:outline-warning-border focus:outline-warning-border disabled:border-transparent",
    error:
      "outline-error-border hover:outline-error-border active:outline-error-border focus:outline-error-border disabled:border-transparent",
  },
};

interface InputGroupProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof inputGroupVariants> {
  status?: StatusType;
}

function InputGroup({
  className,
  variant,
  status = "default",
  size = "md",
  ...props
}: InputGroupProps) {
  const statusClasses = statusMap[variant || "default"]?.[status] ?? "";

  return (
    <div
      data-slot="input-group"
      role="group"
      data-variant={variant}
      className={cn(
        inputGroupVariants({ variant, size }),
        statusClasses,
        "overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  "text-muted-foreground transition-colors flex h-auto cursor-text items-center justify-center gap-2 text-sm font-medium select-none [&>svg:not([class*='size-'])]:size-4 [&>kbd]:rounded-[calc(var(--radius)-5px)] group-data-[disabled=true]/input-group:bg-primary/3 group-data-[disabled=true]/input-group:cursor-not-allowed group-has-[[data-slot=input-group-control][data-filled=true]]/input-group:text-foreground",
  {
    variants: {
      align: {
        "inline-start":
          "order-first has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
        "inline-end":
          "order-last has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]",
        "block-start":
          "order-first w-full justify-start [.border-b]:pb-3 group-has-[>input]/input-group:pt-2.5",
        "block-end":
          "order-last w-full justify-start [.border-t]:pt-3 group-has-[>input]/input-group:pb-2.5",
      },
      size: {
        sm: "[&[data-align='inline-start']]:pl-2 [&[data-align='inline-end']]:pr-2 [&[data-align='block-start']]:pl-2 [&[data-align='block-start']]:pt-2 [&[data-align='block-end']]:pl-2 [&[data-align='block-end']]:pb-2",
        md: "[&[data-align='inline-start']]:pl-2.5 [&[data-align='inline-end']]:pr-2.5 [&[data-align='block-start']]:pl-2.5 [&[data-align='block-start']]:pt-2.5 [&[data-align='block-end']]:pl-2.5 [&[data-align='block-end']]:pb-2.5",
        lg: "[&[data-align='inline-start']]:pl-3 [&[data-align='inline-end']]:pr-3 [&[data-align='block-start']]:pl-3 [&[data-align='block-start']]:pt-3 [&[data-align='block-end']]:pl-3 [&[data-align='block-end']]:pb-3",
        xl: "[&[data-align='inline-start']]:pl-3 [&[data-align='inline-end']]:pr-3 [&[data-align='block-start']]:pl-3 [&[data-align='block-start']]:pt-3 [&[data-align='block-end']]:pl-3 [&[data-align='block-end']]:pb-3 [&>svg:not([class*='size-'])]:size-4.5",
      },
    },
    defaultVariants: {
      align: "inline-start",
      size: "sm",
    },
  }
);

function InputGroupAddon({
  className,
  align = "inline-start",
  size = "sm",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align, size }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        const input = e.currentTarget.parentElement?.querySelector(
          '[data-slot="input-group-control"]'
        );
        input?.focus();
      }}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva(
  "text-sm shadow-none flex gap-2 items-center",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 px-2 rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-3.5 has-[>svg]:px-2",
        sm: "h-8 px-2.5 gap-1.5 rounded-md has-[>svg]:px-2.5",
        "icon-xs":
          "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
        "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
);

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(
        inputGroupButtonVariants({ size }),
        "hover:bg-transparent bg-transparent shadow-none ",
        className
      )}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-muted-foreground flex items-center gap-2 text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 transition-colors",
        className
      )}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  disabled = false,
  onChange,
  value,
  defaultValue,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [hasValue, setHasValue] = React.useState(
    Boolean(value ?? defaultValue ?? "")
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(Boolean(e.target.value));
    onChange?.(e);
  };

  return (
    <Input
      data-slot="input-group-control"
      data-filled={hasValue}
      disabled={disabled}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      className={cn(
        "flex-1 rounded-none outline-0 bg-transparent hover:bg-transparent shadow-none focus-visible:ring-0 active:shadow-none active:bg-transparent focus:outline-0 focus:shadow-none",
        className
      )}
      {...props}
    />
  );
}

interface InputGroupTextareaProps extends React.ComponentProps<"textarea"> {
  size?: "sm" | "md" | "lg";
}

function InputGroupTextarea({
  className,
  size = "md",
  value,
  defaultValue,
  onChange,
  ...props
}: InputGroupTextareaProps) {
  const [hasValue, setHasValue] = React.useState(
    Boolean(value ?? defaultValue ?? "")
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasValue(Boolean(e.target.value));
    onChange?.(e);
  };

  const sizeClasses = {
    sm: "min-h-[72px] px-2 py-1.5 text-sm",
    md: "min-h-[102px] px-3 py-2.5 text-base",
    lg: "min-h-[126px] px-3.5 py-3 text-lg rounded-xl",
  };

  return (
    <Textarea
      data-slot="input-group-control"
      data-filled={hasValue}
      className={cn(
        "flex-1 resize-none rounded-t  rounded-b-none outline-transparent hover:bg-transparent bg-transparent shadow-none focus-visible:ring-0 active:outline-0 focus:outline-0 active:shadow-none focus:shadow-none",
        sizeClasses[size],
        className
      )}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
