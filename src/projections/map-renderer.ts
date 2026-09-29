/**
 * Renders a world map in a given d3 projection onto an SVG element.
 * Uses Natural Earth 110m TopoJSON boundaries.
 */
import { geoPath, geoGraticule10 } from 'd3-geo';
import type { GeoProjection } from 'd3-geo';
import * as topojson from 'topojson-client';
import type { Topology } from 'topojson-specification';

let cachedTopology: Topology | null = null;

async function loadTopology(): Promise<Topology> {
  if (cachedTopology) return cachedTopology;
  
  // Try loading local asset first, fall back to jsdelivr CDN
  const localUrl = `${import.meta.env.BASE_URL}world-110m.json`;
  try {
    const resp = await fetch(localUrl);
    if (resp.ok) {
      cachedTopology = (await resp.json()) as Topology;
      return cachedTopology;
    }
  } catch (e) {
    console.warn('Local topology fetch failed, attempting CDN fallback', e);
  }

  const cdnResp = await fetch(
    'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
  );
  cachedTopology = (await cdnResp.json()) as Topology;
  return cachedTopology;
}

export interface RenderOptions {
  width: number;
  height: number;
  projection: GeoProjection;
  container: HTMLElement;
}

export async function renderMap(opts: RenderOptions): Promise<SVGElement> {
  const { width, height, projection, container } = opts;
  const topology = await loadTopology();

  // Clear any existing content
  container.innerHTML = '';

  // Create SVG namespace element
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.classList.add('projection-map');

  // Fit projection to viewport
  const land = topojson.feature(topology, topology.objects.land);
  projection.fitSize([width - 20, height - 20], land);

  // Center the fitted projection
  const translate = projection.translate();
  projection.translate([translate[0] + 10, translate[1] + 10]);

  const path = geoPath(projection);

  // ── Background sphere ──
  const sphere = document.createElementNS(svgNS, 'path');
  sphere.setAttribute('d', path({ type: 'Sphere' }) ?? '');
  sphere.classList.add('map-sphere');
  svg.appendChild(sphere);

  // ── Graticule ──
  const graticule = document.createElementNS(svgNS, 'path');
  graticule.setAttribute('d', path(geoGraticule10()) ?? '');
  graticule.classList.add('map-graticule');
  svg.appendChild(graticule);

  // ── Countries ──
  const countries = topojson.feature(
    topology,
    topology.objects.countries
  );
  if (countries.type === 'FeatureCollection') {
    for (const feature of countries.features) {
      const countryPath = document.createElementNS(svgNS, 'path');
      countryPath.setAttribute('d', path(feature) ?? '');
      countryPath.classList.add('map-country');
      svg.appendChild(countryPath);
    }
  }

  // ── Country borders ──
  const borders = topojson.mesh(
    topology,
    topology.objects.countries as any,
    (a, b) => a !== b
  );
  const borderPath = document.createElementNS(svgNS, 'path');
  borderPath.setAttribute('d', path(borders) ?? '');
  borderPath.classList.add('map-borders');
  svg.appendChild(borderPath);

  container.appendChild(svg);
  return svg;
}
