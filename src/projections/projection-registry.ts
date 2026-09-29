/**
 * Maps each projection catalog ID to its d3-geo / d3-geo-projection factory function.
 * 
 * Some projections in the catalog (like UTM, General Perspective) need special
 * parameters or have no direct d3 equivalent — we provide the closest sensible
 * default here.
 */
import * as d3Geo from 'd3-geo';
import * as d3GeoProjection from 'd3-geo-projection';
import type { GeoProjection } from 'd3-geo';

type ProjectionFactory = () => GeoProjection;

/**
 * Returns a d3 projection factory for each catalog projection ID.
 * Where the catalog projection maps cleanly to a d3 function, we use it directly.
 * Where it doesn't, we use a representative variant with sensible defaults.
 */
export function getProjectionFactory(id: string): ProjectionFactory | null {
  const factories: Record<string, ProjectionFactory> = {
    // ── Cylindrical ──────────────────────────────────────────
    'mercator': () => d3Geo.geoMercator().precision(0.1),
    'transverse-mercator': () => d3Geo.geoTransverseMercator().precision(0.1),
    'utm': () => d3Geo.geoTransverseMercator()
      .rotate([-15, 0])   // zone 33 as representative
      .precision(0.1),
    'lambert-cylindrical-equal-area': () =>
      d3GeoProjection.geoCylindricalEqualArea().precision(0.1),
    'plate-carree': () => d3Geo.geoEquirectangular().precision(0.1),
    'miller-cylindrical': () =>
      d3GeoProjection.geoMiller().precision(0.1),

    // ── Conic ────────────────────────────────────────────────
    'lambert-conformal-conic': () =>
      d3Geo.geoConicConformal()
        .parallels([33, 45])
        .rotate([96, 0])
        .precision(0.1),
    'albers-equal-area-conic': () =>
      d3Geo.geoConicEqualArea()
        .parallels([29.5, 45.5])
        .rotate([96, 0])
        .precision(0.1),
    'equidistant-conic': () =>
      d3Geo.geoConicEquidistant()
        .parallels([30, 60])
        .precision(0.1),
    'polyconic': () =>
      d3GeoProjection.geoPolyconic().precision(0.1),

    // ── Azimuthal ────────────────────────────────────────────
    'azimuthal-equidistant': () =>
      d3Geo.geoAzimuthalEquidistant().precision(0.1),
    'lambert-azimuthal-equal-area': () =>
      d3Geo.geoAzimuthalEqualArea().precision(0.1),
    'stereographic': () =>
      d3Geo.geoStereographic().precision(0.1),
    'orthographic': () =>
      d3Geo.geoOrthographic().precision(0.1),
    'gnomonic': () =>
      d3Geo.geoGnomonic()
        .clipAngle(60)
        .precision(0.1),
    'general-perspective': () =>
      d3GeoProjection.geoSatellite()
        .distance(2.0)
        .clipAngle(Math.acos(1 / 2.0) * 180 / Math.PI)
        .precision(0.1),

    // ── Pseudocylindrical ────────────────────────────────────
    'sinusoidal': () =>
      d3GeoProjection.geoSinusoidal().precision(0.1),
    'mollweide': () =>
      d3GeoProjection.geoMollweide().precision(0.1),
    'eckert-iv': () =>
      d3GeoProjection.geoEckert4().precision(0.1),
    'robinson': () =>
      d3GeoProjection.geoRobinson().precision(0.1),
    'goode-homolosine': () =>
      d3GeoProjection.geoHomolosine().precision(0.1),

    // ── Compromise ───────────────────────────────────────────
    'winkel-tripel': () =>
      d3GeoProjection.geoWinkel3().precision(0.1),
    'van-der-grinten': () =>
      d3GeoProjection.geoVanDerGrinten().precision(0.1),
    'natural-earth': () =>
      d3Geo.geoNaturalEarth1().precision(0.1),
  };

  return factories[id] ?? null;
}
