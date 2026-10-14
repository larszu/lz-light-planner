// A person's render figure: pose and look → arguments for erzeugeMensch.
import { publikumsVariante } from '../avplan/scene3d/publikum';
import type { MenschFarben, MenschGestalt } from '../avplan/scene3d/mensch';
import type { Pose } from '../avplan/scene3d/menschSkelett';
import type { Person } from '../types';

export const SKIN_TONES = ['#f1d1b8', '#e6bc9c', '#d4a283', '#bf8a68', '#a06d4e', '#7d5136', '#5c3a26'] as const;
export const HAIR_COLOURS = ['#0f0d0c', '#3a2a1e', '#8a6a48', '#b89b70', '#8f8a84', '#d0ccc4'] as const;
export const HAIR_LENGTHS = [0, 0.04, 0.12, 0.3] as const;

export function postureOf(p: Pick<Person, 'pose' | 'posture'>): Pose {
  return p.posture ?? (p.pose === 'sitting' ? 'sitzen' : 'stehen');
}

// Stable 0..1 per id, so a person keeps the same face of the crowd between sessions.
function seed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

export function figureOf(p: Person): { farben: MenschFarben; gestalt: MenschGestalt } {
  const v = publikumsVariante(seed(p.id));
  const l = p.look ?? {};
  return {
    farben: {
      oben: l.topColor ?? v.oben,
      unten: l.bottomColor ?? v.unten,
      haut: l.skin ?? v.haut,
      haar: l.hair ?? v.haar,
      langarm: v.langarm,
    },
    gestalt: {
      statur: l.build,
      oberteil: l.top,
      unterteil: l.bottom,
      schuhe: l.shoes,
      geschlecht: l.feminine,
      haarLaenge: l.hairLength,
    },
  };
}
