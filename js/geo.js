import * as THREE from 'three';

export const GLOBE_RADIUS = 5;

/**
 * Converts geographic longitude/latitude (degrees) to a position on a sphere.
 * Convention matches an equirectangular texture with u = (lon+180)/360, v = (90-lat)/180.
 */
export function lonLatToVector3(lon, lat, radius = GLOBE_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Rough centroid of a ring of [lon, lat] pairs (average of vertices, good enough for camera framing). */
export function ringCentroid(ring) {
  let lon = 0;
  let lat = 0;
  for (const [x, y] of ring) {
    lon += x;
    lat += y;
  }
  return { lon: lon / ring.length, lat: lat / ring.length };
}

/** Picks a representative lon/lat centroid for a GeoJSON Polygon/MultiPolygon feature. */
export function featureCentroid(geometry) {
  if (geometry.type === 'Polygon') {
    return ringCentroid(geometry.coordinates[0]);
  }
  if (geometry.type === 'MultiPolygon') {
    // Use the part with the most vertices in its outer ring as the representative part.
    let best = geometry.coordinates[0][0];
    for (const part of geometry.coordinates) {
      if (part[0].length > best.length) best = part[0];
    }
    return ringCentroid(best);
  }
  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}
