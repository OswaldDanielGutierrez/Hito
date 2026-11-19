import { describe, expect, it } from "vitest";
import { detectFileKind, detectResource, normalizeUrl, sanitizeFileName, suggestResourceName } from "./resourceDetect";

describe("detectResource", () => {
  it.each([
    ["https://github.com/OswaldDanielGutierrez/Hito", "code", "GitHub"],
    ["https://empresa.sharepoint.com/sites/x/doc.docx", "document", "SharePoint"],
    ["https://onedrive.live.com/edit?id=1", "document", "SharePoint"],
    ["https://docs.google.com/document/d/abc", "document", "Google Docs"],
    ["https://make.powerautomate.com/environments/x/flows/y", "flow", "Power Automate"],
    ["https://flow.microsoft.com/es-es/", "flow", "Power Automate"],
    ["https://n8n.miempresa.com/workflow/12", "flow", "n8n"],
    ["https://www.figma.com/file/abc", "link", "Figma"],
  ] as const)("%s → %s / %s", (url, kind, origin) => {
    expect(detectResource(url)).toEqual({ kind, origin });
  });

  it("otro dominio: enlace con el dominio como origen", () => {
    expect(detectResource("https://www.ejemplo.com/pagina")).toEqual({ kind: "link", origin: "ejemplo.com" });
  });

  it("acepta URLs sin protocolo", () => {
    expect(detectResource("github.com/foo/bar")).toEqual({ kind: "code", origin: "GitHub" });
  });

  it("no confunde dominios parecidos", () => {
    expect(detectResource("https://notgithub.com/x")).toEqual({ kind: "link", origin: "notgithub.com" });
    expect(detectResource("https://github.com.evil.io/x")).toEqual({ kind: "link", origin: "github.com.evil.io" });
  });

  it("rechaza texto que no es una URL web", () => {
    expect(detectResource("")).toBeNull();
    expect(detectResource("hola mundo")).toBeNull();
    expect(detectResource("javascript:alert(1)")).toBeNull();
    expect(detectResource("ftp://servidor.com/a")).toBeNull();
  });
});

describe("normalizeUrl", () => {
  it("agrega el protocolo y devuelve la URL completa", () => {
    expect(normalizeUrl("github.com/foo/bar")).toBe("https://github.com/foo/bar");
    expect(normalizeUrl("  https://www.figma.com/file/abc  ")).toBe("https://www.figma.com/file/abc");
  });

  it("rechaza lo que no es un enlace web", () => {
    expect(normalizeUrl("hola")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("")).toBeNull();
  });
});

describe("suggestResourceName", () => {
  it("usa el último tramo de la ruta, legible", () => {
    expect(suggestResourceName("https://github.com/org/mi-repositorio")).toBe("GitHub · mi repositorio");
    expect(suggestResourceName("https://empresa.sharepoint.com/sites/x/Plan%20de%20trabajo.docx")).toBe(
      "SharePoint · Plan de trabajo",
    );
  });

  it("usa el origen si no hay ruta o la ruta es un identificador", () => {
    expect(suggestResourceName("https://www.ejemplo.com")).toBe("ejemplo.com");
    expect(suggestResourceName("https://docs.google.com/document/d/1AbC2dEf3GhI4jKl5MnO6pQr7StU8vWx9")).toBe("Google Docs");
  });

  it("devuelve vacío si no es un enlace", () => {
    expect(suggestResourceName("hola")).toBe("");
  });
});

describe("detectFileKind", () => {
  it("clasifica archivos por extensión", () => {
    expect(detectFileKind("plan.pdf")).toBe("document");
    expect(detectFileKind("Informe FINAL.DOCX")).toBe("document");
    expect(detectFileKind("flujo.json")).toBe("code");
    expect(detectFileKind("script.PY")).toBe("code");
    expect(detectFileKind("sin-extension")).toBe("document");
    expect(detectFileKind("json")).toBe("document");
  });
});

describe("sanitizeFileName", () => {
  it("quita acentos, espacios y caracteres raros", () => {
    expect(sanitizeFileName("Presentación final (v2).pptx")).toBe("Presentacion-final-v2-.pptx");
    expect(sanitizeFileName("../../etc/passwd")).toBe("etc-passwd");
    expect(sanitizeFileName("***")).toBe("archivo");
  });

  it("limita el largo conservando la extensión", () => {
    const long = "a".repeat(300) + ".pdf";
    const result = sanitizeFileName(long);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result.endsWith(".pdf")).toBe(true);
  });
});
