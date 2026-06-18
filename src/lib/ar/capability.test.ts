import { describe, it, expect } from "vitest";
import { detectARCapability, isMobileUA } from "./capability";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile";
const DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari";

describe("AR capability", () => {
  it("mobile + WebXR → mode webxr", () => {
    const cap = detectARCapability({ hasXR: true, hasCamera: true, userAgent: IPHONE });
    expect(cap).toMatchObject({ supported: true, mode: "webxr", isMobile: true });
  });

  it("mobile + caméra sans WebXR → mode camera", () => {
    const cap = detectARCapability({ hasXR: false, hasCamera: true, userAgent: ANDROID });
    expect(cap).toMatchObject({ supported: true, mode: "camera", isMobile: true });
  });

  it("desktop → non supporté avec raison (fallback gracieux)", () => {
    const cap = detectARCapability({ hasXR: false, hasCamera: true, userAgent: DESKTOP });
    expect(cap.supported).toBe(false);
    expect(cap.mode).toBe("unsupported");
    expect(cap.reason).toBeTruthy();
  });

  it("aucune caméra → non supporté quel que soit l'appareil", () => {
    expect(detectARCapability({ hasXR: true, hasCamera: false, userAgent: IPHONE }).supported).toBe(false);
  });

  it("isMobileUA distingue mobile et desktop", () => {
    expect(isMobileUA(IPHONE)).toBe(true);
    expect(isMobileUA(DESKTOP)).toBe(false);
  });
});
