import * as THREE from 'three';
import { GLOBE_RADIUS, lonLatToVector3 } from './geo.js';

const MARKER_ICONS = {
  fish: '🐟',
  boat: '⛵',
  village: '🏘',
  stop: '📍'
};

const iconTextureCache = new Map();

function getIconTexture(type) {
  if (iconTextureCache.has(type)) return iconTextureCache.get(type);

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.font = `${size * 0.8}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(MARKER_ICONS[type] ?? '📍', size / 2, size / 2 + size * 0.05);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  iconTextureCache.set(type, texture);
  return texture;
}

/**
 * Builds one THREE.Group per marker type so each layer (fish/boats/villages/stops)
 * can be toggled independently by simply flipping group.visible.
 */
export function buildMarkerLayers(markerList) {
  const layers = {};
  for (const type of Object.keys(MARKER_ICONS)) {
    const group = new THREE.Group();
    group.name = `markers-${type}`;
    layers[type] = group;
  }

  for (const marker of markerList) {
    const group = layers[marker.type];
    if (!group) continue;

    const material = new THREE.SpriteMaterial({
      map: getIconTexture(marker.type),
      transparent: true,
      depthTest: true
    });
    const sprite = new THREE.Sprite(material);
    const pos = lonLatToVector3(marker.lon, marker.lat, GLOBE_RADIUS * 1.03);
    sprite.position.copy(pos);
    sprite.scale.set(0.35, 0.35, 0.35);
    sprite.userData = { marker };
    group.add(sprite);
  }

  return layers;
}
