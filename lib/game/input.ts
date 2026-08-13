export type Action = "left" | "right" | "jump" | "run" | "start" | "down" | "select";

const KEY_MAP: Record<string, Action> = {
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
  ArrowUp: "jump",
  w: "jump",
  W: "jump",
  " ": "jump",
  z: "jump",
  Z: "jump",
  ArrowDown: "down",
  s: "down",
  S: "down",
  Shift: "run",
  j: "run",
  J: "run",
  x: "run",
  X: "run",
  Enter: "start",
  Tab: "select",
};

export class Input {
  readonly held = new Set<Action>();
  private edges = new Set<Action>();
  private unbinders: Array<() => void> = [];
  lastPressAt = 0;

  bind(target: Window | HTMLElement = window) {
    const down = (e: KeyboardEvent) => {
      const action = KEY_MAP[e.key];
      if (!action) return;
      if (action === "select") e.preventDefault();
      if (e.repeat) {
        if (action === "jump" || action === "start") e.preventDefault();
        return;
      }
      e.preventDefault();
      this.press(action);
    };
    const up = (e: KeyboardEvent) => {
      const action = KEY_MAP[e.key];
      if (!action) return;
      this.release(action);
    };
    const blur = () => this.held.clear();
    target.addEventListener("keydown", down as EventListener);
    target.addEventListener("keyup", up as EventListener);
    window.addEventListener("blur", blur);
    this.unbinders.push(() => {
      target.removeEventListener("keydown", down as EventListener);
      target.removeEventListener("keyup", up as EventListener);
      window.removeEventListener("blur", blur);
    });
  }

  unbind() {
    this.unbinders.forEach((fn) => fn());
    this.unbinders = [];
    this.held.clear();
    this.edges.clear();
  }

  press(action: Action) {
    if (!this.held.has(action)) this.edges.add(action);
    this.held.add(action);
    this.lastPressAt = performance.now();
  }

  release(action: Action) {
    this.held.delete(action);
  }

  consume(action: Action): boolean {
    const hit = this.edges.has(action);
    this.edges.delete(action);
    return hit;
  }

  beginFrame() {
    /* edges persist until consumed */
  }

  endFrame() {
    this.edges.clear();
  }

  get left() {
    return this.held.has("left");
  }
  get right() {
    return this.held.has("right");
  }
  get jump() {
    return this.held.has("jump");
  }
  get run() {
    return this.held.has("run");
  }
  get down() {
    return this.held.has("down");
  }
  get moving() {
    return this.left || this.right || this.jump || this.run;
  }
}
