export const BOARD_WIDTH = 400;
export const BOARD_HEIGHT = 300;

export interface Palette {
  bg: string;
  elevated: string;
  fg: string;
  muted: string;
  border: string;
  primary: string;
  primaryFg: string;
  success: string;
  warning: string;
  error: string;
  mutedSurface: string;
  font: string;
}

let cached: Palette | null = null;
let cachedAt = 0;

const read = (style: CSSStyleDeclaration, name: string, fallback: string): string =>
  style.getPropertyValue(name).trim() || fallback;

/** Theme colors, refreshed a few times a second so light/dark switches land quickly. */
export function palette(): Palette {
  const now = performance.now();
  if (cached && now - cachedAt < 200) return cached;
  const style = getComputedStyle(document.documentElement);
  const primary = read(style, '--oc-primary', '#d4d4d8');
  cached = {
    bg: read(style, '--oc-bg', '#111113'),
    elevated: read(style, '--oc-elevated', '#18181b'),
    fg: read(style, '--oc-fg', '#f4f4f5'),
    muted: read(style, '--oc-muted', '#a1a1aa'),
    border: read(style, '--oc-border', '#2e2e33'),
    primary,
    primaryFg: read(style, '--oc-primary-fg', '#111113'),
    success: read(style, '--oc-success', '#22c55e'),
    warning: read(style, '--oc-warning', '#f59e0b'),
    error: read(style, '--oc-error', '#ef4444'),
    mutedSurface: read(style, '--oc-muted-surface', '#232327'),
    font: read(style, '--oc-font', 'ui-sans-serif, system-ui, sans-serif'),
  };
  cachedAt = now;
  return cached;
}

/** A canvas sized to the stage, drawn in fixed 400×300 coordinates. */
export class StageCanvas {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  private sx = 1;
  private sy = 1;

  constructor(stage: HTMLElement, label: string) {
    const canvas = document.createElement('canvas');
    canvas.className = 'arcade-canvas';
    canvas.width = BOARD_WIDTH;
    canvas.height = BOARD_HEIGHT;
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', label);
    stage.replaceChildren(canvas);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This frame cannot draw a game board.');
    this.canvas = canvas;
    this.ctx = context;
  }

  focus(): void {
    this.canvas.focus({ preventScroll: true });
  }

  /** Resize the backing store if needed, reset the transform, and clear. */
  begin(): CanvasRenderingContext2D {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.sx = width / BOARD_WIDTH;
    this.sy = height / BOARD_HEIGHT;
    const ctx = this.ctx;
    ctx.setTransform(this.sx, 0, 0, this.sy, 0, 0);
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
    return ctx;
  }

  dispose(): void {
    this.canvas.remove();
  }
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, r);
}

export function fillRound(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  roundRect(ctx, x, y, width, height, radius);
  ctx.fill();
}

/** A soft, theme-tinted instruction pill near the bottom of the board. */
export function readyPill(ctx: CanvasRenderingContext2D, text: string, y = BOARD_HEIGHT - 30): void {
  const p = palette();
  ctx.save();
  ctx.font = `500 11.5px ${p.font}`;
  const width = Math.min(BOARD_WIDTH - 32, ctx.measureText(text).width + 30);
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = p.elevated;
  fillRound(ctx, (BOARD_WIDTH - width) / 2, y - 15, width, 30, 15);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 1;
  roundRect(ctx, (BOARD_WIDTH - width) / 2, y - 15, width, 30, 15);
  ctx.stroke();
  ctx.fillStyle = p.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, BOARD_WIDTH / 2, y + 0.5);
  ctx.restore();
}

/** Shared rAF loop for the canvas games. */
export class Loop {
  private raf = 0;
  private last = 0;
  private running = false;
  private paused = false;
  private readonly step: (dt: number, now: number) => void;

  constructor(step: (dt: number, now: number) => void) {
    this.step = step;
  }

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  pause(): void {
    if (!this.running) return;
    this.running = false;
    this.paused = true;
    cancelAnimationFrame(this.raf);
  }

  resume(): void {
    if (this.running || !this.paused) return;
    this.paused = false;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    cancelAnimationFrame(this.raf);
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min(50, Math.max(0, now - this.last));
    this.last = now;
    this.step(dt, now);
    if (this.running) this.raf = requestAnimationFrame(this.tick);
  };
}
