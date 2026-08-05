"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";

const LOOPING_STRING = "FISH, JASON ARE FREE!!!XDDDDD";
const ENDING_STRING = "Congratulations!!!!!! You made it!";
// Change this variable to set when the countdown ends.
const COUNTDOWN_END = new Date("2026-08-31T18:05:00");

/* ---------- Pixel characters (via box-shadow) ---------- */
const PIXEL = 3;
const COLORS: Record<string, string> = {
  R: "#e52521", // Mario red
  H: "#5a2d0c", // hair / shoes
  S: "#f9b97f", // skin
  O: "#2057d6", // overalls
  M: "#3a1d0a", // dark (mustache / eyes)
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

function buildShadow(rows: string[], colors: Record<string, string>, px: number): string {
  const shadows: string[] = [];
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      const color = colors[row[c]];
      if (!color || color === "transparent") continue;
      shadows.push(`${c * px}px ${r * px}px 0 0 ${color}`);
    }
  });
  return shadows.join(", ");
}

function buildFrames(colors: Record<string, string>) {
  return {
    A: buildShadow([...BODY, ...LEGS_RUN_A], colors, PIXEL),
    B: buildShadow([...BODY, ...LEGS_RUN_B], colors, PIXEL),
    JUMP: buildShadow([...BODY, ...LEGS_JUMP], colors, PIXEL),
  };
}

const MARIO_FRAMES = buildFrames(COLORS);
const LUIGI_FRAMES = buildFrames(LUIGI_COLORS);

const CHARACTERS = [
  { name: "Fish", xRatio: 0.34, frames: MARIO_FRAMES },
  { name: "Jason", xRatio: 0.22, frames: LUIGI_FRAMES },
];

/* ---------- Castle (end-of-level) ---------- */
const CASTLE_PIXEL = 4;
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
const CASTLE_SHADOW = buildShadow(CASTLE_MAP, CASTLE_COLORS, CASTLE_PIXEL);
const DOOR_X = 13.5 * CASTLE_PIXEL; // door center from castle left = 54

/* ---------- Bullet Bill Pixel Character ---------- */
const BULLET_COLORS: Record<string, string> = {
  ".": "transparent",
  B: "#000000", // Black body & outline
  G: "#4a4a4a", // Dark gray band / groove
  W: "#ffffff", // White highlight, eye, & teeth
  E: "#000000", // Pupil / angry brow
  R: "#e52521", // Red mouth cavity
};

// 20x16 pixel map drawn facing right (matching the image)
const BB_MAP = [
  "......BBBBBBBBBB....",
  "....BBBBBBBWWWWWBB..",
  "..BBBBBBBBBBBBBBBBBB",
  ".BBBBBGBBBBBBBBBBBBB",
  ".BBBBBGBBBBBBBBBBBBB",
  ".BBBBBGBBBBBBBBWBBBB",
  ".BBBBBGBBBBBBBWWEBBB",
  ".BBBBBGBBBBBBWWWWBBB",
  ".BBBBBGBBBBBBBBBBBBB",
  ".BBBBBGBBBBBRRWRWRWR",
  ".BBBBBGBBBBBBWRRRRRB",
  ".BBBBBGBBBBBBBRRRRRB",
  "..BBBBGBBBBBBBBWRRB.",
  "....BBGBBBBBBBBBBB..",
  "......BBBBBBBBBB....",
  "....................",
];
const BB_SHADOW = buildShadow(BB_MAP, BULLET_COLORS, PIXEL);
const BB_W = 20 * PIXEL;

/* ---------- Kirby ---------- */
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

const KIRBY_FRAMES = {
  A: buildShadow([...KIRBY_BODY, ...KIRBY_WALK_A_FEET], KIRBY_COLORS, PIXEL),
  B: buildShadow([...KIRBY_BODY, ...KIRBY_WALK_B_FEET], KIRBY_COLORS, PIXEL),
};
const KIRBY_W = 16 * PIXEL;

/* ---------- Toad (16px wide, legs included) ---------- */
const TOAD_COLORS: Record<string, string> = {
  ".": "transparent",
  R: "#e52521", // mushroom cap red
  W: "#ffffff", // white spots
  T: "#f9c89b", // face / skin
  K: "#000000", // eyes
  B: "#2057d6", // blue vest
  N: "#8b4513", // shoes
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

// slight foot shift for walk cycle
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

const TOAD_FRAMES = {
  A: buildShadow(TOAD_MAP, TOAD_COLORS, PIXEL),
  B: buildShadow(TOAD_MAP_B, TOAD_COLORS, PIXEL),
};
const TOAD_W = 16 * PIXEL;

function Character({
  name,
  initialFrame,
  charRef,
  spriteRef,
}: {
  name: string;
  initialFrame: string;
  charRef: (el: HTMLDivElement | null) => void;
  spriteRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={charRef} className="mario">
      <div className="char__name">{name}</div>
      <div ref={spriteRef} style={{ width: PIXEL, height: PIXEL, boxShadow: initialFrame }} />
    </div>
  );
}

/* ---------- Timer ---------- */
function useCountdown(end: Date) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, end.getTime() - Date.now()),
  );
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, end.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);
  return remaining;
}

function format(ms: number) {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d}:${pad(h)}:${pad(m)}:${pad(s)}`;
}

/* ---------- Stage objects ---------- */
const BLOCK_COUNT = 3;
const DECO_SPAN = 2400;

const DECO = [
  {
    startX: 240,
    kind: "hill",
    parallax: 0.4,
    top: undefined as string | undefined,
  },
  { startX: 520, kind: "cloud", parallax: 0.15, top: "10%" },
  { startX: 820, kind: "bush", parallax: 0.75, top: undefined },
  { startX: 1120, kind: "cloud", parallax: 0.15, top: "24%" },
  { startX: 1420, kind: "hill", parallax: 0.4, top: undefined },
  { startX: 1700, kind: "cloud", parallax: 0.15, top: "14%" },
  { startX: 1980, kind: "bush", parallax: 0.75, top: undefined },
];

// random gap between consecutively generated boxes
const randomGap = () => 520 + Math.random() * 640;

type BlockState = { worldX: number; hit: boolean; jumper: number };
type Star = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  born: number;
  target: number;
};

/* ---------- Page ---------- */
function bindRef(refs: MutableRefObject<(HTMLDivElement | null)[]>, i: number) {
  return (el: HTMLDivElement | null) => {
    refs.current[i] = el;
  };
}

export default function Page() {
  const remaining = useCountdown(COUNTDOWN_END);
  const remainingRef = useRef(remaining);
  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  // after Kirby appears, timer switches from countdown to count-up
  const [countUpStart, setCountUpStart] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startCountUpRef = useRef(() => {});
  useEffect(() => {
    startCountUpRef.current = () => {
      setCountUpStart((prev) => prev ?? Date.now());
    };
  }, []);
  useEffect(() => {
    if (countUpStart === null) return;
    const tick = () => setElapsedMs(Date.now() - countUpStart);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [countUpStart]);

  const countingUp = countUpStart !== null;
  const timerMs = countingUp ? elapsedMs : remaining;

  const stageRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLDivElement>(null);
  const castleRef = useRef<HTMLDivElement>(null);
  const flagRef = useRef<HTMLDivElement>(null);
  const volcanoSkyRef = useRef<HTMLDivElement>(null);
  const volcanoPageRef = useRef<HTMLDivElement>(null);
  const bulletRef = useRef<HTMLDivElement>(null);
  const toadRef = useRef<HTMLDivElement>(null);
  const toadSpriteRef = useRef<HTMLDivElement>(null);
  const toadShadowRef = useRef<HTMLDivElement>(null);
  const kirbyRef = useRef<HTMLDivElement>(null);
  const kirbySpriteRef = useRef<HTMLDivElement>(null);
  const kirbyShadowRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLDivElement | null)[]>([]);
  const charSpriteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const charShadowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const decoRefs = useRef<(HTMLDivElement | null)[]>([]);

  const decoRefCbs = useRef(DECO.map((_, i) => bindRef(decoRefs, i))).current;
  const blockRefCbs = useRef(Array.from({ length: BLOCK_COUNT }, (_, i) => bindRef(blockRefs, i))).current;
  const charShadowRefCbs = useRef(CHARACTERS.map((_, i) => bindRef(charShadowRefs, i))).current;
  const charRefCbs = useRef(CHARACTERS.map((_, i) => bindRef(charRefs, i))).current;
  const charSpriteRefCbs = useRef(CHARACTERS.map((_, i) => bindRef(charSpriteRefs, i))).current;

  useEffect(() => {
    const stage = stageRef.current;
    const ground = groundRef.current;
    const star = starRef.current;
    const castleEl = castleRef.current;
    const flagEl = flagRef.current;
    const volcanoSky = volcanoSkyRef.current;
    const volcanoPage = volcanoPageRef.current;
    const bulletEl = bulletRef.current;
    const toadEl = toadRef.current;
    const toadSpriteEl = toadSpriteRef.current;
    const toadShadowEl = toadShadowRef.current;
    const kirbyEl = kirbyRef.current;
    const kirbySpriteEl = kirbySpriteRef.current;
    const kirbyShadowEl = kirbyShadowRef.current;
    if (
      !stage ||
      !ground ||
      !star ||
      !castleEl ||
      !flagEl ||
      !volcanoSky ||
      !volcanoPage ||
      !bulletEl ||
      !toadEl ||
      !toadSpriteEl ||
      !toadShadowEl ||
      !kirbyEl ||
      !kirbySpriteEl ||
      !kirbyShadowEl
    )
      return;

    const CHAR_W = 36;
    const CHAR_H = 45;
    const SPEED = 2.0; // world px per frame
    const BLOCK_W = 46;
    const BLOCK_LIFT = 58; // px above the ground (matches CSS margin-bottom)
    const JUMP_DUR = 720;
    const JUMP_HEIGHT = 84;
    const STAR_POWER_MS = 5500;
    const VOLCANO_MS = 120_000; // 120 s after flag is fully raised
    const TOAD_RUN_X_RATIO = 0.22;
    const KIRBY_RUN_X_RATIO = 0.36;
    const KIRBY_EXIT_DELAY_MS = 700;
    const BB_SCREEN_X = 48;

    let STAGE_W = stage.clientWidth;
    let STAGE_H = stage.clientHeight;
    let GROUND_PX = STAGE_H * 0.38;
    let STOP_DOOR_X = STAGE_W * 0.62;
    let BLOCK_BOTTOM_Y = GROUND_PX + BLOCK_LIFT;

    const measure = () => {
      STAGE_W = stage.clientWidth;
      STAGE_H = stage.clientHeight;
      GROUND_PX = STAGE_H * 0.38;
      STOP_DOOR_X = STAGE_W * 0.62;
      BLOCK_BOTTOM_Y = GROUND_PX + BLOCK_LIFT;
    };

    // per-character runtime state
    const chars = CHARACTERS.map((c, i) => ({
      x: Math.max(STAGE_W, 1) * c.xRatio,
      jumping: false,
      jumpStart: 0,
      jumpTarget: -1,
      lastFrame: "",
      bobPhase: i * 1.9,
      framePhase: i * 0.5,
      inside: false,
      fadeStart: 0,
      starPowerUntil: 0,
    }));

    // blocks: randomly spaced, each randomly assigned to a character
    const blocks: BlockState[] = [];
    let spawnX = Math.max(STAGE_W, 320) + 60;
    for (let i = 0; i < BLOCK_COUNT; i++) {
      blocks.push({
        worldX: spawnX,
        hit: false,
        jumper: Math.floor(Math.random() * CHARACTERS.length),
      });
      spawnX += randomGap();
    }

    // decorative scenery with parallax
    const deco = DECO.map((d) => ({ ...d, worldX: d.startX }));

    const state = {
      camera: 0,
      star: { active: false } as Star,
    };

    // end-of-level sequence state
    type Phase = "approach" | "enter" | "flag" | "done" | "aftermath";
    const ending = {
      active: false,
      phase: "approach" as Phase,
      castleWorldX: 0,
      doorScreenX: 0,
      enterCharIdx: 0,
      flagStart: 0,
      volcanoStart: 0,
      volcanoDone: false,
      castleBroken: false,
      breakStart: 0,
    };

    type Runner = {
      active: boolean;
      x: number;
      lastFrame: string;
      emerged: boolean;
      startAt: number;
    };
    const toad: Runner = {
      active: false,
      x: 0,
      lastFrame: "",
      emerged: false,
      startAt: 0,
    };
    const kirby: Runner = {
      active: false,
      x: 0,
      lastFrame: "",
      emerged: false,
      startAt: 0,
    };
    let kirbyCountUpStarted = false;

    const updateRunner = (
      runner: Runner,
      el: HTMLDivElement,
      spriteEl: HTMLDivElement,
      shadowEl: HTMLDivElement,
      frames: { A: string; B: string },
      targetRatio: number,
      now: number,
      step: number,
      framePhase: number,
    ) => {
      if (!runner.active) return;
      const targetX = STAGE_W * targetRatio;
      if (!runner.emerged) {
        runner.x += (targetX - runner.x) * 0.04 * step;
        const emerge = Math.min(1, (now - runner.startAt) / 700);
        el.style.opacity = String(emerge);
        if (emerge >= 1 && Math.abs(runner.x - targetX) < 4) {
          runner.x = targetX;
          runner.emerged = true;
        }
      } else {
        runner.x = targetX;
      }

      const frame = Math.floor(now / 120 + framePhase) % 2 ? frames.A : frames.B;
      if (frame !== runner.lastFrame) {
        spriteEl.style.boxShadow = frame;
        runner.lastFrame = frame;
      }

      const bob = Math.sin(now / 80 + framePhase) * 1.5;
      el.style.transform = `translate(${runner.x}px, ${bob}px)`;
      shadowEl.style.transform = `translateX(${runner.x + 2}px)`;
      shadowEl.style.opacity = String(runner.emerged ? 0.28 : 0.14);
    };

    let raf = 0;
    let cancelled = false;
    let last = performance.now();
    let initedPositions = STAGE_W > 0;

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            const prevW = STAGE_W;
            measure();
            if (!initedPositions && STAGE_W > 0) {
              chars.forEach((ch, i) => {
                ch.x = STAGE_W * CHARACTERS[i].xRatio;
              });
              let x = STAGE_W + 60;
              blocks.forEach((b) => {
                b.worldX = x;
                x += randomGap();
              });
              initedPositions = true;
            } else if (prevW > 0 && STAGE_W > 0 && prevW !== STAGE_W) {
              const scale = STAGE_W / prevW;
              chars.forEach((ch) => {
                ch.x *= scale;
              });
            }
          })
        : null;
    ro?.observe(stage);

    const loop = (now: number) => {
      if (cancelled) return;

      if (STAGE_W <= 0 || STAGE_H <= 0) {
        measure();
        raf = requestAnimationFrame(loop);
        return;
      }

      const dt = Math.min(40, now - last);
      last = now;
      const step = dt / 16.67;

      // ---- activate the ending when the countdown reaches zero ----
      if (!ending.active && remainingRef.current <= 0) {
        ending.active = true;
        ending.castleWorldX = state.camera + STAGE_W + 240;
        // fade out any remaining blocks
        blockRefs.current.forEach((el) => {
          if (el) {
            el.style.transition = "opacity 0.5s ease";
            el.style.opacity = "0";
          }
        });
      }

      // world scrolls right -> left (until castle stops; resumes in aftermath)
      if (!ending.active || ending.phase === "approach" || ending.phase === "aftermath") {
        state.camera += SPEED * step;
      }

      // castle approaches: stop the world when the door reaches its spot
      if (ending.active && ending.phase === "approach") {
        const castleSx = ending.castleWorldX - state.camera;
        if (castleSx + DOOR_X <= STOP_DOOR_X) {
          ending.phase = "enter";
          ending.doorScreenX = STOP_DOOR_X;
        }
      }

      // ---- per character: walk-in / jump trigger, arc, frames, position ----
      chars.forEach((ch, i) => {
        const charEl = charRefs.current[i];
        const spriteEl = charSpriteRefs.current[i];
        const shadowEl = charShadowRefs.current[i];
        if (!charEl || !spriteEl || !shadowEl) return;

        // ending: walk toward the castle door, one character at a time
        if (ending.active && ending.phase === "enter" && i === ending.enterCharIdx) {
          ch.x += 1.7 * step;
          if (!ch.inside && ch.x + CHAR_W / 2 >= ending.doorScreenX) {
            ch.inside = true;
            ch.fadeStart = now;
          }
        }

        // find the nearest approaching block assigned to this character
        if (!ending.active) {
          let nearest: { idx: number; dist: number } | null = null;
          for (let idx = 0; idx < blocks.length; idx++) {
            const b = blocks[idx];
            if (b.jumper !== i || b.hit) continue;
            const sx = b.worldX - state.camera;
            const dist = ch.x + CHAR_W / 2 - (sx + BLOCK_W / 2);
            if (dist < 0) continue; // already passed
            if (!nearest || dist < nearest.dist) nearest = { idx, dist };
          }
          if (nearest && !ch.jumping && nearest.dist < 72) {
            ch.jumping = true;
            ch.jumpStart = now;
            ch.jumpTarget = nearest.idx;
          }
        }

        // jump arc
        let jumpY = 0;
        if (ch.jumping) {
          const p = (now - ch.jumpStart) / JUMP_DUR;
          if (p >= 1) {
            ch.jumping = false;
            ch.jumpTarget = -1;
          } else {
            jumpY = -4 * JUMP_HEIGHT * p * (1 - p);
          }
        }

        // animation frames
        const frames = CHARACTERS[i].frames;
        const frame = ch.jumping ? frames.JUMP : Math.floor(now / 130 + ch.framePhase) % 2 ? frames.A : frames.B;
        if (frame !== ch.lastFrame) {
          spriteEl.style.boxShadow = frame;
          ch.lastFrame = frame;
        }

        // star power: rainbow flash on the sprite
        if (now < ch.starPowerUntil) {
          const hue = ((now / 70) * 60) % 360;
          const flash = Math.floor(now / 90) % 2 === 0 ? 1.35 : 1.05;
          spriteEl.style.filter = `hue-rotate(${hue}deg) saturate(2.4) brightness(${flash})`;
        } else if (spriteEl.style.filter) {
          spriteEl.style.filter = "";
        }

        // position + ground shadow
        const bob = ch.jumping ? 0 : Math.sin(now / 80 + ch.bobPhase) * 1.5;
        charEl.style.transform = `translate(${ch.x}px, ${jumpY + bob}px)`;
        const heightAboveGround = Math.max(0, -jumpY);
        const shadowScale = 1 - Math.min(heightAboveGround / (JUMP_HEIGHT * 1.4), 0.45);
        shadowEl.style.transform = `translateX(${ch.x - 2}px) scale(${shadowScale})`;
        shadowEl.style.opacity = String(0.28 - heightAboveGround * 0.0015);

        // fade out inside the castle
        if (ch.inside) {
          const ft = Math.min(1, (now - ch.fadeStart) / 260);
          charEl.style.opacity = String(1 - ft);
          shadowEl.style.opacity = String(Math.max(0, 0.28 * (1 - ft)));
          if (ft >= 1 && ending.enterCharIdx === i) {
            ending.enterCharIdx++;
            if (ending.enterCharIdx >= chars.length) {
              ending.phase = "flag";
              ending.flagStart = now;
            }
          }
        }

        // head hits the assigned block's underside while rising
        if (ch.jumping && ch.jumpTarget >= 0) {
          const b = blocks[ch.jumpTarget];
          const el = blockRefs.current[ch.jumpTarget];
          if (b && el && !b.hit) {
            const sx = b.worldX - state.camera;
            const overlapX = ch.x + CHAR_W > sx + 6 && ch.x < sx + BLOCK_W - 6;
            const headRise = -jumpY;
            if (overlapX && headRise >= 20) {
              b.hit = true;
              el.classList.add("block--hit", "block--bump");
              setTimeout(() => el.classList.remove("block--bump"), 280);
              // star pops out of the TOP of the block, flies to this character
              state.star = {
                x: sx + BLOCK_W / 2,
                y: BLOCK_BOTTOM_Y + BLOCK_W + 4,
                vx: 0,
                vy: 0,
                active: true,
                born: now,
                target: i,
              };
            }
          }
        }
      });

      // ---- blocks: render + recycle (only before ending; none for Kirby) ----
      const blocksLive = !ending.active;
      blocks.forEach((b, idx) => {
        const el = blockRefs.current[idx];
        if (!el) return;
        const sx = b.worldX - state.camera;

        // recycle when fully off the left edge -> respawn at a random gap
        if (blocksLive && sx + BLOCK_W < -30) {
          const maxWorldX = Math.max(...blocks.map((o) => o.worldX));
          b.worldX = maxWorldX + randomGap();
          b.hit = false;
          b.jumper = Math.floor(Math.random() * CHARACTERS.length);
          el.classList.remove("block--hit");
          chars.forEach((ch) => {
            if (ch.jumpTarget === idx) ch.jumpTarget = -1;
          });
        }

        el.style.transform = `translateX(${sx}px)`;
        el.style.display = !blocksLive || sx > STAGE_W + 80 || sx < -BLOCK_W - 30 ? "none" : "block";
      });

      // ---- star: pop up, then fly into the character who hit the block ----
      if (state.star.active) {
        const st = state.star;
        const target = chars[st.target];
        if (!target) {
          state.star.active = false;
          star.style.display = "none";
        } else {
          const targetX = target.x + CHAR_W / 2;
          const targetY = GROUND_PX + CHAR_H / 2;
          const elapsed = now - st.born;
          if (elapsed < 220) {
            st.y += 4.2; // pop straight up out of the block
          } else {
            st.vx += (targetX - st.x) * 0.014;
            st.vy += (targetY - st.y) * 0.02;
            st.vx = Math.max(-8, Math.min(8, st.vx));
            st.vy = Math.max(-8, Math.min(8, st.vy));
            st.x += st.vx;
            st.y += st.vy;
          }
          const d = Math.hypot(st.x - targetX, st.y - targetY);
          if (d < 22) {
            state.star.active = false; // consumed
            star.style.display = "none";
            target.starPowerUntil = now + STAR_POWER_MS;
          } else {
            const scaleIn = Math.min(1, elapsed / 160);
            const shrink = d < 90 ? Math.max(0.25, d / 90) : 1;
            const hue = ((now / 70) * 60) % 360;
            const flash = Math.floor(now / 90) % 2 === 0 ? 1.35 : 1.05;
            star.style.display = "block";
            star.style.filter = `hue-rotate(${hue}deg) saturate(2.4) brightness(${flash}) drop-shadow(0 0 8px hsl(${hue} 100% 60%))`;
            star.style.transform = `translate(${st.x - 19}px, ${-st.y - 19}px) scale(${scaleIn * shrink})`;
          }
        }
      }

      // ---- castle + flag ----
      if (ending.active) {
        const castleSx = ending.castleWorldX - state.camera;
        if (!ending.castleBroken) {
          castleEl.style.display = "block";
          castleEl.style.transform = `translateX(${castleSx}px)`;
        }
        if (ending.phase === "flag" || ending.phase === "done") {
          const p = Math.min(1, (now - ending.flagStart) / 1600);
          flagEl.style.opacity = "1";
          const wave = p >= 1 ? Math.sin(now / 280) * 5 : 0;
          flagEl.style.transform = `translateY(${(1 - p) * 28}px) rotate(${wave}deg)`;
          if (p >= 1) {
            ending.phase = "done";
            if (!ending.volcanoStart) ending.volcanoStart = now;
          }
        }

        // aftermath: castle meets Bullet Bill -> break
        if (ending.phase === "aftermath" && !ending.castleBroken && castleSx <= BB_SCREEN_X + BB_W * 0.35) {
          ending.castleBroken = true;
          ending.breakStart = now;
          castleEl.classList.add("castle--broken");
          flagEl.style.opacity = "0";
        }

        if (ending.castleBroken) {
          const bp = Math.min(1, (now - ending.breakStart) / 900);
          castleEl.style.opacity = String(1 - bp);
          castleEl.style.transform = `translateX(${castleSx}px) translateY(${bp * 28}px) rotate(${bp * 12}deg) scale(${1 - bp * 0.25})`;
          if (bp >= 1) castleEl.style.display = "none";
        }
      }

      // ---- volcano sky: 2 min fade after flag fully raised ----
      if (ending.volcanoStart && !ending.volcanoDone) {
        const t = Math.min(1, (now - ending.volcanoStart) / VOLCANO_MS);
        const e = t * t * (3 - 2 * t); // smoothstep
        volcanoSky.style.opacity = String(e);
        volcanoPage.style.opacity = String(e);
        // scorched ground / grass as eruption builds
        ground.style.filter = `saturate(${1 - e * 0.55}) brightness(${1 - e * 0.22}) sepia(${e * 0.45}) hue-rotate(${-e * 18}deg)`;
        decoRefs.current.forEach((el, i) => {
          if (!el) return;
          if (DECO[i].kind === "cloud") {
            el.style.filter = `brightness(${1 - e * 0.45}) sepia(${e * 0.6}) hue-rotate(${-e * 25}deg)`;
            el.style.opacity = String(0.95 - e * 0.35);
          } else {
            el.style.filter = `saturate(${1 - e * 0.5}) brightness(${1 - e * 0.25}) sepia(${e * 0.4})`;
          }
        });

        if (t >= 1) {
          ending.volcanoDone = true;
          ending.phase = "aftermath";

          // Bullet Bill appears on the left
          bulletEl.style.display = "block";
          bulletEl.style.opacity = "0";

          const doorCenter = ending.castleWorldX - state.camera + DOOR_X;

          // Toad emerges first
          toad.active = true;
          toad.x = doorCenter - TOAD_W / 2;
          toad.emerged = false;
          toad.startAt = now;
          toadEl.style.display = "block";
          toadEl.style.opacity = "0";
          toadShadowEl.style.display = "block";

          // Kirby follows shortly after; timer count-up starts with him
          kirby.active = true;
          kirby.x = doorCenter - KIRBY_W / 2;
          kirby.emerged = false;
          kirby.startAt = now + KIRBY_EXIT_DELAY_MS;
          kirbyEl.style.display = "block";
          kirbyEl.style.opacity = "0";
          kirbyShadowEl.style.display = "block";

          // no ? blocks / stars in aftermath
          state.star.active = false;
          star.style.display = "none";
          blockRefs.current.forEach((el) => {
            if (el) el.style.display = "none";
          });
        }
      }

      // ---- Bullet Bill (fixed on the left during aftermath) ----
      if (ending.phase === "aftermath") {
        const bob = Math.sin(now / 140) * 3;
        const fadeIn = Math.min(1, (now - (ending.volcanoStart + VOLCANO_MS)) / 500);
        bulletEl.style.opacity = String(fadeIn);
        bulletEl.style.transform = `translate(${BB_SCREEN_X}px, ${bob}px)`;
      }

      // ---- Toad then Kirby: exit castle and keep running together ----
      if (toad.active) {
        updateRunner(toad, toadEl, toadSpriteEl, toadShadowEl, TOAD_FRAMES, TOAD_RUN_X_RATIO, now, step, 0);
      }
      if (kirby.active && now >= kirby.startAt) {
        if (!kirbyCountUpStarted) {
          kirbyCountUpStarted = true;
          startCountUpRef.current();
        }
        updateRunner(kirby, kirbyEl, kirbySpriteEl, kirbyShadowEl, KIRBY_FRAMES, KIRBY_RUN_X_RATIO, now, step, 1.3);
      }

      // ---- ground texture scroll ----
      ground.style.backgroundPositionX = `${-(state.camera % 32)}px`;

      // ---- decorative scenery with parallax ----
      deco.forEach((d, i) => {
        const el = decoRefs.current[i];
        if (!el) return;
        let sx = d.worldX - state.camera * d.parallax;
        while (sx < -180) {
          d.worldX += DECO_SPAN;
          sx = d.worldX - state.camera * d.parallax;
        }
        el.style.transform = `translateX(${sx}px)`;
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, []);

  return (
    <>
      <div className="page-volcano" ref={volcanoPageRef} aria-hidden />
      <main>
        <div className="timer">
          <div className="timer__label">{countingUp || remaining <= 0 ? ENDING_STRING : LOOPING_STRING}</div>
          <div className="timer__value">{format(timerMs)}</div>
        </div>

        <div className="stage" ref={stageRef}>
          <div className="stage__volcano" ref={volcanoSkyRef} aria-hidden>
            <div className="stage__ash" />
          </div>
          {/* decorative scenery */}
          {DECO.map((d, i) => (
            <div
              key={i}
              className={`deco deco--${d.kind}`}
              style={d.top ? { top: d.top } : undefined}
              ref={decoRefCbs[i]}
            />
          ))}
          <div className="ground" ref={groundRef} />
          {/* blocks */}
          {Array.from({ length: BLOCK_COUNT }).map((_, i) => (
            <div key={i} className="block" ref={blockRefCbs[i]}>
              <div className="block__box" />
            </div>
          ))}
          <div className="star" ref={starRef} style={{ left: 0, bottom: 0, display: "none" }}>
            <span className="star__sprite">&#11088;</span>
          </div>
          {CHARACTERS.map((c, i) => (
            <div key={`shadow-${i}`} className="mario__shadow" ref={charShadowRefCbs[i]} />
          ))}
          {CHARACTERS.map((c, i) => (
            <Character
              key={c.name}
              name={c.name}
              initialFrame={c.frames.A}
              charRef={charRefCbs[i]}
              spriteRef={charSpriteRefCbs[i]}
            />
          ))}
          {/* Bullet Bill — appears after volcano transition */}
          <div className="bullet" ref={bulletRef} style={{ display: "none", opacity: 0 }} aria-hidden>
            <div
              style={{
                width: PIXEL,
                height: PIXEL,
                boxShadow: BB_SHADOW,
              }}
            />
          </div>
          {/* Toad — emerges first after volcano */}
          <div className="toad__shadow" ref={toadShadowRef} style={{ display: "none" }} aria-hidden />
          <div className="toad" ref={toadRef} style={{ display: "none", opacity: 0 }}>
            <div className="char__name">Toad</div>
            <div
              ref={toadSpriteRef}
              style={{
                width: PIXEL,
                height: PIXEL,
                boxShadow: TOAD_FRAMES.A,
              }}
            />
          </div>
          {/* Kirby — emerges after Toad */}
          <div className="kirby__shadow" ref={kirbyShadowRef} style={{ display: "none" }} aria-hidden />
          <div className="kirby" ref={kirbyRef} style={{ display: "none", opacity: 0 }}>
            <div className="char__name">Kirby</div>
            <div
              ref={kirbySpriteRef}
              style={{
                width: PIXEL,
                height: PIXEL,
                boxShadow: KIRBY_FRAMES.A,
              }}
            />
          </div>
          {/* end-of-level castle (painted above the characters) */}
          <div className="castle" ref={castleRef}>
            <div className="castle__pole" />
            <div className="castle__flag" ref={flagRef} />
            <div className="castle__rubble" aria-hidden />
            <div
              className="castle__sprite"
              style={{
                width: CASTLE_PIXEL,
                height: CASTLE_PIXEL,
                boxShadow: CASTLE_SHADOW,
              }}
            />
          </div>
        </div>
      </main>
    </>
  );
}
