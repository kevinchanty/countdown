import { walkFrames } from "../pixel";

const KIRBY_COLORS: Record<string, string> = {
  ".": "transparent",
  B: "#000000",
  P: "#ff8ab4",
  L: "#ffbada",
  D: "#d15886",
  C: "#e81e69",
  W: "#ffffff",
  E: "#231121",
  R: "#d80038",
  K: "#6c0019",
};
const KIRBY_BODY = [
  "......BBBBB.....",
  "....BBDLLLDB....",
  "...BDLLLLLLLLB..",
  "..BDLLWBLWBLLB..",
  "..BLLLWBLWBLLLB.",
  ".BLLLLLBLLBLLLB.",
  "BDLLLDDLLLDDLLB.",
  "BLLDLLLLBLLLLLB.",
  "BLLDLLLLBLLLLB..",
  ".BLLLLLLLLLLBB..",
  "..BBLLLLLLLBB...",
];
const KIRBY_WALK_A_FEET = [
  "...BBLLLLLBB....",
  "...BBRRRRRRKB...",
  "...BRRRRRRRRK...",
  "...BKKKKKKKKB...",
  "....BBBBBBBB....",
];
const KIRBY_WALK_B_FEET = [
  "...BLLLLLLBB....",
  "..BRRKB..BRRKB..",
  ".BKKKB....BKKKB.",
  "BBBB.......BBBB.",
  "................",
];

export const KIRBY_FRAMES = walkFrames(
  [...KIRBY_BODY, ...KIRBY_WALK_A_FEET],
  [...KIRBY_BODY, ...KIRBY_WALK_B_FEET],
  KIRBY_COLORS,
);
