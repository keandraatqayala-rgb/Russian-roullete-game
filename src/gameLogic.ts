import { GameState, Action, Card, CardType, Player } from './types';

const CARD_TYPES: CardType[] = [
  'Shield', 'Dodge', 'Reverse Fate', 
  'Force Shoot', 'Double Fire', 'Mark Target', 
  'Swap Turn', 'Peek Chamber', 'Shuffle Chamber'
];

export const getCardDescription = (type: CardType) => {
  switch(type) {
    case 'Shield': return 'Block 1 bullet.';
    case 'Dodge': return '50% chance to dodge a bullet.';
    case 'Reverse Fate': return 'If you die, you survive instead.';
    case 'Force Shoot': return 'Force target to shoot themselves.';
    case 'Double Fire': return 'Target must shoot themselves twice.';
    case 'Mark Target': return 'Mark target (AI will prioritize them).';
    case 'Swap Turn': return 'Give the current turn to target.';
    case 'Peek Chamber': return 'See if the next chamber has a bullet.';
    case 'Shuffle Chamber': return 'Randomize the revolver chambers.';
  }
};

export const getRandomCard = (): Card => {
  const type = CARD_TYPES[Math.floor(Math.random() * CARD_TYPES.length)];
  return {
    id: Math.random().toString(36).substring(2, 9),
    type,
    name: type,
    description: getCardDescription(type)
  };
};

export const generateRevolver = () => {
  const bullets = Math.random() > 0.5 ? 2 : 1;
  const chambers = Array(6).fill(false);
  let placed = 0;
  while (placed < bullets) {
    const idx = Math.floor(Math.random() * 6);
    if (!chambers[idx]) {
      chambers[idx] = true;
      placed++;
    }
  }
  return chambers;
};

export const createInitialState = (): GameState => {
  const players: Player[] = [
    { id: 0, name: 'You', isHuman: true, isAlive: true, cards: [getRandomCard()], statuses: { shield: false, dodge: false, reverseFate: false, marked: false, peeked: false } },
    { id: 1, name: 'AI 1', isHuman: false, isAlive: true, cards: [getRandomCard()], statuses: { shield: false, dodge: false, reverseFate: false, marked: false, peeked: false } },
    { id: 2, name: 'AI 2', isHuman: false, isAlive: true, cards: [getRandomCard()], statuses: { shield: false, dodge: false, reverseFate: false, marked: false, peeked: false } },
    { id: 3, name: 'AI 3', isHuman: false, isAlive: true, cards: [getRandomCard()], statuses: { shield: false, dodge: false, reverseFate: false, marked: false, peeked: false } },
  ];

  return {
    players,
    currentTurn: 0,
    revolver: generateRevolver(),
    currentChamber: 0,
    logs: ['Game started. Round 1 begins.'],
    gameOver: false,
    winner: null,
    round: 1,
  };
};

export const gameReducer = (state: GameState, action: Action): GameState => {
  if (action.type === 'RESET_GAME') {
    return createInitialState();
  }

  // Deep clone state for easy mutation
  const draft: GameState = JSON.parse(JSON.stringify(state));

  const checkReload = () => {
    if (draft.currentChamber >= 6) {
      draft.logs.unshift(`🔄 Revolver is empty. Reloading...`);
      draft.revolver = generateRevolver();
      draft.currentChamber = 0;
      draft.round++;
      draft.players.forEach(p => {
        if (p.isAlive) p.cards.push(getRandomCard());
      });
    }
  };

  const pullTrigger = (targetId: number) => {
    const isBullet = draft.revolver[draft.currentChamber];
    const target = draft.players.find(p => p.id === targetId)!;
    let died = false;

    if (isBullet) {
      if (target.statuses.shield) {
        target.statuses.shield = false;
        draft.logs.unshift(`🛡️ ${target.name}'s Shield blocked the bullet!`);
      } else if (target.statuses.dodge && Math.random() < 0.5) {
        target.statuses.dodge = false;
        draft.logs.unshift(`💨 ${target.name} dodged the bullet!`);
      } else if (target.statuses.reverseFate) {
        target.statuses.reverseFate = false;
        draft.logs.unshift(`✨ ${target.name}'s Fate was Reversed! They survived!`);
      } else {
        target.isAlive = false;
        died = true;
        draft.logs.unshift(`💥 BANG! ${target.name} was shot and died!`);
      }
    } else {
      draft.logs.unshift(`😮‍💨 Click. Chamber was empty for ${target.name}.`);
    }

    draft.currentChamber++;
    return { isBullet, died };
  };

  const checkGameOver = () => {
    const alive = draft.players.filter(p => p.isAlive);
    if (alive.length === 1) {
      draft.gameOver = true;
      draft.winner = alive[0];
      draft.logs.unshift(`🏆 ${alive[0].name} is the Last Mind Standing!`);
    } else if (alive.length === 0) {
      draft.gameOver = true;
      draft.logs.unshift(`💀 Everyone died. Draw.`);
    }
  };

  const nextTurn = (extraTurnId?: number) => {
    if (draft.gameOver) return;
    checkReload();

    if (extraTurnId !== undefined && draft.players.find(p => p.id === extraTurnId)?.isAlive) {
      draft.currentTurn = extraTurnId;
    } else {
      let next = (draft.currentTurn + 1) % 4;
      while (!draft.players[next].isAlive) {
        next = (next + 1) % 4;
      }
      draft.currentTurn = next;
    }
  };

  switch (action.type) {
    case 'SHOOT': {
      const { shooterId, targetId } = action;
      const shooter = draft.players.find(p => p.id === shooterId)!;
      const target = draft.players.find(p => p.id === targetId)!;

      draft.logs.unshift(`🔫 ${shooter.name} points the gun at ${target.name}...`);
      const { isBullet } = pullTrigger(targetId);

      checkGameOver();

      if (!draft.gameOver) {
        if (shooterId === targetId && !isBullet) {
          draft.logs.unshift(`✨ ${shooter.name} gets an extra turn for surviving a self-shot!`);
          nextTurn(shooterId);
        } else {
          nextTurn();
        }
      }
      break;
    }
    case 'USE_CARD': {
      const { playerId, targetId, card } = action;
      const player = draft.players.find(p => p.id === playerId)!;
      const target = draft.players.find(p => p.id === targetId)!;

      const cardIndex = player.cards.findIndex(c => c.id === card.id);
      if (cardIndex > -1) player.cards.splice(cardIndex, 1);

      draft.logs.unshift(`🃏 ${player.name} uses ${card.name}${playerId !== targetId ? ` on ${target.name}` : ''}!`);

      let extraTurnId: number | undefined;

      switch (card.type) {
        case 'Shield': target.statuses.shield = true; break;
        case 'Dodge': target.statuses.dodge = true; break;
        case 'Reverse Fate': target.statuses.reverseFate = true; break;
        case 'Mark Target': target.statuses.marked = true; break;
        case 'Peek Chamber': player.statuses.peeked = true; break;
        case 'Shuffle Chamber':
          draft.revolver = generateRevolver();
          draft.currentChamber = 0;
          draft.logs.unshift(`🔄 The chamber was shuffled!`);
          break;
        case 'Swap Turn':
          extraTurnId = targetId;
          break;
        case 'Force Shoot':
          draft.logs.unshift(`🎯 ${target.name} is forced to shoot themselves!`);
          pullTrigger(targetId);
          break;
        case 'Double Fire':
          draft.logs.unshift(`🎯 ${target.name} is forced to shoot themselves TWICE!`);
          const res1 = pullTrigger(targetId);
          if (!res1.died) {
            checkReload();
            pullTrigger(targetId);
          }
          break;
      }

      checkGameOver();
      if (!draft.gameOver) {
        nextTurn(extraTurnId);
      }
      break;
    }
  }

  // keep logs limited
  if (draft.logs.length > 50) {
    draft.logs = draft.logs.slice(0, 50);
  }

  return draft;
};

export const needsTarget = (type: CardType) => ['Force Shoot', 'Double Fire', 'Mark Target', 'Swap Turn'].includes(type);
