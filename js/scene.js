import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLOBE_RADIUS } from './geo.js';
import { createEarthTexture } from './earthTexture.js';

/**
 * Sets up the Three.js scene, camera, renderer and controls inside `container`.
 * The renderer is sized to the container's own bounding box (not the window),
 * so the globe stays centered in the main content area next to the sidebar.
 */
export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#04101c');

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 13);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 7;
  controls.maxDistance = 22;
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 0.7;

  scene.add(new THREE.AmbientLight('#ffffff', 0.65));
  const sun = new THREE.DirectionalLight('#ffffff', 1.1);
  sun.position.set(6, 4, 8);
  scene.add(sun);

  const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96);
  const globeMaterial = new THREE.MeshPhongMaterial({
    map: createEarthTexture(),
    shininess: 12,
    specular: new THREE.Color('#1c3f52')
  });
  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  scene.add(globe);

  const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.035, 64, 64);
  const atmosphereMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: { glowColor: { value: new THREE.Color('#4fb8ff') } },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 glowColor;
      void main() {
        float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
        gl_FragColor = vec4(glowColor, intensity * 0.9);
      }
    `
  });
  scene.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

  function resize() {
    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight, false);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  return { scene, camera, renderer, controls, globe };
}
