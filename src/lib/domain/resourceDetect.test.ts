import { describe, expect, it } from "vitest";
import { detectResource } from "./resourceDetect";

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
