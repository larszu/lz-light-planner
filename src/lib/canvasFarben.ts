// Die themenabhaengigen Farben des 2D-Plans.
//
// Ein <canvas> sieht keine CSS-Variablen; deshalb liest diese Datei die
// `--canvas-*`-Token aus `App.css` und gibt sie dem Zeichnen. Die Werte
// stehen damit an EINER Stelle (der Token-Datei), fuer beide Themen.
//
// Was hier NICHT steht: Lichtfarben, Kegel, Leuchten-Symbole, Gel- und
// Statusfarben. Sie sind Inhalt des Plans und drehen sich nicht mit.
//
// Der Plan zeichnet in einer requestAnimationFrame-Schleife; die Werte
// werden deshalb zwischengespeichert und nur beim Themenwechsel neu gelesen.
import { THEMA_EREIGNIS } from './thema';

export interface CanvasFarben {
  bg: string;
  ruler: string;
  rulerCorner: string;
  rulerText: string;
  tick: string;
  edge: string;
  grid: string;
  gridMajor: string;
  axis: string;
  label: string;
  labelStrong: string;
  sel: string;
}

const TOKEN: Record<keyof CanvasFarben, string> = {
  bg: '--canvas-bg',
  ruler: '--canvas-ruler',
  rulerCorner: '--canvas-ruler-corner',
  rulerText: '--canvas-ruler-text',
  tick: '--canvas-tick',
  edge: '--canvas-edge',
  grid: '--canvas-grid',
  gridMajor: '--canvas-grid-major',
  axis: '--canvas-axis',
  label: '--canvas-label',
  labelStrong: '--canvas-label-strong',
  sel: '--canvas-sel',
};

let zwischen: CanvasFarben | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener(THEMA_EREIGNIS, () => {
    zwischen = null;
  });
}

/** Die aktuellen Plan-Farben. Fehlt ein Token (Stilblatt nicht geladen),
 *  faellt der Wert auf `currentColor`-freies Grau zurueck statt auf leer. */
export const canvasFarben = (): CanvasFarben => {
  if (zwischen) return zwischen;
  const cs = getComputedStyle(document.documentElement);
  const f = {} as CanvasFarben;
  for (const k of Object.keys(TOKEN) as (keyof CanvasFarben)[]) {
    f[k] = cs.getPropertyValue(TOKEN[k]).trim() || 'gray';
  }
  zwischen = f;
  return f;
};
