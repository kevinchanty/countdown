"use client";

import type { PointerEvent } from "react";
import type { Action } from "@/lib/game/input";

type Props = {
  onSend: (action: Action, down: boolean) => void;
};

function PadButton({
  label,
  action,
  onSend,
  className,
}: {
  label: string;
  action: Action;
  onSend: Props["onSend"];
  className?: string;
}) {
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onSend(action, true);
  };
  const up = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onSend(action, false);
  };
  return (
    <button
      type="button"
      className={`pad__btn ${className ?? ""}`}
      aria-label={label}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {label}
    </button>
  );
}

export function TouchPad({ onSend }: Props) {
  return (
    <div className="pad" aria-hidden>
      <div className="pad__dir">
        <PadButton label="◀" action="left" onSend={onSend} />
        <PadButton label="▶" action="right" onSend={onSend} />
      </div>
      <div className="pad__actions">
        <PadButton label="RUN" action="run" onSend={onSend} className="pad__btn--wide" />
        <PadButton label="JUMP" action="jump" onSend={onSend} className="pad__btn--a" />
        <PadButton label="GO" action="start" onSend={onSend} className="pad__btn--wide" />
      </div>
    </div>
  );
}
