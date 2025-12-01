export enum GameType {
  LUDO = 'LUDO',
  TIC_TAC_TOE = 'TICK-TACK-TOE',
  CHESS = 'CHESS',
  SNAKE = 'SNAKE GAME',
  CRICKET = 'CRICKET',
  TABLE_TENNIS = 'TABLE TENNIS',
  BADMINTON = 'BADMINTON',
}

export enum PlayerColor {
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  BLUE = 'BLUE',
}

export interface Token {
  id: number;
  color: PlayerColor;
  position: number; // -1 for base, 0-51 for path, 52-57 for home stretch, 99 for finished
  isSafe: boolean;
}

export interface Player {
  color: PlayerColor;
  tokens: Token[];
  hasFinished: boolean;
}
