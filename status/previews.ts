import type { GameKey } from './games/types';

/** Small illustrative boards for the 2×2 launcher, drawn with theme tokens. */
export const PREVIEWS: Record<GameKey, string> = {
  snake: `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">
    <rect width="160" height="90" fill="var(--oc-bg, #111113)" />
    <g fill="var(--oc-border, #2e2e33)">
      <circle cx="16" cy="16" r="1" /><circle cx="48" cy="16" r="1" /><circle cx="80" cy="16" r="1" /><circle cx="112" cy="16" r="1" /><circle cx="144" cy="16" r="1" />
      <circle cx="16" cy="48" r="1" /><circle cx="48" cy="48" r="1" /><circle cx="80" cy="48" r="1" /><circle cx="112" cy="48" r="1" /><circle cx="144" cy="48" r="1" />
      <circle cx="16" cy="78" r="1" /><circle cx="48" cy="78" r="1" /><circle cx="80" cy="78" r="1" /><circle cx="112" cy="78" r="1" /><circle cx="144" cy="78" r="1" />
    </g>
    <g fill="var(--oc-primary, #e5e5e5)">
      <rect x="40" y="44" width="12" height="12" rx="3.5" opacity=".42" />
      <rect x="54" y="44" width="12" height="12" rx="3.5" opacity=".56" />
      <rect x="68" y="44" width="12" height="12" rx="3.5" opacity=".7" />
      <rect x="82" y="44" width="12" height="12" rx="3.5" opacity=".84" />
      <rect x="96" y="44" width="12" height="12" rx="4" />
    </g>
    <circle cx="101" cy="48.5" r="1.1" fill="var(--oc-bg, #111113)" />
    <circle cx="101" cy="51.5" r="1.1" fill="var(--oc-bg, #111113)" />
    <circle cx="130" cy="32" r="5.5" fill="var(--oc-success, #22c55e)" />
    <circle cx="130" cy="32" r="9" fill="var(--oc-success, #22c55e)" opacity=".16" />
  </svg>`,
  flappy: `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">
    <rect width="160" height="90" fill="var(--oc-bg, #111113)" />
    <g fill="var(--oc-muted-surface, #232327)">
      <circle cx="26" cy="22" r="6" /><circle cx="34" cy="19" r="8" /><circle cx="44" cy="23" r="5" />
      <circle cx="112" cy="16" r="5" /><circle cx="119" cy="13" r="6.5" /><circle cx="127" cy="17" r="4" />
    </g>
    <g fill="var(--oc-success, #22c55e)">
      <rect x="106" y="-8" width="22" height="36" rx="4" opacity=".9" />
      <rect x="106" y="56" width="22" height="34" rx="4" opacity=".9" />
    </g>
    <g fill="var(--oc-bg, #111113)" opacity=".3">
      <rect x="123" y="0" width="4" height="28" />
      <rect x="123" y="56" width="4" height="30" />
    </g>
    <line x1="0" y1="76" x2="160" y2="76" stroke="var(--oc-border, #2e2e33)" stroke-width="2" />
    <g fill="var(--oc-muted-surface, #232327)" opacity=".55">
      <rect x="0" y="78" width="160" height="12" />
    </g>
    <circle cx="56" cy="44" r="9" fill="var(--oc-primary, #e5e5e5)" />
    <circle cx="60" cy="41" r="2.4" fill="var(--oc-bg, #111113)" />
    <path d="M64 44l11 3.4L64 51z" fill="var(--oc-warning, #f59e0b)" />
  </svg>`,
  '2048': `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">
    <rect width="160" height="90" fill="var(--oc-bg, #111113)" />
    <g font-family="var(--oc-font, sans-serif)" font-size="9" font-weight="700" text-anchor="middle">
      <rect x="14" y="14" width="30" height="30" rx="4" fill="var(--oc-fg, #f4f4f5)" opacity=".07" /><text x="29" y="34" fill="var(--oc-fg, #f4f4f5)">2</text>
      <rect x="48" y="14" width="30" height="30" rx="4" fill="var(--oc-fg, #f4f4f5)" opacity=".11" /><text x="63" y="34" fill="var(--oc-fg, #f4f4f5)">4</text>
      <rect x="82" y="14" width="30" height="30" rx="4" fill="var(--oc-primary, #e5e5e5)" opacity=".22" /><text x="97" y="34" fill="var(--oc-fg, #f4f4f5)">8</text>
      <rect x="116" y="14" width="30" height="30" rx="4" fill="var(--oc-primary, #e5e5e5)" opacity=".34" /><text x="131" y="34" fill="var(--oc-fg, #f4f4f5)">16</text>
      <rect x="14" y="48" width="30" height="30" rx="4" fill="var(--oc-primary, #e5e5e5)" opacity=".42" /><text x="29" y="68" fill="var(--oc-primary-fg, #111113)">32</text>
      <rect x="48" y="48" width="30" height="30" rx="4" fill="var(--oc-primary, #e5e5e5)" opacity=".54" /><text x="63" y="68" fill="var(--oc-primary-fg, #111113)">64</text>
      <rect x="82" y="48" width="30" height="30" rx="4" fill="var(--oc-primary, #e5e5e5)" opacity=".68" /><text x="97" y="68" fill="var(--oc-primary-fg, #111113)">128</text>
      <rect x="116" y="48" width="30" height="30" rx="4" fill="var(--oc-primary, #e5e5e5)" /><text x="131" y="68" fill="var(--oc-primary-fg, #111113)">256</text>
    </g>
  </svg>`,
  dino: `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice">
    <rect width="160" height="90" fill="var(--oc-bg, #111113)" />
    <g fill="var(--oc-muted-surface, #232327)" opacity=".5">
      <circle cx="112" cy="20" r="5" /><circle cx="119" cy="17" r="6.5" /><circle cx="127" cy="21" r="4" />
    </g>
    <line x1="0" y1="76" x2="160" y2="76" stroke="var(--oc-border, #2e2e33)" stroke-width="2" />
    <g fill="var(--oc-primary, #e5e5e5)">
      <rect x="34" y="48" width="22" height="22" rx="4" />
      <rect x="48" y="40" width="16" height="15" rx="4" />
      <rect x="61" y="46" width="8" height="6" rx="2" />
      <rect x="28" y="53" width="10" height="8" rx="3" />
      <rect x="38" y="69" width="5" height="9" rx="1.5" />
      <rect x="49" y="69" width="5" height="7" rx="1.5" />
    </g>
    <rect x="58" y="44" width="2.4" height="2.4" fill="var(--oc-bg, #111113)" />
    <g fill="var(--oc-primary, #e5e5e5)" opacity=".55">
      <rect x="116" y="54" width="8" height="22" rx="3" />
      <rect x="110" y="60" width="7" height="5" rx="2" />
      <rect x="110" y="63" width="4" height="8" rx="2" />
      <rect x="123" y="64" width="7" height="5" rx="2" />
      <rect x="126" y="66" width="4" height="7" rx="2" />
    </g>
  </svg>`,
};
