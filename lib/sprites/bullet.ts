import { buildShadow, PIXEL } from "../pixel";

const BULLET_COLORS: Record<string, string> = {
  ".": "transparent",
  B: "#000000",
  G: "#4a4a4a",
  W: "#ffffff",
  E: "#000000",
  R: "#e52521",
};
const BB_MAP = [
  "......BBBBBBBBBB....",
  "....BBBBBBBWWWWWBB..",
  "..BBBBBBBBBBBBBBBBBB",
  ".BBBBBGBBBBBBBBBBBBB",
  ".BBBBBGBBBBBBBBBBBBB",
  ".BBBBBGBBBBBBBBWBBBB",
  ".BBBBBGBBBBBBBWWEBBB",
  ".BBBBBGBBBBBBWWWWBBB",
  ".BBBBBGBBBBBBBBBBBBB",
  ".BBBBBGBBBBBRRWRWRWR",
  ".BBBBBGBBBBBBWRRRRRB",
  ".BBBBBGBBBBBBBRRRRRB",
  "..BBBBGBBBBBBBBWRRB.",
  "....BBGBBBBBBBBBBB..",
  "......BBBBBBBBBB....",
  "....................",
];
export const BB_SHADOW = buildShadow(BB_MAP, BULLET_COLORS, PIXEL);
export const BB_W = 20 * PIXEL;
