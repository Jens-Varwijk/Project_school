# Oceaanweb

Een interactieve 3D-webapp waarop zeeën en oceanen als aanklikbare gebieden op
een draaibare wereldbol staan. Volledig statisch: geen backend, geen
database, geen build-stap en geen API-key nodig.

## Bekijken

Open `index.html` via een lokale webserver (nodig omdat de app `fetch()`
gebruikt om de JSON/GeoJSON-databestanden te laden, wat niet werkt via
`file://`):

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Of gebruik de "Live Server"-extensie van je editor.

## Publiceren via GitHub Pages

1. Push deze repository naar GitHub.
2. Ga naar **Settings → Pages**.
3. Kies bij **Source**: `Deploy from a branch`.
4. Kies de branch (bv. `main`) en map `/ (root)`.
5. Sla op. De site is na enkele minuten bereikbaar op
   `https://<gebruikersnaam>.github.io/<repository-naam>/`.

Alle assetpaden in dit project zijn relatief (`./css/...`, `./js/...`,
`./data/...`), dus de site werkt zowel op een root-domein als op een
GitHub Pages projectpad.

## Architectuur

```
index.html          Layout: sidebar + globe-canvas + infopaneel
css/style.css        Volledig responsive styling (desktop + mobiel)
data/seas.geojson    Geografische polygonen van 8 zeeën/oceanen (stabiele "id" per feature)
data/content.json    Inhoudelijke data per zee-id (oppervlakte, diepte, landen, vissoorten, beschrijving)
data/markers.json    Generiek marker-datamodel (fish/boat/village/stop) gekoppeld via seaId
js/geo.js            lon/lat ↔ 3D bol-conversie + centroid-berekening
js/earthTexture.js   Procedureel gegenereerde oceaan/continent-textuur (canvas, geen externe afbeelding nodig)
js/scene.js          Three.js scene/camera/renderer/OrbitControls, resize t.o.v. het globe-gebied
js/seaLayer.js       Bouwt raycastbare meshes + randlijnen per zee-feature (incl. MultiPolygon)
js/markers.js        Bouwt per marker-type een aparte, onafhankelijk te togglen THREE.Group
js/interaction.js    Echte 3D-raycasting voor hover/klik, met drag-vs-klik-detectie
js/cameraRig.js      Vloeiende easing-camera-animatie ("fly to") naar een geselecteerd gebied
js/ui.js             Sidebar: zoeken, filteren, kaartlagen-toggles, infopaneel
js/main.js           Orchestratie: laadt data, bouwt scene/lagen, verbindt UI aan de 3D-wereld
js/vendor/three/     Lokaal meegeleverde Three.js r160 (module + OrbitControls + BufferGeometryUtils)
```

### Nieuwe zeeën toevoegen

De architectuur is data-driven: voeg een feature toe aan `data/seas.geojson`
(met een uniek `properties.id`) en een bijbehorend object in
`data/content.json` met dezelfde id. De globe- en UI-logica hoeven niet te
worden aangepast — nieuwe zeeën verschijnen automatisch als aanklikbare
gebieden, in de zoekresultaten en in de filters.

### Markers toevoegen

Voeg een object toe aan `data/markers.json`:

```json
{ "id": "marker-030", "type": "fish", "name": "Zalm", "seaId": "north-sea", "lat": 57.0, "lon": 2.0 }
```

`type` moet een van `fish`, `boat`, `village`, `stop` zijn — dit bepaalt in
welke togglebare laag de marker verschijnt.

## Besturing

- **Slepen** (muis of touch): globe draaien
- **Scrollen / pinchen**: in- en uitzoomen
- **Klikken/tikken op een zee of oceaan**: selecteert het gebied, animeert de
  camera ernaartoe en opent het informatiepaneel
- **Zoekveld**: zoekt live op naam, vissoort en aangrenzend land/continent
- **Filters**: type, oppervlakte en diepteklasse, direct toegepast zonder
  submit-knop
- **Kaartlagen**: vier onafhankelijke toggles voor 🐟 vissen, ⛵ boten,
  🏘 dorpen en 📍 haltes
