"use client";

import { Suspense, useEffect, type RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";
import { IdleGarment } from "./IdleGarment";

type SceneProps = {
  reducedMotion: boolean;
  onCreated?: () => void;
  /** Fired once the garment (behind Suspense) has actually mounted — see GarmentPlaceholder.tsx. */
  onGarmentReady: () => void;
  groupRef: RefObject<THREE.Group | null>;
  cameraRef: RefObject<THREE.PerspectiveCamera | null>;
  materialRef: RefObject<THREE.MeshPhysicalMaterial | null>;
  wireframeRef: RefObject<THREE.MeshBasicMaterial | null>;
  initialColor: string;
  idleActive: boolean;
};

/** Hands the R3F-managed camera up to Hero3D.tsx, same reasoning as `groupRef` below. */
function CameraHandle({ cameraRef }: { cameraRef: RefObject<THREE.PerspectiveCamera | null> }) {
  const { camera } = useThree();
  useEffect(() => {
    cameraRef.current = camera as THREE.PerspectiveCamera;
    return () => {
      cameraRef.current = null;
    };
  }, [camera, cameraRef]);
  return null;
}

/**
 * Everything inside <Canvas>. `groupRef` is the outer scroll-driven group
 * that Hero3D.tsx's GSAP ScrollTrigger timeline animates directly
 * (position / rotation / scale) — see Hero3D.tsx for why it lives outside
 * the canvas. Passed as a plain prop rather than a forwarded ref: this
 * component is loaded through next/dynamic, and ref-forwarding through a
 * dynamic() boundary isn't guaranteed, so the ref is attached directly to
 * the <group> below instead. `cameraRef`, `materialRef` and `wireframeRef`
 * follow the same pattern for the timeline's zoom and colorway stages.
 */
export function Scene({
  reducedMotion,
  onCreated,
  onGarmentReady,
  groupRef,
  cameraRef,
  materialRef,
  wireframeRef,
  initialColor,
  idleActive,
}: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.1, 4.4], fov: 32 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={() => onCreated?.()}
    >
      <CameraHandle cameraRef={cameraRef} />
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

      {/* The group itself stays outside Suspense so `groupRef` is attached
         the moment Scene mounts — Hero3D.tsx's GSAP effect reads it as soon
         as `onCreated` fires and has no retry if it's still null then.
         Only the actual garment (GarmentPlaceholder's useTexture, for the
         logo decal, suspends while its image loads) is inside Suspense:
         Canvas doesn't wrap children in one itself, so without this the
         tree could throw or render blank depending on load timing instead
         of just waiting. */}
      <group ref={groupRef}>
        <Suspense fallback={null}>
          <IdleGarment
            active={idleActive}
            initialColor={initialColor}
            materialRef={materialRef}
            wireframeRef={wireframeRef}
            onReady={onGarmentReady}
          />
        </Suspense>
      </group>

      {/* "Ombre légère au sol" — a soft, understated contact shadow rather
         than a heavy studio drop shadow. */}
      <ContactShadows
        position={[0, -1.02, 0]}
        opacity={0.32}
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
