import * as THREE from 'three';

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Smoothly flies the camera to a new position/target over `duration` ms,
 * disabling OrbitControls while the animation runs so user input can't fight it.
 * Returns a Promise that resolves once the animation finishes.
 */
export function flyTo(camera, controls, { position, target, duration = 1400 }) {
  return new Promise((resolve) => {
    controls.enabled = false;

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPos = position.clone();
    const endTarget = target.clone();

    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(t);

      camera.position.lerpVectors(startPos, endPos, eased);
      controls.target.lerpVectors(startTarget, endTarget, eased);
      controls.update();

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        controls.enabled = true;
        resolve();
      }
    }

    requestAnimationFrame(step);
  });
}
