import React, { useReducer, useState, useEffect } from 'react';
import { Shield, Wind, RefreshCcw, Crosshair, ChevronsRight, Target, ArrowRightLeft, Eye, Shuffle, Skull, User, Bot, Play } from 'lucide-react';
import { gameReducer, createInitialState, needsTarget } from './gameLogic';
import { Card, CardType, Player } from './types';

const getCardIcon = (type: CardType) => {
  switch(type) {
    case 'Shield': return <Shield className="w-4 h-4" />;
    case 'Dodge': return <Wind className="w-4 h-4" />;
    case 'Reverse Fate': return <RefreshCcw className="w-4 h-4" />;
    case 'Force Shoot': return <Crosshair className="w-4 h-4" />;
    case 'Double Fire': return <ChevronsRight className="w-4 h-4" />;
    case 'Mark Target': return <Target className="w-4 h-4" />;
    case 'Swap Turn': return <ArrowRightLeft className="w-4 h-4" />;
    case 'Peek Chamber': return <Eye className="w-4 h-4" />;
    case 'Shuffle Chamber': return <Shuffle className="w-4 h-4" />;
  }
};

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const [selectedAction, setSelectedAction] = useState<'SHOOT' | 'CARD' | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const humanPlayer = state.players[0];
  const isHumanTurn = state.currentTurn === 0 && !state.gameOver;

  useEffect(() => {
    if (state.gameOver) return;
    if (state.players[state.currentTurn].isHuman) return;

    const timer = setTimeout(() => {
      const me = state.players[state.currentTurn];
      const aliveOpponents = state.players.filter(p => p.isAlive && p.id !== me.id);
      if (aliveOpponents.length === 0) return;

      const randomTarget = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];
      const marked = aliveOpponents.find(p => p.statuses.marked);
      const finalTarget = marked ? marked : randomTarget;

      if (me.statuses.peeked) {
        if (!state.revolver[state.currentChamber]) {
          dispatch({ type: 'SHOOT', shooterId: me.id, targetId: me.id });
          return;
        } else {
          dispatch({ type: 'SHOOT', shooterId: me.id, targetId: finalTarget.id });
          return;
        }
      }

      if (me.cards.length > 0 && Math.random() > 0.4) {
        const card = me.cards[0];
        let cardTargetId = me.id;
        if (needsTarget(card.type)) {
          cardTargetId = finalTarget.id;
        }
        dispatch({ type: 'USE_CARD', playerId: me.id, targetId: cardTargetId, card });
        return;
      }

      dispatch({ type: 'SHOOT', shooterId: me.id, targetId: finalTarget.id });
    }, 1500);

    return () => clearTimeout(timer);
  }, [state.currentTurn, state.gameOver, state.players, state.revolver, state.currentChamber]);

  const handlePlayerClick = (targetId: number) => {
    if (!isHumanTurn) return;
    if (selectedAction === 'SHOOT') {
      dispatch({ type: 'SHOOT', shooterId: 0, targetId });
      setSelectedAction(null);
    } else if (selectedAction === 'CARD' && selectedCard) {
      dispatch({ type: 'USE_CARD', playerId: 0, targetId, card: selectedCard });
      setSelectedAction(null);
      setSelectedCard(null);
    }
  };

  const handleCardClick = (card: Card) => {
    if (!isHumanTurn) return;
    if (needsTarget(card.type)) {
      setSelectedAction('CARD');
      setSelectedCard(card);
    } else {
      dispatch({ type: 'USE_CARD', playerId: 0, targetId: 0, card });
    }
  };

  const cancelAction = () => {
    setSelectedAction(null);
    setSelectedCard(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative">
      
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl font-bold tracking-widest text-emerald-500 uppercase">Roulette Table</h1>
        <p className="text-zinc-500 text-sm">Last Mind Standing</p>
      </div>
      
      <div className="absolute top-4 right-4 z-10 text-right">
        <p className="text-zinc-400">Round <span className="text-white font-bold">{state.round}</span></p>
        <p className="text-zinc-400">Chamber <span className="text-white font-bold">{state.currentChamber + 1}/6</span></p>
      </div>

      {/* Game Table Area */}
      <div className="relative w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] bg-emerald-900 rounded-full border-[12px] border-amber-900 shadow-2xl flex items-center justify-center my-8">
        
        {/* Center Info / Logs */}
        <div className="absolute w-40 h-40 sm:w-64 sm:h-64 bg-emerald-950 rounded-full flex flex-col items-center justify-center shadow-inner border-4 border-emerald-900 p-4 text-center overflow-hidden">
          {state.gameOver ? (
            <div className="flex flex-col items-center animate-pulse">
              <Skull className="w-12 h-12 text-red-500 mb-2" />
              <h2 className="text-xl font-bold text-white">GAME OVER</h2>
              <p className="text-sm text-zinc-300 mt-1">{state.winner ? `${state.winner.name} Wins!` : 'Draw'}</p>
              <button 
                onClick={() => dispatch({ type: 'RESET_GAME' })}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-bold transition-colors"
              >
                Play Again
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-end pb-2">
              <div className="flex-1 overflow-y-auto flex flex-col-reverse space-y-reverse space-y-1 scrollbar-hide text-xs sm:text-sm">
                {state.logs.map((log, i) => (
                  <p key={i} style={{ opacity: Math.max(0.2, 1 - i * 0.2) }} className={`${i === 0 ? 'text-white font-medium' : 'text-zinc-400'}`}>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Players */}
        {state.players.map((player, idx) => {
          const positions = [
            'bottom-[-40px] left-1/2 -translate-x-1/2', // 0: Human (Bottom)
            'left-[-40px] top-1/2 -translate-y-1/2',    // 1: AI 1 (Left)
            'top-[-40px] left-1/2 -translate-x-1/2',    // 2: AI 2 (Top)
            'right-[-40px] top-1/2 -translate-y-1/2',   // 3: AI 3 (Right)
          ];
          
          const isTurn = state.currentTurn === player.id;
          const isTargetable = selectedAction !== null && player.isAlive;
          
          return (
            <div 
              key={player.id} 
              className={`absolute ${positions[idx]} flex flex-col items-center transition-all duration-300 ${isTargetable ? 'cursor-pointer hover:scale-110' : ''}`}
              onClick={() => handlePlayerClick(player.id)}
            >
              <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-4 
                ${!player.isAlive ? 'bg-zinc-800 border-zinc-900 opacity-50' : 
                  isTurn ? 'bg-zinc-800 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 
                  isTargetable ? 'bg-zinc-800 border-amber-500 animate-pulse' : 'bg-zinc-800 border-zinc-700'}`}
              >
                {!player.isAlive ? <Skull className="w-8 h-8 text-zinc-600" /> : 
                 player.isHuman ? <User className="w-8 h-8 text-zinc-300" /> : <Bot className="w-8 h-8 text-zinc-300" />}
                
                {/* Status Icons */}
                <div className="absolute -top-2 -right-2 flex space-x-1">
                  {player.statuses.shield && <div className="bg-blue-500 p-1 rounded-full"><Shield className="w-3 h-3 text-white" /></div>}
                  {player.statuses.dodge && <div className="bg-teal-500 p-1 rounded-full"><Wind className="w-3 h-3 text-white" /></div>}
                  {player.statuses.reverseFate && <div className="bg-purple-500 p-1 rounded-full"><RefreshCcw className="w-3 h-3 text-white" /></div>}
                  {player.statuses.marked && <div className="bg-red-500 p-1 rounded-full"><Target className="w-3 h-3 text-white" /></div>}
                </div>
                
                {/* Card Count for AI */}
                {!player.isHuman && player.isAlive && (
                  <div className="absolute -bottom-2 bg-zinc-900 border border-zinc-700 text-xs px-2 py-0.5 rounded-full">
                    {player.cards.length} 🃏
                  </div>
                )}
              </div>
              <div className={`mt-2 text-sm font-bold ${isTurn ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {player.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Human Controls & Cards */}
      <div className="w-full max-w-4xl mt-auto flex flex-col items-center space-y-4">
        
        {/* Action Prompt */}
        <div className="h-8 flex items-center justify-center">
          {isHumanTurn && !selectedAction && (
            <p className="text-emerald-400 font-medium animate-pulse">Your turn. Choose an action.</p>
          )}
          {selectedAction === 'SHOOT' && (
            <div className="flex items-center space-x-4">
              <p className="text-amber-400 font-medium">Select a target to shoot...</p>
              <button onClick={cancelAction} className="text-xs text-zinc-400 hover:text-white underline">Cancel</button>
            </div>
          )}
          {selectedAction === 'CARD' && (
            <div className="flex items-center space-x-4">
              <p className="text-amber-400 font-medium">Select a target for {selectedCard?.name}...</p>
              <button onClick={cancelAction} className="text-xs text-zinc-400 hover:text-white underline">Cancel</button>
            </div>
          )}
        </div>

        {/* Main Actions */}
        <div className="flex space-x-4">
          <button 
            disabled={!isHumanTurn || selectedAction !== null}
            onClick={() => dispatch({ type: 'SHOOT', shooterId: 0, targetId: 0 })}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded-lg font-bold flex items-center space-x-2 transition-colors"
          >
            <Crosshair className="w-5 h-5 text-red-400" />
            <span>Shoot Self</span>
          </button>
          <button 
            disabled={!isHumanTurn || selectedAction !== null}
            onClick={() => setSelectedAction('SHOOT')}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded-lg font-bold flex items-center space-x-2 transition-colors"
          >
            <Target className="w-5 h-5 text-amber-400" />
            <span>Shoot Other</span>
          </button>
        </div>

        {/* Cards Hand */}
        <div className="w-full bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 min-h-[160px]">
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-3 font-bold">Your Hand</h3>
          <div className="flex flex-wrap gap-3 justify-center">
            {humanPlayer.cards.length === 0 && (
              <p className="text-zinc-600 text-sm italic py-4">No cards in hand.</p>
            )}
            {humanPlayer.cards.map(card => (
              <button
                key={card.id}
                disabled={!isHumanTurn || selectedAction !== null}
                onClick={() => handleCardClick(card)}
                className="w-32 h-40 bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex flex-col items-center text-center hover:-translate-y-2 hover:border-emerald-500 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-zinc-700 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="bg-zinc-900 p-2 rounded-full mb-2 text-emerald-400 border border-zinc-700">
                  {getCardIcon(card.type)}
                </div>
                <h4 className="font-bold text-sm mb-1 leading-tight">{card.name}</h4>
                <p className="text-[10px] text-zinc-400 leading-tight">{card.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Peek Info */}
        {humanPlayer.statuses.peeked && (
          <div className="fixed bottom-4 right-4 bg-zinc-900 border border-emerald-500/50 p-4 rounded-lg shadow-lg flex items-center space-x-3 animate-pulse">
            <Eye className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-xs text-zinc-400">Peek Result</p>
              <p className="font-bold text-white">
                Next chamber is: <span className={state.revolver[state.currentChamber] ? 'text-red-400' : 'text-emerald-400'}>
                  {state.revolver[state.currentChamber] ? 'BULLET 💀' : 'EMPTY 💨'}
                </span>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
