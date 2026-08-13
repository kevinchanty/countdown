export function formatTime(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d}:${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function padScore(n: number, width = 6): string {
  return String(Math.max(0, Math.floor(n))).padStart(width, "0").slice(-width);
}
