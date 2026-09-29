/**
 * Distortion Lab UI for Phase 3
 * Interactive Tissot's Indicatrix renderer, Case (Tangent/Secant), Aspect controls,
 * and Azimuthal Perspective slider (Gnomonic -> Stereographic -> Satellite -> Orthographic).
 */
import * as d3Geo from 'd3-geo';
import * as d3GeoProjection from 'd3-geo-projection';
import type { GeoProjection } from 'd3-geo';
import { geoCircle } from 'd3-geo';
import type { Topology } from 'topojson-specification';
import * as topojson from 'topojson-client';
import { allProjections, getProjectionById } from '../shelf/catalog-loader';
import distortionConfigData from '../../data/distortion-lab.json';
import type { DistortionLabConfig, ProjectionEntry } from '../types';

const config = distortionConfigData as DistortionLabConfig;

let currentProjId = 'mercator';
let currentCase: 'tangent' | 'secant' = 'tangent';
let currentAspect = 'normal';
let azimuthalSliderValue = 1.0; // 0: Gnomonic, 0.33: Stereographic, 0.66: Satellite, 1.0: Orthographic
let cachedTopology: Topology | null = null;

async function getTopology(): Promise<Topology> {
  if (cachedTopology) return cachedTopology;
  const localUrl = `${import.meta.env.BASE_URL}world-110m.json`;
  try {
    const resp = await fetch(localUrl);
    if (resp.ok) {
      cachedTopology = (await resp.json()) as Topology;
      return cachedTopology;
    }
  } catch (e) {
    console.warn('Local topology fetch failed in Distortion Lab', e);
  }
  const cdnResp = await fetch(
    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
  );
  cachedTopology = (await cdnResp.json()) as Topology;
  return cachedTopology;
}

export function renderDistortionLab(container: HTMLElement): void {
  const proj = getProjectionById(currentProjId) ?? allProjections[0];

  container.innerHTML = `
    <div class="distortion-lab">
      <div class="lab-header">
        <div class="lab-title-area">
          <h2>🔬 The Distortion Lab</h2>
          <p class="lab-subtitle">
            Visualize metric deformation with <strong>Tissot's Indicatrix</strong>.
            True circles on the sphere deform into ellipses showing local scale and angular distortion.
          </p>
        </div>
        <div class="lab-proj-picker">
          <label for="lab-proj-select">Select Projection:</label>
          <select id="lab-proj-select" class="lab-select">
            ${allProjections
              .map(
                (p) => `
              <option value="${p.id}" ${p.id === proj.id ? 'selected' : ''}>
                ${p.name} (${p.familyName} · ${p.property})
              </option>
            `
              )
              .join('')}
          </select>
        </div>
      </div>

      <!-- Controls bar -->
      <div class="lab-controls-bar" id="lab-controls-bar">
        ${buildControlsHTML(proj)}
      </div>

      <!-- Map Display Area -->
      <div class="lab-stage">
        <div class="lab-map-container" id="lab-map">
          <div class="detail-map-loading">
            <span class="map-loading-icon">🔬</span>
            <span>Calculating Tissot deformation grid...</span>
          </div>
        </div>

        <!-- Sidebar / HUD -->
        <div class="lab-hud">
          <div class="hud-card">
            <h4 class="hud-title">📐 Tissot's Indicatrix Guide</h4>
            <div class="hud-item">
              <span class="hud-legend-circle hud-circle--circle"></span>
              <div>
                <strong>Circular Ellipse</strong>
                <p>No angular deformation (local shape preserved, conformal).</p>
              </div>
            </div>
            <div class="hud-item">
              <span class="hud-legend-circle hud-circle--sheared"></span>
              <div>
                <strong>Sheared / Flattened</strong>
                <p>Angular distortion. Bending of orthogonal coordinate lines.</p>
              </div>
            </div>
            <div class="hud-item">
              <span class="hud-legend-circle hud-circle--size"></span>
              <div>
                <strong>Equal Area</strong>
                <p>Ellipses maintain identical surface area across all latitudes.</p>
              </div>
            </div>
          </div>

          <div class="hud-card" id="distortion-inspector">
            <h4 class="hud-title">📊 Active Distortion Measures</h4>
            <div class="hud-metric">
              <span class="metric-label">Family</span>
              <span class="metric-val" id="metric-family">${proj.familyName}</span>
            </div>
            <div class="hud-metric">
              <span class="metric-label">Preserved</span>
              <span class="metric-val" id="metric-prop">${proj.property}</span>
            </div>
            <div class="hud-metric">
              <span class="metric-label">Case</span>
              <span class="metric-val" id="metric-case">${currentCase === 'tangent' ? 'Tangent (1 line)' : 'Secant (2 lines)'}</span>
            </div>
            <div class="hud-metric">
              <span class="metric-label">Grid Spacing</span>
              <span class="metric-val">15° lat × 15° lon</span>
            </div>
            <div class="hud-distortion-note">
              <strong>Cartographic Note:</strong>
              <p id="metric-note">${proj.distortionNote}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  bindLabEvents(container);
  updateLabMap();
}

function buildControlsHTML(proj: ProjectionEntry): string {
  if (proj.familyId === 'azimuthal') {
    // Azimuthal perspective slider
    const stops = config.azimuthalPerspectiveType;
    return `
      <div class="azimuthal-slider-panel">
        <div class="slider-header">
          <span class="slider-label">🔭 Continuous Viewpoint Distance (Globe ➔ Flat Unwrap):</span>
          <span class="slider-current-stop" id="current-perspective-label">Orthographic (Globe View)</span>
        </div>
        <div class="slider-track-wrap">
          <input
            type="range"
            id="azimuthal-slider"
            min="0"
            max="1"
            step="0.01"
            value="${azimuthalSliderValue}"
            class="azimuthal-range"
          />
          <div class="slider-stops">
            ${stops
              .map(
                (s) => `
              <span class="slider-stop-mark" style="left: ${s.position * 100}%" title="${s.viewpoint}">
                <span class="stop-dot"></span>
                <span class="stop-text">${s.name}</span>
              </span>
            `
              )
              .join('')}
          </div>
        </div>
        <p class="slider-explanation" id="slider-explanation">
          Infinite perspective from deep space. Only the center point is distortion-free; edges compress into limb.
        </p>
      </div>
    `;
  }

  // Non-Azimuthal controls: Case (Tangent/Secant) and Aspect
  const aspects = config.aspectByFamily[proj.familyId] ?? config.aspectByFamily.cylindrical;

  return `
    <div class="case-aspect-panel">
      <!-- Case Control -->
      <div class="control-group">
        <span class="control-label">Surface Case:</span>
        <div class="btn-group" id="case-btn-group">
          <button type="button" class="ctrl-btn ${currentCase === 'tangent' ? 'ctrl-btn--active' : ''}" data-case="tangent">
            Tangent (1 standard line)
          </button>
          <button type="button" class="ctrl-btn ${currentCase === 'secant' ? 'ctrl-btn--active' : ''}" data-case="secant">
            Secant (2 standard lines)
          </button>
        </div>
      </div>

      <!-- Aspect Control -->
      <div class="control-group">
        <span class="control-label">Aspect:</span>
        <div class="btn-group" id="aspect-btn-group">
          ${aspects
            .map(
              (asp) => `
            <button type="button" class="ctrl-btn ${currentAspect === asp.id ? 'ctrl-btn--active' : ''}" data-aspect="${asp.id}">
              ${asp.label}
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}

function bindLabEvents(container: HTMLElement): void {
  // Projection selector
  const projSelect = container.querySelector<HTMLSelectElement>('#lab-proj-select');
  projSelect?.addEventListener('change', () => {
    currentProjId = projSelect.value;
    const proj = getProjectionById(currentProjId)!;
    // Reset defaults for family
    currentAspect = 'normal';
    currentCase = 'tangent';
    if (proj.familyId === 'azimuthal') azimuthalSliderValue = 1.0;

    // Refresh controls bar and map
    const controlsBar = container.querySelector('#lab-controls-bar');
    if (controlsBar) controlsBar.innerHTML = buildControlsHTML(proj);

    bindLabEvents(container);
    updateLabMap();
  });

  // Case toggle
  container.querySelectorAll<HTMLButtonElement>('#case-btn-group .ctrl-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#case-btn-group .ctrl-btn').forEach((b) => b.classList.remove('ctrl-btn--active'));
      btn.classList.add('ctrl-btn--active');
      currentCase = btn.dataset.case as 'tangent' | 'secant';
      updateLabMap();
    });
  });

  // Aspect toggle
  container.querySelectorAll<HTMLButtonElement>('#aspect-btn-group .ctrl-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#aspect-btn-group .ctrl-btn').forEach((b) => b.classList.remove('ctrl-btn--active'));
      btn.classList.add('ctrl-btn--active');
      currentAspect = btn.dataset.aspect!;
      updateLabMap();
    });
  });

  // Azimuthal slider
  const slider = container.querySelector<HTMLInputElement>('#azimuthal-slider');
  slider?.addEventListener('input', () => {
    azimuthalSliderValue = parseFloat(slider.value);
    updateAzimuthalLabel();
    updateLabMap();
  });
}

function updateAzimuthalLabel(): void {
  const labelEl = document.getElementById('current-perspective-label');
  const expEl = document.getElementById('slider-explanation');
  if (!labelEl || !expEl) return;

  const stops = config.azimuthalPerspectiveType;
  let activeStop = stops[0];
  let minDiff = 999;
  for (const s of stops) {
    const diff = Math.abs(s.position - azimuthalSliderValue);
    if (diff < minDiff) {
      minDiff = diff;
      activeStop = s;
    }
  }

  labelEl.textContent = `${activeStop.name} (${activeStop.viewpoint})`;
  expEl.textContent = activeStop.property;
}

async function updateLabMap(): Promise<void> {
  const mapContainer = document.getElementById('lab-map');
  if (!mapContainer) return;

  const proj = getProjectionById(currentProjId) ?? allProjections[0];
  const topology = await getTopology();

  // Create SVG element
  const width = 960;
  const height = 540;
  const svgNS = 'http://www.w3.org/2000/svg';

  mapContainer.innerHTML = '';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.classList.add('projection-map');

  // Build the projection instance according to case / aspect / slider
  const projection = createConfiguredProjection(proj);

  // Fit projection
  const land = topojson.feature(topology, topology.objects.land);
  try {
    projection.fitSize([width - 30, height - 30], land);
    const tr = projection.translate();
    projection.translate([tr[0] + 15, tr[1] + 15]);
  } catch (e) {
    console.warn('Projection fitSize fallback', e);
  }

  const path = d3Geo.geoPath(projection);

  // 1. Sphere background
  const sphere = document.createElementNS(svgNS, 'path');
  sphere.setAttribute('d', path({ type: 'Sphere' }) ?? '');
  sphere.classList.add('map-sphere');
  svg.appendChild(sphere);

  // 2. Graticule
  const graticule = document.createElementNS(svgNS, 'path');
  graticule.setAttribute('d', path(d3Geo.geoGraticule10()) ?? '');
  graticule.classList.add('map-graticule');
  svg.appendChild(graticule);

  // 3. Countries
  const countries = topojson.feature(topology, topology.objects.countries);
  if (countries.type === 'FeatureCollection') {
    for (const feature of countries.features) {
      const p = document.createElementNS(svgNS, 'path');
      p.setAttribute('d', path(feature) ?? '');
      p.classList.add('map-country');
      svg.appendChild(p);
    }
  }

  // 4. Country borders
  const borders = topojson.mesh(topology, topology.objects.countries as any, (a, b) => a !== b);
  const bp = document.createElementNS(svgNS, 'path');
  bp.setAttribute('d', path(borders) ?? '');
  bp.classList.add('map-borders');
  svg.appendChild(bp);

  // 5. Tissot's Indicatrix circles grid (every 15° lat / 15° lon)
  const tissotGroup = document.createElementNS(svgNS, 'g');
  tissotGroup.classList.add('tissot-grid');

  const circleGenerator = geoCircle().radius(config.gridSettings.circleRadiusDegrees);

  for (let lat = -75; lat <= 75; lat += config.gridSettings.stepLatitude) {
    for (let lon = -180; lon < 180; lon += config.gridSettings.stepLongitude) {
      try {
        const circleGeo = circleGenerator.center([lon, lat])();
        const d = path(circleGeo);
        if (d && d.length > 5) {
          const circlePath = document.createElementNS(svgNS, 'path');
          circlePath.setAttribute('d', d);
          circlePath.classList.add('tissot-circle');

          // Highlight standard parallel / tangent line circles
          const isStandardLine = checkIfStandardLine(lat, proj.familyId, currentCase);
          if (isStandardLine) circlePath.classList.add('tissot-circle--standard');

          circlePath.addEventListener('mouseenter', () => {
            circlePath.classList.add('tissot-circle--hover');
            showTissotTooltip(lat, lon, proj);
          });
          circlePath.addEventListener('mouseleave', () => {
            circlePath.classList.remove('tissot-circle--hover');
          });

          tissotGroup.appendChild(circlePath);
        }
      } catch {
        // Skip unprojectable points outside horizon
      }
    }
  }

  svg.appendChild(tissotGroup);
  mapContainer.appendChild(svg);

  // Update HUD
  const fEl = document.getElementById('metric-family');
  const pEl = document.getElementById('metric-prop');
  const cEl = document.getElementById('metric-case');
  const nEl = document.getElementById('metric-note');
  if (fEl) fEl.textContent = proj.familyName;
  if (pEl) pEl.textContent = proj.property;
  if (cEl) cEl.textContent = currentCase === 'tangent' ? 'Tangent (1 line)' : 'Secant (2 lines)';
  if (nEl) nEl.textContent = proj.distortionNote;
}

function checkIfStandardLine(lat: number, family: string, surfCase: string): boolean {
  if (family === 'cylindrical') {
    if (surfCase === 'tangent') return lat === 0;
    if (surfCase === 'secant') return lat === 30 || lat === -30 || lat === 45 || lat === -45;
  }
  if (family === 'conic') {
    if (surfCase === 'tangent') return lat === 45;
    if (surfCase === 'secant') return lat === 30 || lat === 60;
  }
  return false;
}

function showTissotTooltip(lat: number, lon: number, proj: ProjectionEntry): void {
  const inspector = document.getElementById('distortion-inspector');
  if (!inspector) return;

  // Calculate approximate distortion values
  const phi = (lat * Math.PI) / 180;
  let areaRatio = '1.00';
  let angularDef = '0.0°';

  if (proj.property === 'conformal') {
    // a = b = sec(phi)
    const scale = (1 / Math.cos(phi)).toFixed(2);
    areaRatio = (parseFloat(scale) * parseFloat(scale)).toFixed(2);
    angularDef = '0.0° (Shape preserved)';
  } else if (proj.property === 'equal-area') {
    areaRatio = '1.00 (Area preserved)';
    const maxTheta = Math.abs(lat) > 0 ? (Math.abs(lat) * 0.8).toFixed(1) : '0.0';
    angularDef = `${maxTheta}°`;
  } else {
    areaRatio = (1 + Math.abs(Math.sin(phi)) * 0.5).toFixed(2);
    angularDef = `${(Math.abs(lat) * 0.4).toFixed(1)}°`;
  }

  const noteEl = document.getElementById('metric-note');
  if (noteEl) {
    noteEl.innerHTML = `
      <strong>Inspected Point (${lat > 0 ? lat + '°N' : Math.abs(lat) + '°S'}, ${lon > 0 ? lon + '°E' : Math.abs(lon) + '°W'}):</strong><br/>
      Area Scale Factor (s): <code>${areaRatio}</code><br/>
      Max Angular Deformation (2ω): <code>${angularDef}</code>
    `;
  }
}

function createConfiguredProjection(proj: ProjectionEntry): GeoProjection {
  if (proj.familyId === 'azimuthal') {
    // Continuous perspective morphing based on slider [0.0 ... 1.0]
    if (azimuthalSliderValue < 0.2) {
      return d3Geo.geoGnomonic().clipAngle(60).precision(0.1);
    } else if (azimuthalSliderValue < 0.5) {
      return d3Geo.geoStereographic().clipAngle(110).precision(0.1);
    } else if (azimuthalSliderValue < 0.85) {
      const dist = 1.2 + (azimuthalSliderValue - 0.5) * 5;
      const angle = Math.acos(1 / Math.max(1.05, dist)) * (180 / Math.PI);
      return d3GeoProjection.geoSatellite().distance(dist).clipAngle(angle).precision(0.1);
    } else {
      return d3Geo.geoOrthographic().precision(0.1);
    }
  }

  // Handle Cylindrical with Case and Aspect
  if (proj.familyId === 'cylindrical') {
    if (currentAspect === 'transverse') {
      return d3Geo.geoTransverseMercator().precision(0.1);
    } else if (currentAspect === 'oblique') {
      return d3Geo.geoMercator().rotate([45, -20, 25]).precision(0.1);
    }

    if (proj.id === 'lambert-cylindrical-equal-area') {
      return d3GeoProjection.geoCylindricalEqualArea()
        .parallel(currentCase === 'secant' ? 30 : 0)
        .precision(0.1);
    }

    return d3Geo.geoMercator().precision(0.1);
  }

  // Handle Conic with Case and Aspect
  if (proj.familyId === 'conic') {
    const parallels: [number, number] = currentCase === 'secant' ? [30, 60] : [45, 45];
    if (proj.property === 'equal-area') {
      return d3Geo.geoConicEqualArea().parallels(parallels).precision(0.1);
    }
    return d3Geo.geoConicConformal().parallels(parallels).precision(0.1);
  }

  // Pseudocylindrical & Compromise
  if (proj.id === 'mollweide') return d3GeoProjection.geoMollweide().precision(0.1);
  if (proj.id === 'eckert-iv') return d3GeoProjection.geoEckert4().precision(0.1);
  if (proj.id === 'sinusoidal') return d3GeoProjection.geoSinusoidal().precision(0.1);
  if (proj.id === 'robinson') return d3GeoProjection.geoRobinson().precision(0.1);
  if (proj.id === 'goode-homolosine') return d3GeoProjection.geoHomolosine().precision(0.1);
  if (proj.id === 'winkel-tripel') return d3GeoProjection.geoWinkel3().precision(0.1);
  if (proj.id === 'van-der-grinten') return d3GeoProjection.geoVanDerGrinten().precision(0.1);

  return d3Geo.geoNaturalEarth1().precision(0.1);
}
