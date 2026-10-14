import React from 'react';
import type { Person, PersonLook } from '../types';
import { POSEN, istSitzend, type Pose } from '../avplan/scene3d/menschSkelett';
import type { Statur, Oberteil, Unterteil, Schuhe } from '../avplan/scene3d/menschKoerper';
import { HAIR_COLOURS, HAIR_LENGTHS, SKIN_TONES, figureOf, postureOf } from '../core/personLook';
import { useTranslation } from '../i18n';

interface Props {
  person: Person;
  onUpdate: (updates: Partial<Person>) => void;
}

const BUILDS: Statur[] = ['schlank', 'mittel', 'kraeftig'];
const TOPS: Oberteil[] = ['tshirt', 'hemd', 'sakko', 'kleid'];
const BOTTOMS: Unterteil[] = ['hose', 'rock'];
const SHOES: Schuhe[] = ['sneaker', 'halbschuh', 'stiefel'];

const PersonLookEditor: React.FC<Props> = ({ person: p, onUpdate }) => {
  const { t } = useTranslation();
  const look = p.look ?? {};
  const shown = figureOf(p);
  const setLook = (patch: Partial<PersonLook>) => onUpdate({ look: { ...look, ...patch } });
  const colour = (c: unknown) => (typeof c === 'string' ? c : '#000000');

  const poseLabel = (k: Pose) => ({
    stehen: t('person.pose.stand', 'Standing'),
    sitzen: t('person.pose.sit', 'Sitting'),
    jubeln: t('person.pose.cheer', 'Cheering'),
    sprechen: t('person.pose.talk', 'Talking'),
    armeVerschraenkt: t('person.pose.armsCrossed', 'Arms crossed'),
    haendeVorn: t('person.pose.handsFront', 'Hands in front'),
    handHuefte: t('person.pose.handHip', 'Hand on hip'),
    mikrofon: t('person.pose.mic', 'Holding a microphone'),
    tippen: t('person.pose.typing', 'Typing (seated)'),
    telefonieren: t('person.pose.phone', 'On the phone'),
    gitarre: t('person.pose.guitar', 'Playing guitar'),
    kameraSchulter: t('person.pose.camShoulder', 'Shoulder camera'),
    kameraStativ: t('person.pose.camTripod', 'Camera on tripod'),
  }[k]);
  const buildLabel = (k: Statur) => ({ schlank: t('person.build.slim', 'Slim'), mittel: t('person.build.medium', 'Medium'), kraeftig: t('person.build.strong', 'Strong') }[k]);
  const topLabel = (k: Oberteil) => ({ tshirt: t('person.top.tshirt', 'T-shirt'), hemd: t('person.top.shirt', 'Shirt'), sakko: t('person.top.jacket', 'Jacket'), kleid: t('person.top.dress', 'Dress') }[k]);
  const bottomLabel = (k: Unterteil) => ({ hose: t('person.bottom.trousers', 'Trousers'), rock: t('person.bottom.skirt', 'Skirt') }[k]);
  const shoeLabel = (k: Schuhe) => ({ sneaker: t('person.shoes.sneaker', 'Sneakers'), halbschuh: t('person.shoes.shoe', 'Shoes'), stiefel: t('person.shoes.boot', 'Boots') }[k]);
  const hairLabel = (i: number) => [t('person.hair.none', 'Bald'), t('person.hair.short', 'Short'), t('person.hair.medium', 'Medium'), t('person.hair.long', 'Long')][i];

  return (
    <>
      <label className="prop-field">
        <span>{t('prop.pose', 'Pose')}</span>
        <select value={postureOf(p)} onChange={(e) => {
          const posture = e.target.value as Pose;
          onUpdate({ posture, pose: istSitzend(posture) ? 'sitting' : 'standing' });
        }}>
          {POSEN.map((k) => <option key={k} value={k}>{poseLabel(k)}</option>)}
        </select>
      </label>
      <span className="prop-section-title">{t('person.look', 'Look (render)')}</span>
      <label className="prop-field">
        <span>{t('person.build', 'Build')}</span>
        <select value={look.build ?? 'mittel'} onChange={(e) => setLook({ build: e.target.value as Statur })}>
          {BUILDS.map((k) => <option key={k} value={k}>{buildLabel(k)}</option>)}
        </select>
      </label>
      <label className="prop-field">
        <span>{t('person.shape', 'Body shape')}</span>
        <input type="range" min={0} max={1} step={0.1} value={look.feminine ?? 0} aria-valuetext={String(look.feminine ?? 0)}
          onChange={(e) => setLook({ feminine: +e.target.value })} />
      </label>
      <label className="prop-field">
        <span>{t('person.top', 'Top')}</span>
        <select value={look.top ?? (shown.farben.langarm ? 'hemd' : 'tshirt')} onChange={(e) => setLook({ top: e.target.value as Oberteil })}>
          {TOPS.map((k) => <option key={k} value={k}>{topLabel(k)}</option>)}
        </select>
      </label>
      <label className="prop-field">
        <span>{t('person.bottom', 'Bottom')}</span>
        <select value={look.bottom ?? 'hose'} onChange={(e) => setLook({ bottom: e.target.value as Unterteil })}>
          {BOTTOMS.map((k) => <option key={k} value={k}>{bottomLabel(k)}</option>)}
        </select>
      </label>
      <label className="prop-field">
        <span>{t('person.shoes', 'Shoes')}</span>
        <select value={look.shoes ?? 'halbschuh'} onChange={(e) => setLook({ shoes: e.target.value as Schuhe })}>
          {SHOES.map((k) => <option key={k} value={k}>{shoeLabel(k)}</option>)}
        </select>
      </label>
      <div className="prop-field person-colours">
        <label><span>{t('person.topColour', 'Top colour')}</span>
          <input type="color" value={colour(shown.farben.oben)} onChange={(e) => setLook({ topColor: e.target.value })} /></label>
        <label><span>{t('person.bottomColour', 'Bottom colour')}</span>
          <input type="color" value={colour(shown.farben.unten)} onChange={(e) => setLook({ bottomColor: e.target.value })} /></label>
      </div>
      <span className="prop-sub">{t('person.skin', 'Skin tone')}</span>
      <div className="person-swatches" role="radiogroup" aria-label={t('person.skin', 'Skin tone')}>
        {SKIN_TONES.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={shown.farben.haut === c} aria-label={c}
            className={shown.farben.haut === c ? 'on' : ''} style={{ background: c }} onClick={() => setLook({ skin: c })} />
        ))}
      </div>
      <span className="prop-sub">{t('person.hair', 'Hair')}</span>
      <div className="person-swatches" role="radiogroup" aria-label={t('person.hairColour', 'Hair colour')}>
        {HAIR_COLOURS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={shown.farben.haar === c} aria-label={c}
            className={shown.farben.haar === c ? 'on' : ''} style={{ background: c }} onClick={() => setLook({ hair: c })} />
        ))}
      </div>
      <div className="reflectance-presets">
        {HAIR_LENGTHS.map((len, i) => (
          <button key={len} type="button" className={`refl-btn ${look.hairLength === len ? 'active' : ''}`} onClick={() => setLook({ hairLength: len })}>{hairLabel(i)}</button>
        ))}
      </div>
      {p.look && (
        <button type="button" className="refl-btn" onClick={() => onUpdate({ look: undefined })}>{t('person.lookReset', 'Reset look')}</button>
      )}
    </>
  );
};

export default PersonLookEditor;
