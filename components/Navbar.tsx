import React, { useRef } from 'react';
import { GameType } from '../types';
import { Dices, Hash, Crown, Zap, Trophy, Activity, Disc } from 'lucide-react';

interface NavbarProps {
  activeGame: GameType;
  onSelectGame: (game: GameType) => void;
}

const GAME_ICONS: Record<GameType, React.ReactNode> = {
  [GameType.LUDO]: <Dices size={14} />,
  [GameType.TIC_TAC_TOE]: <Hash size={14} />,
  [GameType.CHESS]: <Crown size={14} />,
  [GameType.SNAKE]: <Zap size={14} />,
  [GameType.CRICKET]: <Trophy size={14} />,
  [GameType.TABLE_TENNIS]: <Activity size={14} />,
  [GameType.BADMINTON]: <Disc size={14} />,
};

export const Navbar: React.FC<NavbarProps> = ({ activeGame, onSelectGame }) => {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <nav className="flex items-center gap-0.5">
      {Object.values(GameType).map((game, index) => {
        const isActive = activeGame === game;
        return (
          <button
            key={game}
            ref={(el) => { tabsRef.current[index] = el }}
            onClick={() => onSelectGame(game)}
            className={`
              group relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg transition-all duration-200 select-none
              ${isActive 
                ? 'bg-white/20 text-white scale-110' 
                : 'text-slate-400 hover:text-white hover:bg-white/10'
              }
            `}
            title={game}
          >
            <div className={`transition-all duration-200 ${isActive ? 'text-yellow-400 scale-110' : 'opacity-60 group-hover:opacity-100'}`}>
               {GAME_ICONS[game]}
            </div>
            {/* Tooltip below */}
            <div className="absolute top-full mt-2 px-2 py-0.5 rounded bg-slate-900 text-white text-[9px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50">
              {game}
            </div>
          </button>
        );
      })}
    </nav>
  );
};
