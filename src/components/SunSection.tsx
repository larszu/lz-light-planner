import React, { useMemo } from 'react';
import type { SunSettings, SunPlace, SunWeather } from '../types';
import { ORTE, localMinutes, minutesToTime, placeOf, sunTimes, type OrtArt } from '../core/sun';
import type { Sonnenzeiten, Zeitraum } from '../avplan/scene3d/sonne';
import { format, useTranslation } from '../i18n';

interface Props {
  sun: SunSettings;
  sunInfo: { altitudeDeg: number; azimuthDeg: number } | null;
  /** The sky backdrop needs place and time even while the sun is off for the heat-map. */
  skyBackdrop: boolean;
  onSunChange: (s: SunSettings) => void;
}

const WEATHER: SunWeather[] = ['klar', 'leicht-bewoelkt', 'bedeckt', 'dunst'];

// Track of the time slider: night, blue hour, golden hour and day as colour
// bands, so the user sees where the light changes before dragging there.
function trackGradient(s: SunSettings, z: Sonnenzeiten | null): string {
  if (!z) return 'var(--bg-2)';
  if (z.immerOben) return 'var(--sun-day)';
  if (z.immerUnten) return 'var(--sun-night)';
  const pct = (d: Date) => (localMinutes(s, d) / 1440) * 100;
  const bands: [number, number, string][] = [];
  const band = (r: Zeitraum, c: string) => { if (r) bands.push([pct(r[0]), pct(r[1]), c]); };
  band(z.blaueStunde.morgens, 'var(--sun-blue)');
  band(z.goldeneStunde.morgens, 'var(--sun-gold)');
  if (z.goldeneStunde.morgens && z.goldeneStunde.abends) bands.push([pct(z.goldeneStunde.morgens[1]), pct(z.goldeneStunde.abends[0]), 'var(--sun-day)']);
  band(z.goldeneStunde.abends, 'var(--sun-gold)');
  band(z.blaueStunde.abends, 'var(--sun-blue)');
  const stops = ['var(--sun-night) 0%'];
  for (const [a, b, c] of bands.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0])) {
    stops.push(`var(--sun-night) ${a}%`, `${c} ${a}%`, `${c} ${b}%`, `var(--sun-night) ${b}%`);
  }
  stops.push('var(--sun-night) 100%');
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

const SunSection: React.FC<Props> = ({ sun, sunInfo, skyBackdrop, onSunChange }) => {
  const { t } = useTranslation();
  const set = (patch: Partial<SunSettings>) => onSunChange({ ...sun, ...patch });
  const place = placeOf(sun);
  const times = useMemo(() => sunTimes(sun), [sun]);
  const [hh, mm] = sun.time.split(':').map(Number);
  const minutes = (hh || 0) * 60 + (mm || 0);
  const clock = (d: Date | null) => (d ? minutesToTime(localMinutes(sun, d)) : '–');

  const weatherLabel = (w: SunWeather) => ({
    klar: t('sun.weather.clear', 'Clear'),
    'leicht-bewoelkt': t('sun.weather.partly', 'Partly cloudy'),
    bedeckt: t('sun.weather.overcast', 'Overcast'),
    dunst: t('sun.weather.haze', 'Hazy'),
  }[w]);

  const onPlace = (v: SunPlace) => {
    if (v === 'custom') set({ place: 'custom' });
    else set({ place: v, latitude: ORTE[v].lat, longitude: ORTE[v].lon });
  };

  const open = sun.enabled || skyBackdrop;

  return (
    <>
      {open && (
        <div className="vp-indent">
          <label className="tb-slider"><span>{t('sun.place', 'Place')}</span>
            <select value={place} onChange={(e) => onPlace(e.target.value as SunPlace)}>
              {(Object.keys(ORTE) as OrtArt[]).map((k) => <option key={k} value={k}>{ORTE[k].name}</option>)}
              <option value="custom">{t('sun.customPlace', 'Own coordinates')}</option>
            </select><em /></label>
          {place === 'custom' && (
            <>
              <label className="tb-slider"><span>{t('top.latitude', 'Latitude')}</span>
                <input type="number" min={-90} max={90} step={0.01} value={sun.latitude} onChange={(e) => set({ latitude: +e.target.value })} /><em>°</em></label>
              <label className="tb-slider"><span>{t('top.longitude', 'Longitude')}</span>
                <input type="number" min={-180} max={180} step={0.01} value={sun.longitude} onChange={(e) => set({ longitude: +e.target.value })} /><em>°</em></label>
            </>
          )}
          <label className="tb-slider"><span>{t('top.date', 'Date')}</span>
            <input type="date" value={sun.date} onChange={(e) => e.target.value && set({ date: e.target.value })} /><em /></label>
          <label className="tb-slider sun-time"><span>{t('top.time', 'Time')}</span>
            <input type="range" min={0} max={1435} step={5} value={minutes}
              style={{ background: trackGradient(sun, times) }}
              aria-valuetext={sun.time}
              onChange={(e) => set({ time: minutesToTime(+e.target.value) })} />
            <em>{sun.time}</em></label>
          {times && (
            <div className="sun-times">
              <span><i className="sun-dot gold" />{format(t('sun.riseSet', 'Sunrise {rise} · sunset {set}'), { rise: clock(times.aufgang), set: clock(times.untergang) })}</span>
              <span className="sun-legend"><i className="sun-dot gold" />{t('sun.golden', 'Golden hour')}<i className="sun-dot blue" />{t('sun.blue', 'Blue hour')}</span>
            </div>
          )}
          <div className="vp-label">{t('sun.weather', 'Weather')}</div>
          <div className="sun-weather" role="radiogroup" aria-label={t('sun.weather', 'Weather')}>
            {WEATHER.map((w) => (
              <button key={w} type="button" role="radio" aria-checked={(sun.weather ?? 'klar') === w}
                className={`vp-sw ${(sun.weather ?? 'klar') === w ? 'on' : ''}`} onClick={() => set({ weather: w })}>
                <span>{weatherLabel(w)}</span>
              </button>
            ))}
          </div>
          <label className="tb-slider"><span>{t('top.north', 'North ↻')}</span>
            <input type="range" min={0} max={359} step={1} value={sun.northDeg} onChange={(e) => set({ northDeg: +e.target.value })} /><em>{Math.round(sun.northDeg)}°</em></label>
          <div className="tb-hint">{sunInfo
            ? format(t('top.sunPos', 'Sun position: {alt}° above the horizon · azimuth {az}° (0 = N). Falls through windows into the room.'),
              { alt: sunInfo.altitudeDeg.toFixed(0), az: sunInfo.azimuthDeg.toFixed(0) })
            : t('top.sunBelow', 'The sun is below the horizon – no direct daylight.')}</div>
          {place === 'custom' && <div className="tb-hint">{t('sun.customZone', 'Own coordinates: local time is estimated from the longitude (no daylight saving).')}</div>}
        </div>
      )}
    </>
  );
};

export default SunSection;
