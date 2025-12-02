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
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between gap-4 
                         bg-white/50 dark:bg-[#121212]/50 backdrop-blur-3xl backdrop-saturate-150
                         shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b-0">
        
        {/* Logo */}
        <div className="hidden md:flex items-center gap-2 shrink-0 w-32 opacity-90 hover:opacity-100 transition-opacity">
          <div className="bg-gradient-to-br from-yellow-400 to-amber-600 p-1.5 rounded-xl shadow-lg shadow-amber-500/20 ring-1 ring-white/20">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">G</span>play
          </h1>
        </div>

        {/* Mobile Logo (Icon Only) */}
        <div className="md:hidden flex items-center shrink-0">
           <div className="bg-gradient-to-br from-yellow-400 to-amber-600 p-1.5 rounded-xl shadow-lg shadow-amber-500/20 ring-1 ring-white/20">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Scrollable Navigation Tabs - Centered */}
        <div className="flex-1 overflow-hidden flex justify-center">
           <Navbar activeGame={activeGame} onSelectGame={setActiveGame} />
        </div>

        {/* Theme Toggle */}
        <div className="shrink-0 w-10 flex justify-end">
          <button
            onClick={toggleTheme}
            className="group relative p-2.5 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="Toggle Theme"
          >
            <div className="absolute inset-0 bg-black/5 dark:bg-white/10 backdrop-blur-md transition-colors rounded-full"></div>
            <div className="relative z-10 text-slate-600 dark:text-yellow-400 transition-transform duration-500 rotate-0 dark:rotate-180">
                {darkMode ? <Sun size={20} fill="currentColor" className="opacity-90" /> : <Moon size={20} fill="currentColor" className="opacity-80" />}
            </div>
          </button>
        </div>
      </header>

      {/* Main Game Area - Added top padding to account for fixed header */}
      <main className="flex-1 overflow-y-auto pt-28 pb-6 px-0 sm:px-4 md:px-6 flex items-start justify-center">
        <div className="w-full max-w-5xl animate-fade-in relative z-0">
          {renderGame()}
        </div>
      </main>
    </div>
  );
};

export default App;