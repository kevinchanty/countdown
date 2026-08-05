import { buildShadow, PIXEL, type JumpFrames } from "../pixel";
import type { CharacterConfig } from "../types";

const COLORS: Record<string, string> = {
  R: "#e52521",
  H: "#5a2d0c",
  S: "#f9b97f",
  O: "#2057d6",
  M: "#3a1d0a",
  ".": "transparent",
};
const LUIGI_COLORS: Record<string, string> = { ...COLORS, R: "#22b14c" };

const BODY = [
  "...RRRRR....",
  "..RRRRRRRRR.",
  "..HHHSSMS...",
  ".HSHSSSMSS..",
  ".HSHHSSSMSSS",
  ".HHSSSSMMMM.",
  "...SSSSSSS..",
  "..RRORRR....",
  ".RRRORRORRR.",
  "RRRROOOORRRR",
  "SSRO.OO.ORSS",
  "SSSOOOOOOSSS",
];
const LEGS_RUN_A = ["..OO....OO..", "..HH....HH..", ".HHH....HHH."];
const LEGS_RUN_B = ["..OOO..OOO..", "...HH..HH...", "..HHH..HHH.."];
const LEGS_JUMP = [".OOO....OOO.", "..HH....HH..", ".HHH....HHH."];

function buildFrames(colors: Record<string, string>): JumpFrames {
  return {
    A: buildShadow([...BODY, ...LEGS_RUN_A], colors, PIXEL),
    B: buildShadow([...BODY, ...LEGS_RUN_B], colors, PIXEL),
    JUMP: buildShadow([...BODY, ...LEGS_JUMP], colors, PIXEL),
  };
}

export const MARIO_FRAMES = buildFrames(COLORS);
export const LUIGI_FRAMES = buildFrames(LUIGI_COLORS);

export const CHARACTERS: CharacterConfig[] = [
  { name: "Fish", xRatio: 0.34, frames: MARIO_FRAMES },
  { name: "Jason", xRatio: 0.22, frames: LUIGI_FRAMES },
];
