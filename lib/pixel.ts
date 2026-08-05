export const PIXEL = 3;

export type WalkFrames = { A: string; B: string };
export type JumpFrames = WalkFrames & { JUMP: string };

export function buildShadow(rows: string[], colors: Record<string, string>, px: number): string {
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

export function walkFrames(mapA: string[], mapB: string[], colors: Record<string, string>): WalkFrames {
  return {
    A: buildShadow(mapA, colors, PIXEL),
    B: buildShadow(mapB, colors, PIXEL),
  };
}
