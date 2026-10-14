import React from 'react';

// Das Signet „lz." als Inline-SVG, damit es seine Farbe aus `--logo` nimmt:
// Navy auf Hell, Off-White auf Dunkel — NUR Kit-Farben, nie der UI-Akzent.
// Der Punkt ist immer das Signal. Die Kontur ist die aus dem Kit
// (`public/brand/lzm_signet_*_tally.svg`), unveraendert und eckig.
const Signet: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="478.129 455.570 234.046 139.875" aria-hidden="true" focusable="false">
    <path
      style={{ fill: 'var(--logo)' }}
      d="M 478.128906 595.445312 L 505.285156 455.570312 L 540.207031 455.570312 L 513.046875 595.445312 Z M638.277 595.445 L555.828 595.445 L561.062 568.285 L610.922 521.727 L570.183 521.727 L575.422 494.566 L657.871 494.566 L652.633 521.727 L602.773 568.285 L643.515 568.285 Z"
    />
    <path style={{ fill: 'var(--signal)' }} d="M677.011 595.445 681.538 565.865 H712.175 L707.647 595.445 Z" />
  </svg>
);

export default Signet;
