// Global sun (issue #28): project settings → sun position and real illuminance.
//
// Solar position, daylight levels and weather come from @avplan/scene3d
// (`sonnenstand`, `sonneDirektLux`, `himmelDiffusLux`, `WETTER`) — the same
// source the render sky uses, so plan heat-map and render never disagree.
// The plan convention (`northDeg` clockwise from plan "up", plan y = scene z)
// is identical to the package's.
import { ORTE, sonnenstand, sonnenzeiten, type OrtArt, type Sonnenzeiten } from '../avplan/scene3d/sonne';
import { WETTER, farbtemperaturK, himmelDiffusLux, sonneDirektLux, type WetterArt } from '../avplan/scene3d/himmel';
import type { SunPlace, SunSettings } from '../types';

export { ORTE, WETTER, type OrtArt, type WetterArt };

export interface ResolvedSun {
  altitude: number;          // radians above the horizon (> 0 when up)
  azimuthDeg: number;        // compass bearing of the sun
  /** Horizontal unit vector in plan space pointing toward the sun. */
  dir: { x: number; y: number };
  /** Unit vector in 3D scene space pointing from the ground toward the sun. */
  dir3D: { x: number; y: number; z: number };
  /** Horizontal illuminance (lux) of the direct sun at an unobstructed floor point. */
  lux: number;
  /** Horizontal illuminance (lux) of the open sky (diffuse). */
  skyLux: number;
  /** Direct-normal illuminance (lux), weather included. */
  directNormalLux: number;
  colorTempK: number;
  altitudeDeg: number;
}

const DEG = Math.PI / 180;

/** Places in ORTE are all in Germany; custom coordinates fall back to round(lon / 15). */
function timeZoneOf(s: SunSettings): string | null {
  return placeOf(s) === 'custom' ? null : 'Europe/Berlin';
}

export function placeOf(s: Pick<SunSettings, 'place' | 'latitude' | 'longitude'>): SunPlace {
  if (s.place) return s.place;
  const hit = (Object.keys(ORTE) as OrtArt[]).find((k) => Math.abs(ORTE[k].lat - s.latitude) < 0.01 && Math.abs(ORTE[k].lon - s.longitude) < 0.01);
  return hit ?? 'custom';
}

function offsetMinutes(zone: string | null, lon: number, utcMs: number): number {
  if (!zone) return Math.round(lon / 15) * 60;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
  }).formatToParts(new Date(utcMs));
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Math.round((Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute')) - Math.floor(utcMs / 60000) * 60000) / 60000);
}

/** Local clock time at the project's place → real instant. */
export function sunInstant(s: SunSettings, minutesOfDay?: number): Date | null {
  const [y, mo, d] = s.date.split('-').map(Number);
  const [hh, mm] = s.time.split(':').map(Number);
  if (!y || !mo || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const zone = timeZoneOf(s);
  const local = Date.UTC(y, mo - 1, d) + (minutesOfDay ?? hh * 60 + mm) * 60000;
  let t = local - offsetMinutes(zone, s.longitude, local) * 60000;
  // Second pass settles the hour around a DST switch.
  t = local - offsetMinutes(zone, s.longitude, t) * 60000;
  return new Date(t);
}

/** Real instant → minutes since local midnight at the project's place. */
export function localMinutes(s: SunSettings, at: Date): number {
  const m = Math.floor(at.getTime() / 60000) + offsetMinutes(timeZoneOf(s), s.longitude, at.getTime());
  return ((m % 1440) + 1440) % 1440;
}

export function minutesToTime(m: number): string {
  const r = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`;
}

export function sunTimes(s: SunSettings): Sonnenzeiten | null {
  const noon = sunInstant(s, 12 * 60);
  return noon ? sonnenzeiten(noon, s.latitude, s.longitude) : null;
}

/**
 * Sun position and real illuminance for the heat-map and the render. Null when
 * the sun is disabled or below the horizon (no direct light to add).
 */
export function resolveSun(s: SunSettings | undefined): ResolvedSun | null {
  if (!s || !s.enabled) return null;
  const at = sunInstant(s);
  if (!at) return null;
  const pos = sonnenstand(at, s.latitude, s.longitude, s.northDeg);
  if (pos.elevationDeg <= 0.5) return null;
  const w = WETTER[s.weather ?? 'klar'];
  const altitude = pos.elevationDeg * DEG;
  const h = Math.hypot(pos.richtung.x, pos.richtung.z) || 1;
  const directNormalLux = sonneDirektLux(pos.elevationDeg) * w.direkt;
  return {
    altitude,
    azimuthDeg: pos.azimutDeg,
    dir: { x: pos.richtung.x / h, y: pos.richtung.z / h },
    dir3D: { x: pos.richtung.x, y: pos.richtung.y, z: pos.richtung.z },
    lux: directNormalLux * Math.sin(altitude),
    skyLux: himmelDiffusLux(pos.elevationDeg) * w.diffus,
    directNormalLux,
    colorTempK: farbtemperaturK(pos.elevationDeg),
    altitudeDeg: pos.elevationDeg,
  };
}

/**
 * Old project files carried `intensity` (a hand-set direct-normal lux) and no
 * place or weather. Daylight is computed now, so `intensity` is dropped; the
 * place is recognised from the coordinates.
 */
export function normalizeSun(raw: unknown): SunSettings {
  const d = defaultSunSettings();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<SunSettings> & { intensity?: unknown };
  const num = (v: unknown, f: number) => (typeof v === 'number' && Number.isFinite(v) ? v : f);
  const base: SunSettings = {
    enabled: typeof r.enabled === 'boolean' ? r.enabled : d.enabled,
    latitude: num(r.latitude, d.latitude),
    longitude: num(r.longitude, d.longitude),
    date: typeof r.date === 'string' ? r.date : d.date,
    time: typeof r.time === 'string' ? r.time : d.time,
    northDeg: num(r.northDeg, d.northDeg),
    weather: r.weather && r.weather in WETTER ? r.weather : 'klar',
  };
  const place = r.place === 'custom' || (r.place && r.place in ORTE) ? r.place : undefined;
  return { ...base, place: placeOf({ ...base, place }) };
}

// A sensible default: Berlin, summer afternoon, North up, clear sky.
export function defaultSunSettings(): SunSettings {
  return {
    enabled: false,
    latitude: ORTE.berlin.lat,
    longitude: ORTE.berlin.lon,
    place: 'berlin',
    date: '2026-06-21',
    time: '15:00',
    northDeg: 0,
    weather: 'klar',
  };
}
