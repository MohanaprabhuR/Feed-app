"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Divider } from "@/components/ui/divider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDatetimeLocalValue(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const [datePart, timePart] = trimmed.split("T");
  if (!datePart || !timePart) return null;

  const [yearStr, monthStr, dayStr] = datePart.split("-");
  const [hourStr, minuteStr] = timePart.split(":");

  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (
    [year, monthIndex, day, hour, minute].some((n) => Number.isNaN(n)) ||
    yearStr.length !== 4 ||
    monthStr.length !== 2 ||
    dayStr.length !== 2
  ) {
    return null;
  }

  return new Date(year, monthIndex, day, hour, minute, 0, 0);
}

function formatDisplayValue(value: string) {
  const parsed = parseDatetimeLocalValue(value);
  if (!parsed) return "";

  // Fixed locale so SSR and client render the same string.
  return parsed.toLocaleString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function to12Hour(date: Date) {
  const hour24 = date.getHours();
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return {
    hour: String(hour12).padStart(2, "0"),
    minute: String(date.getMinutes()).padStart(2, "0"),
    period: period as "AM" | "PM",
  };
}

function to24Hour(hour12: string, minute: string, period: "AM" | "PM") {
  let hour = Number(hour12) % 12;
  if (period === "PM") hour += 12;
  return { hour, minute: Number(minute) };
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const value = String(i + 1).padStart(2, "0");
  return { value, label: value };
});

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => {
  const value = String(i).padStart(2, "0");
  return { value, label: value };
});

const PERIOD_OPTIONS = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
] as const;

type DateTimePickerPopoverProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minValue?: string;
};

export function DateTimePickerPopover({
  id,
  value,
  onChange,
  disabled,
  placeholder = "Select date and time",
  minValue,
}: DateTimePickerPopoverProps) {
  const parsedValue = parseDatetimeLocalValue(value);
  const parsedMin = minValue ? parseDatetimeLocalValue(minValue) : null;

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    return parsedValue ?? parsedMin ?? new Date();
  });
  const [hour12, setHour12] = useState("09");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  function syncDraftFromValue() {
    const base = parsedValue ?? parsedMin ?? new Date();
    setSelectedDate(
      new Date(base.getFullYear(), base.getMonth(), base.getDate()),
    );
    const time = to12Hour(base);
    setHour12(time.hour);
    setMinute(time.minute);
    setPeriod(time.period);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) syncDraftFromValue();
    setOpen(nextOpen);
  }

  function handleClear() {
    onChange("");
    setOpen(false);
  }

  function handleToday() {
    const today = new Date();
    setSelectedDate(
      new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    );
    const time = to12Hour(today);
    setHour12(time.hour);
    setMinute(time.minute);
    setPeriod(time.period);
  }

  function handleOk() {
    const { hour, minute: minuteValue } = to24Hour(hour12, minute, period);
    const date = new Date(selectedDate);
    date.setHours(hour, minuteValue, 0, 0);

    const next = toDatetimeLocalValue(date);

    if (parsedMin) {
      const nextDate = parseDatetimeLocalValue(next);
      if (nextDate && nextDate.getTime() < parsedMin.getTime()) {
        toast.custom(() => (
          <Alert variant="error">
            <AlertContent>
              <AlertTitle>Invalid time</AlertTitle>
              <AlertDescription>
                End time must be after the start time.
              </AlertDescription>
            </AlertContent>
          </Alert>
        ));
        return;
      }
    }

    onChange(next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={formatDisplayValue(value)}
          readOnly
          disabled={disabled}
        />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-140 flex flex-col overflow-hidden p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-1 min-h-0">
          <div className="flex flex-col min-w-80">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date: Date | undefined) => {
                if (!date) return;
                setSelectedDate(date);
              }}
              captionLayout="dropdown"
              className="w-full rounded-none shadow-none"
            />
            <div className="flex items-center justify-between px-3 pb-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={handleClear}
                disabled={disabled}
              >
                Clear
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={handleToday}
                disabled={disabled}
              >
                Today
              </Button>
            </div>
          </div>

          <Divider orientation="vertical" className="self-stretch" />

          <div className="flex min-w-60 flex-1 items-center px-3">
            <div className="w-full rounded-2xl">
              <div className="text-lg font-normal tracking-4 text-foreground">
                Time
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <Select
                  value={hour12}
                  onValueChange={setHour12}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-18 rounded-xl" size="sm">
                    <SelectValue placeholder="01" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOUR_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={minute}
                  onValueChange={setMinute}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-18 rounded-xl" size="sm">
                    <SelectValue placeholder="00" />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTE_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={period}
                  onValueChange={(next) => setPeriod(next as "AM" | "PM")}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-22 rounded-xl" size="sm">
                    <SelectValue placeholder="AM" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex w-full justify-end border-t px-3 py-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOk}
            disabled={disabled}
          >
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
