"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GarmentPlaceholder } from "./GarmentPlaceholder";

const IDLE_SPIN_SPEED = 0.06; // rad/s, slow constant turntable
const POINTER_TILT_RANGE = 0.16; // rad, max tilt toward the pointer
const POINTER_DAMPING = 3.2; // higher = snappier lerp toward the pointer

type IdleGarmentProps = {
  /** False while the scroll sequence owns rotation precisely (front/profile/back
     framing) — the idle spin + pointer tilt would otherwise fight it. */
  active: boolean;
  initialColor: string;
  materialRef: RefObject<THREE.MeshPhysicalMaterial | null>;
  wireframeRef: RefObject<THREE.MeshBasicMaterial | null>;
  onReady: () => void;
};

/**
 * The inner group: idle rotation + pointer-follow tilt, both damped
 * (lerp), running every frame independently of the outer scroll-driven
 * group in Hero3D.tsx. Split out so the scroll timeline (which owns the
 * outer group's position/rotation/scale) never fights this one — they
 * compose instead of overwriting each other.
 */
export function IdleGarment({
  active,
  initialColor,
  materialRef,
  wireframeRef,
  onReady,
}: IdleGarmentProps) {
  const innerRef = useRef<THREE.Group>(null);
  const spin = useRef(0);

  useFrame((state, delta) => {
    const group = innerRef.current;
    if (!group || !active) return;

    spin.current += delta * IDLE_SPIN_SPEED;

    // state.pointer.x/y are already normalized device coords in [-1, 1].
    const targetTiltY = state.pointer.x * POINTER_TILT_RANGE;
    const targetTiltX = -state.pointer.y * POINTER_TILT_RANGE * 0.6;

    const lerpFactor = 1 - Math.exp(-POINTER_DAMPING * delta);
    group.rotation.y = THREE.MathUtils.lerp(
      group.rotation.y,
      spin.current + targetTiltY,
      lerpFactor
    );
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetTiltX, lerpFactor);
  });

  return (
    <group ref={innerRef}>
      <GarmentPlaceholder
        initialColor={initialColor}
        materialRef={materialRef}
        wireframeRef={wireframeRef}
        onReady={onReady}
      />
    </group>
  );
}
