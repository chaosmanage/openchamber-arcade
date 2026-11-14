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

const FLOOR = 256;
const BIRD_X = 96;
const RADIUS = 10;
const GRAVITY = 1250;
const FLAP = -352;
const PIPE_WIDTH = 52;
const GAP = 118;
const SPEED = 132;

type Pipe = { x: number; gap: number; scored: boolean };

export function createFlappy(ctx: GameContext): Game {
  const board = new StageCanvas(ctx.stage, 'Flappy bird board');
  const { canvas } = board;

  let birdY = 150;
  let velocity = 0;
  let pipes: Pipe[] = [];
  let sinceSpawn = 0;
  let nextSpawn = 120;
  let score = 0;
  let state: 'ready' | 'play' | 'over' = 'ready';
  let time = 0;

  const loop = new Loop((dt) => {
    const seconds = dt / 1000;
    time += dt;
    update(seconds);
    draw();
  });

  function showScore(): void {
    ctx.setScore(score);
  }

  function spawnPipe(): void {
    const min = GAP / 2 + 18;
    const max = FLOOR - GAP / 2 - 18;
    pipes.push({ x: BOARD_WIDTH + 24, gap: min + Math.random() * (max - min), scored: false });
  }

  function reset(toReady: boolean): void {
    birdY = 150;
    velocity = 0;
    pipes = [];
    sinceSpawn = 0;
    nextSpawn = 190;
    score = 0;
    state = toReady ? 'ready' : 'play';
    showScore();
  }

  function flap(): void {
    if (state === 'ready') {
      state = 'play';
      velocity = FLAP;
      return;
    }
    if (state === 'play') velocity = FLAP;
  }

  function update(dt: number): void {
    if (state === 'ready') {
      birdY = 146 + Math.sin(time / 310) * 6;
      return;
    }
    if (state !== 'play') return;

    velocity += GRAVITY * dt;
    birdY += velocity * dt;
    if (birdY < RADIUS) {
      birdY = RADIUS;
      velocity = 0;
    }
    if (birdY + RADIUS >= FLOOR) {
      birdY = FLOOR - RADIUS;
      die();
      return;
    }

    sinceSpawn += SPEED * dt;
    if (sinceSpawn >= nextSpawn) {
      sinceSpawn = 0;
      nextSpawn = 178 + Math.random() * 74;
      spawnPipe();
    }

    const span = GAP / 2;
    for (const pipe of pipes) {
      pipe.x -= SPEED * dt;
      if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X - RADIUS) {
        pipe.scored = true;
        score += 1;
        showScore();
      }
      const overlapsX = BIRD_X + RADIUS > pipe.x && BIRD_X - RADIUS < pipe.x + PIPE_WIDTH;
      if (overlapsX && (birdY - RADIUS < pipe.gap - span || birdY + RADIUS > pipe.gap + span)) {
        die();
        return;
      }
    }
    pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -12);
  }

  function draw(): void {
    const p = palette();
    const g = board.begin();
    g.fillStyle = p.bg;
    g.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Slow drifting clouds for depth.
    g.fillStyle = p.mutedSurface;
    for (let i = 0; i < 3; i += 1) {
      const x = ((i * 150 + time * 0.012) % (BOARD_WIDTH + 120)) - 60;
      const y = 42 + i * 30;
      g.globalAlpha = 0.5;
      g.beginPath();
      g.arc(x, y, 13, 0, Math.PI * 2);
      g.arc(x + 16, y - 4, 17, 0, Math.PI * 2);
      g.arc(x + 34, y + 2, 12, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    const span = GAP / 2;
    for (const pipe of pipes) {
      const topHeight = pipe.gap - span;
      const bottomY = pipe.gap + span;
      g.fillStyle = p.success;
      g.globalAlpha = 0.9;
      fillRound(g, pipe.x, -10, PIPE_WIDTH, topHeight + 10, 6);
      fillRound(g, pipe.x, bottomY, PIPE_WIDTH, FLOOR - bottomY + 10, 6);
      g.globalAlpha = 0.32;
      g.fillStyle = p.bg;
      g.fillRect(pipe.x + PIPE_WIDTH - 11, 0, 4, topHeight);
      g.fillRect(pipe.x + PIPE_WIDTH - 11, bottomY, 4, FLOOR - bottomY);
      g.globalAlpha = 1;
    }

    // Ground.
    g.fillStyle = p.border;
    g.fillRect(0, FLOOR, BOARD_WIDTH, 2);
    g.globalAlpha = 0.5;
    g.fillStyle = p.mutedSurface;
    g.fillRect(0, FLOOR + 2, BOARD_WIDTH, BOARD_HEIGHT - FLOOR - 2);
    g.globalAlpha = 1;

    // Bird.
    const bob = state === 'ready' ? Math.sin(time / 180) * 0.12 : Math.max(-0.5, Math.min(0.8, velocity / 700));
    g.save();
    g.translate(BIRD_X, birdY);
    g.rotate(bob);
    g.fillStyle = p.warning;
    g.beginPath();
    g.moveTo(7, 0);
    g.lineTo(17, 3.5);
    g.lineTo(7, 7);
    g.closePath();
    g.fill();
    g.fillStyle = p.primary;
    g.beginPath();
    g.ellipse(0, 0, RADIUS + 1.5, RADIUS, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = p.bg;
    g.beginPath();
    g.arc(4, -3, 2.6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = p.fg;
    g.beginPath();
    g.arc(4.7, -3, 1.2, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = p.primaryFg;
    g.globalAlpha = 0.25;
    g.lineWidth = 1.4;
    g.beginPath();
    g.arc(-2, 1, 5, 0.2, 2.4);
    g.stroke();
    g.globalAlpha = 1;
    g.restore();

    if (state === 'ready') readyPill(g, 'Tap or press space to flap');
  }

  function die(): void {
    state = 'over';
    loop.stop();
    draw();
    ctx.over(score);
  }

  function onKey(event: KeyboardEvent): void {
    if (state === 'over' || document.activeElement?.closest('.overlay')) return;
    if (event.key !== ' ' && event.key !== 'ArrowUp' && event.key !== 'w' && event.key !== 'W' && event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    board.focus();
    flap();
  }

  function onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    board.focus();
    flap();
  }

  window.addEventListener('keydown', onKey);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    start() {
      reset(true);
      loop.start();
      draw();
    },
    restart() {
      loop.stop();
      reset(true);
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
      board.dispose();
    },
  };
}
