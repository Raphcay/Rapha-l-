"use client";

import { useSyncExternalStore } from "react";

let cached: boolean | null = null;

function checkWebgl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

function getSnapshot(): boolean | null {
  if (cached === null) cached = checkWebgl();
  return cached;
}

function getServerSnapshot(): boolean | null {
  return null; // unknown until the client can probe a real <canvas>
}

function subscribe() {
  // The result never changes after the first check, so there's nothing to
  // subscribe to — useSyncExternalStore is used here purely to read a
  // browser-only value without the SSR/client mismatch (and the
  // set-state-in-effect lint error) a useState+useEffect pair would cause.
  return () => {};
}

// null = still checking (server render / very first client pass), then
// settles to true/false once the browser has been probed.
export function useWebglSupport(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
