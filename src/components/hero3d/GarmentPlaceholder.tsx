"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Decal, useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * Stand-in for the real Arc tee.
 *
 * ------------------------------------------------------------------
 * TODO(3D model): once a real scan/model of the t-shirt exists, delete
 * this component and replace <GarmentPlaceholder /> in Scene.tsx with:
 *
 *   const { scene } = useGLTF('/models/arc-tee.glb'); // Draco-compressed
 *   <primitive object={scene} />
 *
 * Keep the forwardRef + the outer <group> wrapper so the idle rotation,
 * pointer-tilt and GSAP scroll timeline in Hero3D.tsx keep working
 * unchanged — they all animate the group's transform, not the mesh
 * geometry, so they don't care what's inside it.
 * ------------------------------------------------------------------
 *
 * Until then: a t-shirt silhouette extruded from a 2D outline, with a
 * gentle per-vertex fold displacement and a cloth-oriented PBR material
 * (high roughness + sheen) so it reads as fabric rather than plastic.
 */

function buildTeeShape() {
  const shape = new THREE.Shape();
  // Front-view t-shirt outline matching the real Arc tee's proportions:
  // dropped shoulders, boxy (not tapered) body, straight hem — an
  // "oversize / streetwear" cut, not a fitted tee.
  shape.moveTo(-0.55, 0.9);
  shape.lineTo(-0.22, 0.9);
  // Crew-neck collar: control point dips below the shoulder line so the
  // curve reads as a rounded neckline, not a peak.
  shape.quadraticCurveTo(0, 0.7, 0.22, 0.9);
  shape.lineTo(0.55, 0.9);
  shape.lineTo(1.05, 0.5);
  shape.lineTo(0.72, 0.28);
  shape.lineTo(0.6, 0.5);
  shape.lineTo(0.6, -0.95);
  shape.lineTo(-0.6, -0.95);
  shape.lineTo(-0.6, 0.5);
  shape.lineTo(-0.72, 0.28);
  shape.lineTo(-1.05, 0.5);
  shape.closePath();
  return shape;
}

function useFoldedGarmentGeometry() {
  return useMemo(() => {
    const shape = buildTeeShape();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      // Kept thicker than a real tee on purpose: a near-flat extrusion
      // reduces to an almost invisible sliver at edge-on rotation angles,
      // which looked broken mid-scroll. TODO(3D model): a real scan won't
      // have this problem, so this depth is placeholder-only tuning.
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 4,
      curveSegments: 24,
    });
    geometry.center();

    // Gentle static "fold" displacement so the surface reads as draped
    // fabric instead of a flat extrusion — cheap (baked once, not per
    // frame) and independent of the idle/scroll animation below.
    const position = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);
      const fold =
        Math.sin(vertex.y * 3.2 + vertex.x * 1.6) * 0.035 +
        Math.sin(vertex.x * 5.1) * 0.015;
      vertex.z += fold;
      position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geometry.computeVertexNormals();

    return geometry;
  }, []);
}

// Real Arc colorways (kept in sync with src/data/products.ts by hand since
// this placeholder can't import client product data into a texture-free
// material the way the product cards do). Blanc by default: it's the
// lead colorway in the real photography and reads best under the
// dramatic studio lighting (visible fold shadow on light fabric).
const GARMENT_COLOR = "#f3f1ea";

export function GarmentPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useFoldedGarmentGeometry();
  // Real embroidered "ARC" logo, isolated from the actual product photo
  // (see scripts/extract-logo-decal.py) — not a placeholder graphic.
  const logoTexture = useTexture("/hero3d/arc-logo-decal.png");

  // Faint self-rotation independent of the idle/pointer tilt applied to
  // the parent group in Hero3D.tsx — reads as fabric settling, not a
  // product turntable.
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.z += delta * 0.02;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color={GARMENT_COLOR}
        roughness={0.82}
        metalness={0.01}
        sheen={0.6}
        sheenRoughness={0.7}
        sheenColor="#ffffff"
        clearcoat={0.03}
        clearcoatRoughness={0.9}
      />
      {/* Right-chest placement, matching the real garment photography.
         No `mesh` prop: nested inside the target <mesh>, Decal picks up
         its geometry from context. */}
      <Decal
        position={[0.22, -0.05, 0.17]}
        rotation={[0, 0, 0]}
        scale={0.13}
        map={logoTexture}
        polygonOffsetFactor={-4}
      />
    </mesh>
  );
}
