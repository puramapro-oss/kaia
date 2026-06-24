import { NextResponse, type NextRequest } from "next/server";
import { SignJWT } from "jose";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (process.env.ENABLE_LIVEKIT !== "true") {
    return NextResponse.json({ error: "LiveKit non disponible. Bientôt." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const circleId = searchParams.get("circleId");
  if (!circleId) {
    return NextResponse.json({ error: "circleId requis." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tu dois être connecté·e." }, { status: 401 });
  }

  const rl = await rateLimit(`livekit-token:${user.id}`, 10, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const service = createServiceClient();
  const { data: circle } = await service
    .from("intention_circles")
    .select("id, livekit_room_name, status, facilitator_id")
    .eq("id", circleId)
    .single();

  if (!circle || circle.status === "closed") {
    return NextResponse.json({ error: "Cercle introuvable ou fermé." }, { status: 404 });
  }

  const roomName = circle.livekit_room_name ?? `kaia-cercle-${circleId}`;

  if (!circle.livekit_room_name) {
    await service
      .from("intention_circles")
      .update({ livekit_room_name: roomName })
      .eq("id", circleId);
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "LiveKit non configuré." }, { status: 503 });
  }

  const isFacilitator = circle.facilitator_id === user.id;
  const secret = new TextEncoder().encode(apiSecret);

  const token = await new SignJWT({
    video: {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isFacilitator,
    },
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(apiKey)
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(secret);

  return NextResponse.json({ token, roomName, liveKitUrl: process.env.LIVEKIT_URL });
}
