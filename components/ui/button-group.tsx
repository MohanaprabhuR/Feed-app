import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const buttonGroupVariants = cva(
  "flex w-fit items-stretch [&>*]:focus-visible:z-10 [&>*]:focus-visible:relative inline-flex [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "flex-row  [&>*:not(:first-child)]:-ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:-mt-px  [&>*:not(:first-child):not(:last-child)]:rounded-none [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none",
      },
      variant: {
        default: "",
        outline: "",
      },
      destructive: {
        false: "",
        true: `
          [&>*:not(:first-child):not(:last-child)]:rounded-lg
          [&>*:not(:first-child)]:rounded-lg
          [&>*:not(:last-child)]:rounded-lg
          [&>*:first-child]:rounded-l-lg
          [&>*:last-child]:rounded-r-lg
          data-[orientation=vertical]:[&>*:first-child]:rounded-t-lg
          data-[orientation=vertical]:[&>*:last-child]:rounded-b-lg
        `,
      },
      wrapLayout: {
        false: "flex-nowrap",
        true: "flex-wrap",
      },
      size: {
        sm: "",
        md: "",
        lg: "",
      },
    },

    compoundVariants: [
      {
        destructive: true,
        size: "sm",
        className: "gap-1",
      },
      {
        destructive: true,
        size: "md",
        className: "gap-1.5",
      },
      {
        destructive: true,
        size: "lg",
        className: "gap-1.5",
      },
    ],

    defaultVariants: {
      orientation: "horizontal",
      destructive: false,
      wrapLayout: false,
      variant: "default",
      size: "sm",
    },
  },
);

interface ButtonGroupProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonGroupVariants> {
  children?: React.ReactNode;
}

function ButtonGroup({
  className,
  orientation,
  variant,
  destructive,
  wrapLayout,
  size,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(
        buttonGroupVariants({
          orientation,
          variant,
          destructive,
          wrapLayout,
          size,
        }),
        className,
      )}
      {...props}
    />
  );
}

function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(
        "bg-muted flex items-center gap-2 rounded-md border px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto",
        className,
      )}
      {...props}
    />
  );
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
};
