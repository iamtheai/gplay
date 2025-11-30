import React, { useRef, useState, useEffect } from 'react';
import { GameType } from '../types';
import { Dices, Hash, Crown, Worm, Trophy, Activity, Disc } from 'lucide-react';

interface NavbarProps {
  activeGame: GameType;
  onSelectGame: (game: GameType) => void;
}

const GAME_ICONS: Record<GameType, React.ReactNode> = {
  [GameType.LUDO]: <Dices size={16} />,
  [GameType.TIC_TAC_TOE]: <Hash size={16} />,
  [GameType.CHESS]: <Crown size={16} />,
  [GameType.SNAKE]: <Worm size={16} />,
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
      className="w-full max-w-full overflow-x-auto hide-scrollbar px-1 py-1"
    >
      {/* 
        Liquid Track (The Trough)
        - Recessed look using inset shadows
        - Darker background to make the "white liquid" pop
      */}
      <div className="relative flex items-center w-fit mx-auto p-1.5 rounded-full bg-slate-200/80 dark:bg-black/40 backdrop-blur-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_1px_2px_rgba(255,255,255,0.1)] border border-white/10 dark:border-white/5">
        
        {/* 
          Hyper-Realistic Liquid Glass Highlight (The Gel)
          - Convex shape simulation via gradients and inset highlights
        */}
        <div 
          className="absolute top-1.5 bottom-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            opacity: indicatorStyle.opacity,
            // Volume Gradient: Opaque white top to slightly creamy bottom
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F0F2F5 100%)',
            // 3D Lighting Effects:
            boxShadow: `
              0 2px 4px rgba(0,0,0,0.08),       /* Drop Shadow for float */
              0 4px 12px rgba(0,0,0,0.05),      /* Soft ambient shadow */
              inset 0 1px 0 rgba(255,255,255,1), /* Top Rim Light (Sharp) */
              inset 0 -2px 2px rgba(0,0,0,0.02)  /* Bottom Recess (Soft) */
            `,
          }}
        />

        {Object.values(GameType).map((game, index) => {
          const isActive = activeGame === game;
          return (
            <button
              key={game}
              ref={(el) => { tabsRef.current[index] = el }}
              onClick={() => onSelectGame(game)}
              className={`
                relative z-10 flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[11px] sm:text-xs uppercase tracking-wide transition-all duration-300 whitespace-nowrap select-none
                ${isActive 
                  ? 'text-slate-900 drop-shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }
              `}
            >
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-indigo-600' : 'scale-100 opacity-70'}`}>
                 {GAME_ICONS[game]}
              </div>
              <span className={`hidden sm:inline-block transition-opacity ${isActive ? 'font-black' : 'font-semibold'}`}>
                {game}
              </span>
              <span className={`sm:hidden inline-block transition-opacity ${isActive ? 'font-black' : 'font-semibold'}`}>
                {game.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
