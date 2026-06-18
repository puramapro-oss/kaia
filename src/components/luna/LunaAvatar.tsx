"use client";

import { useEffect, useState } from "react";

interface LunaAvatarProps {
  state: "idle" | "listening" | "speaking";
}

export default function LunaAvatar({ state }: LunaAvatarProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (state === "idle") {
      // Slow breathing pulse
      const interval = setInterval(() => {
        setScale((prev) => (prev === 1 ? 1.05 : 1));
      }, 2000);
      return () => clearInterval(interval);
    } else if (state === "listening") {
      // Faster pulse
      const interval = setInterval(() => {
        setScale((prev) => (prev === 1 ? 1.08 : 1));
      }, 800);
      return () => clearInterval(interval);
    } else {
      // Speaking: continuous animation
      setScale(1.03);
    }
  }, [state]);

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      {/* Outer ring (appears on listening/speaking) */}
      {state !== "idle" && (
        <div
          className="absolute inset-0 rounded-full border-2 border-kaia-moon/40 animate-ping"
          style={{ animationDuration: state === "listening" ? "1.5s" : "1s" }}
        />
      )}

      {/* Main moon circle */}
      <div
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-kaia-moon to-[#D8C9FF]
                   flex items-center justify-center transition-transform duration-500
                   shadow-[0_0_40px_rgba(200,185,240,0.5)]"
        style={{ transform: `scale(${scale})` }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-kaia-moon/20 blur-xl" />

        {/* Moon symbol */}
        <span className="text-3xl relative z-10">🌙</span>

        {/* Wave animation (speaking only) */}
        {state === "speaking" && (
          <>
            <div
              className="absolute inset-0 rounded-full border-2 border-kaia-moon/60 animate-ping"
              style={{ animationDuration: "1.2s" }}
            />
            <div
              className="absolute inset-0 rounded-full border-2 border-kaia-moon/40 animate-ping"
              style={{ animationDuration: "1.6s", animationDelay: "0.3s" }}
            />
          </>
        )}
      </div>
    </div>
  );
}
