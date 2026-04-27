import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LudoBoard } from './components/LudoBoard';
import { GamePlaceholder } from './components/GamePlaceholder';
import { GameType } from './types';
import { Moon, Sun, Gamepad2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType>(GameType.LUDO);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Initialize theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const renderGame = () => {
    switch (activeGame) {
      case GameType.LUDO:
        return <LudoBoard />;
      default:
        return <GamePlaceholder gameName={activeGame} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F2F7] dark:bg-[#000000] transition-colors duration-500 font-sans overflow-hidden selection:bg-brand-500/30">
      {/* 
        Apple-Style Liquid Glass Header 
        - High blur, medium opacity for "frosted material" look
        - Content bleeds through
      */}
      {/* Vertical Right-Side Header */}
      <header className="fixed top-1/2 -translate-y-1/2 right-2 sm:right-4 z-50 flex flex-col items-center gap-3
                         bg-white/60 dark:bg-[#121212]/60 backdrop-blur-3xl backdrop-saturate-150
                         shadow-2xl rounded-full py-3 px-1.5 sm:px-2 border border-white/15 dark:border-white/5">
        
        {/* Logo */}
        <div className="flex items-center justify-center shrink-0 opacity-90 hover:opacity-100 transition-opacity">
          <div className="bg-gradient-to-br from-yellow-400 to-amber-600 p-1.5 rounded-xl shadow-lg shadow-amber-500/20 ring-1 ring-white/20">
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
        </div>

        <div className="w-6 h-px bg-slate-300 dark:bg-slate-600"></div>

        {/* Vertical Game Tabs */}
        <Navbar activeGame={activeGame} onSelectGame={setActiveGame} />

        <div className="w-6 h-px bg-slate-300 dark:bg-slate-600"></div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="group relative p-2 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Toggle Theme"
        >
          <div className="absolute inset-0 bg-black/5 dark:bg-white/10 backdrop-blur-md transition-colors rounded-full"></div>
          <div className="relative z-10 text-slate-600 dark:text-yellow-400 transition-transform duration-500 rotate-0 dark:rotate-180">
              {darkMode ? <Sun size={18} fill="currentColor" className="opacity-90" /> : <Moon size={18} fill="currentColor" className="opacity-80" />}
          </div>
        </button>
      </header>

      {/* Main Game Area - No top padding since header is on the side */}
      <main className="flex-1 overflow-y-auto pt-2 pb-0 px-0 sm:px-4 md:px-6 flex items-start justify-center">
        <div className="w-full max-w-5xl animate-fade-in relative z-0">
           {renderGame()}
        </div>
      </main>
    </div>
  );
};

export default App;