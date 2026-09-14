import * as THREE from 'three';

const CLICK_DRAG_THRESHOLD = 5; // pixels

/**
 * Wires pointer events on the renderer's canvas to real 3D raycasting against
 * `pickables` (the sea meshes). Distinguishes a click from an orbit-drag by
 * measuring pointer movement between down/up, and reports hover/click via callbacks.
 */
export function setupInteraction(renderer, camera, pickables, { onHover, onLeave, onClick }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const domElement = renderer.domElement;

  let downPos = null;
  let hovered = null;

  function updatePointer(event) {
    const rect = domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pick() {
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(pickables, false);
    return intersects.length > 0 ? intersects[0].object : null;
  }

  domElement.addEventListener('pointermove', (event) => {
    updatePointer(event);
    const hit = pick();
    if (hit !== hovered) {
      if (hovered) onLeave(hovered);
      if (hit) onHover(hit);
      hovered = hit;
    }
  });

  domElement.addEventListener('pointerleave', () => {
    if (hovered) {
      onLeave(hovered);
      hovered = null;
    }
  });

  domElement.addEventListener('pointerdown', (event) => {
    downPos = { x: event.clientX, y: event.clientY };
  });

  domElement.addEventListener('pointerup', (event) => {
    if (!downPos) return;
    const dx = event.clientX - downPos.x;
    const dy = event.clientY - downPos.y;
    downPos = null;
    if (Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD) return; // was a drag/orbit, not a click

    updatePointer(event);
    const hit = pick();
    if (hit) onClick(hit);
  });
}
