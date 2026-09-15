"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
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
  // Simplified front-view t-shirt outline, unit-ish scale, centered at origin.
  shape.moveTo(-0.55, 0.9);
  shape.lineTo(-0.22, 0.9);
  // Crew-neck collar: control point dips below the shoulder line so the
  // curve reads as a rounded neckline, not a peak.
  shape.quadraticCurveTo(0, 0.7, 0.22, 0.9);
  shape.lineTo(0.55, 0.9);
  shape.lineTo(0.95, 0.6);
  shape.lineTo(0.68, 0.38);
  shape.lineTo(0.6, 0.5);
  shape.lineTo(0.6, -0.95);
  shape.lineTo(-0.6, -0.95);
  shape.lineTo(-0.6, 0.5);
  shape.lineTo(-0.68, 0.38);
  shape.lineTo(-0.95, 0.6);
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

export function GarmentPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useFoldedGarmentGeometry();

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
        color="#151515"
        roughness={0.78}
        metalness={0.02}
        sheen={1}
        sheenRoughness={0.6}
        sheenColor="#8a8680"
        clearcoat={0.05}
        clearcoatRoughness={0.8}
      />
    </mesh>
  );
}
