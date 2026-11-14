import { createDino } from './dino';
import { createFlappy } from './flappy';
import { create2048 } from './game2048';
import { createSnake } from './snake';
import type { GameDefinition, GameKey } from './types';

export const GAMES: GameDefinition[] = [
  {
    key: 'snake',
    title: 'Snake',
    keys: 'Arrows · swipe',
    hint: 'Arrows / WASD · swipe to turn',
    create: createSnake,
  },
  {
    key: 'flappy',
    title: 'Flappy Bird',
    keys: 'Space · tap',
    hint: 'Space / tap to flap',
    create: createFlappy,
  },
  {
    key: '2048',
    title: '2048',
    keys: 'Arrows · swipe',
    hint: 'Arrows / WASD · swipe to slide',
    create: create2048,
  },
  {
    key: 'dino',
    title: 'Dino Run',
    keys: 'Space · tap',
    hint: 'Space / tap to jump',
    create: createDino,
  },
];

export const GAME_BY_KEY: Record<GameKey, GameDefinition> = {
  snake: GAMES[0]!,
  flappy: GAMES[1]!,
  '2048': GAMES[2]!,
  dino: GAMES[3]!,
};
