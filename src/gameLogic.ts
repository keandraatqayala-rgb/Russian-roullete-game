import { GameState, Action, Card, CardType, Player, CardCategory, Role, PlayerClass, AIPersonality, Stats } from './types';

const CARD_DEFINITIONS: { type: CardType; category: CardCategory; desc: string }[] = [
  { type: 'Shield', category: 'Defense', desc: 'Block 1 bullet damage.' },
  { type: 'Dodge', category: 'Defense', desc: '50% chance to dodge a bullet.' },
  { type: 'Reverse Fate', category: 'Defense', desc: 'If you die, you survive instead.' },
  { type: 'Iron Skin', category: 'Defense', desc: 'Immune to the next shot.' },
  { type: 'Second Chance', category: 'Defense', desc: 'Revive with 1 HP if killed.' },
  { type: 'Mirror Shield', category: 'Defense', desc: 'Reflect bullet back to shooter.' },
  
  { type: 'Force Shoot', category: 'Attack', desc: 'Force target to shoot themselves.' },
  { type: 'Double Fire', category: 'Attack', desc: 'Target must shoot themselves twice.' },
  { type: 'Mark Target', category: 'Attack', desc: 'Mark target (AI prioritizes them).' },
  { type: 'Execute', category: 'Attack', desc: 'Instantly kill target if HP is 1.' },
  { type: 'Chain Shot', category: 'Attack', desc: 'If hit, next player also takes a shot.' },
  { type: 'Target Lock', category: 'Attack', desc: 'Attacks on target are more accurate.' },
  
  { type: 'Swap Turn', category: 'Trick', desc: 'Give current turn to target.' },
  { type: 'Peek Chamber', category: 'Trick', desc: 'See if next chamber has a bullet.' },
  { type: 'Shuffle Chamber', category: 'Trick', desc: 'Randomize the revolver chambers.' },
  { type: 'Steal Card', category: 'Trick', desc: 'Steal a random card from target.' },
  { type: 'Turn Skip', category: 'Trick', desc: 'Skip target\'s next turn.' },
  
  { type: 'Add Bullet', category: 'Revolver', desc: 'Add 1 bullet to a random empty chamber.' },
  { type: 'Remove Bullet', category: 'Revolver', desc: 'Remove 1 bullet from a random chamber.' },
  { type: 'Lock Chamber', category: 'Revolver', desc: 'Next shot is GUARANTEED to be a bullet.' },
  { type: 'Safe Chamber', category: 'Revolver', desc: 'Next shot is GUARANTEED to be empty.' },
];

export const getRandomCard = (): Card => {
  const def = CARD_DEFINITIONS[Math.floor(Math.random() * CARD_DEFINITIONS.length)];
  return {
    id: Math.random().toString(36).substring(2, 9),
    type: def.type,
    category: def.category,
    name: def.type,
    description: def.desc
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

const getBaseStats = (role: Role, pClass: PlayerClass): { hp: number; stats: Stats } => {
  let hp = 3;
  let stats: Stats = { accuracy: 50, intelligence: 50, luck: 50, speed: 50, defense: 50 };
  
  if (role === 'Assassin') { hp = 2; stats = { accuracy: 80, intelligence: 60, luck: 50, speed: 90, defense: 30 }; }
  if (role === 'Doctor') { hp = 4; stats = { accuracy: 50, intelligence: 80, luck: 60, speed: 40, defense: 70 }; }
  if (role === 'Gambler') { hp = 3; stats = { accuracy: 50, intelligence: 50, luck: 95, speed: 60, defense: 40 }; }
  if (role === 'Strategist') { hp = 3; stats = { accuracy: 60, intelligence: 90, luck: 40, speed: 70, defense: 50 }; }
  
  if (pClass === 'Offense') { stats.accuracy += 10; stats.speed += 10; }
  if (pClass === 'Defense') { hp += 1; stats.defense += 20; }
  if (pClass === 'Chaos') { stats.luck += 20; stats.accuracy -= 10; }
  
  return { hp, stats };
};

const createPlayer = (id: number, name: string, isHuman: boolean, role: Role, pClass: PlayerClass, personality: AIPersonality): Player => {
  const { hp, stats } = getBaseStats(role, pClass);
  return {
    id, name, isHuman, isAlive: true, hp, maxHp: hp, role, playerClass: pClass, personality, stats,
    cards: [getRandomCard(), getRandomCard()],
    statuses: { shield: false, dodge: false, reverseFate: false, ironSkin: false, secondChance: false, mirrorShield: false, marked: false, targetLock: false, peeked: false, turnSkip: false },
    memory: { successStreak: 0, failStreak: 0 }
  };
};

const ROLES: Role[] = ['Doctor', 'Gambler', 'Assassin', 'Strategist', 'Guardian', 'Trickster', 'Reaper', 'Berserker'];
const CLASSES: PlayerClass[] = ['Offense', 'Defense', 'Trickster', 'Precision', 'Chaos'];
const PERSONALITIES: AIPersonality[] = ['Aggressive', 'Strategist', 'Deceiver', 'Survivor', 'Gambler'];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const createInitialState = (): GameState => {
  const players: Player[] = [
    createPlayer(0, 'You', true, 'Gambler', 'Chaos', 'None'),
    createPlayer(1, 'AI 1', false, getRandomItem(ROLES), getRandomItem(CLASSES), getRandomItem(PERSONALITIES)),
    createPlayer(2, 'AI 2', false, getRandomItem(ROLES), getRandomItem(CLASSES), getRandomItem(PERSONALITIES)),
    createPlayer(3, 'AI 3', false, getRandomItem(ROLES), getRandomItem(CLASSES), getRandomItem(PERSONALITIES)),
  ];

  return {
    players,
    currentTurn: 0,
    revolver: generateRevolver(),
    currentChamber: 0,
    logs: [{ text: 'Game started. Round 1 begins.', type: 'info' }],
    gameOver: false,
    winner: null,
    round: 1,
    cameraShake: false,
    zoomTarget: null
  };
};

type RNGOutcome = 'Failed Badly' | 'Failed' | 'Normal' | 'Success' | 'Great Success';

const rollRNG = (player: Player, baseChance: number = 40): RNGOutcome => {
  let chance = baseChance;
  chance += (player.stats.luck - 50) * 0.5;
  if (player.hp === 1) chance += 15; // Low HP bonus
  chance += player.memory.failStreak * 10;
  chance -= player.memory.successStreak * 10;
  
  const roll = Math.random() * 100;
  if (roll < 10) { player.memory.failStreak++; player.memory.successStreak = 0; return 'Failed Badly'; }
  if (roll < 30) { player.memory.failStreak++; player.memory.successStreak = 0; return 'Failed'; }
  if (roll < 30 + chance) { player.memory.successStreak++; player.memory.failStreak = 0; return 'Success'; }
  if (roll < 40 + chance) { player.memory.successStreak += 2; player.memory.failStreak = 0; return 'Great Success'; }
  return 'Normal';
};

export const gameReducer = (state: GameState, action: Action): GameState => {
  if (action.type === 'RESET_GAME') return createInitialState();
  if (action.type === 'END_ANIMATION') return { ...state, cameraShake: false, zoomTarget: null };

  const draft: GameState = JSON.parse(JSON.stringify(state));
  
  const addLog = (text: string, type: 'normal' | 'success' | 'danger' | 'info' = 'normal') => {
    draft.logs.unshift({ text, type });
    if (draft.logs.length > 50) draft.logs = draft.logs.slice(0, 50);
  };

  const checkReload = () => {
    if (draft.currentChamber >= 6) {
      addLog(`🔄 Revolver is empty. Reloading...`, 'info');
      draft.revolver = generateRevolver();
      draft.currentChamber = 0;
      draft.round++;
      draft.players.forEach(p => { if (p.isAlive) p.cards.push(getRandomCard()); });
    }
  };

  const takeDamage = (target: Player, amount: number, shooter?: Player) => {
    if (target.statuses.ironSkin) { target.statuses.ironSkin = false; addLog(`🛡️ ${target.name}'s Iron Skin blocked the shot!`, 'success'); return false; }
    if (target.statuses.shield) { target.statuses.shield = false; addLog(`🛡️ ${target.name}'s Shield blocked the shot!`, 'success'); return false; }
    if (target.statuses.dodge && Math.random() < 0.5) { target.statuses.dodge = false; addLog(`💨 ${target.name} dodged the bullet!`, 'success'); return false; }
    if (target.statuses.mirrorShield && shooter) {
      target.statuses.mirrorShield = false;
      addLog(`🪞 ${target.name} reflected the bullet back to ${shooter.name}!`, 'danger');
      takeDamage(shooter, amount);
      return false;
    }

    target.hp -= amount;
    addLog(`💥 BANG! ${target.name} took ${amount} damage! (HP: ${target.hp}/${target.maxHp})`, 'danger');
    draft.cameraShake = true;

    if (target.hp <= 0) {
      if (target.statuses.reverseFate) {
        target.statuses.reverseFate = false;
        target.hp = 1;
        addLog(`✨ ${target.name}'s Fate was Reversed! They survived with 1 HP!`, 'success');
      } else if (target.statuses.secondChance) {
        target.statuses.secondChance = false;
        target.hp = 1;
        addLog(`👼 ${target.name} used Second Chance and revived!`, 'success');
      } else {
        target.isAlive = false;
        addLog(`💀 ${target.name} died!`, 'danger');
      }
    }
    return true;
  };

  const pullTrigger = (shooterId: number, targetId: number) => {
    const isBullet = draft.revolver[draft.currentChamber];
    const shooter = draft.players.find(p => p.id === shooterId)!;
    const target = draft.players.find(p => p.id === targetId)!;
    draft.zoomTarget = targetId;

    if (isBullet) {
      takeDamage(target, 1, shooter);
    } else {
      addLog(`😮‍💨 Click. Chamber was empty for ${target.name}.`, 'normal');
    }

    draft.currentChamber++;
    return isBullet;
  };

  const checkGameOver = () => {
    const alive = draft.players.filter(p => p.isAlive);
    if (alive.length === 1) {
      draft.gameOver = true;
      draft.winner = alive[0];
      addLog(`🏆 ${alive[0].name} is the Last Mind Standing!`, 'success');
    } else if (alive.length === 0) {
      draft.gameOver = true;
      addLog(`💀 Everyone died. Draw.`, 'danger');
    }
  };

  const nextTurn = (extraTurnId?: number) => {
    if (draft.gameOver) return;
    checkReload();

    if (extraTurnId !== undefined && draft.players.find(p => p.id === extraTurnId)?.isAlive) {
      draft.currentTurn = extraTurnId;
    } else {
      let next = (draft.currentTurn + 1) % 4;
      let loops = 0;
      while ((!draft.players[next].isAlive || draft.players[next].statuses.turnSkip) && loops < 4) {
        if (draft.players[next].statuses.turnSkip) {
          draft.players[next].statuses.turnSkip = false;
          addLog(`⏭️ ${draft.players[next].name}'s turn was skipped!`, 'info');
        }
        next = (next + 1) % 4;
        loops++;
      }
      draft.currentTurn = next;
    }
    draft.zoomTarget = draft.currentTurn;
  };

  switch (action.type) {
    case 'SHOOT': {
      const { shooterId, targetId } = action;
      const shooter = draft.players.find(p => p.id === shooterId)!;
      const target = draft.players.find(p => p.id === targetId)!;

      addLog(`🔫 ${shooter.name} points the gun at ${target.name}...`, 'normal');
      
      const outcome = rollRNG(shooter);
      if (outcome === 'Failed Badly') {
        addLog(`❌ Gun jammed! Turn lost.`, 'danger');
        nextTurn();
        break;
      }

      const isBullet = pullTrigger(shooterId, targetId);

      checkGameOver();

      if (!draft.gameOver) {
        if (shooterId === targetId && !isBullet) {
          addLog(`✨ ${shooter.name} gets an extra turn for surviving a self-shot!`, 'success');
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

      addLog(`🃏 ${player.name} uses ${card.name}${playerId !== targetId ? ` on ${target.name}` : ''}!`, 'info');

      let extraTurnId: number | undefined;

      switch (card.type) {
        case 'Shield': target.statuses.shield = true; break;
        case 'Dodge': target.statuses.dodge = true; break;
        case 'Reverse Fate': target.statuses.reverseFate = true; break;
        case 'Iron Skin': target.statuses.ironSkin = true; break;
        case 'Second Chance': target.statuses.secondChance = true; break;
        case 'Mirror Shield': target.statuses.mirrorShield = true; break;
        
        case 'Mark Target': target.statuses.marked = true; break;
        case 'Target Lock': target.statuses.targetLock = true; break;
        case 'Execute': 
          if (target.hp === 1) { addLog(`💀 ${target.name} was Executed!`, 'danger'); target.hp = 0; target.isAlive = false; }
          else { addLog(`❌ Execute failed, ${target.name} has too much HP.`, 'normal'); }
          break;
        
        case 'Peek Chamber': player.statuses.peeked = true; break;
        case 'Shuffle Chamber': draft.revolver = generateRevolver(); draft.currentChamber = 0; addLog(`🔄 Chamber shuffled!`, 'info'); break;
        case 'Swap Turn': extraTurnId = targetId; break;
        case 'Turn Skip': target.statuses.turnSkip = true; break;
        case 'Steal Card': 
          if (target.cards.length > 0) {
            const stolen = target.cards.splice(Math.floor(Math.random() * target.cards.length), 1)[0];
            player.cards.push(stolen);
            addLog(`😈 ${player.name} stole a card from ${target.name}!`, 'success');
          }
          break;

        case 'Add Bullet':
          const emptyIdx = draft.revolver.findIndex((b, i) => !b && i >= draft.currentChamber);
          if (emptyIdx !== -1) { draft.revolver[emptyIdx] = true; addLog(`🔫 A bullet was added!`, 'danger'); }
          break;
        case 'Remove Bullet':
          const bulletIdx = draft.revolver.findIndex((b, i) => b && i >= draft.currentChamber);
          if (bulletIdx !== -1) { draft.revolver[bulletIdx] = false; addLog(`😮‍💨 A bullet was removed!`, 'success'); }
          break;
        case 'Lock Chamber': draft.revolver[draft.currentChamber] = true; addLog(`💀 Next shot is LOCKED!`, 'danger'); break;
        case 'Safe Chamber': draft.revolver[draft.currentChamber] = false; addLog(`🛡️ Next shot is SAFE!`, 'success'); break;

        case 'Force Shoot':
          addLog(`🎯 ${target.name} is forced to shoot themselves!`, 'danger');
          pullTrigger(targetId, targetId);
          break;
        case 'Double Fire':
          addLog(`🎯 ${target.name} is forced to shoot themselves TWICE!`, 'danger');
          const isB1 = pullTrigger(targetId, targetId);
          if (target.isAlive) { checkReload(); pullTrigger(targetId, targetId); }
          break;
      }

      checkGameOver();
      if (!draft.gameOver && !['Force Shoot', 'Double Fire'].includes(card.type)) {
        // Using a card doesn't end turn unless it's an attack that pulls trigger
        // Actually, let's make using a card NOT end turn, so you can combo.
        // Wait, if it doesn't end turn, player can spam. Let's keep it ending turn for now, except for peek.
        if (card.type === 'Peek Chamber') {
          // don't end turn
        } else {
          nextTurn(extraTurnId);
        }
      } else if (!draft.gameOver) {
        nextTurn(extraTurnId);
      }
      break;
    }
  }

  return draft;
};

export const needsTarget = (type: CardType) => [
  'Force Shoot', 'Double Fire', 'Mark Target', 'Swap Turn', 'Steal Card', 'Turn Skip', 
  'Execute', 'Chain Shot', 'Target Lock', 'Mirror Shield'
].includes(type);

