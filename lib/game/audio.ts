const gameOverSound = new URL("../../app/assets/sound/super-mario-game-over.mp3", import.meta.url).href;

export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  unlock() {
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
  }

  private ensure(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = "square",
    volume = 0.07,
    delay = 0,
    slideTo?: number,
  ) {
    if (this.muted) return;
    const ctx = this.ensure();
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + duration);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  jump() {
    this.tone(520, 0.11, "square", 0.06, 0, 880);
  }
  coin() {
    this.tone(988, 0.07, "square", 0.06);
    this.tone(1318, 0.12, "square", 0.06, 0.07);
  }
  bump() {
    this.tone(180, 0.08, "square", 0.06);
  }
  break() {
    this.tone(220, 0.12, "sawtooth", 0.05, 0, 80);
  }
  stomp() {
    this.tone(200, 0.08, "square", 0.07, 0, 120);
  }
  power() {
    this.tone(392, 0.08, "square", 0.06);
    this.tone(523, 0.08, "square", 0.06, 0.08);
    this.tone(659, 0.12, "square", 0.06, 0.16);
  }
  hurt() {
    this.tone(300, 0.18, "square", 0.07, 0, 90);
  }
  die() {
    if (this.muted) return;
    const audio = new Audio(gameOverSound);
    audio.volume = 0.7;
    void audio.play().catch(() => undefined);
  }
  flag() {
    this.tone(523, 0.1, "square", 0.06);
    this.tone(659, 0.1, "square", 0.06, 0.1);
    this.tone(784, 0.1, "square", 0.06, 0.2);
    this.tone(1046, 0.22, "square", 0.06, 0.3);
  }
  oneUp() {
    this.tone(659, 0.08, "square", 0.06);
    this.tone(784, 0.08, "square", 0.06, 0.08);
    this.tone(1318, 0.16, "square", 0.06, 0.16);
  }
  fire() {
    this.tone(880, 0.05, "square", 0.04);
    this.tone(1320, 0.12, "triangle", 0.04, 0.04, 440);
  }
}
