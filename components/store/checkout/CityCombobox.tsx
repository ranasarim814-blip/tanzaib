"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { OTHER_CITY, PK_CITIES } from "@/lib/validation/cities";
import { cn } from "@/lib/utils";

/** Accessible searchable dropdown of Pakistani cities (+ "Other"). */
export function CityCombobox({
  value,
  onChange,
  invalid,
  describedBy,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  describedBy?: string;
  id: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...PK_CITIES].filter((c) => !q || c.toLowerCase().includes(q) || value === query);
    return [...(value === query ? PK_CITIES : list), OTHER_CITY];
  }, [query, value]);

  const commit = (v: string) => {
    onChange(v);
    setQuery(v);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        autoComplete="address-level2"
        placeholder="Start typing your city"
        className="field pr-8"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
          const exact = [...PK_CITIES, OTHER_CITY].find((c) => c.toLowerCase() === e.target.value.trim().toLowerCase());
          onChange(exact ?? "");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(options.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            if (options[active]) commit(options[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2 text-taupe" strokeWidth={1.25} />
      {open && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto border border-line bg-ivory shadow-xl" data-lenis-prevent>
          {options.map((c, i) => (
            <li
              key={c}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={c === value}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(c);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("cursor-pointer px-4 py-2.5 text-sm", i === active && "bg-parchment", c === OTHER_CITY && "border-t border-line text-taupe")}
            >
              {c === OTHER_CITY ? "Other city…" : c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
