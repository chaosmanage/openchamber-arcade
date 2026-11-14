import { connectHost } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';
import { GAME_BY_KEY, GAMES } from './games/index';
import type { Game, GameKey } from './games/types';
import { PREVIEWS } from './previews';

const BEST_KEY = 'arcade:best';

const host = connectHost();
const root = need<HTMLElement>('#root');
const lobby = need<HTMLElement>('#lobby');
const grid = need<HTMLElement>('#game-grid');
const play = need<HTMLElement>('#play');
const playTitle = need<HTMLElement>('#play-title');
const scoreEl = need<HTMLElement>('#score');
const bestEl = need<HTMLElement>('#best');
const hintEl = need<HTMLElement>('#hint');
const stage = need<HTMLElement>('#stage');
const overlay = need<HTMLElement>('#overlay');
const overlayKicker = need<HTMLElement>('#overlay-kicker');
const overlayTitle = need<HTMLElement>('#overlay-title');
const overlayText = need<HTMLElement>('#overlay-text');
const overlayActions = need<HTMLElement>('#overlay-actions');

let best: Partial<Record<GameKey, number>> = {};
let activeKey: GameKey | null = null;
let activeGame: Game | null = null;
let roundOver = false;
let paused = false;
let heightRaf = 0;
let lastHeight = 0;

function need<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Arcade is missing ${selector}.`);
  return element;
}

function format(value: number): string {
  if (value >= 100_000) return `${Math.floor(value / 1000)}k`;
  if (value >= 10_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return value.toLocaleString('en-US');
}

function bestText(key: GameKey): string {
  const value = best[key] ?? 0;
  return value > 0 ? `best ${format(value)}` : 'best —';
}

function syncHeight(): void {
  cancelAnimationFrame(heightRaf);
  heightRaf = requestAnimationFrame(() => {
    const height = Math.ceil(root.getBoundingClientRect().height);
    if (!height || height === lastHeight) return;
    lastHeight = height;
    try {
      void host.setHeight(height).catch(() => undefined);
    } catch {
      // Hosts without status sizing simply keep the manifest height.
    }
  });
}

function updateBests(): void {
  for (const def of GAMES) {
    const label = grid.querySelector<HTMLElement>(`[data-best="${def.key}"]`);
    if (label) label.textContent = bestText(def.key);
  }
}

function buildLobby(): void {
  grid.replaceChildren();
  for (const def of GAMES) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';
    tile.dataset.game = def.key;
    tile.setAttribute('aria-label', `Play ${def.title}`);
    tile.innerHTML =
      `<span class="tile-head"><span class="tile-name">${def.title}</span>` +
      `<span class="tile-best" data-best="${def.key}">${bestText(def.key)}</span></span>` +
      `<span class="tile-art" aria-hidden="true">${PREVIEWS[def.key]}</span>` +
      `<span class="tile-foot"><span class="tile-keys">${def.keys}</span>` +
      `<span class="tile-go">Play</span></span>`;
    tile.addEventListener('click', () => openGame(def.key));
    grid.append(tile);
  }
  updateBests();
}

function showOverlay(options: {
  kicker: string;
  title: string;
  text: string;
  actions: { label: string; primary?: boolean; run: () => void }[];
}): void {
  overlayKicker.textContent = options.kicker;
  overlayTitle.textContent = options.title;
  overlayText.innerHTML = options.text;
  overlayActions.replaceChildren();
  for (const option of options.actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `action${option.primary ? ' primary' : ''}`;
    button.textContent = option.label;
    button.addEventListener('click', () => {
      overlay.hidden = true;
      option.run();
    });
    overlayActions.append(button);
  }
  overlay.hidden = false;
  void host.setHeight(Math.ceil(root.getBoundingClientRect().height)).catch(() => undefined);
  requestAnimationFrame(() => {
    overlayActions.querySelector<HTMLButtonElement>('.action.primary')?.focus({ preventScroll: true });
  });
}

function hideOverlay(): void {
  overlay.hidden = true;
}

function persistBest(): void {
  try {
    void host.storage.set(BEST_KEY, best).catch(() => undefined);
  } catch {
    // Keep the score for this session even if storage is unavailable.
  }
}

function onRoundOver(value: number): void {
  if (roundOver || !activeKey) return;
  roundOver = true;
  paused = false;
  const key = activeKey;
  const previous = best[key] ?? 0;
  const isBest = value > previous;
  if (isBest) {
    best[key] = value;
    updateBests();
    persistBest();
  }
  bestEl.textContent = bestText(key);
  showOverlay({
    kicker: 'Game over',
    title: `${format(value)} ${value === 1 ? 'point' : 'points'}`,
    text: isBest
      ? '<span class="new-best">New personal best</span>'
      : `Best ${format(best[key] ?? previous)}`,
    actions: [
      { label: 'Play again', primary: true, run: restartRound },
      { label: 'Games', run: closeGame },
    ],
  });
}

function restartRound(): void {
  if (!activeGame) return;
  roundOver = false;
  paused = false;
  hideOverlay();
  scoreEl.textContent = '0';
  activeGame.restart();
  syncHeight();
}

function togglePause(): void {
  if (!activeGame || roundOver || !activeKey) return;
  if (!paused) {
    paused = true;
    activeGame.pause();
    showOverlay({
      kicker: 'Paused',
      title: 'Take a breath',
      text: 'Your round is on hold.',
      actions: [
        {
          label: 'Resume',
          primary: true,
          run: () => {
            paused = false;
            activeGame?.resume();
            hideOverlay();
          },
        },
        { label: 'Games', run: closeGame },
      ],
    });
    return;
  }
  paused = false;
  hideOverlay();
  activeGame.resume();
}

function openGame(key: GameKey): void {
  const definition = GAME_BY_KEY[key];
  if (!definition) return;

  activeGame?.destroy();
  activeGame = null;
  activeKey = key;
  roundOver = false;
  paused = false;

  lobby.hidden = true;
  play.hidden = false;
  playTitle.textContent = definition.title;
  hintEl.textContent = definition.hint;
  scoreEl.textContent = '0';
  bestEl.textContent = bestText(key);
  hideOverlay();
  stage.replaceChildren();

  try {
    activeGame = definition.create({
      stage,
      setScore(value) {
        scoreEl.textContent = format(value);
      },
      over(value) {
        onRoundOver(value);
      },
    });
    activeGame.start();
  } catch {
    activeGame = null;
    showOverlay({
      kicker: 'Arcade',
      title: 'Cannot start',
      text: 'This window cannot draw the game board.',
      actions: [{ label: 'Games', primary: true, run: closeGame }],
    });
  }

  syncHeight();
}

function closeGame(): void {
  activeGame?.destroy();
  activeGame = null;
  activeKey = null;
  roundOver = false;
  paused = false;
  stage.replaceChildren();
  hideOverlay();
  play.hidden = true;
  lobby.hidden = false;
  updateBests();
  syncHeight();
}

function onGlobalKey(event: KeyboardEvent): void {
  if (!activeKey) return;
  if (event.key === 'p' || event.key === 'P') {
    event.preventDefault();
    togglePause();
  }
}

function onVisibility(): void {
  if (document.hidden && activeKey && !roundOver && !paused) togglePause();
}

function bindChrome(): void {
  need<HTMLButtonElement>('#back').addEventListener('click', closeGame);
  need<HTMLButtonElement>('#restart').addEventListener('click', restartRound);
  window.addEventListener('keydown', onGlobalKey);
  document.addEventListener('visibilitychange', onVisibility);
  new ResizeObserver(() => syncHeight()).observe(root);
}

async function loadBest(): Promise<void> {
  try {
    const stored = await host.storage.get(BEST_KEY);
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return;
    const record = stored as Record<string, unknown>;
    const next: Partial<Record<GameKey, number>> = {};
    for (const def of GAMES) {
      const value = record[def.key];
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        next[def.key] = Math.floor(value);
      }
    }
    best = next;
    updateBests();
  } catch {
    // No stored scores yet.
  }
}

let booted = false;

host.onReady((context) => {
  applyHostReady(context, document.documentElement);
  if (booted) return;
  booted = true;

  buildLobby();
  bindChrome();
  syncHeight();
  void loadBest();
});
