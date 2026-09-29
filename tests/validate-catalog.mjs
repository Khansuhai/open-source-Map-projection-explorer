/**
 * Automated test to validate the catalog structure and verify that all 24
 * projections can be instantiated and mapped against Natural Earth boundary data.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as d3Geo from 'd3-geo';
import * as d3GeoProj from 'd3-geo-projection';
import * as topojson from 'topojson-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const catalogPath = path.resolve(__dirname, '../data/projections-catalog.json');
const topoPath = path.resolve(__dirname, '../public/world-110m.json');

console.log('🧪 Starting 3D to 2D Dish validation tests...\n');

// 1. Verify Catalog
if (!fs.existsSync(catalogPath)) {
  console.error('❌ projections-catalog.json not found at', catalogPath);
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const topo = JSON.parse(fs.readFileSync(topoPath, 'utf8'));
const land = topojson.feature(topo, topo.objects.land);

const allProjections = catalog.families.flatMap((f) => f.projections);
console.log(`✓ Loaded catalog with ${catalog.families.length} families and ${allProjections.length} projections.`);

// 2. Projection Registry Mapping
const factories = {
  'mercator': () => d3Geo.geoMercator().precision(0.1),
  'transverse-mercator': () => d3Geo.geoTransverseMercator().precision(0.1),
  'utm': () => d3Geo.geoTransverseMercator().rotate([-15, 0]).precision(0.1),
  'lambert-cylindrical-equal-area': () => d3GeoProj.geoCylindricalEqualArea().precision(0.1),
  'plate-carree': () => d3Geo.geoEquirectangular().precision(0.1),
  'miller-cylindrical': () => d3GeoProj.geoMiller().precision(0.1),
  'lambert-conformal-conic': () => d3Geo.geoConicConformal().parallels([33, 45]).rotate([96, 0]).precision(0.1),
  'albers-equal-area-conic': () => d3Geo.geoConicEqualArea().parallels([29.5, 45.5]).rotate([96, 0]).precision(0.1),
  'equidistant-conic': () => d3Geo.geoConicEquidistant().parallels([30, 60]).precision(0.1),
  'polyconic': () => d3GeoProj.geoPolyconic().precision(0.1),
  'azimuthal-equidistant': () => d3Geo.geoAzimuthalEquidistant().precision(0.1),
  'lambert-azimuthal-equal-area': () => d3Geo.geoAzimuthalEqualArea().precision(0.1),
  'stereographic': () => d3Geo.geoStereographic().precision(0.1),
  'orthographic': () => d3Geo.geoOrthographic().precision(0.1),
  'gnomonic': () => d3Geo.geoGnomonic().clipAngle(60).precision(0.1),
  'general-perspective': () => d3GeoProj.geoSatellite().distance(2.0).clipAngle(Math.acos(1 / 2.0) * 180 / Math.PI).precision(0.1),
  'sinusoidal': () => d3GeoProj.geoSinusoidal().precision(0.1),
  'mollweide': () => d3GeoProj.geoMollweide().precision(0.1),
  'eckert-iv': () => d3GeoProj.geoEckert4().precision(0.1),
  'robinson': () => d3GeoProj.geoRobinson().precision(0.1),
  'goode-homolosine': () => d3GeoProj.geoHomolosine().precision(0.1),
  'winkel-tripel': () => d3GeoProj.geoWinkel3().precision(0.1),
  'van-der-grinten': () => d3GeoProj.geoVanDerGrinten().precision(0.1),
  'natural-earth': () => d3Geo.geoNaturalEarth1().precision(0.1),
};

let errors = 0;

for (const proj of allProjections) {
  const factory = factories[proj.id];
  if (!factory) {
    console.error(`❌ Missing factory for catalog projection: ${proj.id} (${proj.name})`);
    errors++;
    continue;
  }

  try {
    const projection = factory();
    projection.fitSize([320, 180], land);
    const pathGenerator = d3Geo.geoPath(projection);
    const sphere = pathGenerator({ type: 'Sphere' });
    const renderedLand = pathGenerator(land);

    if (!renderedLand || renderedLand.length === 0) {
      console.error(`❌ Empty land render for projection: ${proj.id}`);
      errors++;
      continue;
    }

    console.log(`  ✓ [${proj.id}] ${proj.name} rendered successfully (SVG path len: ${renderedLand.length})`);
  } catch (err) {
    console.error(`❌ Render exception on ${proj.id}:`, err);
    errors++;
  }
}

if (errors === 0) {
  console.log(`\n🎉 All ${allProjections.length} projections verified and rendered cleanly!`);
  process.exit(0);
} else {
  console.error(`\n❌ Validation failed with ${errors} error(s).`);
  process.exit(1);
}
