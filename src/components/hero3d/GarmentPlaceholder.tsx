"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Decal, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * Stand-in for the real Arc tee.
 *
 * ------------------------------------------------------------------
 * TODO(3D model): once a real scan/model of the ARC tee exists, replace
 * public/models/tshirt.glb with it (re-tune MODEL_SCALE — the real scan's
 * units almost certainly won't match this placeholder's). Keep the outer
 * <group> wrapper in IdleGarment.tsx / Hero3D.tsx as-is: the idle rotation,
 * pointer-tilt and GSAP scroll timeline all animate that group's
 * transform, not this mesh's geometry, so they don't care what's inside.
 * ------------------------------------------------------------------
 *
 * The mesh itself (public/models/tshirt.glb) is a free,
 * MIT-licensed t-shirt model ("shirt_baked.glb") used across many
 * open-source three.js/R3F tutorial projects — see
 * https://github.com/sanidhyy/3d-website (LICENSE.md, MIT). Swapped in for
 * an earlier hand-built low-poly placeholder that read as "robotic" rather
 * than fabric; this one has real sculpted folds and a baked cloth normal
 * map, which the low-poly version couldn't fake. Recolored to Arc's Blanc
 * and decaled with the real embroidered logo below — nothing about its
 * own baked-in look is Arc-branded.
 */

const MODEL_PATH = "/models/tshirt.glb";
// The source mesh is ~0.5 units tall; scaled up to match this scene's
// existing camera framing (tuned to fill the hero the same way the old
// placeholder did).
const MODEL_SCALE = 3.4;
// Slightly larger duplicate of the same geometry, rendered as black lines
// behind the solid mesh — this is the "technical pattern" wireframe stage
// of the scroll sequence. The offset scale keeps the lines from z-fighting
// with the solid surface once it fades in on top of them.
const WIREFRAME_SCALE = MODEL_SCALE * 1.004;

function useSourceMesh(): THREE.Mesh | null {
  const gltf = useGLTF(MODEL_PATH);
  return useMemo<THREE.Mesh | null>(() => {
    let found: THREE.Mesh | null = null;
    gltf.scene.traverse((obj) => {
      if (!found && (obj as THREE.Mesh).isMesh) found = obj as THREE.Mesh;
    });
    return found;
  }, [gltf]);
}

type GarmentPlaceholderProps = {
  /** Starting fill color, driven by the scroll sequence's colorway settings. */
  initialColor: string;
  /** Handed up so Hero3D's GSAP timeline can tween the fill (opacity + colorway) directly. */
  materialRef: RefObject<THREE.MeshPhysicalMaterial | null>;
  /** Handed up so Hero3D's GSAP timeline can fade the technical-pattern overlay out. */
  wireframeRef: RefObject<THREE.MeshBasicMaterial | null>;
  /**
   * Fired once this component has actually mounted its meshes (so
   * materialRef/wireframeRef are populated). `useGLTF`/`useTexture` suspend
   * the whole subtree while loading, so Canvas's own `onCreated` fires too
   * early — it only means the WebGL context exists, not that the garment
   * (behind Suspense) has rendered yet.
   */
  onReady: () => void;
};

export function GarmentPlaceholder({
  initialColor,
  materialRef,
  wireframeRef,
  onReady,
}: GarmentPlaceholderProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const sourceMesh = useSourceMesh();
  // Real embroidered "ARC" logo, isolated from the actual product photo
  // (see scripts/extract-logo-decal.py) — not a placeholder graphic.
  const logoTexture = useTexture("/hero3d/arc-logo-decal.png");

  const sourceMaterial = sourceMesh?.material as THREE.MeshStandardMaterial | undefined;

  // Faint self-rotation independent of the idle/pointer tilt applied to
  // the parent group in Hero3D.tsx — reads as fabric settling, not a
  // product turntable.
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z += delta * 0.015;
  });

  useEffect(() => {
    if (sourceMesh) onReady();
  }, [sourceMesh, onReady]);

  if (!sourceMesh) return null;

  return (
    <>
      {/* Technical-pattern wireframe: same geometry, fractionally larger so
         its lines read just outside the solid surface. Starts fully opaque
         and is faded out by the timeline's "reveal" stage. */}
      <mesh geometry={sourceMesh.geometry} scale={WIREFRAME_SCALE} position={[0, -0.05, 0]}>
        <meshBasicMaterial
          ref={wireframeRef}
          color={initialColor}
          wireframe
          transparent
          opacity={1}
          // Without this, the overlay keeps writing to the depth buffer even
          // as it fades toward invisible, so it fights the solid mesh behind
          // it for concave areas (shoulders, spine seam) and leaves visible
          // line fragments long after the fade should be complete.
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={meshRef}
        geometry={sourceMesh.geometry}
        scale={MODEL_SCALE}
        position={[0, -0.05, 0]}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          ref={materialRef}
          color={initialColor}
          transparent
          opacity={0}
          roughness={0.86}
          metalness={0.01}
          // The baked cloth normal map from the source model — this is what
          // actually reads as woven fabric under the key light rather than
          // smooth plastic.
          normalMap={sourceMaterial?.normalMap ?? null}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          sheen={0.5}
          sheenRoughness={0.75}
          sheenColor="#ffffff"
          clearcoat={0.02}
          clearcoatRoughness={0.9}
        />
        {/* Right-chest placement, matching the real garment photography. */}
        <Decal
          position={[0.075, 0.14, 0.115]}
          rotation={[0, 0, 0]}
          scale={0.09}
          map={logoTexture}
          polygonOffsetFactor={-4}
        />
      </mesh>
    </>
  );
}

useGLTF.preload(MODEL_PATH);
