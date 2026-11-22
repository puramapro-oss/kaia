import { createHash } from "node:crypto";
import DetachedTimestampFile from "opentimestamps/src/detached-timestamp-file.js";
import Ops from "opentimestamps/src/ops.js";
import Context from "opentimestamps/src/context.js";
import Timestamp from "opentimestamps/src/timestamp.js";
import Notary from "opentimestamps/src/notary.js";
import { createOtsClient, type OtsLibrary } from "./ots-core.ts";

// Only official primitives are loaded. The legacy request transport is not used.
const client = createOtsClient({ DetachedTimestampFile, Ops, Context, Timestamp, Notary } as OtsLibrary);

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

/** The argument is already a SHA-256 digest: never hash it a second time. */
export async function stampHashHex(hash: string): Promise<string | null> {
  if (typeof hash !== "string" || !/^[a-fA-F0-9]{64}$/.test(hash)) return null;
  try {
    return await client.stampDigest(Buffer.from(hash, "hex"));
  } catch {
    return null;
  }
}

export async function stampData(data: string): Promise<StampResult> {
  const sha256 = sha256hex(data);
  const timestamp = Date.now();
  const ots = await stampHashHex(sha256);
  return ots
    ? { sha256, timestamp, ots, method: "opentimestamps" }
    : { sha256, timestamp, method: "sha256_fallback" };
}

export async function verifyStamp(data: string, stamp: StampResult): Promise<VerifyResult> {
  const sha256 = sha256hex(data);
  if (!stamp || !["opentimestamps", "sha256_fallback"].includes(stamp.method)) {
    return { valid: false, sha256, method: "sha256_fallback", error: "invalid_stamp" };
  }
  if (sha256 !== stamp.sha256) {
    return { valid: false, sha256, method: stamp.method, error: "hash_mismatch" };
  }
  // This result means content integrity only, never a trusted timestamp.
  if (stamp.method === "sha256_fallback") return { valid: true, sha256, method: "sha256_fallback" };
  if (!stamp.ots) return { valid: false, sha256, method: "opentimestamps", error: "OTS_INVALID_PROOF" };
  try {
    const result = await client.verifyDigest(Buffer.from(sha256, "hex"), stamp.ots, true);
    // A well-formed pending receipt is not a verified Bitcoin attestation.
    return result.bitcoin
      ? { valid: true, sha256, method: "opentimestamps" }
      : { valid: false, sha256, method: "opentimestamps", error: "OTS_PENDING" };
  } catch (error) {
    return {
      valid: false, sha256, method: "opentimestamps",
      error: error instanceof Error ? error.message : "OTS_VERIFICATION_FAILED",
    };
  }
}
