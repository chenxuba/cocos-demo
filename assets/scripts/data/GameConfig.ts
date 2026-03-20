import { Color } from 'cc';

export const EMPTY_GEM = -1;
export const BOARD_PADDING = 16;
export const BOARD_TOP_OFFSET = -32;
export const BASE_MATCH_SCORE = 60;
export const CASCADE_SCORE_STEP = 0.35;

export const GEM_PALETTE = [
    new Color(255, 99, 132, 255),
    new Color(255, 179, 71, 255),
    new Color(255, 221, 89, 255),
    new Color(87, 214, 141, 255),
    new Color(72, 187, 255, 255),
    new Color(165, 120, 255, 255),
];

export const BOARD_THEME = {
    background: new Color(27, 35, 58, 255),
    panel: new Color(16, 21, 38, 235),
    panelStroke: new Color(94, 114, 173, 255),
    boardGlow: new Color(68, 92, 168, 255),
    cell: new Color(255, 255, 255, 18),
    textPrimary: new Color(244, 247, 255, 255),
    textSecondary: new Color(179, 189, 221, 255),
    accent: new Color(111, 225, 184, 255),
    danger: new Color(255, 107, 107, 255),
    warning: new Color(255, 211, 102, 255),
};

export const ANIMATION = {
    swap: 0.14,
    invalidSwap: 0.12,
    clear: 0.18,
    fall: 0.18,
    spawn: 0.2,
    comboPop: 0.28,
};
