export type CardType = 
  | 'Shield' 
  | 'Dodge' 
  | 'Reverse Fate' 
  | 'Force Shoot' 
  | 'Double Fire' 
  | 'Mark Target' 
  | 'Swap Turn' 
  | 'Peek Chamber' 
  | 'Shuffle Chamber';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
}

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  isAlive: boolean;
  cards: Card[];
  statuses: {
    shield: boolean;
    dodge: boolean;
    reverseFate: boolean;
    marked: boolean;
    peeked: boolean;
  };
}

export interface GameState {
  players: Player[];
  currentTurn: number;
  revolver: boolean[]; // true = bullet, false = blank
  currentChamber: number;
  logs: string[];
  gameOver: boolean;
  winner: Player | null;
  round: number;
}

export type Action = 
  | { type: 'SHOOT'; shooterId: number; targetId: number }
  | { type: 'USE_CARD'; playerId: number; targetId: number; card: Card }
  | { type: 'RESET_GAME' };
