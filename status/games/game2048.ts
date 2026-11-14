import type { Game, GameContext } from './types';

const SIZE = 4;

type Direction = 'left' | 'right' | 'up' | 'down';
type Position = { row: number; col: number };

const at = (grid: number[][], row: number, col: number): number => grid[row]?.[col] ?? 0;

const emptyGrid = (): number[][] =>
  Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));

export function create2048(ctx: GameContext): Game {
  const shell = document.createElement('div');
  shell.className = 'g2048';
  shell.innerHTML =
    '<div class="g2048-board"><div class="g2048-grid"></div><div class="g2048-tiles"></div></div>';
  ctx.stage.replaceChildren(shell);

  const boardEl = shell.querySelector<HTMLElement>('.g2048-board');
  const gridQuery = shell.querySelector<HTMLElement>('.g2048-grid');
  const tilesQuery = shell.querySelector<HTMLElement>('.g2048-tiles');
  if (!boardEl || !gridQuery || !tilesQuery) throw new Error('This frame cannot draw a board.');
  const board: HTMLElement = boardEl;
  const gridEl: HTMLElement = gridQuery;
  const tilesEl: HTMLElement = tilesQuery;

  for (let i = 0; i < SIZE * SIZE; i += 1) {
    const cell = document.createElement('div');
    cell.className = 'g2048-cell';
    gridEl.append(cell);
  }

  let grid: number[][] = emptyGrid();
  let score = 0;
  let state: 'play' | 'over' = 'play';
  let active = true;
  let won = false;
  let spawned: Position | null = null;
  let merged = new Set<string>();
  let toastTimer = 0;
  let down: { x: number; y: number } | null = null;

  const keyOf = (row: number, col: number): string => `${row}:${col}`;

  function addRandomTile(): Position | null {
    const free: Position[] = [];
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (at(grid, row, col) === 0) free.push({ row, col });
      }
    }
    if (!free.length) return null;
    const spot = free[Math.floor(Math.random() * free.length)];
    if (!spot) return null;
    const value = Math.random() < 0.9 ? 2 : 4;
    grid[spot.row]![spot.col] = value;
    return spot;
  }

  function render(): void {
    tilesEl.replaceChildren();
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const value = at(grid, row, col);
        if (value === 0) continue;
        const tile = document.createElement('div');
        tile.className = 'g2048-tile';
        tile.style.left = `${col * 25}%`;
        tile.style.top = `${row * 25}%`;
        const face = document.createElement('div');
        face.className = 'g2048-face';
        face.dataset.v = String(value);
        face.dataset.len = String(String(value).length);
        face.textContent = String(value);
        if (spawned && spawned.row === row && spawned.col === col) face.classList.add('is-new');
        if (merged.has(keyOf(row, col))) face.classList.add('is-merged');
        tile.append(face);
        tilesEl.append(tile);
      }
    }
  }

  function refresh(): void {
    ctx.setScore(score);
    render();
  }

  function newGame(): void {
    grid = emptyGrid();
    score = 0;
    state = 'play';
    active = true;
    won = false;
    merged = new Set();
    spawned = addRandomTile();
    addRandomTile();
    spawned = null;
    refresh();
  }

  function celebrate(): void {
    const note = document.createElement('div');
    note.className = 'g2048-toast';
    note.textContent = '2048!';
    shell.append(note);
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => note.remove(), 2300);
  }

  function slideLine(values: number[]): { result: number[]; gained: number; merges: boolean[] } {
    const compact = values.filter((value) => value !== 0);
    const result: number[] = [];
    const merges: boolean[] = [];
    let gained = 0;
    for (let i = 0; i < compact.length; i += 1) {
      const value = compact[i] ?? 0;
      if (i + 1 < compact.length && compact[i + 1] === value) {
        const doubled = value * 2;
        result.push(doubled);
        merges.push(true);
        gained += doubled;
        i += 1;
      } else {
        result.push(value);
        merges.push(false);
      }
    }
    while (result.length < SIZE) {
      result.push(0);
      merges.push(false);
    }
    return { result, gained, merges };
  }

  function linesFor(direction: Direction): Position[][] {
    const lines: Position[][] = [];
    if (direction === 'left' || direction === 'right') {
      for (let row = 0; row < SIZE; row += 1) {
        const line = Array.from({ length: SIZE }, (_, col) => ({ row, col }));
        lines.push(direction === 'left' ? line : line.reverse());
      }
    } else {
      for (let col = 0; col < SIZE; col += 1) {
        const line = Array.from({ length: SIZE }, (_, row) => ({ row, col }));
        lines.push(direction === 'up' ? line : line.reverse());
      }
    }
    return lines;
  }

  function move(direction: Direction): void {
    if (!active || state !== 'play') return;
    const before = grid.map((row) => [...row]);
    const next = emptyGrid();
    const mergedAt = new Set<string>();
    let gained = 0;

    for (const line of linesFor(direction)) {
      const values = line.map((spot) => at(grid, spot.row, spot.col));
      const { result, gained: lineGain, merges } = slideLine(values);
      gained += lineGain;
      line.forEach((spot, index) => {
        const value = result[index] ?? 0;
        next[spot.row]![spot.col] = value;
        if (merges[index] && value !== 0) mergedAt.add(keyOf(spot.row, spot.col));
      });
    }

    const changed = next.some((row, r) => row.some((value, c) => value !== at(before, r, c)));
    if (!changed) return;

    grid = next;
    merged = mergedAt;
    score += gained;
    ctx.setScore(score);

    const hasWinningTile = grid.some((row) => row.some((value) => value >= 2048));
    if (hasWinningTile && !won) {
      won = true;
      celebrate();
    }

    spawned = addRandomTile();
    render();
    spawned = null;

    if (!canMove()) {
      state = 'over';
      active = false;
      ctx.over(score);
    }
  }

  function canMove(): boolean {
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        const value = at(grid, row, col);
        if (value === 0) return true;
        if (col + 1 < SIZE && at(grid, row, col + 1) === value) return true;
        if (row + 1 < SIZE && at(grid, row + 1, col) === value) return true;
      }
    }
    return false;
  }

  function directionFor(key: string): Direction | null {
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') return 'left';
    if (key === 'ArrowRight' || key === 'd' || key === 'D') return 'right';
    if (key === 'ArrowUp' || key === 'w' || key === 'W') return 'up';
    if (key === 'ArrowDown' || key === 's' || key === 'S') return 'down';
    return null;
  }

  function onKey(event: KeyboardEvent): void {
    const direction = directionFor(event.key);
    if (!direction) return;
    if (document.activeElement?.closest('.overlay')) return;
    event.preventDefault();
    if (!active) return;
    move(direction);
  }

  function onPointerDown(event: PointerEvent): void {
    down = { x: event.clientX, y: event.clientY };
    board?.focus({ preventScroll: true });
  }

  function onPointerUp(event: PointerEvent): void {
    if (!down) return;
    const dx = event.clientX - down.x;
    const dy = event.clientY - down.y;
    down = null;
    if (Math.hypot(dx, dy) < 18) return;
    const direction: Direction =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    move(direction);
  }

  function onPointerCancel(): void {
    down = null;
  }

  window.addEventListener('keydown', onKey);
  shell.addEventListener('pointerdown', onPointerDown);
  shell.addEventListener('pointerup', onPointerUp);
  shell.addEventListener('pointercancel', onPointerCancel);

  return {
    start() {
      newGame();
    },
    restart() {
      newGame();
    },
    pause() {
      active = false;
    },
    resume() {
      if (state === 'play') active = true;
    },
    destroy() {
      window.removeEventListener('keydown', onKey);
      shell.removeEventListener('pointerdown', onPointerDown);
      shell.removeEventListener('pointerup', onPointerUp);
      shell.removeEventListener('pointercancel', onPointerCancel);
      window.clearTimeout(toastTimer);
      shell.remove();
    },
  };
}
