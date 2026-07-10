"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

type SwitchSize = "sm" | "md";

interface SwitchProps extends React.ComponentProps<
  typeof SwitchPrimitive.Root
> {
  size?: SwitchSize;
  label?: React.ReactNode;
  description?: React.ReactNode;
}

function Switch({
  className,
  size = "sm",
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  ...props
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(
    defaultChecked ?? false,
  );

  const isControlled = checked !== undefined;
  const currentChecked = isControlled ? checked : internalChecked;

  const handleChange = (val: boolean) => {
    if (!isControlled) setInternalChecked(val);
    onCheckedChange?.(val);
  };

  const sizes = {
    sm: {
      root: "h-4 w-[26px] p-0.5",
      thumb:
        "size-3 translate-x-[calc(100%-(2px))] data-[state=unchecked]:translate-x-0",
      wrapper: "gap-x-2 p-1.5 text-base tracking-4 leading-tight",
      description: "text-base tracking-4 leading-tight",
    },
    md: {
      root: "h-5 w-8 p-[3px]",
      thumb:
        "size-[14px] translate-x-[calc(100%-(2px))] data-[state=unchecked]:translate-x-0",
      wrapper: "gap-x-2.5 px-2 py-1.5 text-lg leading-tight tracking-4",
      description: "text-lg leading-tight tracking-4",
    },
  };

  const { root, thumb, wrapper, description: descriptionSize } = sizes[size];

  const switchId = React.useId();

  const switchControl = (
    <SwitchPrimitive.Root
      id={switchId}
      data-slot="switch"
      tabIndex={label || description ? -1 : 0}
      className={cn(
        "peer  inline-flex shrink-0 items-center rounded-full transition-all outline-none",
        "data-[state=checked]:bg-primary data-[state=checked]:hover:bg-primary/86 data-[state=checked]:active:bg-primary/74 data-[state=checked]:focus:bg-primary",
        "data-[state=unchecked]:bg-input data-[state=unchecked]:hover:bg-primary/20 data-[state=unchecked]:active:bg-primary/50 data-[state=unchecked]:focus:bg-primary/12",
        "disabled:data-[state=unchecked]:bg-accent disabled:cursor-not-allowed disabled:pointer-events-none disabled:data-[state=unchecked]:hover:bg-accent",
        "disabled:data-[state=checked]:bg-accent",
        root,
        !label &&
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
        className,
      )}
      checked={currentChecked}
      onCheckedChange={handleChange}
      disabled={props.disabled}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background shadow-4xl pointer-events-none block rounded-full transition-transform",
          thumb,
        )}
      />
    </SwitchPrimitive.Root>
  );

  if (label || description) {
    return (
      <label
        htmlFor={switchId}
        tabIndex={props.disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (props.disabled) return;
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            (document.getElementById(switchId) as HTMLButtonElement)?.click();
          }
        }}
        className={cn(
          "inline-flex items-center outline-none select-none rounded-lg  transition-colors text-secondary-foreground font-medium ",
          wrapper,
          !props.disabled &&
            "hover:bg-accent active:bg-primary/12 active:text-accent-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:bg-secondary",
          props.disabled &&
            "hover:bg-transparent cursor-not-allowed pointer-events-none text-primary/50",
        )}
      >
        {switchControl}

        <span className="flex flex-col items-start">
          {label && <span>{label}</span>}
          {description && (
            <span
              className={cn(
                "text-secondary-foreground font-normal pt-1 ",
                descriptionSize,
                props.disabled && "text-primary/50",
              )}
            >
              {description}
            </span>
          )}
        </span>
      </label>
    );
  }
  return switchControl;
}

export { Switch };
