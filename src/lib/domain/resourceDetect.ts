import type { ResourceKind } from "./types";

export interface DetectedResource {
  kind: ResourceKind;
  origin: string;
}

const matches = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

function parse(rawUrl: string): URL | null {
  const text = rawUrl.trim();
  if (!text) return null;

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname.includes(".")) return null;
  return url;
}

/** URL completa con protocolo, o `null` si no es un enlace web válido. */
export function normalizeUrl(rawUrl: string): string | null {
  return parse(rawUrl)?.href ?? null;
}

/** Tipo y origen de un recurso según el dominio de su URL. `null` si no es una URL válida. */
export function detectResource(rawUrl: string): DetectedResource | null {
  const url = parse(rawUrl);
  if (!url) return null;
  const host = url.hostname.toLowerCase();

  if (matches(host, "github.com")) return { kind: "code", origin: "GitHub" };
  if (matches(host, "sharepoint.com") || host.includes("onedrive")) return { kind: "document", origin: "SharePoint" };
  if (host === "docs.google.com") return { kind: "document", origin: "Google Docs" };
  if (host === "make.powerautomate.com" || matches(host, "flow.microsoft.com")) {
    return { kind: "flow", origin: "Power Automate" };
  }
  if (host.startsWith("n8n.")) return { kind: "flow", origin: "n8n" };
  if (matches(host, "figma.com")) return { kind: "link", origin: "Figma" };

  return { kind: "link", origin: host.replace(/^www\./, "") };
}

/** Nombre sugerido: último tramo legible de la ruta, o el origen si no hay ruta. */
export function suggestResourceName(rawUrl: string): string {
  const url = parse(rawUrl);
  const detected = detectResource(rawUrl);
  if (!url || !detected) return "";

  const segment = url.pathname.split("/").filter(Boolean).pop();
  if (!segment) return detected.origin;

  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // se deja el tramo tal cual
  }
  const looksLikeId = /^[\w-]{20,}$/.test(decoded) && /\d/.test(decoded) && /[a-z]/i.test(decoded);
  const readable = decoded.replace(/\.[a-z0-9]{1,5}$/i, "").replace(/[-_+]+/g, " ").trim();
  if (!readable || looksLikeId || readable.length > 80) return detected.origin;
  return `${detected.origin} · ${readable}`;
}

const CODE_EXTENSIONS = new Set(["js", "jsx", "ts", "tsx", "py", "sql", "json", "yml", "yaml", "sh", "ps1", "zip", "html", "css"]);

/** Los archivos subidos son `code` si son código o exportaciones; el resto, `document`. */
export function detectFileKind(fileName: string): ResourceKind {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  return fileName.includes(".") && CODE_EXTENSIONS.has(extension) ? "code" : "document";
}

/** Nombre seguro para la ruta de Storage: sin acentos, espacios ni caracteres raros. */
export function sanitizeFileName(fileName: string): string {
  const cleaned = fileName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+/, "")
    .slice(-100);
  return cleaned || "archivo";
}
