"use client";

import { useEffect, useState } from "react";

export function useCountdown(end: Date) {
  const [remaining, setRemaining] = useState(() => Math.max(0, end.getTime() - Date.now()));
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, end.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [end]);
  return remaining;
}
