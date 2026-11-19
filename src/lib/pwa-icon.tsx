import { ImageResponse } from "next/og";

/** Ícono de la app: rombo verde sobre el verde oscuro de la marca. */
export function renderIcon(size: number) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#022C17" }}>
        <div style={{ width: size * 0.34, height: size * 0.34, background: "#00A859", borderRadius: size * 0.04, transform: "rotate(45deg)" }} />
      </div>
    ),
    { width: size, height: size },
  );
}
