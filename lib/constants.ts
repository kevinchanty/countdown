import type { DecoConfig } from "./types";

export const LOOPING_STRING = "FISH, JASON ARE FREE!!!XDDDDD";
export const ENDING_STRING = "Congratulations!!!!!! You made it!";
// Change this variable to set when the countdown ends.
export const COUNTDOWN_END = new Date("2026-08-31T18:05:00");

export const BLOCK_COUNT = 3;
export const DECO_SPAN = 2400;

export const CHAR_W = 36;
export const CHAR_H = 45;
export const SPEED = 2.0;
export const BLOCK_W = 46;
export const BLOCK_LIFT = 58;
export const JUMP_DUR = 720;
export const JUMP_HEIGHT = 84;
export const STAR_POWER_MS = 5500;
export const VOLCANO_MS = 120_000;
export const BB_SCREEN_X = 48;
export const RUNNER_W = 16 * 3; // 16 * PIXEL

export const DECO: DecoConfig[] = [
  { startX: 240, kind: "hill", parallax: 0.4 },
  { startX: 520, kind: "cloud", parallax: 0.15, top: "10%" },
  { startX: 820, kind: "bush", parallax: 0.75 },
  { startX: 1120, kind: "cloud", parallax: 0.15, top: "24%" },
  { startX: 1420, kind: "hill", parallax: 0.4 },
  { startX: 1700, kind: "cloud", parallax: 0.15, top: "14%" },
  { startX: 1980, kind: "bush", parallax: 0.75 },
];

export const randomGap = () => 520 + Math.random() * 640;
