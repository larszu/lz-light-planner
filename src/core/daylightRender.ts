// Light scale of the render view, shared by spotlights, sun and sky.
//
// ENTSCHEIDUNG (Lichtskala, 2026-10-14). Der Planer rechnet photometrisch:
// Heat-Map, Lux am Motiv und Hover-Wert nehmen die Sonne mit echten Lux aus
// @avplan/scene3d (`sonneDirektLux`, `himmelDiffusLux`, Wetter) — dort wird
// nichts gestaucht. Die Render-Ansicht dagegen ist ein Bild: mit derselben
// Skala fuer Sonne (~100 klx) und Scheinwerfer (einige hundert Lux) waere
// jeder Lichtkegel bei Tag unsichtbar, wie draussen in echt. Darum:
//  1. Eine gemeinsame Einheit: `luxProEinheit = 1 / LIGHT_K`, denn die
//     Spots bekommen `candela * LIGHT_K` — ein Spot und die Sonne stehen
//     damit im echten Verhaeltnis, solange es dunkel ist.
//  2. Nur das Tageslicht wird oberhalb von KNEE_LUX gestaucht (Potenz
//     SLOPE): Mittagssonne landet bei wenigen klx statt 100 klx. Verhaeltnisse
//     unter dem Knie (Daemmerung, Nacht, Fenster-Streiflicht) bleiben echt.
//  3. Die Belichtung kommt aus `belichtungAusEv` der gestauchten Helligkeit,
//     aber nie dunkler als fuer STAGE_LUX — so steht die Nacht wie die Halle
//     (Belichtung ~1,2) da statt auf Sternenlicht hochgeregelt.
// Die Stauchung geht ueber ein eigenes `Wetter` (direkt/diffus skaliert) in
// den Himmel; das Paket bleibt unveraendert.
import { WETTER, belichtungAusEv, ev100AusLux, himmelDiffusLux, sonneDirektLux, type Wetter, type WetterArt } from '../avplan/scene3d/himmel';
import { sonnenstand } from '../avplan/scene3d/sonne';

/** Candela → three.js spotlight intensity. */
export const LIGHT_K = 0.0032;
export const LUX_PER_UNIT = 1 / LIGHT_K;

const KNEE_LUX = 400;
const SLOPE = 0.2;
const STAGE_LUX = 200;

export function renderedDaylightLux(lux: number): number {
  return lux <= KNEE_LUX ? lux : KNEE_LUX * Math.pow(lux / KNEE_LUX, SLOPE);
}

export interface RenderDaylight {
  /** Weather with direct and diffuse light scaled to the render range. */
  wetter: Wetter;
  /** Factor real lux → rendered lux. */
  factor: number;
  /** toneMappingExposure before the user's exposure trim. */
  exposure: number;
}

export function renderDaylight(at: Date, lat: number, lon: number, weather: WetterArt = 'klar'): RenderDaylight {
  const w = WETTER[weather];
  const e = sonnenstand(at, lat, lon).elevationDeg;
  const real = sonneDirektLux(e) * w.direkt * Math.max(0, Math.sin((e * Math.PI) / 180)) + himmelDiffusLux(e) * w.diffus;
  const shown = renderedDaylightLux(real);
  const factor = real > 0 ? shown / real : 1;
  return {
    wetter: { ...w, direkt: w.direkt * factor, diffus: w.diffus * factor },
    factor,
    exposure: belichtungAusEv(ev100AusLux(Math.max(shown, STAGE_LUX)), LUX_PER_UNIT),
  };
}

/** The user's exposure slider trims around its default instead of replacing the auto exposure. */
export const EXPOSURE_DEFAULT = 1.2;
