import type { Segment } from "@/lib/domain/portfolio";
import type { Health } from "@/lib/domain/types";

const CURRENT: Record<Health, string> = {
  on_track: "#D9822B",
  at_risk: "#D9822B",
  late: "#B42318",
  on_hold: "#9AA49F",
};

/** Un segmento por fase: hecha, actual (color según salud) o futura. */
export function PhaseSegments({
  segments,
  health,
  currentName,
}: {
  segments: Segment[];
  health: Health | null;
  currentName: string | null;
}) {
  const currentColor = CURRENT[health ?? "on_track"];
  const label = currentName ? `Fase actual: ${currentName}` : "Sin fase actual";

  return (
    <div role="img" aria-label={label} className="flex gap-[3px]">
      {segments.map((s, i) => {
        const isCurrent = s.status !== "completed" && segments.findIndex((x) => x.status !== "completed") === i;
        const color = s.status === "completed" ? "#00A859" : isCurrent ? currentColor : "#E1E6E3";
        return <span key={i} title={s.name} className="h-2.5 flex-1 rounded-[3px]" style={{ backgroundColor: color }} />;
      })}
    </div>
  );
}
