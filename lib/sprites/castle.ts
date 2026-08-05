import { buildShadow } from "../pixel";

export const CASTLE_PIXEL = 4;
const CASTLE_COLORS: Record<string, string> = {
  W: "#cfcfcf",
  K: "#2b2b2b",
  ".": "transparent",
};
const CASTLE_MAP = [
  "..........WW.WW...........",
  "..........WWWWWW..........",
  "..........WWWWWW..........",
  "..........WWKKWW..........",
  "..........WWKKWW..........",
  "..........WWWWWW..........",
  "..WW..WW..WWWWWW..WW..WW..",
  "..WWWWWWWWWWWWWWWWWWWWWW..",
  "..WWWWWWWWWWWWWWWWWWWWWW..",
  "..WWWKKWWWWWWWWWWKKWWWWW..",
  "..WWWKKWWWWWWWWWWKKWWWWW..",
  "..WWWWWWWWWWWWWWWWWWWWWW..",
  "..WWWWWWWWWWWWWWWWWWWWWW..",
  "..WWWWWWWWWWKKKKWWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
  "..WWWWWWWWWKKKKKKWWWWWWW..",
];
export const CASTLE_SHADOW = buildShadow(CASTLE_MAP, CASTLE_COLORS, CASTLE_PIXEL);
export const DOOR_X = 13.5 * CASTLE_PIXEL;
