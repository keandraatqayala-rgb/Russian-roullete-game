export type CardCategory = 'Defense' | 'Attack' | 'Trick' | 'Revolver' | 'Special' | 'Curse';

export type CardType = 
  // Defense
  | 'Shield' | 'Dodge' | 'Reverse Fate' | 'Iron Skin' | 'Second Chance' | 'Mirror Shield'
  // Attack
  | 'Force Shoot' | 'Double Fire' | 'Mark Target' | 'Execute' | 'Chain Shot' | 'Target Lock'
  // Trick
  | 'Swap Turn' | 'Peek Chamber' | 'Shuffle Chamber' | 'Steal Card' | 'Turn Skip'
  // Revolver
  | 'Add Bullet' | 'Remove Bullet' | 'Lock Chamber' | 'Safe Chamber';

export interface Card {
  id: string;
  type: CardType;
  category: CardCategory;
  name: string;
  description: string;
}

export type Role = 'Doctor' | 'Gambler' | 'Assassin' | 'Strategist' | 'Guardian' | 'Trickster' | 'Reaper' | 'Berserker';
export type PlayerClass = 'Offense' | 'Defense' | 'Trickster' | 'Precision' | 'Chaos';
export type AIPersonality = 'Aggressive' | 'Strategist' | 'Deceiver' | 'Survivor' | 'Gambler' | 'None';

export interface Stats {
  accuracy: number;
  intelligence: number;
  luck: number;
  speed: number;
  defense: number;
}

export interface Player {
  id: number;
  name: string;
  isHuman: boolean;
  isAlive: boolean;
  hp: number;
  maxHp: number;
  role: Role;
  playerClass: PlayerClass;
  personality: AIPersonality;
  stats: Stats;
  cards: Card[];
  statuses: {
    shield: boolean;
    dodge: boolean;
    reverseFate: boolean;
    ironSkin: boolean;
    secondChance: boolean;
    mirrorShield: boolean;
    marked: boolean;
    targetLock: boolean;
    peeked: boolean;
    turnSkip: boolean;
  };
  memory: {
    successStreak: number;
    failStreak: number;
  };
}

export interface GameState {
  players: Player[];
  currentTurn: number;
  revolver: boolean[]; // true = bullet, false = blank
  currentChamber: number;
  logs: { text: string; type: 'normal' | 'success' | 'danger' | 'info' }[];
  gameOver: boolean;
  winner: Player | null;
  round: number;
  cameraShake: boolean;
  zoomTarget: number | null;
}

export type Action = 
  | { type: 'SHOOT'; shooterId: number; targetId: number }
  | { type: 'USE_CARD'; playerId: number; targetId: number; card: Card }
  | { type: 'RESET_GAME' }
  | { type: 'END_ANIMATION' };

