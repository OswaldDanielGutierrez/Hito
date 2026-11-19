import type { ResourceKind } from "./types";

export interface DetectedResource {
  kind: ResourceKind;
  origin: string;
}

const matches = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);

/** Tipo y origen de un recurso según el dominio de su URL. `null` si no es una URL válida. */
export function detectResource(rawUrl: string): DetectedResource | null {
  const text = rawUrl.trim();
  if (!text) return null;

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  if (!host.includes(".")) return null;

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
