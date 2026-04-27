import React, { useRef, useState, useEffect } from 'react';
import { GameType } from '../types';
import { Dices, Hash, Crown, Zap, Trophy, Activity, Disc } from 'lucide-react';

interface NavbarProps {
  activeGame: GameType;
  onSelectGame: (game: GameType) => void;
}

const GAME_ICONS: Record<GameType, React.ReactNode> = {
  [GameType.LUDO]: <Dices size={16} />,
  [GameType.TIC_TAC_TOE]: <Hash size={16} />,
  [GameType.CHESS]: <Crown size={16} />,
  [GameType.SNAKE]: <Zap size={16} />,
    [GameType.CRICKET]: <Trophy size={16} />,
  [GameType.TABLE_TENNIS]: <Activity size={16} />,
  [GameType.BADMINTON]: <Disc size={16} />,
};

export const Navbar: React.FC<NavbarProps> = ({ activeGame, onSelectGame }) => {
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0
  });
  
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeIndex = Object.values(GameType).indexOf(activeGame);
    const currentTab = tabsRef.current[activeIndex];
    const container = containerRef.current;

    if (currentTab && container) {
      // Calculate position relative to the container
      const newLeft = currentTab.offsetLeft;
      const newWidth = currentTab.offsetWidth;

      setIndicatorStyle({
        left: newLeft,
        width: newWidth,
        opacity: 1
      });
      
      // Auto-scroll logic for mobile
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;
      
      if (newLeft < scrollLeft) {
          container.scrollTo({ left: newLeft - 20, behavior: 'smooth' });
      } else if (newLeft + newWidth > scrollLeft + containerWidth) {
          container.scrollTo({ left: newLeft + newWidth - containerWidth + 20, behavior: 'smooth' });
      }
    }
  }, [activeGame]);

  return (
    <nav 
      ref={containerRef}
      className="flex flex-col items-center gap-1.5"
    >
        {Object.values(GameType).map((game, index) => {
          const isActive = activeGame === game;
          return (
            <button
              key={game}
              ref={(el) => { tabsRef.current[index] = el }}
              onClick={() => onSelectGame(game)}
              className={`
                group relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-300 select-none
                ${isActive 
                  ? 'bg-white dark:bg-white/90 shadow-md shadow-black/10 scale-110' 
                  : 'hover:bg-black/5 dark:hover:bg-white/10 scale-100'
                }
              `}
              title={game}
            >
              <div className={`transition-all duration-300 ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-500 dark:text-slate-400 opacity-70 group-hover:opacity-100'}`}>
                 {GAME_ICONS[game]}
              </div>
              {/* Tooltip */}
              <div className="absolute right-full mr-3 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                {game}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-900 rotate-45"></div>
              </div>
            </button>
          );
        })}
    </nav>
  );
};
