export function Bar({ percent, label }: { percent: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface"
    >
      <div className="h-full rounded-pill bg-green-500" style={{ width: `${percent}%` }} />
    </div>
  );
}
