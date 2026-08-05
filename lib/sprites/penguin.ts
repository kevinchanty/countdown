import { walkFrames } from "../pixel";

const PENGUIN_COLORS: Record<string, string> = {
  ".": "transparent",
  K: "#000000",
  B: "#1a1a2e",
  W: "#ffffff",
  O: "#ff8c00",
  G: "#A5AAAE",
};
const BIGPENGUIN_COLORS: Record<string, string> = { ...PENGUIN_COLORS, G: "#ffffff" };

const PENGUIN_MAP = [
  "........KKKK....",
  ".......KWWWKK...",
  ".......KWWKWKO..",
  ".......KKWWWK...",
  ".......KKKKK....",
  "......KKKGGG....",
  "......KKKKGGG...",
  ".....KKKKKGGG...",
  "...KKKKKKKGGG...",
  "....KKKKKGGGG...",
  ".....KKGGGGGG...",
  "....KKGGGGGG....",
  ".....KKGGOOOO...",
];
const PENGUIN_MAP_B = [
  "........KKKK....",
  ".......KWWWKK...",
  ".......KWWKWKO..",
  ".......KKWWWK...",
  ".......KKKKK....",
  "......KKKGGG....",
  "......KKKKGGG...",
  ".....KKKKKGGG...",
  "...KKKKKKKGGG...",
  "....KKKKKGGGG...",
  ".....KKGGGGGG...",
  "....KKGGGGGG....",
  "...KKGGOOOO.....",
  "................",
];

export const PENGUIN_FRAMES = walkFrames(PENGUIN_MAP, PENGUIN_MAP_B, PENGUIN_COLORS);
export const BIGPEN_FRAMES = walkFrames(PENGUIN_MAP, PENGUIN_MAP_B, BIGPENGUIN_COLORS);
