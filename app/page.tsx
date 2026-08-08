"use client";

import { useEffect, useRef, useState } from "react";
import { Stage } from "@/components/Stage";
import { Timer } from "@/components/Timer";
import { useCountdown } from "@/hooks/useCountdown";
import { useGameLoop } from "@/hooks/useGameLoop";
import { BLOCK_COUNT, COUNTDOWN_END, DECO, HOLE_COUNT } from "@/lib/constants";
import { makeRefCbs } from "@/lib/refs";
import { CHARACTERS } from "@/lib/sprites/mario";
import { RUNNERS } from "@/lib/sprites/runners";

export default function Page() {
  const remaining = useCountdown(COUNTDOWN_END);
  const remainingRef = useRef(remaining);
  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

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

  const runnerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const runnerSpriteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const runnerShadowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const charRefs = useRef<(HTMLDivElement | null)[]>([]);
  const charSpriteRefs = useRef<(HTMLDivElement | null)[]>([]);
  const charShadowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const holeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const decoRefs = useRef<(HTMLDivElement | null)[]>([]);

  const decoRefCbs = useRef(makeRefCbs(DECO.length, decoRefs)).current;
  const blockRefCbs = useRef(makeRefCbs(BLOCK_COUNT, blockRefs)).current;
  const holeRefCbs = useRef(makeRefCbs(HOLE_COUNT, holeRefs)).current;
  const charShadowRefCbs = useRef(makeRefCbs(CHARACTERS.length, charShadowRefs)).current;
  const charRefCbs = useRef(makeRefCbs(CHARACTERS.length, charRefs)).current;
  const charSpriteRefCbs = useRef(makeRefCbs(CHARACTERS.length, charSpriteRefs)).current;
  const runnerRefCbs = useRef(makeRefCbs(RUNNERS.length, runnerRefs)).current;
  const runnerSpriteRefCbs = useRef(makeRefCbs(RUNNERS.length, runnerSpriteRefs)).current;
  const runnerShadowRefCbs = useRef(makeRefCbs(RUNNERS.length, runnerShadowRefs)).current;

  useGameLoop({
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
    holeRefs,
    decoRefs,
    remainingRef,
    startCountUpRef,
  });

  return (
    <>
      <div className="page-volcano" ref={volcanoPageRef} aria-hidden />
      <main>
        <Timer remaining={remaining} countingUp={countingUp} timerMs={timerMs} />
        <Stage
          stageRef={stageRef}
          groundRef={groundRef}
          starRef={starRef}
          castleRef={castleRef}
          flagRef={flagRef}
          volcanoSkyRef={volcanoSkyRef}
          bulletRef={bulletRef}
          decoRefCbs={decoRefCbs}
          blockRefCbs={blockRefCbs}
          holeRefCbs={holeRefCbs}
          charShadowRefCbs={charShadowRefCbs}
          charRefCbs={charRefCbs}
          charSpriteRefCbs={charSpriteRefCbs}
          runnerRefCbs={runnerRefCbs}
          runnerSpriteRefCbs={runnerSpriteRefCbs}
          runnerShadowRefCbs={runnerShadowRefCbs}
        />
      </main>
    </>
  );
}
