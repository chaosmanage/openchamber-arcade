export type GameKey = 'snake' | 'flappy' | '2048' | 'dino';

export interface GameContext {
  /** The stage element the game draws into. */
  stage: HTMLElement;
  /** Report the current round score to the section header. */
  setScore(value: number): void;
  /** Report the end of a round. The game stops itself after this call. */
  over(score: number): void;
}

export interface Game {
  /** Mount the game and start its loop in the idle (ready) state. */
  start(): void;
  /** Reset the round and start playing again. */
  restart(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface GameDefinition {
  key: GameKey;
  title: string;
  /** Short control hint for the launcher tile. */
  keys: string;
  /** Full control hint for the footer while playing. */
  hint: string;
  create(ctx: GameContext): Game;
}
