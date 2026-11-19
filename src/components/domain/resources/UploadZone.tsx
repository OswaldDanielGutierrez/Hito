"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldClass } from "@/lib/ui-colors";

export function UploadZone({
  busy,
  onFiles,
  onLink,
}: {
  busy: boolean;
  onFiles: (files: File[]) => void;
  onLink: (url: string) => void;
}) {
  const [over, setOver] = useState(false);
  const [link, setLink] = useState("");
  const input = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = [...e.dataTransfer.files];
        if (files.length > 0) onFiles(files);
      }}
      className={`rounded-card border-2 border-dashed p-4 transition-colors duration-[120ms] ease-out sm:p-[22px] ${
        over ? "border-green-700 bg-green-50" : "border-green-200 bg-white"
      }`}
    >
      <h3 className="text-sm font-extrabold">Arrastra un archivo o pega un enlace</h3>
      <p className="mt-1 mb-3 text-[13px] text-muted">
        Detecto el tipo solo: SharePoint, Power Automate, GitHub, Figma o cualquier URL.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!link.trim()) return;
          onLink(link);
          setLink("");
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="zona-enlace" className="sr-only">
          Pega un enlace
        </label>
        <input
          id="zona-enlace"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://…"
          disabled={busy}
          className={`${fieldClass} min-w-0 sm:flex-1`}
        />
        <div className="flex gap-3 sm:shrink-0">
          <Button type="submit" disabled={busy || !link.trim()} className="flex-1 sm:flex-none">
            Agregar enlace
          </Button>
          <Button type="button" variant="secondary" disabled={busy} className="flex-1 sm:flex-none" onClick={() => input.current?.click()}>
            Elegir archivo
          </Button>
        </div>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          aria-label="Elegir archivos para subir"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            if (files.length > 0) onFiles(files);
          }}
        />
      </form>
      {busy && (
        <p role="status" className="mt-3 text-[13px] font-semibold text-green-700-hover">
          Guardando…
        </p>
      )}
    </div>
  );
}
