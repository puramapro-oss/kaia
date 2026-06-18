import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const enabled = process.env.ENABLE_LIVEKIT === "true";

  if (!enabled) {
    return NextResponse.json(
      { error: "LiveKit non disponible. Bientôt." },
      { status: 503 }
    );
  }

  // Future: validate circle membership + generate token
  return NextResponse.json({ error: "Non implémenté" }, { status: 501 });
}
