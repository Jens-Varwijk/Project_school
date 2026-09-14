const DEPTH_ORDER = { ondiep: 0, gemiddeld: 1, diep: 2 };

function matchesQuery(sea, info, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  if (sea.name.toLowerCase().includes(q)) return true;
  if (info.adjacentCountries.some((c) => c.toLowerCase().includes(q))) return true;
  if (info.fishSpecies.some((f) => f.toLowerCase().includes(q))) return true;
  return false;
}

/**
 * Wires all sidebar DOM interactions (search, filters, layer toggles, info panel)
 * against the data-driven sea/content/marker-layer collections passed in.
 * Nothing here is aware of Three.js internals beyond the callbacks it is given.
 */
export function initUI({ seas, content, markerLayers, onSelectSea, onFilterChange }) {
  const searchInput = document.getElementById('search-input');
  const kindCheckboxes = Array.from(document.querySelectorAll('.filter-kind'));
  const areaMin = document.getElementById('area-min');
  const areaMax = document.getElementById('area-max');
  const depthClassSelect = document.getElementById('depth-class');
  const resultsEl = document.getElementById('search-results');

  const infoPanel = document.getElementById('info-panel');
  const infoClose = document.getElementById('info-close');
  const infoTitle = document.getElementById('info-title');
  const infoKind = document.getElementById('info-kind');
  const infoDesc = document.getElementById('info-desc');
  const infoStats = document.getElementById('info-stats');
  const infoCountries = document.getElementById('info-countries');
  const infoFish = document.getElementById('info-fish');

  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');

  function currentFilters() {
    const kinds = kindCheckboxes.filter((cb) => cb.checked).map((cb) => cb.value);
    return {
      query: searchInput.value.trim(),
      kinds,
      areaMin: areaMin.value ? Number(areaMin.value) : null,
      areaMax: areaMax.value ? Number(areaMax.value) : null,
      depthClass: depthClassSelect.value
    };
  }

  function seaMatchesFilters(sea, filters) {
    const info = content[sea.id];
    if (!filters.kinds.includes(sea.kind)) return false;
    if (filters.areaMin !== null && info.areaKm2 < filters.areaMin) return false;
    if (filters.areaMax !== null && info.areaKm2 > filters.areaMax) return false;
    if (filters.depthClass && info.depthClass !== filters.depthClass) return false;
    if (!matchesQuery(sea, info, filters.query)) return false;
    return true;
  }

  function renderResults(matched) {
    resultsEl.innerHTML = '';
    if (matched.length === seas.length) {
      resultsEl.classList.add('hidden');
      return;
    }
    resultsEl.classList.remove('hidden');
    if (matched.length === 0) {
      const li = document.createElement('div');
      li.className = 'result-empty';
      li.textContent = 'Geen zeeën gevonden.';
      resultsEl.appendChild(li);
      return;
    }
    for (const sea of matched) {
      const item = document.createElement('button');
      item.className = 'result-item';
      item.type = 'button';
      item.textContent = `${sea.kind === 'ocean' ? '🌊' : '〰️'} ${sea.name}`;
      item.addEventListener('click', () => onSelectSea(sea.id));
      resultsEl.appendChild(item);
    }
  }

  function applyFilters() {
    const filters = currentFilters();
    const matched = seas.filter((sea) => seaMatchesFilters(sea, filters));
    const matchedIds = new Set(matched.map((s) => s.id));
    renderResults(matched);
    onFilterChange(matchedIds, filters.query.length > 0 || matched.length !== seas.length);
  }

  [searchInput, areaMin, areaMax].forEach((el) =>
    el.addEventListener('input', applyFilters)
  );
  [depthClassSelect, ...kindCheckboxes].forEach((el) =>
    el.addEventListener('change', applyFilters)
  );

  document.querySelectorAll('.layer-toggle').forEach((toggle) => {
    toggle.addEventListener('change', () => {
      const layer = markerLayers[toggle.dataset.layer];
      if (layer) layer.visible = toggle.checked;
    });
  });

  function showInfoPanel(seaId) {
    const sea = seas.find((s) => s.id === seaId);
    const info = content[seaId];
    if (!sea || !info) return;

    infoTitle.textContent = sea.name;
    infoKind.textContent = sea.kind === 'ocean' ? 'Oceaan' : 'Zee';
    infoDesc.textContent = info.description;

    infoStats.innerHTML = '';
    const stats = [
      ['Oppervlakte', `${info.areaKm2.toLocaleString('nl-NL')} km²`],
      ['Gemiddelde diepte', `${info.avgDepthM} m`],
      ['Maximale diepte', `${info.maxDepthM} m`],
      ['Diepteklasse', info.depthClass]
    ];
    for (const [label, value] of stats) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      infoStats.append(dt, dd);
    }

    infoCountries.innerHTML = '';
    info.adjacentCountries.forEach((c) => {
      const li = document.createElement('li');
      li.textContent = c;
      infoCountries.appendChild(li);
    });

    infoFish.innerHTML = '';
    info.fishSpecies.forEach((f) => {
      const li = document.createElement('li');
      li.textContent = f;
      infoFish.appendChild(li);
    });

    infoPanel.classList.remove('hidden');
  }

  function hideInfoPanel() {
    infoPanel.classList.add('hidden');
  }

  infoClose.addEventListener('click', hideInfoPanel);

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  return { showInfoPanel, hideInfoPanel, applyFilters };
}
