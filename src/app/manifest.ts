import type { MetadataRoute } from "next";
import { APP_NAME } from "@/config/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} · gestor de proyectos`,
    short_name: APP_NAME,
    description: "Gestor de proyectos personal de automatización e IA",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#F6F8F7",
    theme_color: "#022C17",
    lang: "es-CO",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
