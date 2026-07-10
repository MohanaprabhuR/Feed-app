"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type RadioSize = "sm" | "md";
type LabelPadding = "sm" | "md";

const radioSizeMap: Record<RadioSize, string> = {
  sm: "w-[14px] h-[14px]",
  md: "w-4 h-4",
};

const iconSizeMap: Record<RadioSize, string> = {
  sm: "w-1.5 h-1.5",
  md: "w-[7px] h-[7px]",
};

const defaultLabelMap: Record<RadioSize, string> = {
  sm: "p-1.5 text-base",
  md: "px-2 py-[7px] text-lg",
};

const labelPaddingMap: Record<LabelPadding, string> = {
  sm: "p-1.5",
  md: "px-2 py-[7px]",
};

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

interface RadioGroupItemProps extends React.ComponentProps<
  typeof RadioGroupPrimitive.Item
> {
  size?: RadioSize;
  label?: React.ReactNode;
  labelPadding?: LabelPadding;
  id: string;
  labelClassName?: string;
}

function RadioGroupItem({
  className,
  size = "sm",
  labelPadding,
  label,
  disabled,
  labelClassName,
  id,
  ...props
}: RadioGroupItemProps) {
  const finalLabelClass = labelPadding
    ? labelPaddingMap[labelPadding]
    : defaultLabelMap[size];

  const labelFontMap: Record<RadioSize, string> = {
    sm: "text-base font-normal leading-tight tracking-4",
    md: "text-lg font-medium leading-tight tracking-4",
  };

  const radio = (
    <RadioGroupPrimitive.Item
      id={id}
      data-slot="radio-group-item"
      disabled={disabled}
      className={cn(
        "aspect-square shrink-0 rounded-full border border-primary/44 outline-none transition-[color,box-shadow] ",
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        "hover:border-primary/60 hover:shadow-lg active:border-primary/75 active:bg-secondary focus:border-primary/75 focus:bg-secondary",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
        "disabled:bg-card disabled:data-[state=checked]:bg-accent disabled:data-[state=checked]:border-accent disabled:border-primary/12 disabled:hover:shadow-none disabled:cursor-not-allowed disabled:pointer-events-none",
        radioSizeMap[size],
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <CircleIcon
          className={cn(
            "fill-background text-background stroke-0",
            disabled && "fill-primary/15 text-primary/15",
            iconSizeMap[size],
          )}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );

  if (label) {
    return (
      <label
        htmlFor={id}
        className={cn(
          "flex items-center gap-x-2 cursor-pointer text-accent-foreground outline-none rounded-lg hover:bg-accent active:bg-primary/12 w-fit focus:bg-secondary  focus:ring-ring focus:ring-2 focus:ring-offset-0 focus-visible:ring-ring focus-visible:ring-2 focus-visible:bg-secondary ",
          finalLabelClass,
          labelClassName,
          disabled &&
            "hover:bg-transparent cursor-not-allowed pointer-events-none text-primary/50",
        )}
      >
        {radio}
        <span className={cn(labelFontMap[size])}>{label}</span>
      </label>
    );
  }

  return radio;
}

export { RadioGroup, RadioGroupItem };
