export const TILE = 16;
/** 240p 16:9 (was 320×240 / 4:3). */
export const VIEW_W = 426;
export const VIEW_H = 240;
export const HUD_H = 24;

export const GRAVITY = 0.32;
export const HOLD_GRAVITY = 0.18;
export const MAX_FALL = 7.5;
export const WALK_ACCEL = 0.14;
export const RUN_ACCEL = 0.22;
export const MAX_WALK = 1.55;
/** Faster than camera SPEED so a sprint can catch the screen edge. */
export const MAX_RUN = 3.2;
export const FRICTION = 0.12;
export const AIR_FRICTION = 0.04;
export const JUMP_VEL = -7.15;
export const JUMP_CUT = -2.2;
export const STOMP_BOUNCE = -4.2;
export const COYOTE_MS = 90;
export const JUMP_BUFFER_MS = 120;
export const INVINCIBLE_MS = 2000;
export const STAR_MS = 6500;
export const GROW_MS = 30_000;
export const DEATH_BOUNCE = -7.5;
export const DEATH_GRAVITY = 0.38;

export const PLAYER_W = 12;
export const SMALL_H = 15;
export const BIG_H = 30;

export const IDLE_WALK_RESUME_MS = 3000;
export const VOLCANO_MS = 120_000;
/** Penguin/Toad/BigPen/Kirby wait this long after the flag is fully up before exiting. */
export const RUNNER_EXIT_DELAY_MS = 60_000;
export const DEATH_RESPAWN_MS = 5000;
export const DEATH_FREEZE_MS = 400;
export const DEATH_BOUNCE_VY = -8.5;
export const CASTLE_DOOR_X = 36;
export const SPEED = 2.0;
export const MOVE_SPEED = 3.2;
export const JUMP_DUR = 720;
export const JUMP_HEIGHT = 84;
export const BB_SCREEN_X = 16;
// Auto-jump must trigger just before the hole edge reaches the runner's feet:
// at SPEED=2px/frame a 2-tile pit is underfoot for ~650ms and the jump lasts
// JUMP_DUR=720ms, so jumping too early (old 110px lead) lands the runner
// back inside the pit. ~10px gives the parabola full coverage.
export const HOLE_AUTO_LEAD = 10;
export const HOLE_COUNT = 2;
export const randomHoleGap = () => 780 + Math.random() * 920;

export const RUNNER_DEFS = [
  { name: "北小企", kind: "penguin" as const, xRatio: 0.18, exitDelay: 0, startsCountUp: false, scale: 1 },
  { name: "Kevin", kind: "toad" as const, xRatio: 0.32, exitDelay: 700, startsCountUp: false, scale: 1 },
  { name: "Chris", kind: "bigpen" as const, xRatio: 0.48, exitDelay: 1400, startsCountUp: false, scale: 1 },
  { name: "Sophia", kind: "kirby" as const, xRatio: 0.64, exitDelay: 2100, startsCountUp: true, scale: 1 },
];

export const COLORS = {
  sky: "#5c94fc",
  skyTop: "#3f7efc",
  skyHorizon: "#8cbcfc",
  hud: "#000000",
  white: "#fcfcfc",
  black: "#000000",
  ground: "#c84c0c",
  groundDark: "#8c3c00",
  groundLight: "#e88c4c",
  grass: "#00a800",
  grassDark: "#007800",
  grassLight: "#80d010",
  brick: "#c84c0c",
  brickLine: "#fcbcb0",
  brickDark: "#7c2800",
  question: "#fcbc3c",
  questionDark: "#ac7c00",
  questionLight: "#fce4a0",
  used: "#c84c0c",
  pipe: "#00a800",
  pipeDark: "#005800",
  pipeLip: "#80d010",
  hard: "#fcbcb0",
  hardDark: "#c84c0c",
  flag: "#00a800",
  flagCloth: "#e52521",
  castle: "#c8c8c8",
  castleDark: "#7c7c7c",
  castleLight: "#f4f4f4",
  castleDoor: "#000000",
  hill: "#00a800",
  hillDark: "#005800",
  bush: "#00b800",
  bushDark: "#007800",
  cloud: "#fcfcfc",
  cloudShade: "#bcdcf8",
};
