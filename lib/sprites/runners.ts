import type { RunnerConfig } from "../types";
import { BIGPEN_FRAMES, PENGUIN_FRAMES } from "./penguin";
import { TOAD_FRAMES } from "./toad";
import { KIRBY_FRAMES } from "./kirby";

export const RUNNERS: RunnerConfig[] = [
  { name: "Penguin", frames: PENGUIN_FRAMES, xRatio: 0.16, exitDelay: 0, framePhase: 0, startsCountUp: false },
  { name: "Toad", frames: TOAD_FRAMES, xRatio: 0.24, exitDelay: 700, framePhase: 0.4, startsCountUp: false },
  { name: "BigPen", frames: BIGPEN_FRAMES, xRatio: 0.32, exitDelay: 1400, framePhase: 0.7, startsCountUp: false },
  { name: "Kirby", frames: KIRBY_FRAMES, xRatio: 0.4, exitDelay: 2100, framePhase: 1.3, startsCountUp: true },
];
