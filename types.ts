
export enum Player {
  BLUE = 'BLUE',
  RED = 'RED'
}

export interface UnitStats {
  id: string;
  name: string;
  maxHp: number;
  hp: number;
  atk: number;
  moveRange: number;
  owner: Player;
  icon: string;
  cost: number;
  isAir: boolean;
  onlyCastle: boolean;
  description: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  board: (UnitStats | null)[][];
  blueCastleHp: number;
  redCastleHp: number;
  currentPlayer: Player;
  selectedPos: Position | null;
  validMoves: Position[];
  fireballCount: { [key in Player]: number };
  elixir: { [key in Player]: number };
  winner: Player | null;
  summonMode: string | null;
  fireballMode: boolean; // 파이어볼 모드 활성화 여부
}
