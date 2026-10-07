import { ImageResponse } from "next/og";

export const alt = "Mhub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 120%, #5e49d5 0%, #000 60%)",
          color: "#fff",
          fontSize: 180,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        Mhub
      </div>
    ),
    size,
  );
}
