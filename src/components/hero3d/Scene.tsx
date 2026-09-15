"use client";

import type { RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";
import { IdleGarment } from "./IdleGarment";

type SceneProps = {
  reducedMotion: boolean;
  onCreated?: () => void;
  groupRef: RefObject<THREE.Group | null>;
};

/**
 * Everything inside <Canvas>. `groupRef` is the outer scroll-driven group
 * that Hero3D.tsx's GSAP ScrollTrigger timeline animates directly
 * (position / rotation / scale) — see Hero3D.tsx for why it lives outside
 * the canvas. Passed as a plain prop rather than a forwarded ref: this
 * component is loaded through next/dynamic, and ref-forwarding through a
 * dynamic() boundary isn't guaranteed, so the ref is attached directly to
 * the <group> below instead.
 */
export function Scene({ reducedMotion, onCreated, groupRef }: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.1, 4.4], fov: 32 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={() => onCreated?.()}
    >
      {/* Key light: strong, directional, slightly cool — studio-photo main light */}
      <directionalLight
        position={[2.4, 3.2, 2.6]}
        intensity={2.4}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      {/* Fill light: soft, warm, opposite side — lifts shadow detail without flattening it */}
      <directionalLight position={[-2.8, 0.6, 1.2]} intensity={0.55} color="#e8d9c0" />
      {/* Rim light: thin cool edge highlight from behind, for separation from the dark bg */}
      <directionalLight position={[-0.6, 1.6, -3]} intensity={0.9} color="#cfe0ff" />
      <ambientLight intensity={0.08} />

      {/*
        Procedural studio environment (soft box "lightformers" instead of a
        fetched HDRI): identical look every render, no CDN round trip, and
        nothing to break if the deploy target ever restricts third-party
        asset domains. Swap for <Environment preset="studio" /> if a real
        HDRI is preferred later — nothing else here depends on which.
      */}
      <Environment resolution={256}>
        <Lightformer intensity={2} color="white" position={[0, 4, -4]} scale={[8, 2, 1]} />
        <Lightformer intensity={1} color="#d9d3c2" position={[-4, 1, 2]} scale={[4, 4, 1]} />
        <Lightformer intensity={0.6} color="#8ea2c9" position={[4, -1, 3]} scale={[4, 4, 1]} />
      </Environment>

      <group ref={groupRef}>
        <IdleGarment />
      </group>

      <ContactShadows
        position={[0, -1.02, 0]}
        opacity={0.55}
        scale={6}
        blur={2.6}
        far={2}
        color="#000000"
      />

      {!reducedMotion && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.45}
            luminanceThreshold={0.65}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
          <ChromaticAberration offset={[0.0002, 0.00015]} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
