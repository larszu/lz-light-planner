// Waechter fuer die Oberflaechen-Regeln (ADR-007 der av-planner-suite).
// Lauf: `npm run brand:check`  (node --experimental-strip-types).
//
// ─── WARUM ES DAS GIBT ──────────────────────────────────────────────────────
//
// Regeln, die nur in einem Dokument stehen, driften. ADR-007 legt fest, wie
// die Planer der Suite aussehen; dieser Lauf haelt es in diesem Repo fest.
//
// 2026-10-13 — ADR-007 (lz-planner-suite) ist geaendert worden: der
// Design-Vertrag 2026-10 loest Deep-Navy-Flaechen, Radius 0, „keine
// Schatten" und die Kopflinie ab. Flaechen sind jetzt NEUTRAL (Anthrazit
// dunkel, warmes Fast-Weiss hell), Markenblau ist nur Akzent, es gibt immer
// Hell UND Dunkel mit sichtbarem Umschalter Auto · Hell · Dunkel. Rundungen
// und Schatten sind erlaubt — aber NUR ueber Tokens. Der Lauf wurde im selben
// PR umgebaut, nicht abgeschaltet.
//
// ─── WARUM DIESE DATEI DIE WERTE EIN ZWEITES MAL TRAEGT ─────────────────────
//
// Sie stehen maschinenlesbar in `@avplan/ui` (`src/brand.ts`) — aber der
// Light-Planer haengt nicht an diesem Paket: er wird in die Suite vendoriert,
// nicht umgekehrt. Die Doppelung ist Absicht. Wer einen Wert aendert, aendert
// ihn in der Suite, im Vertrag UND hier.
//
// Was er NICHT prueft: ob die Werte gut aussehen und ob der Kontrast im
// gerenderten Fenster reicht. Das zeigen Screenshots in beiden Modi.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const hier = dirname(fileURLToPath(import.meta.url));
const lies = (rel: string): string => readFileSync(resolve(hier, '..', rel), 'utf8');
const css = lies('src/App.css');

/** Der Inhalt des ersten Blocks, der mit `kopf` beginnt (ohne Verschachtelung). */
const block = (kopf: string): string => {
  const i = css.indexOf(kopf);
  assert.ok(i >= 0, `Block ${kopf} fehlt in src/App.css`);
  const auf = css.indexOf('{', i);
  return css.slice(auf + 1, css.indexOf('}', auf));
};
const token = (quelle: string, name: string): string => {
  const m = quelle.match(new RegExp(`(?:^|[\\s;{])${name.replace(/-/g, '\\-')}:\\s*([^;]+);`));
  return m ? m[1].trim() : '';
};

const DUNKEL = block(':root {');
const HELL = block(":root[data-theme='light'] {");
const SYSTEM_HELL = block(":root:not([data-theme='dark']) {");

// ── 1. Die Werte des Vertrags, in BEIDEN Modi ──────────────────────────────
//    Rolle → [Token, hell, dunkel]
const VERTRAG: [string, string, string, string][] = [
  ['Grund', '--bg', '#FAFAF8', '#1E1F23'],
  ['Flaeche', '--panel', '#FFFFFF', '#28292E'],
  ['Flaeche 2', '--panel-alt', '#F1F1EE', '#33343A'],
  ['Erhoben', '--raised', '#FFFFFF', '#3B3C42'],
  ['Versenkt', '--sunken', '#F4F4F1', '#19191D'],
  ['Text stark', '--text-strong', '#16181D', '#F6F5F0'],
  ['Text', '--text', '#2B2E35', '#E6E6E3'],
  ['Text gedaempft', '--text2', '#6A6E77', '#A9ACB4'],
  ['Linie', '--border', 'rgba(22, 24, 29, 0.08)', 'rgba(246, 245, 240, 0.09)'],
  ['Linie stark', '--line-2', 'rgba(22, 24, 29, 0.18)', 'rgba(246, 245, 240, 0.20)'],
  ['Akzent', '--accent', '#1D324F', '#B9C7D8'],
  ['Text auf Akzent', '--accent-text', '#F6F5F0', '#132040'],
  ['Akzent weich', '--accent-soft', 'rgba(29, 50, 79, 0.10)', 'rgba(185, 199, 216, 0.12)'],
  ['Logo', '--logo', '#1D324F', '#F6F5F0'],
  ['Schein 1', '--glow-1', 'rgba(29, 50, 79, 0.10)', 'rgba(185, 199, 216, 0.16)'],
];
for (const [rolle, name, hell, dunkel] of VERTRAG) {
  assert.equal(token(DUNKEL, name), dunkel, `${rolle} (${name}) dunkel`);
  assert.equal(token(HELL, name), hell, `${rolle} (${name}) hell`);
  // Der Systemhinweis-Block ist eine Abschrift des Hell-Blocks. Laeuft er
  // auseinander, sieht „Auto" auf einem hellen Rechner anders aus als „Hell".
  assert.equal(token(SYSTEM_HELL, name), hell, `${rolle} (${name}) hell per Systemhinweis`);
}
assert.equal(token(DUNKEL, '--glow-2'), 'rgba(200, 137, 43, 0.10)', 'Schein 2');

// Dunkel heisst Anthrazit, nicht Navy: keine der alten Navy-Flaechen mehr.
for (const navy of ['#132040', '#1D324F', '#182948', '#24405F']) {
  for (const name of ['--bg', '--panel', '--panel-alt', '--raised', '--sunken']) {
    assert.notEqual(token(DUNKEL, name).toUpperCase(), navy.toUpperCase(), `${name} ist wieder Navy`);
  }
}

// ── 2. Status ist nicht Signal ────────────────────────────────────────────
assert.equal(token(DUNKEL, '--danger'), '#B04A3F', 'Fehlerrot ist der Status-Ton');
assert.equal(token(DUNKEL, '--success'), '#2F7D5C');
assert.equal(token(DUNKEL, '--warn'), '#C8892B');
assert.equal(token(DUNKEL, '--signal'), '#D6402E', 'Tally-Rot ist das Signal');

// ── 3. Rot genau EINMAL: in der Definition des Signals ────────────────────
const rot = css.match(/#D6402E/gi) ?? [];
assert.equal(rot.length, 1, `Tally-Rot steht ${rot.length}-mal in App.css — erlaubt ist genau die Definition von --signal`);

// ── 4. Das Logo traegt nur Kit-Farben ─────────────────────────────────────
//    Navy auf Hell, Off-White auf Dunkel, Punkt immer das Signal. Nie am
//    UI-Akzent: der ist im Dunkeln ein helles Blau, und das Signet bekaeme
//    einen Farbstich.
const signet = lies('src/components/Signet.tsx');
assert.match(signet, /fill: 'var\(--logo\)'/, 'Das Signet nimmt seine Farbe nicht aus --logo');
assert.match(signet, /fill: 'var\(--signal\)'/, 'Der Punkt des Signets ist nicht das Signal');
assert.ok(!/--accent/.test(signet), 'Das Signet haengt am UI-Akzent');
assert.ok(lies('src/components/TopBar.tsx').includes('<Signet />'), 'Die Kopfzeile zeigt das Signet nicht');

// ── 5. Der Fokusring ist das Signal ───────────────────────────────────────
assert.ok(css.includes('outline: 2px solid var(--signal)'), 'Fokusring fehlt');

// ── 6. Rundung und Schatten NUR ueber Tokens ──────────────────────────────
const RADIEN: [string, string][] = [['--r-s', '6px'], ['--r-m', '10px'], ['--r-l', '20px'], ['--r-xl', '24px'], ['--r-full', '999px']];
for (const [name, wert] of RADIEN) assert.equal(token(DUNKEL, name), wert, `Radius ${name}`);
assert.equal(token(DUNKEL, '--shadow-1'), '0 1px 2px rgba(0, 0, 0, 0.30)');
assert.equal(token(DUNKEL, '--shadow-2'), '0 4px 16px rgba(0, 0, 0, 0.40)');
assert.equal(token(DUNKEL, '--shadow-3'), '0 16px 48px rgba(0, 0, 0, 0.55)');
assert.equal(token(HELL, '--shadow-1'), '0 1px 2px rgba(22, 24, 29, 0.06)');
assert.equal(token(HELL, '--shadow-2'), '0 4px 16px rgba(22, 24, 29, 0.08)');
assert.equal(token(HELL, '--shadow-3'), '0 16px 48px rgba(22, 24, 29, 0.14)');

/** Rohe Rundungen und Schatten in einem Stilblatt, ausserhalb der Token-Bloecke. */
export const roheFormen = (quelle: string): string[] => {
  const funde: string[] = [];
  quelle.split('\n').forEach((zeile, i) => {
    if (/^\s*--/.test(zeile)) return; // Token-Definition
    for (const m of zeile.matchAll(/(?<![\w-])border(?:-[a-z]+)*-radius:\s*([^;}]+)/g)) {
      if (!/^(0|var\(--r-(s|m|l|xl|full)\))$/.test(m[1].trim())) funde.push(`${i + 1}: ${m[0]}`);
    }
    for (const m of zeile.matchAll(/(?<![\w-])box-shadow:\s*([^;}]+)/g)) {
      const teile = m[1].trim().split(/,\s*/);
      if (!(m[1].trim() === 'none' || teile.every((t) => /^var\(--shadow-[a-z0-9-]+\)$/.test(t)))) funde.push(`${i + 1}: ${m[0]}`);
    }
  });
  return funde;
};
// Gegenprobe am erfundenen Stilblatt: ein Waechter, der nur am gesunden
// Zustand gemessen wird, ist nicht gemessen.
assert.equal(roheFormen('.a { border-radius: 4px; }').length, 1, 'rohe Rundung faellt nicht auf');
assert.equal(roheFormen('.a { border-radius: 50%; }').length, 1, 'Prozent-Rundung faellt nicht auf');
assert.equal(roheFormen('.a { box-shadow: 0 2px 4px #000; }').length, 1, 'roher Schatten faellt nicht auf');
assert.equal(roheFormen('.a { border-radius: var(--r-m); box-shadow: var(--shadow-2); }').length, 0, 'Token werden beanstandet');
assert.equal(roheFormen('.a { border-top-left-radius: 3px; }').length, 1, 'Einzelecke faellt nicht auf');
const formFunde = roheFormen(css);
assert.deepEqual(formFunde, [], `Rundung/Schatten ohne Token in App.css:\n  ${formFunde.join('\n  ')}`);
// Im TSX: Inline-Stile duerfen Rundung und Schatten nur als Token setzen.
for (const datei of ['src/components/ErrorBoundary.tsx']) {
  const q = lies(datei);
  for (const m of q.matchAll(/(borderRadius|boxShadow):\s*([^,}]+)/g)) {
    assert.match(m[2], /^'var\(--/, `${datei}: ${m[0]} ist kein Token`);
  }
}
// Verlaeufe nur als Hintergrundschein aus den Schein-Token.
for (const m of css.matchAll(/(linear|radial)-gradient\(([^;]*)/g)) {
  assert.match(m[2], /var\(--glow-/, `Verlauf ohne Schein-Token: ${m[0].slice(0, 60)}`);
}

// ── 7. Satzschreibung — Versalien nur fuer kleine Overlines (≤ 12 px) ─────
for (const m of css.matchAll(/([^{}]+)\{([^}]*text-transform:\s*uppercase[^}]*)\}/g)) {
  const groesse = m[2].match(/font-size:\s*([\d.]+)px/);
  assert.ok(groesse && Number(groesse[1]) <= 12, `Versalien in ${m[1].trim()} ohne kleine Schrift (≤ 12 px)`);
}

// ── 8. Hell UND Dunkel, sichtbar umschaltbar ──────────────────────────────
const schalter = lies('src/components/ThemaSchalter.tsx');
for (const zustand of ["'system'", "'hell'", "'dunkel'"]) {
  assert.ok(schalter.includes(`id: ${zustand}`), `Der Umschalter kennt ${zustand} nicht`);
}
assert.ok(schalter.includes('setzeThema('), 'Der Umschalter schaltet nicht');
assert.ok(lies('src/components/TopBar.tsx').includes('<ThemaSchalter />'), 'Der Umschalter steht nicht in der Kopfzeile');

// ── 9. Der Rahmen: Kopfzeile 40 px, Statusleiste 24 px, Rail 56 px ────────
const regel = (klasse: string): string => {
  const m = css.match(new RegExp(`\\.${klasse}\\s*\\{([^}]*)\\}`));
  assert.ok(m, `Regel .${klasse} fehlt in src/App.css`);
  return m![1];
};
assert.match(regel('menubar'), /height:\s*40px/, 'Kopfzeile ist 40 px');
assert.match(regel('menubar'), /flex:\s*none/, 'Kopfzeile schrumpft nicht mit');
assert.match(regel('statusbar'), /height:\s*24px/, 'Statusleiste ist 24 px');
assert.match(regel('statusbar'), /flex:\s*none/, 'Statusleiste schrumpft nicht mit');
// Die Kopflinie ist mit dem Vertrag 2026-10 entfallen: Panel-Koepfe sind ein
// normaler Titel. Kommt sie zurueck, ist das der alte Stand.
assert.ok(!/border-bottom:\s*1px solid var\(--accent\)/.test(regel('panel-head')), 'Die Kopflinie ist zurueck');
assert.match(css, /grid-template-columns:\s*56px/, 'Rail ist 56 px');
// Glas-Kopfzeile
// Der Weichzeichner sitzt auf `::before`, NICHT an `.topbar` selbst: dort
// machte er die Kopfzeile zum Bezugsrahmen fuer `position: fixed`, und der
// Einstellungen-Dialog war in ihre 40 px eingesperrt (gefunden am Screenshot).
assert.match(css, /\.topbar::before\s*\{[^}]*backdrop-filter:\s*blur\(16px\) saturate\(1\.4\)/, 'Die Kopfzeile ist nicht aus Glas');
assert.ok(!/backdrop-filter/.test(regel('topbar')), 'backdrop-filter an .topbar sperrt Dialoge und Klappen in die Kopfzeile');

// ── 10. Die Kommandopalette liegt auf Strg/Cmd + K ───────────────────────
//
// Und sie liest DIESELBE Liste wie die Menueleiste (`menuModel.ts`).
// Gemessen wird `TopBar.tsx`, das `App.tsx` wirklich rendert; ob es
// gerendert wird, prueft `i18n-reachable-check.ts`.
const palette = lies('src/components/CommandPalette.tsx');
assert.match(palette, /ctrlKey \|\| e\.metaKey/, 'Palette hoert nicht auf Strg/Cmd');
assert.match(palette, /e\.key === 'k' \|\| e\.key === 'K'/, 'Palette hoert nicht auf K');
assert.match(palette, /import type \{ MenuGroup \} from '\.\/menuModel'/, 'Palette liest nicht das Menue-Modell');
const topbar = lies('src/components/TopBar.tsx');
assert.match(topbar, /buildMenus\(/, 'Menueleiste baut nicht aus dem Modell');
assert.ok(topbar.includes('<TopMenu groups={menus} />'), 'Menueleiste ist nicht gemountet');
assert.ok(topbar.includes('<CommandPalette groups={menus} />'), 'Palette ist nicht gemountet');

console.log('brand:check ok — Design-Vertrag 2026-10 (ADR-007) in Hell und Dunkel eingehalten');
