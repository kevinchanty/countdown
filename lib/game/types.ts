export type CharacterId = "fish" | "jason";

export type GameMode = "playing" | "ending";

export type EndingPhase = "approach" | "enter" | "flag" | "emerge" | "volcano";

export type Player = {
  id: CharacterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;
  big: boolean;
  grounded: boolean;
  skidding: boolean;
  invUntil: number;
  starUntil: number;
  bigUntil: number;
  coyoteUntil: number;
  jumpBufUntil: number;
  jumpHeld: boolean;
  dead: boolean;
  deathY: number;
  deathVy: number;
  deathStart: number;
  respawnAt: number;
  anim: number;
  inside: boolean;
  fade: number;
};

export type RunnerKind = "penguin" | "toad" | "bigpen" | "kirby";

export type DeathKind = "bounce" | "pit";

export type Runner = {
  name: string;
  kind: RunnerKind;
  x: number;
  y: number;
  w: number;
  h: number;
  facing: 1 | -1;
  jumping: boolean;
  jumpStart: number;
  anim: number;
  scale: number;
  xRatio: number;
  startAt: number;
  emerged: boolean;
  active: boolean;
  startsCountUp: boolean;
  opacity: number;
  safeUntil: number;
  big: boolean;
  starUntil: number;
  bigUntil: number;
  dead: boolean;
  deathKind: DeathKind;
  deathStart: number;
  deathY: number;
  deathVy: number;
  respawnAt: number;
};

export type HoleState = { worldX: number; tiles: number };

export type Goomba = {
  x: number;
  y: number;
  vx: number;
  w: number;
  h: number;
  flatUntil: number;
  dead: boolean;
  falling: boolean;
  vy: number;
};

export type Pickup = {
  kind: "mushroom" | "star" | "coinpop";
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  life: number;
  born: number;
};

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
  maxLife?: number;
  nog?: boolean;
  tw?: boolean;
};

export type Bump = { tx: number; ty: number; start: number };

export type WorldCoin = { x: number; y: number; taken: boolean };

export type VolcanoBlock = { worldX: number; ty: number; tile: number; hit: boolean };
