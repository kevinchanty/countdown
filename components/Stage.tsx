import { Fragment, type RefObject } from "react";
import { BLOCK_COUNT, DECO, HOLE_COUNT } from "@/lib/constants";
import { PIXEL } from "@/lib/pixel";
import { BB_SHADOW } from "@/lib/sprites/bullet";
import { CASTLE_PIXEL, CASTLE_SHADOW } from "@/lib/sprites/castle";
import { CHARACTERS } from "@/lib/sprites/mario";
import { RUNNERS } from "@/lib/sprites/runners";
import { Character } from "./Character";

type Props = {
  stageRef: RefObject<HTMLDivElement>;
  groundRef: RefObject<HTMLDivElement>;
  starRef: RefObject<HTMLDivElement>;
  castleRef: RefObject<HTMLDivElement>;
  flagRef: RefObject<HTMLDivElement>;
  volcanoSkyRef: RefObject<HTMLDivElement>;
  bulletRef: RefObject<HTMLDivElement>;
  decoRefCbs: Array<(el: HTMLDivElement | null) => void>;
  blockRefCbs: Array<(el: HTMLDivElement | null) => void>;
  holeRefCbs: Array<(el: HTMLDivElement | null) => void>;
  charShadowRefCbs: Array<(el: HTMLDivElement | null) => void>;
  charRefCbs: Array<(el: HTMLDivElement | null) => void>;
  charSpriteRefCbs: Array<(el: HTMLDivElement | null) => void>;
  runnerRefCbs: Array<(el: HTMLDivElement | null) => void>;
  runnerSpriteRefCbs: Array<(el: HTMLDivElement | null) => void>;
  runnerShadowRefCbs: Array<(el: HTMLDivElement | null) => void>;
};

export function Stage({
  stageRef,
  groundRef,
  starRef,
  castleRef,
  flagRef,
  volcanoSkyRef,
  bulletRef,
  decoRefCbs,
  blockRefCbs,
  holeRefCbs,
  charShadowRefCbs,
  charRefCbs,
  charSpriteRefCbs,
  runnerRefCbs,
  runnerSpriteRefCbs,
  runnerShadowRefCbs,
}: Props) {
  return (
    <div className="stage" ref={stageRef}>
      <div className="stage__volcano" ref={volcanoSkyRef} aria-hidden>
        <div className="stage__ash" />
      </div>
      {DECO.map((d, i) => (
        <div
          key={i}
          className={`deco deco--${d.kind}`}
          style={d.top ? { top: d.top } : undefined}
          ref={decoRefCbs[i]}
        />
      ))}
      <div className="ground" ref={groundRef} />
      {Array.from({ length: HOLE_COUNT }).map((_, i) => (
        <div key={`hole-${i}`} className="hole" ref={holeRefCbs[i]} aria-hidden />
      ))}
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
      <div className="bullet" ref={bulletRef} style={{ display: "none", opacity: 0 }} aria-hidden>
        <div style={{ width: PIXEL, height: PIXEL, boxShadow: BB_SHADOW }} />
      </div>
      {RUNNERS.map((r, i) => (
        <Fragment key={r.name}>
          <div className="runner__shadow" ref={runnerShadowRefCbs[i]} style={{ display: "none" }} aria-hidden />
          <div className="runner" ref={runnerRefCbs[i]} style={{ display: "none", opacity: 0 }}>
            <div className="char__name">{r.name}</div>
            <div ref={runnerSpriteRefCbs[i]} style={{ width: PIXEL, height: PIXEL, boxShadow: r.frames.A }} />
          </div>
        </Fragment>
      ))}
      <div className="castle" ref={castleRef}>
        <div className="castle__pole" />
        <div className="castle__flag" ref={flagRef} />
        <div className="castle__rubble" aria-hidden />
        <div
          className="castle__sprite"
          style={{ width: CASTLE_PIXEL, height: CASTLE_PIXEL, boxShadow: CASTLE_SHADOW }}
        />
      </div>
    </div>
  );
}
