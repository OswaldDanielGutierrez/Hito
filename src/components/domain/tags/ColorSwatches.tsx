"use client";

import { Check } from "lucide-react";
import { TAG_COLOR_LABELS, TAG_COLORS, TAG_STYLES, type TagColor } from "@/lib/domain/tags";

/** Selector de color: cada muestra tiene nombre accesible y la elegida muestra una marca. */
export function ColorSwatches({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TagColor;
  onChange: (color: TagColor) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-0.5">
      {TAG_COLORS.map((c) => {
        const selected = c === value;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={TAG_COLOR_LABELS[c]}
            title={TAG_COLOR_LABELS[c]}
            onClick={() => onChange(c)}
            className="flex size-10 items-center justify-center rounded-full"
          >
            <span
              className={`flex size-7 items-center justify-center rounded-full text-white ${selected ? "ring-2 ring-ink ring-offset-2" : ""}`}
              style={{ backgroundColor: TAG_STYLES[c].dot }}
            >
              {selected && <Check size={16} strokeWidth={2.5} aria-hidden />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
