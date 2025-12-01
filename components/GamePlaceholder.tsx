import React from 'react';
import { Hammer, Construction } from 'lucide-react';

interface GamePlaceholderProps {
  gameName: string;
}

export const GamePlaceholder: React.FC<GamePlaceholderProps> = ({ gameName }) => {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center animate-fade-in border-4 border-slate-200 dark:border-slate-700">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 rounded-full"></div>
        <Construction className="w-24 h-24 text-brand-500 relative z-10 animate-bounce-slight" />
      </div>
      <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 uppercase">
        {gameName}
      </h2>
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-900 py-2 px-4 rounded-full">
        <Hammer size={16} />
        <span>Under Construction</span>
      </div>
      <p className="mt-6 max-w-md text-slate-600 dark:text-slate-400 leading-relaxed">
        We are currently building the ultimate 3D experience for {gameName}. 
        Check back soon for smooth animations and multiplayer action!
      </p>
      <button className="mt-8 bg-slate-800 dark:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold shadow-[0_4px_0_rgb(0,0,0,0.3)] active:shadow-none active:translate-y-[4px] transition-all">
        Notify Me When Ready
      </button>
    </div>
  );
};