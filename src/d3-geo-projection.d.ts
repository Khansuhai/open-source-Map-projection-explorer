/** Module declarations for packages missing TypeScript definitions */

declare module 'd3-geo-projection' {
  import type { GeoProjection } from 'd3-geo';

  export function geoCylindricalEqualArea(): GeoProjection;
  export function geoMiller(): GeoProjection;
  export function geoPolyconic(): GeoProjection;
  export function geoSinusoidal(): GeoProjection;
  export function geoMollweide(): GeoProjection;
  export function geoEckert4(): GeoProjection;
  export function geoRobinson(): GeoProjection;
  export function geoHomolosine(): GeoProjection;
  export function geoWinkel3(): GeoProjection;
  export function geoVanDerGrinten(): GeoProjection;
  export function geoSatellite(): GeoProjection & { distance(d: number): GeoProjection & { distance(d: number): any; clipAngle(angle: number): any } };
}
