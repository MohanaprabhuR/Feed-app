import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const textareaVariants = cva(
  "flex w-full rounded-lg  placeholder:text-primary/50   font-normal disabled:cursor-not-allowed disabled:pointer-events-none disabled:bg-primary/3 disabled:text-primary/20 disabled:border-transparent",
  {
    variants: {
      variant: {
        default:
          "bg-secondary text-accent-foreground outline outline-1 -outline-offset-1 outline-transparent hover:bg-accent active:outline active:outline-primary/50 active:placeholder:text-accent-foreground active:text-accent-foreground focus-visible:bg-transparent focus-visible:outline active:shadow-2xs focus-visible:outline-primary/50 focus-visible:ring-2 focus-visible:ring-ring",
        outline:
          "outline-input outline-1 -outline-offset-1 hover:outline-primary/20 active:outline-primary/50 active:placeholder:text-accent-foreground active:text-accent-foreground bg-transparent text-accent-foreground focus-visible:outline active:shadow-2xs focus-visible:outline-primary/50 focus-visible:ring-2 focus-visible:ring-ring",
        ghost:
          "bg-transparent outline outline-1 -outline-offset-1 outline-transparent text-accent-foreground active:text-accent-foreground active:placeholder:text-accent-foreground focus-visible:outline active:shadow-2xs focus-visible:outline-primary/50 focus-visible:ring-2 focus-visible:ring-ring",
      },
      size: {
        sm: "min-h-[72px] h-full px-2 py-1.5 text-base leading-normal tracking-4",
        md: "min-h-[102px] px-3 py-2.5 text-lg rounded-xl leading-tight tracking-4",
        lg: "min-h-[126px] px-3.5 py-3 text-xl rounded-xl leading-tight tracking-4",
      },
      status: {
        default: "",
        success: "",
        error: "",
        warning: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
      status: "default",
    },
    compoundVariants: [
      {
        status: "success",
        variant: ["default", "ghost"],
        className: "bg-success text-accent-foreground hover:bg-success",
      },
      {
        status: "success",
        variant: "outline",
        className:
          "outline-success-border text-accent-foreground hover:outline-success-border",
      },

      {
        status: "error",
        variant: ["default", "ghost"],
        className: "bg-error text-accent-foreground hover:bg-error",
      },
      {
        status: "error",
        variant: "outline",
        className:
          "outline-error-border text-accent-foreground hover:outline-error-border",
      },

      {
        status: "warning",
        variant: ["default", "ghost"],
        className: "bg-warning text-accent-foreground hover:bg-warning",
      },
      {
        status: "warning",
        variant: "outline",
        className:
          "outline-warning-border text-accent-foreground hover:outline-warning-border",
      },
    ],
  }
);

export interface TextareaProps
  extends
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, size, status, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        aria-invalid={status === "error" ? true : undefined}
        className={cn(textareaVariants({ variant, size, status }), className)}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
