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

const FLOOR = 244;
const DINO_X = 54;
const DINO_W = 30;
const DINO_H = 34;
const GRAVITY = 2000;
const JUMP = -610;

type Obstacle = { x: number; width: number; height: number };

export function createDino(ctx: GameContext): Game {
  const board = new StageCanvas(ctx.stage, 'Dino runner board');
  const { canvas } = board;

  let dinoY = FLOOR - DINO_H;
  let velocity = 0;
  let grounded = true;
  let obstacles: Obstacle[] = [];
  let distance = 0;
  let score = 0;
  let sinceSpawn = 0;
  let spawnIn = 1.05;
  let speed = 206;
  let state: 'ready' | 'play' | 'over' = 'ready';
  let time = 0;

  const loop = new Loop((dt) => {
    const seconds = dt / 1000;
    time += dt;
    update(seconds);
    draw();
  });

  function reset(toReady: boolean): void {
    dinoY = FLOOR - DINO_H;
    velocity = 0;
    grounded = true;
    obstacles = [];
    distance = 0;
    score = 0;
    sinceSpawn = 0;
    spawnIn = 1.05;
    speed = 206;
    state = toReady ? 'ready' : 'play';
    ctx.setScore(0);
  }

  function jump(): void {
    if (state === 'ready') {
      state = 'play';
      grounded = false;
      velocity = JUMP;
      return;
    }
    if (state === 'play' && grounded) {
      grounded = false;
      velocity = JUMP;
    }
  }

  function spawn(): void {
    const height = 30 + Math.random() * 18;
    const width = 15 + Math.random() * 9;
    obstacles.push({ x: BOARD_WIDTH + 20, width, height });
  }

  function update(dt: number): void {
    if (state === 'ready') return;
    if (state !== 'play') return;

    speed = 206 + Math.min(208, score * 0.42);

    if (!grounded) {
      velocity += GRAVITY * dt;
      dinoY += velocity * dt;
      if (dinoY >= FLOOR - DINO_H) {
        dinoY = FLOOR - DINO_H;
        velocity = 0;
        grounded = true;
      }
    }

    distance += speed * dt;
    const shown = Math.floor(distance / 14);
    if (shown !== score) {
      score = shown;
      ctx.setScore(score);
    }

    sinceSpawn += dt;
    if (sinceSpawn >= spawnIn) {
      sinceSpawn = 0;
      spawnIn = Math.max(0.78, 1.3 - score * 0.0006) + Math.random() * 0.4;
      spawn();
    }

    for (const obstacle of obstacles) obstacle.x -= speed * dt;
    obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > -10);

    const left = DINO_X + 3;
    const right = DINO_X + DINO_W - 3;
    const top = dinoY + 2;
    const bottom = dinoY + DINO_H;
    for (const obstacle of obstacles) {
      const oLeft = obstacle.x;
      const oRight = obstacle.x + obstacle.width;
      const oTop = FLOOR - obstacle.height;
      if (right > oLeft && left < oRight && bottom > oTop && top < FLOOR) {
        die();
        return;
      }
    }
  }

  function drawDino(g: CanvasRenderingContext2D, color: string): void {
    const x = DINO_X;
    const top = dinoY;
    g.fillStyle = color;
    // Tail, body, neck and head.
    fillRound(g, x - 7, top + 14, 12, 9, 3);
    fillRound(g, x + 3, top + 7, 20, 20, 4);
    fillRound(g, x + 15, top, 15, 15, 4);
    fillRound(g, x + 26, top + 6, 8, 6, 2);
    // Eye.
    g.fillStyle = palette().bg;
    g.fillRect(x + 24, top + 4, 2.4, 2.4);
    // Legs alternate while running.
    const frame = state === 'play' && grounded ? Math.floor(time / 110) % 2 : 0;
    g.fillStyle = color;
    if (frame === 0) {
      fillRound(g, x + 6, top + 25, 5, 9, 1.5);
      fillRound(g, x + 16, top + 25, 5, 7, 1.5);
    } else {
      fillRound(g, x + 6, top + 25, 5, 7, 1.5);
      fillRound(g, x + 16, top + 25, 5, 9, 1.5);
    }
  }

  function drawCactus(g: CanvasRenderingContext2D, obstacle: Obstacle, color: string): void {
    const x = obstacle.x;
    const top = FLOOR - obstacle.height;
    g.fillStyle = color;
    fillRound(g, x, top, obstacle.width, obstacle.height, 4);
    const armY = top + obstacle.height * 0.42;
    fillRound(g, x - 5, armY, 6, 4, 2);
    fillRound(g, x - 6, armY + 2, 4, obstacle.height * 0.24, 2);
    fillRound(g, x + obstacle.width - 1, armY + 7, 6, 4, 2);
    fillRound(g, x + obstacle.width + 2, armY + 8, 4, obstacle.height * 0.2, 2);
  }

  function draw(): void {
    const p = palette();
    const g = board.begin();
    g.fillStyle = p.bg;
    g.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Distant clouds.
    g.fillStyle = p.mutedSurface;
    g.globalAlpha = 0.45;
    for (let i = 0; i < 2; i += 1) {
      const x = ((i * 210 + distance * 0.06) % (BOARD_WIDTH + 150)) - 60;
      const y = 48 + i * 34;
      g.beginPath();
      g.arc(x, y, 12, 0, Math.PI * 2);
      g.arc(x + 15, y - 4, 15, 0, Math.PI * 2);
      g.arc(x + 32, y + 1, 11, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    // Ground and scrolling pebbles.
    g.fillStyle = p.border;
    g.fillRect(0, FLOOR, BOARD_WIDTH, 2);
    g.globalAlpha = 0.55;
    const offset = distance % 26;
    for (let x = -offset; x < BOARD_WIDTH + 26; x += 26) {
      g.fillRect(x, FLOOR + 7, 8, 1.6);
      g.fillRect(x + 13, FLOOR + 15, 4, 1.4);
    }
    g.globalAlpha = 1;

    for (const obstacle of obstacles) drawCactus(g, obstacle, p.primary);
    drawDino(g, p.primary);

    if (state === 'ready') readyPill(g, 'Space or tap to run');
  }

  function die(): void {
    state = 'over';
    loop.stop();
    draw();
    ctx.over(score);
  }

  function onKey(event: KeyboardEvent): void {
    const key = event.key;
    if (key !== ' ' && key !== 'ArrowUp' && key !== 'w' && key !== 'W' && key !== 'Enter') return;
    if (state === 'over' || document.activeElement?.closest('.overlay')) return;
    event.preventDefault();
    board.focus();
    jump();
  }

  function onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    board.focus();
    jump();
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
