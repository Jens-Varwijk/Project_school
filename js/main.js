import * as THREE from 'three';
import { createScene } from './scene.js';
import { buildSeaLayer, setSeaState } from './seaLayer.js';
import { buildMarkerLayers } from './markers.js';
import { setupInteraction } from './interaction.js';
import { flyTo } from './cameraRig.js';
import { initUI } from './ui.js';
import { lonLatToVector3 } from './geo.js';

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

async function main() {
  const [seasGeoJSON, content, markerList] = await Promise.all([
    loadJSON('./data/seas.geojson'),
    loadJSON('./data/content.json'),
    loadJSON('./data/markers.json')
  ]);

  const container = document.getElementById('globe-container');
  const { scene, camera, renderer, controls } = createScene(container);

  const { group: seaGroup, seas } = buildSeaLayer(seasGeoJSON);
  scene.add(seaGroup);
  const seaMeshes = seas.map((s) => s.mesh);
  const seaById = new Map(seas.map((s) => [s.id, s]));

  const markerLayers = buildMarkerLayers(markerList);
  Object.values(markerLayers).forEach((layer) => scene.add(layer));

  let selectedId = null;
  let isAnimating = false;
  let dimmedByFilter = false;

  function refreshSeaVisuals(hoveredMesh) {
    for (const sea of seas) {
      if (sea.id === selectedId) {
        setSeaState(sea.mesh, 'selected');
      } else if (sea.mesh === hoveredMesh) {
        setSeaState(sea.mesh, 'hover');
      } else if (dimmedByFilter && !sea.mesh.userData.filterMatch) {
        setSeaState(sea.mesh, 'dimmed');
      } else {
        setSeaState(sea.mesh, 'default');
      }
    }
  }

  setupInteraction(renderer, camera, seaMeshes, {
    onHover: (mesh) => {
      document.body.style.cursor = 'pointer';
      refreshSeaVisuals(mesh);
    },
    onLeave: () => {
      document.body.style.cursor = 'default';
      refreshSeaVisuals(null);
    },
    onClick: (mesh) => {
      if (isAnimating) return;
      selectSea(mesh.userData.seaId);
    }
  });

  async function selectSea(seaId) {
    const sea = seaById.get(seaId);
    if (!sea) return;

    selectedId = seaId;
    refreshSeaVisuals(null);
    ui.hideInfoPanel();

    const dir = lonLatToVector3(sea.centroid.lon, sea.centroid.lat, 1);
    const distance = sea.kind === 'ocean' ? 11 : 8.5;
    const endPosition = dir.multiplyScalar(distance);

    isAnimating = true;
    await flyTo(camera, controls, {
      position: endPosition,
      target: new THREE.Vector3(0, 0, 0),
      duration: 1500
    });
    isAnimating = false;

    ui.showInfoPanel(seaId);
  }

  const ui = initUI({
    seas,
    content,
    markerLayers,
    onSelectSea: (seaId) => selectSea(seaId),
    onFilterChange: (matchedIds, isFiltering) => {
      dimmedByFilter = isFiltering;
      for (const sea of seas) {
        sea.mesh.userData.filterMatch = matchedIds.has(sea.id);
      }
      refreshSeaVisuals(null);
    }
  });

  function animate() {
    requestAnimationFrame(animate);
    if (!isAnimating) controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

main().catch((err) => {
  console.error(err);
  const container = document.getElementById('globe-container');
  if (container) {
    container.innerHTML = `<p class="load-error">Kon Oceaanweb niet laden: ${err.message}</p>`;
  }
});
