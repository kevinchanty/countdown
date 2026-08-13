import { COUNTDOWN_END } from "@/lib/constants";
import { formatTime, padScore } from "@/lib/format";
import { Sfx } from "./audio";
import {
  AIR_FRICTION,
  BB_SCREEN_X,
  BIG_H,
  CASTLE_DOOR_X,
  COLORS,
  COYOTE_MS,
  DEATH_BOUNCE,
  DEATH_BOUNCE_VY,
  DEATH_FREEZE_MS,
  DEATH_GRAVITY,
  DEATH_RESPAWN_MS,
  FRICTION,
  GRAVITY,
  GROW_MS,
  HOLD_GRAVITY,
  HOLE_AUTO_LEAD,
  HOLE_COUNT,
  IDLE_WALK_RESUME_MS,
  INVINCIBLE_MS,
  JUMP_BUFFER_MS,
  JUMP_CUT,
  JUMP_DUR,
  JUMP_HEIGHT,
  JUMP_VEL,
  MAX_FALL,
  MAX_RUN,
  MAX_WALK,
  MOVE_SPEED,
  PLAYER_W,
  randomHoleGap,
  RUN_ACCEL,
  RUNNER_DEFS,
  RUNNER_EXIT_DELAY_MS,
  SMALL_H,
  SPEED,
  STAR_MS,
  STOMP_BOUNCE,
  TILE,
  VIEW_H,
  VIEW_W,
  VOLCANO_MS,
  WALK_ACCEL,
} from "./config";
import { Input } from "./input";
import {
  buildLevel,
  extendLevel,
  isBumpable,
  isSolid,
  paveGround,
  PHASE1_PIT_TILES,
  randomPhase1PitTiles,
  setTile,
  T,
  tileAt,
  type Level,
  type LevelSpawned,
} from "./level";
import { drawSprite, getSprites, type SpriteBank } from "./sprites";
import type {
  Bump,
  CharacterId,
  EndingPhase,
  GameMode,
  Goomba,
  Particle,
  HoleState,
  Pickup,
  Player,
  Runner,
  VolcanoBlock,
  WorldCoin,
} from "./types";

export type GameHooks = {
  fontFamily: string;
  onTimer?: (remaining: number, countingUp: boolean) => void;
  onCountUp?: () => void;
  onVolcano?: (t: number) => void;
};

function aabb(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

const STAR_TRAIL_COLORS = ["#ff5040", "#ffb040", "#fcfc4c", "#50f050", "#40c8ff", "#c080ff"];
const COIN_SPIN = [0, 1, 2, 1];

export class MarioGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  readonly input = new Input();
  private audio = new Sfx();
  private sprites!: SpriteBank;
  private level!: Level;
  private hooks: GameHooks;
  private running = false;
  private raf = 0;
  private unbindResize?: () => void;
  private last = 0;

  mode: GameMode = "playing";
  score = 0;
  coins = 0;
  lives = 3;
  players: Player[] = [];
  goombas: Goomba[] = [];
  items: Pickup[] = [];
  particles: Particle[] = [];
  bumps: Bump[] = [];
  worldCoins: WorldCoin[] = [];
  runners: Runner[] = [];
  camera = { x: 0, y: 0 };
  lastInputAt = 0;
  countUpStart: number | null = null;
  countUpSent = false;
  flashUntil = 0;
  endingPhase: EndingPhase = "approach";
  endingCastleX = 0;
  enterIdx = 0;
  flagStart = 0;
  flagDrop = 0;
  emergeStart = 0;
  volcanoStart = 0;
  volcanoT = 0;
  holes: HoleState[] = [];
  volcanoBlocks: VolcanoBlock[] = [];
  volcanoNextX = 0;
  castleBroken = false;
  castleBreakStart = 0;
  bulletBob = 0;
  bulletFade = 0;

  constructor(canvas: HTMLCanvasElement, hooks: GameHooks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not available");
    this.ctx = ctx;
    this.hooks = hooks;
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
  }

  start() {
    this.sprites = getSprites();
    this.input.bind(window);
    this.running = true;
    this.last = performance.now();
    this.lastInputAt = 0;
    this.resetRun();
    const onResize = () => {
      this.ctx.imageSmoothingEnabled = false;
    };
    window.addEventListener("resize", onResize);
    this.unbindResize = () => window.removeEventListener("resize", onResize);
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.unbind();
    this.unbindResize?.();
  }

  private remaining() {
    if (this.countUpStart != null) return Date.now() - this.countUpStart;
    return Math.max(0, COUNTDOWN_END.getTime() - Date.now());
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(40, now - this.last);
    this.last = now;
    const step = dt / 16.67;
    this.update(now, step);
    this.render(now);
    this.hooks.onTimer?.(this.remaining(), this.countUpStart != null);
    this.hooks.onVolcano?.(this.volcanoT);
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(now: number, step: number) {
    const rem = Math.max(0, COUNTDOWN_END.getTime() - Date.now());
    if (rem <= 0 && this.mode !== "ending") this.beginEnding(now);

    // Any key edge (even a quick tap shorter than one frame) counts as activity,
    // otherwise a single jump tap would leave auto-play running.
    if (this.input.moving || this.input.lastPressAt > this.lastInputAt) {
      this.lastInputAt = now;
      this.audio.unlock();
    }

    if (this.mode === "ending") this.updateEnding(now, step);
    else this.updatePlaying(now, step);
    this.tickGrow(now);
    this.input.endFrame();
  }

  private makePlayer(id: CharacterId, x: number, y: number): Player {
    return {
      id,
      x,
      y,
      vx: 0,
      vy: 0,
      w: PLAYER_W,
      h: SMALL_H,
      facing: 1,
      big: false,
      grounded: true,
      skidding: false,
      invUntil: 0,
      starUntil: 0,
      bigUntil: 0,
      coyoteUntil: 0,
      jumpBufUntil: 0,
      jumpHeld: false,
      dead: false,
      deathY: 0,
      deathVy: 0,
      deathStart: 0,
      respawnAt: 0,
      anim: 0,
      inside: false,
      fade: 1,
    };
  }

  private resetRun() {
    this.level = buildLevel();
    this.goombas = this.makeGoombas();
    this.worldCoins = this.level.coins.map((c) => ({ ...c, taken: false }));
    this.items = [];
    this.particles = [];
    this.bumps = [];
    this.runners = [];
    this.holes = [];
    this.volcanoBlocks = [];
    this.volcanoNextX = 0;
    this.castleBroken = false;
    this.castleBreakStart = 0;
    this.bulletFade = 0;
    this.flagDrop = 0;
    const spawn = this.level.spawn;
    this.players = [this.makePlayer("jason", spawn.x - 20, spawn.y), this.makePlayer("fish", spawn.x, spawn.y)];
    this.camera.x = 0;
    this.mode = "playing";
    this.ensureWorld();
  }

  private beginEnding(now: number) {
    this.mode = "ending";
    this.endingPhase = "approach";
    this.enterIdx = 0;
    this.flagStart = 0;
    this.flagDrop = 0;
    this.emergeStart = 0;
    this.volcanoStart = 0;
    this.volcanoT = 0;
    this.holes = [];
    this.volcanoBlocks = [];
    this.volcanoNextX = 0;
    this.castleBroken = false;
    this.castleBreakStart = 0;
    this.bulletFade = 0;
    // Always spawn the castle ahead of the camera. Pave a solid runway so
    // they walk forward into it instead of looping or turning back.
    const cx = this.snapTile(this.camera.x + VIEW_W + 240);
    const tx0 = Math.floor((this.camera.x + VIEW_W) / TILE);
    const tx1 = Math.floor(cx / TILE) + 8;
    this.absorbSpawns(extendLevel(this.level, tx1 + 1));
    paveGround(this.level, tx0, tx1);
    const paveLeft = tx0 * TILE;
    this.goombas = this.goombas.filter((g) => g.x < paveLeft - 8);
    this.endingCastleX = cx;
    for (const p of this.players) {
      if (p.dead) this.respawnPlayer(p, now);
      p.inside = false;
      p.fade = 1;
    }
    this.audio.flag();
  }

  private makeGoombas(): Goomba[] {
    return this.level.goombas.map((g) => ({
      x: g.x,
      y: g.y,
      vx: -0.45,
      w: 16,
      h: 16,
      flatUntil: 0,
      dead: false,
      falling: false,
      vy: 0,
    }));
  }

  private doorGroundOk(cx: number) {
    const door = cx + CASTLE_DOOR_X;
    const gy = this.level.h - 2;
    for (const off of [-24, -8, 8, 24]) {
      const tx = Math.floor((door + off) / TILE);
      if (!isSolid(tileAt(this.level, tx, gy))) return false;
    }
    return true;
  }

  private idle(now: number) {
    return !this.input.moving && now - this.lastInputAt >= IDLE_WALK_RESUME_MS;
  }

  private updatePlaying(now: number, step: number) {
    this.ensureWorld();
    this.driveActors(now, step, "play");
    this.updateGoombas(now, step);
    this.updateItems(now, step);
    this.updateParticles(step);
    this.followCamera(step);
  }

  private updateEnding(now: number, step: number) {
    if (this.endingPhase === "approach") {
      this.driveActors(now, step, "approach");
      const door = this.endingCastleX + CASTLE_DOOR_X;
      const arrived = this.players.some((p) => !p.dead && !p.inside && p.x + p.w / 2 >= door - 20);
      if (arrived) {
        this.endingPhase = "enter";
        this.enterIdx = 0;
      }
    } else if (this.endingPhase === "enter") {
      this.driveActors(now, step, "enter");
    } else if (this.endingPhase === "flag") {
      this.flagDrop = Math.min(1, (now - this.flagStart) / 1600);
      if (this.flagDrop >= 1 && now >= this.flagStart + 1600 + RUNNER_EXIT_DELAY_MS) {
        this.endingPhase = "emerge";
        this.emergeStart = now;
        this.spawnRunners(now);
      }
    } else if (this.endingPhase === "emerge" || this.endingPhase === "volcano") {
      if (this.endingPhase === "emerge" && this.runners.length > 0 && this.runners.every((r) => r.emerged)) {
        this.endingPhase = "volcano";
        this.volcanoStart = now;
        this.spawnHoles();
        this.seedVolcanoField();
      }
      if (this.endingPhase === "volcano") {
        this.camera.x += SPEED * step;
        this.recycleHoles();
        this.recycleVolcanoField();
        if (this.volcanoStart) {
          this.volcanoT = Math.min(1, (now - this.volcanoStart) / VOLCANO_MS);
        }
        this.bulletBob = Math.sin(now / 140) * 3;
        this.bulletFade = Math.min(1, (now - this.volcanoStart) / 500);
        const castleSx = this.endingCastleX - this.camera.x;
        const bb = this.sprites.bullet;
        if (!this.castleBroken && castleSx <= BB_SCREEN_X + bb.width * 2 - 6) {
          this.castleBroken = true;
          this.castleBreakStart = now;
          this.audio.break();
        }
      }
      this.updateRunners(now, step);
    }

    this.updateGoombas(now, step);
    this.updateItems(now, step);
    this.updateParticles(step);
    if (this.endingPhase !== "volcano") {
      this.ensureWorld();
      this.followCamera(step, this.endingPhase === "approach" || this.endingPhase === "enter");
    }
  }

  private driveActors(now: number, step: number, phase: "play" | "approach" | "enter") {
    const auto = this.idle(now);
    const userMove = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    const userJumpEdge = this.input.consume("jump");
    const door = this.endingCastleX + CASTLE_DOOR_X;

    this.players.forEach((p, i) => {
      if (p.dead) {
        this.updateDead(p, now, step);
        return;
      }
      if (p.inside) {
        if (phase === "enter" && i === this.enterIdx) {
          p.fade = Math.max(0, p.fade - 0.05 * step);
          if (p.fade <= 0) {
            this.enterIdx += 1;
            if (this.enterIdx >= this.players.length) {
              this.endingPhase = "flag";
              this.flagStart = now;
            }
          }
        }
        return;
      }

      let move = userMove;
      let wantJump = userJumpEdge;

      if (phase === "enter") {
        if (i !== this.enterIdx) {
          move = 0;
          wantJump = false;
        } else {
          move = p.x + p.w / 2 < door ? 1 : 0;
          // The walk to the door may cross pits/walls/goombas (the castle can
          // spawn anywhere) — auto-jump or the entering player would fall in.
          wantJump = move === 1 && this.shouldAutoJump(p);
          if (p.x + p.w / 2 >= door) {
            p.inside = true;
            p.fade = 1;
            move = 0;
          }
        }
      } else if (auto) {
        move = 1;
        wantJump = wantJump || this.shouldAutoJump(p);
      }

      this.steerPlayer(p, now, step, move, wantJump);
      this.movePlayer(now, step, p);

      // Never let players run past/through the castle doorway during the ending.
      if ((phase === "approach" || phase === "enter") && !p.inside && p.x + p.w / 2 > door) {
        p.x = door - p.w / 2;
        if (p.vx > 0) p.vx = 0;
      }

      if (!p.dead) this.playerFx(p, now, step);
      if (p.y > this.level.h * TILE + 8) this.kill(p, now);
    });
  }

  private steerPlayer(p: Player, now: number, step: number, move: number, wantJump: boolean) {
    const accel = this.input.run && !this.idle(now) ? RUN_ACCEL : WALK_ACCEL;
    const max = this.input.run && !this.idle(now) ? MAX_RUN : MAX_WALK;
    p.skidding = false;
    if (move !== 0) {
      if (Math.sign(p.vx) !== 0 && Math.sign(p.vx) !== move && p.grounded) p.skidding = true;
      p.vx += move * accel * step;
      p.facing = move > 0 ? 1 : -1;
    } else {
      const fr = p.grounded ? FRICTION : AIR_FRICTION;
      if (Math.abs(p.vx) <= fr * step) p.vx = 0;
      else p.vx -= Math.sign(p.vx) * fr * step;
    }
    p.vx = Math.max(-max, Math.min(max, p.vx));

    if (p.grounded) p.coyoteUntil = now + COYOTE_MS;
    if (wantJump) p.jumpBufUntil = now + JUMP_BUFFER_MS;
    if (now < p.jumpBufUntil && now < p.coyoteUntil) {
      p.vy = JUMP_VEL;
      p.grounded = false;
      p.jumpHeld = true;
      p.jumpBufUntil = 0;
      p.coyoteUntil = 0;
      this.audio.jump();
    }
    if (!this.input.jump && !this.idle(now)) {
      if (p.jumpHeld && p.vy < JUMP_CUT) p.vy = JUMP_CUT;
      p.jumpHeld = false;
    }
    if (this.idle(now) && p.jumpHeld && p.vy > JUMP_CUT) p.jumpHeld = true;
    const g = p.jumpHeld && p.vy < 0 ? HOLD_GRAVITY : GRAVITY;
    p.vy = Math.min(MAX_FALL, p.vy + g * step);
  }

  private shouldAutoJump(p: Player): boolean {
    if (!p.grounded) return false;
    const feet = p.x + p.w / 2;
    const gy = this.level.h - 2;
    for (let look = 10; look <= 42; look += 8) {
      const tx = Math.floor((feet + look) / TILE);
      if (!isSolid(tileAt(this.level, tx, gy))) return true;
    }
    const ahead = Math.floor((p.x + p.w + 8) / TILE);
    const bodyY = Math.floor((p.y + p.h * 0.55) / TILE);
    if (isSolid(tileAt(this.level, ahead, bodyY))) return true;
    for (const g of this.goombas) {
      if (g.dead || g.flatUntil) continue;
      const dx = g.x - (p.x + p.w);
      if (dx > 0 && dx < 30 && Math.abs(g.y - p.y) < 22) return true;
    }
    // Bumpable blocks within jump reach above (or just ahead) — the old check
    // looked at a row no block ever occupies, so auto-play never hit blocks.
    const headRow = Math.floor((p.y - 2) / TILE);
    const cols = [Math.floor((p.x + p.w / 2) / TILE), Math.floor((p.x + p.w + 4) / TILE)];
    for (const tx of cols) {
      for (let ty = headRow - 1; ty >= Math.max(0, headRow - 4); ty--) {
        const t = tileAt(this.level, tx, ty);
        if (t === T.QCOIN || t === T.QMUSH || t === T.QSTAR || t === T.BRICK) return true;
        if (isSolid(t)) break;
      }
    }
    return false;
  }

  private movePlayer(now: number, step: number, p: Player) {
    // Sub-step integration: at low frame rates a full step can exceed one tile
    // (MAX_FALL 7.5 * step 2.4 ≈ 18px > 16px) and the player tunneled through
    // floors/ceilings. Cap each sub-step at 8px.
    const n = Math.max(1, Math.ceil((Math.max(Math.abs(p.vx), Math.abs(p.vy)) * step) / 8));
    const wasGrounded = p.grounded;
    const fallSpeed = p.vy;
    p.grounded = false;
    let bumped = false;
    let landed = false;
    for (let i = 0; i < n; i++) {
      p.x += (p.vx * step) / n;
      this.collideAxis(p, "x");
      p.y += (p.vy * step) / n;
      const hitHead = this.collideAxis(p, "y");
      if (hitHead && p.vy <= 0 && !bumped) {
        bumped = true;
        this.bumpAbove(now, p);
        p.vy = 1.2;
      }
      if (!landed && !wasGrounded && p.grounded && fallSpeed > 3.5) landed = true;
    }
    if (landed) this.spawnPoof(p);
    // Classic left-edge screen wall during free play (keeps the trailing
    // player from being abandoned off-camera), but never shove into solids.
    if (this.mode === "playing") {
      const minX = this.camera.x + 2;
      if (p.x < minX && !this.boxHitsSolid(minX, p.y, p.w, p.h)) {
        p.x = minX;
        if (p.vx < 0) p.vx = 0;
      }
    }
    p.anim += Math.abs(p.vx) * 0.18 * step;
  }

  private boxHitsSolid(x: number, y: number, w: number, h: number) {
    const x0 = Math.floor(x / TILE);
    const x1 = Math.floor((x + w - 0.001) / TILE);
    const y0 = Math.floor(y / TILE);
    const y1 = Math.floor((y + h - 0.001) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (isSolid(tileAt(this.level, tx, ty))) return true;
      }
    }
    return false;
  }

  private collideAxis(p: Player, axis: "x" | "y"): boolean {
    let hitHead = false;
    const x0 = Math.floor(p.x / TILE);
    const x1 = Math.floor((p.x + p.w - 0.001) / TILE);
    const y0 = Math.floor(p.y / TILE);
    const y1 = Math.floor((p.y + p.h - 0.001) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = tileAt(this.level, tx, ty);
        if (!isSolid(t)) continue;
        const rx = tx * TILE;
        const ry = ty * TILE;
        if (!aabb(p.x, p.y, p.w, p.h, rx, ry, TILE, TILE)) continue;
        if (axis === "x") {
          if (p.vx > 0) p.x = rx - p.w;
          else if (p.vx < 0) p.x = rx + TILE;
          else {
            const overlapL = p.x + p.w - rx;
            const overlapR = rx + TILE - p.x;
            p.x += overlapL < overlapR ? -overlapL : overlapR;
          }
          p.vx = 0;
        } else if (p.vy > 0) {
          p.y = ry - p.h;
          p.vy = 0;
          p.grounded = true;
        } else if (p.vy < 0) {
          p.y = ry + TILE;
          hitHead = true;
        } else {
          p.y = ry - p.h;
          p.grounded = true;
        }
      }
    }
    return hitHead;
  }

  private bumpAbove(now: number, p: Player) {
    const ty = Math.floor((p.y - 1) / TILE);
    const cx = p.x + p.w / 2;
    const tx = Math.floor(cx / TILE);
    let best: { tx: number; dist: number } | null = null;
    for (const col of [tx, tx - 1, tx + 1]) {
      const t = tileAt(this.level, col, ty);
      if (!isBumpable(t) && t !== T.HARD && t !== T.PIPETOP && t !== T.PIPE && t !== T.GROUND) continue;
      const dist = Math.abs(col * TILE + TILE / 2 - cx);
      if (!best || dist < best.dist) best = { tx: col, dist };
    }
    if (!best) return;
    const t = tileAt(this.level, best.tx, ty);
    // Only bumpable tiles play the bounce animation — pipes/ground/hard blocks
    // visually jumping looked broken. They still thud and bonk enemies above.
    if (isBumpable(t)) this.bumps.push({ tx: best.tx, ty, start: now });
    this.audio.bump();
    this.bonkEnemy(best.tx, ty);
    if (t === T.QCOIN || t === T.QMUSH || t === T.QSTAR) {
      setTile(this.level, best.tx, ty, T.USED);
      const x = best.tx * TILE;
      const y = ty * TILE;
      if (t === T.QCOIN) this.spawnCoinPop(x, y, now);
      else if (t === T.QMUSH && !p.big) {
        this.items.push({ kind: "mushroom", x, y: y - 2, vx: 0.7, vy: -1.2, w: 16, h: 16, life: 99999, born: now });
        this.audio.power();
      } else {
        this.items.push({ kind: "star", x, y: y - 2, vx: 0.9, vy: -3.4, w: 16, h: 16, life: 99999, born: now });
        this.audio.power();
      }
    } else if (t === T.BRICK && p.big) {
      setTile(this.level, best.tx, ty, T.EMPTY);
      this.audio.break();
      this.shatter(best.tx * TILE, ty * TILE);
      this.addScore(50, best.tx * TILE, ty * TILE);
    }
  }

  private bonkEnemy(tx: number, ty: number) {
    const rx = tx * TILE;
    const ry = (ty - 1) * TILE;
    for (const g of this.goombas) {
      if (g.dead || g.flatUntil) continue;
      if (aabb(g.x, g.y, g.w, g.h, rx, ry, TILE, TILE)) {
        g.dead = true;
        g.falling = true;
        g.vy = -4;
        g.vx = 1.2;
        this.addScore(100, g.x, g.y);
      }
    }
  }

  private spawnCoinPop(x: number, y: number, now: number) {
    this.audio.coin();
    this.coins += 1;
    this.addScore(200, x, y);
    this.items.push({ kind: "coinpop", x: x + 4, y: y - 8, vx: 0, vy: -3.2, w: 8, h: 8, life: 28, born: now });
    if (this.coins >= 100) {
      this.coins -= 100;
      this.lives += 1;
      this.audio.oneUp();
      this.flashUntil = now + 400;
    }
  }

  private shatter(x: number, y: number) {
    for (const [vx, vy] of [
      [-1.6, -4],
      [1.6, -4],
      [-2.2, -2.2],
      [2.2, -2.2],
    ] as const) {
      this.particles.push({ x: x + 4, y: y + 4, vx, vy, color: COLORS.brick, life: 40, size: 5 });
    }
  }

  private playerFx(p: Player, now: number, step: number) {
    if (p.skidding && p.grounded && Math.random() < 0.35 * step) {
      this.particles.push({
        x: p.x + p.w / 2 + p.facing * 4,
        y: p.y + p.h - 3,
        vx: -p.facing * (0.4 + Math.random() * 0.6),
        vy: -(0.3 + Math.random() * 0.7),
        color: "#e8e8e8",
        life: 16 + Math.random() * 8,
        size: 2,
      });
    }
    if (now < p.starUntil && Math.random() < 0.6 * step) {
      this.particles.push({
        x: p.x + Math.random() * p.w,
        y: p.y + Math.random() * p.h,
        vx: -p.vx * 0.25,
        vy: -0.2 - Math.random() * 0.4,
        color: STAR_TRAIL_COLORS[Math.floor(now / 60) % STAR_TRAIL_COLORS.length],
        life: 20,
        maxLife: 20,
        size: 2,
        nog: true,
        tw: true,
      });
    }
  }

  private spawnPoof(p: Player) {
    for (const [vx, vy] of [
      [-0.9, -0.5],
      [0.9, -0.5],
      [-0.5, -1.1],
      [0.5, -1.1],
    ] as const) {
      this.particles.push({ x: p.x + p.w / 2 - 1, y: p.y + p.h - 3, vx, vy, color: "#f4f4f4", life: 18, size: 2 });
    }
  }

  private livingPlayers() {
    return this.players.filter((p) => !p.dead && !p.inside);
  }

  private livingRunners() {
    return this.runners.filter((r) => r.active && r.emerged && !r.dead);
  }

  private updateGoombas(now: number, step: number) {
    for (const g of this.goombas) {
      if (g.flatUntil) {
        if (now > g.flatUntil) g.dead = true;
        continue;
      }
      if (g.dead && g.falling) {
        g.vy += GRAVITY * step;
        g.x += g.vx * step;
        g.y += g.vy * step;
        continue;
      }
      if (g.dead) continue;
      if (g.x + g.w < this.camera.x - 32 || g.x > this.camera.x + VIEW_W + 160) continue;

      g.x += g.vx * step;
      const volcano = this.endingPhase === "volcano";
      // Wall turns only while grounded — flipping mid-air let goombas bounce
      // off pit walls and climb back out. Volcano ground is not a tilemap.
      if (!g.falling && !volcano) {
        const dir = Math.sign(g.vx) || -1;
        const front = dir > 0 ? g.x + g.w : g.x;
        const tx = Math.floor(front / TILE);
        const ty = Math.floor((g.y + 2) / TILE);
        if (isSolid(tileAt(this.level, tx, ty))) {
          g.x = dir > 0 ? tx * TILE - g.w : (tx + 1) * TILE;
          g.vx *= -1;
        }
      }
      if (volcano) {
        const gy = (this.level.h - 2) * TILE;
        const overHole = this.overHoleWorld(g.x + g.w / 2, 6);
        if (overHole) {
          g.falling = true;
          g.vy += GRAVITY * step;
          g.y += g.vy * step;
          if (g.y > VIEW_H + 40) g.dead = true;
        } else {
          g.falling = false;
          g.vy = 0;
          g.y = gy - g.h;
        }
      } else {
        const below = tileAt(this.level, Math.floor((g.x + g.w / 2) / TILE), Math.floor((g.y + g.h + 1) / TILE));
        if (!isSolid(below)) {
          g.falling = true;
          g.vy += GRAVITY * step;
          g.y += g.vy * step;
          if (g.y > this.level.h * TILE) g.dead = true;
        } else {
          g.falling = false;
          g.vy = 0;
          g.y = Math.floor((g.y + g.h + 1) / TILE) * TILE - g.h;
        }
      }

      if (volcano) {
        for (const r of this.livingRunners()) {
          const jumpY = this.peekJumpY(r, now);
          const gsx = g.x - this.camera.x;
          if (!aabb(r.x + 2, r.y + jumpY + 2, r.w - 4, r.h - 2, gsx + 2, g.y + 2, g.w - 4, g.h - 2)) continue;
          const p = r.jumping ? (now - r.jumpStart) / JUMP_DUR : 0;
          if (r.jumping && p > 0.45) {
            g.flatUntil = now + 500;
            g.vx = 0;
            this.addScore(100, g.x, g.y);
            this.audio.stomp();
            break;
          }
          if (now < r.starUntil) {
            g.dead = true;
            g.falling = true;
            g.vy = -4;
            this.addScore(200, g.x, g.y);
            this.audio.stomp();
            break;
          }
          if (now >= r.safeUntil) {
            this.hurtRunner(r, now, jumpY);
            break;
          }
        }
      } else {
        for (const p of this.livingPlayers()) {
          const star = now < p.starUntil;
          if (!aabb(p.x, p.y, p.w, p.h, g.x + 2, g.y + 2, g.w - 4, g.h - 2)) continue;
          if (star) {
            g.dead = true;
            g.falling = true;
            g.vy = -4;
            this.addScore(200, g.x, g.y);
            this.audio.stomp();
            break;
          }
          if (p.vy > 0 && p.y + p.h - 6 < g.y + 8) {
            g.flatUntil = now + 500;
            g.vx = 0;
            p.vy = STOMP_BOUNCE;
            this.addScore(100, g.x, g.y);
            this.audio.stomp();
            break;
          }
          if (now > p.invUntil) this.hurt(p, now);
        }
      }
    }

    // Goombas shove each other apart instead of stacking into one sprite.
    for (let i = 0; i < this.goombas.length; i++) {
      const a = this.goombas[i];
      if (a.dead || a.flatUntil !== 0 || a.falling) continue;
      for (let j = i + 1; j < this.goombas.length; j++) {
        const b = this.goombas[j];
        if (b.dead || b.flatUntil !== 0 || b.falling) continue;
        if (!aabb(a.x, a.y, a.w, a.h, b.x, b.y, b.w, b.h)) continue;
        if (a.x <= b.x) {
          a.x = b.x - a.w;
          a.vx = -Math.abs(a.vx);
          b.vx = Math.abs(b.vx);
        } else {
          b.x = a.x - b.w;
          b.vx = -Math.abs(b.vx);
          a.vx = Math.abs(a.vx);
        }
      }
    }
  }

  private updateItems(now: number, step: number) {
    const people = this.livingPlayers();
    for (const it of this.items) {
      if (it.kind === "coinpop") {
        it.y += it.vy * step;
        it.vy += 0.18 * step;
        it.life -= step;
        continue;
      }
      // Cap item fall speed below one tile per max step so stars/mushrooms
      // can't tunnel through the floor on a slow frame.
      const volcano = this.endingPhase === "volcano";
      it.vy = Math.min(6, it.vy + GRAVITY * 0.7 * step);
      it.x += it.vx * step;
      if (!volcano) {
        const tx = Math.floor((it.vx > 0 ? it.x + it.w : it.x) / TILE);
        const ty = Math.floor((it.y + it.h / 2) / TILE);
        if (isSolid(tileAt(this.level, tx, ty))) {
          it.x = it.vx > 0 ? tx * TILE - it.w : (tx + 1) * TILE;
          it.vx *= -1;
        }
      }
      it.y += it.vy * step;
      if (volcano) {
        const gy = (this.level.h - 2) * TILE;
        if (!this.overHoleWorld(it.x + it.w / 2, 4) && it.y + it.h >= gy) {
          it.y = gy - it.h;
          it.vy = it.kind === "star" ? -3.6 : 0;
        }
      } else {
        const by = Math.floor((it.y + it.h) / TILE);
        const bx = Math.floor((it.x + it.w / 2) / TILE);
        if (isSolid(tileAt(this.level, bx, by))) {
          it.y = by * TILE - it.h;
          it.vy = it.kind === "star" ? -3.6 : 0;
        }
      }
      if (it.y > this.level.h * TILE + 32) {
        it.life = 0;
        continue;
      }
      let collected = false;
      for (const p of people) {
        if (!aabb(p.x, p.y, p.w, p.h, it.x, it.y, it.w, it.h)) continue;
        it.life = 0;
        if (it.kind === "mushroom") {
          this.grow(p, now);
          this.addScore(1000, it.x, it.y);
        } else {
          p.starUntil = now + STAR_MS;
          this.addScore(1000, it.x, it.y);
        }
        this.audio.power();
        collected = true;
        break;
      }
      if (!collected && volcano) {
        for (const r of this.livingRunners()) {
          const jumpY = this.peekJumpY(r, now);
          if (!aabb(r.x, r.y + jumpY, r.w, r.h, it.x - this.camera.x, it.y, it.w, it.h)) continue;
          it.life = 0;
          if (it.kind === "mushroom") this.growRunner(r, now);
          else r.starUntil = now + STAR_MS;
          this.addScore(1000, it.x, it.y);
          this.audio.power();
          break;
        }
      }
    }
    this.items = this.items.filter((it) => it.life > 0);
    this.bumps = this.bumps.filter((b) => now - b.start < 220);
    for (const c of this.worldCoins) {
      if (c.taken) continue;
      if (Math.random() < 0.012 * step) {
        this.particles.push({
          x: c.x + 1 + Math.random() * 6,
          y: c.y - 2 + Math.random() * 10,
          vx: 0,
          vy: -0.15,
          color: "#fff8a0",
          life: 16,
          maxLife: 16,
          size: 2,
          nog: true,
          tw: true,
        });
      }
      if (people.some((p) => aabb(p.x, p.y, p.w, p.h, c.x, c.y, 8, 8))) {
        c.taken = true;
        this.spawnCoinPop(c.x - 4, c.y + 8, now);
        continue;
      }
      if (this.endingPhase === "volcano") {
        for (const r of this.livingRunners()) {
          const jumpY = this.peekJumpY(r, now);
          if (!aabb(r.x, r.y + jumpY, r.w, r.h, c.x - this.camera.x, c.y, 8, 8)) continue;
          c.taken = true;
          this.spawnCoinPop(c.x - 4, c.y + 8, now);
          break;
        }
      }
    }
  }

  private updateParticles(step: number) {
    for (const pt of this.particles) {
      if (!pt.nog) pt.vy += GRAVITY * step;
      pt.x += pt.vx * step;
      pt.y += pt.vy * step;
      pt.life -= step;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);
  }

  private grow(p: Player, now: number) {
    p.bigUntil = now + GROW_MS;
    if (p.big) {
      this.addScore(1000, p.x, p.y);
      return;
    }
    const newY = p.y - (BIG_H - SMALL_H);
    // Growing under a low ceiling used to clip the player into the block above;
    // only grow when there is headroom.
    if (this.boxHitsSolid(p.x, newY, p.w, BIG_H)) {
      this.addScore(1000, p.x, p.y);
      return;
    }
    p.big = true;
    p.y = newY;
    p.h = BIG_H;
  }

  private shrink(p: Player) {
    if (!p.big) return;
    p.big = false;
    p.bigUntil = 0;
    p.h = SMALL_H;
    p.y += BIG_H - SMALL_H;
  }

  private tickGrow(now: number) {
    for (const p of this.players) {
      if (!p.dead && p.big && now >= p.bigUntil) this.shrink(p);
    }
    for (const r of this.runners) {
      if (!r.dead && r.big && now >= r.bigUntil) {
        r.big = false;
        r.bigUntil = 0;
        this.syncRunnerSize(r);
      }
    }
  }

  private hurt(p: Player, now: number) {
    if (now < p.starUntil) return;
    if (p.big) {
      this.shrink(p);
      p.invUntil = now + INVINCIBLE_MS;
      this.audio.hurt();
      return;
    }
    this.kill(p, now);
  }

  private kill(p: Player, now: number) {
    if (p.dead || p.inside) return;
    p.dead = true;
    p.deathStart = now;
    p.deathY = p.y;
    p.deathVy = DEATH_BOUNCE;
    p.respawnAt = now + DEATH_RESPAWN_MS;
    this.audio.die();
  }

  private updateDead(p: Player, now: number, step: number) {
    p.deathVy += DEATH_GRAVITY * step;
    p.deathY += p.deathVy * step;
    if (now >= p.respawnAt) this.respawnPlayer(p, now);
  }

  private respawnPlayer(p: Player, now: number) {
    p.dead = false;
    p.vx = 0;
    p.vy = 0;
    p.big = false;
    p.h = SMALL_H;
    const want = this.camera.x + 28 + (p.id === "jason" ? 0 : 18);
    p.x = this.findRespawnX(want);
    p.y = (this.level.h - 2) * TILE - SMALL_H;
    p.facing = 1;
    p.inside = false;
    p.fade = 1;
    p.starUntil = 0;
    p.bigUntil = 0;
    p.invUntil = now + 1500;
  }

  // Respawning at a fixed camera offset could drop the player into a pit or
  // inside a pipe (an infinite death loop). Scan for safe, solid footing.
  private findRespawnX(want: number) {
    const gy = this.level.h - 2;
    const maxX = this.level.w * TILE - TILE - PLAYER_W - 4;
    const clear = (px: number) => {
      if (px < 4 || px > maxX) return false;
      const tx = Math.floor((px + PLAYER_W / 2) / TILE);
      if (!isSolid(tileAt(this.level, tx, gy))) return false;
      for (let ty = gy - 1; ty >= Math.max(0, gy - 3); ty--) {
        if (isSolid(tileAt(this.level, tx, ty))) return false;
      }
      return true;
    };
    if (clear(want)) return want;
    for (let d = 1; d <= 16; d++) {
      if (clear(want + d * TILE)) return want + d * TILE;
      if (clear(want - d * TILE)) return want - d * TILE;
    }
    return this.level.spawn.x;
  }

  private addScore(n: number, x: number, y: number) {
    this.score += n;
    this.particles.push({ x, y, vx: 0, vy: -0.6, color: COLORS.white, life: 40, size: -n, nog: true });
  }

  private absorbSpawns(spawned: LevelSpawned) {
    for (const g of spawned.goombas) {
      this.goombas.push({
        x: g.x,
        y: g.y,
        vx: -0.45,
        w: 16,
        h: 16,
        flatUntil: 0,
        dead: false,
        falling: false,
        vy: 0,
      });
    }
    for (const c of spawned.coins) this.worldCoins.push({ ...c, taken: false });
    this.level.deco.push(...spawned.deco);
  }

  private ensureWorld() {
    const need = Math.floor((this.camera.x + VIEW_W + 480) / TILE) + 2;
    this.absorbSpawns(extendLevel(this.level, need));
    const left = this.camera.x - 96;
    this.goombas = this.goombas.filter((g) => g.x + g.w > left || (g.dead && g.falling));
    this.worldCoins = this.worldCoins.filter((c) => !c.taken && c.x > left);
    if (this.level.deco.length > 64) {
      this.level.deco = this.level.deco.filter((d) => d.x > this.camera.x - 500);
    }
  }

  private followCamera(step: number, towardCastle = false) {
    const living = this.livingPlayers();
    let target = living.length ? Math.max(...living.map((p) => p.x)) - VIEW_W * 0.38 : this.camera.x;
    if (living.length > 1) {
      const minX = Math.min(...living.map((p) => p.x));
      const maxX = Math.max(...living.map((p) => p.x));
      if (maxX - minX < VIEW_W - 72) target = Math.min(target, minX - 24);
    }
    this.camera.x += (target - this.camera.x) * 0.14 * step;
    let maxCam = Math.max(0, this.level.w * TILE - VIEW_W);
    if (towardCastle) maxCam = Math.max(0, this.endingCastleX - 40);
    this.camera.x = Math.max(0, Math.min(maxCam, this.camera.x));
  }

  private holeW(h: HoleState) {
    return h.tiles * TILE;
  }

  private snapTile(x: number) {
    return Math.round(x / TILE) * TILE;
  }

  private spawnHoles() {
    this.holes = [];
    let x = this.snapTile(this.camera.x + VIEW_W + 180);
    for (let i = 0; i < HOLE_COUNT; i++) {
      this.holes.push({ worldX: x, tiles: PHASE1_PIT_TILES[i % PHASE1_PIT_TILES.length] });
      x = this.snapTile(x + randomHoleGap());
    }
  }

  private recycleHoles() {
    for (const h of this.holes) {
      const sx = h.worldX - this.camera.x;
      if (sx + this.holeW(h) < -40) {
        const maxX = Math.max(...this.holes.map((o) => o.worldX + this.holeW(o)));
        h.worldX = this.snapTile(maxX + randomHoleGap());
        h.tiles = randomPhase1PitTiles();
      }
    }
  }

  private overHoleWorld(wx: number, pad = 0) {
    return this.holes.some((h) => wx >= h.worldX - pad && wx < h.worldX + this.holeW(h) + pad);
  }

  private seedVolcanoField() {
    this.items = [];
    this.goombas = [];
    this.bumps = [];
    this.worldCoins = [];
    this.volcanoBlocks = [];
    this.volcanoNextX = this.camera.x + VIEW_W + 48;
    for (let i = 0; i < 10; i++) this.placeVolcanoChunk();
  }

  private placeVolcanoChunk() {
    let x = this.volcanoNextX;
    let skip = 0;
    while (skip < 40 && (this.overHoleWorld(x, 28) || this.overHoleWorld(x + 48, 28))) {
      x += 32;
      skip++;
    }
    const gy = (this.level.h - 2) * TILE;
    const kind = Math.random();
    if (kind < 0.38) {
      this.spawnVolcanoGoomba(x);
      if (Math.random() < 0.5) this.spawnVolcanoGoomba(x + 28);
      if (Math.random() < 0.55) {
        for (let i = 0; i < 3; i++) {
          const cx = x + 8 + i * 18;
          if (this.overHoleWorld(cx, 8)) continue;
          this.worldCoins.push({ x: cx, y: gy - 52 - (i % 2) * 10, taken: false });
        }
      }
    } else if (kind < 0.72) {
      const n = 2 + Math.floor(Math.random() * 3);
      const tiles = [T.BRICK, T.QCOIN, T.BRICK, T.QMUSH, T.QCOIN, T.BRICK];
      for (let i = 0; i < n; i++) {
        const wx = x + i * TILE;
        if (this.overHoleWorld(wx, 8)) continue;
        this.volcanoBlocks.push({
          worldX: wx,
          ty: 9,
          tile: tiles[(i + Math.floor(Math.random() * 3)) % tiles.length],
          hit: false,
        });
      }
      if (Math.random() < 0.5) {
        for (let i = 0; i < n; i++) {
          const cx = x + i * TILE + 4;
          if (this.overHoleWorld(cx, 8)) continue;
          this.worldCoins.push({ x: cx, y: gy - 80, taken: false });
        }
      }
    } else {
      const n = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const cx = x + i * 18;
        if (this.overHoleWorld(cx, 8)) continue;
        this.worldCoins.push({ x: cx, y: gy - 48 - (i % 2) * 12, taken: false });
      }
    }
    this.volcanoNextX = x + 130 + Math.random() * 170;
  }

  private spawnVolcanoGoomba(x: number) {
    if (this.overHoleWorld(x, 16)) return;
    const gy = (this.level.h - 2) * TILE;
    this.goombas.push({
      x,
      y: gy - 16,
      vx: -0.45,
      w: 16,
      h: 16,
      flatUntil: 0,
      dead: false,
      falling: false,
      vy: 0,
    });
  }

  private recycleVolcanoField() {
    const left = this.camera.x - 48;
    this.goombas = this.goombas.filter((g) => g.x + g.w > left && (!g.dead || g.falling));
    this.worldCoins = this.worldCoins.filter((c) => !c.taken && c.x > left);
    this.volcanoBlocks = this.volcanoBlocks.filter((b) => b.worldX + TILE > left);
    const ahead = this.camera.x + VIEW_W + 280;
    while (this.volcanoNextX < ahead) this.placeVolcanoChunk();
  }

  private bumpVolcanoBlocks(r: Runner, now: number, jumpY: number) {
    if (!r.jumping) return;
    const p = (now - r.jumpStart) / JUMP_DUR;
    if (p >= 0.5) return;
    const cam = this.camera.x;
    const headY = r.y + jumpY;
    for (const b of this.volcanoBlocks) {
      if (b.tile === T.USED || b.tile === T.EMPTY) continue;
      const sx = b.worldX - cam;
      const by = b.ty * TILE;
      if (!aabb(r.x + 2, headY, r.w - 4, 10, sx, by + TILE - 8, TILE, 10)) continue;
      this.audio.bump();
      this.bumps.push({ tx: Math.round(b.worldX / TILE), ty: b.ty, start: now });
      this.bonkEnemy(Math.round(b.worldX / TILE), b.ty);
      if (b.tile === T.QCOIN || b.tile === T.QMUSH || b.tile === T.QSTAR) {
        const prev = b.tile;
        b.tile = T.USED;
        b.hit = true;
        if (prev === T.QCOIN) this.spawnCoinPop(b.worldX, by, now);
        else if (prev === T.QMUSH) {
          this.items.push({
            kind: "mushroom",
            x: b.worldX,
            y: by - 2,
            vx: 0.7,
            vy: -1.2,
            w: 16,
            h: 16,
            life: 99999,
            born: now,
          });
          this.audio.power();
        } else {
          this.items.push({
            kind: "star",
            x: b.worldX,
            y: by - 2,
            vx: 0.9,
            vy: -3.4,
            w: 16,
            h: 16,
            life: 99999,
            born: now,
          });
          this.audio.power();
        }
      } else if (b.tile === T.BRICK && r.big) {
        b.tile = T.EMPTY;
        b.hit = true;
        this.audio.break();
        this.shatter(b.worldX, by);
        this.addScore(50, b.worldX, by);
      }
      break;
    }
  }

  private feetOverHole(feetX: number) {
    for (const h of this.holes) {
      const left = h.worldX - this.camera.x;
      const right = left + this.holeW(h);
      if (feetX >= left && feetX < right) return true;
    }
    return false;
  }

  private enemyAhead(feetX: number) {
    for (const g of this.goombas) {
      if (g.dead || g.flatUntil || g.falling) continue;
      const dx = g.x - this.camera.x - feetX;
      if (dx > -2 && dx < 28) return true;
    }
    return false;
  }

  private holeAhead(feetX: number) {
    for (const h of this.holes) {
      const left = h.worldX - this.camera.x;
      const dist = left - feetX;
      if (dist > -2 && dist < HOLE_AUTO_LEAD) return true;
    }
    return false;
  }

  private spawnRunners(now: number) {
    const doorScreen = this.endingCastleX + CASTLE_DOOR_X - this.camera.x;
    const ground = (this.level.h - 2) * TILE;
    this.runners = RUNNER_DEFS.map((def) => {
      const img = this.runnerFrame(def.kind, false);
      const h = img.height * def.scale;
      const w = img.width * def.scale;
      return {
        name: def.name,
        kind: def.kind,
        x: doorScreen - w / 2,
        y: ground - h,
        w,
        h,
        facing: 1 as const,
        jumping: false,
        jumpStart: 0,
        anim: 0,
        scale: def.scale,
        xRatio: def.xRatio,
        startAt: now + def.exitDelay,
        emerged: false,
        active: false,
        startsCountUp: def.startsCountUp,
        opacity: 0,
        safeUntil: now + def.exitDelay + 3000,
        big: false,
        starUntil: 0,
        bigUntil: 0,
        dead: false,
        deathKind: "bounce" as const,
        deathStart: 0,
        deathY: 0,
        deathVy: 0,
        respawnAt: 0,
      };
    });
  }

  private runnerVisualScale(r: Runner) {
    return r.scale * (r.big ? 2 : 1);
  }

  private syncRunnerSize(r: Runner) {
    const img = this.runnerFrame(r.kind, false);
    const s = this.runnerVisualScale(r);
    r.w = img.width * s;
    r.h = img.height * s;
    r.y = (this.level.h - 2) * TILE - r.h;
    r.x = Math.max(8, Math.min(VIEW_W - r.w - 8, r.x));
  }

  private growRunner(r: Runner, now: number) {
    r.bigUntil = now + GROW_MS;
    if (r.big) {
      this.addScore(1000, r.x + this.camera.x, r.y);
      return;
    }
    r.big = true;
    this.syncRunnerSize(r);
  }

  private hurtRunner(r: Runner, now: number, jumpY: number) {
    if (now < r.starUntil) return;
    if (r.big) {
      r.big = false;
      r.bigUntil = 0;
      this.syncRunnerSize(r);
      r.safeUntil = now + INVINCIBLE_MS;
      this.audio.hurt();
      return;
    }
    this.killRunner(r, now, jumpY, "bounce");
  }

  private killRunner(r: Runner, now: number, jumpY: number, kind: "bounce" | "pit") {
    if (r.dead) return;
    r.dead = true;
    r.deathKind = kind;
    r.deathStart = now;
    r.deathY = jumpY;
    r.deathVy = kind === "pit" ? 1.2 : DEATH_BOUNCE_VY;
    r.jumping = false;
    r.respawnAt = now + DEATH_RESPAWN_MS;
    this.audio.die();
  }

  private respawnRunner(r: Runner, now: number) {
    const doorScreen = this.endingCastleX + CASTLE_DOOR_X - this.camera.x;
    r.dead = false;
    r.deathKind = "bounce";
    r.deathY = 0;
    r.deathVy = 0;
    r.deathStart = 0;
    r.jumping = false;
    r.jumpStart = 0;
    r.facing = 1;
    r.emerged = false;
    r.active = true;
    r.x = doorScreen > 40 && doorScreen < VIEW_W - 24 ? doorScreen - r.w / 2 : VIEW_W * r.xRatio;
    r.startAt = now;
    r.respawnAt = 0;
    r.opacity = 0;
    r.safeUntil = now + 2600;
    r.big = false;
    r.starUntil = 0;
    r.bigUntil = 0;
    this.syncRunnerSize(r);
  }

  private runnerJumpY(r: Runner, now: number) {
    if (!r.jumping) return 0;
    const p = (now - r.jumpStart) / JUMP_DUR;
    if (p >= 1) {
      r.jumping = false;
      return 0;
    }
    return -4 * JUMP_HEIGHT * p * (1 - p);
  }

  private updateRunners(now: number, step: number) {
    const auto = this.idle(now);
    const userMove = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    const userJump = this.input.consume("jump");
    const aftermath = this.endingPhase === "volcano";
    const bb = this.sprites.bullet;
    const bbW = bb.width * 2;
    const bbH = bb.height * 2;
    const ground = (this.level.h - 2) * TILE;

    for (const r of this.runners) {
      if (r.dead) {
        const frozen = r.deathKind === "bounce" && now - r.deathStart < DEATH_FREEZE_MS;
        if (!frozen) {
          r.deathVy += DEATH_GRAVITY * step;
          r.deathY += r.deathVy * step;
        }
        r.opacity = r.deathY > VIEW_H * 0.5 ? 0 : 1;
        if (now >= r.respawnAt) this.respawnRunner(r, now);
        continue;
      }

      if (now < r.startAt) continue;
      r.active = true;

      const controllable = aftermath && r.emerged;
      let jumpY = this.runnerJumpY(r, now);

      if (!r.emerged) {
        const target = VIEW_W * r.xRatio;
        r.x += (target - r.x) * 0.04 * step;
        r.opacity = Math.min(1, r.opacity + 0.035 * step);
        r.y = ground - r.h;
        r.anim += 0.2 * step;
        if (r.opacity >= 1 && Math.abs(r.x - target) < 4) {
          r.x = target;
          r.emerged = true;
          // The count-up starts exactly when Kirby finishes emerging.
          if (r.startsCountUp && !this.countUpSent) {
            this.countUpSent = true;
            this.countUpStart = Date.now();
            this.hooks.onCountUp?.();
          }
        }
        continue;
      }

      if (controllable) {
        if (userMove !== 0) {
          r.x += userMove * MOVE_SPEED * step;
          r.facing = userMove > 0 ? 1 : -1;
          r.x = Math.max(8, Math.min(VIEW_W - r.w - 8, r.x));
        }
        const autoJump = auto && !r.jumping && (this.holeAhead(r.x + r.w / 2) || this.enemyAhead(r.x + r.w / 2));
        if ((userJump || autoJump) && !r.jumping) {
          r.jumping = true;
          r.jumpStart = now;
          this.audio.jump();
        }
        jumpY = this.runnerJumpY(r, now);
        this.bumpVolcanoBlocks(r, now, jumpY);
        if (now < r.starUntil && Math.random() < 0.6 * step) {
          this.particles.push({
            x: this.camera.x + r.x + Math.random() * r.w,
            y: r.y + jumpY + Math.random() * r.h,
            vx: 0.2,
            vy: -0.2 - Math.random() * 0.4,
            color: STAR_TRAIL_COLORS[Math.floor(now / 60) % STAR_TRAIL_COLORS.length],
            life: 20,
            maxLife: 20,
            size: 2,
            nog: true,
            tw: true,
          });
        }

        // Brief grace after (re)appearing so a hole sliding underfoot
        // mid-emergence can't instantly kill. Star power also ignores Bullet Bill.
        if (now >= r.safeUntil) {
          const bbX = BB_SCREEN_X;
          const bbY = ground - bb.height * 2 - 4 + this.bulletBob;
          const overlapX = r.x + 4 < bbX + bbW - 4 && r.x + r.w - 4 > bbX + 4;
          const overlapY = r.y + jumpY + 2 < bbY + bbH - 4 && r.y + jumpY + r.h - 2 > bbY + 6;
          if (overlapX && overlapY && now >= r.starUntil) {
            this.hurtRunner(r, now, jumpY);
          } else if (!r.jumping && jumpY >= 0 && this.feetOverHole(r.x + r.w / 2)) {
            this.killRunner(r, now, 0, "pit");
          }
        }
      }

      r.y = ground - r.h;
      r.anim += 0.15 * step;
      r.opacity = 1;
    }
  }

  private runnerFrame(kind: Runner["kind"], walk: boolean) {
    const s = this.sprites;
    const b = walk;
    switch (kind) {
      case "penguin":
        return b ? s.penguinB : s.penguinA;
      case "bigpen":
        return b ? s.bigpenB : s.bigpenA;
      case "toad":
        return b ? s.toadB : s.toadA;
      case "kirby":
        return b ? s.kirbyB : s.kirbyA;
    }
  }

  private groundYAt(wx: number, fromY: number): number | null {
    if (this.endingPhase === "volcano") {
      if (this.overHoleWorld(wx, 0)) return null;
      return (this.level.h - 2) * TILE;
    }
    const tx = Math.floor(wx / TILE);
    let ty = Math.floor(fromY / TILE);
    if (ty < 0) ty = 0;
    for (; ty < this.level.h; ty++) {
      if (isSolid(tileAt(this.level, tx, ty))) return ty * TILE;
    }
    return null;
  }

  private shadowEllipse(x: number, y: number, rx: number, alpha: number) {
    const ctx = this.ctx;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(1.5, rx), 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private render(now: number) {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    const grd = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grd.addColorStop(0, this.lerpColor(COLORS.skyTop, "#1a0306", this.volcanoT));
    grd.addColorStop(0.62, this.lerpColor(COLORS.sky, "#2a060c", this.volcanoT));
    grd.addColorStop(1, this.lerpColor(COLORS.skyHorizon, "#8b1a12", this.volcanoT));
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    this.drawWorld(now);
    if (this.volcanoT > 0) {
      ctx.fillStyle = `rgba(200, 40, 8, ${this.volcanoT * 0.16})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    this.drawHud(now);
    if (this.idle(now) && (this.mode === "playing" || this.endingPhase === "volcano")) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(VIEW_W - 66, 27, 42, 13);
      this.text("AUTO", VIEW_W - 30, 34, COLORS.question, "right");
    }
  }

  private lerpColor(a: string, b: string, t: number) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const m = (s: number, e: number) => Math.round(s + (e - s) * t);
    const r = m((pa >> 16) & 255, (pb >> 16) & 255);
    const g = m((pa >> 8) & 255, (pb >> 8) & 255);
    const bl = m(pa & 255, pb & 255);
    return `rgb(${r},${g},${bl})`;
  }

  private drawWorld(now: number) {
    const ctx = this.ctx;
    const cam = this.camera.x;
    if (this.volcanoT > 0) this.drawVolcanoSky(cam, now);
    this.drawDeco(cam, now);

    const tx0 = Math.floor(cam / TILE) - 1;
    const tx1 = Math.floor((cam + VIEW_W) / TILE) + 1;
    const gy = this.level.h - 2;
    if (this.endingPhase === "volcano") {
      const groundImg = this.sprites.tiles[T.GROUND];
      for (let tx = tx0; tx <= tx1; tx++) {
        const worldX = tx * TILE;
        const hitHole = this.holes.some((h) => {
          const t0 = Math.round(h.worldX / TILE);
          return tx >= t0 && tx < t0 + h.tiles;
        });
        if (hitHole) continue;
        ctx.drawImage(groundImg, Math.round(worldX - cam), gy * TILE);
        ctx.drawImage(groundImg, Math.round(worldX - cam), (gy + 1) * TILE);
      }
    } else {
      const qFrame = this.sprites.questionFrames[Math.floor(now / 220) % 3];
      for (let ty = 0; ty < this.level.h; ty++) {
        for (let tx = Math.max(0, tx0); tx <= Math.min(this.level.w - 1, tx1); tx++) {
          const t = tileAt(this.level, tx, ty);
          let img = this.sprites.tiles[t];
          if (!img) continue;
          if (t === T.QCOIN || t === T.QMUSH || t === T.QSTAR) img = qFrame;
          let bump = 0;
          const b = this.bumps.find((u) => u.tx === tx && u.ty === ty);
          if (b) bump = Math.sin(((now - b.start) / 220) * Math.PI) * 5;
          ctx.drawImage(img, Math.round(tx * TILE - cam), ty * TILE - bump);
        }
      }
    }

    const qFrame = this.sprites.questionFrames[Math.floor(now / 220) % 3];
    if (this.endingPhase === "volcano") {
      for (const b of this.volcanoBlocks) {
        let img = this.sprites.tiles[b.tile];
        if (b.tile === T.QCOIN || b.tile === T.QMUSH || b.tile === T.QSTAR) img = qFrame;
        if (!img) continue;
        let bump = 0;
        const u = this.bumps.find((k) => k.tx === Math.round(b.worldX / TILE) && k.ty === b.ty);
        if (u) bump = Math.sin(((now - u.start) / 220) * Math.PI) * 5;
        ctx.drawImage(img, Math.round(b.worldX - cam), b.ty * TILE - bump);
      }
    }

    if (this.mode === "ending" && (!this.castleBroken || now - this.castleBreakStart < 900)) {
      this.drawCastle(this.endingCastleX - cam, now);
    }

    for (const c of this.worldCoins) {
      if (c.taken) continue;
      const coinImg = this.sprites.coinFrames[COIN_SPIN[Math.floor(now / 130 + c.x * 0.05) % 4]];
      drawSprite(ctx, coinImg, c.x - cam, c.y + Math.sin(now / 140 + c.x) * 2);
    }

    for (const g of this.goombas) {
      if (g.dead && !g.falling) continue;
      const img = g.flatUntil
        ? this.sprites.goombaFlat
        : Math.floor(now / 180) % 2
          ? this.sprites.goombaA
          : this.sprites.goombaB;
      if (!g.dead && !g.falling) {
        this.shadowEllipse(g.x - cam + 8, g.y + g.h - 1, 7, 0.18);
      }
      ctx.save();
      if (g.falling) {
        ctx.translate(g.x - cam + 8, g.y + 8);
        ctx.scale(1, -1);
        ctx.drawImage(img, -8, -8);
      } else ctx.drawImage(img, Math.round(g.x - cam), Math.round(g.y));
      ctx.restore();
    }

    for (const it of this.items) {
      const img =
        it.kind === "mushroom" ? this.sprites.mushroom : it.kind === "star" ? this.sprites.star : this.sprites.coin;
      if (it.kind !== "coinpop") {
        const gy2 = this.groundYAt(it.x + 8, it.y + it.h + 2);
        if (gy2 != null) this.shadowEllipse(it.x - cam + 8, gy2 - 1, 6, 0.14);
      }
      if (it.kind === "star") {
        ctx.save();
        ctx.filter = `hue-rotate(${(now / 8) % 360}deg)`;
        drawSprite(ctx, img, it.x - cam, it.y);
        ctx.restore();
      } else drawSprite(ctx, img, it.x - cam, it.y);
    }

    for (const pt of this.particles) {
      if (pt.size < 0) {
        this.text(`${-pt.size}`, pt.x - cam, pt.y, COLORS.white, "center");
      } else if (pt.tw) {
        const a = pt.maxLife ? Math.max(0, pt.life / pt.maxLife) : 1;
        ctx.globalAlpha = a;
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - cam - 1, pt.y, 3, 1);
        ctx.fillRect(pt.x - cam, pt.y - 1, 1, 3);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - cam, pt.y, pt.size, pt.size);
      }
    }

    for (const p of this.players) this.drawPlayer(p, now, cam);
    this.drawBullet(now);
    this.drawRunners(now);
  }

  private drawBullet(now: number) {
    if (this.endingPhase !== "volcano" || this.bulletFade <= 0) return;
    const ground = (this.level.h - 2) * TILE;
    const img = this.sprites.bullet;
    const by = ground - img.height * 2 - 4 + this.bulletBob;
    this.ctx.globalAlpha = this.bulletFade * 0.22;
    this.ctx.fillStyle = "#000";
    this.ctx.beginPath();
    this.ctx.ellipse(BB_SCREEN_X + img.width, ground - 2, img.width * 0.8, 3, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = this.bulletFade;
    drawSprite(this.ctx, img, BB_SCREEN_X, by, false, 2, 2);
    this.ctx.globalAlpha = 1;
  }

  private peekJumpY(r: Runner, now: number) {
    if (r.dead) return r.deathY;
    if (!r.jumping) return 0;
    const p = (now - r.jumpStart) / JUMP_DUR;
    if (p >= 1) return 0;
    return -4 * JUMP_HEIGHT * p * (1 - p);
  }

  private drawRunners(now: number) {
    const ctx = this.ctx;
    const auto = this.idle(now);
    const ground = (this.level.h - 2) * TILE;
    for (const r of this.runners) {
      if (!r.active && !r.dead) continue;
      if (r.opacity <= 0) continue;
      const jumpY = this.peekJumpY(r, now);
      const walk = !r.dead && !r.jumping && (this.input.moving || auto || !r.emerged);
      const img = this.runnerFrame(r.kind, walk && Math.floor(now / 120 + r.anim) % 2 === 1);
      const vis = this.runnerVisualScale(r);
      const x = r.x;
      const y = r.y + jumpY;
      if (!r.dead && !this.feetOverHole(r.x + r.w / 2)) {
        const hgt = Math.max(0, -jumpY);
        const t = Math.max(0.25, 1 - hgt / 140);
        this.shadowEllipse(x + r.w / 2, ground - 1, (r.w / 2) * t + 2, r.opacity * 0.22 * t);
      }
      let alpha = r.opacity;
      if (!r.dead && r.emerged && now < r.safeUntil && Math.floor(now / 100) % 2 === 0) alpha *= 0.35;
      ctx.globalAlpha = alpha;
      ctxSaveHue(ctx, now < r.starUntil, now);
      if (r.dead && r.deathKind === "bounce") {
        ctx.save();
        ctx.translate(x + r.w / 2, y + r.h / 2);
        ctx.scale(r.facing < 0 ? -1 : 1, -1);
        ctx.drawImage(img, 0, 0, img.width, img.height, -r.w / 2, -r.h / 2, r.w, r.h);
        ctx.restore();
      } else {
        drawSprite(ctx, img, x, y, r.facing < 0, vis, vis);
      }
      ctx.filter = "none";
      ctx.globalAlpha = 1;
      if (!r.dead) this.text(r.name.toUpperCase(), x + r.w / 2, y - 6, COLORS.white, "center");
    }
  }

  private drawPlayer(p: Player, now: number, cam: number) {
    if (p.inside && p.fade <= 0) return;
    const set = p.id === "jason" ? this.sprites.jason : this.sprites.fish;
    let img = set.stand;
    if (p.dead) img = set.dead;
    else if (p.inside) img = Math.floor(now / 120) % 2 ? set.walkA : set.walkB;
    else if (!p.grounded) img = set.jump;
    else if (Math.abs(p.vx) > 0.2) img = Math.floor(p.anim) % 2 ? set.walkA : set.walkB;
    const blink = !p.dead && now < p.invUntil && Math.floor(now / 80) % 2 === 0;

    const big = p.big && !p.dead;
    const scale = big ? 2 : 1;
    const dw = img.width * scale;
    const x = p.x - cam - (dw - p.w) / 2;
    const y = p.dead ? p.deathY : p.y;

    if (!p.dead && !p.inside) {
      const gy = this.groundYAt(p.x + p.w / 2, p.y + p.h + 2);
      if (gy != null) {
        const hgt = Math.max(0, gy - (p.y + p.h));
        const t = Math.max(0.2, 1 - hgt / 150);
        this.shadowEllipse(p.x - cam + p.w / 2, gy - 1, (p.w / 2 + 2) * t + 1, 0.22 * t);
      }
    }

    if (!blink) {
      this.ctx.globalAlpha = p.inside ? p.fade : 1;
      ctxSaveHue(this.ctx, now < p.starUntil, now);
      if (p.dead) {
        this.ctx.save();
        this.ctx.translate(x + img.width / 2, y + img.height / 2);
        this.ctx.scale(1, -1);
        this.ctx.drawImage(img, -img.width / 2, -img.height / 2);
        this.ctx.restore();
      } else {
        drawSprite(this.ctx, img, x, y, p.facing < 0, scale, scale);
      }
      this.ctx.filter = "none";
      this.ctx.globalAlpha = 1;
    }
    this.text(p.id === "jason" ? "JASON" : "FISH", p.x - cam + p.w / 2, y - 8, COLORS.white, "center");
  }

  private drawDeco(cam: number, now: number) {
    const vT = this.volcanoT;
    const ground = (this.level.h - 2) * TILE;
    for (const d of this.level.deco) {
      const par = d.kind === "cloud" ? 0.25 : d.kind === "hill" ? 0.45 : 0.7;
      let x = d.x - cam * par;
      if (this.endingPhase === "volcano") {
        const span = 2400;
        x = ((x % span) + span) % span;
        if (x > VIEW_W + 90) x -= span;
      }
      if (x < -90 || x > VIEW_W + 90) continue;
      if (d.kind === "cloud") {
        const bob = Math.sin(now / 2600 + d.x * 0.13) * 3;
        const drift = Math.sin(now / 9000 + d.x) * 8;
        this.drawCloud(x + drift, d.y + bob, d.variant ? 1.15 : 0.9, vT);
      } else if (d.kind === "hill") {
        this.drawHill(x, ground, d.variant ? 1 : 0.7, vT);
      } else {
        this.drawBush(x, ground, 0.8 + (d.variant ?? 0) * 0.15, vT);
      }
    }
  }

  private drawCloud(x: number, y: number, s: number, vT: number) {
    const ctx = this.ctx;
    const main = this.lerpColor(COLORS.cloud, "#ffc080", vT);
    const shade = this.lerpColor(COLORS.cloudShade, "#c86a30", vT);
    ctx.globalAlpha = 0.95 - vT * 0.3;
    ctx.fillStyle = shade;
    ctx.fillRect(x + 4 * s, y + 11 * s, 26 * s, 3 * s);
    ctx.fillStyle = main;
    ctx.fillRect(x + 2 * s, y + 6 * s, 30 * s, 6 * s);
    ctx.fillRect(x + 8 * s, y + 2 * s, 14 * s, 5 * s);
    ctx.fillRect(x + 20 * s, y + 4 * s, 10 * s, 4 * s);
    ctx.fillRect(x, y + 8 * s, 6 * s, 4 * s);
    ctx.globalAlpha = 1;
  }

  private drawHill(x: number, groundY: number, s: number, vT: number) {
    const ctx = this.ctx;
    const body = this.lerpColor(COLORS.hill, "#5a3a10", vT);
    const dark = this.lerpColor(COLORS.hillDark, "#2a1a08", vT);
    const h = 34 * s;
    const w = 84 * s;
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(x - 2, groundY);
    ctx.lineTo(x + w / 2, groundY - h - 2);
    ctx.lineTo(x + w + 2, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x + w / 2, groundY - h);
    ctx.lineTo(x + w, groundY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.fillRect(x + w * 0.32, groundY - h * 0.45, 2, 2);
    ctx.fillRect(x + w * 0.55, groundY - h * 0.3, 2, 2);
    ctx.fillRect(x + w * 0.45, groundY - h * 0.62, 2, 2);
  }

  private drawBush(x: number, groundY: number, s: number, vT: number) {
    const ctx = this.ctx;
    const body = this.lerpColor(COLORS.bush, "#6a4a10", vT);
    const dark = this.lerpColor(COLORS.bushDark, "#3a2a08", vT);
    const light = this.lerpColor(COLORS.grassLight, "#8a5a20", vT);
    ctx.fillStyle = dark;
    ctx.fillRect(x, groundY - 9 * s, 12 * s, 9 * s);
    ctx.fillRect(x + 8 * s, groundY - 13 * s, 14 * s, 13 * s);
    ctx.fillRect(x + 20 * s, groundY - 9 * s, 12 * s, 9 * s);
    ctx.fillStyle = body;
    ctx.fillRect(x + 1 * s, groundY - 8 * s, 10 * s, 8 * s);
    ctx.fillRect(x + 9 * s, groundY - 12 * s, 12 * s, 12 * s);
    ctx.fillRect(x + 21 * s, groundY - 8 * s, 10 * s, 8 * s);
    ctx.fillStyle = light;
    ctx.fillRect(x + 10 * s, groundY - 12 * s, 4 * s, 2 * s);
    ctx.fillRect(x + 2 * s, groundY - 8 * s, 3 * s, 2 * s);
    ctx.fillRect(x + 22 * s, groundY - 8 * s, 3 * s, 2 * s);
  }

  private drawVolcanoSky(cam: number, now: number) {
    const ctx = this.ctx;
    const e = this.volcanoT;
    ctx.save();
    ctx.globalAlpha = e;
    const grd = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grd.addColorStop(0, "#2a060c");
    grd.addColorStop(0.45, "#b82818");
    grd.addColorStop(1, "#ffb040");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H - 48);

    const ridge = (offset: number, base: number, h: number) => {
      for (let i = -1; i < 6; i++) {
        const rx = i * 90 - (offset % 90);
        ctx.beginPath();
        ctx.moveTo(rx, base);
        ctx.lineTo(rx + 45, base - h);
        ctx.lineTo(rx + 90, base);
        ctx.closePath();
        ctx.fill();
      }
    };
    ctx.fillStyle = "#3a1410";
    ridge(cam * 0.15, VIEW_H - 52, 56);
    ctx.fillStyle = "#240e0c";
    ridge(cam * 0.3, VIEW_H - 48, 84);

    const vx = VIEW_W * 0.68;
    ctx.fillStyle = "#1c0c0a";
    ctx.beginPath();
    ctx.moveTo(vx - 110, VIEW_H - 48);
    ctx.lineTo(vx - 14, VIEW_H * 0.3);
    ctx.lineTo(vx + 14, VIEW_H * 0.3);
    ctx.lineTo(vx + 110, VIEW_H - 48);
    ctx.closePath();
    ctx.fill();

    const pulse = 0.5 + Math.sin(now / 240) * 0.2;
    ctx.fillStyle = `rgba(255, 90, 0, ${pulse})`;
    ctx.beginPath();
    ctx.ellipse(vx, VIEW_H * 0.3 + 2, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 120, 20, ${0.3 + pulse * 0.4})`;
    ctx.fillRect(vx - 3, VIEW_H * 0.3 + 4, 3, 26);
    ctx.fillRect(vx + 5, VIEW_H * 0.3 + 4, 2, 18);

    for (let i = 0; i < 26; i++) {
      const seed = i * 137.7;
      const ex = ((seed + cam * 0.1 + Math.sin(now / 700 + i) * 14) % (VIEW_W + 24)) - 12;
      const span = VIEW_H - 40;
      const ey = span - ((now / 28 + i * 53) % span);
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(now / 130 + i * 2));
      ctx.fillStyle = i % 3 === 0 ? `rgba(255, 200, 90, ${tw})` : `rgba(255, 110, 30, ${tw})`;
      const sz = i % 4 === 0 ? 2 : 1;
      ctx.fillRect(ex, ey, sz, sz);
    }
    ctx.restore();
  }

  private drawFlagPole(x: number, now: number) {
    const ctx = this.ctx;
    const ground = (this.level.h - 2) * TILE;
    const hard = this.sprites.tiles[T.HARD];
    ctx.drawImage(hard, Math.round(x - 7), ground - 16);
    ctx.fillStyle = "#c8c8c8";
    ctx.fillRect(x, 34, 2, ground - 16 - 34);
    ctx.fillStyle = "#8c8c8c";
    ctx.fillRect(x, 34, 1, ground - 16 - 34);
    ctx.fillStyle = COLORS.hill;
    ctx.fillRect(x - 2, 29, 6, 5);
    ctx.fillStyle = COLORS.grassLight;
    ctx.fillRect(x - 1, 29, 2, 1);
    const wave = Math.sin(now / 160) * 2;
    ctx.fillStyle = COLORS.flagCloth;
    ctx.beginPath();
    ctx.moveTo(x - 2, 36);
    ctx.lineTo(x - 18 + wave, 43);
    ctx.lineTo(x - 2, 50);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(x - 10 + wave * 0.5, 41, 3, 3);
  }

  private drawCastle(x: number, now: number) {
    const ctx = this.ctx;
    const ground = (this.level.h - 2) * TILE;
    const y = ground - 64;
    ctx.save();
    let dx = x;
    let dy = y;
    if (this.castleBroken) {
      const bp = Math.min(1, (now - this.castleBreakStart) / 900);
      ctx.globalAlpha = 1 - bp;
      // Rotate/sink around the castle's bottom-center pivot (screen coords).
      ctx.translate(x + 36, y + 64);
      ctx.rotate(bp * 0.22);
      ctx.scale(1 - bp * 0.25, 1 - bp * 0.25);
      ctx.translate(0, bp * 18);
      dx = -36;
      dy = -64;
    }
    this.castleShape(dx, dy, now);
    ctx.restore();
  }

  private castleShape(x: number, y: number, now: number) {
    const ctx = this.ctx;
    const vT = this.volcanoT;
    const wall = this.lerpColor(COLORS.castle, "#6a4a3a", vT);
    const dark = this.lerpColor(COLORS.castleDark, "#3a241c", vT);
    const light = this.lerpColor(COLORS.castleLight, "#8a6a5a", vT);

    // Roof flag pole; the flag rises during the "flag" ending phase.
    const rise = this.mode === "ending" ? this.flagDrop : 1;
    ctx.fillStyle = dark;
    ctx.fillRect(x + 35, y - 14, 2, 24);
    if (rise > 0.01) {
      const fy = y - 14 + (1 - rise) * 13;
      const wave = Math.sin(now / 150) * 2;
      ctx.fillStyle = COLORS.flagCloth;
      ctx.beginPath();
      ctx.moveTo(x + 37, fy);
      ctx.lineTo(x + 51 + wave, fy + 4);
      ctx.lineTo(x + 37, fy + 8);
      ctx.closePath();
      ctx.fill();
    }

    // Side towers
    ctx.fillStyle = wall;
    ctx.fillRect(x + 2, y + 28, 16, 36);
    ctx.fillRect(x + 54, y + 28, 16, 36);
    // Main keep
    ctx.fillRect(x + 18, y + 14, 36, 50);
    // Battlements
    for (const mx of [x + 2, x + 8, x + 14, x + 54, x + 60, x + 64]) {
      ctx.fillRect(mx, y + 22, 4, 6);
    }
    for (const mx of [x + 18, x + 27, x + 36, x + 45]) {
      ctx.fillRect(mx, y + 6, 6, 8);
    }
    // Brick texture
    ctx.fillStyle = dark;
    for (const ly of [y + 22, y + 30, y + 38, y + 46, y + 54]) {
      ctx.fillRect(x + 18, ly, 36, 1);
    }
    for (const [vx, vy, vh] of [
      [x + 24, y + 14, 8],
      [x + 36, y + 14, 8],
      [x + 48, y + 14, 8],
      [x + 30, y + 23, 7],
      [x + 42, y + 23, 7],
      [x + 24, y + 31, 7],
      [x + 48, y + 31, 7],
      [x + 24, y + 39, 7],
      [x + 48, y + 39, 7],
      [x + 30, y + 47, 7],
      [x + 42, y + 47, 7],
      [x + 24, y + 55, 7],
      [x + 48, y + 55, 7],
    ] as const) {
      ctx.fillRect(vx, vy, 1, vh);
    }
    for (const ly of [y + 36, y + 44, y + 52]) {
      ctx.fillRect(x + 2, ly, 16, 1);
      ctx.fillRect(x + 54, ly, 16, 1);
    }
    ctx.fillRect(x + 9, y + 28, 1, 8);
    ctx.fillRect(x + 61, y + 28, 1, 8);
    ctx.fillRect(x + 6, y + 37, 1, 7);
    ctx.fillRect(x + 66, y + 37, 1, 7);
    ctx.fillRect(x + 12, y + 45, 1, 7);
    ctx.fillRect(x + 58, y + 45, 1, 7);
    // Base shadow
    ctx.fillRect(x + 2, y + 62, 68, 2);
    // Top highlights
    ctx.fillStyle = light;
    for (const mx of [x + 2, x + 8, x + 14, x + 54, x + 60, x + 64]) {
      ctx.fillRect(mx, y + 22, 4, 1);
    }
    for (const mx of [x + 18, x + 27, x + 36, x + 45]) {
      ctx.fillRect(mx, y + 6, 6, 1);
    }
    ctx.fillRect(x + 2, y + 28, 1, 34);
    ctx.fillRect(x + 18, y + 14, 1, 48);
    // Windows
    ctx.fillStyle = COLORS.castleDoor;
    ctx.fillRect(x + 24, y + 24, 4, 8);
    ctx.fillRect(x + 44, y + 24, 4, 8);
    ctx.fillRect(x + 8, y + 36, 3, 7);
    ctx.fillRect(x + 61, y + 36, 3, 7);
    // Arched door (center x+36 == CASTLE_DOOR_X)
    ctx.fillRect(x + 32, y + 40, 8, 2);
    ctx.fillRect(x + 30, y + 42, 12, 2);
    ctx.fillRect(x + 29, y + 44, 14, 20);
  }

  private drawHud(now: number) {
    const ctx = this.ctx;
    if (now < this.flashUntil) {
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    this.text("Score", 8, 10, COLORS.white);
    this.text(padScore(this.score), 8, 20, COLORS.white);
    const coinImg = this.sprites.coinFrames[COIN_SPIN[Math.floor(now / 160) % 4]];
    drawSprite(ctx, coinImg, 80, 12);
    this.text(`x${String(this.coins).padStart(2, "0")}`, 94, 20, COLORS.white);
    this.text("TIME", VIEW_W - 52, 10, COLORS.white, "center");
    this.text(formatTime(this.remaining()), VIEW_W - 52, 20, COLORS.white, "center");
  }

  private text(s: string, x: number, y: number, color: string, align: CanvasTextAlign = "left") {
    const ctx = this.ctx;
    ctx.font = `8px ${this.hooks.fontFamily}`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#000";
    ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }
}

function ctxSaveHue(ctx: CanvasRenderingContext2D, on: boolean, now: number) {
  ctx.filter = on ? `hue-rotate(${(now / 6) % 360}deg) saturate(2)` : "none";
}
