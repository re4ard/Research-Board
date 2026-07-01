"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type DropdownOption<T extends string> = {
  value: T;
  label: string;
};

export function DropdownSelect<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  className,
  buttonClassName
}: {
  ariaLabel: string;
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex h-10 min-w-36 items-center justify-between gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-medium text-ink shadow-sm outline-none transition duration-200 hover:-translate-y-0.5 hover:border-black/20 hover:shadow-soft focus:ring-2 focus:ring-sage/25 dark:border-white/10 dark:bg-white/[0.07] dark:text-paper dark:hover:border-white/20",
          buttonClassName
        )}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown
          className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
          size={15}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-52 rounded-lg border border-black/10 bg-paper p-1.5 shadow-soft animate-in dark:border-white/10 dark:bg-[#20201d]">
          {options.map((option) => (
            <button
              className={cn(
                "flex h-9 w-full items-center justify-between rounded-md px-2 text-left text-sm font-medium text-black/65 transition hover:bg-white hover:text-ink dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-paper",
                option.value === value && "bg-white text-ink dark:bg-white/10 dark:text-paper"
              )}
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
