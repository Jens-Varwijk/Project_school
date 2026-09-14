import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLOBE_RADIUS, lonLatToVector3, featureCentroid } from './geo.js';

const SURFACE_OFFSET = GLOBE_RADIUS * 0.004;
const OUTLINE_OFFSET = GLOBE_RADIUS * 0.006;

const BASE_COLOR = new THREE.Color('#59c8ea');
const HOVER_COLOR = new THREE.Color('#a6ecff');
const SELECTED_COLOR = new THREE.Color('#ffb347');

function ringToShapePoints(ring) {
  // GeoJSON rings repeat the first point as the last point; drop the duplicate.
  const pts = ring.slice(0, -1);
  return pts.map(([lon, lat]) => new THREE.Vector2(lon, lat));
}

function polygonPartToGeometry(part) {
  const [outer, ...holes] = part;
  const shape = new THREE.Shape(ringToShapePoints(outer));
  for (const hole of holes) {
    shape.holes.push(new THREE.Path(ringToShapePoints(hole)));
  }
  const geometry = new THREE.ShapeGeometry(shape);

  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const lon = pos.getX(i);
    const lat = pos.getY(i);
    const v = lonLatToVector3(lon, lat, GLOBE_RADIUS + SURFACE_OFFSET);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.deleteAttribute('uv');
  geometry.deleteAttribute('normal');
  geometry.computeVertexNormals();
  return geometry;
}

function featureToGeometry(geometry) {
  const parts = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const geometries = parts.map(polygonPartToGeometry);
  return geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
}

/** Builds a bright outline (LineLoop per ring) so a region's boundary reads clearly against the ocean. */
function buildOutlines(geometry) {
  const parts = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const lines = [];
  for (const part of parts) {
    const outerRing = part[0];
    const points = outerRing.map(([lon, lat]) =>
      lonLatToVector3(lon, lat, GLOBE_RADIUS + OUTLINE_OFFSET)
    );
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: BASE_COLOR.clone(),
      transparent: true,
      opacity: 0.85
    });
    lines.push(new THREE.LineLoop(lineGeometry, lineMaterial));
  }
  return lines;
}

/**
 * Builds one raycastable Mesh per sea/ocean feature from a GeoJSON FeatureCollection.
 * Multi-part geometries (MultiPolygon) are merged into a single mesh per feature so
 * selection/hover state is handled uniformly regardless of how many parts a sea has.
 */
export function buildSeaLayer(featureCollection) {
  const group = new THREE.Group();
  group.name = 'sea-layer';

  const seas = [];

  for (const feature of featureCollection.features) {
    const { id, name, kind } = feature.properties;
    const geometry = featureToGeometry(feature.geometry);
    const material = new THREE.MeshBasicMaterial({
      color: BASE_COLOR.clone(),
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = 1;
    mesh.userData = { seaId: id, name, kind };
    group.add(mesh);

    const outlines = buildOutlines(feature.geometry);
    outlines.forEach((line) => group.add(line));
    mesh.userData.outlines = outlines;

    seas.push({
      id,
      name,
      kind,
      mesh,
      centroid: featureCentroid(feature.geometry)
    });
  }

  return { group, seas };
}

export function setSeaState(mesh, state) {
  const mat = mesh.material;
  let color = BASE_COLOR;
  let opacity = 0.45;
  let outlineOpacity = 0.85;

  if (state === 'selected') {
    color = SELECTED_COLOR;
    opacity = 0.75;
  } else if (state === 'hover') {
    color = HOVER_COLOR;
    opacity = 0.65;
  } else if (state === 'dimmed') {
    opacity = 0.08;
    outlineOpacity = 0.2;
  }

  mat.color.copy(color);
  mat.opacity = opacity;

  for (const line of mesh.userData.outlines ?? []) {
    line.material.color.copy(color);
    line.material.opacity = outlineOpacity;
  }
}
