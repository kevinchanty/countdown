import { walkFrames } from "../pixel";

const TOAD_COLORS: Record<string, string> = {
  ".": "transparent",
  R: "#e52521",
  W: "#ffffff",
  T: "#f9c89b",
  K: "#000000",
  B: "#2057d6",
  N: "#8b4513",
};
const TOAD_MAP = [
  "....KKKKKKKK....",
  "...KWWWRRWWWK...",
  "..KRRWWRRWWRRK..",
  ".KRRWWWWWWWWRRK.",
  "KRWWWWKKKKKWWWRK",
  "KWWWKTTTTTTKWWWK",
  ".KWKTTKTTKTTKWK.",
  "..KTTTTKKTTTTK..",
  "...KTTTTTTTTK...",
  "....KKKKKKKK....",
  "..KKBBTTTTTBKK..",
  ".KTKBBBTTTBBKTK.",
  "KTTKBBBKKKBBKTTK",
  ".K.KKKKWWWKKK.K.",
  "..KWWWWWWWWWK...",
  "...KNNNKNNNK....",
  "..KNNNNKNNNNK...",
  "...KKKKKKKKK....",
];
const TOAD_MAP_B = [
  "....KKKKKKKK....",
  "...KWWWRRWWWK...",
  "..KRRWWRRWWRRK..",
  ".KRRWWWWWWWWRRK.",
  "KRWWWWKKKKKWWWRK",
  "KWWWKTTTTTTKWWWK",
  ".KWKTTKTTKTTKWK.",
  "..KTTTTKKTTTTK..",
  "...KTTTTTTTTK...",
  "....KKKKKKKK....",
  "..KKBBTTTTTBKK..",
  ".KTKBBBTTTBBKTK.",
  "KTTKBBBKKKBBKTTK",
  ".K.KKKKWWWKKK.K.",
  "..KWWWWWWWWWK...",
  ".KNNNK....KNNK..",
  "KNNNNK...KNNNNK.",
  ".KKKK.....KKKK..",
];

export const TOAD_FRAMES = walkFrames(TOAD_MAP, TOAD_MAP_B, TOAD_COLORS);
