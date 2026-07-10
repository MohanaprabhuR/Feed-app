"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function Table({
  className,
  noPadding,
  ...props
}: React.ComponentProps<"table"> & { noPadding?: boolean }) {
  return (
    <div
      data-slot="table-container"
      className={cn("relative w-full overflow-x-auto", !noPadding && "px-3")}
    >
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-base tracking-4 leading-tight",
          className
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:hover:bg-transparent ", className)}
      {...props}
    />
  );
}

interface TableBodyProps extends React.ComponentProps<"tbody"> {
  borderNone?: boolean;
}

function TableBody({ className, borderNone, ...props }: TableBodyProps) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-0  [&_tr[data-state=selected]_td:first-child]:rounded-none [&_tr[data-state=selected]_td:last-child]:rounded-none",
        borderNone && "[&_tr]:border-0 ",
        className
      )}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-card border-b data-[state=selected]:bg-secondary  group",
        "[&>td:first-child]:pl-0 [&>td:first-child]:text-foreground [&>td:first-child]:font-medium [&>td:first-child:has([role=checkbox])+td]:text-foreground [&>td:first-child:has([role=checkbox])+td]:font-medium [&>td:last-child]:pr-3 [&>th:first-child]:pl-0 [&>th:last-child]:pr-3",
        className
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-muted-foreground text-sm px-2 py-[8.5px]  tracking-4 leading-tight font-normal text-left align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&:has([role=checkbox])]:py-0 [&>[role=checkbox]]:translate-y-[2px] [&:has(button)]:py-0",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "h-11 first:before:content-[''] first:before:absolute first:before:w-3 first:before:h-full first:before:bg-card first:before:opacity-0 first:before:top-0 first:before:-left-3  first:before:rounded-l-lg group-hover:first:before:opacity-100 ",
        "group-data-[state=selected]:first:before:bg-secondary group-data-[state=selected]:first:before:rounded-none group-data-[state=selected]:first:before:opacity-100 group-data-[state=selected]:first:before:border-b group-data-[state=selected]:first:before:border-border group-data-[state=selected]:first:before:h-11.25 group-data-[state=selected]:first:before:border-t-transparent ",

        "last:after:content-[''] last:after:absolute last:after:w-3 last:after:h-full last:after:bg-card last:after:opacity-0 last:after:top-0 last:after:-right-3 last:after:rounded-r-lg group-hover:last:after:opacity-100",
        "group-data-[state=selected]:last:after:bg-secondary group-data-[state=selected]:last:after:opacity-100 group-data-[state=selected]:last:after:rounded-none group-data-[state=selected]:last:after:border-b group-data-[state=selected]:last:after:border-border group-data-[state=selected]:last:after:h-11.25 group-data-[state=selected]:last:after:border-t-transparent ",
        "relative  text-secondary-foreground text-base  px-2 py-3 tracking-4 leading-tight font-normal  align-middle whitespace-nowrap [&:has([role=checkbox])]:px-1.5  [&:has([role=checkbox])]:w-[28px] [&:has([role=checkbox])]:py-3  [&>[role=checkbox]]:translate-y-[2px] [&:has([data-slot=avatar])]:py-3 [&:has(button)]:py-0 [&_strong]:text-accent-foreground [&_strong]:font-medium",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-x-2 truncate  ">
        {props.children}
      </span>
    </td>
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        "text-foreground leading-normal tracking-4 font-normal mt-4 text-sm",
        className
      )}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
