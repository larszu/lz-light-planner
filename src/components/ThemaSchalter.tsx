import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import { useTranslation } from '../i18n';
import { liesThema, setzeThema, THEMA_EREIGNIS, type Thema } from '../lib/thema';

// Der sichtbare Umschalter Auto · Hell · Dunkel in der Kopfzeile
// (Design-Vertrag 2026-10, lzm-web). Derselbe Zustand wie im
// Einstellungen-Dialog: beide lesen und schreiben `lib/thema.ts`, und das
// Ereignis haelt sie gleich, egal wo gewaehlt wurde.
//
// Schmal (< 640 px) bleibt nur die aktive Stellung stehen; ein Klick auf sie
// schaltet weiter. So passt der Schalter auch auf ein Telefon in die
// 40-px-Zeile, ohne zu verschwinden.
const FOLGE: Thema[] = ['system', 'hell', 'dunkel'];

const ThemaSchalter: React.FC = () => {
  const { t } = useTranslation();
  const [thema, setThema] = useState<Thema>(liesThema);
  useEffect(() => {
    const h = () => setThema(liesThema());
    window.addEventListener(THEMA_EREIGNIS, h);
    return () => window.removeEventListener(THEMA_EREIGNIS, h);
  }, []);

  const STELLUNGEN: { id: Thema; icon: 'themeAuto' | 'sun' | 'moon'; label: string }[] = [
    { id: 'system', icon: 'themeAuto', label: t('settings.theme.system', 'Auto') },
    { id: 'hell', icon: 'sun', label: t('settings.theme.light', 'Light') },
    { id: 'dunkel', icon: 'moon', label: t('settings.theme.dark', 'Dark') },
  ];

  const waehle = (id: Thema) => {
    const ziel = id === thema ? FOLGE[(FOLGE.indexOf(id) + 1) % FOLGE.length] : id;
    setzeThema(ziel);
  };

  return (
    <div className="thema-schalter" role="group" aria-label={t('settings.theme', 'Theme')}>
      {STELLUNGEN.map((s) => (
        <button
          key={s.id}
          type="button"
          aria-pressed={thema === s.id}
          aria-label={s.label}
          title={s.label}
          onClick={() => waehle(s.id)}
        >
          <Icon name={s.icon} size={15} />
        </button>
      ))}
    </div>
  );
};

export default ThemaSchalter;
