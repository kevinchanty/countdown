"use client";

import { useEffect, useRef, useState } from "react";

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

function buildShadow(
  rows: string[],
  colors: Record<string, string>,
  px: number,
): string {
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
const CASTLE_W = 26 * CASTLE_PIXEL; // 104
const CASTLE_H = CASTLE_MAP.length * CASTLE_PIXEL; // 104
const DOOR_X = 13.5 * CASTLE_PIXEL; // door center from castle left = 54

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
      <div
        ref={spriteRef}
        style={{ width: PIXEL, height: PIXEL, boxShadow: initialFrame }}
      />
    </div>
  );
}

/* ---------- Timer ---------- */
function useCountdown(end: Date) {
  const [remaining, setRemaining] = useState(0);
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
// Locale-independent label (server and client must render identical text).
const END_LABEL = (() => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = COUNTDOWN_END;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
})();

export default function Page() {
  const remaining = useCountdown(COUNTDOWN_END);
  const remainingRef = useRef(remaining);
  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  const stageRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLDivElement>(null);
  const castleRef = useRef<HTMLDivElement>(null);
  const flagRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLDivElement | null)[]>([]);
  const charSpriteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const charShadowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const decoRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const stage = stageRef.current!;
    const ground = groundRef.current!;
    const star = starRef.current!;
    const castleEl = castleRef.current!;
    const flagEl = flagRef.current!;

    const STAGE_W = stage.clientWidth;
    const STAGE_H = stage.clientHeight;
    const CHAR_W = 36;
    const CHAR_H = 45;
    const SPEED = 2.0; // world px per frame
    const GROUND_PX = STAGE_H * 0.38; // matches CSS ground height
    const STOP_DOOR_X = STAGE_W * 0.62; // where the castle door stops

    const BLOCK_W = 46;
    const BLOCK_LIFT = 58; // px above the ground (matches CSS margin-bottom)
    const BLOCK_BOTTOM_Y = GROUND_PX + BLOCK_LIFT;

    const JUMP_DUR = 720;
    const JUMP_HEIGHT = 84;
    const STAR_POWER_MS = 5500;

    // per-character runtime state
    const chars = CHARACTERS.map((c, i) => ({
      x: STAGE_W * c.xRatio,
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
    let spawnX = STAGE_W + 60;
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
    const ending = {
      active: false,
      phase: "approach" as "approach" | "enter" | "flag" | "done",
      castleWorldX: 0,
      doorScreenX: 0,
      enterCharIdx: 0,
      flagStart: 0,
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
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

      // world scrolls right -> left (until the castle door reaches its stop)
      if (!ending.active || ending.phase === "approach") {
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
        if (
          ending.active &&
          ending.phase === "enter" &&
          i === ending.enterCharIdx
        ) {
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
        const frame = ch.jumping
          ? frames.JUMP
          : Math.floor(now / 130 + ch.framePhase) % 2
            ? frames.A
            : frames.B;
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
        const shadowScale =
          1 - Math.min(heightAboveGround / (JUMP_HEIGHT * 1.4), 0.45);
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

      // ---- blocks: render + recycle (random re-generation) ----
      blocks.forEach((b, idx) => {
        const el = blockRefs.current[idx];
        if (!el) return;
        const sx = b.worldX - state.camera;

        // recycle when fully off the left edge -> respawn at a random gap
        if (!ending.active && sx + BLOCK_W < -30) {
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
        el.style.display =
          sx > STAGE_W + 80 || sx < -BLOCK_W - 30 ? "none" : "block";
      });

      // ---- star: pop up, then fly into the character who hit the block ----
      if (state.star.active) {
        const st = state.star;
        const target = chars[st.target];
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
          chars[st.target].starPowerUntil = now + STAR_POWER_MS;
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

      // ---- castle + flag ----
      if (ending.active) {
        castleEl.style.display = "block";
        castleEl.style.transform = `translateX(${ending.castleWorldX - state.camera}px)`;
        if (ending.phase === "flag" || ending.phase === "done") {
          const p = Math.min(1, (now - ending.flagStart) / 1600);
          flagEl.style.opacity = "1";
          const wave = p >= 1 ? Math.sin(now / 280) * 5 : 0;
          flagEl.style.transform = `translateY(${(1 - p) * 28}px) rotate(${wave}deg)`;
          if (p >= 1) ending.phase = "done";
        }
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
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <main>
      <div className="timer">
        <div className="timer__label">
          {remaining <= 0 ? ENDING_STRING : LOOPING_STRING}
        </div>
        <div className="timer__value">{format(remaining)}</div>
      </div>

      <div className="stage" ref={stageRef}>
        {/* decorative scenery */}
        {DECO.map((d, i) => (
          <div
            key={i}
            className={`deco deco--${d.kind}`}
            style={d.top ? { top: d.top } : undefined}
            ref={(el) => {
              decoRefs.current[i] = el;
            }}
          />
        ))}
        <div className="ground" ref={groundRef} />
        {/* blocks */}
        {Array.from({ length: BLOCK_COUNT }).map((_, i) => (
          <div
            key={i}
            className="block"
            ref={(el) => {
              blockRefs.current[i] = el;
            }}
          >
            <div className="block__box" />
          </div>
        ))}
        <div
          className="star"
          ref={starRef}
          style={{ left: 0, bottom: 0, display: "none" }}
        >
          <span className="star__sprite">&#11088;</span>
        </div>
        {CHARACTERS.map((c, i) => (
          <div
            key={`shadow-${i}`}
            className="mario__shadow"
            ref={(el) => {
              charShadowRefs.current[i] = el;
            }}
          />
        ))}
        {CHARACTERS.map((c, i) => (
          <Character
            key={c.name}
            name={c.name}
            initialFrame={c.frames.A}
            charRef={(el) => {
              charRefs.current[i] = el;
            }}
            spriteRef={(el) => {
              charSpriteRefs.current[i] = el;
            }}
          />
        ))}
        {/* end-of-level castle (painted above the characters) */}
        <div className="castle" ref={castleRef}>
          <div className="castle__pole" />
          <div className="castle__flag" ref={flagRef} />
          <div
            style={{
              width: CASTLE_PIXEL,
              height: CASTLE_PIXEL,
              boxShadow: CASTLE_SHADOW,
            }}
          />
        </div>
      </div>
    </main>
  );
}
