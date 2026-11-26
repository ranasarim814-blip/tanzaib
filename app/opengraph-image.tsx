import { ImageResponse } from "next/og";

export const alt = "Tanzaib — Hand-embroidered heirlooms";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#1C1A17", color: "#F7F3EC", fontFamily: "Georgia, serif" }}>
        <div style={{ position: "absolute", left: 420, top: 70, width: 360, height: 560, border: "1px solid rgba(176,141,87,0.55)", borderRadius: "180px 180px 0 0", display: "flex" }} />
        <div style={{ fontSize: 92, letterSpacing: 26 }}>TANZAIB</div>
        <div style={{ marginTop: 18, fontSize: 24, letterSpacing: 8, color: "#D9C4A0" }}>HAND-EMBROIDERED HEIRLOOMS</div>
      </div>
    ),
    size,
  );
}
