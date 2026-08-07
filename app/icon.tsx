import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f1ea", color: "#0b6d7d", fontSize: 32, fontWeight: 800, border: "3px solid #0b6d7d", borderRadius: 16 }}>R</div>,
    size,
  );
}
