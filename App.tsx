
import React, { useState, useMemo } from 'react';
import { Player, UnitStats, Position, GameState } from './types';
import { BOARD_WIDTH, BOARD_HEIGHT, CASTLE_MAX_HP, FIREBALL_ATK, FIREBALL_MAX_COUNT, UNIT_TEMPLATES } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
    blueCastleHp: CASTLE_MAX_HP,
    redCastleHp: CASTLE_MAX_HP,
    currentPlayer: Player.BLUE,
    selectedPos: null,
    validMoves: [],
    fireballCount: { [Player.BLUE]: FIREBALL_MAX_COUNT, [Player.RED]: FIREBALL_MAX_COUNT },
    elixir: { [Player.BLUE]: 5, [Player.RED]: 5 },
    winner: null,
    summonMode: null,
    fireballMode: false,
  }));

  const [fireballAnim, setFireballAnim] = useState<{ active: boolean; targetX: number; targetY: number | 'castle-top' | 'castle-bottom' }>({ active: false, targetX: 0, targetY: 0 });
  const [attackingPos, setAttackingPos] = useState<Position | null>(null);
  const [damagedPos, setDamagedPos] = useState<Position | null>(null);

  // 필드 위에 실제 존재하는 나무 위치 (장애물 역할이 아닌 시각적 요소)
  const fieldTrees = useMemo(() => {
    const trees: { x: number, y: number, icon: string, scale: number, rotation: number }[] = [];
    const used = new Set();
    // 7x7 필드에 약 8개의 나무 배치
    while (trees.length < 8) {
      const tx = Math.floor(Math.random() * BOARD_WIDTH);
      const ty = Math.floor(Math.random() * (BOARD_HEIGHT - 4)) + 2; // 성 주변 제외
      const key = `${tx}-${ty}`;
      if (!used.has(key)) {
        trees.push({ 
          x: tx, 
          y: ty, 
          icon: Math.random() > 0.5 ? '🌳' : '🌲',
          scale: 0.8 + Math.random() * 0.4,
          rotation: Math.random() * 20 - 10
        });
        used.add(key);
      }
    }
    return trees;
  }, []);

  const getValidMoves = (pos: Position, unit: UnitStats): Position[] => {
    const moves: Position[] = [];
    const directions = [
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }
    ];

    directions.forEach(dir => {
      for (let dist = 1; dist <= unit.moveRange; dist++) {
        const nx = pos.x + dir.dx * dist;
        const ny = pos.y + dir.dy * dist;
        if (nx >= 0 && nx < BOARD_WIDTH && ny >= 0 && ny < BOARD_HEIGHT) {
          const target = gameState.board[ny][nx];
          if (!target) {
            moves.push({ x: nx, y: ny });
          } else {
            // 공중 유닛 상성 로직: 
            // 1. 공중 유닛(Valkyrie)은 지상/공중 모두 공격 가능
            // 2. 지상 유닛은 공중 유닛을 공격할 수 없음
            const canAttack = (
              target.owner !== unit.owner && 
              !unit.onlyCastle && 
              (unit.isAir || !target.isAir)
            );
            if (canAttack) moves.push({ x: nx, y: ny });
            break;
          }
        } else break;
      }
    });
    return moves;
  };

  const executeFireball = (target: { x?: number, y?: number, castle?: Player }) => {
    if (!gameState.fireballMode) return;
    
    setFireballAnim({ 
      active: true, 
      targetX: target.x !== undefined ? target.x : 3, 
      targetY: target.castle ? (target.castle === Player.RED ? 'castle-top' : 'castle-bottom') : (target.y !== undefined ? target.y : 0) 
    });

    setTimeout(() => {
      setGameState(prev => {
        const newBoard = prev.board.map(r => r.map(u => u ? {...u} : null));
        let newRedHp = prev.redCastleHp;
        let newBlueHp = prev.blueCastleHp;

        if (target.castle) {
          if (target.castle === Player.RED) newRedHp = Math.max(0, newRedHp - FIREBALL_ATK);
          else newBlueHp = Math.max(0, newBlueHp - FIREBALL_ATK);
        } else if (target.x !== undefined && target.y !== undefined) {
          const unit = newBoard[target.y][target.x];
          if (unit) {
            unit.hp -= FIREBALL_ATK;
            if (unit.hp <= 0) newBoard[target.y][target.x] = null;
          }
        }

        const nextP = prev.currentPlayer === Player.BLUE ? Player.RED : Player.BLUE;
        return {
          ...prev,
          board: newBoard,
          redCastleHp: newRedHp,
          blueCastleHp: newBlueHp,
          fireballCount: { ...prev.fireballCount, [prev.currentPlayer]: prev.fireballCount[prev.currentPlayer] - 1 },
          fireballMode: false,
          winner: newRedHp <= 0 ? Player.BLUE : (newBlueHp <= 0 ? Player.RED : null),
          currentPlayer: nextP,
          elixir: { ...prev.elixir, [nextP]: Math.min(10, prev.elixir[nextP] + 1) }
        };
      });
      setFireballAnim(prev => ({ ...prev, active: false }));
    }, 600);
  };

  const handleSquareClick = (x: number, y: number) => {
    if (gameState.winner) return;

    if (gameState.fireballMode) {
      executeFireball({ x, y });
      return;
    }

    if (gameState.summonMode) {
      const isCorrectRow = gameState.currentPlayer === Player.BLUE ? y === BOARD_HEIGHT - 1 : y === 0;
      const template = UNIT_TEMPLATES.find(u => u.name === gameState.summonMode)!;
      if (isCorrectRow && !gameState.board[y][x] && gameState.elixir[gameState.currentPlayer] >= template.cost) {
        const newUnit: UnitStats = { ...template, id: `${Date.now()}`, owner: gameState.currentPlayer, hp: template.maxHp };
        setGameState(prev => {
          const nextPlayer = prev.currentPlayer === Player.BLUE ? Player.RED : Player.BLUE;
          const updatedElixir = { ...prev.elixir, [prev.currentPlayer]: prev.elixir[prev.currentPlayer] - template.cost };
          const newBoard = prev.board.map(r => [...r]);
          newBoard[y][x] = newUnit;
          return { ...prev, board: newBoard, summonMode: null, elixir: { ...updatedElixir, [nextPlayer]: Math.min(10, updatedElixir[nextPlayer] + 1) }, currentPlayer: nextPlayer };
        });
      }
      return;
    }

    const unit = gameState.board[y][x];
    if (gameState.selectedPos) {
      const move = gameState.validMoves.find(m => m.x === x && m.y === y);
      if (move) {
        const newBoard = gameState.board.map(r => [...r]);
        const attacker = newBoard[gameState.selectedPos.y][gameState.selectedPos.x]!;
        const defender = newBoard[y][x];

        if (defender) {
          setAttackingPos(gameState.selectedPos);
          setDamagedPos({ x, y });
          setTimeout(() => {
            defender.hp -= attacker.atk;
            if (defender.hp <= 0) { newBoard[y][x] = attacker; newBoard[gameState.selectedPos!.y][gameState.selectedPos!.x] = null; }
            setGameState(prev => {
              const nextP = prev.currentPlayer === Player.BLUE ? Player.RED : Player.BLUE;
              return { ...prev, board: newBoard, selectedPos: null, validMoves: [], currentPlayer: nextP, elixir: { ...prev.elixir, [nextP]: Math.min(10, prev.elixir[nextP] + 1) } };
            });
            setAttackingPos(null); setDamagedPos(null);
          }, 400);
        } else {
          newBoard[y][x] = attacker;
          newBoard[gameState.selectedPos.y][gameState.selectedPos.x] = null;
          setGameState(prev => {
            const nextP = prev.currentPlayer === Player.BLUE ? Player.RED : Player.BLUE;
            return { ...prev, board: newBoard, selectedPos: null, validMoves: [], currentPlayer: nextP, elixir: { ...prev.elixir, [nextP]: Math.min(10, prev.elixir[nextP] + 1) } };
          });
        }
        return;
      }
    }

    if (unit && unit.owner === gameState.currentPlayer) {
      setGameState(prev => ({ ...prev, selectedPos: { x, y }, validMoves: getValidMoves({ x, y }, unit), fireballMode: false }));
    } else {
      setGameState(prev => ({ ...prev, selectedPos: null, validMoves: [] }));
    }
  };

  const handleCastleClick = (owner: Player) => {
    if (gameState.fireballMode) {
      executeFireball({ castle: owner });
      return;
    }
    if (!gameState.selectedPos) return;
    const unit = gameState.board[gameState.selectedPos.y][gameState.selectedPos.x]!;
    const isAdjacent = (owner === Player.RED && gameState.selectedPos.y === 0) || (owner === Player.BLUE && gameState.selectedPos.y === BOARD_HEIGHT - 1);
    if (isAdjacent && unit.owner !== owner) {
      setAttackingPos(gameState.selectedPos);
      setTimeout(() => {
        setGameState(prev => {
          const dmg = unit.atk;
          const nr = owner === Player.RED ? Math.max(0, prev.redCastleHp - dmg) : prev.redCastleHp;
          const nb = owner === Player.BLUE ? Math.max(0, prev.blueCastleHp - dmg) : prev.blueCastleHp;
          const nextP = prev.currentPlayer === Player.BLUE ? Player.RED : Player.BLUE;
          return { ...prev, redCastleHp: nr, blueCastleHp: nb, winner: nr <= 0 ? Player.BLUE : (nb <= 0 ? Player.RED : null), selectedPos: null, validMoves: [], currentPlayer: nextP, elixir: { ...prev.elixir, [nextP]: Math.min(10, prev.elixir[nextP] + 1) } };
        });
        setAttackingPos(null);
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1a0a] text-white flex flex-col items-center p-4 font-sans select-none overflow-hidden relative">
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]"></div>
      
      {fireballAnim.active && (
        <div className="fixed z-[100] w-12 h-12 bg-orange-600 rounded-full shadow-[0_0_80px_orange] animate-bounce"
          style={{ 
            left: typeof fireballAnim.targetX === 'number' ? `calc(50% + ${(fireballAnim.targetX - 3) * 85}px)` : '50%',
            top: fireballAnim.targetY === 'castle-top' ? '120px' : fireballAnim.targetY === 'castle-bottom' ? 'calc(100% - 180px)' : `calc(230px + ${Number(fireballAnim.targetY) * 90}px)`,
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
          <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-50"></div>
        </div>
      )}

      <header className="mb-8 text-center z-10">
        <h1 className="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-b from-green-200 to-emerald-700 drop-shadow-lg tracking-tighter">FOREST SIEGE</h1>
        <p className="text-green-500 font-bold tracking-[0.4em] text-[12px] uppercase mt-2">The Ultimate Castle Conquest</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-12 items-center justify-center w-full max-w-[1300px] z-10">
        
        {/* Blue Player UI */}
        <div className="flex flex-col gap-4 w-72">
          <div className={`p-6 rounded-[2.5rem] border-4 transition-all duration-500 backdrop-blur-md ${gameState.currentPlayer === Player.BLUE ? 'border-cyan-400 bg-cyan-900/30 shadow-[0_0_30px_rgba(34,211,238,0.3)]' : 'border-slate-800 bg-slate-900/20 grayscale opacity-40'}`}>
            <h2 className="text-2xl font-black text-cyan-300 mb-4 flex items-center justify-center gap-2">🛡️ BLUE REALM</h2>
            <div className="space-y-4">
               <div className="flex items-center gap-3 bg-indigo-950/50 p-3 rounded-2xl border border-indigo-400/20">
                 <span className="text-2xl animate-pulse">💧</span>
                 <div className="flex-grow h-3 bg-black/50 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-400 shadow-[0_0_10px_#818cf8]" style={{ width: `${gameState.elixir[Player.BLUE]*10}%` }} />
                 </div>
                 <span className="text-sm font-black">{gameState.elixir[Player.BLUE]}</span>
               </div>
               <button onClick={() => setGameState(p => ({...p, fireballMode: !p.fireballMode, selectedPos: null, summonMode: null}))}
                 disabled={gameState.currentPlayer !== Player.BLUE || gameState.fireballCount[Player.BLUE] <= 0}
                 className={`w-full py-4 rounded-2xl font-black transition-all text-lg shadow-xl ${gameState.fireballMode && gameState.currentPlayer === Player.BLUE ? 'bg-orange-500 ring-4 ring-yellow-400 scale-105' : 'bg-orange-700 hover:bg-orange-600'} disabled:opacity-30 disabled:grayscale`}>
                 🔥 FIREBALL ({gameState.fireballCount[Player.BLUE]})
               </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 mt-2">
            {UNIT_TEMPLATES.map(u => (
              <button key={u.name} onClick={() => setGameState(p => ({...p, summonMode: u.name, fireballMode: false, selectedPos: null}))}
                disabled={gameState.elixir[Player.BLUE] < u.cost || gameState.currentPlayer !== Player.BLUE}
                className={`flex items-center gap-4 p-3 rounded-2xl border-2 transition-all group ${gameState.summonMode === u.name && gameState.currentPlayer === Player.BLUE ? 'border-yellow-400 bg-yellow-400/20 scale-105 shadow-lg' : 'bg-black/40 border-white/5 hover:border-cyan-400/50'} disabled:opacity-20`}>
                <span className={`text-4xl transition-transform group-hover:scale-110 ${u.isAir ? 'animate-bounce' : ''}`}>{u.icon}</span>
                <div className="text-left font-black leading-tight">
                   <div className="text-sm text-white group-hover:text-cyan-300 transition-colors">{u.name}</div>
                   <div className="text-[11px] text-purple-400 mt-1 uppercase tracking-tighter">{u.cost} Elixir</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Battlefield with Castles */}
        <div className="flex flex-col items-center">
          {/* Red Castle (Top) */}
          <div onClick={() => handleCastleClick(Player.RED)} 
            className={`w-[450px] sm:w-[550px] md:w-[650px] h-36 flex flex-col items-center justify-end pb-4 rounded-t-[4rem] border-t-8 border-x-8 transition-all cursor-pointer relative
            ${gameState.currentPlayer === Player.BLUE && gameState.selectedPos?.y === 0 ? 'border-yellow-400 bg-red-500/10 shadow-[0_-20px_50px_rgba(239,68,68,0.2)] animate-pulse' : 'border-red-900/60 bg-red-950/30'}
            ${gameState.fireballMode && gameState.currentPlayer === Player.BLUE ? 'ring-8 ring-orange-500 z-50' : ''}`}>
             <div className="absolute top-4 w-[70%] h-5 bg-black/60 rounded-full border border-white/10 overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-rose-700 to-rose-500 transition-all duration-700" style={{ width: `${(gameState.redCastleHp/CASTLE_MAX_HP)*100}%` }} />
             </div>
             <div className="flex gap-4 items-end mb-2">
                <span className="text-7xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform">🏰</span>
             </div>
             <span className="text-[11px] font-black text-rose-400 uppercase tracking-[0.5em] drop-shadow-md">Crimson Stronghold ({gameState.redCastleHp})</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 bg-green-950/40 p-4 border-x-8 border-green-900/40 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.3)_100%)]"></div>
            {gameState.board.map((row, y) => row.map((unit, x) => {
              const isSelected = gameState.selectedPos?.x === x && gameState.selectedPos?.y === y;
              const isValid = gameState.validMoves.some(m => m.x === x && m.y === y);
              const tree = fieldTrees.find(t => t.x === x && t.y === y);
              const isAttacking = attackingPos?.x === x && attackingPos?.y === y;
              const isDamaged = damagedPos?.x === x && damagedPos?.y === y;
              const isSummonable = gameState.summonMode && ((gameState.currentPlayer === Player.BLUE && y === BOARD_HEIGHT-1) || (gameState.currentPlayer === Player.RED && y === 0)) && !unit;

              return (
                <div key={`${x}-${y}`} onClick={() => handleSquareClick(x, y)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center relative transition-all rounded-xl border border-white/5
                    ${(x+y)%2 === 0 ? 'bg-green-800/20' : 'bg-black/30'}
                    ${isSelected ? 'ring-4 ring-yellow-400 bg-yellow-400/20 z-20 scale-110 shadow-2xl' : ''}
                    ${isValid ? 'ring-4 ring-emerald-400 bg-emerald-400/40 cursor-crosshair z-10 animate-pulse' : ''}
                    ${isSummonable ? 'ring-4 ring-cyan-400 bg-cyan-400/30 z-10' : ''}
                    ${isDamaged ? 'bg-red-600/60 animate-bounce ring-4 ring-red-400' : ''}
                    ${gameState.fireballMode ? 'hover:ring-4 hover:ring-orange-500 cursor-pointer z-30' : ''}
                    hover:bg-white/10
                  `}>
                  {tree && !unit && (
                    <span className="absolute opacity-60 text-3xl pointer-events-none select-none drop-shadow-md"
                      style={{ transform: `scale(${tree.scale}) rotate(${tree.rotation}deg)` }}>
                      {tree.icon}
                    </span>
                  )}
                  {unit && (
                    <div className={`flex flex-col items-center transform transition-all duration-300 ${unit.owner === Player.RED ? 'rotate-180' : ''} ${isAttacking ? 'scale-150 -translate-y-6 brightness-125' : ''}`}>
                       <span className="absolute -top-7 text-[10px] bg-black/90 px-2 py-0.5 rounded-full border border-white/20 font-black shadow-lg z-10 text-white">
                         {unit.hp}
                       </span>
                       <span className={`text-5xl drop-shadow-[0_5px_15px_rgba(0,0,0,0.6)] ${unit.isAir ? 'animate-bounce-slow' : ''}`}>
                         {unit.icon}
                       </span>
                       <div className="w-12 h-1.5 bg-black/50 rounded-full mt-2 border border-white/10 overflow-hidden">
                         <div className={`h-full transition-all duration-500 ${unit.owner === Player.RED ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]'}`} 
                           style={{ width: `${(unit.hp/unit.maxHp)*100}%` }} />
                       </div>
                    </div>
                  )}
                </div>
              );
            }))}
          </div>

          {/* Blue Castle (Bottom) */}
          <div onClick={() => handleCastleClick(Player.BLUE)}
            className={`w-[450px] sm:w-[550px] md:w-[650px] h-36 flex flex-col items-center justify-start pt-4 rounded-b-[4rem] border-b-8 border-x-8 transition-all cursor-pointer relative
            ${gameState.currentPlayer === Player.RED && gameState.selectedPos?.y === BOARD_HEIGHT-1 ? 'border-yellow-400 bg-cyan-500/10 shadow-[0_20px_50px_rgba(34,211,238,0.2)] animate-pulse' : 'border-cyan-900/60 bg-cyan-950/30'}
            ${gameState.fireballMode && gameState.currentPlayer === Player.RED ? 'ring-8 ring-orange-500 z-50' : ''}`}>
             <span className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.5em] mb-3 drop-shadow-md">Azure Sanctum ({gameState.blueCastleHp})</span>
             <div className="flex gap-4 items-start mb-4">
                <span className="text-7xl drop-shadow-[0_-10px_10px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform">🏰</span>
             </div>
             <div className="absolute bottom-4 w-[70%] h-5 bg-black/60 rounded-full border border-white/10 overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-cyan-700 to-cyan-500 transition-all duration-700" style={{ width: `${(gameState.blueCastleHp/CASTLE_MAX_HP)*100}%` }} />
             </div>
          </div>
        </div>

        {/* Red Player UI */}
        <div className="flex flex-col gap-4 w-72">
          <div className={`p-6 rounded-[2.5rem] border-4 transition-all duration-500 backdrop-blur-md ${gameState.currentPlayer === Player.RED ? 'border-rose-500 bg-rose-950/40 shadow-[0_0_30px_rgba(244,63,94,0.3)]' : 'border-slate-800 bg-slate-900/20 grayscale opacity-40'}`}>
            <h2 className="text-2xl font-black text-rose-300 mb-4 flex items-center justify-center gap-2">⚔️ RED REALM</h2>
            <div className="space-y-4">
               <div className="flex items-center gap-3 bg-purple-900/50 p-3 rounded-2xl border border-purple-400/20">
                 <span className="text-2xl animate-pulse">💧</span>
                 <div className="flex-grow h-3 bg-black/50 rounded-full overflow-hidden">
                   <div className="h-full bg-purple-400 shadow-[0_0_10px_#c084fc]" style={{ width: `${gameState.elixir[Player.RED]*10}%` }} />
                 </div>
                 <span className="text-sm font-black">{gameState.elixir[Player.RED]}</span>
               </div>
               <button onClick={() => setGameState(p => ({...p, fireballMode: !p.fireballMode, selectedPos: null, summonMode: null}))}
                 disabled={gameState.currentPlayer !== Player.RED || gameState.fireballCount[Player.RED] <= 0}
                 className={`w-full py-4 rounded-2xl font-black transition-all text-lg shadow-xl ${gameState.fireballMode && gameState.currentPlayer === Player.RED ? 'bg-orange-500 ring-4 ring-yellow-400 scale-105' : 'bg-orange-700 hover:bg-orange-600'} disabled:opacity-30 disabled:grayscale`}>
                 🔥 FIREBALL ({gameState.fireballCount[Player.RED]})
               </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 mt-2">
            {UNIT_TEMPLATES.map(u => (
              <button key={u.name} onClick={() => setGameState(p => ({...p, summonMode: u.name, fireballMode: false, selectedPos: null}))}
                disabled={gameState.elixir[Player.RED] < u.cost || gameState.currentPlayer !== Player.RED}
                className={`flex items-center gap-4 p-3 rounded-2xl border-2 transition-all group ${gameState.summonMode === u.name && gameState.currentPlayer === Player.RED ? 'border-yellow-400 bg-yellow-400/20 scale-105 shadow-lg' : 'bg-black/40 border-white/5 hover:border-rose-400/50'} disabled:opacity-20`}>
                <span className={`text-4xl transition-transform group-hover:scale-110 ${u.isAir ? 'animate-bounce' : ''}`}>{u.icon}</span>
                <div className="text-left font-black leading-tight">
                   <div className="text-sm text-white group-hover:text-rose-300 transition-colors">{u.name}</div>
                   <div className="text-[11px] text-purple-400 mt-1 uppercase tracking-tighter">{u.cost} Elixir</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {gameState.winner && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
           <div className={`text-[180px] mb-8 drop-shadow-[0_0_50px_currentColor] ${gameState.winner === Player.BLUE ? 'text-cyan-400' : 'text-rose-500'}`}>👑</div>
           <h2 className={`text-9xl font-black mb-12 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${gameState.winner === Player.BLUE ? 'from-cyan-300 to-indigo-600' : 'from-rose-300 to-red-800'}`}>
             {gameState.winner} VICTORIOUS
           </h2>
           <button onClick={() => window.location.reload()} 
             className="px-24 py-10 bg-gradient-to-r from-emerald-500 to-green-700 text-white font-black text-4xl rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_80px_rgba(16,185,129,0.4)] border-4 border-white/20">
             RECLAIM THE THRONE
           </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s infinite ease-in-out; }
      `}} />
    </div>
  );
};

export default App;
