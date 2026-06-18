"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createClient } from "@/lib/supabase/client";

const MAX_POINTS = 400;

/** Points répartis uniformément sur une sphère (spirale de Fibonacci). */
function fibonacciSphere(count: number, radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    points.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
  }
  return points;
}

function Globe({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  const points = useMemo(() => fibonacciSphere(Math.min(count, MAX_POINTS), 1.5), [count]);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.15;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1.48, 48, 48]} />
        <meshBasicMaterial color="#1A1530" transparent opacity={0.55} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.5, 24, 24]} />
        <meshBasicMaterial color="#C8B9F0" wireframe transparent opacity={0.12} />
      </mesh>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color={i % 5 === 0 ? "#E8C87A" : "#F0B0C0"} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Globe des participantes — chaque point est une présence. S'abonne au realtime
 * `core_participations` pour faire grandir le globe en direct.
 */
export default function ParticipantsGlobe({
  eventId,
  initialCount,
}: {
  eventId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`core-globe-${eventId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "kaia", table: "core_participations", filter: `event_id=eq.${eventId}` },
        () => setCount((c) => c + 1),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  return (
    <div className="glass rounded-2xl p-4 relative">
      <div className="h-64 w-full">
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]}>
          <Globe count={count} />
        </Canvas>
      </div>
      <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-[var(--foreground-muted)]">
        <span className="font-display text-lg gradient-kaia-text">{count}</span> présences sur Terre 🌍
      </p>
    </div>
  );
}
