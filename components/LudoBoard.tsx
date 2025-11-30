import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlayerColor, Token } from '../types';
import { Trophy, Star, ChevronRight, Share2, Copy, Check, Users, X, Radio, Loader2 } from 'lucide-react';
// @ts-ignore
import { Peer } from 'peerjs';

// --- CONSTANTS ---
const BOARD_SIZE = 15;

// --- TYPES ---
type Coord = { r: number; c: number };

// --- PATH LOGIC ---
// Standard Ludo Path has 52 steps.
// Each player travels 51 steps on the global path (0-50) and then turns into Home.
const GLOBAL_PATH: Coord[] = [
  // Green Quadrant (0-12)
  {r:6,c:1}, {r:6,c:2}, {r:6,c:3}, {r:6,c:4}, {r:6,c:5}, // 0-4
  {r:5,c:6}, {r:4,c:6}, {r:3,c:6}, {r:2,c:6}, {r:1,c:6}, {r:0,c:6}, // 5-10
  {r:0,c:7}, {r:0,c:8}, // 11-12 (Red Turn is at 11, Skips 12)

  // Red Quadrant (13-25)
  {r:1,c:8}, {r:2,c:8}, {r:3,c:8}, {r:4,c:8}, {r:5,c:8}, // 13-17
  {r:6,c:9}, {r:6,c:10}, {r:6,c:11}, {r:6,c:12}, {r:6,c:13}, {r:6,c:14}, // 18-23
  {r:7,c:14}, {r:8,c:14}, // 24-25 (Blue Turn is at 24, Skips 25)

  // Blue Quadrant (26-38)
  {r:8,c:13}, {r:8,c:12}, {r:8,c:11}, {r:8,c:10}, {r:8,c:9}, // 26-30
  {r:9,c:8}, {r:10,c:8}, {r:11,c:8}, {r:12,c:8}, {r:13,c:8}, {r:14,c:8}, // 31-36
  {r:14,c:7}, {r:14,c:6}, // 37-38 (Yellow Turn is at 37, Skips 38)

  // Yellow Quadrant (39-51)
  {r:13,c:6}, {r:12,c:6}, {r:11,c:6}, {r:10,c:6}, {r:9,c:6}, // 39-43
  {r:8,c:5}, {r:8,c:4}, {r:8,c:3}, {r:8,c:2}, {r:8,c:1}, {r:8,c:0}, // 44-49
  {r:7,c:0}, {r:6,c:0} // 50-51 (Green Turn is at 50, Skips 51)
];

// Home Paths (6 steps including goal center)
const HOME_PATHS: Record<PlayerColor, Coord[]> = {
  [PlayerColor.GREEN]: [{r:7,c:1}, {r:7,c:2}, {r:7,c:3}, {r:7,c:4}, {r:7,c:5}, {r:7,c:6}], 
  [PlayerColor.RED]:   [{r:1,c:7}, {r:2,c:7}, {r:3,c:7}, {r:4,c:7}, {r:5,c:7}, {r:6,c:7}],
  [PlayerColor.BLUE]:  [{r:7,c:13}, {r:7,c:12}, {r:7,c:11}, {r:7,c:10}, {r:7,c:9}, {r:7,c:8}],
  [PlayerColor.YELLOW]:[{r:13,c:7}, {r:12,c:7}, {r:11,c:7}, {r:10,c:7}, {r:9,c:7}, {r:8,c:7}],
};

const SAFE_SPOTS = [
  {r:6,c:1}, {r:2,c:6}, {r:1,c:8}, {r:6,c:12}, 
  {r:8,c:13}, {r:12,c:8}, {r:13,c:6}, {r:8,c:2}
];

// Adjusted offsets for 52-step path (13 steps per quadrant)
const PATH_OFFSETS: Record<PlayerColor, number> = {
  [PlayerColor.GREEN]: 0,
  [PlayerColor.RED]: 13,
  [PlayerColor.BLUE]: 26,
  [PlayerColor.YELLOW]: 39,
};

// Aligned positions to match the center of visual dots in BaseArea
const BASE_SLOTS = [
    { top: '37.5%', left: '37.5%' }, // Top-Left
    { top: '37.5%', left: '62.5%' }, // Top-Right
    { top: '62.5%', left: '37.5%' }, // Bottom-Left
    { top: '62.5%', left: '62.5%' }  // Bottom-Right
];

const INITIAL_TOKENS: Record<PlayerColor, Token[]> = {
  [PlayerColor.GREEN]: [0, 1, 2, 3].map(id => ({ id, color: PlayerColor.GREEN, position: -1, isSafe: true })),
  [PlayerColor.RED]: [0, 1, 2, 3].map(id => ({ id, color: PlayerColor.RED, position: -1, isSafe: true })),
  [PlayerColor.BLUE]: [0, 1, 2, 3].map(id => ({ id, color: PlayerColor.BLUE, position: -1, isSafe: true })),
  [PlayerColor.YELLOW]: [0, 1, 2, 3].map(id => ({ id, color: PlayerColor.YELLOW, position: -1, isSafe: true })),
};

// --- MULTIPLAYER ACTION TYPES ---
type GameAction = 
  | { type: 'ROLL_DICE'; value: number }
  | { type: 'MOVE_TOKEN'; color: PlayerColor; tokenId: number }
  | { type: 'SYNC_STATE'; state: any };

// --- MAIN COMPONENT ---

export const LudoBoard: React.FC = () => {
  const [tokens, setTokens] = useState<Record<PlayerColor, Token[]>>(INITIAL_TOKENS);
  const [turn, setTurn] = useState<PlayerColor>(PlayerColor.GREEN);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [canMove, setCanMove] = useState(false);
  const [message, setMessage] = useState("Drag Dice to Start!");
  const [winner, setWinner] = useState<PlayerColor | null>(null);

  // Multiplayer State
  const [showInvite, setShowInvite] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPeerInit, setIsPeerInit] = useState(false);
  
  const peerRef = useRef<any>(null);
  const connRef = useRef<any[]>([]); // Array to support multiple connections (Host)

  // Audio Refs
  const tokenAudioRef = useRef<HTMLAudioElement | null>(null);

  const turnOrder = [PlayerColor.GREEN, PlayerColor.RED, PlayerColor.BLUE, PlayerColor.YELLOW];

  // --- MULTIPLAYER LOGIC ---
  
  useEffect(() => {
      // Init Audio
      tokenAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
      tokenAudioRef.current.volume = 0.6;
      tokenAudioRef.current.preload = "auto";

      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');

      // Initialize PeerJS
      const initPeer = async () => {
          if (isPeerInit) return;
          setIsPeerInit(true);

          let myId = room ? undefined : `PG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          // If room exists in URL, we are joining (random ID). If not, we are host (Fixed ID).
          
          const peer = new Peer(myId, {
            debug: 1
          });
          
          peerRef.current = peer;

          peer.on('open', (id: string) => {
              console.log('My Peer ID:', id);
              if (!room) {
                  setRoomCode(id); // Host sets the room code
                  setMessage("Room Created. Invite friends!");
              } else {
                  // Connect to Host
                  console.log('Connecting to host:', room);
                  const conn = peer.connect(room);
                  setupConnection(conn);
                  setRoomCode(room);
                  setMessage("Connecting to Room...");
              }
          });

          peer.on('connection', (conn: any) => {
              console.log('Incoming connection');
              setupConnection(conn);
              // Host sends current state to new joiner
              setTimeout(() => {
                 conn.send({
                     type: 'SYNC_STATE',
                     state: {
                         tokens, turn, diceValue, canMove, winner
                     }
                 });
              }, 500);
          });

          peer.on('error', (err: any) => {
              console.error('Peer Error:', err);
              setMessage("Connection Error. Try refreshing.");
          });
      };

      initPeer();

      return () => {
          if(peerRef.current) peerRef.current.destroy();
      }
      // eslint-disable-next-line
  }, []); // Run once on mount

  const setupConnection = (conn: any) => {
      conn.on('open', () => {
          console.log('Connected to:', conn.peer);
          connRef.current.push(conn);
          setIsConnected(true);
          setMessage("Connected to Game!");
      });

      conn.on('data', (data: GameAction) => {
          handleIncomingAction(data);
      });

      conn.on('close', () => {
          setMessage("Peer Disconnected");
          connRef.current = connRef.current.filter(c => c !== conn);
      });
  };

  const broadcast = (action: GameAction) => {
      connRef.current.forEach(conn => {
          if (conn.open) conn.send(action);
      });
  };

  const handleIncomingAction = (action: GameAction) => {
      console.log('Received Action:', action);
      
      switch (action.type) {
          case 'ROLL_DICE':
              // Simulate roll on this client
              setDiceValue(action.value);
              // Logic to check moves (duplicated from onDiceLanded)
              const playerTokens = tokens[turn]; // 'turn' might be stale if logic isn't perfect, but simplified for now
              const hasValidMove = playerTokens.some(t => {
                  if (t.position === -1) return action.value === 6; 
                  if (t.position === 99) return false; 
                  return t.position + action.value <= 56;
              });

              if (hasValidMove) {
                  setCanMove(true);
                  setMessage(`Move ${turn}!`);
              } else {
                  setMessage("No moves available.");
                  setTimeout(nextTurn, 1000); // This relies on synced nextTurn
              }
              break;

          case 'MOVE_TOKEN':
               // Execute move
               const pTokens = [...tokens[action.color]];
               const tIndex = pTokens.findIndex(t => t.id === action.tokenId);
               if (tIndex !== -1) {
                   const token = pTokens[tIndex];
                   
                   // Calculate new pos locally to ensure sync
                   let newVal = 0; // diceValue might be null if event order is weird, but we trust state
                   // However, for robust sync, we need the logic.
                   // Ideally, we run the exact same logic.
                   
                   playTokenSound();
                   
                   // We need to run the full move logic here to update state
                   // BUT, since we need `diceValue` which might be null locally if we didn't roll it?
                   // No, we setDiceValue in 'ROLL_DICE'.
                   
                   // Simplified: Trigger the move logic directly
                   executeMoveLogic(token, action.color);
               }
               break;

          case 'SYNC_STATE':
              setTokens(action.state.tokens);
              setTurn(action.state.turn);
              setDiceValue(action.state.diceValue);
              setCanMove(action.state.canMove);
              setWinner(action.state.winner);
              break;
      }
  };

  const playTokenSound = () => {
      if (tokenAudioRef.current) {
          tokenAudioRef.current.currentTime = 0;
          tokenAudioRef.current.play().catch(e => console.warn("Audio play failed", e));
      }
  };

  const handleInviteClick = () => {
      // Use existing room code if host
      if (roomCode) {
          const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
          setInviteUrl(url);
          setShowInvite(true);
          setIsCopied(false);
      }
  };

  const handleCopyLink = () => {
      navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  const nextTurn = useCallback(() => {
    let nextIndex = 0;
    if (diceValue !== 6) {
        const currentIndex = turnOrder.indexOf(turn);
        nextIndex = (currentIndex + 1) % 4;
        setTurn(turnOrder[nextIndex]);
    }
    setDiceValue(null);
    setCanMove(false);
    setMessage(`Player ${turnOrder[diceValue !== 6 ? nextIndex : turnOrder.indexOf(turn)]}'s turn`);
  }, [turn, diceValue]);

  // Callback when dice finishes rolling (Initiated by Local User)
  const onDiceLanded = (value: number) => {
      // Broadcast Roll
      broadcast({ type: 'ROLL_DICE', value });

      setDiceValue(value);
      setRolling(false);
      
      const playerTokens = tokens[turn];
      const hasValidMove = playerTokens.some(t => {
        if (t.position === -1) return value === 6; 
        if (t.position === 99) return false; 
        return t.position + value <= 56;
      });

      if (hasValidMove) {
        setCanMove(true);
        setMessage(`Move ${turn}!`);
      } else {
        setMessage("No moves available.");
        setTimeout(nextTurn, 1000);
      }
  };

  // Logic separate from click handler for reuse
  const executeMoveLogic = (token: Token, playerColor: PlayerColor) => {
      const playerTokens = [...tokens[playerColor]];
      const tokenIndex = playerTokens.findIndex(t => t.id === token.id);
      
      // We need the current dice value. If it was remote, it's in state.
      // If diceValue is null, something is wrong with sync.
      const moveValue = diceValue || 0; 
      
      let moveMade = false;

      if (token.position === -1) {
        if (moveValue === 6) {
          token.position = 0; 
          moveMade = true;
        }
      } else if (token.position >= 0 && token.position < 99) {
        const newPos = token.position + moveValue;
        if (newPos <= 56) {
          token.position = newPos === 56 ? 99 : newPos;
          moveMade = true;
        }
      }

      if (moveMade) {
          // If this was triggered locally, sound is played in click handler.
          // If triggered remotely, sound is played in handleIncomingAction.
          
          const newTokens = { ...tokens, [playerColor]: playerTokens };
    
          // Kill Logic
          let killed = false;
          if (token.position <= 50 && token.position !== -1 && token.position !== 99) {
             const offset = PATH_OFFSETS[playerColor];
             const globalIndex = (token.position + offset) % 52;
             const coords = GLOBAL_PATH[globalIndex];
             
             const isSafe = SAFE_SPOTS.some(s => s.r === coords.r && s.c === coords.c);
      
             if (!isSafe) {
                 Object.keys(newTokens).forEach((colorKey) => {
                     if (colorKey === playerColor) return;
                     const opponentColor = colorKey as PlayerColor;
                     const opponentTokens = newTokens[opponentColor];
                     const opponentOffset = PATH_OFFSETS[opponentColor];
      
                     opponentTokens.forEach(oppToken => {
                         if (oppToken.position >= 0 && oppToken.position <= 50) {
                             const oppGlobal = (oppToken.position + opponentOffset) % 52;
                             const oppCoords = GLOBAL_PATH[oppGlobal];
                             if (oppCoords.r === coords.r && oppCoords.c === coords.c) {
                                 oppToken.position = -1; // Kill
                                 killed = true;
                                 setMessage(`CUT! ${opponentColor} goes home!`);
                             }
                         }
                     });
                 });
             }
          }
      
          setTokens(newTokens);
          
          if (playerTokens.every(t => t.position === 99)) {
              setWinner(playerColor);
              setMessage(`${playerColor} WINS!`);
              setCanMove(false);
          } else {
              if (moveValue === 6 || killed) {
                   setDiceValue(null);
                   setCanMove(false);
                   setMessage(killed ? "Cut! Roll again!" : "Rolled 6! Roll again.");
              } else {
                  nextTurn();
              }
          }
      }
  };

  const handleTokenClick = (clickedToken: Token) => {
    if (!canMove || !diceValue || winner) return;
    if (clickedToken.color !== turn) return; // Can only move current turn color

    // Broadcast Move BEFORE executing locally to ensure sync? 
    // Or execute locally and broadcast.
    broadcast({ type: 'MOVE_TOKEN', color: turn, tokenId: clickedToken.id });
    
    playTokenSound();
    executeMoveLogic(clickedToken, turn);
  };

  // --- RENDERING HELPERS ---

  const renderPathCells = () => {
      const cells = [];
      for(let r=0; r<15; r++) {
          for(let c=0; c<15; c++) {
              // Exclude Bases (0-5,0-5 etc) and Center (6-8,6-8)
              if ((r<6 && c<6) || (r<6 && c>8) || (r>8 && c<6) || (r>8 && c>8)) continue;
              if (r>=6 && r<=8 && c>=6 && c<=8) continue; 

              let bgClass = "bg-white dark:bg-slate-200";
              let borderClass = "border-[0.5px] border-slate-400 dark:border-slate-500";
              
              if (r===7 && c>0 && c<6) bgClass = "bg-green-400";
              if (c===7 && r>0 && r<6) bgClass = "bg-red-400";
              if (r===7 && c>8 && c<14) bgClass = "bg-blue-400";
              if (c===7 && r>8 && r<14) bgClass = "bg-yellow-400";

              if (r===6 && c===1) bgClass = "bg-green-500";
              if (r===1 && c===8) bgClass = "bg-red-500";
              if (r===8 && c===13) bgClass = "bg-blue-500";
              if (r===13 && c===6) bgClass = "bg-yellow-400";

              const isSafe = SAFE_SPOTS.some(s => s.r === r && s.c === c);

              cells.push(
                  <div key={`${r}-${c}`} 
                       className={`absolute ${bgClass} ${borderClass} flex items-center justify-center`}
                       style={{ 
                           top: `${(r/15)*100}%`, left: `${(c/15)*100}%`, 
                           width: `${100/15}%`, height: `${100/15}%` 
                       }}>
                       {isSafe && !((r===6 && c===1) || (r===1 && c===8) || (r===8 && c===13) || (r===13 && c===6)) && (
                           <Star className="text-slate-400 w-full h-full p-[2px]" fill="currentColor" opacity={0.5} />
                       )}
                       {(r===6 && c===1) && <ChevronRight className="text-white w-full h-full p-0.5" />}
                       {(r===1 && c===8) && <ChevronRight className="text-white w-full h-full p-0.5 rotate-90" />}
                       {(r===8 && c===13) && <ChevronRight className="text-white w-full h-full p-0.5 rotate-180" />}
                       {(r===13 && c===6) && <ChevronRight className="text-white w-full h-full p-0.5 -rotate-90" />}
                  </div>
              );
          }
      }
      return cells;
  };

  const renderTokens = () => {
    const occupiedCells: Record<string, Token[]> = {};
    const getTokenCoords = (t: Token) => {
        if (t.position === -1) return null;
        if (t.position === 99) return { r: 7, c: 7 };
        if (t.position <= 50) {
             const offset = PATH_OFFSETS[t.color];
             return GLOBAL_PATH[(t.position + offset) % 52];
        } else {
            const homeIdx = t.position - 51;
            const path = HOME_PATHS[t.color];
            if (homeIdx < path.length) return path[homeIdx];
            return { r: 7, c: 7 };
        }
    };

    (Object.values(tokens).flat() as Token[]).forEach(t => {
        if (t.position === -1) return;
        const coords = getTokenCoords(t);
        if (!coords) return;
        const key = `${coords.r}-${coords.c}`;
        if (!occupiedCells[key]) occupiedCells[key] = [];
        occupiedCells[key].push(t);
    });

    const rendered: React.ReactNode[] = [];

    // 1. Base Tokens
    [PlayerColor.GREEN, PlayerColor.RED, PlayerColor.BLUE, PlayerColor.YELLOW].forEach(color => {
        const baseTokens = tokens[color].filter(t => t.position === -1);
        let baseTop = 0, baseLeft = 0;
        if (color === PlayerColor.RED) { baseLeft = 9 * (100/15); }
        if (color === PlayerColor.YELLOW) { baseTop = 9 * (100/15); }
        if (color === PlayerColor.BLUE) { baseTop = 9 * (100/15); baseLeft = 9 * (100/15); }

        baseTokens.forEach((t) => {
            const slot = BASE_SLOTS[t.id]; 
            const isMyTurn = t.color === turn;
            const canPlay = isMyTurn && diceValue === 6 && canMove;
            
            rendered.push(
                <div key={`base-${t.color}-${t.id}`}
                     onClick={() => handleTokenClick(t)}
                     className={`absolute transition-all duration-300 z-20 flex items-center justify-center
                        ${canPlay ? 'cursor-pointer animate-bounce-slight scale-110' : ''}
                     `}
                     style={{
                         top: `calc(${baseTop}% + ${parseFloat(slot.top) * 0.4}% - 3%)`, 
                         left: `calc(${baseLeft}% + ${parseFloat(slot.left) * 0.4}% - 3%)`,
                         width: '6%', height: '6%'
                     }}
                >
                    <TokenPiece color={t.color} />
                </div>
            );
        });
    });

    // 2. Path Tokens
    Object.keys(occupiedCells).forEach((key) => {
        const cellTokens = occupiedCells[key];
        const [r, c] = key.split('-').map(Number);
        
        cellTokens.forEach((t, idx) => {
            const count = cellTokens.length;
            const offsetX = count > 1 ? (idx % 2 === 0 ? -1 : 1) * 2 : 0;
            const offsetY = count > 1 ? (idx > 1 ? -1 : 1) * 2 : 0;
            const scale = count > 1 ? 0.8 : 1;
            const isMyTurn = t.color === turn;
            const canPlay = isMyTurn && canMove && diceValue !== null;

            rendered.push(
                 <div key={`path-${t.color}-${t.id}`}
                     onClick={() => handleTokenClick(t)}
                     className={`absolute transition-all duration-300 z-20 flex items-center justify-center
                        ${canPlay ? 'cursor-pointer animate-bounce-slight z-30' : ''}
                     `}
                     style={{
                         top: `${(r/15)*100}%`,
                         left: `${(c/15)*100}%`,
                         width: `${100/15}%`,
                         height: `${100/15}%`,
                         transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
                     }}
                >
                    <TokenPiece color={t.color} />
                </div>
            )
        });
    });

    return rendered;
  };


  return (
    <div className="relative flex flex-col items-center justify-center w-full gap-4 pb-10 select-none px-0 sm:px-4">
      
      {/* PLAYER HUD & INVITE - Top Right */}
      <div className="w-full max-w-[700px] flex justify-end items-center gap-3 mb-2 px-4 sm:px-2 z-40">
           {isConnected && (
               <div className="mr-auto flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold border border-green-500/20">
                   <Radio className="w-3 h-3 animate-pulse" />
                   <span>LIVE</span>
               </div>
           )}
           {turnOrder.map((color) => {
               const isTurn = turn === color;
               return (
                   <div 
                      key={color} 
                      className={`
                        relative transition-all duration-500 ease-out flex items-center justify-center
                        ${isTurn ? 'opacity-100 scale-125 saturate-100 drop-shadow-xl' : 'opacity-40 scale-90 grayscale saturate-0'}
                      `}
                   >
                        <div className={`p-1 rounded-full ${isTurn ? 'bg-white/10 backdrop-blur-sm' : ''}`}>
                             <div className="w-6 h-6 sm:w-8 sm:h-8">
                                <TokenPiece color={color} />
                             </div>
                        </div>
                        {isTurn && (
                            <div className="absolute -bottom-2 w-1 h-1 bg-white rounded-full animate-pulse shadow-glow" />
                        )}
                   </div>
               )
           })}

           {/* Vertical Divider */}
           <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>

           {/* Invite Button */}
           <button 
                onClick={handleInviteClick}
                className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_4px_10px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_15px_rgba(99,102,241,0.5)] active:scale-95 transition-all duration-300 border border-white/20"
                title="Invite Friends"
           >
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Share2 className="w-4 h-4 text-white" />
           </button>
      </div>

      {/* THE 3D BOARD FRAME */}
      <div className="relative w-full max-w-[700px] aspect-square rounded-[30px] bg-slate-800 dark:bg-slate-700 p-2 sm:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_2px_2px_rgba(255,255,255,0.1)]">
          
          {/* THE PLAYING SURFACE (Recessed) */}
          <div className="relative w-full h-full bg-white rounded-[22px] sm:rounded-[18px] overflow-hidden shadow-[inset_0_0_15px_rgba(0,0,0,0.2)]">
            <BaseArea color="green" position="top-left" />
            <BaseArea color="red" position="top-right" />
            <BaseArea color="yellow" position="bottom-left" />
            <BaseArea color="blue" position="bottom-right" />

            {renderPathCells()}

            {/* Center */}
            <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-white dark:bg-slate-200 grid grid-cols-2 grid-rows-2 overflow-hidden">
                <div className="bg-green-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}></div>
                <div className="bg-red-500" style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}></div>
                <div className="absolute inset-0 border-t-[45px] sm:border-t-[60px] md:border-t-[90px] border-l-[45px] sm:border-l-[60px] md:border-l-[90px] border-r-[45px] sm:border-r-[60px] md:border-r-[90px] border-b-[45px] sm:border-b-[60px] md:border-b-[90px] border-t-red-500 border-r-blue-500 border-b-yellow-400 border-l-green-500 h-full w-full box-border"></div>
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <Trophy className="text-white drop-shadow-md w-1/3 h-1/3" />
                </div>
            </div>

            {renderTokens()}
            
            {/* DRAGGABLE 3D DICE LAYER */}
            <div className="absolute inset-0 z-50 overflow-hidden pointer-events-none">
                <ThreeDDice 
                    onLand={onDiceLanded} 
                    canRoll={!rolling && !canMove && !winner} 
                    diceValue={diceValue}
                />
            </div>
          </div>
      </div>

      {/* INVITE MODAL */}
      {showInvite && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
             <div className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border border-white/10 overflow-hidden">
                 {/* Close Button */}
                 <button 
                    onClick={() => setShowInvite(false)}
                    className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                 >
                     <X size={20} />
                 </button>

                 <div className="flex flex-col items-center text-center mb-6">
                     <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
                         {isPeerInit && !roomCode ? (
                             <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
                         ) : (
                             <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                         )}
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Invite Friends</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400">
                         {isConnected ? "You are connected! Play together." : "Share this link to play on another device."}
                     </p>
                 </div>

                 {/* Room Code */}
                 <div className="mb-4">
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Room Code</label>
                     <div className="text-2xl font-mono font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-900 py-3 rounded-lg border border-slate-200 dark:border-slate-700 tracking-widest">
                         {roomCode || "Generating..."}
                     </div>
                 </div>

                 {/* Link Input */}
                 <div className="relative mb-6">
                     <input 
                        readOnly
                        value={inviteUrl}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                     />
                     <button 
                        onClick={handleCopyLink}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                     >
                         {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-indigo-500" />}
                     </button>
                 </div>

                 <button 
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: 'Play Ludo on PlayG',
                                text: `Join my Ludo game! Room: ${roomCode}`,
                                url: inviteUrl
                            }).catch(console.error);
                        } else {
                            handleCopyLink();
                        }
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                     <Share2 size={18} />
                     <span>Share Link</span>
                 </button>
                 
                 {!isConnected && (
                     <div className="mt-4 text-[10px] text-center text-slate-400">
                         Wait for "LIVE" badge to appear on top right after friend joins.
                     </div>
                 )}
             </div>
        </div>
      )}
      
      {/* Winner Overlay */}
      {winner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full animate-bounce-slight border-4 border-yellow-400">
                  <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">{winner} WINS!</h2>
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
                  >
                      Play Again
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

// --- 3D DICE COMPONENT ---

const ThreeDDice: React.FC<{ 
    onLand: (val: number) => void; 
    canRoll: boolean;
    diceValue: number | null;
}> = ({ onLand, canRoll, diceValue }) => {
    const diceRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStart = useRef({ x: 0, y: 0, time: 0 });
    const [isRolling, setIsRolling] = useState(false);

    // Initial positioning in center
    useEffect(() => {
        setPosition({ x: 0, y: 0 });
    }, [canRoll]);

    // Initialize Audio
    useEffect(() => {
        audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3");
        audioRef.current.volume = 0.8; 
        audioRef.current.preload = "auto"; 
    }, []);

    const playDiceSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Audio playback failed:", error);
                });
            }
        }
    }

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!canRoll || isRolling) return;
        setIsDragging(true);
        dragStart.current = { 
            x: e.clientX, 
            y: e.clientY,
            time: Date.now() 
        };
        (e.target as Element).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        
        setPosition({ x: dx, y: dy });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        (e.target as Element).releasePointerCapture(e.pointerId);

        const endTime = Date.now();
        const dt = endTime - dragStart.current.time;
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;

        const vx = dx / (dt || 1);
        const vy = dy / (dt || 1);
        
        const speed = Math.sqrt(vx*vx + vy*vy);
        
        if (speed > 0.3 || dt < 200) {
            throwDice(vx * 30, vy * 30); 
        } else {
            setPosition({ x: 0, y: 0 });
        }
    };

    const throwDice = (vx: number, vy: number) => {
        setIsRolling(true);
        playDiceSound();

        const result = Math.floor(Math.random() * 6) + 1;
        
        if (diceRef.current) {
            const angle = Math.atan2(vy, vx);
            const dist = Math.min(Math.sqrt(vx*vx + vy*vy) * 10, 300); 
            
            const finalX = Math.cos(angle) * Math.max(dist, 100);
            const finalY = Math.sin(angle) * Math.max(dist, 100);

            // 1: x0 y0, 6: x180 y0, 2: y90, 5: y-90, 3: x-90, 4: x90
            let rotX = 360 * (Math.floor(Math.random() * 3) + 2); 
            let rotY = 360 * (Math.floor(Math.random() * 3) + 2);
            
            switch(result) {
                case 1: rotX += 0; rotY += 0; break;
                case 6: rotX += 180; rotY += 0; break;
                case 2: rotX += 0; rotY += 90; break; 
                case 5: rotX += 0; rotY += -90; break; 
                case 3: rotX += -90; rotY += 0; break;
                case 4: rotX += 90; rotY += 0; break;
            }
            
            diceRef.current.style.transition = 'transform 1s cubic-bezier(0.25, 1, 0.5, 1)';
            diceRef.current.style.transform = `translate(${finalX}px, ${finalY}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(0deg)`;
            
            setTimeout(() => {
                onLand(result);
                setIsRolling(false);
            }, 1000);
        }
    };

    useEffect(() => {
        if (canRoll && diceRef.current) {
             diceRef.current.style.transition = 'transform 0.5s ease-out';
             diceRef.current.style.transform = `translate(0px, 0px) rotateX(25deg) rotateY(45deg)`;
        }
    }, [canRoll]);

    return (
        <div className="w-full h-full flex items-center justify-center perspective-container pointer-events-none">
            <div 
                ref={diceRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`dice-cube cursor-grab active:cursor-grabbing ${!canRoll ? 'opacity-50 grayscale' : ''}`}
                style={{
                    transform: isDragging 
                        ? `translate(${position.x}px, ${position.y}px) rotateX(25deg) rotateY(45deg) scale(1.1)` 
                        : diceRef.current?.style.transform || `rotateX(25deg) rotateY(45deg)`,
                    pointerEvents: canRoll ? 'auto' : 'none'
                }}
            >
                <div className="face front"> <DotPattern val={1} /> </div>
                <div className="face back"> <DotPattern val={6} /> </div>
                <div className="face right"> <DotPattern val={5} /> </div>
                <div className="face left"> <DotPattern val={2} /> </div>
                <div className="face top"> <DotPattern val={3} /> </div>
                <div className="face bottom"> <DotPattern val={4} /> </div>
            </div>
            
            {canRoll && !isDragging && !isRolling && (
                <div className="absolute top-2/3 animate-bounce text-xs font-bold text-white bg-black/50 px-2 py-1 rounded-full pointer-events-none shadow-lg backdrop-blur-sm">
                    Drag & Throw!
                </div>
            )}

            <style>{`
                .perspective-container {
                    perspective: 800px;
                }
                .dice-cube {
                    width: 60px;
                    height: 60px;
                    position: relative;
                    transform-style: preserve-3d;
                    background-color: #374151; /* Core color to hide gaps */
                }
                @media (min-width: 640px) {
                    .dice-cube { width: 80px; height: 80px; }
                }
                .face {
                    position: absolute;
                    width: 101%; /* Slight overlap to hide joints */
                    height: 101%;
                    left: -0.5%;
                    top: -0.5%;
                    
                    /* Metallic Shiny Polish */
                    background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 40%),
                                linear-gradient(135deg, #6b7280 0%, #374151 60%, #1f2937 100%);
                    
                    border: 0.5px solid rgba(255,255,255,0.2);
                    border-bottom: 0.5px solid rgba(0,0,0,0.5);
                    border-radius: 12px;
                    
                    /* Gloss Inset */
                    box-shadow: inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -2px 10px rgba(0,0,0,0.4);
                    
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backface-visibility: hidden; 
                }
                .front  { transform: translateZ(30px); }
                .back   { transform: rotateY(180deg) translateZ(30px); }
                .right  { transform: rotateY(90deg) translateZ(30px); }
                .left   { transform: rotateY(-90deg) translateZ(30px); }
                .top    { transform: rotateX(90deg) translateZ(30px); }
                .bottom { transform: rotateX(-90deg) translateZ(30px); }

                @media (min-width: 640px) {
                    .front  { transform: translateZ(40px); }
                    .back   { transform: rotateY(180deg) translateZ(40px); }
                    .right  { transform: rotateY(90deg) translateZ(40px); }
                    .left   { transform: rotateY(-90deg) translateZ(40px); }
                    .top    { transform: rotateX(90deg) translateZ(40px); }
                    .bottom { transform: rotateX(-90deg) translateZ(40px); }
                }
            `}</style>
        </div>
    );
}

const DotPattern: React.FC<{val: number}> = ({val}) => {
    return (
        <div className="w-full h-full p-2 grid grid-cols-3 grid-rows-3 gap-1">
            {val === 1 && <div className="col-start-2 row-start-2 bg-white rounded-full shadow-sm" />}
            
            {val === 2 && <>
                <div className="col-start-1 row-start-1 bg-white rounded-full shadow-sm" />
                <div className="col-start-3 row-start-3 bg-white rounded-full shadow-sm" />
            </>}
            
            {val === 3 && <>
                <div className="col-start-1 row-start-1 bg-white rounded-full shadow-sm" />
                <div className="col-start-2 row-start-2 bg-white rounded-full shadow-sm" />
                <div className="col-start-3 row-start-3 bg-white rounded-full shadow-sm" />
            </>}

            {val === 4 && <>
                <div className="col-start-1 row-start-1 bg-white rounded-full shadow-sm" />
                <div className="col-start-3 row-start-1 bg-white rounded-full shadow-sm" />
                <div className="col-start-1 row-start-3 bg-white rounded-full shadow-sm" />
                <div className="col-start-3 row-start-3 bg-white rounded-full shadow-sm" />
            </>}

            {val === 5 && <>
                <div className="col-start-1 row-start-1 bg-white rounded-full shadow-sm" />
                <div className="col-start-3 row-start-1 bg-white rounded-full shadow-sm" />
                <div className="col-start-2 row-start-2 bg-white rounded-full shadow-sm" />
                <div className="col-start-1 row-start-3 bg-white rounded-full shadow-sm" />
                <div className="col-start-3 row-start-3 bg-white rounded-full shadow-sm" />
            </>}

            {val === 6 && <>
                <div className="col-start-1 row-start-1 bg-white rounded-full shadow-sm" />
                <div className="col-start-3 row-start-1 bg-white rounded-full shadow-sm" />
                <div className="col-start-1 row-start-2 bg-white rounded-full shadow-sm" />
                <div className="col-start-3 row-start-2 bg-white rounded-full shadow-sm" />
                <div className="col-start-1 row-start-3 bg-white rounded-full shadow-sm" />
                <div className="col-start-3 row-start-3 bg-white rounded-full shadow-sm" />
            </>}
        </div>
    )
}

// --- SUBCOMPONENTS ---

const BaseArea: React.FC<{color: string, position: string}> = ({color, position}) => {
    const bg = color === 'green' ? 'bg-green-500' : color === 'red' ? 'bg-red-500' : color === 'blue' ? 'bg-blue-500' : 'bg-yellow-400';
    
    const style: React.CSSProperties = {
        position: 'absolute',
        width: '40%', 
        height: '40%',
        top: position.includes('top') ? 0 : 'auto',
        bottom: position.includes('bottom') ? 0 : 'auto',
        left: position.includes('left') ? 0 : 'auto',
        right: position.includes('right') ? 0 : 'auto',
    };

    return (
        <div style={style} className={`${bg} p-[10%] flex items-center justify-center`}>
            <div className="w-full h-full bg-white rounded-2xl flex flex-wrap content-center justify-center shadow-inner overflow-hidden">
                 <div className="w-full h-full relative">
                     <div className={`absolute top-[10%] left-[10%] w-[30%] h-[30%] rounded-full ${bg} opacity-30 shadow-inner`}></div>
                     <div className={`absolute top-[10%] right-[10%] w-[30%] h-[30%] rounded-full ${bg} opacity-30 shadow-inner`}></div>
                     <div className={`absolute bottom-[10%] left-[10%] w-[30%] h-[30%] rounded-full ${bg} opacity-30 shadow-inner`}></div>
                     <div className={`absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full ${bg} opacity-30 shadow-inner`}></div>
                 </div>
            </div>
        </div>
    )
}

const TokenPiece: React.FC<{color: PlayerColor}> = ({color}) => {
    let bg = '';
    let ring = '';
    switch(color) {
        case PlayerColor.GREEN: bg = 'bg-green-600'; ring = 'ring-green-300'; break;
        case PlayerColor.RED: bg = 'bg-red-600'; ring = 'ring-red-300'; break;
        case PlayerColor.BLUE: bg = 'bg-blue-600'; ring = 'ring-blue-300'; break;
        case PlayerColor.YELLOW: bg = 'bg-yellow-500'; ring = 'ring-yellow-200'; break;
    }

    return (
        <div className="relative w-full h-full transition-transform shrink-0">
             <div className={`w-full h-full rounded-full ${bg} shadow-[0_3px_3px_rgba(0,0,0,0.4)] ring-2 ${ring} ring-offset-1 flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute top-1 left-2 w-2 h-2 bg-white rounded-full opacity-60 blur-[1px]"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-black/20 pointer-events-none"></div>
             </div>
             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[80%] h-1.5 bg-black/30 blur-sm rounded-full -z-10"></div>
        </div>
    )
}