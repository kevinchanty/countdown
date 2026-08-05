import type { MutableRefObject } from "react";

export function bindRef(refs: MutableRefObject<(HTMLDivElement | null)[]>, i: number) {
  return (el: HTMLDivElement | null) => {
    refs.current[i] = el;
  };
}

export function makeRefCbs(count: number, refs: MutableRefObject<(HTMLDivElement | null)[]>) {
  return Array.from({ length: count }, (_, i) => bindRef(refs, i));
}
