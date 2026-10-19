// GSAP's ScrollTrigger pin (used by the homepage's 3D hero) wraps its
// trigger element in a "pin-spacer" div it inserts directly into the DOM,
// outside React's knowledge. When Next.js navigates away from the homepage,
// React unmounts that subtree at the same time GSAP's own cleanup is
// restructuring it — the two can race, and React ends up calling
// removeChild/insertBefore on a node whose actual parent no longer matches
// what React's reconciler expected. The browser throws a hard
// NotFoundError that isn't caught anywhere in the tree, which crashes the
// whole render and breaks navigation entirely (the page shows "This page
// couldn't load").
//
// The node in question is already gone from where React thinks it is, so
// the operation React was attempting is a no-op by the time it runs — the
// safe fix is to make these two DOM methods tolerate that instead of
// throwing. This is the standard workaround used across the GSAP/React
// ecosystem for exactly this class of bug (also common with
// react-beautiful-dnd and other libraries that mutate the DOM outside
// React's reconciler).
export function patchDomRemovalForThirdPartyDom() {
  if (typeof window === "undefined") return;
  const w = window as typeof window & { __domRemovalPatched?: boolean };
  if (w.__domRemovalPatched) return;
  w.__domRemovalPatched = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}
