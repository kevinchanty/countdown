"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "@/components/Timer";
import { TouchPad } from "@/components/TouchPad";
import { COUNTDOWN_END, DISCLAIMER } from "@/lib/constants";
import { VIEW_H, VIEW_W } from "@/lib/game/config";
import { MarioGame } from "@/lib/game/game";
import type { Action } from "@/lib/game/input";
import { useCountdown } from "@/hooks/useCountdown";

export function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<MarioGame | null>(null);
  const volcanoRef = useRef<HTMLDivElement | null>(null);
  const remaining = useCountdown(COUNTDOWN_END);
  const [countUpStart, setCountUpStart] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (countUpStart === null) return;
    const tick = () => setElapsedMs(Date.now() - countUpStart);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [countUpStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fontFamily = getComputedStyle(document.body).fontFamily || "monospace";
    const game = new MarioGame(canvas, {
      fontFamily,
      onCountUp: () => setCountUpStart((prev) => prev ?? Date.now()),
      onVolcano: (t) => {
        if (volcanoRef.current) volcanoRef.current.style.opacity = String(t);
      },
    });
    gameRef.current = game;
    game.start();
    return () => {
      game.stop();
      gameRef.current = null;
    };
  }, []);

  const countingUp = countUpStart !== null;
  const timerMs = countingUp ? elapsedMs : remaining;

  const send = (action: Action, down: boolean) => {
    const game = gameRef.current;
    if (!game) return;
    if (down) game.input.press(action);
    else game.input.release(action);
  };

  return (
    <div className="shell">
      <div className="page-volcano" ref={volcanoRef} aria-hidden />
      <Timer remaining={remaining} countingUp={countingUp} timerMs={timerMs} />
      <div className="bezel">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={VIEW_W}
          height={VIEW_H}
          tabIndex={0}
          aria-label="Super Mario Countdown"
        />
      </div>
      <TouchPad onSend={send} />
      <p className="disclaimer">{DISCLAIMER}</p>
    </div>
  );
}
