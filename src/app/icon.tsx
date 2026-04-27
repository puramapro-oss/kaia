import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 35% 30%, #1a4d3a 0%, #0a0a0f 75%)",
          color: "#FFFEF7",
          fontSize: 280,
          fontWeight: 700,
          fontFamily: "ui-serif, Georgia, serif",
          letterSpacing: "-0.04em",
          borderRadius: 72,
        }}
      >
        K
      </div>
    ),
    size,
  );
}
