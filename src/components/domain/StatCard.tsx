import type { ReactNode } from "react";

export function StatCard({
  icon,
  iconBg,
  iconColor,
  value,
  valueColor,
  label,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  value: number;
  valueColor?: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-white p-3 sm:gap-3.5 sm:p-4">
      <span
        aria-hidden
        className="flex size-10 shrink-0 sm:size-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </span>
      <div>
        <div className="text-[26px] leading-8 font-extrabold" style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </div>
        <div className="text-xs font-medium text-muted">{label}</div>
      </div>
    </div>
  );
}
