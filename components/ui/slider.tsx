"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

type SliderSize = "sm" | "md" | "lg" | "xl";

const knobSizeMap: Record<SliderSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
  xl: "size-6",
};

const trackHeightMap: Record<SliderSize, string> = {
  sm: "data-[orientation=horizontal]:h-0.5 data-[orientation=vertical]:w-0.5",
  md: "data-[orientation=horizontal]:h-1 data-[orientation=vertical]:w-1",
  lg: "data-[orientation=horizontal]:h-2 data-[orientation=vertical]:w-2",
  xl: "data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5",
};

interface SliderProps
  extends React.ComponentProps<typeof SliderPrimitive.Root> {
  size?: SliderSize;
  knob?: boolean;
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  size = "sm",
  knob = false,
  ...props
}: SliderProps) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none outline-none  data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col group",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-secondary relative grow overflow-hidden rounded-4xl ",
          trackHeightMap[size]
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-primary absolute outline-none data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full data-[orientation=vertical]:left-0",
            !knob && "data-[disabled]:bg-primary/20 rounded-4xl"
          )}
        />
      </SliderPrimitive.Track>

      {knob &&
        Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            data-slot="slider-thumb"
            className={cn(
              "bg-white block shrink-0 rounded-4xl outline-none shadow-sm transition-[color,box-shadow] group-hover:shadow-2xl group-active:shadow-2xl group-focus:shadow-3xl  group-focus-visible:shadow-3xl data-[disabled]:pointer-events-none data-[disabled]:bg-input  data-[disabled]:shadow-none data-[disabled]:cursor-not-allowed",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-0",
              knobSizeMap[size]
            )}
          />
        ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
