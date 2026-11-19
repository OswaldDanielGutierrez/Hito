import type { ReactNode } from "react";

export function Chip({ icon, label, children }: { icon?: ReactNode; label?: string; children: ReactNode }) {
  return (
    <span
      title={label}
      className="inline-flex items-center gap-1.5 rounded-pill bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft"
    >
      {icon}
      {children}
    </span>
  );
}
