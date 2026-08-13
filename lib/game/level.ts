export const T = {
  EMPTY: 0,
  GROUND: 1,
  BRICK: 2,
  QCOIN: 3,
  QMUSH: 4,
  QSTAR: 5,
  USED: 6,
  PIPE: 7,
  PIPETOP: 8,
  HARD: 9,
  FLAG: 10,
} as const;

export type TileId = (typeof T)[keyof typeof T];

export type Deco = {
  kind: "cloud" | "hill" | "bush";
  x: number;
  y: number;
  variant?: number;
};

export type Level = {
  w: number;
  h: number;
  tiles: Uint8Array;
  goombas: Array<{ x: number; y: number }>;
  coins: Array<{ x: number; y: number }>;
  deco: Deco[];
  spawn: { x: number; y: number };
  checkpoint: { x: number; y: number };
  flagX: number;
  castleX: number;
  lastPit: boolean;
};

export function isSolid(t: number): boolean {
  return (
    t === T.GROUND ||
    t === T.BRICK ||
    t === T.QCOIN ||
    t === T.QMUSH ||
    t === T.QSTAR ||
    t === T.USED ||
    t === T.PIPE ||
    t === T.PIPETOP ||
    t === T.HARD
  );
}

export function isBumpable(t: number): boolean {
  return t === T.BRICK || t === T.QCOIN || t === T.QMUSH || t === T.QSTAR || t === T.USED;
}

export function tileAt(level: Level, tx: number, ty: number): number {
  if (ty < 0) return T.EMPTY;
  if (tx < 0) return T.HARD;
  if (ty >= level.h || tx >= level.w) return T.EMPTY;
  return level.tiles[ty * level.w + tx];
}

export function setTile(level: Level, tx: number, ty: number, t: number) {
  if (tx < 0 || ty < 0 || tx >= level.w || ty >= level.h) return;
  level.tiles[ty * level.w + tx] = t;
}

/** Inclusive tile columns of World 1-1 pits: two 2-tile gaps and two 3-tile gaps. */
export const PHASE1_PITS: Array<[number, number]> = [
  [48, 49],
  [70, 72],
  [128, 129],
  [148, 150],
];

export const PHASE1_PIT_TILES = PHASE1_PITS.map(([a, b]) => b - a + 1);

export function randomPhase1PitTiles() {
  return PHASE1_PIT_TILES[Math.floor(Math.random() * PHASE1_PIT_TILES.length)];
}

export type LevelSpawned = {
  goombas: Array<{ x: number; y: number }>;
  coins: Array<{ x: number; y: number }>;
  deco: Deco[];
};

function randInt(a: number, b: number) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

function growTo(level: Level, newW: number) {
  if (newW <= level.w) return;
  const tiles = new Uint8Array(newW * level.h);
  for (let y = 0; y < level.h; y++) {
    tiles.set(level.tiles.subarray(y * level.w, y * level.w + level.w), y * newW);
  }
  level.tiles = tiles;
  level.w = newW;
}

function setColGround(level: Level, tx: number, pit: boolean) {
  const gy = level.h - 2;
  level.tiles[gy * level.w + tx] = pit ? T.EMPTY : T.GROUND;
  level.tiles[(gy + 1) * level.w + tx] = pit ? T.EMPTY : T.GROUND;
}

function clearAbove(level: Level, tx: number) {
  const gy = level.h - 2;
  for (let y = 0; y < gy; y++) level.tiles[y * level.w + tx] = T.EMPTY;
}

function addDeco(spawned: LevelSpawned, x: number, h: number) {
  const ground = (h - 2) * 16;
  const roll = Math.random();
  if (roll < 0.34) spawned.deco.push({ kind: "cloud", x: x + randInt(0, 40), y: 22 + randInt(0, 36), variant: randInt(0, 1) });
  else if (roll < 0.67) spawned.deco.push({ kind: "hill", x: x + randInt(0, 24), y: ground, variant: randInt(0, 1) });
  else spawned.deco.push({ kind: "bush", x: x + randInt(0, 24), y: ground, variant: randInt(0, 2) });
}

function appendCols(level: Level, n: number, pit: boolean) {
  const x0 = level.w;
  growTo(level, x0 + n);
  for (let i = 0; i < n; i++) {
    clearAbove(level, x0 + i);
    setColGround(level, x0 + i, pit);
  }
  return x0;
}

function placePipe(level: Level, x: number, height: number) {
  const gy = level.h - 2;
  const top = gy - height;
  if (x + 1 >= level.w) return;
  for (let y = top; y < gy; y++) {
    level.tiles[y * level.w + x] = y === top ? T.PIPETOP : T.PIPE;
    level.tiles[y * level.w + x + 1] = y === top ? T.PIPETOP : T.PIPE;
  }
}

function appendRandomChunk(level: Level, spawned: LevelSpawned, lastPit: boolean): boolean {
  const gy = (level.h - 2) * 16;
  const roll = Math.random();
  const wantPit = !lastPit && roll < 0.18;
  if (wantPit) {
    const lead = randInt(5, 8);
    const pitW = randomPhase1PitTiles();
    const trail = randInt(5, 8);
    const x0 = appendCols(level, lead + pitW + trail, false);
    for (let i = 0; i < pitW; i++) setColGround(level, x0 + lead + i, true);
    addDeco(spawned, x0 * 16, level.h);
    return true;
  }
  if (roll < 0.4) {
    const n = randInt(10, 16);
    const x0 = appendCols(level, n, false);
    const hx = x0 + randInt(2, Math.max(2, n - 4));
    placePipe(level, hx, randInt(2, 4));
    if (Math.random() < 0.55) {
      spawned.goombas.push({ x: (x0 + 1) * 16, y: gy - 16 });
    }
    addDeco(spawned, x0 * 16, level.h);
    return false;
  }
  if (roll < 0.68) {
    const n = randInt(10, 18);
    const x0 = appendCols(level, n, false);
    const bx = x0 + randInt(1, 3);
    const len = randInt(2, Math.min(5, n - (bx - x0) - 1));
    const tiles = [T.BRICK, T.QCOIN, T.BRICK, T.QMUSH, T.QCOIN, T.BRICK];
    const rowY = Math.random() < 0.25 ? 5 : 9;
    for (let i = 0; i < len; i++) {
      const t = tiles[(i + randInt(0, 2)) % tiles.length];
      level.tiles[rowY * level.w + bx + i] = t;
    }
    if (Math.random() < 0.45) {
      for (let i = 0; i < len; i++) {
        spawned.coins.push({ x: (bx + i) * 16 + 4, y: (rowY - 1) * 16 + 4 });
      }
    }
    if (Math.random() < 0.4) spawned.goombas.push({ x: (x0 + n - 3) * 16, y: gy - 16 });
    addDeco(spawned, x0 * 16, level.h);
    return false;
  }
  if (roll < 0.82) {
    const n = randInt(10, 14);
    const x0 = appendCols(level, n, false);
    const px = x0 + randInt(1, 3);
    const plen = randInt(3, 5);
    for (let i = 0; i < plen; i++) level.tiles[8 * level.w + px + i] = T.HARD;
    for (let i = 0; i < plen; i++) spawned.coins.push({ x: (px + i) * 16 + 4, y: 7 * 16 + 4 });
    addDeco(spawned, x0 * 16, level.h);
    return false;
  }
  const n = randInt(8, 16);
  const x0 = appendCols(level, n, false);
  if (Math.random() < 0.7) spawned.goombas.push({ x: (x0 + randInt(2, n - 2)) * 16, y: gy - 16 });
  if (Math.random() < 0.45) spawned.goombas.push({ x: (x0 + randInt(2, n - 2)) * 16, y: gy - 16 });
  if (Math.random() < 0.5) {
    const c0 = x0 + randInt(1, 3);
    const cn = randInt(2, 4);
    for (let i = 0; i < cn; i++) spawned.coins.push({ x: (c0 + i) * 16 + 4, y: 8 * 16 + 4 });
  }
  addDeco(spawned, x0 * 16, level.h);
  return false;
}

/** Generate terrain until the level is at least `minW` tiles wide. */
export function extendLevel(level: Level, minW: number): LevelSpawned {
  const spawned: LevelSpawned = { goombas: [], coins: [], deco: [] };
  let guard = 0;
  while (level.w < minW && guard < 80) {
    level.lastPit = appendRandomChunk(level, spawned, level.lastPit);
    guard++;
  }
  return spawned;
}

/** Fill a span with open ground so the ending castle door is walkable. */
export function paveGround(level: Level, tx0: number, tx1: number) {
  if (tx1 < tx0) return;
  growTo(level, tx1 + 1);
  for (let tx = Math.max(0, tx0); tx <= tx1; tx++) {
    clearAbove(level, tx);
    setColGround(level, tx, false);
  }
}

function fillGround(tiles: Uint8Array, w: number, h: number, pits: Array<[number, number]>) {
  const groundY = h - 2;
  for (let x = 0; x < w; x++) {
    const pit = pits.some(([a, b]) => x >= a && x <= b);
    if (pit) continue;
    tiles[groundY * w + x] = T.GROUND;
    tiles[(groundY + 1) * w + x] = T.GROUND;
  }
}

function row(tiles: Uint8Array, w: number, x: number, y: number, pattern: number[]) {
  pattern.forEach((t, i) => {
    if (t) tiles[y * w + x + i] = t;
  });
}

export function buildLevel(): Level {
  const w = 32;
  const h = 15;
  const tiles = new Uint8Array(w * h);
  fillGround(tiles, w, h, []);

  tiles[9 * w + 16] = T.QCOIN;
  row(tiles, w, 20, 9, [T.BRICK, T.QCOIN, T.BRICK, T.QMUSH, T.BRICK]);
  tiles[5 * w + 22] = T.QCOIN;

  const goombas = [22].map((x) => ({
    x: x * 16,
    y: (h - 2) * 16 - 16,
  }));

  const coins = [
    [17, 8],
    [24, 8],
  ].map(([x, y]) => ({ x: x * 16 + 4, y: y * 16 + 4 }));

  const deco: Deco[] = [
    { kind: "cloud", x: 40, y: 28, variant: 0 },
    { kind: "hill", x: 70, y: (h - 2) * 16, variant: 0 },
    { kind: "bush", x: 120, y: (h - 2) * 16, variant: 1 },
  ];

  return {
    w,
    h,
    tiles,
    goombas,
    coins,
    deco,
    spawn: { x: 3 * 16, y: (h - 2) * 16 - 15 },
    checkpoint: { x: 16 * 16, y: (h - 2) * 16 - 15 },
    flagX: 0,
    castleX: 0,
    lastPit: false,
  };
}
