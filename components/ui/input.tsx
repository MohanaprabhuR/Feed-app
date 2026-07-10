"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type VariantType = "default" | "outline";
type StatusType = "default" | "success" | "error" | "warning";

type InputProps = Omit<
  React.ComponentProps<"input">,
  "size" | "prefix" | "suffix"
> & {
  variant?: VariantType;
  status?: StatusType;
  size?: "sm" | "md" | "lg" | "xl";
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
};

const baseStyles =
  "w-full min-w-0 transition-[color,box-shadow,border]  placeholder:text-primary/50 file:inline-flex file:pr-1 file:border-r file:border-r-[1px] file:border-primary/20 file:bg-transparent aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:focus-visible:outline-destructive dark:aria-invalid:focus-visible:outline-destructive [&:-webkit-autofill]:bg-autofill [&:-webkit-autofill]:text-accent-foreground disabled:bg-primary/3 disabled:border-none disabled:text-primary/20 disabled:cursor-not-allowed disabled:pointer-events-none ";

const variantBaseMap: Record<VariantType, string> = {
  default:
    "bg-secondary outline outline-0 outline-input -outline-offset-1  hover:bg-accent text-accent-foreground active:bg-transparent active:shadow-lg active:outline-primary/50 active:text-accent-foreground focus:outline focus:outline-primary/50 focus:shadow-lg focus:bg-transparent focus-visible:outline-primary/50 focus:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:bg-transparent",
  outline:
    "outline outline-1 outline-input -outline-offset-1 bg-transparent text-accent-foreground hover:outline-primary/25 active:outline-primary/50 active:bg-transparent active:shadow-lg focus-outline focus:outline-primary/50 focus:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:outline-primary/50 focus-visible:bg-transparent",
};

const statusMap: Record<VariantType, Record<StatusType, string>> = {
  default: {
    default: "",
    success:
      "bg-success text-accent-foreground hover:bg-success active:bg-success focus:border-success-border focus:bg-success",
    warning:
      "bg-warning text-accent-foreground hover:bg-warning active:bg-warning focus:border-warning-border focus:bg-warning",
    error:
      "bg-error text-accent-foreground hover:bg-error active:bg-error focus:border-error-border focus:bg-error",
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

const sizeMap = {
  sm: {
    input:
      "text-base font-normal rounded-lg tracking-4 leading-tight px-2 py-1.5 h-7",
    prefix: "pl-8",
    suffix: "pr-8",
    iconOffset: "left-2 right-2",
  },
  md: {
    input:
      "text-base font-normal rounded-lg tracking-4 leading-tight px-2.5 py-2 h-8",
    prefix: "pl-[34px]",
    suffix: "pr-[34px]",
    iconOffset: "left-2.5 right-2.5",
  },
  lg: {
    input:
      "text-lg font-normal rounded-xl tracking-4 leading-tight px-3 py-[11px] h-10",
    prefix: "pl-9",
    suffix: "pr-9",
    iconOffset: "left-3 right-3",
  },
  xl: {
    input:
      "text-xl font-normal rounded-xl tracking-4 leading-tight px-3 py-2.5 h-10",
    prefix: "pl-10",
    suffix: "pr-10",
    iconOffset: "left-3 right-3",
  },
};

const iconSizeMap = {
  sm: "size-4",
  md: "size-4",
  lg: "size-4",
  xl: "size-[18px]",
};

function Input({
  className,
  type,
  variant = "default",
  status = "default",
  size = "sm",
  prefix,
  suffix,
  ...props
}: InputProps) {
  const [hasValue, setHasValue] = React.useState(
    Boolean(props.value ?? props.defaultValue),
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  };

  const statusClasses = statusMap[variant]?.[status] ?? "";
  const iconSize = iconSizeMap[size];
  const iconColor = hasValue ? "text-foreground" : "text-primary/50";
  const iconOffset = sizeMap[size].iconOffset;

  return (
    <div
      data-status={status}
      className={cn("flex items-center gap-2 relative w-full")}
    >
      {prefix && (
        <div
          className={cn(
            "flex items-center absolute left-2 pointer-events-none transition-colors duration-200",
            iconSize,
            iconColor,
            iconOffset.split(" ")[0],
          )}
        >
          {prefix}
        </div>
      )}

      <input
        type={type}
        data-variant={variant}
        className={cn(
          "flex-1 bg-transparent  p-0 w-full",
          baseStyles,
          variantBaseMap[variant],
          statusClasses,
          sizeMap[size].input,
          prefix && sizeMap[size].prefix,
          suffix && sizeMap[size].suffix,
          className,
        )}
        onChange={handleChange}
        {...props}
      />

      {suffix && (
        <div
          className={cn(
            "flex items-center absolute right-2 pointer-events-none transition-colors duration-200",
            iconSize,
            iconColor,
            iconOffset.split(" ")[1],
          )}
        >
          {suffix}
        </div>
      )}
    </div>
  );
}

export { Input };
