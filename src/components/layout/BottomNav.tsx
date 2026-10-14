import React from 'react';
import { Layers, Flame, BarChart3 } from 'lucide-react';

export type MainTab = 'decks' | 'today' | 'stats';

interface BottomNavProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  dueTodayCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  dueTodayCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-4 sm:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Colecciones */}
        <button
          onClick={() => onSelectTab('decks')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'decks'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className={`w-5 h-5 ${currentTab === 'decks' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px]">Colecciones</span>
        </button>

        {/* Repaso Diario */}
        <button
          onClick={() => onSelectTab('today')}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'today'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Flame className={`w-5 h-5 ${currentTab === 'today' ? 'stroke-[2.5] text-amber-500' : 'stroke-2 text-slate-500'}`} />
            {dueTodayCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {dueTodayCount > 99 ? '99+' : dueTodayCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Repaso Hoy</span>
        </button>

        {/* Progreso */}
        <button
          onClick={() => onSelectTab('stats')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'stats'
              ? 'text-indigo-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${currentTab === 'stats' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px]">Progreso</span>
        </button>
      </div>
    </nav>
  );
};
