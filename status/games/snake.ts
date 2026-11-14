import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  Loop,
  StageCanvas,
  fillRound,
  palette,
  readyPill,
} from './canvas';
import type { Game, GameContext } from './types';

const COLS = 20;
const ROWS = 15;
const CELL = 20;

type Cell = { x: number; y: number };

const opposite = (a: Cell, b: Cell): boolean => a.x === -b.x && a.y === -b.y;
const same = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;

export function createSnake(ctx: GameContext): Game {
  const board = new StageCanvas(ctx.stage, 'Snake board');
  const { canvas } = board;

  let snake: Cell[] = [];
  let dir: Cell = { x: 1, y: 0 };
  let pending: Cell[] = [];
  let food: Cell = { x: 14, y: 7 };
  let score = 0;
  let stepMs = 132;
  let accumulated = 0;
  let state: 'ready' | 'play' | 'over' = 'ready';
  let time = 0;

  const loop = new Loop((dt) => {
    time += dt;
    update(dt);
    draw();
  });

  function reset(toReady: boolean): void {
    snake = [
      { x: 9, y: 7 },
      { x: 8, y: 7 },
      { x: 7, y: 7 },
      { x: 6, y: 7 },
    ];
    dir = { x: 1, y: 0 };
    pending = [];
    score = 0;
    stepMs = 132;
    accumulated = 0;
    state = toReady ? 'ready' : 'play';
    placeFood();
    ctx.setScore(0);
  }

  function launch(next: Cell): void {
    dir = next;
    const head = { x: 10, y: 7 };
    snake = [0, 1, 2, 3].map((i) => ({ x: head.x - dir.x * i, y: head.y - dir.y * i }));
    state = 'play';
    accumulated = 0;
    placeFood();
  }

  function placeFood(): void {
    const taken = new Set(snake.map((cell) => cell.y * COLS + cell.x));
    const free: number[] = [];
    for (let i = 0; i < COLS * ROWS; i += 1) if (!taken.has(i)) free.push(i);
    if (!free.length) {
      die();
      return;
    }
    const index = free[Math.floor(Math.random() * free.length)] ?? 0;
    food = { x: index % COLS, y: Math.floor(index / COLS) };
  }

  function step(): void {
    const queued = pending.shift();
    if (queued && !opposite(queued, dir)) dir = queued;

    const head = snake[0];
    if (!head) return;
    const next = { x: head.x + dir.x, y: head.y + dir.y };
    if (next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS) {
      die();
      return;
    }

    const eating = next.x === food.x && next.y === food.y;
    const reach = eating ? snake.length : snake.length - 1;
    for (let i = 0; i < reach; i += 1) {
      const part = snake[i];
      if (part && part.x === next.x && part.y === next.y) {
        die();
        return;
      }
    }

    snake.unshift(next);
    if (!eating) {
      snake.pop();
    } else {
      score += 1;
      ctx.setScore(score);
      stepMs = Math.max(68, 132 - score * 3);
      placeFood();
    }
  }

  function update(dt: number): void {
    if (state !== 'play') return;
    accumulated += dt;
    while (accumulated >= stepMs) {
      accumulated -= stepMs;
      step();
      if (state !== 'play') break;
    }
  }

  function draw(): void {
    const p = palette();
    const g = board.begin();
    g.fillStyle = p.bg;
    g.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Dot grid, kept sparse so it reads as texture rather than noise.
    g.fillStyle = p.border;
    for (let x = CELL; x < BOARD_WIDTH; x += CELL * 2) {
      for (let y = CELL; y < BOARD_HEIGHT; y += CELL * 2) {
        g.beginPath();
        g.arc(x, y, 0.9, 0, Math.PI * 2);
        g.fill();
      }
    }

    // Food: a soft halo plus a solid seed.
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    const pulse = 1 + Math.sin(time / 170) * 0.08;
    g.globalAlpha = 0.18;
    g.fillStyle = p.success;
    g.beginPath();
    g.arc(fx, fy, 9.5 * pulse, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    g.fillStyle = p.success;
    g.beginPath();
    g.arc(fx, fy, 5.6 * pulse, 0, Math.PI * 2);
    g.fill();

    // Body, fading slightly toward the tail.
    const count = Math.max(1, snake.length - 1);
    for (let i = snake.length - 1; i >= 0; i -= 1) {
      const part = snake[i];
      if (!part) continue;
      if (i === 0) {
        g.globalAlpha = 1;
      } else {
        g.globalAlpha = 0.44 + 0.52 * (1 - i / count);
      }
      g.fillStyle = p.primary;
      fillRound(
        g,
        part.x * CELL + 2,
        part.y * CELL + 2,
        CELL - 4,
        CELL - 4,
        i === 0 ? 6 : 5,
      );
    }
    g.globalAlpha = 1;

    const head = snake[0];
    if (head) {
      const cx = head.x * CELL + CELL / 2;
      const cy = head.y * CELL + CELL / 2;
      const sideX = dir.y !== 0 ? 3.4 : 0;
      const sideY = dir.x !== 0 ? 3.4 : 0;
      const forwardX = dir.x * 3.2;
      const forwardY = dir.y * 3.2;
      g.fillStyle = p.bg;
      g.beginPath();
      g.arc(cx + forwardX + sideX, cy + forwardY + sideY, 1.45, 0, Math.PI * 2);
      g.arc(cx + forwardX - sideX, cy + forwardY - sideY, 1.45, 0, Math.PI * 2);
      g.fill();
    }

    if (state === 'ready') {
      readyPill(g, 'Press an arrow or swipe to start');
    }
  }

  function die(): void {
    state = 'over';
    loop.stop();
    draw();
    ctx.over(score);
  }

  function onKey(event: KeyboardEvent): void {
    const key = event.key;
    if (state === 'over' || document.activeElement?.closest('.overlay')) return;
    let next: Cell | null = null;
    if (key === 'ArrowUp' || key === 'w' || key === 'W') next = { x: 0, y: -1 };
    else if (key === 'ArrowDown' || key === 's' || key === 'S') next = { x: 0, y: 1 };
    else if (key === 'ArrowLeft' || key === 'a' || key === 'A') next = { x: -1, y: 0 };
    else if (key === 'ArrowRight' || key === 'd' || key === 'D') next = { x: 1, y: 0 };
    else if (key === ' ' || key === 'Enter') next = dir;
    if (!next) return;
    event.preventDefault();
    board.focus();
    if (state === 'ready') {
      launch(next);
      draw();
    } else if (state === 'play') {
      queue(next);
    }
  }

  function queue(next: Cell): void {
    const base = pending.length ? (pending[pending.length - 1] ?? dir) : dir;
    if (opposite(next, base) || same(next, base)) return;
    if (pending.length < 2) pending.push(next);
  }

  let down: { x: number; y: number } | null = null;

  function onPointerDown(event: PointerEvent): void {
    down = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture?.(event.pointerId);
    board.focus();
  }

  function onPointerUp(event: PointerEvent): void {
    if (!down) return;
    const dx = event.clientX - down.x;
    const dy = event.clientY - down.y;
    down = null;
    if (Math.hypot(dx, dy) < 16) {
      if (state === 'ready') {
        launch(dir);
        draw();
      }
      return;
    }
    const next: Cell =
      Math.abs(dx) > Math.abs(dy)
        ? { x: Math.sign(dx) || 1, y: 0 }
        : { x: 0, y: Math.sign(dy) || 1 };
    if (state === 'ready') {
      launch(next);
      draw();
    } else if (state === 'play') {
      queue(next);
    }
  }

  function onPointerCancel(): void {
    down = null;
  }

  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);

  return {
    start() {
      reset(true);
      loop.start();
      draw();
    },
    restart() {
      loop.stop();
      reset(false);
      loop.start();
      draw();
    },
    pause() {
      loop.pause();
    },
    resume() {
      loop.resume();
    },
    destroy() {
      loop.stop();
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      board.dispose();
    },
  };
}
