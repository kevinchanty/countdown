"use client";

import { useEffect, type MutableRefObject, type RefObject } from "react";
import {
  BB_SCREEN_X,
  BLOCK_COUNT,
  BLOCK_LIFT,
  BLOCK_W,
  CHAR_H,
  CHAR_W,
  DECO,
  DECO_SPAN,
  JUMP_DUR,
  JUMP_HEIGHT,
  randomGap,
  RUNNER_W,
  SPEED,
  STAR_POWER_MS,
  VOLCANO_MS,
} from "@/lib/constants";
import { BB_W } from "@/lib/sprites/bullet";
import { DOOR_X } from "@/lib/sprites/castle";
import { CHARACTERS } from "@/lib/sprites/mario";
import { RUNNERS } from "@/lib/sprites/runners";
import { EndingPhase, makeRunner, type BlockState, type RunnerState, type Star } from "@/lib/types";
import type { WalkFrames } from "@/lib/pixel";

export type GameLoopRefs = {
  stageRef: RefObject<HTMLDivElement | null>;
  groundRef: RefObject<HTMLDivElement | null>;
  starRef: RefObject<HTMLDivElement | null>;
  castleRef: RefObject<HTMLDivElement | null>;
  flagRef: RefObject<HTMLDivElement | null>;
  volcanoSkyRef: RefObject<HTMLDivElement | null>;
  volcanoPageRef: RefObject<HTMLDivElement | null>;
  bulletRef: RefObject<HTMLDivElement | null>;
  runnerRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  runnerSpriteRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  runnerShadowRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  charRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  charSpriteRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  charShadowRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  blockRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  decoRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  remainingRef: MutableRefObject<number>;
  startCountUpRef: MutableRefObject<() => void>;
};

function updateRunner(
  runner: RunnerState,
  el: HTMLDivElement,
  spriteEl: HTMLDivElement,
  shadowEl: HTMLDivElement,
  frames: WalkFrames,
  targetRatio: number,
  stageW: number,
  now: number,
  step: number,
  framePhase: number,
) {
  if (!runner.active || now < runner.startAt) return;
  const targetX = stageW * targetRatio;
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
}

export function useGameLoop(refs: GameLoopRefs) {
  useEffect(() => {
    const {
      stageRef,
      groundRef,
      starRef,
      castleRef,
      flagRef,
      volcanoSkyRef,
      volcanoPageRef,
      bulletRef,
      runnerRefs,
      runnerSpriteRefs,
      runnerShadowRefs,
      charRefs,
      charSpriteRefs,
      charShadowRefs,
      blockRefs,
      decoRefs,
      remainingRef,
      startCountUpRef,
    } = refs;

    const stage = stageRef.current;
    const ground = groundRef.current;
    const star = starRef.current;
    const castleEl = castleRef.current;
    const flagEl = flagRef.current;
    const volcanoSky = volcanoSkyRef.current;
    const volcanoPage = volcanoPageRef.current;
    const bulletEl = bulletRef.current;
    if (!stage || !ground || !star || !castleEl || !flagEl || !volcanoSky || !volcanoPage || !bulletEl) return;

    const runnerEls = RUNNERS.map((_, i) => ({
      el: runnerRefs.current[i],
      sprite: runnerSpriteRefs.current[i],
      shadow: runnerShadowRefs.current[i],
    }));
    if (runnerEls.some((r) => !r.el || !r.sprite || !r.shadow)) return;

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

    const deco = DECO.map((d) => ({ ...d, worldX: d.startX }));
    const state = { camera: 0, star: { active: false } as Star };

    const ending = {
      active: false,
      phase: EndingPhase.Approach,
      castleWorldX: 0,
      doorScreenX: 0,
      enterCharIdx: 0,
      flagStart: 0,
      volcanoStart: 0,
      volcanoDone: false,
      castleBroken: false,
      breakStart: 0,
    };

    const runners = RUNNERS.map(() => makeRunner());
    let countUpStarted = false;

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

      if (!ending.active && remainingRef.current <= 0) {
        ending.active = true;
        ending.castleWorldX = state.camera + STAGE_W + 240;
        blockRefs.current.forEach((el) => {
          if (el) {
            el.style.transition = "opacity 0.5s ease";
            el.style.opacity = "0";
          }
        });
      }

      if (!ending.active || ending.phase === EndingPhase.Approach || ending.phase === EndingPhase.Aftermath) {
        state.camera += SPEED * step;
      }

      if (ending.active && ending.phase === EndingPhase.Approach) {
        const castleSx = ending.castleWorldX - state.camera;
        if (castleSx + DOOR_X <= STOP_DOOR_X) {
          ending.phase = EndingPhase.Enter;
          ending.doorScreenX = STOP_DOOR_X;
        }
      }

      chars.forEach((ch, i) => {
        const charEl = charRefs.current[i];
        const spriteEl = charSpriteRefs.current[i];
        const shadowEl = charShadowRefs.current[i];
        if (!charEl || !spriteEl || !shadowEl) return;

        if (ending.active && ending.phase === EndingPhase.Enter && i === ending.enterCharIdx) {
          ch.x += 1.7 * step;
          if (!ch.inside && ch.x + CHAR_W / 2 >= ending.doorScreenX) {
            ch.inside = true;
            ch.fadeStart = now;
          }
        }

        if (!ending.active) {
          let nearest: { idx: number; dist: number } | null = null;
          for (let idx = 0; idx < blocks.length; idx++) {
            const b = blocks[idx];
            if (b.jumper !== i || b.hit) continue;
            const sx = b.worldX - state.camera;
            const dist = ch.x + CHAR_W / 2 - (sx + BLOCK_W / 2);
            if (dist < 0) continue;
            if (!nearest || dist < nearest.dist) nearest = { idx, dist };
          }
          if (nearest && !ch.jumping && nearest.dist < 72) {
            ch.jumping = true;
            ch.jumpStart = now;
            ch.jumpTarget = nearest.idx;
          }
        }

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

        const frames = CHARACTERS[i].frames;
        const frame = ch.jumping ? frames.JUMP : Math.floor(now / 130 + ch.framePhase) % 2 ? frames.A : frames.B;
        if (frame !== ch.lastFrame) {
          spriteEl.style.boxShadow = frame;
          ch.lastFrame = frame;
        }

        if (now < ch.starPowerUntil) {
          const hue = ((now / 70) * 60) % 360;
          const flash = Math.floor(now / 90) % 2 === 0 ? 1.35 : 1.05;
          spriteEl.style.filter = `hue-rotate(${hue}deg) saturate(2.4) brightness(${flash})`;
        } else if (spriteEl.style.filter) {
          spriteEl.style.filter = "";
        }

        const bob = ch.jumping ? 0 : Math.sin(now / 80 + ch.bobPhase) * 1.5;
        charEl.style.transform = `translate(${ch.x}px, ${jumpY + bob}px)`;
        const heightAboveGround = Math.max(0, -jumpY);
        const shadowScale = 1 - Math.min(heightAboveGround / (JUMP_HEIGHT * 1.4), 0.45);
        shadowEl.style.transform = `translateX(${ch.x - 2}px) scale(${shadowScale})`;
        shadowEl.style.opacity = String(0.28 - heightAboveGround * 0.0015);

        if (ch.inside) {
          const ft = Math.min(1, (now - ch.fadeStart) / 260);
          charEl.style.opacity = String(1 - ft);
          shadowEl.style.opacity = String(Math.max(0, 0.28 * (1 - ft)));
          if (ft >= 1 && ending.enterCharIdx === i) {
            ending.enterCharIdx++;
            if (ending.enterCharIdx >= chars.length) {
              ending.phase = EndingPhase.Flag;
              ending.flagStart = now;
            }
          }
        }

        if (ch.jumping && ch.jumpTarget >= 0) {
          const b = blocks[ch.jumpTarget];
          const el = blockRefs.current[ch.jumpTarget];
          if (b && el && !b.hit) {
            const sx = b.worldX - state.camera;
            const overlapX = ch.x + CHAR_W > sx + 6 && ch.x < sx + BLOCK_W - 6;
            if (overlapX && -jumpY >= 20) {
              b.hit = true;
              el.classList.add("block--hit", "block--bump");
              setTimeout(() => el.classList.remove("block--bump"), 280);
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

      const blocksLive = !ending.active;
      blocks.forEach((b, idx) => {
        const el = blockRefs.current[idx];
        if (!el) return;
        const sx = b.worldX - state.camera;

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
            st.y += 4.2;
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
            state.star.active = false;
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

      if (ending.active) {
        const castleSx = ending.castleWorldX - state.camera;
        if (!ending.castleBroken) {
          castleEl.style.display = "block";
          castleEl.style.transform = `translateX(${castleSx}px)`;
        }
        if (ending.phase === EndingPhase.Flag || ending.phase === EndingPhase.Done) {
          const p = Math.min(1, (now - ending.flagStart) / 1600);
          flagEl.style.opacity = "1";
          const wave = p >= 1 ? Math.sin(now / 280) * 5 : 0;
          flagEl.style.transform = `translateY(${(1 - p) * 28}px) rotate(${wave}deg)`;
          if (p >= 1) {
            ending.phase = EndingPhase.Done;
            if (!ending.volcanoStart) ending.volcanoStart = now;
          }
        }

        if (
          ending.phase === EndingPhase.Aftermath &&
          !ending.castleBroken &&
          castleSx <= BB_SCREEN_X + BB_W * 0.35
        ) {
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

      if (ending.volcanoStart && !ending.volcanoDone) {
        const t = Math.min(1, (now - ending.volcanoStart) / VOLCANO_MS);
        const e = t * t * (3 - 2 * t);
        volcanoSky.style.opacity = String(e);
        volcanoPage.style.opacity = String(e);
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
          ending.phase = EndingPhase.Aftermath;

          bulletEl.style.display = "block";
          bulletEl.style.opacity = "0";

          const doorCenter = ending.castleWorldX - state.camera + DOOR_X;
          runners.forEach((runner, i) => {
            const cfg = RUNNERS[i];
            const els = runnerEls[i];
            runner.active = true;
            runner.x = doorCenter - RUNNER_W / 2;
            runner.emerged = false;
            runner.startAt = now + cfg.exitDelay;
            els.el!.style.display = "block";
            els.el!.style.opacity = "0";
            els.shadow!.style.display = "block";
          });

          state.star.active = false;
          star.style.display = "none";
          blockRefs.current.forEach((el) => {
            if (el) el.style.display = "none";
          });
        }
      }

      if (ending.phase === EndingPhase.Aftermath) {
        const bob = Math.sin(now / 140) * 3;
        const fadeIn = Math.min(1, (now - (ending.volcanoStart + VOLCANO_MS)) / 500);
        bulletEl.style.opacity = String(fadeIn);
        bulletEl.style.transform = `translate(${BB_SCREEN_X}px, ${bob}px)`;
      }

      runners.forEach((runner, i) => {
        const cfg = RUNNERS[i];
        const els = runnerEls[i];
        if (cfg.startsCountUp && runner.active && now >= runner.startAt && !countUpStarted) {
          countUpStarted = true;
          startCountUpRef.current();
        }
        updateRunner(
          runner,
          els.el!,
          els.sprite!,
          els.shadow!,
          cfg.frames,
          cfg.xRatio,
          STAGE_W,
          now,
          step,
          cfg.framePhase,
        );
      });

      ground.style.backgroundPositionX = `${-(state.camera % 32)}px`;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
