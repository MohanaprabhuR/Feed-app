"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.ComponentProps<
  typeof CheckboxPrimitive.Root
> {
  id?: string;
  label?: string;
  size?: "sm" | "md";
}

const checkboxSizeMap = {
  sm: "size-[14px]",
  md: "size-4",
};

const labelSizeMap = {
  sm: "text-base  p-1.5",
  md: "text-lg  px-2 py-[7px]",
};

function Checkbox({
  id,
  label,
  className,
  size = "md",
  ...props
}: CheckboxProps) {
  const generatedId = React.useId();
  const checkboxId = id || (label ? generatedId : undefined);
  const withLabel = Boolean(label);

  const checkboxSize = checkboxSizeMap[size];
  const labelStyle = labelSizeMap[size];
  const isDisabled = props.disabled;

  const checkboxElement = (
    <CheckboxPrimitive.Root
      id={checkboxId}
      data-slot="checkbox"
      className={cn(
        "border peer border-primary/44 hover:border-primary/68  hover:shadow-xss focus:shadow-xss active:border-primary/75 disabled:border-primary/12 disabled:bg-card focus:border-primary/98 focus-visible:border-primary/98 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-transparent hover:data-[state=checked]:bg-primary/86 active:data-[state=checked]:bg-primary/74 focus:data-[state=checked]:shadow-none focus-visible:data-[state=checked]:ring-ring focus-visible:data-[state=checked]:ring-offset-0 data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-none data-[state=indeterminate]:text-primary-foreground hover:data-[state=indeterminate]:bg-primary/86 active:data-[state=indeterminate]:bg-primary/74 focus-visible:data-[state=indeterminate]:shadow-none  focus-visible:data-[state=indeterminate]:ring-ring focus-visible:data-[state=indeterminate]:ring-offset-0 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex shrink-0 items-center justify-center rounded-xs transition-shadow outline-none disabled:cursor-not-allowed disabled:data-[state=checked]:bg-accent disabled:data-[state=indeterminate]:bg-accent disabled:pointer-events-none disabled:focus:shadow-none",
        checkboxSize,
        withLabel
          ? "focus-visible:data-[state=checked]:ring-0  focus-visible:data-[state=indeterminate]:ring-0 "
          : "focus-visible:data-[state=checked]:ring-2  focus-visible:data-[state=indeterminate]:ring-2",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
      >
        {props.checked === "indeterminate" ? (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M7.5 4.49995C7.77614 4.49995 8 4.72381 8 4.99995C8 5.2761 7.77614 5.49995 7.5 5.49995H2.5C2.22386 5.49995 2 5.2761 2 4.99995C2 4.72381 2.22386 4.49995 2.5 4.49995H7.5Z"
              className={isDisabled ? "fill-primary/25" : "fill-current"}
            />
          </svg>
        ) : (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M8.10855 1.92234C8.29276 1.78029 8.55748 1.78293 8.74039 1.94089C8.94882 2.12147 8.97246 2.43718 8.79214 2.64597L4.16031 8.00828C4.06662 8.11674 3.93056 8.18048 3.78726 8.1821C3.64394 8.18357 3.5063 8.1225 3.41031 8.01609L1.21597 5.57859L1.58804 5.2446L1.96011 4.90964L3.77359 6.92527L8.03531 1.99167L8.10855 1.92234ZM1.25308 4.87253C1.45834 4.68783 1.77539 4.7044 1.96011 4.90964L1.21597 5.57859C1.03154 5.37343 1.04818 5.05723 1.25308 4.87253Z"
              className={isDisabled ? "fill-primary/25" : "fill-current"}
            />
          </svg>
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (withLabel) {
    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          "inline-flex items-center text-secondary-foreground font-medium outline-none tracking-4 rounded-lg bg-transparent gap-x-2 hover:bg-accent active:bg-primary/12 active:text-accent-foreground",
          "has-[button:focus-visible]:bg-primary/5 has-[button:focus-visible]:text-accent-foreground has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-ring has-[button:focus-visible]:ring-offset-0",
          labelStyle,
          isDisabled &&
            "pointer-events-none cursor-not-allowed gap-x-2 text-primary/42",
          className,
        )}
      >
        {checkboxElement}
        <span className="leading-tight">{label}</span>
      </label>
    );
  }

  return (
    <div className="inline-flex items-center p-0 bg-transparent">
      {checkboxElement}
    </div>
  );
}

export { Checkbox };
