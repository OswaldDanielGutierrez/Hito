"use client";

/** Interruptor accesible (`role="switch"`) con área táctil ampliada. */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-pill transition-colors duration-[120ms] ease-out after:absolute after:-inset-2 after:content-[''] disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-green-700" : "bg-gray-500"
      }`}
    >
      <span
        aria-hidden
        className={`inline-block size-[18px] rounded-full bg-white shadow-sm transition-transform duration-[120ms] ease-out ${
          checked ? "translate-x-[20px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}
