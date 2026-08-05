import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#07111f", color: "#63d8e5", fontSize: 32, fontWeight: 800, border: "3px solid #63d8e5", borderRadius: 16 }}>R</div>,
    size,
  );
}
