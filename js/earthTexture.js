import * as THREE from 'three';

// Very simplified continent outlines (lon/lat degrees), just enough to give the
// globe a recognisable, calm "ocean world" look without needing an external image asset.
const CONTINENTS = [
  // North America
  [[-165,68],[-140,70],[-95,72],[-75,62],[-65,50],[-70,42],[-80,32],[-97,20],
   [-105,20],[-115,30],[-125,40],[-124,48],[-130,55],[-155,60],[-165,68]],
  // Greenland
  [[-55,60],[-35,60],[-20,70],[-30,83],[-55,82],[-58,70],[-55,60]],
  // South America
  [[-80,10],[-77,-2],[-70,-18],[-71,-35],[-73,-50],[-68,-55],[-62,-52],
   [-58,-38],[-48,-25],[-35,-8],[-50,5],[-62,10],[-80,10]],
  // Europe
  [[-9,43],[-2,37],[8,44],[13,46],[18,54],[28,55],[30,60],[24,65],
   [12,66],[5,60],[-2,50],[-9,50],[-9,43]],
  // Africa
  [[-17,15],[-5,5],[9,4],[12,-6],[13,-18],[18,-34],[28,-33],[33,-25],
   [40,-2],[42,11],[48,12],[43,18],[35,30],[25,32],[10,37],[-6,35],
   [-17,26],[-17,15]],
  // Asia
  [[28,55],[45,45],[50,40],[60,42],[70,40],[78,35],[88,28],[97,28],
   [105,20],[110,18],[120,25],[130,35],[140,45],[160,60],[170,68],
   [140,73],[100,77],[70,72],[55,68],[45,66],[30,60],[28,55]],
  // Southeast Asia / Indonesia (loose blob)
  [[95,20],[105,10],[118,5],[130,0],[140,5],[130,10],[115,15],[102,17],[95,20]],
  // Australia
  [[113,-22],[122,-18],[135,-12],[145,-16],[153,-27],[150,-38],[140,-38],
   [130,-32],[115,-33],[113,-22]],
  // Antarctica (band)
  [[-180,-90],[-90,-90],[0,-90],[90,-90],[180,-90],[180,-63],[90,-65],
   [0,-66],[-90,-64],[-180,-63],[-180,-90]]
];

function lonLatToPixel(lon, lat, w, h) {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return [x, y];
}

/** Builds a calm, procedurally generated equirectangular Earth-like texture. */
export function createEarthTexture({ width = 2048, height = 1024 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const ocean = ctx.createLinearGradient(0, 0, 0, height);
  ocean.addColorStop(0, '#0b3d59');
  ocean.addColorStop(0.5, '#0e5c82');
  ocean.addColorStop(1, '#0b3d59');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#3c7a4e';
  ctx.strokeStyle = '#2e5f3d';
  ctx.lineWidth = 2;

  for (const ring of CONTINENTS) {
    ctx.beginPath();
    ring.forEach(([lon, lat], i) => {
      const [x, y] = lonLatToPixel(lon, lat, width, height);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
