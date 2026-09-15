"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Decal, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * Stand-in for the real Arc tee.
 *
 * ------------------------------------------------------------------
 * TODO(3D model): once a real scan/model of the ARC tee exists, delete
 * public/models/arc-tee-placeholder.glb and swap MODEL_PATH below to
 * point at it (re-tune MODEL_SCALE — the real scan's units almost
 * certainly won't match this placeholder's). Keep the outer <group>
 * wrapper in IdleGarment.tsx / Hero3D.tsx as-is: the idle rotation,
 * pointer-tilt and GSAP scroll timeline all animate that group's
 * transform, not this mesh's geometry, so they don't care what's inside.
 * ------------------------------------------------------------------
 *
 * The mesh itself (public/models/arc-tee-placeholder.glb) is a free,
 * MIT-licensed t-shirt model ("shirt_baked.glb") used across many
 * open-source three.js/R3F tutorial projects — see
 * https://github.com/sanidhyy/3d-website (LICENSE.md, MIT). Swapped in for
 * an earlier hand-built low-poly placeholder that read as "robotic" rather
 * than fabric; this one has real sculpted folds and a baked cloth normal
 * map, which the low-poly version couldn't fake. Recolored to Arc's Blanc
 * and decaled with the real embroidered logo below — nothing about its
 * own baked-in look is Arc-branded.
 */

const MODEL_PATH = "/models/arc-tee-placeholder.glb";
// The source mesh is ~0.5 units tall; scaled up to match this scene's
// existing camera framing (tuned to fill the hero the same way the old
// placeholder did).
const MODEL_SCALE = 3.4;
const GARMENT_COLOR = "#f3f1ea"; // Blanc, the lead colorway in the real photography

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

export function GarmentPlaceholder() {
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

  if (!sourceMesh) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={sourceMesh.geometry}
      scale={MODEL_SCALE}
      position={[0, -0.05, 0]}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={GARMENT_COLOR}
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
  );
}

useGLTF.preload(MODEL_PATH);
