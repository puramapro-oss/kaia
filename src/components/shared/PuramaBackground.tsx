'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const MeshGradient = dynamic(
  () => import('@paper-design/shaders-react').then((m) => m.MeshGradient),
  { ssr: false }
);

type Variant = 'default' | 'calm' | 'focus' | 'sleep' | 'ignite';

const VARIANTS: Record<Variant, { colors: string[]; speed: number; distortion: number; swirl: number }> = {
  default: {
    colors: ['#0d0d1a', '#1a0f2e', '#c8b9f0', '#e8c87a'],
    speed: 0.4,
    distortion: 0.35,
    swirl: 0.08,
  },
  calm: {
    colors: ['#0d0d1a', '#12102a', '#c8b9f0', '#f0b0c0'],
    speed: 0.25,
    distortion: 0.2,
    swirl: 0.05,
  },
  focus: {
    colors: ['#0d0d1a', '#0f1a2e', '#9bb0f0', '#c8b9f0'],
    speed: 0.5,
    distortion: 0.45,
    swirl: 0.12,
  },
  sleep: {
    colors: ['#050510', '#0a0820', '#7a6ab8', '#4a3d80'],
    speed: 0.15,
    distortion: 0.15,
    swirl: 0.03,
  },
  ignite: {
    colors: ['#1a0d0d', '#2e0f0f', '#f0b0c0', '#e8c87a'],
    speed: 0.7,
    distortion: 0.55,
    swirl: 0.15,
  },
};

interface PuramaBackgroundProps {
  variant?: Variant;
  opacity?: number;
}

export default function PuramaBackground({ variant = 'default', opacity = 1 }: PuramaBackgroundProps) {
  const [prefersReduced, setPrefersReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const config = VARIANTS[variant];

  return (
    <div
      aria-hidden="true"
      style={{ opacity }}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
    >
      {/* Static fallback — always visible (SSR + reduced motion) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 70% 10%, rgba(200,185,240,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 20% 90%, rgba(232,200,122,0.07) 0%, transparent 60%), #0d0d1a',
        }}
      />

      {/* Shader — client-only, hidden if reduced motion */}
      {mounted && !prefersReduced && (
        <MeshGradient
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          colors={config.colors}
          speed={config.speed}
          distortion={config.distortion}
          swirl={config.swirl}
          grainMixer={0.04}
          grainOverlay={0}
        />
      )}
    </div>
  );
}
