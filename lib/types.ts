import type { JumpFrames, WalkFrames } from "./pixel";

export type BlockState = { worldX: number; hit: boolean; jumper: number };

export type Star = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  born: number;
  target: number;
};

export type RunnerState = {
  active: boolean;
  x: number;
  lastFrame: string;
  emerged: boolean;
  startAt: number;
};

export enum EndingPhase {
  Approach = "approach",
  Enter = "enter",
  Flag = "flag",
  Done = "done",
  Aftermath = "aftermath",
}

export type CharacterConfig = {
  name: string;
  xRatio: number;
  frames: JumpFrames;
};

export type RunnerConfig = {
  name: string;
  frames: WalkFrames;
  xRatio: number;
  exitDelay: number;
  framePhase: number;
  startsCountUp: boolean;
};

export type DecoConfig = {
  startX: number;
  kind: "hill" | "cloud" | "bush";
  parallax: number;
  top?: string;
};

export function makeRunner(): RunnerState {
  return { active: false, x: 0, lastFrame: "", emerged: false, startAt: 0 };
}
