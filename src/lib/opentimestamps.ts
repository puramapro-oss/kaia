import { createHash } from "crypto";

export interface StampResult {
  sha256: string;
  timestamp: number;
  ots?: string;
  method: "opentimestamps" | "sha256_fallback";
}

export interface VerifyResult {
  valid: boolean;
  sha256: string;
  method: "opentimestamps" | "sha256_fallback";
  error?: string;
}

function sha256hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

export async function stampData(data: string): Promise<StampResult> {
  const sha256 = sha256hex(data);
  const timestamp = Date.now();

  try {
    const OpenTimestamps = await import("javascript-opentimestamps").then(
      (m) => m.default ?? m
    );
    const detached = OpenTimestamps.DetachedTimestampFile.fromHash(
      new OpenTimestamps.Ops.OpSHA256(),
      Buffer.from(sha256, "hex")
    );
    await OpenTimestamps.stamp(detached);
    const serialized = Buffer.from(detached.serializeToBytes()).toString("base64");
    return { sha256, timestamp, ots: serialized, method: "opentimestamps" };
  } catch {
    return { sha256, timestamp, method: "sha256_fallback" };
  }
}

export async function verifyStamp(
  data: string,
  stamp: StampResult
): Promise<VerifyResult> {
  const sha256 = sha256hex(data);

  if (sha256 !== stamp.sha256) {
    return { valid: false, sha256, method: stamp.method, error: "hash_mismatch" };
  }

  if (stamp.method === "sha256_fallback" || !stamp.ots) {
    return { valid: true, sha256, method: "sha256_fallback" };
  }

  try {
    const OpenTimestamps = await import("javascript-opentimestamps").then(
      (m) => m.default ?? m
    );
    const detached = OpenTimestamps.DetachedTimestampFile.deserialize(
      Buffer.from(stamp.ots, "base64")
    );
    await OpenTimestamps.verify(detached);
    return { valid: true, sha256, method: "opentimestamps" };
  } catch (e) {
    return {
      valid: false,
      sha256,
      method: "opentimestamps",
      error: e instanceof Error ? e.message : "verify_failed",
    };
  }
}
