import { TAG_STYLES, type Tag } from "@/lib/domain/tags";

/** Etiqueta de solo lectura. El nombre siempre está en texto: el color es un apoyo, no el único dato. */
export function TagChip({ tag }: { tag: Pick<Tag, "name" | "color"> }) {
  const s = TAG_STYLES[tag.color];
  return (
    <span
      className="inline-flex max-w-full items-center rounded-pill px-2.5 py-0.5 text-xs font-bold"
      style={{ backgroundColor: s.bg, color: s.ink }}
    >
      <span className="truncate">{tag.name}</span>
    </span>
  );
}

export function TagChips({ tags, className = "" }: { tags: Pick<Tag, "id" | "name" | "color">[]; className?: string }) {
  if (tags.length === 0) return null;
  return (
    <ul aria-label="Etiquetas" className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((t) => (
        <li key={t.id} className="max-w-full">
          <TagChip tag={t} />
        </li>
      ))}
    </ul>
  );
}
