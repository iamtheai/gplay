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
      
      {/* Ultra-Slim Top Dock */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-1.5 px-2
                         bg-black/30 dark:bg-black/50 backdrop-blur-2xl">
        <div className="flex items-center gap-1">
          {/* Logo */}
          <div className="bg-gradient-to-br from-yellow-400 to-amber-600 p-1 rounded-lg shadow-md shadow-amber-500/20 ring-1 ring-white/20 mr-1">
            <Gamepad2 className="w-3.5 h-3.5 text-white" />
          </div>

          <div className="w-px h-5 bg-white/15 mx-1"></div>

          {/* Game Tabs */}
          <Navbar activeGame={activeGame} onSelectGame={setActiveGame} />

          <div className="w-px h-5 bg-white/15 mx-1"></div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative p-1.5 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-white/10"
            aria-label="Toggle Theme"
          >
            <div className="text-slate-300 dark:text-yellow-400">
                {darkMode ? <Sun size={14} fill="currentColor" className="opacity-90" /> : <Moon size={14} fill="currentColor" className="opacity-80" />}
            </div>
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 overflow-y-auto pt-10 pb-0 px-0 sm:px-4 md:px-6 flex items-start justify-center">
        <div className="w-full max-w-5xl animate-fade-in relative z-0">
           {renderGame()}
        </div>
      </main>
    </div>
  );
};

export default App;