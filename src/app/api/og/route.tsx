import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";

const SIZE = { width: 1200, height: 630 };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title")?.slice(0, 90) ?? "KAÏA";
  const subtitle =
    url.searchParams.get("subtitle")?.slice(0, 140) ??
    "Routine multisensorielle pour le bien-être quotidien";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 96px",
          background:
            "radial-gradient(circle at 30% 25%, rgba(26,77,58,0.55) 0%, transparent 55%), radial-gradient(circle at 75% 78%, rgba(244,196,48,0.18) 0%, transparent 50%), #0a0a0f",
          color: "#FFFEF7",
          fontFamily:
            "ui-serif, Georgia, 'Times New Roman', serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 36,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,254,247,0.65)",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#06B6D4",
              boxShadow: "0 0 24px rgba(6,182,212,0.55)",
            }}
          />
          KAÏA
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 36,
              color: "rgba(255,254,247,0.7)",
              maxWidth: 940,
              fontFamily: "ui-sans-serif, system-ui, sans-serif",
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "rgba(255,254,247,0.5)",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          }}
        >
          <span>kaia.purama.dev</span>
          <span>14 jours d&apos;essai · sans engagement</span>
        </div>
      </div>
    ),
    SIZE,
  );
}
