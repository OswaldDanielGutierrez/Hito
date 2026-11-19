"use client";

import { CheckSquare, FileText, Folder, ListTodo, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { searchAll, type SearchResult } from "@/app/(app)/buscar/actions";
import { Dialog } from "@/components/ui/Dialog";

const typeLabel = { project: "Proyectos", task: "Tareas", resource: "Recursos", quick: "Pendientes" } as const;
const typeIcon = { project: Folder, task: CheckSquare, resource: FileText, quick: ListTodo } as const;

/** Botón de la barra superior (campo en escritorio, lupa en celular) + panel de búsqueda con Ctrl K. */
export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar proyectos, tareas o recursos (Ctrl K)"
        className="flex size-10 items-center justify-center rounded-full text-green-200 hover:bg-green-800 hover:text-white sm:size-9 lg:hidden"
      >
        <Search size={18} strokeWidth={1.9} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-[280px] items-center gap-2 rounded-input bg-green-800 px-3 text-left text-sm text-green-200 hover:bg-[#065f33] lg:flex xl:w-[300px]"
      >
        <Search size={16} strokeWidth={1.9} aria-hidden />
        <span className="flex-1 truncate">Buscar proyectos, tareas o recursos</span>
        <kbd className="rounded border border-green-700 px-1.5 text-[11px] font-semibold">Ctrl K</kbd>
      </button>
      {open && <SearchPanel onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const request = useRef(0);

  function onChange(value: string) {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      request.current++;
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const id = ++request.current;
      const found = await searchAll({ query: value });
      if (id !== request.current) return;
      setResults(found);
      setActive(0);
      setLoading(false);
    }, 250);
  }

  function open(result: SearchResult) {
    onClose();
    router.push(result.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      open(results[active]);
    }
  }

  const groups = (["project", "task", "quick", "resource"] as const)
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);
  const searched = query.trim().length >= 2 && !loading;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="Buscar" description="Proyectos, tareas y recursos.">
      <div>
        <label htmlFor="busqueda" className="sr-only">
          Buscar proyectos, tareas o recursos
        </label>
        <div className="relative">
          <Search size={18} strokeWidth={1.9} aria-hidden className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            id="busqueda"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="resultados-busqueda"
            aria-autocomplete="list"
            autoFocus
            autoComplete="off"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            aria-activedescendant={results[active] ? `resultado-${results[active].type}-${results[active].id}` : undefined}
            placeholder="Escribe al menos 2 letras…"
            className="h-11 w-full rounded-input border border-input-border bg-white pr-3 pl-10 text-base sm:text-sm"
          />
        </div>
      </div>

      <div id="resultados-busqueda" role="listbox" aria-label="Resultados" className="mt-3 max-h-[55dvh] overflow-y-auto">
        {loading && <p className="px-1 py-3 text-sm text-muted">Buscando…</p>}
        {searched && results.length === 0 && <p className="px-1 py-3 text-sm text-muted">Sin resultados para «{query.trim()}».</p>}
        {groups.map((g) => (
          <div key={g.type} role="group" aria-label={typeLabel[g.type]} className="mb-2">
            <div className="px-1 py-1.5 text-[11px] font-bold tracking-[.06em] text-muted uppercase">{typeLabel[g.type]}</div>
            {g.items.map((r) => {
              const Icon = typeIcon[r.type];
              const index = results.indexOf(r);
              return (
                <div
                  key={`${r.type}-${r.id}`}
                  id={`resultado-${r.type}-${r.id}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => open(r)}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-input px-2.5 py-2 ${index === active ? "bg-green-50" : ""}`}
                >
                  <Icon size={18} strokeWidth={1.9} aria-hidden className="shrink-0 text-green-700" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{r.title}</span>
                    {r.subtitle && <span className="block truncate text-xs text-muted">{r.subtitle}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Dialog>
  );
}
